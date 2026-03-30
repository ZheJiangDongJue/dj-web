import {
  FirstInspectionDetail as ErpFirstInspectionDetail,
  FirstInspectionDocument as ErpFirstInspectionDocument,
} from '@/types/erp-db.generated'
import { FirstInspection, type FirstInspectionId } from '@/domain/quality/fai/entities/FirstInspection'
import { FirstInspectionDetail } from '@/domain/quality/fai/entities/FirstInspectionDetail'
import { InspectionQuantitySplit } from '@/domain/quality/fqc/value-objects/InspectionQuantitySplit'
import { InspectionResult } from '@/domain/quality/fqc/value-objects/InspectionResult'
import { MeasureRecords } from '@/domain/quality/fqc/value-objects/MeasureRecords'

/**
 *
 * 首件检验加载模型。
 *
 */
export type FirstInspectionLoadModel = {
  /**
   *
   * 单据头。
   *
   */
  readonly document: unknown | null
  /**
   *
   * 明细集合。
   *
   */
  readonly details: unknown
  /**
   *
   * 当未返回 Id 时的回退值。
   *
   */
  readonly fallbackId: FirstInspectionId
}

/**
 *
 * 首件检验持久化模型。
 *
 */
export type FirstInspectionPersistenceModel = {
  /**
   *
   * 单据头 DTO。
   *
   */
  readonly document: ErpFirstInspectionDocument
  /**
   *
   * 明细 DTO 集合。
   *
   */
  readonly details: ErpFirstInspectionDetail[]
}

/**
 *
 * 首件检验 Mapper：领域模型 ↔ ERP.Db 镜像模型。
 *
 */
export class FirstInspectionMapper {

/**
 *
 * 将“原始单据头+明细”映射为领域聚合根。
 * @param model 原始模型。
 * @returns 聚合根或 null。
 *
 */
  public static toDomain(model: FirstInspectionLoadModel): FirstInspection | null {
    const document = this.isRecord(model.document) ? model.document : null
    const detailsRaw = Array.isArray(model.details) ? model.details : []

    if (!document && detailsRaw.length === 0) return null

    const resolvedId = this.toInt(this.pickNumericId(document) ?? model.fallbackId)
    const status = this.toInt(this.pickNumber(document, ['DocumentStatus', 'Status', 'status']) ?? 0)
    const createByDocumentId = this.toNullableNonZeroInt(this.pickNumber(document, ['CreateByDocumentid']))
    const createByDocumentType = this.pickString(document, ['CreateByDocumentType']) ?? ''
    const createByDetailId = this.toNullableNonZeroInt(this.pickNumber(document, ['CreateByDetailid']))
    const createByDetailType = this.pickString(document, ['CreateByDetailType']) ?? ''
    const materialId = this.toInt(this.pickNumber(document, ['Materialid']) ?? 0)
    const departmentId = this.toInt(this.pickNumber(document, ['Departmentid']) ?? 0)
    const employeeId = this.toInt(this.pickNumber(document, ['Employeeid']) ?? 0)
    const clientId = this.toInt(this.pickNumber(document, ['Clientid']) ?? 0)
    const checkMethodId = this.toInt(this.pickNumber(document, ['CheckMethodid']) ?? 0)
    const checkCaseDocumentId = this.toInt(this.pickNumber(document, ['CheckCaseDocumentid']) ?? 0)
    const handlingMethodId = this.toInt(this.pickNumber(document, ['HandlingMethodid']) ?? 0)
    const checkDeliveryTime = this.pickString(document, ['CheckDeliveryTime'])
    const result = InspectionResult.from(this.pickNumber(document, ['CheckResult']) ?? 0)
    const preCompleteBadQty = this.toNumber(this.pickNumber(document, ['PreCmpBQty']) ?? 0)

    const inspectQty = this.toInt(this.pickNumber(document, ['ChkBQty']) ?? 0)
    const okQty = this.toInt(this.pickNumber(document, ['PassBQty']) ?? 0)
    const concessionQty = this.toInt(this.pickNumber(document, ['RQty']) ?? 0)
    const ngQty = this.toInt(this.pickNumber(document, ['NotPassBQty']) ?? 0)
    const quantitySplit = this.safeQuantitySplit(inspectQty, okQty, concessionQty, ngQty)

    const cname = this.pickString(document, ['Cname']) ?? ''
    const innerKey = this.pickString(document, ['InnerKey']) ?? ''
    const severityLevel = this.toInt(this.pickNumber(document, ['SeverityLevel']) ?? 0)
    const typeOfWorkId = this.toInt(this.pickNumber(document, ['TypeofWorkid']) ?? 0)
    const qty = this.toNumber(this.pickNumber(document, ['Qty']) ?? 0)

    const details = this.mapDetails(detailsRaw)

    return new FirstInspection({
      id: resolvedId,
      createByDocumentId,
      createByDocumentType,
      createByDetailId,
      createByDetailType,
      status,
      materialId,
      departmentId,
      employeeId,
      clientId,
      checkMethodId,
      checkCaseDocumentId,
      handlingMethodId,
      checkDeliveryTime,
      result,
      preCompleteBadQty,
      quantitySplit,
      cname,
      innerKey,
      severityLevel,
      typeOfWorkId,
      qty,
      details,
    })
  }

