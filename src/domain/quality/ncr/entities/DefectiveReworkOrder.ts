import { Entity } from '@/domain/shared/entity'
import { DefectiveReworkOrderDetail, type DefectiveReworkOrderDetailId } from './DefectiveReworkOrderDetail'
import { ErpDateTime } from '../value-objects/ErpDateTime'
import { Quantity } from '../value-objects/Quantity'
import { ReworkOrderStatus } from '../value-objects/ReworkOrderStatus'

/**
 *
 * NCR 不合格返工单 Id。
 * @remarks
 * - 当前与 ERP 侧主键类型保持一致：number；\\n
 * - 新建单据可使用 0 作为“未落库”的占位值。\\n
 *
 */
 export type DefectiveReworkOrderId = number

/**
 *
 * 审批前置校验的错误项。
 *
 */
 export type DefectiveReworkOrderApproveViolation =
 | {

/**
 *
 * 错误码。
 *
 */
      readonly code: 'INSPECTOR_REQUIRED'
      /**
       *
       * 错误信息。
       *
       */
      readonly message: string
    }
  | {
      /**
       *
       * 错误码。
       *
       */
      readonly code: 'DEFECTIVE_PROCESS_REQUIRED'
      /**
       *
       * 错误信息。
       *
       */
      readonly message: string
    }
  | {
      /**
       *
       * 错误码。
       *
       */
      readonly code: 'DETAIL_DESCRIPTION_REQUIRED'
      /**
       *
       * 错误信息。
       *
       */
      readonly message: string
      /**
       *
       * 明细 Id。
       *
       */
      readonly detailId: DefectiveReworkOrderDetailId
      /**
       *
       * 明细序号（从 1 开始）。
       *
       */
      readonly detailIndex: number
    }

/**
 *
 * 不合格返工单聚合根的属性集合。
 *
 */
 export type DefectiveReworkOrderProps = {

/**
 *
 * 聚合 Id。
 *
 */
  readonly id: DefectiveReworkOrderId

  /**
   *
   * 单据状态（位标记）。
   *
   */
  readonly status: ReworkOrderStatus

  /**
   *
   * 检验员（Employeeid）。0 表示未填写。
   *
   */
  readonly inspectorEmployeeId: number

  /**
   *
   * 不合格工序（TypeofWorkid）。0 表示未填写。
   *
   */
  readonly defectiveProcessId: number

  /**
   *
   * 交期（可空）。
   *
   */
  readonly deliveryTime: ErpDateTime | null

  /**
   *
   * 返工日期（可空）。
   *
   */
  readonly repairTime: ErpDateTime | null

  /**
   *
   * 预完工不良数量。
   *
   */
  readonly preCompleteBadQty: Quantity

  /**
   *
   * 检验不良数量。
   *
   */
  readonly checkBadQty: Quantity

  /**
   *
   * 合格不良数量。
   *
   */
  readonly passBadQty: Quantity

  /**
   *
   * 返工数量。
   *
   */
  readonly reworkQty: Quantity

  /**
   *
   * 不合格不良数量。
   *
   */
  readonly notPassBadQty: Quantity

  /**
   *
   * 明细列表。
   *
   */
  readonly details: readonly DefectiveReworkOrderDetail[]
}

