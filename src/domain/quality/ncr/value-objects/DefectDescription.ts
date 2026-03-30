import { ValueObject } from '@/domain/shared/value-object'

/**
 *
 * <c>DefectDescription</c> 的内部属性集合。
 *
 */
 export type DefectDescriptionProps = {

/**
 *
 * 缺陷/不良描述文本（已做 trim）。
 *
 */
 readonly value: string
 }

/**
 *
 * 不良描述值对象。
 * @remarks
 * - 约束：非空（trim 后）\\n
 * - 最大长度：500 字符\\n
 *
 */
 export class DefectDescription extends ValueObject<DefectDescriptionProps> {

/**
 *
 * 最大允许长度。
 *
 */
 public static readonly MaxLength = 500

/**
 *
 * 从字符串创建不良描述值对象。
 * @param value 描述内容。
 * @returns 不良描述值对象。
 *
 */
  public static from(value: string): DefectDescription {
    return new DefectDescription({ value: String(value).trim() })
  }

  /**
   *
   * 创建不良描述值对象。
   * @param props 内部属性集合。
   *
   */
  private constructor(props: DefectDescriptionProps) {
    DefectDescription.assertValid(props.value)
    super(props)
  }

  /**
   *
   * 获取描述文本（trim 后）。
   *
   */
 public get value(): string {
 return this.props.value
 }

/**
 *
 * 转为 JSON 序列化值。
 * @returns 描述文本。
 *
 */
  public toJSON(): string {
    return this.props.value
  }

  /**
   *
   * 转为可读字符串。
   * @returns 描述文本。
   *
   */
  public toString(): string {
    return this.props.value
  }

  /**
   *
   * 校验描述文本是否合法。
   * @param value 描述文本（trim 后）。
   *
   */
  private static assertValid(value: string): void {
    const s = String(value).trim()
    if (s === '') {
      throw new Error('DefectDescription: 描述不能为空')
    }
    if (s.length > DefectDescription.MaxLength) {
      throw new Error('DefectDescription: 描述长度不能超过 500 字符')
    }
  }
}

