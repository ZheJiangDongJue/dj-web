import { API_BASE } from '@/lib/config'
import TokenStorage from '@/lib/auth/token-storage'
import type { ApiEnvelope, LoginSuccess } from '@/types/auth'
import {
  createAuthFetch,
  getCookieValue,
  type AuthFailureReason,
  type RefreshContext,
  type RefreshFn,
} from './interceptors'

export interface ApiClientErrorLike {
  code?: string | number
  status?: number
  url?: string
}

/**
 *
 * Minimal API client error (keeps only safe information).
 *
 */
export class ApiClientError extends Error implements ApiClientErrorLike {
  code?: string | number
  status?: number
  url?: string

  constructor(message: string, opts?: ApiClientErrorLike) {
    super(message)
    this.name = 'ApiClientError'
    this.code = opts?.code
    this.status = opts?.status
    this.url = opts?.url
  }
}

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function toQueryString(query?: Record<string, unknown>): string {
  if (!query) return ''
  const parts: string[] = []
  for (const [key, raw] of Object.entries(query)) {
    if (raw === undefined || raw === null) continue
    const enc = (v: unknown) => encodeURIComponent(String(v))
    if (Array.isArray(raw)) {
      for (const v of raw) parts.push(`${encodeURIComponent(key)}=${enc(v)}`)
    } else {
      parts.push(`${encodeURIComponent(key)}=${enc(raw)}`)
    }
  }
  return parts.length ? `?${parts.join('&')}` : ''
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}

function getCookieStringSafe(): string {
  if (!isBrowser()) return ''
  try {
    return document.cookie || ''
  } catch {
    return ''
  }
}

/**
 *
 * 判断是否开启调试模式（cookie: debug=true/1/yes/on）。
 *
 */
function isDebugCookieEnabled(cookie: string): boolean {
  if (!cookie) return false
  return /(?:^|;\s*)debug=(?:true|1|yes|on)(?:;|$)/i.test(cookie)
}

/**
 *
 * 尝试通过同域登出接口清理服务端 Cookie（refreshToken / accessToken / csrfToken）。
 * - 不依赖 authFetch，避免递归刷新；
 * - 失败直接忽略（例如网络异常/被卸载中断）。
 *
 */
function tryLogoutViaNextRoute(fetchImpl: typeof fetch | undefined): void {
  if (!fetchImpl) return
  try {
    void fetchImpl('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      keepalive: true,
    }).catch(() => {})
  } catch {
    // ignore
  }
}

let hasTriggeredAuthFailureRedirect = false

/**
 *
 * Reads `accessToken` from a cookie string.
 *
 */
export function getAccessTokenFromCookie(cookieHeader: string): string | null {
  const v = getCookieValue(cookieHeader, 'accessToken')
  return v && v.trim() ? v : null
}

/**
 *
 * Reads `csrfToken` from a cookie string.
 *
 */
export function getCsrfTokenFromCookie(cookieHeader: string): string | undefined {
  const v = getCookieValue(cookieHeader, 'csrfToken')
  return v && v.trim() ? v : undefined
}

/**
 *
 * Default refresh: calls Next proxy `/api/auth/refresh`.
 * - Adds `X-Csrf-Token` if `csrfToken` cookie exists.
 *
 */
export async function refreshViaNextAuthProxy(ctx: RefreshContext): Promise<LoginSuccess> {
  const cookie = ctx.cookie ?? getCookieStringSafe()
  const csrf = cookie ? getCsrfTokenFromCookie(cookie) : undefined

  const headers = new Headers({
    Accept: 'application/json',
  })
  if (csrf) headers.set('X-Csrf-Token', csrf)

  const res = await ctx.fetch('/api/auth/refresh', {
    method: 'POST',
    headers,
    credentials: 'include',
    cache: 'no-store',
    signal: ctx.signal,
  })

  const raw = await res.text()
  const json = safeJsonParse<ApiEnvelope<LoginSuccess>>(raw)
  if (!json) {
    throw new ApiClientError('Refresh failed', { status: res.status, url: '/api/auth/refresh' })
  }

  const ok = !!json.success && res.ok
  const data = json.data
  if (ok && data?.accessToken) {
    return data
  }

  throw new ApiClientError('Refresh failed', {
    code: json.code,
    status: res.status,
    url: '/api/auth/refresh',
  })
}

export interface ApiClientOptions {
  /**
   *
   * Backend base URL (defaults to API_BASE).
   *
   */
  baseUrl?: string
  /**
   *
   * Custom fetch (tests/special env).
   *
   */
  fetch?: typeof fetch
  /**
   *
   * Custom token getter.
   *
   */
  getAccessToken?: () => string | null
  /**
   *
   * Custom token setter.
   *
   */
  setAccessToken?: (token: string | null) => void
  /**
   *
   * Custom refresh implementation.
   *
   */
  refresh?: RefreshFn
  /**
   *
   * Cookie provider for refresh/tests.
   *
   */
  getCookieString?: () => string | undefined
  /**
   *
   * Called when auth fails (cleanup + redirect).
   *
   */
  onAuthFailure?: (reason: AuthFailureReason, err?: unknown) => void
}

