import type { ApiEnvelope, ApiError } from '@/types/auth'
import { extractUserFacingErrorMessage } from '@/lib/errors/user-facing-error'

const AUTH_BASE = '/api/auth'

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function toApiError(code: string | number | undefined, message?: string): ApiError {
  // 安全文案映射（隐藏敏感细节）
  const map: Record<string, string> = {
    AUTH_INVALID_CREDENTIALS: '用户名或密码错误',
    AUTH_INACTIVE: '账号未激活，请检查邮箱验证邮件',
    TOKEN_EXPIRED: '登录状态已过期，请重新登录',
    TOKEN_INVALID: '登录状态已过期，请重新登录',
    AUTH_THIRD_PARTY_FAILED: '第三方登录失败，请尝试其他登录方式',
    NETWORK_ERROR: '网络异常，请稍后重试',
    UNKNOWN_ERROR: '发生错误，请稍后重试',
  }
  const finalCode = typeof code === 'string' ? code : code != null ? String(code) : 'UNKNOWN_ERROR'
  const normalizedMessage = typeof message === 'string' && message.trim() ? message.trim() : null
  const finalMsg = normalizedMessage ?? map[finalCode] ?? map.UNKNOWN_ERROR
  // 不回显后端内部 message，避免泄露敏感信息
  void message
  return { code: finalCode, message: finalMsg }
}

function isApiError(x: unknown): x is ApiError {
  return typeof x === 'object' && x !== null && 'code' in x && 'message' in x
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${AUTH_BASE}${path}`
  const headers = new Headers(init.headers || {})
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  try {
    const res = await fetch(url, { ...init, headers, credentials: 'include' })
    const raw = await res.text()
    const json = safeJsonParse<ApiEnvelope<T>>(raw)

    if (!json) {
      if (res.ok) {
        // 成功但非预期格式
        throw toApiError('UNKNOWN_ERROR')
      }
      // 失败且无法解析错误体
      throw toApiError('UNKNOWN_ERROR')
    }

    if (res.ok && json.success) {
      // 成功：返回有效负载
      if (typeof json.data === 'undefined' || json.data === null) {
        // 后端成功但无 data，视为协议不一致
        throw toApiError('UNKNOWN_ERROR')
      }
      return json.data as T
    }

    // HTTP 非 2xx 或业务失败：统一为 ApiError
    throw toApiError(json.code, extractUserFacingErrorMessage(json) ?? json.message ?? undefined)
  } catch (e) {
    // Fetch 异常/超时/网络错误
    const err = e as unknown
    if (isApiError(err)) {
      throw err
    }
    throw toApiError('NETWORK_ERROR')
  }
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'GET', ...(init ?? {}) }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...(init ?? {}) }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...(init ?? {}) }),
  del: <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'DELETE', ...(init ?? {}) }),
}

export type { ApiError }