  /**
   *
   * 将领域聚合映射为 ERP.Db DTO。
   * @param entity 领域聚合。
   * @returns 持久化模型。
   *
   */
  public static toPersistence(entity: FirstInspection): FirstInspectionPersistenceModel {
    const doc = new ErpFirstInspectionDocument()
    if (typeof (doc as any).initDefaults === 'function') (doc as any).initDefaults()

    const quantity = entity.quantitySplit.toObject()

    ;(doc as any).id = entity.id > 0 ? entity.id : 0
    ;(doc as any).Status = entity.status
    ;(doc as any).DocumentStatus = entity.status
    ;(doc as any).CreateByDocumentid = entity.createByDocumentId ?? null
    ;(doc as any).CreateByDocumentType = entity.createByDocumentType
    ;(doc as any).CreateByDetailid = entity.createByDetailId ?? null
    ;(doc as any).CreateByDetailType = entity.createByDetailType
    ;(doc as any).Materialid = entity.materialId
    ;(doc as any).Departmentid = entity.departmentId
    ;(doc as any).Employeeid = entity.employeeId
    ;(doc as any).Clientid = entity.clientId
    ;(doc as any).CheckMethodid = entity.checkMethodId
    ;(doc as any).CheckCaseDocumentid = entity.checkCaseDocumentId
    ;(doc as any).HandlingMethodid = entity.handlingMethodId
    ;(doc as any).CheckDeliveryTime = entity.checkDeliveryTime
    ;(doc as any).CheckResult = entity.result.value
    ;(doc as any).PreCmpBQty = entity.preCompleteBadQty
    ;(doc as any).ChkBQty = quantity.inspectQuantity
    ;(doc as any).PassBQty = quantity.okQuantity
    ;(doc as any).RQty = quantity.concessionQuantity
    ;(doc as any).NotPassBQty = quantity.ngQuantity
    ;(doc as any).Cname = entity.cname
    ;(doc as any).InnerKey = entity.innerKey
    ;(doc as any).SeverityLevel = entity.severityLevel
    ;(doc as any).TypeofWorkid = entity.typeOfWorkId
    ;(doc as any).Qty = entity.qty

    const details = entity.details.map((detail) => {
      const dto = new ErpFirstInspectionDetail()
      if (typeof (dto as any).initDefaults === 'function') (dto as any).initDefaults()

      const quantitySplit = detail.quantitySplit.toObject()
      const measured = detail.measureRecords.toFixedLength()

      ;(dto as any).id = detail.id > 0 ? detail.id : 0
      ;(dto as any).ProjectName = detail.projectName
      ;(dto as any).Content = detail.content
      ;(dto as any).ChkBQty = quantitySplit.inspectQuantity
      ;(dto as any).PassBQty = quantitySplit.okQuantity
      ;(dto as any).PassRate = this.ensurePassRate(detail.passRate, quantitySplit.inspectQuantity, quantitySplit.okQuantity)
      ;(dto as any).CheckResult = detail.result.value
      ;(dto as any).AQL = detail.aql
      ;(dto as any).ACRE = detail.acre
      ;(dto as any).Method = detail.method
      ;(dto as any).Frequency = detail.frequency
      ;(dto as any).MeasuredRecord1 = measured[0]
      ;(dto as any).MeasuredRecord2 = measured[1]
      ;(dto as any).MeasuredRecord3 = measured[2]
      ;(dto as any).MeasuredRecord4 = measured[3]
      ;(dto as any).MeasuredRecord5 = measured[4]
      ;(dto as any).DownQValue = detail.downQValue
      ;(dto as any).UpQValue = detail.upQValue
      ;(dto as any).CmpQValue = detail.cmpQValue

      return dto
    })

    return { document: doc, details }
  }

