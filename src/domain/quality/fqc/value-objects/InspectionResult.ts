import { ValueObject } from '@/domain/shared/value-object'

/**
 *
 * 末道检验的判定结果值对象。
 * @remarks
 * - 内部仅存储数值型判定值，保持与 ERP.CheckResult 一致；
 * - 通过静态工厂方法统一做数据归一化，避免出现 NaN 或负数。
 *
 */
 export class InspectionResult extends ValueObject<{ value: number }> {

/**
 *
 * 创建判定结果。
 * @param input 任意可转换为数值的输入。
 * @returns 归一化后的值对象。
 *
 */
  public static from(input: unknown): InspectionResult {
    const n = typeof input === 'number' ? input : Number(input)
    const normalized = Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0
    return new InspectionResult({ value: normalized })
  }

  /**
   *
   * 构造函数，外部请使用 <c>from</c> 创建实例。
   * @param props 属性集合。
   *
   */
  private constructor(props: { value: number }) {
    super(props)
  }

  /**
   *
   * 获取判定值。
   *
   */
  public get value(): number {
    return this.props.value
  }

  /**
   *
   * 是否判定为合格（值为 1 时视为合格）。
   * @returns 合格返回 true，否则返回 false。
   *
   */
  public get isQualified(): boolean {
    return this.props.value === 1
  }
}
