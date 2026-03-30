/**
 *
 * 认证与接口契约类型（前端）
 * 注意：不在前端持久化敏感信息，AccessToken 仅保存在内存中
 * 请求载荷对齐：与 ERP.Server/WebApiServer/Api/LoginApiEx.cs 保持字段与命名一致
 * - AuthenticateRequest: { dbName, loginId, password }
 * - RefreshRequest: { refreshToken }
 * - LogoutRequest: { token }
 * - ThirdPartyAuthRequest: { dbName, provider, code }
 *
 */

// 目标子应用编码（无效/缺省默认 erp）
export type AppCode = 'erp' | 'oa' | 'bi'

// 登录提供者（与后端枚举语义对齐）
export type Provider = 'Credential' | 'WeChat' | 'DingTalk' | 'LDAP' | 'SSO'

import type { ApiMessagePack } from '@/types/api'

// 统一响应包装（对齐后端 ApiMessagePack）
export type ApiEnvelope<T> = ApiMessagePack<T>

// 登录请求（表单输入：用于前端表单与服务层的适配结构）
export interface LoginRequest {
  /**
   *
   * 用户名（Credential 模式必填）
   *
   */
  username?: string
  /**
   *
   * 密码（Credential 模式必填）
   *
   */
  password?: string
  /**
   *
   * 登录提供者，默认 'Credential'
   *
   */
  provider?: Provider
  /**
   *
   * 登录来源应用：erp/oa/bi（用于后端路由/审计）
   *
   */
  app?: AppCode
  /**
   *
   * 第三方模式可能需要的访问令牌（例如 WeChat）
   *
   */
  accessToken?: string
  /**
   *
   * 第三方模式可能使用的权限范围
   *
   */
  scope?: string
  /**
   *
   * 可选：直传租户/数据库名；若未提供，将在服务层从环境变量或默认值填充。
   * 对齐后端字段名：dbName
   *
   */
  dbName?: string
}

// ===== 与后端 LoginApiEx.cs 的请求载荷保持一致（字段名使用后端示例中的 camelCase） =====

/**
 *
 * POST /api/login/authenticate
 * 与后端 AuthenticateRequest 相等
 *
 */
export interface AuthenticateRequest {
  /**
   *
   * 租户/数据库名，例如: ERP_Default
   *
   */
  dbName: string
  /**
   *
   * 登录号（用户名或工号），例如: admin / 10001
   *
   */
  loginId: string
  /**
   *
   * 登录密码（明文）
   *
   */
  password: string
}

/**
 *
 * POST /api/login/refresh
 * 与后端 RefreshRequest 相等
 *
 */
export interface RefreshRequest {
  /**
   *
   * 刷新凭据（来自登录响应的 refreshToken）
   *
   */
  refreshToken: string
}

/**
 *
 * POST /api/login/logout
 * 与后端 LogoutRequest 相等
 *
 */
export interface LogoutRequest {
  /**
   *
   * 欲撤销的令牌（accessToken 或 refreshToken）
   *
   */
  token: string
}

/**
 *
 * POST /api/login/third-party
 * 与后端 ThirdPartyAuthRequest 相等
 *
 */
export interface ThirdPartyAuthRequest {
  /**
   *
   * 租户/数据库名，例如: ERP_Default
   *
   */
  dbName: string
  /**
   *
   * 第三方提供商（示例：WeChat）
   *
   */
  provider: string
  /**
   *
   * 第三方回调 code
   *
   */
  code: string
}

// 登录成功负载（对齐后端 LoginApiEx.cs 的 Data 字段）
// Authenticate/Refresh 返回：{ accessToken, refreshToken, expiresAt }
// ThirdParty 额外返回：{ provider, providerUserId }
export interface LoginSuccess {
  /**
   *
   * 访问令牌（短期使用，前端仅存内存）
   *
   */
  accessToken: string
  /**
   *
   * 刷新令牌（通常由后端以 Cookie 管理；此处按后端响应返回）
   *
   */
  refreshToken: string
  /**
   *
   * 访问令牌过期时间（ISO 字符串）
   *
   */
  expiresAt: string
  /**
   *
   * 第三方提供商（第三方登录时返回）
   *
   */
  provider?: string
  /**
   *
   * 第三方用户标识（第三方登录时返回）
   *
   */
  providerUserId?: string
  /**
   *
   * 用户信息
   *
   */
  user: { id: number, name: string }
}

// 统一错误结构（前端消费用）
export interface ApiError {
  /**
   *
   * 业务码，如 AUTH_INVALID_CREDENTIALS、AUTH_INACTIVE、TOKEN_EXPIRED 等
   *
   */
  code: string
  /**
   *
   * 安全可展示消息（不包含敏感细节）
   *
   */
  message: string
}

