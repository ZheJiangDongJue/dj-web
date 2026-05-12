import { DocumentStatus } from '@/types/erp-db.generated'

/**
 *
 * 状态位包含判断。
 * @param status 当前状态值。
 * @param flag 待匹配的标记位。
 *
 */
export function hasStatusFlag(status: number, flag: number): boolean {
  return status === flag || (status & flag) !== 0
}

/**
 *
 * "锁定类"状态检测。
 * @param status 状态值。
 * @returns 命中的标记名（已冻结/已结案/已作废），未命中返回 null。
 *
 */
export function detectLockingStatus(status: number): '已冻结' | '已结案' | '已作废' | null {
  if (hasStatusFlag(status, DocumentStatus.已冻结)) return '已冻结'
  if (hasStatusFlag(status, DocumentStatus.已结案)) return '已结案'
  if (hasStatusFlag(status, DocumentStatus.已作废)) return '已作废'
  return null
}

/**
 *
 * 通用审批校验。
 * @param status 当前状态。
 * @param billId 单据主键（null/0 视为未保存）。
 * @returns 校验结果。
 *
 */
export function validateApproveStatus(
  status: number,
  billId: number | null,
): { readonly ok: true } | { readonly ok: false; readonly message: string } {
  const locking = detectLockingStatus(status)
  if (locking) return { ok: false, message: `当前单据${locking}，无法审批` }
  if (hasStatusFlag(status, DocumentStatus.已审批)) {
    return { ok: false, message: '当前单据已审批，无法重复审批' }
  }
  if (!billId || billId <= 0) return { ok: false, message: '审批前请先保存单据' }
  return { ok: true }
}

/**
 *
 * 通用反审批校验。
 * @param status 当前状态。
 * @returns 校验结果。
 *
 */
export function validateUnapproveStatus(
  status: number,
): { readonly ok: true } | { readonly ok: false; readonly message: string } {
  const locking = detectLockingStatus(status)
  if (locking) return { ok: false, message: `当前单据${locking}，无法反审批` }
  if (!hasStatusFlag(status, DocumentStatus.已审批)) {
    return { ok: false, message: '当前单据未审批，无法反审批' }
  }
  return { ok: true }
}