  /**
   *
   * 映射明细数组。
   * @param details 原始明细。
   * @returns 领域明细列表。
   *
   */
  private static mapDetails(details: readonly unknown[]): FirstInspectionDetail[] {
    const usedIds = new Set<number>()
    let nextTempId = -1

    const result: FirstInspectionDetail[] = []
    for (const item of details) {
      if (!this.isRecord(item)) continue

      const candidateId = this.pickNumericId(item)
      let idToUse = typeof candidateId === 'number' ? this.toInt(candidateId) : 0
      if (idToUse === 0 || usedIds.has(idToUse)) {
        while (usedIds.has(nextTempId)) nextTempId -= 1
        idToUse = nextTempId
        nextTempId -= 1
      }
      usedIds.add(idToUse)

      const inspectQty = this.toInt(this.pickNumber(item, ['ChkBQty']) ?? 0)
      const okQty = this.toInt(this.pickNumber(item, ['PassBQty']) ?? 0)
      const quantitySplit = this.safeQuantitySplit(inspectQty, okQty, 0, Math.max(0, inspectQty - okQty))

      const measureRecords = MeasureRecords.from([
        this.pickString(item, ['MeasuredRecord1']) ?? '',
        this.pickString(item, ['MeasuredRecord2']) ?? '',
        this.pickString(item, ['MeasuredRecord3']) ?? '',
        this.pickString(item, ['MeasuredRecord4']) ?? '',
        this.pickString(item, ['MeasuredRecord5']) ?? '',
      ])

      result.push(
        new FirstInspectionDetail({
          id: idToUse,
          projectName: this.pickString(item, ['ProjectName']) ?? '',
          content: this.pickString(item, ['Content']) ?? '',
          quantitySplit,
          result: InspectionResult.from(this.pickNumber(item, ['CheckResult']) ?? 0),
          aql: this.pickString(item, ['AQL']) ?? '',
          acre: this.pickString(item, ['ACRE']) ?? '',
          method: this.pickString(item, ['Method']) ?? '',
          frequency: this.pickString(item, ['Frequency']) ?? '',
          measureRecords,
          downQValue: this.pickString(item, ['DownQValue']) ?? '',
          upQValue: this.pickString(item, ['UpQValue']) ?? '',
          cmpQValue: this.pickString(item, ['CmpQValue']) ?? '',
          passRate: this.toNumber(this.pickNumber(item, ['PassRate']) ?? 0),
        }),
      )
    }

    return result
  }

