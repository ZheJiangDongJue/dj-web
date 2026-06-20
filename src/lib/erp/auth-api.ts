/**
 *
 * Auth API（与后端 AuthApiController 对齐）
 * 说明：
 * - 后端：ERP.WebApi / Controllers / Api / AuthApi.cs
 * - 路由：/api/AuthApi/[action]
 *
 * 设计目标：
 * - 为 dj-web 提供“行为角色权限（PageName + Permissions）”的最小调用封装；
 * - 让前端可基于 PageName 判断“模块/功能入口”的可见性；
 * - 避免在业务组件中散落拼 URL/拼 query 的细节。
 *
 */

import { BillApiClient } from './bill-api.client'
import { DEFAULT_DB_NAME } from '@/lib/config'
import { Permissions } from '@/types/erp-db.generated'

/**
 *
 * 指向 /api/AuthApi 的客户端（复用 authFetch：自动附加 Authorization，401/403 自动刷新）。
 *
 */
const _client = new BillApiClient({ controllerPath: '/api/AuthApi' })

/**
 *
 * 将后端权限检查结果收窄为严格布尔值。
 * - 兼容旧接口/中间层可能返回的字符串 `"true"` / `"false"`。
 * - 其他异常形态一律按无权限处理，避免把 truthy 字符串误判为放行。
 * @param value 后端返回的原始权限结果
 * @returns 是否拥有指定权限
 *
 */
function normalizeAuthResult(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return false

  const text = value.trim().toLowerCase()
  if (text === 'true') return true
  if (text === 'false') return false
  return false
}

export interface CheckAuthInput {
  /**
   *
   * 账套名（dbName）；未提供时使用 DEFAULT_DB_NAME。
   *
   */
  dbName?: string
  /**
   *
   * 用户 id（userId）。
   *
   */
  userId: number
  /**
   *
   * 页面标识（PageName）；必须与后端权限系统完全一致。
   *
   */
  pageName: string
  /**
   *
   * 需要校验的权限位（Permissions 枚举），默认使用 Permissions.浏览。
   *
   */
  auth?: Permissions
}

/**
 *
 * 判断用户是否拥有指定页面的某项权限。
 * - 对应后端：GET /api/AuthApi/CheckAuth?dbName=...&userId=...&pageName=...&auth=...
 * - 注意：后端内部会调用 `AuthModel.GetAuth(dbName, userId)` 获取 PageName->Permissions 的权限 Map 并进行 HasFlag 判定。
 *
 */
export async function CheckAuth(input: CheckAuthInput): Promise<boolean> {
  const dbName = (input.dbName ?? DEFAULT_DB_NAME).trim()
  const userId = Number(input.userId)
  const pageName = String(input.pageName ?? '').trim()
  const auth = (input.auth ?? Permissions.浏览) as unknown as number

  if (!dbName || !Number.isFinite(userId) || userId <= 0 || !pageName) {
    return false
  }

  const result = await _client.callAction<unknown>('CheckAuth', {
    method: 'GET',
    query: { dbName, userId, pageName, auth },
  })
  return normalizeAuthResult(result)
}

const _checkAuthCache = new Map<string, Promise<boolean>>()

/**
 *
 * 带缓存的权限检查：
 * - 同一会话内对同一 (dbName,userId,pageName,auth) 仅发起一次网络请求；
 * - 适用于“入口列表”场景（一次需要检查多个 PageName）。
 *
 */
export function CheckAuthCached(input: CheckAuthInput): Promise<boolean> {
  const dbName = (input.dbName ?? DEFAULT_DB_NAME).trim()
  const userId = Number(input.userId)
  const pageName = String(input.pageName ?? '').trim()
  const auth = (input.auth ?? Permissions.浏览) as unknown as number
  const key = `${dbName}::${userId}::${pageName}::${auth}`

  const existing = _checkAuthCache.get(key)
  if (existing) return existing

  const p = CheckAuth({ dbName, userId, pageName, auth: auth as Permissions }).catch((err) => {
    // 失败不缓存（避免因为临时网络波动导致“永远无权限”）
    _checkAuthCache.delete(key)
    throw err
  })

  _checkAuthCache.set(key, p)
  return p
}

/**
 *
 * 清空权限检查缓存（一般不需要调用）。
 * - 适用于：切换用户/账套，或明确知道权限数据已变更并希望强制刷新。
 *
 */
export function clearCheckAuthCache(): void {
  _checkAuthCache.clear()
}
