import { describe, it, expect } from 'vitest'
import { Quantity } from './Quantity'

describe('Quantity', () => {
  it('from/zero: 创建数量并保持值不变', () => {
    expect(Quantity.zero().value).toBe(0)
    expect(Quantity.from(3).value).toBe(3)
  })

  it('equals: 同值应相等', () => {
    expect(Quantity.from(1).equals(Quantity.from(1))).toBe(true)
    expect(Quantity.from(1).equals(Quantity.from(2))).toBe(false)
  })

  it('add/subtract: 支持加减，且减法结果不能为负', () => {
    const a = Quantity.from(2)
    const b = Quantity.from(3)

    expect(a.add(b).value).toBe(5)
    expect(b.subtract(a).value).toBe(1)
    expect(b.subtract(a).toJSON()).toBe(1)
    expect(b.subtract(a).toString()).toBe('1')
    expect(() => a.subtract(b)).toThrowError()
  })

  it('from: 非法输入抛错（负数/小数/非有限数/超出安全整数）', () => {
    expect(() => Quantity.from(-1)).toThrowError()
    expect(() => Quantity.from(1.1)).toThrowError()
    expect(() => Quantity.from(Number.NaN)).toThrowError()
    expect(() => Quantity.from(Number.POSITIVE_INFINITY)).toThrowError()
    expect(() => Quantity.from(Number.MAX_SAFE_INTEGER + 1)).toThrowError()
  })
})
