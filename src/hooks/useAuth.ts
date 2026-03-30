"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LoginRequest, LoginSuccess } from '@/types/auth'
import TokenStorage, { type TokenEvent } from '@/lib/auth/token-storage'
import { AuthService } from '@/lib/auth/service'

export type AuthStatus = 'authenticated' | 'unauthenticated'

export interface StorageLike {
  getItem(key: string): string | null
  removeItem(key: string): void
}

export interface TokenStorageLike {
  get(): string | null
  set(token: string, opts?: unknown): void
  clear(opts?: unknown): void
  subscribe(listener: (ev: TokenEvent) => void): () => void
}

export interface AuthServiceLike {
  login(req: LoginRequest): Promise<LoginSuccess>
  refresh(): Promise<LoginSuccess>
  logout(): Promise<void>
}

export const DEFAULT_AUTH_STORAGE_KEYS: readonly string[] = [
  'erp:auth',
  'erp-auth',
  'dj-auth',
  'auth',
  'login',
  'user',
  'erp:dbName',
  'dbName',
  'erp:userInfo',
  'userInfo',
  'auth-token',
  'accessToken',
  'refreshToken',
]

/**
 *
 * Removes common auth-related keys from a storage implementation.
 *
 */
export function clearAuthStorage(storage: StorageLike, keys: readonly string[] = DEFAULT_AUTH_STORAGE_KEYS): void {
  for (const key of keys) {
    try {
      storage.removeItem(key)
    } catch {
      // ignore
    }
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.location !== 'undefined'
}

/**
 *
 * 判断是否开启调试模式（cookie: debug=true/1/yes/on）。
 *
 */
function isDebugCookieEnabled(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const raw = document.cookie ?? ''
    if (!raw) return false
    return /(?:^|;\s*)debug=(?:true|1|yes|on)(?:;|$)/i.test(raw)
  } catch {
    return false
  }
}

/**
 *
 * 尝试调用同域登出接口清除服务端 Cookie（refreshToken / accessToken / csrfToken）。
 * - 不阻塞主流程，失败直接忽略；
 * - 主要用于“refresh 失败但 refreshToken 仍残留”时避免登录页被自动跳回导致的迷惑跳转。
 *
 */
function tryLogoutViaNextRoute(): void {
  if (!isBrowser()) return
  try {
    const f = globalThis.fetch
    if (typeof f !== 'function') return
    void f('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      // 页面跳转/卸载时尽量把请求发出去（不保证一定完成）
      keepalive: true,
    }).catch(() => {})
  } catch {
    // ignore
  }
}

let hasTriggeredForceLogin = false

function defaultRedirectToLogin(url: string): void {
  if (!isBrowser()) return
  try {
    window.location.assign(url)
  } catch {
    // ignore
  }
}

function getLocalStorageSafe(): StorageLike | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export interface CreateAuthControllerOptions {
  tokenStorage?: TokenStorageLike
  authService?: AuthServiceLike
  localStorage?: StorageLike | null
  redirectToLogin?: (url: string) => void
}

export interface LogoutOptions {
  /**
   *
   * Used only for debugging/telemetry.
   *
   */
  reason?: string
}

export type AuthUser = LoginSuccess['user'] | null

/**
 *
 * Creates test-friendly auth actions.
 *
 */
