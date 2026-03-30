import { ValueObject } from '@/domain/shared/value-object'

/**
 *
 * <c>ErpDateTime</c> 的内部属性集合。
 *
 */
 export type ErpDateTimeProps = {

/**
 *
 * 以毫秒时间戳表达的时间点（epoch milliseconds）。
 * @remarks
 * 选择时间戳而非 Date 对象，避免 Date 的可变方法（setTime 等）破坏值对象不可变性。
 *
 */
 readonly epochMs: number
 }

/**
 *
 * ERP 日期时间值对象。
 * @remarks
 * - ERP 侧常以字符串表示日期时间（如 'YYYY-MM-DD HH:mm:ss' / ISO 字符串）；\\n
 * - 本值对象统一解析并以时间戳存储，提供格式化与比较能力。\\n
 *
 */
 export class ErpDateTime extends ValueObject<ErpDateTimeProps> {

/**
 *
 * 从可空字符串创建值对象。
 * @remarks
 * - 当值为 null/undefined/空白字符串时，返回 null；\\n
 * - 其它情况按 <c>from</c> 规则解析。\\n
 * @param value 可空字符串。
 * @returns 值对象或 null。
 *
 */
  public static fromNullable(value: string | null | undefined): ErpDateTime | null {
    if (value == null) return null
    const trimmed = String(value).trim()
    if (trimmed === '') return null
    return ErpDateTime.from(trimmed)
  }

  /**
   *
   * 从字符串创建值对象。
   * @param value 日期时间字符串。
   * @returns 值对象。
   *
   */
  public static from(value: string): ErpDateTime {
    const epochMs = parseErpDateTimeStringToEpochMs(value)
    return new ErpDateTime({ epochMs })
  }

  /**
   *
   * 从 Date 创建值对象。
   * @param date Date 实例。
   * @returns 值对象。
   *
   */
  public static fromDate(date: Date): ErpDateTime {
    const epochMs = date.getTime()
    return new ErpDateTime({ epochMs })
  }

  /**
   *
   * 创建 ERP 日期时间值对象。
   * @param props 内部属性集合。
   *
   */
  private constructor(props: ErpDateTimeProps) {
    ErpDateTime.assertValidEpochMs(props.epochMs)
    super(props)
  }

  /**
   *
   * 获取时间戳（毫秒）。
   *
   */
 public get epochMs(): number {
 return this.props.epochMs
 }

/**
 *
 * 转为 Date（防御性拷贝）。
 * @returns 新的 Date 实例。
 *
 */
  public toDate(): Date {
    return new Date(this.props.epochMs)
  }

  /**
   *
   * 输出 ERP 常用格式：YYYY-MM-DD HH:mm:ss（本地时区）。
   * @returns 格式化字符串。
   *
   */
  public formatErp(): string {
    return formatEpochMsToErpLocalString(this.props.epochMs)
  }

  /**
   *
   * 输出 ISO 字符串（UTC）。
   * @returns ISO 字符串。
   *
   */
  public toISOString(): string {
    return new Date(this.props.epochMs).toISOString()
  }

  /**
   *
   * 比较两个时间点。
   * @param other 另一个 ERP 日期时间。
   * @returns -1 表示早于；0 表示相等；1 表示晚于。
   *
   */
  public compareTo(other: ErpDateTime): -1 | 0 | 1 {
    if (this.props.epochMs === other.props.epochMs) return 0
    return this.props.epochMs < other.props.epochMs ? -1 : 1
  }

  /**
   *
   * 判断是否早于另一个时间点。
   * @param other 另一个 ERP 日期时间。
   * @returns 若早于返回 true，否则返回 false。
   *
   */
  public isBefore(other: ErpDateTime): boolean {
    return this.compareTo(other) === -1
  }

  /**
   *
   * 判断是否晚于另一个时间点。
   * @param other 另一个 ERP 日期时间。
   * @returns 若晚于返回 true，否则返回 false。
   *
   */
  public isAfter(other: ErpDateTime): boolean {
    return this.compareTo(other) === 1
  }

  /**
   *
   * 转为 JSON 序列化值（ERP 格式字符串）。
   * @returns 格式化字符串。
   *
   */
  public toJSON(): string {
    return this.formatErp()
  }

  /**
   *
   * 转为可读字符串（ERP 格式）。
   * @returns 字符串。
   *
   */
  public toString(): string {
    return this.formatErp()
  }

  /**
   *
   * 校验时间戳是否合法。
   * @param epochMs 时间戳（毫秒）。
   *
   */
  private static assertValidEpochMs(epochMs: number): void {
    if (!Number.isFinite(epochMs)) {
      throw new Error('ErpDateTime: epochMs 必须是有限数字')
    }
    if (!Number.isInteger(epochMs)) {
      throw new Error('ErpDateTime: epochMs 必须是整数')
    }
  }
}

/**
 *
 * 将数字补齐到 2 位。
 * @param n 数字。
 * @returns 补齐后的字符串。
 *
 */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 *
 * 将数字补齐到 3 位。
 * @param n 数字。
 * @returns 补齐后的字符串。
 *
 */
