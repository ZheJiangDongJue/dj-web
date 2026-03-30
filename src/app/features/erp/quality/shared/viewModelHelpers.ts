import { toNonNegInt as toNonNegIntUtil } from '@/lib/documents/inspection'
import type { UserInfo } from '@/lib/erp/bill-api'
import { DocumentStatus } from '@/types/erp-db.generated'

type HasStatusFlagFn = (status: DocumentStatus | number, flag: DocumentStatus) => boolean

/**
 *
 * 统一将输入值转换为非负整数。
 * @param value 可能为 number、空字符串或 undefined 的输入值。
 * @returns 非负整数，非法值与负数会被归一为 0。
 *
 */
export function toSafeNonNegInt(value: number | '' | undefined): number {
  return toNonNegIntUtil(value as any)
}

/**
 *
 * 从 localStorage 中读取 ERP 用户信息。
 * @returns 若存在合法用户信息则返回对应对象，否则返回空对象。
 *
 */
export function getErpUserFromStorage(): UserInfo {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem('erp:userInfo') ?? window.localStorage.getItem('userInfo')
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 *
 * 根据单据状态生成审批相关禁用标记。
 * @param status 当前单据状态，支持枚举值或数字值。
 * @param hasStatusFlagFn 状态位判定函数。
 * @returns 锁定标记与审批/反审批禁用标记。
 *
 */
export function buildStatusLocks(
  status: DocumentStatus | number,
  hasStatusFlagFn: HasStatusFlagFn,
): { isLocked: boolean; approveDisabled: boolean; unapproveDisabled: boolean; editingDisabled: boolean } {
  // 冻结/结案/作废：完全锁定
  const locked =
    hasStatusFlagFn(status, DocumentStatus.已冻结) ||
    hasStatusFlagFn(status, DocumentStatus.已结案) ||
    hasStatusFlagFn(status, DocumentStatus.已作废)

  return {
    isLocked: locked,
    approveDisabled: locked || hasStatusFlagFn(status, DocumentStatus.已审批),
    unapproveDisabled: locked || hasStatusFlagFn(status, DocumentStatus.未审批),
    // 已审批 或 完全锁定 时，进入只读
    editingDisabled: locked || hasStatusFlagFn(status, DocumentStatus.已审批),
  }
}

/**
 *
 * 基于 aria-label 选取元素并执行滚动与聚焦。
 * @param label aria-label 值。
 *
 */
export function scrollAndFocusByAriaLabel(label: string): void {
  if (typeof window === 'undefined') return
  try {
    const el = document.querySelector<HTMLElement>(`[aria-label="${label}"]`)
    if (el) {
      try {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      } catch {}
      try {
        el.focus()
      } catch {}
    }
  } catch {}
}