export interface JsonRequestOptions {
  query?: Record<string, unknown>
  headers?: Record<string, string>
  signal?: AbortSignal
  cache?: RequestCache
}

/**
 *
 * Unified API client:
 * - Uses API_BASE by default
 * - Injects auth header and auto-refreshes on 401/403
 *
 */
export class ApiClient {
  private readonly baseUrl: string
  private readonly authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

  constructor(options?: ApiClientOptions) {
    this.baseUrl = (options?.baseUrl ?? API_BASE).replace(/\/$/, '')
    const baseFetch = options?.fetch ?? globalThis.fetch

    const getAccessToken = options?.getAccessToken ?? (() => {
      try {
        const mem = TokenStorage.get()
        if (mem) return mem
      } catch {
        // ignore
      }
      // Cookie fallback (in case backend also writes an accessToken cookie)
      return getAccessTokenFromCookie(getCookieStringSafe())
    })

    const setAccessToken = options?.setAccessToken ?? ((token) => {
      try {
        if (token) {
          TokenStorage.set(token, { silent: false })
        } else {
          TokenStorage.clear({ reason: 'auth-cleared', silent: false })
        }
      } catch {
        // ignore
      }
    })

    const refresh: RefreshFn = options?.refresh ?? (async (ctx) => {
      const data = await refreshViaNextAuthProxy(ctx)
      return { accessToken: data.accessToken }
    })

    const onAuthFailure = options?.onAuthFailure ?? ((reason, err) => {
      // 默认：清空本地 token，并强制进入登录页（浏览器环境）。
      // 说明：当 refresh 失败或刷新后仍 401/403 时，常见原因是 refreshToken 已过期/失效，但 Cookie 仍残留；
      // 此时直接跳 /login 会被 middleware 与登录页的“已登录守卫”反向跳回（最终落到 /erp/features），造成迷惑行为。
      // 使用 force=1 显式绕过守卫，并尽量调用 /api/auth/logout 清理残留 Cookie。
      try {
        setAccessToken(null)
      } catch {
        // ignore
      }
      if (isBrowser()) {
        if (!hasTriggeredAuthFailureRedirect) {
          hasTriggeredAuthFailureRedirect = true
          const cookie = getCookieStringSafe()
          const debug = isDebugCookieEnabled(cookie)
          if (debug) {
            const errLike = err as any
            console.warn('[api] 认证失败，强制进入登录页', {
              reason,
              code: errLike?.code,
              status: errLike?.status,
              url: errLike?.url,
            })
          }
          tryLogoutViaNextRoute(baseFetch)
        }
        const url = '/login?force=1'
        try {
          window.location.assign(url)
        } catch {
          // ignore
        }
      }
      void reason
    })

    this.authFetch = createAuthFetch({
      fetch: options?.fetch,
      getAccessToken,
      setAccessToken,
      refresh,
      getCookieString: options?.getCookieString,
      onAuthFailure,
    })
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const base = this.baseUrl.replace(/\/$/, '')
    const normalized = path.startsWith('/') ? path : `/${path}`
    const url = new URL(normalized, base)
    const qs = toQueryString(query)
    return `${url.toString()}${qs}`
  }

  /**
   *
   * Sends a request with auth interceptors.
   *
   */
  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const url = /^https?:\/\//i.test(path) ? path : this.buildUrl(path)
    return this.authFetch(url, init)
  }

  /**
   *
   * GET JSON. Throws ApiClientError on non-2xx or invalid JSON.
   *
   */
  async getJson<T>(path: string, opts?: JsonRequestOptions): Promise<T> {
    const url = this.buildUrl(path, opts?.query)
    const headers = new Headers(opts?.headers)
    if (!headers.has('Accept')) headers.set('Accept', 'application/json')

    const res = await this.authFetch(url, {
      method: 'GET',
      headers,
      signal: opts?.signal,
      cache: opts?.cache ?? 'no-store',
    })

    if (!res.ok) {
      throw new ApiClientError('Request failed', { status: res.status, url })
    }

    const raw = await res.text()
    const json = safeJsonParse<T>(raw)
    if (!json) {
      throw new ApiClientError('Invalid JSON', { status: res.status, url })
    }
    return json
  }

  /**
   *
   * POST JSON. Throws ApiClientError on non-2xx or invalid JSON.
   *
   */
  async postJson<T>(path: string, body?: unknown, opts?: JsonRequestOptions): Promise<T> {
    const url = this.buildUrl(path, opts?.query)
    const headers = new Headers(opts?.headers)
    if (!headers.has('Accept')) headers.set('Accept', 'application/json')
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

    const res = await this.authFetch(url, {
      method: 'POST',
      headers,
      body: body == null ? undefined : JSON.stringify(body),
      signal: opts?.signal,
      cache: opts?.cache ?? 'no-store',
    })

    if (!res.ok) {
      throw new ApiClientError('Request failed', { status: res.status, url })
    }

    const raw = await res.text()
    const json = safeJsonParse<T>(raw)
    if (!json) {
      throw new ApiClientError('Invalid JSON', { status: res.status, url })
    }
    return json
  }
}

/**
 *
 * Default instance.
 *
 */
export const apiClient = new ApiClient()
