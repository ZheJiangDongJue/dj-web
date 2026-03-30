import { describe, it, expect, vi, afterEach } from 'vitest'

import { createAuthController, clearAuthStorage, DEFAULT_AUTH_STORAGE_KEYS } from './useAuth'

function createTokenStorageMock() {
  let token: string | null = null

  return {
    get: vi.fn(() => token),
    set: vi.fn((t: string) => {
      token = t
    }),
    clear: vi.fn(() => {
      token = null
    }),
    subscribe: vi.fn(() => () => {}),
  }
}

afterEach(() => {
  delete (globalThis as any).window
})

describe('clearAuthStorage', () => {
  it('removes all default keys', () => {
    const removed: string[] = []
    const storage = {
      getItem: vi.fn(() => null),
      removeItem: vi.fn((k: string) => {
        removed.push(k)
      }),
    }

    clearAuthStorage(storage)

    expect(storage.removeItem).toHaveBeenCalledTimes(DEFAULT_AUTH_STORAGE_KEYS.length)
    expect(removed).toEqual(Array.from(DEFAULT_AUTH_STORAGE_KEYS))
  })
})

describe('createAuthController', () => {
  it('getAccessToken returns null when tokenStorage.get throws', () => {
    const tokenStorage = {
      get: vi.fn(() => {
        throw new Error('boom')
      }),
      set: vi.fn(),
      clear: vi.fn(),
      subscribe: vi.fn(() => () => {}),
    }

    const ctl = createAuthController({
      tokenStorage: tokenStorage as any,
      authService: { refresh: vi.fn(), logout: vi.fn() } as any,
      localStorage: null,
      redirectToLogin: vi.fn(),
    })

    expect(ctl.getAccessToken()).toBeNull()
  })

  it('login sets token on success', async () => {
    const tokenStorage = createTokenStorageMock()
    const authService = {
      login: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      refresh: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      logout: vi.fn(async () => {}),
    }

    const redirectToLogin = vi.fn()

    const ctl = createAuthController({
      tokenStorage,
      authService,
      localStorage: null,
      redirectToLogin,
    })

    const res = await ctl.login({ username: 'u', password: 'p', provider: 'Credential', app: 'erp' })
    expect(res.accessToken).toBe('t')
    expect(tokenStorage.set).toHaveBeenCalledWith('t', { silent: false })
    expect(redirectToLogin).not.toHaveBeenCalled()
  })

  it('login clears token on failure but does not redirect', async () => {
    const tokenStorage = createTokenStorageMock()
    tokenStorage.set('old')

    const authService = {
      login: vi.fn(async () => {
        throw new Error('bad')
      }),
      refresh: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      logout: vi.fn(async () => {}),
    }

    const redirectToLogin = vi.fn()

    const ctl = createAuthController({
      tokenStorage,
      authService,
      localStorage: null,
      redirectToLogin,
    })

    await expect(ctl.login({ username: 'u', password: 'p', provider: 'Credential', app: 'erp' })).rejects.toThrow('bad')
    expect(tokenStorage.clear).toHaveBeenCalled()
    expect(redirectToLogin).not.toHaveBeenCalled()
  })

  it('refresh sets token on success', async () => {
    const tokenStorage = createTokenStorageMock()
    const authService = {
      login: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      refresh: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      logout: vi.fn(async () => {}),
    }

    const redirectToLogin = vi.fn()

    const ctl = createAuthController({
      tokenStorage,
      authService,
      localStorage: null,
      redirectToLogin,
    })

    const res = await ctl.refresh()
    expect(res.accessToken).toBe('t')
    expect(tokenStorage.set).toHaveBeenCalledWith('t', { silent: false })
    expect(redirectToLogin).not.toHaveBeenCalled()
  })

  it('refresh clears token and redirects on failure', async () => {
    const tokenStorage = createTokenStorageMock()
    const authService = {
      login: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      refresh: vi.fn(async () => {
        throw new Error('fail')
      }),
      logout: vi.fn(async () => {}),
    }

    const redirectToLogin = vi.fn()

    const ctl = createAuthController({
      tokenStorage,
      authService,
      localStorage: null,
      redirectToLogin,
    })

    await expect(ctl.refresh()).rejects.toThrow('fail')
    expect(tokenStorage.clear).toHaveBeenCalled()
    expect(redirectToLogin).toHaveBeenCalledWith('/login?force=1')
  })

  it('logout clears token, clears storage, and redirects even if upstream fails', async () => {
    const tokenStorage = createTokenStorageMock()
    const authService = {
      login: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      refresh: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      logout: vi.fn(async () => {
        throw new Error('boom')
      }),
    }

    const removed: string[] = []
    const storage = {
      getItem: vi.fn(() => null),
      removeItem: vi.fn((k: string) => {
        removed.push(k)
      }),
    }

    const redirectToLogin = vi.fn()

    const ctl = createAuthController({
      tokenStorage,
      authService,
      localStorage: storage,
      redirectToLogin,
    })

    await ctl.logout({ reason: 'manual-logout' })

    expect(tokenStorage.clear).toHaveBeenCalledWith({ reason: 'manual-logout', silent: false })
    expect(storage.removeItem).toHaveBeenCalledTimes(DEFAULT_AUTH_STORAGE_KEYS.length)
    expect(removed).toEqual(Array.from(DEFAULT_AUTH_STORAGE_KEYS))
    expect(redirectToLogin).toHaveBeenCalledWith('/login?from=logout')
  })

  it('uses window.localStorage and default redirect when options are omitted', async () => {
    const tokenStorage = createTokenStorageMock()
    const authService = {
      login: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      refresh: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      logout: vi.fn(async () => {}),
    }

    const removed: string[] = []

    const assign = vi.fn()
    ;(globalThis as any).window = {
      location: { assign },
      localStorage: {
        getItem: vi.fn(() => null),
        removeItem: vi.fn((k: string) => removed.push(k)),
      },
    }

    const ctl = createAuthController({
      tokenStorage,
      authService,
    })

    await ctl.logout()

    expect(assign).toHaveBeenCalledWith('/login?from=logout')
    expect(removed.length).toBe(DEFAULT_AUTH_STORAGE_KEYS.length)
  })

  it('handles window.localStorage access throwing', async () => {
    const tokenStorage = createTokenStorageMock()
    const authService = {
      login: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      refresh: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      logout: vi.fn(async () => {}),
    }

    const assign = vi.fn()
    const win: any = { location: { assign } }
    Object.defineProperty(win, 'localStorage', {
      get() {
        throw new Error('nope')
      },
    })
    ;(globalThis as any).window = win

    const ctl = createAuthController({ tokenStorage, authService })
    await ctl.logout()

    expect(assign).toHaveBeenCalledWith('/login?from=logout')
  })

  it('default redirect is a no-op outside browser', async () => {
    const tokenStorage = createTokenStorageMock()
    const authService = {
      login: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      refresh: vi.fn(async () => ({
        accessToken: 't',
        refreshToken: 'r',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 1, name: 'n' },
      })),
      logout: vi.fn(async () => {}),
    }

    // No window in this test -> defaultRedirectToLogin should early-return.
    const ctl = createAuthController({ tokenStorage, authService })
    await expect(ctl.logout()).resolves.toBeUndefined()
  })
})
