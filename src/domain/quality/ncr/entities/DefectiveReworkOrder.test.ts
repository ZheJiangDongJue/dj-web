import { describe, it, expect } from 'vitest'
import { DefectiveReworkOrder } from './DefectiveReworkOrder'
import { DefectiveReworkOrderDetail } from './DefectiveReworkOrderDetail'
import { ErpDateTime } from '../value-objects/ErpDateTime'
import { Quantity } from '../value-objects/Quantity'
import { ReworkOrderStatus, ReworkOrderStatusFlag } from '../value-objects/ReworkOrderStatus'

describe('DefectiveReworkOrder', () => {
  it('createDraft: 默认创建草稿，且审批前置校验不通过（缺少检验员/不合格工序）', () => {
    const order = DefectiveReworkOrder.createDraft()
    expect(order.id).toBe(0)
    expect(order.details).toHaveLength(0)
    expect(order.canApprove()).toBe(false)
    expect(order.validateBeforeApprove().map((v) => v.code)).toEqual([
      'INSPECTOR_REQUIRED',
      'DEFECTIVE_PROCESS_REQUIRED',
    ])
  })

  it('构造: Id 非法抛错（负数/小数/非有限数）', () => {
    const order = DefectiveReworkOrder.createDraft()
    expect(() => order.withId(-1)).toThrowError()
    expect(() => order.withId(1.1)).toThrowError()
    expect(() => order.withId(Number.POSITIVE_INFINITY)).toThrowError()
    expect(() => order.withId(Number.MAX_SAFE_INTEGER + 1)).toThrowError()
  })

  it('构造: 明细 Id 必须唯一', () => {
    const d1 = DefectiveReworkOrderDetail.fromNullableDescription(1, 'a')
    const d2 = DefectiveReworkOrderDetail.fromNullableDescription(1, 'b')
    expect(() => DefectiveReworkOrder.createDraft().withDetails([d1, d2])).toThrowError()
  })

  it('addNewDetail: 生成负数临时 Id（-1、-2...），并保持唯一性', () => {
    const order1 = DefectiveReworkOrder.createDraft().addNewDetail('a')
    expect(order1.details[0].id).toBe(-1)

    const order2 = order1.addNewDetail('b')
    expect(order2.details[1].id).toBe(-2)
  })

  it('addDetail/removeDetail: 管理明细生命周期', () => {
    const detail = DefectiveReworkOrderDetail.fromNullableDescription(10, 'x')
    const order1 = DefectiveReworkOrder.createDraft().addDetail(detail)
    expect(order1.details).toHaveLength(1)

    const order2 = order1.removeDetail(10)
    expect(order2.details).toHaveLength(0)
  })

  it('addDetail: 重复明细 Id 会抛错', () => {
    const detail = DefectiveReworkOrderDetail.fromNullableDescription(10, 'x')
    const order = DefectiveReworkOrder.createDraft().addDetail(detail)
    expect(() => order.addDetail(detail)).toThrowError()
  })

  it('validateBeforeApprove: 缺少明细记录会返回对应错误项', () => {
    const detailMissing = DefectiveReworkOrderDetail.fromNullableDescription(1, null)
    const order = DefectiveReworkOrder.createDraft()
      .withInspectorEmployeeId(100)
      .withDefectiveProcessId(200)
      .addDetail(detailMissing)

    const violations = order.validateBeforeApprove()
    expect(violations.map((v) => v.code)).toEqual(['DETAIL_DESCRIPTION_REQUIRED'])
    expect(violations[0]).toMatchObject({ detailId: 1, detailIndex: 1 })
  })

  it('assertCanApprove: 不满足前置条件会抛错；满足时不抛', () => {
    const bad = DefectiveReworkOrder.createDraft()
    expect(() => bad.assertCanApprove()).toThrowError()

    const ok = DefectiveReworkOrder.createDraft()
      .withInspectorEmployeeId(1)
      .withDefectiveProcessId(2)
      .addNewDetail('ok')
    expect(() => ok.assertCanApprove()).not.toThrow()
  })

  it('details getter: 返回新数组，避免外部修改内部列表', () => {
    const order = DefectiveReworkOrder.createDraft().addNewDetail('a')
    const list = order.details as any[]
    list.push(DefectiveReworkOrderDetail.fromNullableDescription(99, 'x'))
    expect(order.details).toHaveLength(1)
  })

  it('getter/withStatus: 可读取全部关键字段并更新状态', () => {
    const order = new DefectiveReworkOrder({
      id: 1,
      status: ReworkOrderStatus.none().with(ReworkOrderStatusFlag.Approved),
      inspectorEmployeeId: 10,
      defectiveProcessId: 20,
      deliveryTime: ErpDateTime.from('2020-01-02 03:04:05'),
      repairTime: ErpDateTime.from('2020-01-03 04:05:06'),
      preCompleteBadQty: Quantity.from(1),
      checkBadQty: Quantity.from(2),
      passBadQty: Quantity.from(3),
      reworkQty: Quantity.from(4),
      notPassBadQty: Quantity.from(5),
      details: [DefectiveReworkOrderDetail.fromNullableDescription(1, 'a')],
    })

    expect(order.status.isApproved()).toBe(true)
    expect(order.inspectorEmployeeId).toBe(10)
    expect(order.defectiveProcessId).toBe(20)
    expect(order.deliveryTime?.formatErp()).toBe('2020-01-02 03:04:05')
    expect(order.repairTime?.formatErp()).toBe('2020-01-03 04:05:06')
    expect(order.preCompleteBadQty.value).toBe(1)
    expect(order.checkBadQty.value).toBe(2)
    expect(order.passBadQty.value).toBe(3)
    expect(order.reworkQty.value).toBe(4)
    expect(order.notPassBadQty.value).toBe(5)
    expect(order.details).toHaveLength(1)

    const updated = order.withStatus(ReworkOrderStatus.none())
    expect(updated).not.toBe(order)
    expect(updated.status.value).toBe(0)
  })

  it('withInspectorEmployeeId/withDefectiveProcessId: 非法值会抛错（非负安全整数约束）', () => {
    const order = DefectiveReworkOrder.createDraft()
    expect(() => order.withInspectorEmployeeId(-1)).toThrowError()
    expect(() => order.withInspectorEmployeeId(1.1)).toThrowError()
    expect(() => order.withInspectorEmployeeId(Number.MAX_SAFE_INTEGER + 1)).toThrowError()

    expect(() => order.withDefectiveProcessId(-1)).toThrowError()
    expect(() => order.withDefectiveProcessId(1.1)).toThrowError()
    expect(() => order.withDefectiveProcessId(Number.MAX_SAFE_INTEGER + 1)).toThrowError()
  })
})
