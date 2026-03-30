import { describe, it, expect, vi, beforeEach } from 'vitest'

type Mock = ReturnType<typeof vi.fn>

vi.mock('@/lib/erp/bill-api', () => ({
  GetBillWithDetails: vi.fn(),
}))

vi.mock('@/app/features/erp/quality/ncr/models/ncrService', () => ({
  NCR_TABLE_NAME: 'NCR_TABLE',
  approveNcrBill: vi.fn(),
  deleteNcrBill: vi.fn(),
  extractNcrBillId: vi.fn(),
  saveNcrBill: vi.fn(),
  unapproveNcrBill: vi.fn(),
}))

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

describe('DefectiveReworkOrderRepositoryImpl', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('getById: 正确调用 GetBillWithDetails 并映射 Document/Details（data 包裹）', async () => {
    const { GetBillWithDetails } = await import('@/lib/erp/bill-api')
    const { NCR_TABLE_NAME } = await import('@/app/features/erp/quality/ncr/models/ncrService')
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const rawDocument = {
      id: 123,
      Status: 8,
      Employeeid: 11,
      TypeofWorkid: 22,
      DeliveryTime: null,
      RepairTime: null,
      PreCmpBQty: 1,
      ChkBQty: 2,
      PassBQty: 3,
      RQty: 4,
      NotPassBQty: 5,
    }
    const rawDetail1 = { id: 1, Adversesituation: 'a' }
    const rawDetail2 = { id: 2, Adversesituation: 'b' }

    const getBillMock = GetBillWithDetails as unknown as Mock
    getBillMock.mockResolvedValueOnce({
      data: {
        Document: rawDocument,
        Details: [rawDetail1, null, 1, rawDetail2, 'x'],
      },
    })

    const repo = new DefectiveReworkOrderRepositoryImpl()
    const entity = await repo.getById(99)

    expect(getBillMock).toHaveBeenCalledWith(
      expect.objectContaining({ tableName: NCR_TABLE_NAME, billId: 99 }),
    )

    expect(entity).not.toBeNull()
    expect(entity?.id).toBe(123)
    expect(entity?.inspectorEmployeeId).toBe(11)
    expect(entity?.defectiveProcessId).toBe(22)
    expect(entity?.status.value).toBe(8)

    expect(entity?.details).toHaveLength(2)
    expect(entity?.details[0].id).toBe(1)
    expect(entity?.details[0].defectDescriptionText).toBe('a')
    expect(entity?.details[1].id).toBe(2)
    expect(entity?.details[1].defectDescriptionText).toBe('b')
  })

  it('getById: 支持 payload 直接返回以及 document/details 字段名，并为缺失 Id 的明细生成临时 Id', async () => {
    const { GetBillWithDetails } = await import('@/lib/erp/bill-api')
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const getBillMock = GetBillWithDetails as unknown as Mock
    getBillMock.mockResolvedValueOnce({
      document: { Id: '888', Status: 0, Employeeid: 0, TypeofWorkid: 0 },
      details: [{ Adversesituation: '' }],
    })

    const repo = new DefectiveReworkOrderRepositoryImpl()
    const entity = await repo.getById(1)

    expect(entity).not.toBeNull()
    expect(entity?.id).toBe(888)
    expect(entity?.details).toHaveLength(1)
    expect(entity?.details[0].id).toBe(-1)
    expect(entity?.details[0].defectDescriptionText).toBe('')
  })

  it('getById: 未返回单据头且明细为空时返回 null', async () => {
    const { GetBillWithDetails } = await import('@/lib/erp/bill-api')
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const getBillMock = GetBillWithDetails as unknown as Mock
    getBillMock.mockResolvedValueOnce({ data: { Document: null, Details: [] } })

    const repo = new DefectiveReworkOrderRepositoryImpl()
    await expect(repo.getById(1)).resolves.toBeNull()
  })

  it('save: 映射领域对象为 DTO，并在返回新 Id 时更新聚合 Id', async () => {
    const { saveNcrBill, extractNcrBillId } = await import(
      '@/app/features/erp/quality/ncr/models/ncrService'
    )
    const { DefectiveReworkOrder } = await import('@/domain/quality/ncr/entities/DefectiveReworkOrder')
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const saveMock = saveNcrBill as unknown as Mock
    saveMock.mockResolvedValueOnce({ ok: true })

    const extractMock = extractNcrBillId as unknown as Mock
    extractMock.mockReturnValueOnce(555)

    const entity = DefectiveReworkOrder.createDraft()
      .withInspectorEmployeeId(1)
      .withDefectiveProcessId(2)
      .addNewDetail('x')

    const repo = new DefectiveReworkOrderRepositoryImpl()
    const saved = await repo.save(entity)

    expect(saved).not.toBe(entity)
    expect(saved.id).toBe(555)

    expect(saveMock).toHaveBeenCalledTimes(1)
    const [bill, details] = saveMock.mock.calls[0] as unknown as [any, any[]]
    expect(bill).toMatchObject({
      id: 0,
      defaultsTouched: true,
      Employeeid: 1,
      TypeofWorkid: 2,
      Status: 0,
      PreCmpBQty: 0,
    })
    expect(details).toHaveLength(1)
    expect(details[0]).toMatchObject({ id: 0, Adversesituation: 'x', defaultsTouched: true })
  })

  it('save: 兜底确保 DTO.id 与聚合 id 对齐（更新场景）', async () => {
    const { saveNcrBill, extractNcrBillId } = await import(
      '@/app/features/erp/quality/ncr/models/ncrService'
    )
    const { DefectiveReworkOrder } = await import('@/domain/quality/ncr/entities/DefectiveReworkOrder')
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const saveMock = saveNcrBill as unknown as Mock
    saveMock.mockResolvedValueOnce({ ok: true })

    const extractMock = extractNcrBillId as unknown as Mock
    extractMock.mockReturnValueOnce(777)

    const entity = DefectiveReworkOrder.createDraft()
      .withId(777)
      .withInspectorEmployeeId(1)
      .withDefectiveProcessId(2)

    const repo = new DefectiveReworkOrderRepositoryImpl()
    const saved = await repo.save(entity)

    expect(saved).toBe(entity)

    const [bill] = saveMock.mock.calls[0] as unknown as [any]
    expect(bill).toMatchObject({ id: 777 })
  })

  it('approve/unapprove: 统一映射为领域操作结果（success/message/code）', async () => {
    const { approveNcrBill, unapproveNcrBill } = await import(
      '@/app/features/erp/quality/ncr/models/ncrService'
    )
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const approveMock = approveNcrBill as unknown as Mock
    approveMock.mockResolvedValueOnce({ success: true, message: 'ok', code: 200 })

    const unapproveMock = unapproveNcrBill as unknown as Mock
    unapproveMock.mockResolvedValueOnce({ success: false, message: 123, status: 'BAD' })

    const repo = new DefectiveReworkOrderRepositoryImpl()

    await expect(repo.approve(1)).resolves.toEqual({ success: true, message: 'ok', code: 200 })
    await expect(repo.unapprove(2)).resolves.toEqual({ success: false, message: '123', code: 'BAD' })

    expect(approveMock).toHaveBeenCalledWith(1)
    expect(unapproveMock).toHaveBeenCalledWith(2)
  })

  it('approve/unapprove: 兼容 success/message/code 缺失与 detailCode 字段', async () => {
    const { approveNcrBill, unapproveNcrBill } = await import(
      '@/app/features/erp/quality/ncr/models/ncrService'
    )
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const approveMock = approveNcrBill as unknown as Mock
    approveMock.mockResolvedValueOnce({ message: null, detailCode: 401 })

    const unapproveMock = unapproveNcrBill as unknown as Mock
    unapproveMock.mockResolvedValueOnce({ success: true, message: 'ok' })

    const repo = new DefectiveReworkOrderRepositoryImpl()

    await expect(repo.approve(1)).resolves.toEqual({ success: false, message: '', code: 401 })
    await expect(repo.unapprove(2)).resolves.toEqual({ success: true, message: 'ok', code: undefined })
  })

  it('approve/unapprove: 当返回体缺省字段时使用状态码兜底', async () => {
    const { approveNcrBill, unapproveNcrBill } = await import(
      '@/app/features/erp/quality/ncr/models/ncrService'
    )
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const approveMock = approveNcrBill as unknown as Mock
    approveMock.mockResolvedValueOnce({ status: 500 })

    const unapproveMock = unapproveNcrBill as unknown as Mock
    unapproveMock.mockResolvedValueOnce({})

    const repo = new DefectiveReworkOrderRepositoryImpl()

    await expect(repo.approve(3)).resolves.toEqual({ success: false, message: '', code: 500 })
    await expect(repo.unapprove(4)).resolves.toEqual({ success: false, message: '', code: undefined })
  })

  it('approve: 优先读取 code 字段作为业务码', async () => {
    const { approveNcrBill } = await import('@/app/features/erp/quality/ncr/models/ncrService')
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const approveMock = approveNcrBill as unknown as Mock
    approveMock.mockResolvedValueOnce({ success: true, message: 'done', code: 201 })

    const repo = new DefectiveReworkOrderRepositoryImpl()
    await expect(repo.approve(8)).resolves.toEqual({ success: true, message: 'done', code: 201 })
  })

  it('delete: effectCount 优先决定 success，并映射错误信息', async () => {
    const { deleteNcrBill } = await import('@/app/features/erp/quality/ncr/models/ncrService')
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const deleteMock = deleteNcrBill as unknown as Mock
    deleteMock.mockResolvedValueOnce({ effectCount: 1, errorMessage: 'deleted' })
    deleteMock.mockResolvedValueOnce({ effectCount: 0, errorMessage: 'no-op' })

    const repo = new DefectiveReworkOrderRepositoryImpl()

    await expect(repo.delete(1)).resolves.toEqual({ success: true, message: 'deleted' })
    await expect(repo.delete(2)).resolves.toEqual({ success: false, message: 'no-op' })
  })

  it('delete: 无 effectCount 时使用 success 字段兜底', async () => {
    const { deleteNcrBill } = await import('@/app/features/erp/quality/ncr/models/ncrService')
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const deleteMock = deleteNcrBill as unknown as Mock
    deleteMock.mockResolvedValueOnce({ success: true, Message: 'ok' })

    const repo = new DefectiveReworkOrderRepositoryImpl()
    await expect(repo.delete(3)).resolves.toEqual({ success: true, message: 'ok' })
  })

  it('delete: 无 effectCount 时兼容 isSuccess/success 字段', async () => {
    const { deleteNcrBill } = await import('@/app/features/erp/quality/ncr/models/ncrService')
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const deleteMock = deleteNcrBill as unknown as Mock
    deleteMock.mockResolvedValueOnce({ isSuccess: true, message: 'ok' })
    deleteMock.mockResolvedValueOnce({ success: false, Message: 'bad' })

    const repo = new DefectiveReworkOrderRepositoryImpl()

    await expect(repo.delete(1)).resolves.toEqual({ success: true, message: 'ok' })
    await expect(repo.delete(2)).resolves.toEqual({ success: false, message: 'bad' })
  })

  it('delete: 兼容 effectCount 字符串、非布尔 success 以及非字符串 message', async () => {
    const { deleteNcrBill } = await import('@/app/features/erp/quality/ncr/models/ncrService')
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const deleteMock = deleteNcrBill as unknown as Mock
    deleteMock.mockResolvedValueOnce({ effectCount: '2', ErrorMessage: 123 })
    deleteMock.mockResolvedValueOnce({ effectCount: 'NaN', isSuccess: 'true', success: 'false', message: null })

    const repo = new DefectiveReworkOrderRepositoryImpl()

    await expect(repo.delete(1)).resolves.toEqual({ success: true, message: '123' })
    await expect(repo.delete(2)).resolves.toEqual({ success: false, message: '' })
  })

  it('delete: 当所有成功标记缺失时回退为空字符串提示', async () => {
    const { deleteNcrBill } = await import('@/app/features/erp/quality/ncr/models/ncrService')
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const deleteMock = deleteNcrBill as unknown as Mock
    deleteMock.mockResolvedValueOnce({})

    const repo = new DefectiveReworkOrderRepositoryImpl()
    await expect(repo.delete(5)).resolves.toEqual({ success: false, message: '' })
  })

  it('delete: 兼容 Message 字段与 Success 大写分支', async () => {
    const { deleteNcrBill } = await import('@/app/features/erp/quality/ncr/models/ncrService')
    const { DefectiveReworkOrderRepositoryImpl } = await import('./DefectiveReworkOrderRepositoryImpl')

    const deleteMock = deleteNcrBill as unknown as Mock
    deleteMock.mockResolvedValueOnce({ Success: true, Message: 'upper' })

    const repo = new DefectiveReworkOrderRepositoryImpl()
    await expect(repo.delete(6)).resolves.toEqual({ success: true, message: 'upper' })
  })
})
