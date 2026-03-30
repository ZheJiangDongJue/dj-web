import { ValueObject } from '@/domain/shared/value-object'

/**
 *
 * 不合格返工单状态标记（位标记）。
 * @remarks
 * 该枚举用于描述 <c>ReworkOrderStatus</c> 内部的位含义：按位或组合。
 *
 */
 export enum ReworkOrderStatusFlag {

/**
 *
 * 已冻结（1）。
 *
 */
 Frozen = 1,

/**
 *
 * 已结案（2）。
 *
 */
 Closed = 2,

/**
 *
 * 已作废（4）。
 *
 */
 Voided = 4,

/**
 *
 * 已审批（8）。
 *
 */
 Approved = 8,
 }

/**
 *
 * <c>ReworkOrderStatus</c> 的内部属性集合。
 *
 */
 export type ReworkOrderStatusProps = {

/**
 *
 * 状态位的整型值。
 *
 */
 readonly value: number
 }

/**
 *
 * NCR 不合格返工单状态值对象（位运算封装）。
 * @remarks
 * - ERP 的单据状态通常以数字位标记表达，本值对象将其封装为明确的业务语义方法；\\n
 * - 为避免 JavaScript 位运算的 32 位有符号整型陷阱，本实现限制取值范围在 0..0x7fffffff。\\n
 *
 */
 export class ReworkOrderStatus extends ValueObject<ReworkOrderStatusProps> {

/**
 *
 * 位运算安全上限（2^31-1）。
 *
 */
 public static readonly MaxBitwiseSafeValue = 0x7fffffff

/**
 *
 * 创建“未设置任何状态位”的状态。
 * @returns 状态值对象。
 *
 */
  public static none(): ReworkOrderStatus {
    return new ReworkOrderStatus({ value: 0 })
  }

  /**
   *
   * 从数字创建状态值对象。
   * @param value 状态位整型值。
   * @returns 状态值对象。
   *
   */
  public static from(value: number): ReworkOrderStatus {
    return new ReworkOrderStatus({ value })
  }

  /**
   *
   * 创建状态值对象。
   * @param props 内部属性集合。
   *
   */
  private constructor(props: ReworkOrderStatusProps) {
    ReworkOrderStatus.assertValid(props.value)
    super(props)
  }

  /**
   *
   * 获取当前状态的数字值。
   *
   */
 public get value(): number {
 return this.props.value
 }

/**
 *
 * 判断是否包含指定状态标记。
 * @param flag 要判断的状态标记。
 * @returns 若包含返回 true，否则返回 false。
 *
 */
  public has(flag: ReworkOrderStatusFlag): boolean {
    return (this.props.value & flag) === flag
  }

  /**
   *
   * 判断是否已冻结。
   *
   */
 public isFrozen(): boolean {
 return this.has(ReworkOrderStatusFlag.Frozen)
 }

/**
 *
 * 判断是否已结案。
 *
 */
 public isClosed(): boolean {
 return this.has(ReworkOrderStatusFlag.Closed)
 }

/**
 *
 * 判断是否已作废。
 *
 */
 public isVoided(): boolean {
 return this.has(ReworkOrderStatusFlag.Voided)
 }

/**
 *
 * 判断是否已审批。
 *
 */
 public isApproved(): boolean {
 return this.has(ReworkOrderStatusFlag.Approved)
 }

/**
 *
 * 判断是否处于“锁定”态（冻结/结案/作废任一为真）。
 * @returns 若锁定返回 true，否则返回 false。
 *
 */
  public isLocked(): boolean {
    return this.isFrozen() || this.isClosed() || this.isVoided()
  }

  /**
   *
   * 返回一个“追加指定状态标记”的新状态值对象。
   * @param flag 要追加的标记。
   * @returns 新的状态值对象。
   *
   */
  public with(flag: ReworkOrderStatusFlag): ReworkOrderStatus {
    return ReworkOrderStatus.from(this.props.value | flag)
  }

  /**
   *
   * 返回一个“移除指定状态标记”的新状态值对象。
   * @param flag 要移除的标记。
   * @returns 新的状态值对象。
   *
   */
  public without(flag: ReworkOrderStatusFlag): ReworkOrderStatus {
    return ReworkOrderStatus.from(this.props.value & ~flag)
  }

  /**
   *
   * 转为 JSON 序列化值。
   * @returns 数字状态值。
   *
   */
  public toJSON(): number {
    return this.props.value
  }

  /**
   *
   * 转为可读字符串。
   * @returns 字符串。
   *
   */
  public toString(): string {
    return String(this.props.value)
  }

  /**
   *
   * 校验状态位值是否合法。
   * @param value 状态位整型值。
   *
   */
  private static assertValid(value: number): void {
    if (!Number.isFinite(value)) {
      throw new Error('ReworkOrderStatus: 状态值必须是有限数字')
    }
    if (!Number.isInteger(value)) {
      throw new Error('ReworkOrderStatus: 状态值必须是整数')
    }
    if (value < 0) {
      throw new Error('ReworkOrderStatus: 状态值不能为负数')
    }
    if (value > ReworkOrderStatus.MaxBitwiseSafeValue) {
      throw new Error('ReworkOrderStatus: 状态值超出位运算安全范围')
    }
  }
}

