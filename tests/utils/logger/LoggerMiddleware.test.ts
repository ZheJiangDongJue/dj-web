import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/server to run middleware logic in isolation
const nextHeaders = new Map<string, string>()
const responseHeaders = new Map<string, string>()

vi.mock('next/server', () => {
  return {
    NextResponse: {
      next: vi.fn((opts?: any) => {
        // Capture forwarded request headers and return a minimal response-like object
        const headers = new Map<string, string>()
        const src = opts?.request?.headers as Headers | undefined
        if (src) {
          // @ts-expect-error iterate
          for (const [k, v] of src) headers.set(k.toLowerCase(), String(v))
        }
        return {
          headers: {
            set: (k: string, v: string) => responseHeaders.set(k.toLowerCase(), v),
            get: (k: string) => responseHeaders.get(k.toLowerCase()) ?? null,
          },
          cookies: {
            set: vi.fn(),
          },
          __forwarded: headers,
        }
      }),
    },
  }
})

import { loggerMiddleware, REQUEST_ID_HEADER, REQUEST_START_HEADER } from '../../../src/utils/logger/middleware/LoggerMiddleware'

function makeRequest(init?: { headers?: Record<string, string>; cookieId?: string }) {
  const headers = new Headers()
  if (init?.headers) Object.entries(init.headers).forEach(([k, v]) => headers.set(k, v))
  const cookies = new Map<string, string>()
  if (init?.cookieId) cookies.set(REQUEST_ID_HEADER, init.cookieId)
  return {
    headers,
    cookies: {
      get: (name: string) => (cookies.has(name) ? { value: cookies.get(name)! } : undefined),
    },
  } as unknown as import('next/server').NextRequest
}

describe('loggerMiddleware', () => {
  beforeEach(() => {
    responseHeaders.clear()
  })

  it('injects request id when not present', () => {
    const req = makeRequest()
    const res: any = loggerMiddleware(req)

    const rid = res.headers.get(REQUEST_ID_HEADER)
    const start = res.headers.get(REQUEST_START_HEADER)
    expect(rid).toBeTruthy()
    expect(start).toBeTruthy()

    // Request headers forwarded to downstream contain the same id
    const forwarded = (res.__forwarded as Map<string, string>)
    expect(forwarded.get(REQUEST_ID_HEADER)).toBe(rid)
  })

  it('preserves existing request id from headers', () => {
    const existing = 'fixed-id-123'
    const req = makeRequest({ headers: { [REQUEST_ID_HEADER]: existing } })
    const res: any = loggerMiddleware(req)
    expect(res.headers.get(REQUEST_ID_HEADER)).toBe(existing)
  })
})
