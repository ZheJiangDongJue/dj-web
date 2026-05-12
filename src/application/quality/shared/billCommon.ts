/**
 *
 * Bill 应用层共享通用工具。
 *
 */

export { extractUserFacingErrorMessage as extractErrorMessage } from '@/lib/errors/user-facing-error'
export { resolveUserFacingErrorMessage } from '@/lib/errors/user-facing-error'

/**
 *
 * 标准化为正整数。
 * @param value 输入值（可能是 number/string/其他）。
 * @returns 合法正整数；否则 null。
 *
 */
export function normalizePositiveInt(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null
  if (n > Number.MAX_SAFE_INTEGER) return null
  return n
}

function pickObjectField(obj: unknown, keys: string[]): unknown {
  if (!obj || typeof obj !== 'object') return undefined
  const record = obj as Record<string, unknown>
  for (const key of keys) {
    if (record[key] !== undefined) return record[key]
  }
  return undefined
}

/**
 *
 * 从单据表头候选键中提取 id。
 * @param bill 表头对象。
 * @returns 第一个合法的正整数 id；都没有则返回 0。
 * @remarks 候选键顺序：id / Id / ID / BillId / billId。
 *
 */
export function pickBillId(bill: unknown): number {
  const keys = ['id', 'Id', 'ID', 'BillId', 'billId']
  for (const key of keys) {
    const n = normalizePositiveInt(pickObjectField(bill, [key]))
    if (n) return n
  }
  return 0
}

