import { describe, expect, it } from 'vitest'
import { parseApprovalResponse, pickDocumentAndDetails, pickField, unwrapDataContainer } from './apiMessagePack'

describe('apiMessagePack', () => {
  it('unwrapDataContainer 优先 data / Data，否则回退根对象', () => {
    expect(unwrapDataContainer({ data: { a: 1 } })).toEqual({ a: 1 })
    expect(unwrapDataContainer({ Data: { a: 2 } })).toEqual({ a: 2 })
    expect(unwrapDataContainer({ a: 3 })).toEqual({ a: 3 })
    expect(unwrapDataContainer(null)).toBeNull()
  })

  it('pickField 按顺序选择第一个非 undefined 字段', () => {
    expect(pickField({ A: 1, a: 2 }, 'A', 'a')).toBe(1)
    expect(pickField({ a: 2 }, 'A', 'a')).toBe(2)
    expect(pickField({ x: 1 }, 'A', 'a')).toBeUndefined()
    expect(pickField(null, 'A')).toBeUndefined()
  })

  it('pickDocumentAndDetails 提取 document/details/message', () => {
    expect(pickDocumentAndDetails({ data: { Document: { id: 1 }, Details: [{ id: 11 }] } })).toEqual({
      document: { id: 1 },
      details: [{ id: 11 }],
      message: undefined,
    })
    expect(pickDocumentAndDetails({ data: { document: { id: 2 }, details: [{ id: 22 }] } })).toEqual({
      document: { id: 2 },
      details: [{ id: 22 }],
      message: undefined,
    })
    expect(pickDocumentAndDetails({ message: 'hi', data: { Document: { id: 3 }, Details: [] } })?.message).toBe('hi')
    expect(pickDocumentAndDetails({ data: {} })).toBeNull()
  })

  it('parseApprovalResponse 兼容多种 success/message 字段', () => {
    expect(parseApprovalResponse({ issuccess: true, message: 'ok' })).toEqual({ success: true, message: 'ok' })
    expect(parseApprovalResponse({ isSuccess: true }).success).toBe(true)
    expect(parseApprovalResponse({ Success: true }).success).toBe(true)
    expect(parseApprovalResponse({ success: 'true', message: 'x' }).success).toBe(false)
    expect(parseApprovalResponse({ success: false, ErrorMessage: 'bad' }).message).toBe('bad')
    expect(parseApprovalResponse({ success: false, msg: 'oops' }).message).toBe('oops')
  })
})

