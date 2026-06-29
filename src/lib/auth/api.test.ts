import { describe, it, expect, vi, afterEach } from 'vitest'

import { api } from './api'

afterEach(() => {
  delete (globalThis as any).fetch
})

describe('auth api helper', () => {
  it('成功返回 payload 并附带默认头', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('Content-Type')).toBe('application/json')
      expect(init?.credentials).toBe('include')
      return {
        ok: true,
        text: async () => JSON.stringify({ success: true, data: { value: 1 } }),
      } as Response
    })
    ;(globalThis as any).fetch = fetchMock as unknown as typeof fetch

    const res = await api.post<{ value: number }>('/test', { foo: 'bar' })

    expect(res).toEqual({ value: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('解析失败或业务失败时抛出统一错误', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      text: async () => 'bad json',
    }))
    ;(globalThis as any).fetch = fetchMock as unknown as typeof fetch

    await expect(api.get('/fail')).rejects.toMatchObject({ code: 'UNKNOWN_ERROR' })
  })

  it('成功但缺少 data 时抛出协议错误', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ success: true, data: null }),
    }))
    ;(globalThis as any).fetch = fetchMock as unknown as typeof fetch

    await expect(api.get('/nodata')).rejects.toMatchObject({ code: 'UNKNOWN_ERROR' })
  })

  it('网络异常时映射为 NETWORK_ERROR', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('offline')
    })
    ;(globalThis as any).fetch = fetchMock as unknown as typeof fetch

    await expect(api.del('/network')).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it('请求被取消时映射为 NETWORK_TIMEOUT', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(init.signal?.reason ?? new DOMException('Aborted', 'AbortError'))
      })
    }))
    ;(globalThis as any).fetch = fetchMock as unknown as typeof fetch
    const controller = new AbortController()
    const pending = api.get('/timeout', { signal: controller.signal })
    const assertion = expect(pending).rejects.toMatchObject({ code: 'NETWORK_TIMEOUT' })

    controller.abort(new DOMException('Aborted', 'AbortError'))

    await assertion
  })

  it('保留自定义 Content-Type 并映射业务错误', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      text: async () => JSON.stringify({ success: false, code: 'TOKEN_EXPIRED', message: 'expired' }),
    }))
    ;(globalThis as any).fetch = fetchMock as unknown as typeof fetch

    await expect(
      api.post(
        '/custom',
        { a: 1 },
        {
          headers: { 'Content-Type': 'application/custom' },
        }
      )
    ).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' })

    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('Content-Type')).toBe('application/custom')
  })

  it('fetch 抛出 ApiError 时透传', async () => {
    const fetchMock = vi.fn(async () => {
      throw { code: 'AUTH_INVALID_CREDENTIALS', message: 'bad' }
    })
    ;(globalThis as any).fetch = fetchMock as unknown as typeof fetch

    await expect(api.get('/throw')).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS', message: 'bad' })
  })

  it('支持绝对路径调用', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toBe('http://example.com/abs')
      return {
        ok: true,
        text: async () => JSON.stringify({ success: true, data: { ok: true } }),
      } as Response
    })
    ;(globalThis as any).fetch = fetchMock as unknown as typeof fetch

    const res = await api.get('http://example.com/abs')
    expect(res).toEqual({ ok: true })
  })

  it('HTTP 200 但 success=false 时抛出业务错误', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ success: false, code: 'AUTH_INACTIVE', message: 'inactive' }),
    }))
    ;(globalThis as any).fetch = fetchMock as unknown as typeof fetch

    await expect(api.get('/inactive')).rejects.toMatchObject({ code: 'AUTH_INACTIVE' })
  })

  it('post 在 body 为空时不写入 Content-Type', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.has('Content-Type')).toBe(false)
      return {
        ok: true,
        text: async () => JSON.stringify({ success: true, data: { ok: true } }),
      } as Response
    })
    ;(globalThis as any).fetch = fetchMock as unknown as typeof fetch

    await api.post('/empty-body')
  })

  it('数字错误码转换为字符串', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      text: async () => JSON.stringify({ success: false, code: 403 }),
    }))
    ;(globalThis as any).fetch = fetchMock as unknown as typeof fetch

    await expect(api.get('/numeric-error')).rejects.toMatchObject({ code: '403' })
  })

  it('HTTP 200 但返回不可解析 JSON 时抛出协议错误', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => 'not-json',
    }))
    ;(globalThis as any).fetch = fetchMock as unknown as typeof fetch

    await expect(api.get('/bad-format')).rejects.toMatchObject({ code: 'UNKNOWN_ERROR' })
  })
})
