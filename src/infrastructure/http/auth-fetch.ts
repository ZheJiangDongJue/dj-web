/**
 *
 * 认证拦截器：统一附加 Authorization 头，捕获 401/403 并支持单飞刷新。
 * - 默认始终携带 credentials: 'include'
 * - 刷新过程采用单飞模式，避免并发重复刷新
 *
 */

export type AuthFailureReason = 'refresh-failed' | 'unauthorized-after-refresh'

export interface RefreshContext {
  /**
   *
   * 底层 fetch（必须是未被拦截的原始 fetch）
   *
   */
  fetch: typeof fetch
  /**
   *
   * 可选 Cookie 字符串，用于在 Node/测试环境传递 CSRF/refreshToken
   *
   */
  cookie?: string
}

export interface RefreshResult {
  accessToken: string
}

export type RefreshFn = (ctx: RefreshContext) => Promise<RefreshResult>

export interface CreateAuthFetchOptions {
  /**
   *
   * 底层 fetch，默认使用 globalThis.fetch
   *
   */
  fetch?: typeof fetch
  /**
   *
   * 读取当前 accessToken（内存/存储均可）
   *
   */
  getAccessToken: () => string | null
  /**
   *
   * 写入或清空当前 accessToken
   *
   */
  setAccessToken: (token: string | null) => void
  /**
   *
   * 调用 /refresh 获取新 token 的实现
   *
   */
  refresh: RefreshFn
  /**
   *
   * 可选 Cookie 提供者（Node/测试场景方便注入）
   *
   */
  getCookieString?: () => string | undefined
  /**
   *
   * 判断是否为认证链路请求；认证链路不应触发刷新，避免递归。
   * 默认为检测 `/api/auth/`。
   *
   */
  isAuthRequest?: (input: RequestInfo | URL) => boolean
  /**
   *
   * 刷新失败或重放依旧 401/403 时的回调（清理状态/跳转登录等）
   *
   */
  onAuthFailure?: (reason: AuthFailureReason, err?: unknown) => void
}

let refreshInFlight: Promise<string> | null = null

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}

function toUrlString(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return (input as Request).url
}

function defaultIsAuthRequest(input: RequestInfo | URL): boolean {
  return /\/api\/auth\//.test(toUrlString(input))
}

function withAuthHeader(init: RequestInit, token: string | null): RequestInit {
  const headers = new Headers(init.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  }
}

async function safeSingleFlightRefresh(
  refresh: RefreshFn,
  ctx: RefreshContext,
  onAuthFailure?: (reason: AuthFailureReason, err?: unknown) => void,
  setAccessToken?: (token: string | null) => void
): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const result = await refresh(ctx)
        if (!result?.accessToken) {
          throw new Error('EMPTY_ACCESS_TOKEN')
        }
        return result.accessToken
      } catch (e) {
        try {
          setAccessToken?.(null)
        } catch {
          // 忽略清理错误
        }
        try {
          onAuthFailure?.('refresh-failed', e)
        } catch {
          // 忽略回调错误
        }
        throw e
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

/**
 *
 * 创建带认证拦截的 fetch。
 *
 */
export function createAuthFetch(options: CreateAuthFetchOptions) {
  const baseFetch = options.fetch ?? globalThis.fetch
  if (!baseFetch) {
    throw new Error('FETCH_NOT_AVAILABLE')
  }
  const isAuthRequest = options.isAuthRequest ?? defaultIsAuthRequest

  return async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const token = options.getAccessToken()
    let res = await baseFetch(input, withAuthHeader(init, token))
    if (res.status !== 401 && res.status !== 403) return res

    if (isAuthRequest(input)) return res

    const cookie = options.getCookieString
      ? options.getCookieString()
      : isBrowser()
      ? (globalThis.document?.cookie ?? undefined)
      : undefined

    const newToken = await safeSingleFlightRefresh(
      options.refresh,
      {
        fetch: baseFetch,
        cookie,
      },
      options.onAuthFailure,
      options.setAccessToken
    )

    options.setAccessToken(newToken)

    res = await baseFetch(input, withAuthHeader(init, newToken))
    if (res.status === 401 || res.status === 403) {
      try {
        options.onAuthFailure?.('unauthorized-after-refresh')
      } catch {
        // 忽略失败
      }
    }
    return res
  }
}

/**
 *
 * 从 Cookie 字符串解析指定名称的值。
 *
 */
export function getCookieValue(cookieHeader: string, name: string): string | undefined {
  const key = `${name}=`
  const parts = cookieHeader.split(/;\s*/g)
  for (const part of parts) {
    if (!part) continue
    if (part === name) return ''
    if (part.startsWith(key)) {
      const raw = part.slice(key.length)
      try {
        return decodeURIComponent(raw)
      } catch {
        return raw
      }
    }
  }
  return undefined
}

/**
 *
 * 测试专用：重置单飞刷新状态。
 *
 */
export function __resetRefreshInFlightForTests() {
  refreshInFlight = null
}
