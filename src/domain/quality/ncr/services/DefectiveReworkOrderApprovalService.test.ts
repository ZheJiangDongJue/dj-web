import { describe, it, expect } from 'vitest'
import { DefectiveReworkOrder } from '../entities/DefectiveReworkOrder'
import { DefectiveReworkOrderDetail } from '../entities/DefectiveReworkOrderDetail'
import { ReworkOrderStatus, ReworkOrderStatusFlag } from '../value-objects/ReworkOrderStatus'
import { DefectiveReworkOrderApprovalService } from './DefectiveReworkOrderApprovalService'

describe('DefectiveReworkOrderApprovalService', () => {
  it('approve: 单据锁定（冻结/结案/作废）时返回失败，且不修改聚合', () => {
    const order = DefectiveReworkOrder.createDraft()
      .withInspectorEmployeeId(1)
      .withDefectiveProcessId(2)
      .addNewDetail('ok')
      .withStatus(ReworkOrderStatus.none().with(ReworkOrderStatusFlag.Frozen))

    const result = DefectiveReworkOrderApprovalService.approve(order)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('should not reach')
    expect(result.order).toBe(order)
    expect(result.error.code).toBe('ORDER_LOCKED')
    expect(result.events[0]).toMatchObject({ type: 'DEFECTIVE_REWORK_ORDER_APPROVAL_REJECTED', orderId: order.id })
  })

  it('approve: 已审批时返回失败（不可重复审批）', () => {
    const order = DefectiveReworkOrder.createDraft()
      .withInspectorEmployeeId(1)
      .withDefectiveProcessId(2)
      .addNewDetail('ok')
      .withStatus(ReworkOrderStatus.none().with(ReworkOrderStatusFlag.Approved))

    const result = DefectiveReworkOrderApprovalService.approve(order)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('should not reach')
    expect(result.error.code).toBe('ALREADY_APPROVED')
    expect(result.events[0]).toMatchObject({ type: 'DEFECTIVE_REWORK_ORDER_APPROVAL_REJECTED', orderId: order.id })
  })

  it('approve: 前置条件不满足时返回失败，并携带 violations', () => {
    const order = DefectiveReworkOrder.createDraft()
    const result = DefectiveReworkOrderApprovalService.approve(order)

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('should not reach')
    expect(result.error.code).toBe('APPROVE_PRECONDITION_FAILED')
    expect(result.error.violations?.map((v) => v.code)).toEqual(['INSPECTOR_REQUIRED', 'DEFECTIVE_PROCESS_REQUIRED'])
  })

  it('approve: 明细记录为空时返回失败，并指出明细序号与Id', () => {
    const badDetail = DefectiveReworkOrderDetail.fromNullableDescription(10, '')
    const order = DefectiveReworkOrder.createDraft()
      .withInspectorEmployeeId(1)
      .withDefectiveProcessId(2)
      .addDetail(badDetail)

    const result = DefectiveReworkOrderApprovalService.approve(order)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('should not reach')
    expect(result.error.code).toBe('APPROVE_PRECONDITION_FAILED')
    expect(result.error.violations?.[0]).toMatchObject({ code: 'DETAIL_DESCRIPTION_REQUIRED', detailId: 10, detailIndex: 1 })
  })

  it('approve: 满足前置条件时返回成功并追加 Approved 状态位', () => {
    const order = DefectiveReworkOrder.createDraft()
      .withInspectorEmployeeId(1)
      .withDefectiveProcessId(2)
      .addNewDetail('ok')

    const result = DefectiveReworkOrderApprovalService.approve(order)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('should not reach')

    expect(order.status.isApproved()).toBe(false)
    expect(result.order).not.toBe(order)
    expect(result.order.status.isApproved()).toBe(true)
    expect(result.events).toEqual([{ type: 'DEFECTIVE_REWORK_ORDER_APPROVED', orderId: order.id }])
  })

  it('unapprove: 单据锁定时返回失败', () => {
    const order = DefectiveReworkOrder.createDraft()
      .withInspectorEmployeeId(1)
      .withDefectiveProcessId(2)
      .addNewDetail('ok')
      .withStatus(ReworkOrderStatus.none().with(ReworkOrderStatusFlag.Approved).with(ReworkOrderStatusFlag.Frozen))

    const result = DefectiveReworkOrderApprovalService.unapprove(order)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('should not reach')
    expect(result.error.code).toBe('ORDER_LOCKED')
    expect(result.events[0]).toMatchObject({ type: 'DEFECTIVE_REWORK_ORDER_UNAPPROVAL_REJECTED', orderId: order.id })
  })

  it('unapprove: 未审批时返回失败', () => {
    const order = DefectiveReworkOrder.createDraft()
      .withInspectorEmployeeId(1)
      .withDefectiveProcessId(2)
      .addNewDetail('ok')

    const result = DefectiveReworkOrderApprovalService.unapprove(order)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('should not reach')
    expect(result.error.code).toBe('NOT_APPROVED')
  })

  it('unapprove: 已审批且未锁定时返回成功并移除 Approved 状态位', () => {
    const order = DefectiveReworkOrder.createDraft()
      .withInspectorEmployeeId(1)
      .withDefectiveProcessId(2)
      .addNewDetail('ok')
      .withStatus(ReworkOrderStatus.none().with(ReworkOrderStatusFlag.Approved))

    const result = DefectiveReworkOrderApprovalService.unapprove(order)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('should not reach')

    expect(order.status.isApproved()).toBe(true)
    expect(result.order).not.toBe(order)
    expect(result.order.status.isApproved()).toBe(false)
    expect(result.events).toEqual([{ type: 'DEFECTIVE_REWORK_ORDER_UNAPPROVED', orderId: order.id }])
  })
})

