import { ValueObject } from '@/domain/shared/value-object'

/**
 *
 * 检验数量拆分值对象（检验数 = 合格数 + 让步数 + NG 数）。
 * @remarks
 * - 所有数量必须为非负整数；
 * - 创建时会校验数量不变量，违反时抛出错误。
 *
 */
 export class InspectionQuantitySplit extends ValueObject<{
 inspectQuantity: number
 okQuantity: number
 concessionQuantity: number
 ngQuantity: number
 }> {

/**
 *
 * 创建数量拆分。
 * @param props 数量参数。
 * @returns 值对象实例。
 *
 */
  public static create(props: {
    inspectQuantity: unknown
    okQuantity: unknown
    concessionQuantity: unknown
    ngQuantity: unknown
  }): InspectionQuantitySplit {
    const inspectQuantity = this.normalizeCount(props.inspectQuantity)
    const okQuantity = this.normalizeCount(props.okQuantity)
    const concessionQuantity = this.normalizeCount(props.concessionQuantity)
    const ngQuantity = this.normalizeCount(props.ngQuantity)
    if (inspectQuantity !== okQuantity + concessionQuantity + ngQuantity) {
      throw new Error('检验数必须等于合格数+让步数+NG数')
    }
    return new InspectionQuantitySplit({ inspectQuantity, okQuantity, concessionQuantity, ngQuantity })
  }

  /**
   *
   * 构造函数，外部请使用 <c>create</c> 创建实例。
   * @param props 数量集合。
   *
   */
  private constructor(props: {
    inspectQuantity: number
    okQuantity: number
    concessionQuantity: number
    ngQuantity: number
  }) {
    super(props)
  }

  /**
   *
   * 检验数量。
   *
   */
  public get inspectQuantity(): number {
    return this.props.inspectQuantity
  }

  /**
   *
   * 合格数量。
   *
   */
  public get okQuantity(): number {
    return this.props.okQuantity
  }

  /**
   *
   * 让步数量。
   *
   */
  public get concessionQuantity(): number {
    return this.props.concessionQuantity
  }

  /**
   *
   * 不合格数量。
   *
   */
  public get ngQuantity(): number {
    return this.props.ngQuantity
  }

  /**
   *
   * 转换为持久化使用的原始对象。
   * @returns 包含四个数量字段的对象。
   *
   */
  public toObject(): { inspectQuantity: number; okQuantity: number; concessionQuantity: number; ngQuantity: number } {
    return {
      inspectQuantity: this.props.inspectQuantity,
      okQuantity: this.props.okQuantity,
      concessionQuantity: this.props.concessionQuantity,
      ngQuantity: this.props.ngQuantity,
    }
  }

  /**
   *
   * 归一化数量，非法时回退为 0。
   * @param value 待归一化的值。
   * @returns 非负整数。
   *
   */
  private static normalizeCount(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n) || n < 0) return 0
    return Math.trunc(n)
  }
}
