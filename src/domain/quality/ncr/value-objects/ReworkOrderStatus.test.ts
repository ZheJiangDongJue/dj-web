import { describe, it, expect } from 'vitest'
import { ReworkOrderStatus, ReworkOrderStatusFlag } from './ReworkOrderStatus'

describe('ReworkOrderStatus', () => {
  it('none: 默认值为 0，且不处于锁定/审批等状态', () => {
    const s = ReworkOrderStatus.none()
    expect(s.value).toBe(0)
    expect(s.isFrozen()).toBe(false)
    expect(s.isClosed()).toBe(false)
    expect(s.isVoided()).toBe(false)
    expect(s.isApproved()).toBe(false)
    expect(s.isLocked()).toBe(false)
  })

  it('has/with/without: 正确处理位标记组合', () => {
    const s = ReworkOrderStatus.none()
      .with(ReworkOrderStatusFlag.Frozen)
      .with(ReworkOrderStatusFlag.Approved)

    expect(s.isFrozen()).toBe(true)
    expect(s.isApproved()).toBe(true)
    expect(s.isLocked()).toBe(true)
    expect(s.isClosed()).toBe(false)
    expect(s.toJSON()).toBe(ReworkOrderStatusFlag.Frozen | ReworkOrderStatusFlag.Approved)
    expect(s.toString()).toBe(String(ReworkOrderStatusFlag.Frozen | ReworkOrderStatusFlag.Approved))

    const removed = s.without(ReworkOrderStatusFlag.Frozen)
    expect(removed.isFrozen()).toBe(false)
    expect(removed.isApproved()).toBe(true)
    expect(removed.isLocked()).toBe(false)
  })

  it('isLocked: 仅冻结/结案/作废视为锁定（已审批不算锁定）', () => {
    const approvedOnly = ReworkOrderStatus.from(ReworkOrderStatusFlag.Approved)
    expect(approvedOnly.isApproved()).toBe(true)
    expect(approvedOnly.isLocked()).toBe(false)
  })

  it('equals: 同值应相等', () => {
    expect(ReworkOrderStatus.from(3).equals(ReworkOrderStatus.from(3))).toBe(true)
    expect(ReworkOrderStatus.from(3).equals(ReworkOrderStatus.from(2))).toBe(false)
  })

  it('from: 非法输入抛错（NaN/Infinity/小数/负数/超出位运算安全范围）', () => {
    expect(() => ReworkOrderStatus.from(Number.NaN)).toThrowError()
    expect(() => ReworkOrderStatus.from(Number.POSITIVE_INFINITY)).toThrowError()
    expect(() => ReworkOrderStatus.from(1.1)).toThrowError()
    expect(() => ReworkOrderStatus.from(-1)).toThrowError()
    expect(() => ReworkOrderStatus.from(ReworkOrderStatus.MaxBitwiseSafeValue + 1)).toThrowError()
  })
})
