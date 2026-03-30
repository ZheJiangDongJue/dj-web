import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/config', () => ({
  API_BASE: 'http://api.test',
}))

vi.mock('@/lib/auth/token-storage', () => {
  let token: string | null = null
  const storage = {
    get: vi.fn(() => token),
    set: vi.fn((t: string) => {
      token = t
    }),
    clear: vi.fn(() => {
      token = null
    }),
    subscribe: vi.fn(() => () => {}),
  }
  return {
    default: storage,
  }
})

function makeResponse(status: number, body: string) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async text() {
      return body
    },
  } as Response
}

describe('ApiClient', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    delete (globalThis as any).window
    delete (globalThis as any).document
  })

  it('getJson retries once after refresh and returns parsed JSON', async () => {
    const { ApiClient } = await import('./client')
    const TokenStorage = (await import('@/lib/auth/token-storage')).default as any

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === '/api/auth/refresh') {
        const headers = new Headers(init?.headers)
        expect(headers.get('X-Csrf-Token')).toBe('csrf')

        const payload = {
          success: true,
          data: {
            accessToken: 'new',
            refreshToken: 'r',
            expiresAt: '2099-01-01T00:00:00Z',
            user: { id: 1, name: 'n' },
          },
        }
        return makeResponse(200, JSON.stringify(payload))
      }

      const auth = new Headers(init?.headers).get('Authorization')
      if (auth === 'Bearer new') {
        return makeResponse(200, JSON.stringify({ ok: true }))
      }
      return makeResponse(401, '')
    })

    const client = new ApiClient({
      fetch: fetchMock as unknown as typeof fetch,
      getCookieString: () => 'csrfToken=csrf',
    })

    const data = await client.getJson<{ ok: boolean }>('/Me/GetProfile', {
      query: { a: 1, b: ['x', 'y'] },
    })

    expect(data.ok).toBe(true)
    expect(TokenStorage.set).toHaveBeenCalledWith('new', { silent: false })
    // 401 -> refresh -> retry
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('http://api.test/Me/GetProfile')
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('a=1')
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('b=x')
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('b=y')
  })

  it('fetch accepts absolute URLs without prefixing baseUrl', async () => {
    const { ApiClient } = await import('./client')

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(input).toBe('https://external.test/ping')
      return makeResponse(200, '')
    })

    const client = new ApiClient({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => null,
      setAccessToken: () => {},
      refresh: async () => ({ accessToken: 't' }),
    })

    const res = await client.fetch('https://external.test/ping')
    expect(res.status).toBe(200)
  })

  it('postJson sends JSON body and sets Content-Type', async () => {
    const { ApiClient } = await import('./client')

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('Content-Type')).toBe('application/json')
      expect(init?.body).toBe(JSON.stringify({ x: 1 }))
      return makeResponse(200, JSON.stringify({ ok: true }))
    })

    const client = new ApiClient({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 't',
      setAccessToken: () => {},
      refresh: async () => ({ accessToken: 't' }),
    })

    const data = await client.postJson<{ ok: boolean }>('/Me/Logout', { x: 1 })
    expect(data.ok).toBe(true)
  })

  it('postJson throws ApiClientError on non-2xx', async () => {
    const { ApiClient } = await import('./client')

    const fetchMock = vi.fn(async () => makeResponse(400, ''))

    const client = new ApiClient({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 't',
      setAccessToken: () => {},
      refresh: async () => ({ accessToken: 't' }),
    })

    await expect(client.postJson('/Me/Logout', { x: 1 })).rejects.toMatchObject({
      name: 'ApiClientError',
      message: 'Request failed',
      status: 400,
    })
  })

  it('postJson throws ApiClientError on invalid JSON', async () => {
    const { ApiClient } = await import('./client')

    const fetchMock = vi.fn(async () => makeResponse(200, 'not-json'))

    const client = new ApiClient({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 't',
      setAccessToken: () => {},
      refresh: async () => ({ accessToken: 't' }),
    })

    await expect(client.postJson('/Me/Logout', { x: 1 })).rejects.toMatchObject({
      name: 'ApiClientError',
      message: 'Invalid JSON',
    })
  })

  it('getJson throws ApiClientError on non-2xx', async () => {
    const { ApiClient } = await import('./client')

    const fetchMock = vi.fn(async () => makeResponse(500, ''))

    const client = new ApiClient({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 't',
      setAccessToken: () => {},
      refresh: async () => ({ accessToken: 't' }),
    })

    await expect(client.getJson('/Me/GetProfile')).rejects.toMatchObject({
      name: 'ApiClientError',
      message: 'Request failed',
      status: 500,
    })
  })

  it('getJson throws ApiClientError on invalid JSON', async () => {
    const { ApiClient } = await import('./client')

    const fetchMock = vi.fn(async () => makeResponse(200, 'not-json'))

    const client = new ApiClient({
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => 't',
      setAccessToken: () => {},
      refresh: async () => ({ accessToken: 't' }),
    })

    await expect(client.getJson('/Me/GetProfile')).rejects.toMatchObject({
      name: 'ApiClientError',
      message: 'Invalid JSON',
    })
  })

  it('default onAuthFailure redirects in browser when refresh fails', async () => {
    ;(globalThis as any).window = {
      document: {},
      location: { assign: vi.fn() },
    }
    ;(globalThis as any).document = {
      cookie: 'csrfToken=csrf',
    }

    const { ApiClient } = await import('./client')
    const TokenStorage = (await import('@/lib/auth/token-storage')).default as any

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/auth/refresh') {
        // Return an envelope that indicates failure
        return makeResponse(200, JSON.stringify({ success: false, code: 'FAIL', message: 'x' }))
      }
      return makeResponse(401, '')
    })

    const client = new ApiClient({
      fetch: fetchMock as unknown as typeof fetch,
      getCookieString: () => 'csrfToken=csrf',
    })

    await expect(client.getJson('/Me/GetProfile')).rejects.toThrow()

    expect(TokenStorage.clear).toHaveBeenCalled()
    expect((globalThis as any).window.location.assign).toHaveBeenCalledWith('/login?force=1')
  })
})
