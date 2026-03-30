import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  createAuthFetch,
  getCookieValue,
  __resetRefreshInFlightForTests,
} from './interceptors'

afterEach(() => {
  delete (globalThis as any).window
  delete (globalThis as any).document
})

describe('getCookieValue', () => {
  it('returns undefined when missing', () => {
    expect(getCookieValue('a=1; b=2', 'c')).toBeUndefined()
  })

  it('parses basic cookies', () => {
    expect(getCookieValue('a=1; b=2', 'a')).toBe('1')
    expect(getCookieValue('a=1; b=2', 'b')).toBe('2')
  })

  it('supports key-only cookie parts', () => {
    expect(getCookieValue('flag; a=1', 'flag')).toBe('')
  })

  it('decodes url-encoded values', () => {
    expect(getCookieValue('x=%E4%B8%AD%E6%96%87', 'x')).toBe('\u4e2d\u6587')
  })

  it('returns raw value when decodeURIComponent fails', () => {
    expect(getCookieValue('x=%E0%A4', 'x')).toBe('%E0%A4')
  })
})

describe('createAuthFetch', () => {
  beforeEach(() => {
    __resetRefreshInFlightForTests()
  })

  it('throws when no fetch is available', () => {
    const saved = (globalThis as any).fetch
    ;(globalThis as any).fetch = undefined

    expect(() =>
      createAuthFetch({
        getAccessToken: () => null,
        setAccessToken: () => {},
        refresh: async () => ({ accessToken: 't' }),
      })
    ).toThrow('FETCH_NOT_AVAILABLE')

    ;(globalThis as any).fetch = saved
  })

  it('single-flights refresh for concurrent 401', async () => {
    let token: string | null = 'old'

    const refresh = vi.fn(async () => ({ accessToken: 'new' }))

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      if (auth === 'Bearer new') return { status: 200 } as Response
      return { status: 401 } as Response
    })

    const authFetch = createAuthFetch({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => token,
      setAccessToken: (t) => {
        token = t
      },
      refresh,
    })

    const [a, b] = await Promise.all([
      authFetch('https://example.com/api', { method: 'GET' }),
      authFetch('https://example.com/api', { method: 'GET' }),
    ])

    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(token).toBe('new')
  })

  it('does not refresh for /api/auth/* requests (string input)', async () => {
    const refresh = vi.fn(async () => ({ accessToken: 'new' }))
    const fetchMock = vi.fn(async () => ({ status: 401 } as Response))

    const authFetch = createAuthFetch({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 't',
      setAccessToken: () => {},
      refresh,
    })

    const res = await authFetch('/api/auth/refresh', { method: 'POST' })
    expect(res.status).toBe(401)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('does not refresh for /api/auth/* requests (URL input)', async () => {
    const refresh = vi.fn(async () => ({ accessToken: 'new' }))
    const fetchMock = vi.fn(async () => ({ status: 401 } as Response))

    const authFetch = createAuthFetch({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 't',
      setAccessToken: () => {},
      refresh,
    })

    const res = await authFetch(new URL('https://example.com/api/auth/refresh'), { method: 'POST' })
    expect(res.status).toBe(401)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('does not refresh for /api/auth/* requests (Request-like input)', async () => {
    const refresh = vi.fn(async () => ({ accessToken: 'new' }))
    const fetchMock = vi.fn(async () => ({ status: 401 } as Response))

    const authFetch = createAuthFetch({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 't',
      setAccessToken: () => {},
      refresh,
    })

    const res = await authFetch({ url: '/api/auth/refresh' } as any, { method: 'POST' })
    expect(res.status).toBe(401)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('falls back to document.cookie when getCookieString is not provided (browser)', async () => {
    ;(globalThis as any).window = { document: {} }
    ;(globalThis as any).document = { cookie: 'csrfToken=fromdoc' }

    const refresh = vi.fn(async (ctx) => {
      expect(ctx.cookie).toBe('csrfToken=fromdoc')
      return { accessToken: 'new' }
    })

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      if (auth === 'Bearer new') return { status: 200 } as Response
      return { status: 401 } as Response
    })

    const authFetch = createAuthFetch({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 'old',
      setAccessToken: () => {},
      refresh,
    })

    const res = await authFetch('https://example.com/api', { method: 'GET' })
    expect(res.status).toBe(200)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('calls onAuthFailure when refresh fails', async () => {
    let token: string | null = 'old'

    const refresh = vi.fn(async () => {
      throw new Error('boom')
    })
    const onAuthFailure = vi.fn()

    const fetchMock = vi.fn(async () => ({ status: 401 } as Response))

    const authFetch = createAuthFetch({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => token,
      setAccessToken: (t) => {
        token = t
      },
      refresh,
      onAuthFailure,
    })

    await expect(authFetch('https://example.com/api', { method: 'GET' })).rejects.toThrow('boom')
    expect(onAuthFailure).toHaveBeenCalledTimes(1)
    expect(onAuthFailure).toHaveBeenCalledWith('refresh-failed', expect.any(Error))
    expect(token).toBeNull()
  })

  it('throws when refresh returns an empty accessToken', async () => {
    let token: string | null = 'old'

    const refresh = vi.fn(async () => ({ accessToken: '' }))
    const onAuthFailure = vi.fn()

    const fetchMock = vi.fn(async () => ({ status: 401 } as Response))

    const authFetch = createAuthFetch({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => token,
      setAccessToken: (t) => {
        token = t
      },
      refresh,
      onAuthFailure,
    })

    await expect(authFetch('https://example.com/api', { method: 'GET' })).rejects.toThrow('EMPTY_ACCESS_TOKEN')
    expect(onAuthFailure).toHaveBeenCalledWith('refresh-failed', expect.any(Error))
    expect(token).toBeNull()
  })

  it('calls onAuthFailure when retry is still unauthorized', async () => {
    const refresh = vi.fn(async () => ({ accessToken: 'new' }))
    const onAuthFailure = vi.fn()

    const fetchMock = vi.fn(async () => ({ status: 401 } as Response))

    const authFetch = createAuthFetch({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 'old',
      setAccessToken: () => {},
      refresh,
      onAuthFailure,
    })

    const res = await authFetch('https://example.com/api', { method: 'GET' })
    expect(res.status).toBe(401)
    expect(onAuthFailure).toHaveBeenCalledWith('unauthorized-after-refresh')
  })

  it('treats 403 like 401 (refresh + retry) and calls onAuthFailure when still forbidden', async () => {
    const refresh = vi.fn(async () => ({ accessToken: 'new' }))
    const onAuthFailure = vi.fn()

    const fetchMock = vi.fn(async () => ({ status: 403 } as Response))

    const authFetch = createAuthFetch({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 'old',
      setAccessToken: () => {},
      refresh,
      onAuthFailure,
    })

    const res = await authFetch('https://example.com/api', { method: 'GET' })
    expect(res.status).toBe(403)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(onAuthFailure).toHaveBeenCalledWith('unauthorized-after-refresh')
  })

  it('passes cookie from getCookieString to refresh', async () => {
    const refresh = vi.fn(async (ctx) => {
      expect(ctx.cookie).toBe('csrfToken=abc')
      return { accessToken: 'new' }
    })

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      if (auth === 'Bearer new') return { status: 200 } as Response
      return { status: 401 } as Response
    })

    const authFetch = createAuthFetch({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 'old',
      setAccessToken: () => {},
      refresh,
      getCookieString: () => 'csrfToken=abc',
    })

    const res = await authFetch('https://example.com/api', { method: 'GET' })
    expect(res.status).toBe(200)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('passes undefined cookie to refresh when not in browser and getCookieString is not provided', async () => {
    const refresh = vi.fn(async (ctx) => {
      expect(ctx.cookie).toBeUndefined()
      return { accessToken: 'new' }
    })

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      if (auth === 'Bearer new') return { status: 200 } as Response
      return { status: 401 } as Response
    })

    const authFetch = createAuthFetch({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 'old',
      setAccessToken: () => {},
      refresh,
    })

    const res = await authFetch('https://example.com/api', { method: 'GET' })
    expect(res.status).toBe(200)
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
