import { describe, expect, test } from 'vitest'
import { isEmptyMeasureFrequency, parseMeasureFrequency } from './inspection'

describe('inspection.parseMeasureFrequency', () => {
  test('可区分空频率与显式频率', () => {
    expect(isEmptyMeasureFrequency('')).toBe(true)
    expect(isEmptyMeasureFrequency('   ')).toBe(true)
    expect(isEmptyMeasureFrequency(null)).toBe(true)
    expect(isEmptyMeasureFrequency(undefined)).toBe(true)
    expect(isEmptyMeasureFrequency('5')).toBe(false)
    expect(isEmptyMeasureFrequency('0')).toBe(false)
  })

  test('频率为空时默认启用全部实测项', () => {
    expect(parseMeasureFrequency('')).toBe(5)
    expect(parseMeasureFrequency('   ')).toBe(5)
    expect(parseMeasureFrequency(null)).toBe(5)
    expect(parseMeasureFrequency(undefined)).toBe(5)
  })

  test('频率为有效数字时按数字启用对应实测项', () => {
    expect(parseMeasureFrequency('1')).toBe(1)
    expect(parseMeasureFrequency('3')).toBe(3)
    expect(parseMeasureFrequency('5')).toBe(5)
  })

  test('频率为非法值时返回 0', () => {
    expect(parseMeasureFrequency('abc')).toBe(0)
  })
})
