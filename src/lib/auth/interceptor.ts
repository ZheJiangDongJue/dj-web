/**
 *
 * @deprecated 请直接使用 `@/infrastructure/http/auth-fetch` 或通过 `HttpClient` 注入认证拦截。
 * 兼容旧入口，内部委托到基础设施层的 createAuthFetch 与 TokenStorage。
 *
 */
import { createAuthFetch } from '@/infrastructure/http/auth-fetch'
import TokenStorage from '@/infrastructure/http/token-storage'
import { AuthService } from './service'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
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
 * 尝试通过同域登出接口清理服务端 Cookie（refreshToken / accessToken / csrfToken）。
 * - 失败直接忽略；
 * - 主要用于“refreshToken 残留导致 /login 被反向跳回”的场景。
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

function toUrlString(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return (input as Request).url
}

function pickFetch(input: RequestInfo | URL, init?: RequestInit) {
  const f = globalThis.fetch
  if (!f) {
    throw new Error('FETCH_NOT_AVAILABLE')
  }
  return f(input as any, init)
}

const authFetch = createAuthFetch({
  fetch: pickFetch as typeof fetch,
  getAccessToken: () => TokenStorage.get(),
  setAccessToken: (token) => {
    if (token) {
      TokenStorage.set(token, { silent: false })
    } else {
      TokenStorage.clear({ reason: 'auth-cleared', silent: false })
    }
  },
  refresh: async (ctx) => {
    const res = await AuthService.refresh(ctx.signal)
    return { accessToken: res.accessToken }
  },
  isAuthRequest: (input) => /\/api\/auth\//.test(toUrlString(input)),
  onAuthFailure: (reason) => {
    TokenStorage.clear({ reason })
    if (isBrowser()) {
      if (!hasTriggeredForceLogin) {
        hasTriggeredForceLogin = true
        if (isDebugCookieEnabled()) {
          console.warn('[auth-interceptor] 认证失败，强制进入登录页', { reason })
        }
        tryLogoutViaNextRoute()
      }
      try {
        window.location.assign('/login?force=1')
      } catch {
        // ignore
      }
    }
  },
})

export { authFetch }
export default authFetch
