import { beforeEach, describe, expect, it, vi } from 'vitest'
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
})
