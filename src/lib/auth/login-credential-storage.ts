import type { AppCode } from '@/types/auth'

const STORAGE_KEY = 'dj:login-credentials:v1'

/**
 *
 * 登录页自动回填所需的账号密码快照。
 * - 仅用于提升登录便利性，不代表用户当前仍处于已认证状态。
 * - 仅在 rememberPassword 为 true 时，password 才会写入浏览器本地存储。
 * - 调用方应避免把该对象写入日志。
 *
 */
export interface SavedLoginCredentials {
  app: AppCode
  username: string
  password: string
  /** 是否持久化密码；未勾选时仅保存用户名，password 固定为空字符串。 */
  rememberPassword: boolean
  savedAt: string
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function isAppCode(value: unknown): value is AppCode {
  return value === 'erp' || value === 'oa' || value === 'bi'
}

function normalizeSavedCredentials(value: unknown): SavedLoginCredentials | null {
  if (!value || typeof value !== 'object') return null

  const raw = value as Record<string, unknown>
  if (!isAppCode(raw.app)) return null
  if (typeof raw.username !== 'string') return null
  if (typeof raw.password !== 'string') return null
  if (raw.rememberPassword !== undefined && typeof raw.rememberPassword !== 'boolean') return null
  if (typeof raw.savedAt !== 'string') return null

  return {
    app: raw.app,
    username: raw.username,
    password: raw.password,
    // 兼容此前始终保存密码的记录，避免升级后丢失用户原有的登录偏好。
    rememberPassword: raw.rememberPassword ?? true,
    savedAt: raw.savedAt,
  }
}

/**
 *
 * 读取登录页已保存的账号密码。
 * - SSR、localStorage 不可用、JSON 损坏或结构不合法时返回 null。
 * - 结构损坏时会尝试清理旧值，避免后续重复解析失败。
 *
 */
export function readSavedLoginCredentials(): SavedLoginCredentials | null {
  if (!isBrowser()) return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    const credentials = normalizeSavedCredentials(parsed)
    if (!credentials) {
      clearSavedLoginCredentials()
      return null
    }
    return credentials
  } catch {
    clearSavedLoginCredentials()
    return null
  }
}

/**
 *
 * 保存登录页自动回填所需的账号密码。
 * - 未选择记住密码时仅保存用户名与目标应用，password 会被强制写为空字符串。
 * - 仅保存表单字段，避免把后端响应或 token 等认证态混入持久化数据。
 * - localStorage 写入失败会被忽略，保证登录主流程不受影响。
 *
 */
export function saveLoginCredentials(input: {
  app: AppCode
  username: string
  password: string
  rememberPassword: boolean
}): void {
  if (!isBrowser()) return

  try {
    const payload: SavedLoginCredentials = {
      app: input.app,
      username: input.username,
      password: input.rememberPassword ? input.password : '',
      rememberPassword: input.rememberPassword,
      savedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 登录成功后的便利性写入失败不应阻断认证流程。
  }
}

/**
 *
 * 清理登录页已保存的账号密码。
 * - 当前自动记住策略不会在退出登录时调用；该函数用于损坏数据自清理与后续显式清除入口。
 *
 */
export function clearSavedLoginCredentials(): void {
  if (!isBrowser()) return

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export const LOGIN_CREDENTIAL_STORAGE_KEY = STORAGE_KEY