/**
 *
 * NCR 不合格返工单聚合根。
 * @remarks
 * 聚合边界：单据头 + 明细。\\n
 * 一致性边界：审批前必须满足关键字段完整性（检验员/不合格工序/明细记录）。\\n
 *
 */
 export class DefectiveReworkOrder extends Entity<DefectiveReworkOrderId> {

/**
 *
 * 状态。
 *
 */
  private readonly _status: ReworkOrderStatus

  /**
   *
   * 检验员 Employeeid。
   *
   */
  private readonly _inspectorEmployeeId: number

  /**
   *
   * 不合格工序 TypeofWorkid。
   *
   */
  private readonly _defectiveProcessId: number

  /**
   *
   * 交期。
   *
   */
  private readonly _deliveryTime: ErpDateTime | null

  /**
   *
   * 返工日期。
   *
   */
  private readonly _repairTime: ErpDateTime | null

  /**
   *
   * 预完工不良数量。
   *
   */
  private readonly _preCompleteBadQty: Quantity

  /**
   *
   * 检验不良数量。
   *
   */
  private readonly _checkBadQty: Quantity

  /**
   *
   * 合格不良数量。
   *
   */
  private readonly _passBadQty: Quantity

  /**
   *
   * 返工数量。
   *
   */
  private readonly _reworkQty: Quantity

  /**
   *
   * 不合格不良数量。
   *
   */
  private readonly _notPassBadQty: Quantity

  /**
   *
   * 明细列表（只读）。
   *
   */
  private readonly _details: readonly DefectiveReworkOrderDetail[]

  /**
   *
   * 创建一个“空白草稿”返工单。
   * @returns 聚合根。
   *
   */
  public static createDraft(): DefectiveReworkOrder {
    return new DefectiveReworkOrder({
      id: 0,
      status: ReworkOrderStatus.none(),
      inspectorEmployeeId: 0,
      defectiveProcessId: 0,
      deliveryTime: null,
      repairTime: null,
      preCompleteBadQty: Quantity.zero(),
      checkBadQty: Quantity.zero(),
      passBadQty: Quantity.zero(),
      reworkQty: Quantity.zero(),
      notPassBadQty: Quantity.zero(),
      details: [],
    })
  }

  /**
   *
   * 创建聚合根。
   * @param props 聚合属性。
   *
   */
  public constructor(props: DefectiveReworkOrderProps) {
    super(props.id)
    assertValidOrderId(props.id)
    assertNonNegativeSafeInt(props.inspectorEmployeeId, 'DefectiveReworkOrder: inspectorEmployeeId 不合法')
    assertNonNegativeSafeInt(props.defectiveProcessId, 'DefectiveReworkOrder: defectiveProcessId 不合法')

    this._status = props.status
    this._inspectorEmployeeId = props.inspectorEmployeeId
    this._defectiveProcessId = props.defectiveProcessId
    this._deliveryTime = props.deliveryTime
    this._repairTime = props.repairTime
    this._preCompleteBadQty = props.preCompleteBadQty
    this._checkBadQty = props.checkBadQty
    this._passBadQty = props.passBadQty
    this._reworkQty = props.reworkQty
    this._notPassBadQty = props.notPassBadQty

    const detailsCopy = [...props.details]
    assertUniqueDetailIds(detailsCopy)
    this._details = Object.freeze(detailsCopy)
  }

  /**
   *
   * 获取状态值对象。
   *
   */
 public get status(): ReworkOrderStatus {
 return this._status
 }

/**
 *
 * 获取检验员 Employeeid（0 表示未填写）。
 *
 */
 public get inspectorEmployeeId(): number {
 return this._inspectorEmployeeId
 }

/**
 *
 * 获取不合格工序 TypeofWorkid（0 表示未填写）。
 *
 */
 public get defectiveProcessId(): number {
 return this._defectiveProcessId
 }

/**
 *
 * 获取交期（可空）。
 *
 */
 public get deliveryTime(): ErpDateTime | null {
 return this._deliveryTime
 }

/**
 *
 * 获取返工日期（可空）。
 *
 */
 public get repairTime(): ErpDateTime | null {
 return this._repairTime
 }

/**
 *
 * 获取预完工不良数量。
 *
 */
 public get preCompleteBadQty(): Quantity {
 return this._preCompleteBadQty
 }

/**
 *
 * 获取检验不良数量。
 *
 */
 public get checkBadQty(): Quantity {
 return this._checkBadQty
 }

/**
 *
 * 获取合格不良数量。
 *
 */
 public get passBadQty(): Quantity {
 return this._passBadQty
 }

/**
 *
 * 获取返工数量。
 *
 */
 public get reworkQty(): Quantity {
 return this._reworkQty
 }

/**
 *
 * 获取不合格不良数量。
 *
 */
 public get notPassBadQty(): Quantity {
 return this._notPassBadQty
 }

/**
 *
 * 获取明细列表（只读视图）。
 * @returns 明细数组（新数组，避免外部修改内部引用）。
 *
 */
  public get details(): readonly DefectiveReworkOrderDetail[] {
    return [...this._details]
  }

  /**
   *
   * 返回一个“Id 更新后”的新聚合实例。
   * @param id 新的聚合标识。
   * @returns 新聚合实例。
   *
   */
  public withId(id: DefectiveReworkOrderId): DefectiveReworkOrder {
    return new DefectiveReworkOrder({ ...this.toProps(), id })
  }

  /**
   *
   * 返回一个“更新检验员”后的新聚合实例。
   * @param employeeId 检验员 Employeeid。
   * @returns 新聚合实例。
   *
   */
  public withInspectorEmployeeId(employeeId: number): DefectiveReworkOrder {
    return new DefectiveReworkOrder({ ...this.toProps(), inspectorEmployeeId: employeeId })
  }

  /**
   *
   * 返回一个“更新不合格工序”后的新聚合实例。
   * @param typeofWorkId 不合格工序 TypeofWorkid。
   * @returns 新聚合实例。
   *
   */
  public withDefectiveProcessId(typeofWorkId: number): DefectiveReworkOrder {
    return new DefectiveReworkOrder({ ...this.toProps(), defectiveProcessId: typeofWorkId })
  }

  /**
   *
   * 返回一个“更新状态”后的新聚合实例。
   * @param status 新的状态。
   * @returns 新聚合实例。
   *
   */
  public withStatus(status: ReworkOrderStatus): DefectiveReworkOrder {
    return new DefectiveReworkOrder({ ...this.toProps(), status })
  }

  /**
   *
   * 返回一个“替换明细列表”后的新聚合实例。
   * @param details 新的明细列表。
   * @returns 新聚合实例。
   *
   */
  public withDetails(details: readonly DefectiveReworkOrderDetail[]): DefectiveReworkOrder {
    return new DefectiveReworkOrder({ ...this.toProps(), details })
  }

  /**
   *
   * 返回一个“新增明细”后的新聚合实例。
   * @param detail 要新增的明细。
   * @returns 新聚合实例。
   *
   */
  public addDetail(detail: DefectiveReworkOrderDetail): DefectiveReworkOrder {
    const next = [...this._details, detail]
    assertUniqueDetailIds(next)
    return this.withDetails(next)
  }

  /**
   *
   * 生成一个临时明细（负数 Id）并追加到聚合中。
   * @param description 可空描述。
   * @returns 新聚合实例。
   *
   */
  public addNewDetail(description: string | null | undefined): DefectiveReworkOrder {
    const newId = generateNextTemporaryDetailId(this._details)
    const detail = DefectiveReworkOrderDetail.fromNullableDescription(newId, description)
    return this.addDetail(detail)
  }

  /**
   *
   * 返回一个“删除指定明细”后的新聚合实例。
   * @param detailId 要删除的明细 Id。
   * @returns 新聚合实例。
   *
   */
  public removeDetail(detailId: DefectiveReworkOrderDetailId): DefectiveReworkOrder {
    const next = this._details.filter((d) => d.id !== detailId)
    return this.withDetails(next)
  }

  /**
   *
   * 审批前置条件校验（不抛异常）。
   * @remarks
   * 规则对齐当前 ViewModel：\\n
   * - 必须填写检验员（Employeeid &gt; 0）\\n
   * - 必须填写不合格工序（TypeofWorkid &gt; 0）\\n
   * - 明细若存在，则每行记录必须填写（defectDescription 非空）\\n
   * @returns 错误项列表；为空表示可审批。
   *
   */
  public validateBeforeApprove(): readonly DefectiveReworkOrderApproveViolation[] {
    const violations: DefectiveReworkOrderApproveViolation[] = []

    if (this._inspectorEmployeeId <= 0) {
      violations.push({ code: 'INSPECTOR_REQUIRED', message: '请先填写：检验员' })
    }

    if (this._defectiveProcessId <= 0) {
      violations.push({ code: 'DEFECTIVE_PROCESS_REQUIRED', message: '请先填写：不合格工序' })
    }

    for (let i = 0; i < this._details.length; i += 1) {
      const detail = this._details[i]
      if (!detail.defectDescription) {
        violations.push({
          code: 'DETAIL_DESCRIPTION_REQUIRED',
          message: `请先填写：第${i + 1}行 - 记录`,
          detailId: detail.id,
          detailIndex: i + 1,
        })
      }
    }

    return violations
  }

  /**
   *
   * 判断是否满足审批前置条件。
   * @returns 满足返回 true，否则返回 false。
   *
   */
  public canApprove(): boolean {
    return this.validateBeforeApprove().length === 0
  }

  /**
   *
   * 断言满足审批前置条件；不满足时抛出 Error。
   *
   */
 public assertCanApprove(): void {
 const violations = this.validateBeforeApprove()
 if (violations.length === 0) return
 throw new Error(violations.map((v) => v.message).join('；'))
 }

/**
 *
 * 将当前聚合导出为 props（用于构造新实例）。
 * @returns 聚合属性集合。
 *
 */
  private toProps(): DefectiveReworkOrderProps {
    return {
      id: this.id,
      status: this._status,
      inspectorEmployeeId: this._inspectorEmployeeId,
      defectiveProcessId: this._defectiveProcessId,
      deliveryTime: this._deliveryTime,
      repairTime: this._repairTime,
      preCompleteBadQty: this._preCompleteBadQty,
      checkBadQty: this._checkBadQty,
      passBadQty: this._passBadQty,
      reworkQty: this._reworkQty,
      notPassBadQty: this._notPassBadQty,
      details: this._details,
    }
  }
}

