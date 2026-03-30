import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import authFetch from './interceptor'
import TokenStorage from './token-storage'
import { AuthService } from './service'
import { __resetRefreshInFlightForTests } from '@/infrastructure/http/auth-fetch'

type Mock = ReturnType<typeof vi.fn>

vi.mock('./service', () => ({
  AuthService: {
    refresh: vi.fn(),
  },
}))

const refreshMock = AuthService.refresh as unknown as Mock

function setFetch(fn: typeof fetch) {
  ;(globalThis as any).fetch = fn
}

describe('authFetch', () => {
  beforeEach(() => {
    TokenStorage.clear({ silent: true })
    refreshMock.mockReset()
    __resetRefreshInFlightForTests()
  })

  afterEach(() => {
    delete (globalThis as any).window
    delete (globalThis as any).fetch
  })

  it('附加 Authorization 头自 TokenStorage', async () => {
    TokenStorage.set('abc', { silent: true })
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      expect(auth).toBe('Bearer abc')
      return { status: 200 } as Response
    })
    setFetch(fetchMock as unknown as typeof fetch)

    const res = await authFetch('https://example.com/api', { method: 'GET' })
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('401 时触发刷新并重放请求', async () => {
    TokenStorage.set('old', { silent: true })
    refreshMock.mockResolvedValue({
      accessToken: 'new',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 1, name: 'n' },
    })

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      if (auth === 'Bearer new') return { status: 200 } as Response
      return { status: 401 } as Response
    })
    setFetch(fetchMock as unknown as typeof fetch)

    const res = await authFetch('https://example.com/protected', { method: 'GET' })

    expect(refreshMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(TokenStorage.get()).toBe('new')
    expect(res.status).toBe(200)
  })

  it('刷新失败时清理状态并跳转登录', async () => {
    TokenStorage.set('old', { silent: true })
    const assign = vi.fn()
    ;(globalThis as any).window = { location: { assign }, document: {} }
    refreshMock.mockRejectedValue(new Error('fail'))

    const fetchMock = vi.fn(async () => ({ status: 401 } as Response))
    setFetch(fetchMock as unknown as typeof fetch)

    await expect(authFetch('https://example.com/protected', { method: 'GET' })).rejects.toThrow('fail')
    expect(TokenStorage.get()).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login?force=1')
  })

  it('同一轮过期请求仅刷新一次（单飞）', async () => {
    TokenStorage.set('old', { silent: true })
    refreshMock.mockResolvedValue({
      accessToken: 'new',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 1, name: 'n' },
    })

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      if (auth === 'Bearer new') return { status: 200 } as Response
      return { status: 401 } as Response
    })
    setFetch(fetchMock as unknown as typeof fetch)

    const [a, b] = await Promise.all([
      authFetch('https://example.com/data', { method: 'GET' }),
      authFetch('https://example.com/data', { method: 'GET' }),
    ])

    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    expect(refreshMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(TokenStorage.get()).toBe('new')
  })

  it('对 /api/auth/* 请求不触发刷新', async () => {
    TokenStorage.set('old', { silent: true })
    refreshMock.mockResolvedValue({ accessToken: 'new' })

    const fetchMock = vi.fn(async () => ({ status: 401 } as Response))
    setFetch(fetchMock as unknown as typeof fetch)

    const res = await authFetch('/api/auth/refresh', { method: 'POST' })
    expect(res.status).toBe(401)
    expect(refreshMock).not.toHaveBeenCalled()
  })

  it('刷新后仍未授权会清理 token 并跳转登录', async () => {
    TokenStorage.set('stale', { silent: true })
    const assign = vi.fn()
    ;(globalThis as any).window = { location: { assign }, document: {} }
    refreshMock.mockResolvedValue({
      accessToken: 'newer',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 1, name: 'n' },
    })

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      if (auth === 'Bearer newer') return { status: 401 } as Response
      return { status: 401 } as Response
    })
    setFetch(fetchMock as unknown as typeof fetch)

    const res = await authFetch('https://example.com/protected', { method: 'GET' })

    expect(res.status).toBe(401)
    expect(TokenStorage.get()).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login?force=1')
  })

  it('接受 Request 对象输入并附加凭证', async () => {
    TokenStorage.set('abc', { silent: true })
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.credentials).toBe('include')
      return { status: 200 } as Response
    })
    setFetch(fetchMock as unknown as typeof fetch)

    const req = new Request('https://example.com/data', { method: 'GET' })
    await authFetch(req)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('接受 URL 输入保持原始地址', async () => {
    TokenStorage.set('abc', { silent: true })
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect((input as URL).toString()).toBe('https://example.com/url-input')
      return { status: 200 } as Response
    })
    setFetch(fetchMock as unknown as typeof fetch)

    await authFetch(new URL('https://example.com/url-input'))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('对 /api/auth/* 的 Request 输入不刷新', async () => {
    TokenStorage.set('old', { silent: true })
    refreshMock.mockResolvedValue({ accessToken: 'new' })

    const fetchMock = vi.fn(async () => ({ status: 401 } as Response))
    setFetch(fetchMock as unknown as typeof fetch)

    const req = new Request('https://example.com/api/auth/refresh', { method: 'POST' })
    const res = await authFetch(req)

    expect(res.status).toBe(401)
    expect(refreshMock).not.toHaveBeenCalled()
  })

  it('无 token 时不会写 Authorization 头', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.has('Authorization')).toBe(false)
      return { status: 200 } as Response
    })
    setFetch(fetchMock as unknown as typeof fetch)

    await authFetch('https://example.com/no-token')
  })

  it('缺少 fetch 环境时抛出明确错误', async () => {
    TokenStorage.clear({ silent: true })
    const prevFetch = (globalThis as any).fetch
    delete (globalThis as any).fetch

    await expect(authFetch('https://example.com/absent')).rejects.toThrow('FETCH_NOT_AVAILABLE')

    if (prevFetch) {
      ;(globalThis as any).fetch = prevFetch
    }
  })
})