export function createAuthController(options?: CreateAuthControllerOptions) {
  const tokenStorage = options?.tokenStorage ?? (TokenStorage as TokenStorageLike)
  const authService = options?.authService ?? (AuthService as unknown as AuthServiceLike)
  const storage = options?.localStorage ?? getLocalStorageSafe()
  const redirectToLogin = options?.redirectToLogin ?? defaultRedirectToLogin

  const getAccessToken = (): string | null => {
    try {
      return tokenStorage.get()
    } catch {
      return null
    }
  }

  const setAccessToken = (token: string | null): void => {
    try {
      if (token) {
        tokenStorage.set(token, { silent: false })
      } else {
        tokenStorage.clear({ reason: 'auth-cleared', silent: false })
      }
    } catch {
      // ignore
    }
  }

  const login = async (req: LoginRequest): Promise<LoginSuccess> => {
    try {
      const res = await authService.login(req)
      setAccessToken(res.accessToken)
      return res
    } catch (e) {
      // Login failed: clear any local token state but do NOT force redirect.
      setAccessToken(null)
      throw e
    }
  }

  const refresh = async (): Promise<LoginSuccess> => {
    try {
      const res = await authService.refresh()
      setAccessToken(res.accessToken)
      return res
    } catch (e) {
      setAccessToken(null)
      // refresh 失败通常意味着登录态已不可用；强制进入登录页并尝试清理残留 Cookie。
      // 使用 force=1 绕过“已登录访问 /login 自动跳回”的守卫，避免出现 /erp/* → /login → /erp/features 的迷惑跳转。
      if (isBrowser() && !hasTriggeredForceLogin) {
        hasTriggeredForceLogin = true
        if (isDebugCookieEnabled()) {
          const errLike = e as any
          console.warn('[auth] refresh 失败，强制进入登录页', {
            code: errLike?.code,
            status: errLike?.status,
          })
        }
        tryLogoutViaNextRoute()
      }
      redirectToLogin('/login?force=1')
      throw e
    }
  }

  const logout = async (opts?: LogoutOptions): Promise<void> => {
    try {
      await authService.logout()
    } catch {
      // ignore: still clear local state
    }

    try {
      tokenStorage.clear({ reason: opts?.reason ?? 'manual-logout', silent: false })
    } catch {
      // ignore
    }

    if (storage) {
      clearAuthStorage(storage)
    }

    // Use from=logout to avoid redirect loops when cookie propagation is delayed.
    redirectToLogin('/login?from=logout')
  }

  return {
    getAccessToken,
    setAccessToken,
    login,
    refresh,
    logout,
  }
}

export interface UseAuthOptions {
  redirectToLogin?: (url: string) => void
}

/**
 *
 * Auth hook:
 * - exposes auth status + actions
 * - keeps local state in sync with TokenStorage events
 * - 使用 useCallback 固定函数引用，避免依赖数组导致的循环 effect
 *
 */
export function useAuth(options?: UseAuthOptions) {
  const controller = useMemo(
    () => createAuthController({ redirectToLogin: options?.redirectToLogin }),
    [options?.redirectToLogin]
  )

  const [accessToken, setAccessTokenState] = useState<string | null>(() => controller.getAccessToken())
  const [user, setUser] = useState<AuthUser>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<unknown | null>(null)

  useEffect(() => {
    const off = (TokenStorage as TokenStorageLike).subscribe(() => {
      const next = controller.getAccessToken()
      setAccessTokenState(next)
      if (!next) setUser(null)
    })
    return () => {
      try {
        off()
      } catch {
        // ignore
      }
    }
  }, [controller])

  const status: AuthStatus = accessToken ? 'authenticated' : 'unauthenticated'

  const login = useCallback(async (req: LoginRequest): Promise<LoginSuccess> => {
    setLoading(true)
    setError(null)
    try {
      const res = await controller.login(req)
      setUser(res.user ?? null)
      setAccessTokenState(res.accessToken)
      return res
    } catch (e) {
      setUser(null)
      setAccessTokenState(null)
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [controller])

  const refresh = useCallback(async (): Promise<LoginSuccess> => {
    setLoading(true)
    setError(null)
    try {
      const res = await controller.refresh()
      setUser(res.user ?? null)
      setAccessTokenState(res.accessToken)
      return res
    } catch (e) {
      setUser(null)
      setAccessTokenState(null)
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [controller])

  const logout = useCallback(async (opts?: LogoutOptions): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      await controller.logout(opts)
      setUser(null)
      setAccessTokenState(null)
    } finally {
      setLoading(false)
    }
  }, [controller])

  const checkAuth = useCallback(async (): Promise<AuthStatus> => {
    setLoading(true)
    setError(null)
    try {
      const existing = controller.getAccessToken()
      if (existing) return 'authenticated'

      try {
        const res = await controller.refresh()
        setUser(res.user ?? null)
        setAccessTokenState(res.accessToken)
        return res.accessToken ? 'authenticated' : 'unauthenticated'
      } catch (e) {
        setUser(null)
        setAccessTokenState(null)
        setError(e)
        return 'unauthenticated'
      }
    } finally {
      setLoading(false)
    }
  }, [controller])

  return {
    status,
    accessToken,
    user,
    loading,
    error,
    login,
    checkAuth,
    refresh,
    logout,
  }
}
