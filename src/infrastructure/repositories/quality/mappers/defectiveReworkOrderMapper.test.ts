import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/types/erp-db.generated', () => {
  class DefectiveReworkOrderDocument {
    public id?: unknown
    public defaultsTouched = false

    public initDefaults() {
      this.defaultsTouched = true
    }
  }

  class DefectiveReworkOrderDetail {
    public id?: unknown
    public defaultsTouched = false

    public initDefaults() {
      this.defaultsTouched = true
    }
  }

  return { DefectiveReworkOrderDetail, DefectiveReworkOrderDocument }
})

describe('DefectiveReworkOrderMapper', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('toDomain: 正确映射单据头/明细，并重建值对象', async () => {
    const { DefectiveReworkOrderMapper } = await import('./defectiveReworkOrderMapper')

    const rawDocument = {
      id: 100,
      Status: 8,
      Employeeid: 11,
      TypeofWorkid: 22,
      DeliveryTime: '2020-01-01 00:00:00',
      RepairTime: '2020-01-02 00:00:00',
      PreCmpBQty: 1,
      ChkBQty: 2,
      PassBQty: 3,
      RQty: 4,
      NotPassBQty: 5,
    }
    const details = [
      { id: 1, Adversesituation: 'a' },
      null,
      1,
      { id: 2, Adversesituation: null },
      'x',
    ]

    const entity = DefectiveReworkOrderMapper.toDomain({ document: rawDocument, details, fallbackId: 999 })

    expect(entity).not.toBeNull()
    expect(entity?.id).toBe(100)
    expect(entity?.status.value).toBe(8)
    expect(entity?.inspectorEmployeeId).toBe(11)
    expect(entity?.defectiveProcessId).toBe(22)
    expect(entity?.deliveryTime?.formatErp()).toBe('2020-01-01 00:00:00')
    expect(entity?.repairTime?.formatErp()).toBe('2020-01-02 00:00:00')
    expect(entity?.preCompleteBadQty.value).toBe(1)
    expect(entity?.checkBadQty.value).toBe(2)
    expect(entity?.passBadQty.value).toBe(3)
    expect(entity?.reworkQty.value).toBe(4)
    expect(entity?.notPassBadQty.value).toBe(5)

    expect(entity?.details).toHaveLength(2)
    expect(entity?.details[0].id).toBe(1)
    expect(entity?.details[0].defectDescriptionText).toBe('a')
    expect(entity?.details[1].id).toBe(2)
    expect(entity?.details[1].defectDescriptionText).toBe('')
  })

  it('toDomain: 单据头与明细同时为空时返回 null', async () => {
    const { DefectiveReworkOrderMapper } = await import('./defectiveReworkOrderMapper')

    const entity = DefectiveReworkOrderMapper.toDomain({ document: null, details: [], fallbackId: 1 })
    expect(entity).toBeNull()
  })

  it('toDomain: 兼容 Id/Status 等字段类型，并为缺失/重复明细 Id 生成临时负数 Id', async () => {
    const { DefectiveReworkOrderMapper } = await import('./defectiveReworkOrderMapper')

    const rawDocument = {
      Id: '888',
      Status: -1, // 非法（负数）应回退为 0
      Employeeid: 1.1, // 非整数应回退为 0
      TypeofWorkid: '22',
      DeliveryTime: new String('2020-01-01 00:00:00'),
      PreCmpBQty: Number.MAX_SAFE_INTEGER + 1, // 超出安全整数应回退为 0
    }

    const details = [
      { Adversesituation: '' },
      { id: 1, Adversesituation: 'x' },
      { id: 1, Adversesituation: 'y' }, // 重复 id
      { id: 0, Adversesituation: 'z' }, // 无效 id
      null,
    ]

    const entity = DefectiveReworkOrderMapper.toDomain({ document: rawDocument, details, fallbackId: 1 })

    expect(entity).not.toBeNull()
    expect(entity?.id).toBe(888)
    expect(entity?.status.value).toBe(0)
    expect(entity?.inspectorEmployeeId).toBe(0)
    expect(entity?.defectiveProcessId).toBe(22)
    expect(entity?.deliveryTime?.formatErp()).toBe('2020-01-01 00:00:00')
    expect(entity?.preCompleteBadQty.value).toBe(0)

    const ids = entity?.details.map((d) => d.id)
    expect(ids).toEqual([-1, 1, -2, -3])
    expect(entity?.details[0].defectDescriptionText).toBe('')
    expect(entity?.details[1].defectDescriptionText).toBe('x')
    expect(entity?.details[2].defectDescriptionText).toBe('y')
    expect(entity?.details[3].defectDescriptionText).toBe('z')
  })

  it('toDomain: details 非数组时按空明细处理，且当 document 缺少 Id 时使用 fallbackId（含非有限数回退）', async () => {
    const { DefectiveReworkOrderMapper } = await import('./defectiveReworkOrderMapper')

    const entityWithFallback = DefectiveReworkOrderMapper.toDomain({
      document: { Status: 8 },
      details: {},
      fallbackId: 123,
    })
    expect(entityWithFallback).not.toBeNull()
    expect(entityWithFallback?.id).toBe(123)
    expect(entityWithFallback?.details).toHaveLength(0)

    const entityWithBadFallback = DefectiveReworkOrderMapper.toDomain({
      document: { Status: 8 },
      details: {},
      fallbackId: Number.POSITIVE_INFINITY,
    } as any)
    expect(entityWithBadFallback).not.toBeNull()
    expect(entityWithBadFallback?.id).toBe(0)
  })

  it('toDomain: 明细 Adversesituation 非字符串时转为字符串', async () => {
    const { DefectiveReworkOrderMapper } = await import('./defectiveReworkOrderMapper')

    const entity = DefectiveReworkOrderMapper.toDomain({
      document: { id: 1, Status: 0 },
      details: [{ id: 1, Adversesituation: 123 }],
      fallbackId: 1,
    })

    expect(entity).not.toBeNull()
    expect(entity?.details).toHaveLength(1)
    expect(entity?.details[0].defectDescriptionText).toBe('123')
  })

  it('toErpSaveDto: 展开值对象为字段，并调用 initDefaults（含日期/明细 id 分支）', async () => {
    const { DefectiveReworkOrderMapper } = await import('./defectiveReworkOrderMapper')
    const { DefectiveReworkOrder } = await import('@/domain/quality/ncr/entities/DefectiveReworkOrder')
    const { DefectiveReworkOrderDetail } = await import('@/domain/quality/ncr/entities/DefectiveReworkOrderDetail')
    const { ErpDateTime } = await import('@/domain/quality/ncr/value-objects/ErpDateTime')
    const { Quantity } = await import('@/domain/quality/ncr/value-objects/Quantity')
    const { ReworkOrderStatus } = await import('@/domain/quality/ncr/value-objects/ReworkOrderStatus')

    const entity = new DefectiveReworkOrder({
      id: 0,
      status: ReworkOrderStatus.from(8),
      inspectorEmployeeId: 1,
      defectiveProcessId: 2,
      deliveryTime: ErpDateTime.from('2020-01-01 00:00:00'),
      repairTime: null,
      preCompleteBadQty: Quantity.from(1),
      checkBadQty: Quantity.from(2),
      passBadQty: Quantity.from(3),
      reworkQty: Quantity.from(4),
      notPassBadQty: Quantity.from(5),
      details: [
        DefectiveReworkOrderDetail.fromNullableDescription(-1, 'x'),
        DefectiveReworkOrderDetail.fromNullableDescription(5, 'y'),
      ],
    })

    const dto = DefectiveReworkOrderMapper.toErpSaveDto(entity)
    const bill = dto.bill as any
    const details = dto.details as any[]

    expect(bill).toMatchObject({
      id: 0,
      defaultsTouched: true,
      Status: 8,
      Employeeid: 1,
      TypeofWorkid: 2,
      RepairTime: null,
      PreCmpBQty: 1,
      ChkBQty: 2,
      PassBQty: 3,
      RQty: 4,
      NotPassBQty: 5,
    })
    expect(String(bill.DeliveryTime)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)

    expect(details).toHaveLength(2)
    expect(details[0]).toMatchObject({ id: 0, defaultsTouched: true, Adversesituation: 'x' })
    expect(details[1]).toMatchObject({ id: 5, defaultsTouched: true, Adversesituation: 'y' })
  })
})
