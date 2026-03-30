import { Entity } from '@/domain/shared/entity'
import { InspectionQuantitySplit } from '@/domain/quality/fqc/value-objects/InspectionQuantitySplit'
import { InspectionResult } from '@/domain/quality/fqc/value-objects/InspectionResult'
import { FirstInspectionDetail } from './FirstInspectionDetail'

/**
 *
 * 首件检验单据标识。
 *
 */
export type FirstInspectionId = number

/**
 *
 * 首件检验聚合根属性集。
 *
 */
export type FirstInspectionProps = {

  id: FirstInspectionId
  /**
   *
   * 来源单据主键（对应后端 CreateByDocumentid）。
   *
   */
  createByDocumentId: number | null
  /**
   *
   * 来源单据类型（对应后端 CreateByDocumentType）。
   *
   */
  createByDocumentType: string
  /**
   *
   * 来源明细主键（对应后端 CreateByDetailid）。
   *
   */
  createByDetailId: number | null
  /**
   *
   * 来源明细类型（对应后端 CreateByDetailType）。
   *
   */
  createByDetailType: string
  /**
   *
   * 单据状态。
   *
   */
  status: number
  /**
   *
   * 物料 Id。
   *
   */
  materialId: number
  /**
   *
   * 部门 Id。
   *
   */
  departmentId: number
  /**
   *
   * 检验员 Id。
   *
   */
  employeeId: number
  /**
   *
   * 客户 Id。
   *
   */
  clientId: number
  /**
   *
   * 检验方式 Id。
   *
   */
  checkMethodId: number
  /**
   *
   * 判定依据单据 Id。
   *
   */
  checkCaseDocumentId: number
  /**
   *
   * 处理方式 Id。
   *
   */
  handlingMethodId: number
  /**
   *
   * 交期（可空）。
   *
   */
  checkDeliveryTime: string | null
  /**
   *
   * 判定结果值对象。
   *
   */
  result: InspectionResult
  /**
   *
   * 预完工不良数量。
   *
   */
  preCompleteBadQty: number
  /**
   *
   * 检验数量拆分。
   *
   */
  quantitySplit: InspectionQuantitySplit
  /**
   *
   * 客户名称。
   *
   */
  cname: string
  /**
   *
   * 内部键。
   *
   */
  innerKey: string
  /**
   *
   * 严重程度。
   *
   */
  severityLevel: number
  /**
   *
   * 工序 Id。
   *
   */
  typeOfWorkId: number
  /**
   *
   * 数量。
   *
   */
  qty: number
  /**
   *
   * 明细集合。
   *
   */
  details: readonly FirstInspectionDetail[]
}

/**
 *
 * 首件检验聚合根。
 *
 */
export class FirstInspection extends Entity<FirstInspectionId> {

/**
 *
 * 内部属性。
 *
 */
  private readonly _props: FirstInspectionProps

  /**
   *
   * 创建“空白草稿”。
   * @returns 聚合实例。
   *
   */
  public static createDraft(): FirstInspection {
    return new FirstInspection({
      id: 0,
      createByDocumentId: null,
      createByDocumentType: '',
      createByDetailId: null,
      createByDetailType: '',
      status: 0,
      materialId: 0,
      departmentId: 0,
      employeeId: 0,
      clientId: 0,
      checkMethodId: 0,
      checkCaseDocumentId: 0,
      handlingMethodId: 0,
      checkDeliveryTime: null,
      result: InspectionResult.from(0),
      preCompleteBadQty: 0,
      quantitySplit: InspectionQuantitySplit.create({ inspectQuantity: 0, okQuantity: 0, concessionQuantity: 0, ngQuantity: 0 }),
      cname: '',
      innerKey: '',
      severityLevel: 0,
      typeOfWorkId: 0,
      qty: 0,
      details: [],
    })
  }

  /**
   *
   * 构造函数。
   * @param props 属性集合。
   *
   */
  public constructor(props: FirstInspectionProps) {
    super(props.id)
    this._props = FirstInspection.normalizeProps(props)
    FirstInspection.ensureUniqueDetailIds(this._props.details)
  }

  /**
   *
   * 单据状态。
   *
   */
  public get status(): number {
    return this._props.status
  }

  /**
   *
   * 来源单据主键（对应后端 CreateByDocumentid）。
   *
   */
  public get createByDocumentId(): number | null {
    return this._props.createByDocumentId
  }

  /**
   *
   * 来源单据类型（对应后端 CreateByDocumentType）。
   *
   */
  public get createByDocumentType(): string {
    return this._props.createByDocumentType
  }

  /**
   *
   * 来源明细主键（对应后端 CreateByDetailid）。
   *
   */
  public get createByDetailId(): number | null {
    return this._props.createByDetailId
  }

  /**
   *
   * 来源明细类型（对应后端 CreateByDetailType）。
   *
   */
  public get createByDetailType(): string {
    return this._props.createByDetailType
  }

  /**
   *
   * 物料 Id。
   *
   */
  public get materialId(): number {
    return this._props.materialId
  }

  /**
   *
   * 部门 Id。
   *
   */
  public get departmentId(): number {
    return this._props.departmentId
  }

  /**
   *
   * 检验员 Id。
   *
   */
  public get employeeId(): number {
    return this._props.employeeId
  }

  /**
   *
   * 客户 Id。
   *
   */
  public get clientId(): number {
    return this._props.clientId
  }

