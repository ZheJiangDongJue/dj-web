import { GetBillWithDetails, GeneralBillDelete, GeneralBillSave } from '@/lib/erp/bill-api'
import { getItemsExSafe } from '@/lib/erp/lookup-core'
import { DEFAULT_DB_NAME } from '@/lib/config'
import { getErpUserFromStorage } from '@/app/features/erp/quality/shared/helpers'
import type { ApiMessagePack, DbChangedPackResult } from '@/types/api'
import {
  type FirstInspection,
  type FirstInspectionFindConditions,
  type FirstInspectionId,
  type FirstInspectionRepository,
  type FirstInspectionRepositoryActionResult,
} from '@/domain/quality/fai/repositories/FirstInspectionRepository'
import { FirstInspectionMapper } from './mappers/firstInspectionMapper'

const TABLE_NAME = 'FirstInspectionDocument'

/**
 *
 * 首件检验仓储（基础设施实现）。
 *
 */
export class FirstInspectionRepositoryImpl implements FirstInspectionRepository {

/**
 *
 * 按 Id 获取首件检验。
 * @param id 单据主键。
 * @returns 聚合根或 null。
 *
 */
  public async findById(id: FirstInspectionId): Promise<FirstInspection | null> {
    const pack = await GetBillWithDetails<{
      Document?: unknown | null
      Details?: unknown
    }>({
      tableName: TABLE_NAME,
      billId: this.toInt(id),
    } as any)

    const anyPack = pack as unknown as ApiMessagePack<unknown>
    const payload = (anyPack?.data ?? anyPack) as Record<string, unknown> | null

    const document = (payload?.Document as unknown) ?? (payload?.document as unknown) ?? null
    const details = (payload?.Details as unknown) ?? (payload?.details as unknown) ?? []

    return FirstInspectionMapper.toDomain({
      document,
      details,
      fallbackId: this.toInt(id),
    })
  }

  /**
   *
   * 按条件查询首件检验列表。
   * @param conditions 查询条件。
   * @returns 聚合根列表。
   *
   */
  public async findByConditions(conditions: FirstInspectionFindConditions): Promise<FirstInspection[]> {
    const getter = await getItemsExSafe()
    const where = this.buildWhere(conditions)
    const take = this.toInt(conditions.take ?? 20)

    const rows = (await getter({
      dbName: conditions.dbName ?? DEFAULT_DB_NAME,
      table: TABLE_NAME,
      select: ['id'],
      orderBy: 'id desc',
      where,
      take: take > 0 ? take : 20,
    } as any)) as Array<Record<string, unknown>>

    const idsFromQuery = Array.isArray(rows)
      ? rows
          .map((r) => this.toInt((r as any)?.id ?? (r as any)?.Id ?? (r as any)?.ID))
          .filter((n) => n > 0)
      : []

    const mergedIds = conditions.ids ? [...conditions.ids, ...idsFromQuery] : idsFromQuery
    const uniqueIds = Array.from(new Set(mergedIds.map((n) => this.toInt(n))))

    const result: FirstInspection[] = []
    for (const billId of uniqueIds) {
      const entity = await this.findById(billId)
      if (entity) result.push(entity)
    }
    return result
  }

  /**
   *
   * 保存首件检验（新增/修改）。
   * @param entity 聚合根。
   * @returns 保存后的聚合根。
   *
   */
  public async save(entity: FirstInspection): Promise<FirstInspection> {
    const dto = FirstInspectionMapper.toPersistence(entity)
    const res = await GeneralBillSave({
      tableName: TABLE_NAME,
      user: getErpUserFromStorage(),
      bill: dto.document,
      details: dto.details,
    })

    const billId = this.extractBillId(res)
    if (billId > 0 && billId !== entity.id) {
      return entity.withId(billId)
    }
    return entity
  }

  /**
   *
   * 删除首件检验。
   * @param id 单据主键。
   * @returns 操作结果。
   *
   */
  public async delete(id: FirstInspectionId): Promise<FirstInspectionRepositoryActionResult> {
    const res = await GeneralBillDelete({
      tableName: TABLE_NAME,
      user: getErpUserFromStorage(),
      billId: this.toInt(id),
    })
    return this.mapDbChangedResult(res)
  }

  /**
   *
   * 构建通用查询条件。
   * @param conditions 查询条件。
   * @returns where 对象。
   *
   */
  private buildWhere(conditions: FirstInspectionFindConditions): Record<string, unknown> {
    const where: Record<string, unknown> = { DeletedTag: 0 }
    if (conditions.status !== undefined) where.DocumentStatus = this.toInt(conditions.status)
    if (conditions.employeeId !== undefined) where.Employeeid = this.toInt(conditions.employeeId)
    if (conditions.materialId !== undefined) where.Materialid = this.toInt(conditions.materialId)
    if (conditions.typeOfWorkId !== undefined) where.TypeofWorkid = this.toInt(conditions.typeOfWorkId)
    if (conditions.innerKey) where.InnerKey = conditions.innerKey
    if (conditions.ids && conditions.ids.length > 0) where.Id = conditions.ids.map((n) => this.toInt(n))
    return where
  }

  /**
   *
   * 从保存结果中提取 BillId。
   * @param res 保存结果。
   * @returns BillId。
   *
   */
  private extractBillId(res: DbChangedPackResult | ApiMessagePack<unknown>): number {
    const root = res as any
    const candidates: unknown[] = [
      root?.billId,
      root?.BillId,
      root?.billid,
      root?.objects?.BillId,
      root?.Objects?.BillId,
      root?.data?.BillId,
      root?.data?.billId,
      root?.id,
      root?.Id,
    ]
    for (const raw of candidates) {
      const n = this.toInt(raw)
      if (n > 0) return n
    }
    return 0
  }

  /**
   *
   * 映射 DbChangedPackResult。
   * @param res 原始结果。
   * @returns 领域结果。
   *
   */
  private mapDbChangedResult(res: DbChangedPackResult): FirstInspectionRepositoryActionResult {
    const anyRes = res as Record<string, unknown>
    const effectRaw = anyRes.effectCount ?? anyRes.EffectCount
    const effectCount = typeof effectRaw === 'number' ? effectRaw : Number(effectRaw)

    const isSuccessRaw = anyRes.isSuccess ?? anyRes.IsSuccess ?? anyRes.success ?? anyRes.Success
    const success = Number.isFinite(effectCount)
      ? Number(effectCount) > 0
      : typeof isSuccessRaw === 'boolean'
        ? isSuccessRaw
        : false

    const messageRaw =
      anyRes.errorMessage ?? anyRes.ErrorMessage ?? anyRes.message ?? anyRes.Message ?? anyRes.msg ?? anyRes.Msg
    const message = typeof messageRaw === 'string' ? messageRaw : messageRaw == null ? '' : String(messageRaw)

    return { success, message }
  }

  /**
   *
   * 归一化整数。
   * @param value 输入值。
   * @returns 非负整数。
   *
   */
  private toInt(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n) || n < 0) return 0
    return Math.trunc(n)
  }
}
