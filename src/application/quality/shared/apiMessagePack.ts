/**
 *
 * ApiMessagePack 解析的兼容性工具集。
 * @remarks
 * - 统一处理 PascalCase/camelCase 字段；
 * - 统一处理 data/Data 嵌套；
 * - 提供 Document/Details 与 success/message 的标准提取。
 *
 */

/**
 *
 * 按候选键顺序选择第一个非 undefined 的字段值。
 * @param obj 对象。
 * @param keys 候选键名。
 * @returns 第一个命中的字段值；不存在则返回 undefined。
 *
 */
export function pickField<T = unknown>(obj: unknown, ...keys: string[]): T | undefined {
  if (!obj || typeof obj !== 'object') return undefined
  const record = obj as Record<string, unknown>
  for (const key of keys) {
    if (record[key] !== undefined) return record[key] as T
  }
  return undefined
}

/**
 *
 * 提取 ApiMessagePack 的 data 容器。
 * @param pack 任意返回包。
 * @returns data 对象；非对象返回 null。
 * @remarks 优先 data → Data → 根对象。
 *
 */
export function unwrapDataContainer(pack: unknown): Record<string, unknown> | null {
  if (!pack || typeof pack !== 'object') return null
  const root = pack as Record<string, unknown> & { data?: unknown; Data?: unknown }
  const inner = (root.data ?? root.Data) as Record<string, unknown> | undefined
  if (inner && typeof inner === 'object') return inner
  return root as Record<string, unknown>
}

/**
 *
 * 从 ApiMessagePack 中提取 Document + Details。
 * @param pack 任意返回包。
 * @returns 提取结果；当 document 与 details 都为空时返回 null。
 *
 */
export function pickDocumentAndDetails<TDoc, TDetail>(
  pack: unknown,
): DocumentAndDetails<TDoc, TDetail> | null {
  if (!pack || typeof pack !== 'object') return null
  const root = pack as Record<string, unknown>
  const data = unwrapDataContainer(pack) ?? {}

  const document = (pickField<TDoc>(data, 'Document', 'document') ?? null) as TDoc | null
  const rawDetails = pickField<unknown>(data, 'Details', 'details')
  const details = (Array.isArray(rawDetails) ? rawDetails : []) as TDetail[]
  const messageRaw = pickField<unknown>(root, 'message', 'Message') ?? pickField<unknown>(data, 'message', 'Message')
  const message = typeof messageRaw === 'string' ? messageRaw : messageRaw == null ? undefined : String(messageRaw)

  if (!document && details.length === 0) return null
  return { document, details, message }
}

/**
 *
 * 解析审批接口返回。
 * @param res 任意返回包。
 * @returns 标准化的 success/message。
 *
 */
export function parseApprovalResponse(res: unknown): { readonly success: boolean; readonly message: string } {
  const successRaw = pickField<unknown>(res, 'issuccess', 'isSuccess', 'success', 'Success')
  const messageRaw = pickField<unknown>(res, 'message', 'Message', 'errorMessage', 'ErrorMessage', 'msg')
  const success = typeof successRaw === 'boolean' ? successRaw : false
  const message = typeof messageRaw === 'string' ? messageRaw : messageRaw == null ? '' : String(messageRaw)
  return { success, message }
}

/**
 *
 * ApiMessagePack 中提取到的 Document + Details 结果。
 *
 */
export type DocumentAndDetails<TDoc, TDetail> = {
  readonly document: TDoc | null
  readonly details: TDetail[]
  readonly message?: string
}

