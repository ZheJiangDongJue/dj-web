import { Entity } from '@/domain/shared/entity'
import { InspectionQuantitySplit } from '../value-objects/InspectionQuantitySplit'
import { InspectionResult } from '../value-objects/InspectionResult'
import { MeasureRecords } from '../value-objects/MeasureRecords'

/**
 *
 * 末道检验明细标识。
 *
 */
 export type FinalInspectionDetailId = number

/**
 *
 * 末道检验明细属性集。
 *
 */
 export type FinalInspectionDetailProps = {

  id: FinalInspectionDetailId
  /**
   *
   * 项目名称。
   *
   */
  projectName: string
  /**
   *
   * 检验内容。
   *
   */
  content: string
  /**
   *
   * 数量拆分。
   *
   */
  quantitySplit: InspectionQuantitySplit
  /**
   *
   * 判定结果。
   *
   */
  result: InspectionResult
  /**
   *
   * AQL。
   *
   */
  aql: string
  /**
   *
   * ACRE。
   *
   */
  acre: string
  /**
   *
   * 检验方法。
   *
   */
  method: string
  /**
   *
   * 检验频率。
   *
   */
  frequency: string
  /**
   *
   * 实测记录。
   *
   */
  measureRecords: MeasureRecords
  /**
   *
   * 下限。
   *
   */
  downQValue: string
  /**
   *
   * 上限。
   *
   */
  upQValue: string
  /**
   *
   * 规格值。
   *
   */
  cmpQValue: string
  /**
   *
   * 合格率。
   *
   */
  passRate: number
}

/**
 *
 * 末道检验明细实体。
 *
 */
 export class FinalInspectionDetail extends Entity<FinalInspectionDetailId> {

/**
 *
 * 内部属性。
 *
 */
  private readonly _props: FinalInspectionDetailProps

  /**
   *
   * 创建明细实体。
   * @param props 属性集合。
   *
   */
  public constructor(props: FinalInspectionDetailProps) {
    super(props.id)
    this._props = FinalInspectionDetail.normalizeProps(props)
  }

  /**
   *
   * 获取项目名称。
   *
   */
  public get projectName(): string {
    return this._props.projectName
  }

  /**
   *
   * 获取检验内容。
   *
   */
  public get content(): string {
    return this._props.content
  }

  /**
   *
   * 获取数量拆分。
   *
   */
  public get quantitySplit(): InspectionQuantitySplit {
    return this._props.quantitySplit
  }

  /**
   *
   * 获取判定结果。
   *
   */
  public get result(): InspectionResult {
    return this._props.result
  }

  /**
   *
   * 获取 AQL。
   *
   */
  public get aql(): string {
    return this._props.aql
  }

  /**
   *
   * 获取 ACRE。
   *
   */
  public get acre(): string {
    return this._props.acre
  }

  /**
   *
   * 获取检验方法。
   *
   */
  public get method(): string {
    return this._props.method
  }

  /**
   *
   * 获取检验频率。
   *
   */
  public get frequency(): string {
    return this._props.frequency
  }

  /**
   *
   * 获取实测记录。
   *
   */
  public get measureRecords(): MeasureRecords {
    return this._props.measureRecords
  }

  /**
   *
   * 获取下限值。
   *
   */
  public get downQValue(): string {
    return this._props.downQValue
  }

  /**
   *
   * 获取上限值。
   *
   */
  public get upQValue(): string {
    return this._props.upQValue
  }

  /**
   *
   * 获取规格值。
   *
   */
  public get cmpQValue(): string {
    return this._props.cmpQValue
  }

  /**
   *
   * 获取合格率。
   *
   */
  public get passRate(): number {
    return this._props.passRate
  }

  /**
   *
   * 导出属性快照。
   * @returns 不可变属性集。
   *
   */
  public toProps(): FinalInspectionDetailProps {
    return {
      ...this._props,
      measureRecords: this._props.measureRecords,
      quantitySplit: this._props.quantitySplit,
    }
  }

  /**
   *
   * 标准化属性输入。
   * @param props 原始属性。
   * @returns 标准化后的属性。
   *
   */
  private static normalizeProps(props: FinalInspectionDetailProps): FinalInspectionDetailProps {
    return {
      id: this.normalizeNumber(props.id),
      projectName: this.normalizeText(props.projectName),
      content: this.normalizeText(props.content),
      quantitySplit: props.quantitySplit,
      result: props.result,
      aql: this.normalizeText(props.aql),
      acre: this.normalizeText(props.acre),
      method: this.normalizeText(props.method),
      frequency: this.normalizeText(props.frequency),
      measureRecords: props.measureRecords,
      downQValue: this.normalizeText(props.downQValue),
      upQValue: this.normalizeText(props.upQValue),
      cmpQValue: this.normalizeText(props.cmpQValue),
      passRate: this.normalizeNumber(props.passRate),
    }
  }

  /**
   *
   * 归一化数字，非法时回退为 0。
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
   * 归一化文本，空值回退为空串。
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
