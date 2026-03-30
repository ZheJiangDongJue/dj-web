import { beforeEach, describe, expect, it, vi } from 'vitest'

type Mock = ReturnType<typeof vi.fn>

vi.mock('@/lib/erp/bill-api', () => ({
  GetBillWithDetails: vi.fn(),
  GeneralBillSave: vi.fn(),
  GeneralBillDelete: vi.fn(),
}))

vi.mock('@/lib/erp/lookup-core', () => ({
  getItemsExSafe: vi.fn(),
}))

vi.mock('@/app/features/erp/quality/shared/helpers', () => ({
  getErpUserFromStorage: vi.fn(() => ({ name: 'tester' })),
}))

vi.mock('@/types/erp-db.generated', () => {
  class FirstInspectionDocument {
    public id?: unknown
    public defaultsTouched = false

    public initDefaults() {
      this.defaultsTouched = true
    }
  }

  class FirstInspectionDetail {
    public id?: unknown
    public defaultsTouched = false

    public initDefaults() {
      this.defaultsTouched = true
    }
  }

  return { FirstInspectionDocument, FirstInspectionDetail }
})

describe('FirstInspectionRepositoryImpl', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('findById: 调用 GetBillWithDetails 并映射聚合', async () => {
    const { GetBillWithDetails } = await import('@/lib/erp/bill-api')
    const { FirstInspectionRepositoryImpl } = await import('./FirstInspectionRepositoryImpl')

    const getBillMock = GetBillWithDetails as unknown as Mock
    getBillMock.mockResolvedValueOnce({
      data: {
        Document: { id: 10, Status: 1, Employeeid: 2, ChkBQty: 3, PassBQty: 1, RQty: 1, NotPassBQty: 1 },
        Details: [{ id: 1, ChkBQty: 1, PassBQty: 1 }],
      },
    })

    const repo = new FirstInspectionRepositoryImpl()
    const entity = await repo.findById(10)

    expect(getBillMock).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'FirstInspectionDocument', billId: 10 }))
    expect(entity).not.toBeNull()
    expect(entity?.id).toBe(10)
    expect(entity?.employeeId).toBe(2)
    expect(entity?.quantitySplit.inspectQuantity).toBe(3)
    expect(entity?.details).toHaveLength(1)
  })

  it('findById: 支持直接返回 document/details 字段并使用 fallbackId', async () => {
    const { GetBillWithDetails } = await import('@/lib/erp/bill-api')
    const { FirstInspectionRepositoryImpl } = await import('./FirstInspectionRepositoryImpl')

    const getBillMock = GetBillWithDetails as unknown as Mock
    getBillMock.mockResolvedValueOnce({ document: { Status: 0, ChkBQty: 2, PassBQty: 1 }, details: [{ ChkBQty: 2, PassBQty: 1 }] })

    const repo = new FirstInspectionRepositoryImpl()
    const entity = await repo.findById(5)

    expect(entity).not.toBeNull()
    expect(entity?.id).toBe(5)
    expect(entity?.quantitySplit.inspectQuantity).toBe(1)
  })

  it('findById: document 为空且明细为空时返回 null', async () => {
    const { GetBillWithDetails } = await import('@/lib/erp/bill-api')
    const { FirstInspectionRepositoryImpl } = await import('./FirstInspectionRepositoryImpl')

    const getBillMock = GetBillWithDetails as unknown as Mock
    getBillMock.mockResolvedValueOnce({ data: { Document: null, Details: [] } })

    const repo = new FirstInspectionRepositoryImpl()
    await expect(repo.findById(1)).resolves.toBeNull()
  })

  it('findByConditions: 使用 getItemsExSafe 结果批量加载明细', async () => {
    const { GetBillWithDetails } = await import('@/lib/erp/bill-api')
    const { getItemsExSafe } = await import('@/lib/erp/lookup-core')
    const { FirstInspectionRepositoryImpl } = await import('./FirstInspectionRepositoryImpl')

    const getterMock = getItemsExSafe as unknown as Mock
    getterMock.mockResolvedValueOnce(async () => [{ id: 1 }, { Id: 2 }])

    const getBillMock = GetBillWithDetails as unknown as Mock
    getBillMock
      .mockResolvedValueOnce({ data: { Document: { id: 1, ChkBQty: 1, PassBQty: 1, RQty: 0, NotPassBQty: 0 }, Details: [] } })
      .mockResolvedValueOnce({ data: { Document: { id: 2, ChkBQty: 2, PassBQty: 1, RQty: 1, NotPassBQty: 0 }, Details: [] } })

    const repo = new FirstInspectionRepositoryImpl()
    const list = await repo.findByConditions({ status: 0 })

    expect(getterMock).toHaveBeenCalled()
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe(1)
    expect(list[1].quantitySplit.concessionQuantity).toBe(1)
  })

  it('findByConditions: 非数组返回时仅使用条件 Id 并做去重', async () => {
    const { GetBillWithDetails } = await import('@/lib/erp/bill-api')
    const { getItemsExSafe } = await import('@/lib/erp/lookup-core')
    const { FirstInspectionRepositoryImpl } = await import('./FirstInspectionRepositoryImpl')

    const getterMock = getItemsExSafe as unknown as Mock
    getterMock.mockResolvedValueOnce(async () => null)

    const getBillMock = GetBillWithDetails as unknown as Mock
    getBillMock
      .mockResolvedValueOnce({ data: { Document: { id: 3, ChkBQty: 1, PassBQty: 1, RQty: 0, NotPassBQty: 0 }, Details: [] } })
      .mockResolvedValueOnce({ data: { Document: { id: 4, ChkBQty: 2, PassBQty: 1, RQty: 1, NotPassBQty: 0 }, Details: [] } })

    const repo = new FirstInspectionRepositoryImpl()
    const list = await repo.findByConditions({ ids: [3, 4, 4], take: -1 })

    expect(list.map((i) => i.id)).toEqual([3, 4])
    expect(getBillMock).toHaveBeenCalledTimes(2)
  })

  it('findByConditions: 组合多条件构建 where 并正常查询', async () => {
    const { GetBillWithDetails } = await import('@/lib/erp/bill-api')
    const { getItemsExSafe } = await import('@/lib/erp/lookup-core')
    const { FirstInspectionRepositoryImpl } = await import('./FirstInspectionRepositoryImpl')

    const getterMock = getItemsExSafe as unknown as Mock
    getterMock.mockResolvedValueOnce(async () => [])

    const getBillMock = GetBillWithDetails as unknown as Mock
    getBillMock.mockResolvedValueOnce({ data: { Document: { id: 6, ChkBQty: 1, PassBQty: 1, RQty: 0, NotPassBQty: 0 }, Details: [] } })

    const repo = new FirstInspectionRepositoryImpl()
    const list = await repo.findByConditions({ ids: [6], status: 1, employeeId: 2, materialId: 3, typeOfWorkId: 4, innerKey: 'k' })

    expect(list).toHaveLength(1)
    expect(getterMock).toHaveBeenCalled()
    expect(getBillMock).toHaveBeenCalledWith(expect.objectContaining({ billId: 6 }))
  })

  it('save: 映射 DTO 调用 GeneralBillSave，并在返回新 Id 时更新聚合', async () => {
    const { GeneralBillSave } = await import('@/lib/erp/bill-api')
    const { FirstInspectionRepositoryImpl } = await import('./FirstInspectionRepositoryImpl')
    const { FirstInspection } = await import('@/domain/quality/fai/entities/FirstInspection')
    const { FirstInspectionDetail } = await import('@/domain/quality/fai/entities/FirstInspectionDetail')
    const { InspectionQuantitySplit } = await import('@/domain/quality/fqc/value-objects/InspectionQuantitySplit')
    const { InspectionResult } = await import('@/domain/quality/fqc/value-objects/InspectionResult')
    const { MeasureRecords } = await import('@/domain/quality/fqc/value-objects/MeasureRecords')

    const saveMock = GeneralBillSave as unknown as Mock
    saveMock.mockResolvedValueOnce({ BillId: 99 })

    const detail = new FirstInspectionDetail({
      id: 0,
      projectName: 'p',
      content: 'c',
      quantitySplit: InspectionQuantitySplit.create({ inspectQuantity: 1, okQuantity: 1, concessionQuantity: 0, ngQuantity: 0 }),
      result: InspectionResult.from(1),
      aql: '',
      acre: '',
      method: '',
      frequency: '',
      measureRecords: MeasureRecords.empty(),
      downQValue: '',
      upQValue: '',
      cmpQValue: '',
      passRate: 0,
    })

    const aggregate = FirstInspection.createDraft().withId(0)
    const repo = new FirstInspectionRepositoryImpl()
    const saved = await repo.save(new (aggregate.constructor as any)({ ...aggregate.toProps(), details: [detail] }))

    expect(saveMock).toHaveBeenCalled()
    expect(saved.id).toBe(99)
    const [payload] = saveMock.mock.calls[0] as unknown as [any]
    expect(payload.tableName).toBe('FirstInspectionDocument')
    expect(payload.bill).toMatchObject({ defaultsTouched: true })
  })

  it('save: 未返回新 Id 时保持原聚合', async () => {
    const { GeneralBillSave } = await import('@/lib/erp/bill-api')
    const { FirstInspectionRepositoryImpl } = await import('./FirstInspectionRepositoryImpl')
    const { FirstInspection } = await import('@/domain/quality/fai/entities/FirstInspection')

    const saveMock = GeneralBillSave as unknown as Mock
    saveMock.mockResolvedValueOnce({ objects: { BillId: 0 } })

    const aggregate = FirstInspection.createDraft().withId(7)
    const repo = new FirstInspectionRepositoryImpl()
    const saved = await repo.save(aggregate)

    expect(saved).toBe(aggregate)
  })

  it('save: 支持从 data.BillId 提取新 Id', async () => {
    const { GeneralBillSave } = await import('@/lib/erp/bill-api')
    const { FirstInspectionRepositoryImpl } = await import('./FirstInspectionRepositoryImpl')
    const { FirstInspection } = await import('@/domain/quality/fai/entities/FirstInspection')

    const saveMock = GeneralBillSave as unknown as Mock
    saveMock.mockResolvedValueOnce({ data: { BillId: 88 } })

    const repo = new FirstInspectionRepositoryImpl()
    const saved = await repo.save(FirstInspection.createDraft())

    expect(saved.id).toBe(88)
  })

  it('delete: 映射 DbChangedPackResult 至领域结果', async () => {
    const { GeneralBillDelete } = await import('@/lib/erp/bill-api')
    const { FirstInspectionRepositoryImpl } = await import('./FirstInspectionRepositoryImpl')

    const deleteMock = GeneralBillDelete as unknown as Mock
    deleteMock.mockResolvedValueOnce({ effectCount: 0, errorMessage: 'fail' })
    deleteMock.mockResolvedValueOnce({ effectCount: 1, ErrorMessage: null })

    const repo = new FirstInspectionRepositoryImpl()
    await expect(repo.delete(1)).resolves.toEqual({ success: false, message: 'fail' })
    await expect(repo.delete(2)).resolves.toEqual({ success: true, message: '' })

    expect(deleteMock).toHaveBeenCalledTimes(2)
  })
})

