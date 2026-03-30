import { Entity } from '@/domain/shared/entity'
import { DefectDescription } from '../value-objects/DefectDescription'

/**
 *
 * NCR 不合格返工单明细 Id。
 * @remarks
 * - 为保证“明细实体”在领域层具备唯一标识，本实现要求 Id 为非 0 的整数；\\n
 * - 持久化 Id（数据库主键）通常为正整数；未落库的临时明细可使用负数 Id。\\n
 *
 */
 export type DefectiveReworkOrderDetailId = number

/**
 *
 * NCR 不合格返工单明细实体的属性集合。
 *
 */
 export type DefectiveReworkOrderDetailProps = {

/**
 *
 * 明细标识（唯一且不可变）。
 *
 */
 readonly id: DefectiveReworkOrderDetailId

/**
 *
 * 不良记录/不良描述。
 * @remarks
 * - 允许为 null：表示“尚未填写”；\\n
 * - 一旦存在值，则必须满足 <c>DefectDescription</c> 的约束（非空、长度≤500）。\\n
 *
 */
 readonly defectDescription: DefectDescription | null
 }

/**
 *
 * NCR 不合格返工单明细实体。
 * @remarks
 * 本实体对应 ERP 中的明细行（例如字段 <c>Adversesituation</c>），其业务不变量由聚合根统一约束。
 *
 */
 export class DefectiveReworkOrderDetail extends Entity<DefectiveReworkOrderDetailId> {

/**
 *
 * 明细的不良描述（可空）。
 *
 */
 private readonly _defectDescription: DefectDescription | null

/**
 *
 * 创建明细实体。
 * @param props 明细属性。
 *
 */
  public constructor(props: DefectiveReworkOrderDetailProps) {
    super(props.id)
    assertValidDetailId(props.id)
    this._defectDescription = props.defectDescription
  }

  /**
   *
   * 从“可空字符串”创建明细实体。
   * @remarks
   * 当字符串为空/空白时，将被视为“未填写”，即 defectDescription = null。
   * @param id 明细 Id。
   * @param description 可空描述。
   * @returns 明细实体。
   *
   */
  public static fromNullableDescription(
    id: DefectiveReworkOrderDetailId,
    description: string | null | undefined,
  ): DefectiveReworkOrderDetail {
    const normalized = normalizeNullableDescription(description)
    return new DefectiveReworkOrderDetail({
      id,
      defectDescription: normalized == null ? null : DefectDescription.from(normalized),
    })
  }

  /**
   *
   * 获取不良描述值对象（可空）。
   *
   */
 public get defectDescription(): DefectDescription | null {
 return this._defectDescription
 }

/**
 *
 * 获取不良描述文本（若未填写返回空字符串）。
 *
 */
 public get defectDescriptionText(): string {
 return this._defectDescription?.value ?? ''
 }

/**
 *
 * 返回一个“更新不良描述后”的新明细实体。
 * @remarks
 * - 该方法保持实体标识不变，仅更新业务属性；\\n
 * - 当传入空/空白字符串时，表示清空描述（变为 null）。\\n
 * @param description 新的描述。
 * @returns 新明细实体。
 *
 */
  public withNullableDescription(description: string | null | undefined): DefectiveReworkOrderDetail {
    return DefectiveReworkOrderDetail.fromNullableDescription(this.id, description)
  }

  /**
   *
   * 转为 JSON 友好的普通对象（仅用于测试/调试）。
   * @returns 普通对象。
   *
   */
  public toJSON(): { id: DefectiveReworkOrderDetailId; defectDescription: string | null } {
    return { id: this.id, defectDescription: this._defectDescription?.value ?? null }
  }
}

/**
 *
 * 校验明细 Id。
 * @param id 明细 Id。
 *
 */
function assertValidDetailId(id: DefectiveReworkOrderDetailId): void {
  if (!Number.isFinite(id)) {
    throw new Error('DefectiveReworkOrderDetail: Id 必须是有限数字')
  }
  if (!Number.isInteger(id)) {
    throw new Error('DefectiveReworkOrderDetail: Id 必须是整数')
  }
  if (id === 0) {
    throw new Error('DefectiveReworkOrderDetail: Id 不能为 0（需保证唯一标识）')
  }
  if (Math.abs(id) > Number.MAX_SAFE_INTEGER) {
    throw new Error('DefectiveReworkOrderDetail: Id 超出安全整数范围')
  }
}

/**
 *
 * 归一化可空描述字符串：trim 并将空白转为 null。
 * @param value 可空字符串。
 * @returns 归一化后的字符串或 null。
 *
 */
function normalizeNullableDescription(value: string | null | undefined): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

