import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { AuthService } from './service'
import { api } from './api'

type Mock = ReturnType<typeof vi.fn>

vi.mock('./api', () => ({
  api: {
    post: vi.fn(),
  },
}))

const postMock = api.post as unknown as Mock

describe('AuthService', () => {
  beforeEach(() => {
    postMock.mockReset()
  })

  afterEach(() => {
    delete (globalThis as any).document
  })

  it('login 映射并提交认证请求', async () => {
    postMock.mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 1, name: 'n' },
    })

    await AuthService.login({ username: ' user ', password: ' p ', dbName: ' foo ' })

    expect(postMock).toHaveBeenCalledTimes(1)
    expect(postMock).toHaveBeenCalledWith('/authenticate', {
      dbName: 'foo',
      loginId: 'user',
      password: ' p ',
    })
  })

  it('login 在缺省 dbName 时使用默认值', async () => {
    postMock.mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 1, name: 'n' },
    })

    await AuthService.login({ username: 'u', password: 'p' })

    expect(postMock).toHaveBeenCalledWith('/authenticate', {
      dbName: 'ERP_Default',
      loginId: 'u',
      password: 'p',
    })
  })

  it('login 读取环境变量默认库名', async () => {
    const prev = process.env.NEXT_PUBLIC_DB_NAME
    process.env.NEXT_PUBLIC_DB_NAME = 'CustomDb '
    postMock.mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 1, name: 'n' },
    })

    await AuthService.login({ username: 'u', password: 'p' })

    expect(postMock).toHaveBeenCalledWith('/authenticate', {
      dbName: 'CustomDb',
      loginId: 'u',
      password: 'p',
    })

    process.env.NEXT_PUBLIC_DB_NAME = prev
  })

  it('refresh 从 cookie 读取 CSRF 并附加头部', async () => {
    ;(globalThis as any).document = { cookie: 'a=1; csrfToken=abc%201; b=2' }
    postMock.mockResolvedValue({
      accessToken: 'new',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 1, name: 'n' },
    })

    await AuthService.refresh()

    expect(postMock).toHaveBeenCalledWith(
      '/refresh',
      undefined,
      expect.objectContaining({ headers: { 'X-Csrf-Token': 'abc 1' } })
    )
  })

  it('refresh 在无 cookie 时不附带 CSRF 头', async () => {
    ;(globalThis as any).document = { cookie: '' }
    postMock.mockResolvedValue({
      accessToken: 'new',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 1, name: 'n' },
    })

    await AuthService.refresh()

    expect(postMock).toHaveBeenCalledWith('/refresh', undefined, undefined)
  })

  it('refresh 在 SSR 环境下跳过 CSRF 读取', async () => {
    delete (globalThis as any).document
    postMock.mockResolvedValue({
      accessToken: 'new',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 1, name: 'n' },
    })

    await AuthService.refresh()

    expect(postMock).toHaveBeenCalledWith('/refresh', undefined, undefined)
  })

  it('refresh 在 cookie 解码失败时忽略 CSRF', async () => {
    ;(globalThis as any).document = { cookie: 'csrfToken=%E0%A4' }
    postMock.mockResolvedValue({
      accessToken: 'new',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 1, name: 'n' },
    })

    await AuthService.refresh()

    expect(postMock).toHaveBeenCalledWith('/refresh', undefined, undefined)
  })

  it('logout 调用后端登出接口', async () => {
    postMock.mockResolvedValue({})

    await AuthService.logout()

    expect(postMock).toHaveBeenCalledWith('/logout')
  })
})
