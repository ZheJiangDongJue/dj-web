import { describe, it, expect } from 'vitest'
import { ErpDateTime } from './ErpDateTime'

describe('ErpDateTime', () => {
  it('fromNullable: null/undefined/空白字符串返回 null', () => {
    expect(ErpDateTime.fromNullable(null)).toBeNull()
    expect(ErpDateTime.fromNullable(undefined)).toBeNull()
    expect(ErpDateTime.fromNullable('')).toBeNull()
    expect(ErpDateTime.fromNullable('   ')).toBeNull()
  })

  it('from: 支持 YYYY-MM-DD 并格式化为本地 ERP 字符串', () => {
    const d = ErpDateTime.from('2020-01-02')
    expect(d.formatErp()).toBe('2020-01-02 00:00:00')
  })

  it('from: 支持 YYYY-MM-DD HH:mm:ss，并保持格式化一致', () => {
    const d = ErpDateTime.from('2020-01-02 03:04:05')
    expect(d.formatErp()).toBe('2020-01-02 03:04:05')
  })

  it('from: 支持 ISO UTC（Z）并能输出一致的 toISOString', () => {
    const d = ErpDateTime.from('2020-01-01T00:00:00Z')
    expect(d.toISOString()).toBe('2020-01-01T00:00:00.000Z')
  })

  it('fromDate/toDate/epochMs/toJSON: 提供防御性 Date 与序列化能力', () => {
    const raw = new Date(2020, 0, 1, 12, 34, 56, 0)
    const d = ErpDateTime.fromDate(raw)

    expect(d.epochMs).toBe(raw.getTime())

    const out = d.toDate()
    expect(out).not.toBe(raw)
    expect(out.getTime()).toBe(raw.getTime())

    expect(d.toJSON()).toBe(d.formatErp())
  })

  it('compareTo/isBefore/isAfter: 可比较大小', () => {
    const a = ErpDateTime.from('2020-01-01 00:00:00')
    const b = ErpDateTime.from('2020-01-01 00:00:01')
    const c = ErpDateTime.from('2020-01-01 00:00:01')

    expect(a.compareTo(b)).toBe(-1)
    expect(b.compareTo(a)).toBe(1)
    expect(b.compareTo(c)).toBe(0)
    expect(a.isBefore(b)).toBe(true)
    expect(b.isAfter(a)).toBe(true)
  })

  it('from: 非法日期时间抛错（格式不支持/范围不合法/闰年规则）', () => {
    expect(() => ErpDateTime.from('')).toThrowError()
    expect(() => ErpDateTime.from('2020/01/01')).toThrowError()

    // 月份/日期范围
    expect(() => ErpDateTime.from('2020-13-01')).toThrowError()
    expect(() => ErpDateTime.from('2020-02-30')).toThrowError()
    expect(() => ErpDateTime.from('2020-01-01 25:00:00')).toThrowError()
    expect(() => ErpDateTime.from('2020-01-01 23:60:00')).toThrowError()

    // 闰年：2020-02-29 合法，2021-02-29 非法
    expect(ErpDateTime.from('2020-02-29 00:00:00').formatErp()).toBe('2020-02-29 00:00:00')
    expect(() => ErpDateTime.from('2021-02-29')).toThrowError()

    // 世纪年规则：1900 不是闰年，2000 是闰年
    expect(() => ErpDateTime.from('1900-02-29')).toThrowError()
    expect(ErpDateTime.from('2000-02-29').formatErp()).toBe('2000-02-29 00:00:00')

    // 30 天月份：4 月 30 日合法，4 月 31 日非法
    expect(ErpDateTime.from('2020-04-30').formatErp()).toBe('2020-04-30 00:00:00')
    expect(() => ErpDateTime.from('2020-04-31')).toThrowError()
  })
})