function pad3(n: number): string {
  return String(n).padStart(3, '0')
}

/**
 *
 * 将 epochMs 格式化为 ERP 常用本地时间字符串。
 * @param epochMs 时间戳（毫秒）。
 * @returns YYYY-MM-DD HH:mm:ss
 *
 */
function formatEpochMsToErpLocalString(epochMs: number): string {
  const d = new Date(epochMs)
  const y = d.getFullYear()
  const m = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  const hh = pad2(d.getHours())
  const mm = pad2(d.getMinutes())
  const ss = pad2(d.getSeconds())
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`
}

/**
 *
 * 解析 ERP 常见的日期时间字符串为 epochMs。
 * @remarks
 * 支持格式：\\n
 * - YYYY-MM-DD\\n
 * - YYYY-MM-DD HH:mm[:ss[.SSS]]（本地时区解释）\\n
 * - YYYY-MM-DDTHH:mm[:ss[.SSS]]Z（UTC）\\n
 * @param value 日期时间字符串。
 * @returns epochMs。
 *
 */
function parseErpDateTimeStringToEpochMs(value: string): number {
  const s = String(value).trim()
  if (s === '') throw new Error('ErpDateTime: 日期时间字符串不能为空')

  // ISO UTC：2020-01-01T00:00:00Z 或带毫秒
  const isoUtc = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?Z$/
  const isoUtcMatch = isoUtc.exec(s)
  if (isoUtcMatch) {
    const year = Number(isoUtcMatch[1])
    const month = Number(isoUtcMatch[2])
    const day = Number(isoUtcMatch[3])
    const hour = Number(isoUtcMatch[4])
    const minute = Number(isoUtcMatch[5])
    const second = isoUtcMatch[6] ? Number(isoUtcMatch[6]) : 0
    const ms = isoUtcMatch[7] ? Number(pad3(Number(isoUtcMatch[7]))) : 0
    assertValidDateTimeParts({ year, month, day, hour, minute, second, ms })
    return Date.UTC(year, month - 1, day, hour, minute, second, ms)
  }

  // ERP/本地：2020-01-01 或 2020-01-01 12:30:00(.123) / 2020-01-01T12:30:00(.123)
  const local =
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/
  const localMatch = local.exec(s)
  if (localMatch) {
    const year = Number(localMatch[1])
    const month = Number(localMatch[2])
    const day = Number(localMatch[3])
    const hour = localMatch[4] ? Number(localMatch[4]) : 0
    const minute = localMatch[5] ? Number(localMatch[5]) : 0
    const second = localMatch[6] ? Number(localMatch[6]) : 0
    const ms = localMatch[7] ? Number(pad3(Number(localMatch[7]))) : 0
    assertValidDateTimeParts({ year, month, day, hour, minute, second, ms })
    return new Date(year, month - 1, day, hour, minute, second, ms).getTime()
  }

  throw new Error('ErpDateTime: 无法解析日期时间字符串')
}

/**
 *
 * 日期时间分量。
 *
 */
 type DateTimeParts = {

/**
 *
 * 年。
 *
 */
  year: number
  /**
   *
   * 月（1-12）。
   *
   */
  month: number
  /**
   *
   * 日（1-31）。
   *
   */
  day: number
  /**
   *
   * 时（0-23）。
   *
   */
  hour: number
  /**
   *
   * 分（0-59）。
   *
   */
  minute: number
  /**
   *
   * 秒（0-59）。
   *
   */
  second: number
  /**
   *
   * 毫秒（0-999）。
   *
   */
  ms: number
}

/**
 *
 * 判断是否为闰年。
 * @param year 年份。
 * @returns 若为闰年返回 true，否则返回 false。
 *
 */
function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true
  if (year % 100 === 0) return false
  return year % 4 === 0
}

/**
 *
 * 获取指定年月的天数。
 * @param year 年份。
 * @param month 月份（1-12）。
 * @returns 天数。
 *
 */
function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      return 31
    case 4:
    case 6:
    case 9:
    case 11:
      return 30
    case 2:
      return isLeapYear(year) ? 29 : 28
    default:
      return 0
  }
}

/**
 *
 * 校验日期时间分量是否合法，避免 Date 自动进位导致的“隐式纠错”。
 * @param parts 日期时间分量。
 *
 */
function assertValidDateTimeParts(parts: DateTimeParts): void {
  const { year, month, day, hour, minute, second, ms } = parts

  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new Error('ErpDateTime: 年份不合法')
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('ErpDateTime: 月份不合法')
  }

  const dim = daysInMonth(year, month)
  if (!Number.isInteger(day) || day < 1 || day > dim) {
    throw new Error('ErpDateTime: 日期不合法')
  }

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error('ErpDateTime: 小时不合法')
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error('ErpDateTime: 分钟不合法')
  }
  if (!Number.isInteger(second) || second < 0 || second > 59) {
    throw new Error('ErpDateTime: 秒不合法')
  }
  if (!Number.isInteger(ms) || ms < 0 || ms > 999) {
    throw new Error('ErpDateTime: 毫秒不合法')
  }
}
