import { afterEach, describe, expect, it, vi } from 'vitest'

const authFetchMock = vi.fn()
const fetchImageBase64Mock = vi.fn()
const isAndroidBridgeAvailableMock = vi.fn(() => false)

vi.mock('@/lib/config', () => ({
  API_BASE: '/api/erp',
}))

vi.mock('@/lib/auth/interceptor', () => ({
  default: authFetchMock,
}))

vi.mock('@/lib/android-bridge', () => ({
  fetchImageBase64: fetchImageBase64Mock,
  isAndroidBridgeAvailable: isAndroidBridgeAvailableMock,
}))

describe('loadImageBase64', () => {
  afterEach(() => {
    authFetchMock.mockReset()
    fetchImageBase64Mock.mockReset()
    isAndroidBridgeAvailableMock.mockReset()
    isAndroidBridgeAvailableMock.mockReturnValue(false)
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

  it('returns android-local result when Android bridge provides base64', async () => {
    isAndroidBridgeAvailableMock.mockReturnValue(true)
    fetchImageBase64Mock.mockResolvedValue({
      success: true,
      base64: 'abc',
      mime: 'image/jpeg',
    })

    const { loadImageBase64 } = await import('./image-loader')

    const res = await loadImageBase64(
      {
        id: '94',
        uri: 'content://media/external/images/media/94',
        path: '/storage/emulated/0/DCIM/Camera/a.jpg',
        mime: 'image/jpeg',
      } as any,
      { type: 'preview', maxDim: 512 },
    )

    expect(res.success).toBe(true)
    expect(res.source).toBe('android-local')
    expect(res.base64).toBe('abc')
    expect(authFetchMock).not.toHaveBeenCalled()
  })

  it('returns Android failure message when server keys are missing', async () => {
    isAndroidBridgeAvailableMock.mockReturnValue(true)
    fetchImageBase64Mock.mockResolvedValue({
      success: false,
      message: 'permission denied',
    })

    const { loadImageBase64 } = await import('./image-loader')

    const res = await loadImageBase64(
      {
        id: '94',
        uri: 'content://media/external/images/media/94',
        path: '/storage/emulated/0/DCIM/Camera/a.jpg',
      } as any,
      { type: 'original', maxDim: 2048 },
    )

    expect(res.success).toBe(false)
    expect(res.message).toBe('permission denied')
    expect(res.errorCode).toBe('ANDROID_FETCH_FAILED')
    expect(authFetchMock).not.toHaveBeenCalled()
  })
})
