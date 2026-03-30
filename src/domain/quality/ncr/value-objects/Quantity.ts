import { ValueObject } from '@/domain/shared/value-object'

/**
 *
 * <c>Quantity</c> 的内部属性集合。
 *
 */
 export type QuantityProps = {

/**
 *
 * 数量值（非负整数）。
 *
 */
 readonly value: number
 }

/**
 *
 * 数量值对象（非负整数）。
 * @remarks
 * - 用于领域内所有“数量/数量类字段”的统一约束；\\n
 * - 约束：必须为整数，且范围在 [0, Number.MAX_SAFE_INTEGER]。\\n
 *
 */
 export class Quantity extends ValueObject<QuantityProps> {

/**
 *
 * 创建数量值对象。
 * @param value 数量值。
 * @returns 数量值对象。
 *
 */
  public static from(value: number): Quantity {
    return new Quantity({ value })
  }

  /**
   *
   * 创建 0 数量。
   * @returns 数量值对象。
   *
   */
  public static zero(): Quantity {
    return new Quantity({ value: 0 })
  }

  /**
   *
   * 创建数量值对象。
   * @param props 内部属性集合。
   *
   */
  private constructor(props: QuantityProps) {
    Quantity.assertValid(props.value)
    super(props)
  }

  /**
   *
   * 获取数量值（number）。
   *
   */
 public get value(): number {
 return this.props.value
 }

/**
 *
 * 将数量与另一个数量相加并返回新实例。
 * @param other 另一个数量。
 * @returns 相加后的数量。
 *
 */
  public add(other: Quantity): Quantity {
    return Quantity.from(this.props.value + other.props.value)
  }

  /**
   *
   * 将数量与另一个数量相减并返回新实例。
   * @remarks
   * 结果若为负数将抛出错误。
   * @param other 另一个数量。
   * @returns 相减后的数量。
   *
   */
  public subtract(other: Quantity): Quantity {
    return Quantity.from(this.props.value - other.props.value)
  }

  /**
   *
   * 转为 JSON 序列化值。
   * @returns 数量值。
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
   * 校验数量值是否合法。
   * @param value 数量值。
   *
   */
  private static assertValid(value: number): void {
    if (!Number.isFinite(value)) {
      throw new Error('Quantity: 数量必须是有限数字')
    }
    if (!Number.isInteger(value)) {
      throw new Error('Quantity: 数量必须是整数')
    }
    if (value < 0) {
      throw new Error('Quantity: 数量不能为负数')
    }
    if (value > Number.MAX_SAFE_INTEGER) {
      throw new Error('Quantity: 数量超出安全整数范围')
    }
  }
}

