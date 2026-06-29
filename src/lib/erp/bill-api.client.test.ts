import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import authFetch from '@/lib/auth/interceptor'
import { BillApiClient } from './bill-api.client'

vi.mock('@/lib/config', () => ({
  API_BASE: 'http://api.test',
}))

vi.mock('@/lib/auth/interceptor', () => ({
  default: vi.fn(),
}))

function makeResponse(status: number, body: string): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    async text() {
      return body
    },
  } as Response
}

describe('BillApiClient', () => {
  const authFetchMock = vi.mocked(authFetch)

  beforeEach(() => {
    authFetchMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['false', false],
    ['0', 0],
    ['null', null],
    ['""', ''],
  ])('callAction 会保留合法 JSON 原始值 %s', async (body, expected) => {
    authFetchMock.mockResolvedValueOnce(makeResponse(200, body))

    const client = new BillApiClient()
    const result = await client.callAction<unknown>('PrimitiveValue', { method: 'GET' })

    expect(result).toBe(expected)
  })

  it('callActionRaw 会保留 JSON false，而不是返回字符串 false', async () => {
    authFetchMock.mockResolvedValueOnce(makeResponse(200, 'false'))

    const client = new BillApiClient()
    const result = await client.callActionRaw<unknown>('PrimitiveValue', { method: 'GET' })

    expect(result).toBe(false)
  })

  it('callAction 即使传入外部 signal 也会保留内部超时', async () => {
    vi.useFakeTimers()
    authFetchMock.mockImplementationOnce((_url, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(init.signal?.reason ?? new DOMException('Aborted', 'AbortError'))
      })
    }))

    const external = new AbortController()
    const client = new BillApiClient({ timeoutMs: 10 })
    const pending = client.callAction<unknown>('SlowAction', {
      method: 'GET',
      signal: external.signal,
    })
    const assertion = expect(pending).rejects.toMatchObject({ code: 'NETWORK_TIMEOUT' })

    await vi.advanceTimersByTimeAsync(10)

    await assertion
  })
})
