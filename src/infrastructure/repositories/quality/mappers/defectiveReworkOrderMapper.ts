import {
  DefectiveReworkOrderDetail as ErpDefectiveReworkOrderDetail,
  DefectiveReworkOrderDocument as ErpDefectiveReworkOrderDocument,
} from '@/types/erp-db.generated'
import { DefectiveReworkOrder, type DefectiveReworkOrderId } from '@/domain/quality/ncr/entities/DefectiveReworkOrder'
import { DefectiveReworkOrderDetail as DomainDefectiveReworkOrderDetail } from '@/domain/quality/ncr/entities/DefectiveReworkOrderDetail'
import { ErpDateTime } from '@/domain/quality/ncr/value-objects/ErpDateTime'
import { Quantity } from '@/domain/quality/ncr/value-objects/Quantity'
import { ReworkOrderStatus } from '@/domain/quality/ncr/value-objects/ReworkOrderStatus'

/**
 *
 * 不合格返工单的读取映射输入。
 * @remarks
 * - WebApi 的 JSON 反序列化结果通常是 Plain Object，而非 <c>erp-db.generated</c> 中的 class 实例；\\n
 * - 因此此处入参采用 <c>unknown</c> 并做容错解析。\\n
 *
 */
 export type DefectiveReworkOrderLoadModel = {

/**
 *
 * 单据头（可空）。
 *
 */
  readonly document: unknown | null
  /**
   *
   * 明细列表（可能为 unknown）。
   *
   */
  readonly details: unknown
  /**
   *
   * 当单据头缺失 Id 时的回退 Id。
   *
   */
  readonly fallbackId: DefectiveReworkOrderId
}

/**
 *
 * 不合格返工单的保存映射输出（ERP.Db 镜像 DTO）。
 *
 */
 export type DefectiveReworkOrderErpSaveDto = {

/**
 *
 * 单据头 DTO。
 *
 */
  readonly bill: ErpDefectiveReworkOrderDocument
  /**
   *
   * 明细 DTO 列表。
   *
   */
  readonly details: ErpDefectiveReworkOrderDetail[]
}

