/**
 *
 * 通用 API 响应信封（对齐后端 ApiMessagePack 的最小公共形态）
 * 说明：
 * - 各模块的后端接口通常使用统一的响应包装结构（ApiMessagePack）。
 * - 字段命名遵循后端返回（swagger 中的 ApiMessagePack），前端仅作最小宽松约束：
 *   - code/status/detailCode 允许 number|string，以兼容不同后端实现
 *   - message 可为 null/undefined
 *   - data 为泛型有效负载，允许为 null
 *
 */
export interface ApiMessagePack<T = unknown> {
  /**
   *
   * HTTP 状态或语义状态码（对齐后端 HttpStatusCode，允许 number|string 以兼容差异）
   *
   */
  status?: number | string
  /**
   *
   * 业务码/状态码（后端可能为 HttpStatusCode 或业务码字符串）
   *
   */
  code?: number | string
  /**
   *
   * 是否成功（优先依据此字段判断）
   *
   */
  success?: boolean
  /**
   *
   * 细分业务码（可选）
   *
   */
  detailCode?: number | string
  /**
   *
   * 提示信息（可展示的安全文案）
   *
   */
  message?: string | null
  /**
   *
   * 有效负载（成功时通常返回）
   *
   */
  data?: T | null
  /**
   *
   * 向前兼容的扩展字段
   *
   */
  [key: string]: unknown
}

/**
 *
 * 前端常用别名（与设计文档中的 ApiEnvelope 等价）。
 *
 */
export type ApiEnvelope<T = unknown> = ApiMessagePack<T>

/**
 *
 * 数据变更类响应（通用结构，对齐后端 DbChangedPackResult 的最小形态）
 * - 多用于“保存/删除/启用”等改写类接口
 * - 仅做最小约束，保留扩展字段
 *
 */
export interface DbChangedPackResult {
  /**
   *
   * 是否成功
   *
   */
  isSuccess?: boolean
  /**
   *
   * 错误消息（失败时可能返回）
   *
   */
  errorMessage?: string | null
  /**
   *
   * 向前兼容的扩展字段
   *
   */
  [key: string]: unknown
}

/**
 *
 * 判断给定对象是否“看起来像”ApiMessagePack。
 * @param x 任意输入
 * @returns 若具备典型字段（success/code/message）则返回 true
 *
 */
export function isApiMessagePack(x: unknown): x is ApiMessagePack<unknown> {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return 'success' in o && 'code' in o && 'message' in o
}

/**
 *
 * 解包 ApiMessagePack.data（容错：若不存在则返回 null）。
 * @param pack ApiMessagePack 对象
 * @returns data 或 null
 *
 */
export function unwrapData<T>(pack: ApiMessagePack<T>): T | null {
  return (pack?.data ?? null) as T | null
}

/**
 *
 * 断言成功并返回 data，否则抛出带 code/message 的 Error。
 * @param pack ApiMessagePack 对象
 * @throws Error 当 success=false 或未提供时抛出，包含 code/message
 *
 */
export function ensureSuccess<T>(pack: ApiMessagePack<T>): T {
  const ok = !!pack?.success
  if (ok) {
    return (pack.data as T)
  }
  const err = new Error(String(pack?.message ?? '请求失败')) as Error & {
    code?: number | string
    status?: number | string
  }
  err.code = pack?.code
  err.status = pack?.status
  throw err
}
