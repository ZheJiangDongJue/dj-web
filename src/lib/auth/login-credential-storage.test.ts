// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearSavedLoginCredentials,
  LOGIN_CREDENTIAL_STORAGE_KEY,
  readSavedLoginCredentials,
  saveLoginCredentials,
} from './login-credential-storage'

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('login-credential-storage', () => {
  it('保存、读取并清理登录凭据', () => {
    saveLoginCredentials({
      app: 'erp',
      username: 'demo',
      password: '123456',
    })

    const saved = readSavedLoginCredentials()
    expect(saved).toMatchObject({
      app: 'erp',
      username: 'demo',
      password: '123456',
    })
    expect(typeof saved?.savedAt).toBe('string')

    clearSavedLoginCredentials()
    expect(readSavedLoginCredentials()).toBeNull()
  })

  it('读取到非法 app 时忽略并清理损坏数据', () => {
    window.localStorage.setItem(
      LOGIN_CREDENTIAL_STORAGE_KEY,
      JSON.stringify({
        app: 'crm',
        username: 'demo',
        password: '123456',
        savedAt: '2026-01-01T00:00:00.000Z',
      })
    )

    expect(readSavedLoginCredentials()).toBeNull()
    expect(window.localStorage.getItem(LOGIN_CREDENTIAL_STORAGE_KEY)).toBeNull()
  })

  it('读取到损坏 JSON 时忽略并清理损坏数据', () => {
    window.localStorage.setItem(LOGIN_CREDENTIAL_STORAGE_KEY, '{bad json')

    expect(readSavedLoginCredentials()).toBeNull()
    expect(window.localStorage.getItem(LOGIN_CREDENTIAL_STORAGE_KEY)).toBeNull()
  })

  it('localStorage 抛错时读写清理都不向外抛错', () => {
    const storage = window.localStorage
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(storage, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(readSavedLoginCredentials()).toBeNull()
    expect(() => saveLoginCredentials({ app: 'erp', username: 'u', password: 'p' })).not.toThrow()
    expect(() => clearSavedLoginCredentials()).not.toThrow()
  })
})