/**
 *
 * 不合格返工单 Mapper（领域模型 ↔ ERP.Db 镜像模型）。
 * @remarks
 * - 仅负责字段映射与值对象展开/重建，不负责网络调用或 UI 提示；\\n
 * - 写入侧输出使用 <c>erp-db.generated</c> 的 DTO class，确保字段名与后端一致；\\n
 * - 读取侧允许接收 Plain Object（例如来自 ApiMessagePack.Data）。\\n
 *
 */
 export class DefectiveReworkOrderMapper {

/**
 *
 * 将“单据头 + 明细”映射为领域聚合根。
 * @param model 读取映射输入。
 * @returns 聚合根；当单据头与明细同时为空时返回 null。
 *
 */
  public static toDomain(model: DefectiveReworkOrderLoadModel): DefectiveReworkOrder | null {
    const document = this.isRecord(model.document) ? model.document : null
    const details = Array.isArray(model.details) ? model.details : []

    if (!document && details.length === 0) {
      return null
    }

    const resolvedId = this.toNonNegativeSafeInt(this.pickNumericId(document) ?? model.fallbackId, 0)

    const statusValue = this.toNonNegativeSafeInt(this.pickNumber(document, ['status', 'Status']) ?? 0, 0)
    const inspectorEmployeeId = this.toNonNegativeSafeInt(this.pickNumber(document, ['Employeeid']) ?? 0, 0)
    const defectiveProcessId = this.toNonNegativeSafeInt(this.pickNumber(document, ['TypeofWorkid']) ?? 0, 0)

    const deliveryTime = ErpDateTime.fromNullable(this.pickStringOrNull(document, ['DeliveryTime']))
    const repairTime = ErpDateTime.fromNullable(this.pickStringOrNull(document, ['RepairTime']))

    const preCompleteBadQty = Quantity.from(
      this.toNonNegativeSafeInt(this.pickNumber(document, ['PreCmpBQty']) ?? 0, 0),
    )
    const checkBadQty = Quantity.from(this.toNonNegativeSafeInt(this.pickNumber(document, ['ChkBQty']) ?? 0, 0))
    const passBadQty = Quantity.from(this.toNonNegativeSafeInt(this.pickNumber(document, ['PassBQty']) ?? 0, 0))
    const reworkQty = Quantity.from(this.toNonNegativeSafeInt(this.pickNumber(document, ['RQty']) ?? 0, 0))
    const notPassBadQty = Quantity.from(
      this.toNonNegativeSafeInt(this.pickNumber(document, ['NotPassBQty']) ?? 0, 0),
    )

    const domainDetails = this.mapDetailsToDomain(details)

    return new DefectiveReworkOrder({
      id: resolvedId,
      status: ReworkOrderStatus.from(statusValue),
      inspectorEmployeeId,
      defectiveProcessId,
      deliveryTime,
      repairTime,
      preCompleteBadQty,
      checkBadQty,
      passBadQty,
      reworkQty,
      notPassBadQty,
      details: domainDetails,
    })
  }

  /**
   *
   * 将领域聚合映射为 ERP.Db 镜像 DTO（用于保存）。
   * @param entity 领域聚合。
   * @returns 保存 DTO（单据头 + 明细）。
   *
   */
  public static toErpSaveDto(entity: DefectiveReworkOrder): DefectiveReworkOrderErpSaveDto {
    return {
      bill: this.mapDomainOrderToDto(entity),
      details: entity.details.map((d) => this.mapDomainDetailToDto(d)),
    }
  }

  /**
   *
   * 判断值是否为 Record（非 null 的对象）。
   * @param value 任意值。
   * @returns 若为 Record 返回 true，否则返回 false。
   *
   */
  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }

  /**
   *
   * 从未知对象中提取常见的主键字段（兼容 id/Id/ID）。
   * @param value 未知对象。
   * @returns 若解析到 &gt;0 的数字则返回该值，否则返回 null。
   *
   */
  private static pickNumericId(value: unknown): number | null {
    if (!this.isRecord(value)) return null
    const candidates: unknown[] = [(value as any).id, (value as any).Id, (value as any).ID]
    for (const v of candidates) {
      const n = typeof v === 'number' ? v : Number(v)
      if (Number.isFinite(n) && n > 0) return n
    }
    return null
  }

  /**
   *
   * 从对象中按键名获取数字值（兼容数字/字符串数字）。
   * @param value 未知对象。
   * @param keys 候选键名列表。
   * @returns 数字或 null。
   *
   */
  private static pickNumber(value: unknown, keys: readonly string[]): number | null {
    if (!this.isRecord(value)) return null
    for (const k of keys) {
      const raw = (value as any)[k]
      const n = typeof raw === 'number' ? raw : Number(raw)
      if (Number.isFinite(n)) return n
    }
    return null
  }

  /**
   *
   * 从对象中按键名获取字符串或 null。
   * @param value 未知对象。
   * @param keys 候选键名列表。
   * @returns 字符串或 null。
   *
   */
  private static pickStringOrNull(value: unknown, keys: readonly string[]): string | null {
    if (!this.isRecord(value)) return null
    for (const k of keys) {
      const raw = (value as any)[k]
      if (typeof raw === 'string') return raw
      if (raw == null) return null
      // 某些后端可能返回非 string 的可读值（例如 number），此处兜底转字符串
      return String(raw)
    }
    return null
  }

  /**
   *
   * 将未知值归一化为非负安全整数。
   * @param value 任意值。
   * @param fallback 回退值。
   * @returns 非负安全整数。
   *
   */
  private static toNonNegativeSafeInt(value: unknown, fallback: number): number {
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > Number.MAX_SAFE_INTEGER) {
      return fallback
    }
    return n
  }

  /**
   *
   * 将“未知 DTO 明细数组”映射为领域明细实体列表。
   * @remarks
   * - 领域明细要求 Id 唯一且非 0；\\n
   * - 若 DTO 中缺少有效 Id（或出现重复），则以 -1、-2... 生成临时 Id。\\n
   * @param details 未知明细数组。
   * @returns 领域明细实体列表。
   *
   */
  private static mapDetailsToDomain(details: readonly unknown[]): DomainDefectiveReworkOrderDetail[] {
    const usedIds = new Set<number>()
    let nextTempId = -1

    const result: DomainDefectiveReworkOrderDetail[] = []

    for (const item of details) {
      if (!this.isRecord(item)) continue

      const candidateId = this.pickNumericId(item)
      let idToUse = typeof candidateId === 'number' ? Math.trunc(candidateId) : 0

      if (!Number.isInteger(idToUse) || idToUse === 0 || usedIds.has(idToUse)) {
        while (usedIds.has(nextTempId)) nextTempId -= 1
        idToUse = nextTempId
        nextTempId -= 1
      }

      usedIds.add(idToUse)

      const rawDesc = (item as any).Adversesituation
      const desc = typeof rawDesc === 'string' ? rawDesc : rawDesc == null ? null : String(rawDesc)

      result.push(DomainDefectiveReworkOrderDetail.fromNullableDescription(idToUse, desc))
    }

    return result
  }

  /**
   *
   * 将领域聚合映射为 ERP.Db 镜像单据头 DTO。
   * @param entity 领域聚合。
   * @returns ERP 单据头 DTO。
   *
   */
  private static mapDomainOrderToDto(entity: DefectiveReworkOrder): ErpDefectiveReworkOrderDocument {
    const doc = new ErpDefectiveReworkOrderDocument()
    if (typeof (doc as any).initDefaults === 'function') (doc as any).initDefaults()

    const id = entity.id > 0 ? entity.id : 0
    ;(doc as any).id = id

    ;(doc as any).Status = entity.status.value
    ;(doc as any).Employeeid = entity.inspectorEmployeeId
    ;(doc as any).TypeofWorkid = entity.defectiveProcessId

    ;(doc as any).DeliveryTime = entity.deliveryTime ? entity.deliveryTime.formatErp() : null
    ;(doc as any).RepairTime = entity.repairTime ? entity.repairTime.formatErp() : null

    ;(doc as any).PreCmpBQty = entity.preCompleteBadQty.value
    ;(doc as any).ChkBQty = entity.checkBadQty.value
    ;(doc as any).PassBQty = entity.passBadQty.value
    ;(doc as any).RQty = entity.reworkQty.value
    ;(doc as any).NotPassBQty = entity.notPassBadQty.value

    return doc
  }

  /**
   *
   * 将领域明细映射为 ERP.Db 镜像明细 DTO。
   * @param detail 领域明细实体。
   * @returns ERP 明细 DTO。
   *
   */
  private static mapDomainDetailToDto(detail: DomainDefectiveReworkOrderDetail): ErpDefectiveReworkOrderDetail {
    const dto = new ErpDefectiveReworkOrderDetail()
    if (typeof (dto as any).initDefaults === 'function') (dto as any).initDefaults()

    const id = detail.id > 0 ? detail.id : 0
    ;(dto as any).id = id
    ;(dto as any).Adversesituation = detail.defectDescriptionText

    return dto
  }
}

