import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const cleanups: Array<() => void> = []

let ReactMock: any
let runAuthHook: any

vi.mock('react', () => {
  let states: any[] = []
  let index = 0

  const __resetHooks = () => {
    index = 0
  }

  const __resetAll = () => {
    states = []
    index = 0
  }

  return {
    __resetHooks,
    __resetAll,
    useMemo: (factory: any) => factory(),
    useCallback: (fn: any) => fn,
    useState: (init: any) => {
      const i = index
      index += 1
      if (typeof states[i] === 'undefined') {
        states[i] = typeof init === 'function' ? init() : init
      }
      const setState = (next: any) => {
        states[i] = typeof next === 'function' ? next(states[i]) : next
      }
      return [states[i], setState]
    },
    useEffect: (effect: any) => {
      const cleanup = effect()
      if (typeof cleanup === 'function') cleanups.push(cleanup)
    },
  }
})

vi.mock('@/lib/auth/token-storage', () => {
  let token: string | null = null
  const listeners = new Set<any>()

  const emit = (type: 'login' | 'logout') => {
    const ev = { type, ts: Date.now() }
    for (const l of listeners) {
      try {
        l(ev)
      } catch {
        // ignore
      }
    }
  }

  const store = {
    get: vi.fn(() => token),
    set: vi.fn((t: string) => {
      token = t
      emit('login')
    }),
    clear: vi.fn(() => {
      token = null
      emit('logout')
    }),
    subscribe: vi.fn((listener: any) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        throw new Error('off')
      }
    }),
  }
  return { default: store }
})

vi.mock('@/lib/auth/service', () => {
  return {
    AuthService: {
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
    },
  }
})

