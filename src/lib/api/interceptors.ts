/**
 *
 * @deprecated 兼容旧路径，请改用 `@/infrastructure/http/auth-fetch` 与 `HttpClient`。
 * 兼容层：转发到 infrastructure/http 的统一拦截实现。
 *
 */
export {
  createAuthFetch,
  getCookieValue,
  __resetRefreshInFlightForTests,
  type AuthFailureReason,
  type RefreshContext,
  type RefreshResult,
  type RefreshFn,
  type CreateAuthFetchOptions,
} from '@/infrastructure/http/auth-fetch'
