import { describe, it, expect, vi, beforeEach } from 'vitest'

import HttpClient from './http-client'

describe('HttpClient', () => {
  beforeEach(() => {
    delete (globalThis as any).fetch
  })

  it('合并默认头并解析相对路径', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe('https://api.test/data')
      const headers = new Headers(init?.headers)
      expect(headers.get('X-Base')).toBe('1')
      expect(headers.get('X-Extra')).toBe('2')
      return { status: 200 } as Response
    })

    const client = new HttpClient({
      baseUrl: 'https://api.test/',
      fetch: fetchMock as unknown as typeof fetch,
      defaultHeaders: { 'X-Base': '1' },
    })

    const res = await client.request('/data', { headers: { 'X-Extra': '2' } })
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('超时会通过 AbortSignal 终止请求', async () => {
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(init.signal?.reason ?? new DOMException('Aborted', 'AbortError'))
          })
        })
    )

    const client = new HttpClient({
      baseUrl: 'https://api.test',
      fetch: fetchMock as unknown as typeof fetch,
      timeoutMs: 10,
    })

    await expect(client.request('/slow')).rejects.toBeInstanceOf(DOMException)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('auth 模式下 401 会触发刷新并重放请求', async () => {
    let token: string | null = 'old'
    const refresh = vi.fn(async () => ({ accessToken: 'new' }))
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      if (auth === 'Bearer new') return { status: 200 } as Response
      return { status: 401 } as Response
    })

    const client = new HttpClient({
      baseUrl: 'https://api.test',
      fetch: fetchMock as unknown as typeof fetch,
      auth: {
        getAccessToken: () => token,
        setAccessToken: (t) => {
          token = t
        },
        refresh,
      },
    })

    const res = await client.request('/protected')
    expect(res.status).toBe(200)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(token).toBe('new')
  })
})
