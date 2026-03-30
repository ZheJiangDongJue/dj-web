import type { LoginRequest, LoginSuccess, AuthenticateRequest } from '@/types/auth'
import { api } from './api'

/**
 *
 * 从浏览器 Cookie 中读取 CSRF 令牌。
 * - 仅在客户端环境有效；SSR 下返回 undefined。
 * - 若未找到或解析失败则返回 undefined。
 *
 */
function getCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined
  try {
    const cookie = document.cookie || ''
    const match = cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/)
    return match ? decodeURIComponent(match[1]) : undefined
  } catch {
    return undefined
  }
}

/**
 *
 * 前端认证服务：login / refresh / logout
 * - 通过 Next.js 代理路由 `/api/auth/*` 与后端交互
 * - 统一错误映射（抛出 ApiError）
 * - 不进行本地持久化；AccessToken 后续交由 TokenStorage（任务 3）管理
 *
 */
export class AuthService {
  static async login(req: LoginRequest): Promise<LoginSuccess> {
    // 将表单结构映射为后端所需的 AuthenticateRequest
    const defaultDb = (process.env.NEXT_PUBLIC_DB_NAME || 'ERP_Default').trim()
    const payload: AuthenticateRequest = {
      dbName: (req.dbName ?? defaultDb).trim(),
      loginId: (req.username ?? '').trim(),
      password: req.password ?? '',
    }

    // 完全切换到 /authenticate；
    // 上游代理可通过 ERP_AUTH_UPSTREAM_PREFIX=api/login 指向后端 LoginApiEx。
    return api.post<LoginSuccess>('/authenticate', payload)
  }

  /**
   *
   * 使用 HttpOnly refreshToken 刷新访问令牌。
   * - 自动携带 CSRF 令牌头（若存在）。
   * - 返回包含新的 accessToken/refreshToken/expiresAt。
   *
   */
  static async refresh(): Promise<LoginSuccess> {
    const csrf = getCsrfToken()
    const init = csrf ? { headers: { 'X-Csrf-Token': csrf } } : undefined
    return api.post<LoginSuccess>('/refresh', undefined, init)
  }

  static async logout(): Promise<void> {
    // 成功返回不关心载荷，仅需确认无错误
    await api.post<unknown>('/logout')
  }
}

