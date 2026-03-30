import { describe, it, expect } from 'vitest'
import { DefectDescription } from './DefectDescription'

describe('DefectDescription', () => {
  it('from: 会 trim，且同值相等', () => {
    const a = DefectDescription.from('  abc  ')
    const b = DefectDescription.from('abc')
    expect(a.value).toBe('abc')
    expect(a.equals(b)).toBe(true)
    expect(a.toJSON()).toBe('abc')
    expect(a.toString()).toBe('abc')
  })

  it('from: 空/空白抛错', () => {
    expect(() => DefectDescription.from('')).toThrowError()
    expect(() => DefectDescription.from('   ')).toThrowError()
  })

  it('from: 超过 500 字符抛错', () => {
    const s = 'a'.repeat(DefectDescription.MaxLength + 1)
    expect(() => DefectDescription.from(s)).toThrowError()
  })
})
