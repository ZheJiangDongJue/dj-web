import { describe, expect, it } from 'vitest'
import { extractErrorMessage, normalizePositiveInt, pickBillId } from './billCommon'

describe('billCommon', () => {
  it('normalizePositiveInt 只接受合法正整数', () => {
    expect(normalizePositiveInt(1)).toBe(1)
    expect(normalizePositiveInt('123')).toBe(123)
    expect(normalizePositiveInt(0)).toBeNull()
    expect(normalizePositiveInt(-1)).toBeNull()
    expect(normalizePositiveInt(1.5)).toBeNull()
    expect(normalizePositiveInt(Number.MAX_SAFE_INTEGER + 1)).toBeNull()
    expect(normalizePositiveInt('abc')).toBeNull()
    expect(normalizePositiveInt(null)).toBeNull()
  })

  it('pickBillId 按候选键顺序提取', () => {
    expect(pickBillId({ id: 1 })).toBe(1)
    expect(pickBillId({ Id: 2 })).toBe(2)
    expect(pickBillId({ ID: 3 })).toBe(3)
    expect(pickBillId({ BillId: 4 })).toBe(4)
    expect(pickBillId({ billId: 5 })).toBe(5)
  })

  it('pickBillId 在无效输入时返回 0', () => {
    expect(pickBillId({})).toBe(0)
    expect(pickBillId(null)).toBe(0)
    expect(pickBillId({ id: 0, Id: -1 })).toBe(0)
  })

  it('extractErrorMessage 提取 message 或返回 null', () => {
    expect(extractErrorMessage('boom')).toBe('boom')
    expect(extractErrorMessage(new Error('oops'))).toBe('oops')
    expect(extractErrorMessage({ message: 'fail' })).toBe('fail')
    expect(extractErrorMessage({ message: undefined })).toBeNull()
    expect(extractErrorMessage({})).toBeNull()
    expect(extractErrorMessage(null)).toBeNull()
  })
})

