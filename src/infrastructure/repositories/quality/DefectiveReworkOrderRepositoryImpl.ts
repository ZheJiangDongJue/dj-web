import { GetBillWithDetails } from '@/lib/erp/bill-api'
import {
  approveNcrBill,
  deleteNcrBill,
  extractNcrBillId,
  NCR_TABLE_NAME,
  saveNcrBill,
  unapproveNcrBill,
} from '@/app/features/erp/quality/ncr/models/ncrService'
import type { ApiMessagePack, DbChangedPackResult } from '@/types/api'
import {
  DefectiveReworkOrder,
  type DefectiveReworkOrderId,
  type DefectiveReworkOrderRepository,
  type DefectiveReworkOrderRepositoryActionResult,
} from '@/domain/quality/ncr/repositories/DefectiveReworkOrderRepository'
import { DefectiveReworkOrderMapper } from './mappers/defectiveReworkOrderMapper'

/**
 *
 * NCR 不合格返工单仓储（基础设施实现）。
 * @remarks
 * - 本实现作为适配层：对外提供领域仓储接口，对内调用既有 <c>ncrService</c>。\\n
 * - 本阶段完成“强类型领域模型”的最小映射：DTO → 聚合根 / 聚合根 → DTO。\\n
 *
 */
 export class DefectiveReworkOrderRepositoryImpl implements DefectiveReworkOrderRepository {

/**
 *
 * 按 Id 获取不合格返工单（含明细）。
 * @param id 单据主键。
 * @returns 存在返回聚合；不存在返回 null。
 *
 */
  public async getById(id: DefectiveReworkOrderId): Promise<DefectiveReworkOrder | null> {
    const pack = await GetBillWithDetails<{
      Document?: unknown | null
      Details?: unknown
    }>({
      tableName: NCR_TABLE_NAME,
      billId: Number(id),
    } as any)

    const anyPack = pack as unknown as ApiMessagePack<unknown>
    const payload = (anyPack?.data ?? anyPack) as Record<string, unknown> | null

    const documentRaw = (payload?.Document as unknown) ?? (payload?.document as unknown) ?? null
    const detailsRaw = (payload?.Details as unknown) ?? (payload?.details as unknown) ?? []
    return DefectiveReworkOrderMapper.toDomain({
      document: documentRaw,
      details: detailsRaw,
      fallbackId: Number(id),
    })
  }

  /**
   *
   * 保存不合格返工单（新增/修改）。
   * @param entity 聚合对象。
   * @returns 保存后的聚合对象（通常包含后端生成的 Id）。
   *
   */
  public async save(entity: DefectiveReworkOrder): Promise<DefectiveReworkOrder> {
    const { bill, details } = DefectiveReworkOrderMapper.toErpSaveDto(entity)

    const res = await saveNcrBill(bill, details)
    const billId = extractNcrBillId(res) ?? 0
    if (billId > 0 && billId !== entity.id) {
      return entity.withId(billId)
    }
    return entity
  }

  /**
   *
   * 审批不合格返工单。
   * @param id 单据主键。
   * @returns 领域操作结果。
   *
   */
  public async approve(id: DefectiveReworkOrderId): Promise<DefectiveReworkOrderRepositoryActionResult> {
    const pack = await approveNcrBill(Number(id))
    return mapApiMessagePackToResult(pack)
  }

  /**
   *
   * 反审批不合格返工单。
   * @param id 单据主键。
   * @returns 领域操作结果。
   *
   */
  public async unapprove(id: DefectiveReworkOrderId): Promise<DefectiveReworkOrderRepositoryActionResult> {
    const pack = await unapproveNcrBill(Number(id))
    return mapApiMessagePackToResult(pack)
  }

  /**
   *
   * 删除不合格返工单。
   * @param id 单据主键。
   * @returns 领域操作结果。
   *
   */
  public async delete(id: DefectiveReworkOrderId): Promise<DefectiveReworkOrderRepositoryActionResult> {
    const res = await deleteNcrBill(Number(id))
    return mapDbChangedResultToResult(res)
  }
}

/**
 *
 * 将 ApiMessagePack 映射为领域操作结果。
 * @param pack ApiMessagePack。
 * @returns 领域操作结果。
 *
 */
function mapApiMessagePackToResult(pack: ApiMessagePack<unknown>): DefectiveReworkOrderRepositoryActionResult {
  const anyPack = pack as Record<string, unknown>
  const success = typeof anyPack.success === 'boolean' ? anyPack.success : false
  const messageRaw = anyPack.message
  const message = typeof messageRaw === 'string' ? messageRaw : messageRaw == null ? '' : String(messageRaw)
  const code = (anyPack.code ?? anyPack.status ?? anyPack.detailCode) as number | string | undefined
  return { success, message, code }
}

/**
 *
 * 将 DbChangedPackResult 映射为领域操作结果。
 * @remarks
 * - 兼容多种返回字段：effectCount/isSuccess/success/message/errorMessage。\\n
 * @param res DbChangedPackResult。
 * @returns 领域操作结果。
 *
 */
function mapDbChangedResultToResult(res: DbChangedPackResult): DefectiveReworkOrderRepositoryActionResult {
  const anyRes = res as Record<string, unknown>

  const effectCountRaw = (anyRes.effectCount ?? anyRes.EffectCount) as unknown
  const effectCount = typeof effectCountRaw === 'number' ? effectCountRaw : Number(effectCountRaw)
  const hasEffectCount = Number.isFinite(effectCount)

  const isSuccessRaw = anyRes.isSuccess ?? anyRes.IsSuccess
  const successRaw = anyRes.success ?? anyRes.Success
  /* istanbul ignore next */
  const success =
    hasEffectCount
      ? effectCount > 0
      : typeof isSuccessRaw === 'boolean'
        ? isSuccessRaw
        : typeof successRaw === 'boolean'
          ? successRaw
          : false

  const messageRaw =
    anyRes.errorMessage ??
    anyRes.ErrorMessage ??
    anyRes.message ??
    anyRes.Message
  /* istanbul ignore next */
  const message = typeof messageRaw === 'string' ? messageRaw : messageRaw == null ? '' : String(messageRaw)

  return { success, message }
}