/**
 *
 * 校验返工单 Id。
 * @param id 返工单 Id。
 *
 */
function assertValidOrderId(id: DefectiveReworkOrderId): void {
  if (!Number.isFinite(id)) {
    throw new Error('DefectiveReworkOrder: Id 必须是有限数字')
  }
  if (!Number.isInteger(id)) {
    throw new Error('DefectiveReworkOrder: Id 必须是整数')
  }
  if (id < 0) {
    throw new Error('DefectiveReworkOrder: Id 不能为负数')
  }
  if (id > Number.MAX_SAFE_INTEGER) {
    throw new Error('DefectiveReworkOrder: Id 超出安全整数范围')
  }
}

/**
 *
 * 校验“非负安全整数”。
 * @param value 待校验值。
 * @param message 错误信息。
 *
 */
function assertNonNegativeSafeInt(value: number, message: string): void {
  if (!Number.isFinite(value)) throw new Error(message)
  if (!Number.isInteger(value)) throw new Error(message)
  if (value < 0) throw new Error(message)
  if (value > Number.MAX_SAFE_INTEGER) throw new Error(message)
}

/**
 *
 * 校验明细 Id 的唯一性。
 * @param details 明细列表。
 *
 */
function assertUniqueDetailIds(details: readonly DefectiveReworkOrderDetail[]): void {
  const seen = new Set<DefectiveReworkOrderDetailId>()
  for (const d of details) {
    if (seen.has(d.id)) {
      throw new Error('DefectiveReworkOrder: 明细 Id 必须唯一')
    }
    seen.add(d.id)
  }
}

/**
 *
 * 为新建明细生成下一个临时 Id（负数，递减）。
 * @remarks
 * 算法：取当前所有明细 Id 的最小值（通常为负数），在其基础上 -1；若不存在负数 Id，则从 -1 开始。
 * @param details 当前明细列表。
 * @returns 新的临时 Id。
 *
 */
function generateNextTemporaryDetailId(details: readonly DefectiveReworkOrderDetail[]): DefectiveReworkOrderDetailId {
  let minId = 0
  for (const d of details) {
    if (Number.isFinite(d.id) && d.id < minId) {
      minId = d.id
    }
  }
  const next = minId <= -1 ? minId - 1 : -1
  return next
}
