import { beforeEach, describe, expect, it, vi } from 'vitest'

const callActionMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/config', () => ({
  DEFAULT_DB_NAME: 'DEFAULT_DB',
}))

vi.mock('./bill-api.client', () => ({
  BillApiClient: vi.fn(() => ({
    callAction: callActionMock,
  })),
}))

describe('Auth API', () => {
  beforeEach(async () => {
    callActionMock.mockReset()

    const { clearCheckAuthCache } = await import('./auth-api')
    clearCheckAuthCache()
  })

  it('CheckAuth 会把字符串 false 规范化为布尔 false', async () => {
    const { CheckAuth } = await import('./auth-api')

    callActionMock.mockResolvedValue('false')

    await expect(CheckAuth({ userId: 1, pageName: 'DeniedPage' })).resolves.toBe(false)
  })

  it('CheckAuth 会把字符串 true 规范化为布尔 true', async () => {
    const { CheckAuth } = await import('./auth-api')

    callActionMock.mockResolvedValue('true')

    await expect(CheckAuth({ userId: 1, pageName: 'AllowedPage' })).resolves.toBe(true)
  })

  it('CheckAuth 对异常字符串按无权限处理', async () => {
    const { CheckAuth } = await import('./auth-api')

    callActionMock.mockResolvedValue('false ')

    await expect(CheckAuth({ userId: 1, pageName: 'DeniedPage' })).resolves.toBe(false)
  })
})