function createDeferred<T>() {
  let resolve: (v: T) => void = () => {}
  let reject: (err: unknown) => void = () => {}
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function renderAuth(options?: any) {
  ReactMock.__resetHooks()
  return runAuthHook(options)
}

describe('useAuth (hook)', () => {
  beforeEach(async () => {
    cleanups.length = 0
    ReactMock = (await import('react')) as any
    ReactMock.__resetAll()
    runAuthHook = (await import('./useAuth')).useAuth
    const TokenStorage = (await import('@/lib/auth/token-storage')).default as any
    TokenStorage.clear()
  })

  afterEach(() => {
    for (const fn of cleanups) fn()
    cleanups.length = 0
  })

  it('returns unauthenticated when no token', async () => {
    const redirectToLogin = vi.fn()
    const res = renderAuth({ redirectToLogin })

    expect(res.status).toBe('unauthenticated')
    expect(res.accessToken).toBeNull()
    expect(res.user).toBeNull()
    expect(res.loading).toBe(false)
    expect(res.error).toBeNull()
    expect(typeof res.login).toBe('function')
    expect(typeof res.refresh).toBe('function')
    expect(typeof res.logout).toBe('function')
    expect(typeof res.checkAuth).toBe('function')
  })

  it('login toggles loading, sets user, and authenticates', async () => {
    const { AuthService } = await import('@/lib/auth/service')
    const deferred = createDeferred<any>()
    ;(AuthService as any).login.mockImplementationOnce(() => deferred.promise)

    const redirectToLogin = vi.fn()
    const res1 = renderAuth({ redirectToLogin })

    const p = res1.login({ username: 'u', password: 'p', provider: 'Credential', app: 'erp' })
    const mid = renderAuth({ redirectToLogin })
    expect(mid.loading).toBe(true)

    deferred.resolve({
      accessToken: 'new',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 2, name: 'u2' },
    })

    await p
    const res2 = renderAuth({ redirectToLogin })
    expect(res2.loading).toBe(false)
    expect(res2.error).toBeNull()
    expect(res2.status).toBe('authenticated')
    expect(res2.accessToken).toBe('new')
    expect(res2.user).toEqual({ id: 2, name: 'u2' })
  })

  it('checkAuth uses existing token and does not refresh', async () => {
    const TokenStorage = (await import('@/lib/auth/token-storage')).default as any
    TokenStorage.set('t')
    const { AuthService } = await import('@/lib/auth/service')

    const redirectToLogin = vi.fn()
    const res = renderAuth({ redirectToLogin })

    const status = await res.checkAuth()
    expect(status).toBe('authenticated')
    expect((AuthService as any).refresh).not.toHaveBeenCalled()
  })

  it('checkAuth refreshes when missing token and updates state', async () => {
    const { AuthService } = await import('@/lib/auth/service')
    const deferred = createDeferred<any>()
    ;(AuthService as any).refresh.mockImplementationOnce(() => deferred.promise)

    const redirectToLogin = vi.fn()
    const res1 = renderAuth({ redirectToLogin })

    const p = res1.checkAuth()
    const mid = renderAuth({ redirectToLogin })
    expect(mid.loading).toBe(true)

    deferred.resolve({
      accessToken: 'rt',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 9, name: 'n9' },
    })

    const status = await p
    expect(status).toBe('authenticated')

    const res2 = renderAuth({ redirectToLogin })
    expect(res2.loading).toBe(false)
    expect(res2.error).toBeNull()
    expect(res2.status).toBe('authenticated')
    expect(res2.accessToken).toBe('rt')
    expect(res2.user).toEqual({ id: 9, name: 'n9' })
  })

  it('checkAuth returns unauthenticated and sets error when refresh fails', async () => {
    const { AuthService } = await import('@/lib/auth/service')
    ;(AuthService as any).refresh.mockRejectedValueOnce(new Error('refresh-fail'))

    const redirectToLogin = vi.fn()
    const res1 = renderAuth({ redirectToLogin })

    const status = await res1.checkAuth()
    expect(status).toBe('unauthenticated')
    expect(redirectToLogin).toHaveBeenCalledWith('/login?force=1')

    const res2 = renderAuth({ redirectToLogin })
    expect(res2.status).toBe('unauthenticated')
    expect(res2.error).toBeInstanceOf(Error)
  })

  it('checkAuth returns unauthenticated when refresh returns empty accessToken', async () => {
    const { AuthService } = await import('@/lib/auth/service')
    ;(AuthService as any).refresh.mockResolvedValueOnce({
      accessToken: '',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 1, name: 'n' },
    })

    const redirectToLogin = vi.fn()
    const res1 = renderAuth({ redirectToLogin })

    const status = await res1.checkAuth()
    expect(status).toBe('unauthenticated')

    const res2 = renderAuth({ redirectToLogin })
    expect(res2.status).toBe('unauthenticated')
    expect(Boolean(res2.accessToken)).toBe(false)
    expect(res2.error).toBeNull()
  })

  it('refresh sets error and redirects to /login on failure', async () => {
    const { AuthService } = await import('@/lib/auth/service')
    ;(AuthService as any).refresh.mockRejectedValueOnce(new Error('refresh-fail'))

    const redirectToLogin = vi.fn()
    const res1 = renderAuth({ redirectToLogin })

    await expect(res1.refresh()).rejects.toThrow('refresh-fail')
    expect(redirectToLogin).toHaveBeenCalledWith('/login?force=1')

    const res2 = renderAuth({ redirectToLogin })
    expect(res2.status).toBe('unauthenticated')
    expect(res2.accessToken).toBeNull()
    expect(res2.user).toBeNull()
    expect(res2.error).toBeInstanceOf(Error)
  })

  it('login sets error when upstream login fails', async () => {
    const { AuthService } = await import('@/lib/auth/service')
    ;(AuthService as any).login.mockRejectedValueOnce(new Error('bad-cred'))

    const redirectToLogin = vi.fn()
    const res1 = renderAuth({ redirectToLogin })

    await expect(res1.login({ username: 'u', password: 'p', provider: 'Credential', app: 'erp' })).rejects.toThrow('bad-cred')

    const res2 = renderAuth({ redirectToLogin })
    expect(res2.status).toBe('unauthenticated')
    expect(res2.user).toBeNull()
    expect(res2.error).toBeInstanceOf(Error)
    expect(redirectToLogin).not.toHaveBeenCalled()
  })

  it('logout clears state and redirects to /login?from=logout', async () => {
    const redirectToLogin = vi.fn()

    const res1 = renderAuth({ redirectToLogin })
    await res1.login({ username: 'u', password: 'p', provider: 'Credential', app: 'erp' })

    const res2 = renderAuth({ redirectToLogin })
    expect(res2.status).toBe('authenticated')

    await res2.logout({ reason: 'manual-logout' })
    expect(redirectToLogin).toHaveBeenCalledWith('/login?from=logout')

    const res3 = renderAuth({ redirectToLogin })
    expect(res3.status).toBe('unauthenticated')
    expect(res3.accessToken).toBeNull()
    expect(res3.user).toBeNull()
  })
})
