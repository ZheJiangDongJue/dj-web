import { describe, it, expect, vi, afterEach } from 'vitest'

import {
  ApiClient,
  getAccessTokenFromCookie,
  getCsrfTokenFromCookie,
  refreshViaNextAuthProxy,
} from './client'

function makeResponse(status: number, body: string) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async text() {
      return body
    },
  } as Response
}

afterEach(() => {
  delete (globalThis as any).window
  delete (globalThis as any).document
})

describe('cookie helpers', () => {
  it('extracts accessToken and csrfToken', () => {
    const cookie = 'a=1; accessToken=tok; csrfToken=csrf'
    expect(getAccessTokenFromCookie(cookie)).toBe('tok')
    expect(getCsrfTokenFromCookie(cookie)).toBe('csrf')
  })

  it('returns null/undefined when missing', () => {
    expect(getAccessTokenFromCookie('a=1')).toBeNull()
    expect(getCsrfTokenFromCookie('a=1')).toBeUndefined()
  })
})

describe('refreshViaNextAuthProxy', () => {
  it('attaches X-Csrf-Token header when csrfToken cookie exists (ctx.cookie)', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('X-Csrf-Token')).toBe('abc')
      expect(init?.credentials).toBe('include')

      const payload = {
        success: true,
        data: {
          accessToken: 't',
          refreshToken: 'r',
          expiresAt: '2099-01-01T00:00:00Z',
          user: { id: 1, name: 'n' },
        },
      }
      return makeResponse(200, JSON.stringify(payload))
    })

    const data = await refreshViaNextAuthProxy({ fetch: fetchMock as unknown as typeof fetch, cookie: 'csrfToken=abc' })
    expect(data.accessToken).toBe('t')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/refresh')
  })

  it('reads cookie from document.cookie when ctx.cookie is not provided', async () => {
    ;(globalThis as any).window = { document: {} }
    ;(globalThis as any).document = { cookie: 'csrfToken=doc' }

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('X-Csrf-Token')).toBe('doc')

      const payload = {
        success: true,
        data: {
          accessToken: 't',
          refreshToken: 'r',
          expiresAt: '2099-01-01T00:00:00Z',
          user: { id: 1, name: 'n' },
        },
      }
      return makeResponse(200, JSON.stringify(payload))
    })

    await refreshViaNextAuthProxy({ fetch: fetchMock as unknown as typeof fetch })
  })

  it('passes ctx.signal to refresh fetch', async () => {
    const controller = new AbortController()
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.signal).toBe(controller.signal)
      return makeResponse(200, JSON.stringify({
        success: true,
        data: {
          accessToken: 't',
          refreshToken: 'r',
          expiresAt: '2099-01-01T00:00:00Z',
          user: { id: 1, name: 'n' },
        },
      }))
    })

    await refreshViaNextAuthProxy({
      fetch: fetchMock as unknown as typeof fetch,
      signal: controller.signal,
    })
  })

  it('handles document.cookie throwing (no CSRF header)', async () => {
    ;(globalThis as any).window = { document: {} }
    const doc: any = {}
    Object.defineProperty(doc, 'cookie', {
      get() {
        throw new Error('nope')
      },
    })
    ;(globalThis as any).document = doc

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('X-Csrf-Token')).toBeNull()

      const payload = {
        success: true,
        data: {
          accessToken: 't',
          refreshToken: 'r',
          expiresAt: '2099-01-01T00:00:00Z',
          user: { id: 1, name: 'n' },
        },
      }
      return makeResponse(200, JSON.stringify(payload))
    })

    await refreshViaNextAuthProxy({ fetch: fetchMock as unknown as typeof fetch })
  })

  it('throws ApiClientError on non-envelope response', async () => {
    const fetchMock = vi.fn(async () => makeResponse(200, 'not-json'))
    await expect(refreshViaNextAuthProxy({ fetch: fetchMock as unknown as typeof fetch, cookie: 'csrfToken=abc' }))
      .rejects.toThrow('Refresh failed')
  })

  it('throws ApiClientError when envelope indicates failure', async () => {
    const fetchMock = vi.fn(async () => makeResponse(401, JSON.stringify({ success: false, code: 'FAIL', message: 'x' })))
    await expect(refreshViaNextAuthProxy({ fetch: fetchMock as unknown as typeof fetch, cookie: 'csrfToken=abc' }))
      .rejects.toMatchObject({
        name: 'ApiClientError',
        message: 'Refresh failed',
        status: 401,
        code: 'FAIL',
        url: '/api/auth/refresh',
      })
  })

  it('throws ApiClientError when envelope is ok but accessToken is missing', async () => {
    const fetchMock = vi.fn(async () =>
      makeResponse(
        200,
        JSON.stringify({
          success: true,
          data: { accessToken: '', refreshToken: 'r', expiresAt: '2099-01-01T00:00:00Z', user: { id: 1, name: 'n' } },
        })
      )
    )
    await expect(refreshViaNextAuthProxy({ fetch: fetchMock as unknown as typeof fetch, cookie: 'csrfToken=abc' }))
      .rejects.toThrow('Refresh failed')
  })
})

describe('ApiClient (defaults)', () => {
  afterEach(() => {
    delete (globalThis as any).window
    delete (globalThis as any).document
  })

  it('default onAuthFailure ignores setAccessToken errors (non-browser)', async () => {
    const fetchMock = vi.fn(async () => ({ status: 401 } as Response))
    const setAccessToken = vi.fn(() => {
      throw new Error('set-fail')
    })
    const refresh = vi.fn(async () => {
      throw new Error('refresh-fail')
    })

    const client = new ApiClient({
      baseUrl: 'http://api.test',
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => null,
      setAccessToken,
      refresh,
    })

    await expect(client.fetch('/Me/GetProfile')).rejects.toThrow('refresh-fail')
    expect(setAccessToken).toHaveBeenCalledWith(null)
  })

  it('default onAuthFailure ignores window.location.assign errors (browser)', async () => {
    ;(globalThis as any).window = {
      document: {},
      location: {
        assign: vi.fn(() => {
          throw new Error('assign-fail')
        }),
      },
    }
    ;(globalThis as any).document = { cookie: '' }

    const fetchMock = vi.fn(async () => ({ status: 401 } as Response))
    const refresh = vi.fn(async () => {
      throw new Error('refresh-fail')
    })

    const client = new ApiClient({
      baseUrl: 'http://api.test',
      fetch: fetchMock as unknown as typeof fetch,
      getAccessToken: () => null,
      setAccessToken: () => {},
      refresh,
    })

    await expect(client.fetch('/Me/GetProfile')).rejects.toThrow('refresh-fail')
    expect((globalThis as any).window.location.assign).toHaveBeenCalledWith('/login?force=1')
  })
})
