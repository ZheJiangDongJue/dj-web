import { afterEach, describe, expect, it, vi } from 'vitest'

const authFetchMock = vi.fn()

vi.mock('@/lib/config', () => ({
  API_BASE: '/api/erp',
}))

vi.mock('@/lib/auth/interceptor', () => ({
  default: authFetchMock,
}))

vi.mock('@/lib/android-bridge', () => ({
  fetchImageBase64: vi.fn(),
  isAndroidBridgeAvailable: () => false,
}))

describe('loadImageBase64', () => {
  afterEach(() => {
    authFetchMock.mockReset()
    try {
      delete (globalThis as any).window
    } catch {
      // ignore
    }
  })

  it('builds download URL correctly when API_BASE is relative', async () => {
    ;(globalThis as any).window = {
      btoa: (input: string) => Buffer.from(input, 'binary').toString('base64'),
    }

    let capturedUrl = ''
    authFetchMock.mockImplementation(async (input: any) => {
      capturedUrl = String(input)
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
      })
    })

    const { loadImageBase64 } = await import('./image-loader')

    const res = await loadImageBase64(
      {
        id: 'cloud-123',
        uri: '',
        dbName: 'ERP_质量',
        cloudFileId: 123,
        isRemoteOnly: true,
        fileName: 'a b.jpg',
      } as any,
      { type: 'preview' },
    )

    expect(res.success).toBe(true)
    expect(res.source).toBe('server')
    expect(capturedUrl).toMatch(/^\/api\/erp\/api\/File\/Download\?/)

    const parsed = new URL(capturedUrl, 'https://example.test')
    expect(parsed.searchParams.get('dbName')).toBe('ERP_质量')
    expect(parsed.searchParams.get('cloudFileId')).toBe('123')
    expect(parsed.searchParams.get('fileName')).toBe('a b.jpg')
  })
})