  /**
   *
   * 检验方式 Id。
   *
   */
  public get checkMethodId(): number {
    return this._props.checkMethodId
  }

  /**
   *
   * 判定依据单据 Id。
   *
   */
  public get checkCaseDocumentId(): number {
    return this._props.checkCaseDocumentId
  }

  /**
   *
   * 处理方式 Id。
   *
   */
  public get handlingMethodId(): number {
    return this._props.handlingMethodId
  }

  /**
   *
   * 交期（可空）。
   *
   */
  public get checkDeliveryTime(): string | null {
    return this._props.checkDeliveryTime
  }

  /**
   *
   * 判定结果。
   *
   */
  public get result(): InspectionResult {
    return this._props.result
  }

  /**
   *
   * 预完工不良数量。
   *
   */
  public get preCompleteBadQty(): number {
    return this._props.preCompleteBadQty
  }

  /**
   *
   * 检验数量拆分。
   *
   */
  public get quantitySplit(): InspectionQuantitySplit {
    return this._props.quantitySplit
  }

  /**
   *
   * 客户名称。
   *
   */
  public get cname(): string {
    return this._props.cname
  }

  /**
   *
   * 内部键。
   *
   */
  public get innerKey(): string {
    return this._props.innerKey
  }

  /**
   *
   * 严重程度。
   *
   */
  public get severityLevel(): number {
    return this._props.severityLevel
  }

  /**
   *
   * 工序 Id。
   *
   */
  public get typeOfWorkId(): number {
    return this._props.typeOfWorkId
  }

  /**
   *
   * 数量。
   *
   */
  public get qty(): number {
    return this._props.qty
  }

  /**
   *
   * 明细集合（防御性拷贝）。
   *
   */
  public get details(): readonly FirstInspectionDetail[] {
    return [...this._props.details]
  }

  /**
   *
   * 返回带新 Id 的聚合。
   * @param id 新 Id。
   * @returns 新聚合实例。
   *
   */
  public withId(id: FirstInspectionId): FirstInspection {
    return new FirstInspection({ ...this._props, id })
  }

  /**
   *
   * 导出属性快照。
   * @returns 属性集合。
   *
   */
  public toProps(): FirstInspectionProps {
    return {
      ...this._props,
      details: [...this._props.details],
      quantitySplit: this._props.quantitySplit,
      result: this._props.result,
    }
  }

  /**
   *
   * 标准化属性。
   * @param props 原始属性。
   * @returns 标准化属性。
   *
   */
  private static normalizeProps(props: FirstInspectionProps): FirstInspectionProps {
    return {
      id: this.normalizeInt(props.id),
      createByDocumentId: this.normalizeNullableNonZeroInt(props.createByDocumentId),
      createByDocumentType: this.normalizeText(props.createByDocumentType),
      createByDetailId: this.normalizeNullableNonZeroInt(props.createByDetailId),
      createByDetailType: this.normalizeText(props.createByDetailType),
      status: this.normalizeInt(props.status),
      materialId: this.normalizeInt(props.materialId),
      departmentId: this.normalizeInt(props.departmentId),
      employeeId: this.normalizeInt(props.employeeId),
      clientId: this.normalizeInt(props.clientId),
      checkMethodId: this.normalizeInt(props.checkMethodId),
      checkCaseDocumentId: this.normalizeInt(props.checkCaseDocumentId),
      handlingMethodId: this.normalizeInt(props.handlingMethodId),
      checkDeliveryTime: props.checkDeliveryTime ?? null,
      result: props.result,
      preCompleteBadQty: this.normalizeNumber(props.preCompleteBadQty),
      quantitySplit: props.quantitySplit,
      cname: this.normalizeText(props.cname),
      innerKey: this.normalizeText(props.innerKey),
      severityLevel: this.normalizeInt(props.severityLevel),
      typeOfWorkId: this.normalizeInt(props.typeOfWorkId),
      qty: this.normalizeNumber(props.qty),
      details: props.details,
    }
  }

  /**
   *
   * 校验明细 Id 唯一性。
   * @param details 明细列表。
   *
   */
  private static ensureUniqueDetailIds(details: readonly FirstInspectionDetail[]): void {
    const ids = new Set<number>()
    for (const detail of details) {
      if (ids.has(detail.id)) {
        throw new Error('明细 Id 必须唯一')
      }
      ids.add(detail.id)
    }
  }

  /**
   *
   * 归一化整数。
   * @param value 待处理的值。
   * @returns 非负整数。
   *
   */
  private static normalizeInt(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n) || n < 0) return 0
    return Math.trunc(n)
  }

  /**
   *
   * 归一化数字。
   * @param value 待处理的值。
   * @returns 非负数。
   *
   */
  private static normalizeNumber(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n) || n < 0) return 0
    return n
  }

  /**
   *
   * 归一化可空整数（0 视为 null，保留 -1 场景）。
   * @param value 待处理的值。
   * @returns 整数或 null。
   *
   */
  private static normalizeNullableNonZeroInt(value: unknown): number | null {
    if (value === undefined || value === null) return null
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null
    if (n === 0) return null
    return n
  }

  /**
   *
   * 归一化文本。
   * @param value 待处理的值。
   * @returns 文本。
   *
   */
  private static normalizeText(value: unknown): string {
    if (typeof value === 'string') return value
    if (value === undefined || value === null) return ''
    return String(value)
  }
}
