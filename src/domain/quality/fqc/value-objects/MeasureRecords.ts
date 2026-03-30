import { ValueObject } from '@/domain/shared/value-object'

/**
 *
 * 实测记录值对象（最多 5 条）。
 * @remarks
 * - 保证顺序与长度稳定，持久化时会自动填充至 5 位；
 * - 非字符串输入会被转换为字符串，空值统一为空串。
 *
 */
 export class MeasureRecords extends ValueObject<{ values: readonly string[] }> {

/**
 *
 * 创建实测记录。
 * @param records 可选记录数组。
 * @returns 值对象实例。
 *
 */
  public static from(records: ReadonlyArray<unknown>): MeasureRecords {
    const normalized: string[] = []
    for (let i = 0; i < Math.min(records.length, 5); i += 1) {
      const raw = records[i]
      if (raw === undefined || raw === null) {
        normalized.push('')
        continue
      }
      const text = typeof raw === 'string' ? raw : String(raw)
      normalized.push(text)
    }
    return new MeasureRecords({ values: normalized })
  }

  /**
   *
   * 创建空记录。
   *
   */
  public static empty(): MeasureRecords {
    return new MeasureRecords({ values: [] })
  }

  /**
   *
   * 构造函数，外部请使用工厂方法。
   * @param props 记录集合。
   *
   */
  private constructor(props: { values: readonly string[] }) {
    super(props)
  }

  /**
   *
   * 获取记录数组的副本。
   *
   */
  public get values(): readonly string[] {
    return [...this.props.values]
  }

  /**
   *
   * 返回长度为 5 的数组（不足部分以空串填充）。
   *
   */
  public toFixedLength(): readonly string[] {
    const padded = [...this.props.values]
    while (padded.length < 5) padded.push('')
    return padded.slice(0, 5)
  }
}