  /**
   *
   * 判断值是否为 Record。
   * @param value 任意值。
   * @returns Record 返回 true。
   *
   */
  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }

  /**
   *
   * 提取数字 Id。
   * @param value 对象。
   * @returns 数字或 null。
   *
   */
  private static pickNumericId(value: unknown): number | null {
    if (!this.isRecord(value)) return null
    const candidates = [(value as any).id, (value as any).Id, (value as any).ID]
    for (const raw of candidates) {
      const n = typeof raw === 'number' ? raw : Number(raw)
      if (Number.isFinite(n) && n > 0) return n
    }
    return null
  }

  /**
   *
   * 按候选键提取数字。
   * @param value 对象。
   * @param keys 键名列表。
   * @returns 数字或 null。
   *
   */
  private static pickNumber(value: unknown, keys: readonly string[]): number | null {
    if (!this.isRecord(value)) return null
    const record = value as Record<string, unknown>
    const keyIndex = this.buildCaseInsensitiveKeyIndex(record)
    for (const key of keys) {
      const raw = this.pickCaseInsensitiveValue(record, key, keyIndex)
      if (raw === undefined || raw === null) continue
      const n = typeof raw === 'number' ? raw : Number(raw)
      if (Number.isFinite(n)) return n
    }
    return null
  }

  /**
   *
   * 按候选键提取字符串。
   * @param value 对象。
   * @param keys 键名列表。
   * @returns 字符串或 null。
   *
   */
  private static pickString(value: unknown, keys: readonly string[]): string | null {
    if (!this.isRecord(value)) return null
    const record = value as Record<string, unknown>
    const keyIndex = this.buildCaseInsensitiveKeyIndex(record)
    for (const key of keys) {
      const raw = this.pickCaseInsensitiveValue(record, key, keyIndex)
      if (raw === undefined || raw === null) continue
      return typeof raw === 'string' ? raw : String(raw)
    }
    return null
  }

  /**
   *
   * 构建大小写不敏感的键索引：lowerKey -> originalKey。
   * @param record 源对象。
   *
   */
  private static buildCaseInsensitiveKeyIndex(record: Record<string, unknown>): Record<string, string> {
    const index: Record<string, string> = Object.create(null) as any
    for (const key of Object.keys(record)) {
      index[key.toLowerCase()] = key
    }
    return index
  }

  /**
   *
   * 大小写不敏感地读取字段值：优先精确键，其次 camelCase（首字母小写），最后回退到 lowerKey 索引。
   * @param record 源对象。
   * @param key 目标键名（模板/类型定义中的键名）。
   * @param keyIndex 由 buildCaseInsensitiveKeyIndex 生成的索引。
   *
   */
  private static pickCaseInsensitiveValue(
    record: Record<string, unknown>,
    key: string,
    keyIndex: Record<string, string>,
  ): unknown {
    if (Object.prototype.hasOwnProperty.call(record, key)) return record[key]

    const camelKey = key.length > 0 ? `${key[0]!.toLowerCase()}${key.slice(1)}` : key
    if (camelKey !== key && Object.prototype.hasOwnProperty.call(record, camelKey)) return record[camelKey]

    const hit = keyIndex[key.toLowerCase()]
    if (hit && Object.prototype.hasOwnProperty.call(record, hit)) return record[hit]
    return undefined
  }

  /**
   *
   * 安全创建数量拆分。
   * @param inspect 检验数。
   * @param ok 合格数。
   * @param concession 让步数。
   * @param ng NG 数。
   * @returns 值对象。
   *
   */
  private static safeQuantitySplit(inspect: number, ok: number, concession: number, ng: number): InspectionQuantitySplit {
    const normalizedInspect = this.toInt(inspect)
    const normalizedOk = this.toInt(ok)
    const normalizedConcession = this.toInt(concession)
    const normalizedNg = this.toInt(ng)
    const sum = normalizedOk + normalizedConcession + normalizedNg
    const inspectQuantity = sum === normalizedInspect ? normalizedInspect : sum
    return InspectionQuantitySplit.create({
      inspectQuantity,
      okQuantity: normalizedOk,
      concessionQuantity: normalizedConcession,
      ngQuantity: normalizedNg,
    })
  }

  /**
   *
   * 归一化整数。
   * @param value 输入。
   * @returns 非负整数。
   *
   */
  private static toInt(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n) || n < 0) return 0
    return Math.trunc(n)
  }

  /**
   *
   * 归一化数字。
   * @param value 输入。
   * @returns 非负数。
   *
   */
  private static toNumber(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n) || n < 0) return 0
    return n
  }

  /**
   *
   * 归一化可空整数（0 视为 null，保留 -1 场景）。
   * @param value 输入。
   * @returns 整数或 null。
   *
   */
  private static toNullableNonZeroInt(value: unknown): number | null {
    if (value === undefined || value === null) return null
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null
    if (n === 0) return null
    return n
  }

  /**
   *
   * 计算合格率。
   * @param passRate 原始合格率。
   * @param inspectQty 检验数。
   * @param okQty 合格数。
   * @returns 合格率。
   *
   */
  private static ensurePassRate(passRate: number, inspectQty: number, okQty: number): number {
    const normalized = this.toNumber(passRate)
    if (normalized > 0) return normalized
    if (inspectQty <= 0) return 0
    return Math.round((okQty / inspectQty) * 10000) / 100
  }
}
