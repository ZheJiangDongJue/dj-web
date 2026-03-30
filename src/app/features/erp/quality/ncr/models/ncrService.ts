import {
  GeneralBillApproval,
  GeneralBillDelete,
  GeneralBillSave,
  type GeneralBillApprovalInput,
  type GeneralBillDeleteInput,
  type GeneralBillSaveInput,
  type ApiMessagePack,
  type DbChangedPackResult,
  type UserInfo,
} from '@/lib/erp/bill-api'
import type {
  DefectiveReworkOrderDetail,
  DefectiveReworkOrderDocument,
} from '@/types/erp-db.generated'

/**
 *
 * NCR（不合格品评审）在 BillApi 中使用的表名。
 * - 需与后端 GeneralBill* 系列接口中的 tableName 参数保持一致。
 * - 后端约定表名：DefectiveReworkOrderDocument。
 *
 */
export const NCR_TABLE_NAME = 'DefectiveReworkOrderDocument' as const

/**
 *
 * 从 localStorage 中读取 ERP 用户信息。
 * @returns 若存在合法用户信息则返回对应对象，否则返回空对象。
 *
 */
function getErpUserFromStorage(): UserInfo {
  if (typeof window === 'undefined') return {}
  try {
    const raw =
      window.localStorage.getItem('erp:userInfo') ??
      window.localStorage.getItem('userInfo')
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as UserInfo) : {}
  } catch {
    return {}
  }
}

/**
 *
 * 保存 NCR 单据（对接 ERP.WebApi 的 GeneralBillSave）。
 * @param bill   ERP.Db 镜像单据实体（DefectiveReworkOrderDocument）。
 * @param details ERP.Db 镜像明细列表（DefectiveReworkOrderDetail 数组）。
 * @returns 后端返回的数据库变更结果。
 *
 */
export async function saveNcrBill(
  bill: DefectiveReworkOrderDocument,
  details: DefectiveReworkOrderDetail[],
): Promise<DbChangedPackResult> {
  const payload: GeneralBillSaveInput = {
    tableName: NCR_TABLE_NAME,
    user: getErpUserFromStorage(),
    bill,
    details,
  }
  return GeneralBillSave(payload)
}

/**
 *
 * 审批 NCR 单据（对接 ERP.WebApi 的 GeneralBillApproval，isApprove = true）。
 * @param billId 单据主键 ID。
 * @returns 包含审批结果与消息的 ApiMessagePack。
 *
 */
export async function approveNcrBill(
  billId: number,
): Promise<ApiMessagePack> {
  const payload: GeneralBillApprovalInput = {
    tableName: NCR_TABLE_NAME,
    user: getErpUserFromStorage(),
    billId,
    isApprove: true,
    useNewFramework: false
  }
  return GeneralBillApproval(payload)
}

/**
 *
 * 反审批 NCR 单据（对接 ERP.WebApi 的 GeneralBillApproval，isApprove = false）。
 * @param billId 单据主键 ID。
 * @returns 包含反审批结果与消息的 ApiMessagePack。
 *
 */
export async function unapproveNcrBill(
  billId: number,
): Promise<ApiMessagePack> {
  const payload: GeneralBillApprovalInput = {
    tableName: NCR_TABLE_NAME,
    user: getErpUserFromStorage(),
    billId,
    isApprove: false,
    useNewFramework: false
  }
  return GeneralBillApproval(payload)
}

/**
 *
 * 删除 NCR 单据（对接 ERP.WebApi 的 GeneralBillDelete）。
 * @param billId 单据主键 ID。
 * @returns 数据库变更结果，包含受影响行数与错误消息等信息。
 *
 */
export async function deleteNcrBill(
  billId: number,
): Promise<DbChangedPackResult> {
  const payload: GeneralBillDeleteInput = {
    tableName: NCR_TABLE_NAME,
    user: getErpUserFromStorage(),
    billId,
  }
  return GeneralBillDelete(payload)
}

/**
 *
 * 从保存/删除等接口返回的结果中兜底提取 NCR 单据主键 ID。
 * - 兼容常见字段命名：id/Id/ID/billId/BillId/billid 以及嵌套在 data 内的同名字段。
 * @param result 后端返回的任意结果对象（通常为 DbChangedPackResult 或其扩展）。
 * @returns 若能解析到 >0 的数字 ID 则返回该值，否则返回 null。
 *
 */
export function extractNcrBillId(result: unknown): number | null {
  if (!result || typeof result !== 'object') return null

  const pack = result as Record<string, unknown> & {
    objects?: Record<string, unknown> | null
  }

  const candidates: unknown[] = [
    pack.billId,
    pack.BillId,
    pack.billid,
    pack.objects?.billId,
    pack.objects?.BillId,
    pack.objects?.billid,
    pack.objects?.id,
    pack.objects?.Id,
    pack.objects?.ID,
  ]

  for (const v of candidates) {
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isFinite(n) && n > 0) return n
  }

  return null
}

