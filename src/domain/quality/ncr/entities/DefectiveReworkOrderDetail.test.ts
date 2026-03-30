import { describe, it, expect } from 'vitest'
import { DefectiveReworkOrderDetail } from './DefectiveReworkOrderDetail'

describe('DefectiveReworkOrderDetail', () => {
  it('fromNullableDescription: 空值/空白会被归一化为 null', () => {
    const a = DefectiveReworkOrderDetail.fromNullableDescription(1, null)
    const b = DefectiveReworkOrderDetail.fromNullableDescription(2, '   ')

    expect(a.defectDescription).toBeNull()
    expect(a.defectDescriptionText).toBe('')
    expect(b.defectDescription).toBeNull()
  })

  it('fromNullableDescription: 非空字符串会构造 DefectDescription 并 trim', () => {
    const d = DefectiveReworkOrderDetail.fromNullableDescription(1, '  x  ')
    expect(d.defectDescription?.value).toBe('x')
    expect(d.defectDescriptionText).toBe('x')
  })

  it('withNullableDescription: 返回新实例，不修改原实例', () => {
    const a = DefectiveReworkOrderDetail.fromNullableDescription(1, 'a')
    const b = a.withNullableDescription(null)

    expect(a.defectDescriptionText).toBe('a')
    expect(b.defectDescriptionText).toBe('')
    expect(b).not.toBe(a)
    expect(b.id).toBe(a.id)
  })

  it('构造: 非法 Id 抛错（NaN/Infinity/小数/0/超出安全整数）', () => {
    expect(() => new DefectiveReworkOrderDetail({ id: Number.NaN, defectDescription: null })).toThrowError()
    expect(() => new DefectiveReworkOrderDetail({ id: Number.POSITIVE_INFINITY, defectDescription: null })).toThrowError()
    expect(() => new DefectiveReworkOrderDetail({ id: 1.1, defectDescription: null })).toThrowError()
    expect(() => new DefectiveReworkOrderDetail({ id: 0, defectDescription: null })).toThrowError()
    expect(() => new DefectiveReworkOrderDetail({ id: Number.MAX_SAFE_INTEGER + 1, defectDescription: null })).toThrowError()
  })

  it('toJSON: 输出普通对象', () => {
    const d = DefectiveReworkOrderDetail.fromNullableDescription(1, 'x')
    expect(d.toJSON()).toEqual({ id: 1, defectDescription: 'x' })
  })
})

