import { beforeEach, describe, expect, it, vi } from 'vitest'

type Mock = ReturnType<typeof vi.fn>

vi.mock('@/lib/config', () => ({ DEFAULT_DB_NAME: 'TEST_DB' }))

vi.mock('@/lib/erp/bill-api', () => ({
  BillApi: {
    GetBillWithDetails: vi.fn(),
    GeneralBillSave: vi.fn(),
    GeneralBillApproval: vi.fn(),
  },
}))

vi.mock('@/lib/erp/quality-api', () => ({
  QualityApi: {
    SaveDefectiveReworkOrderWithFiles: vi.fn(),
    CreateDefectiveReworkOrderByDailyPlanScanCode: vi.fn(),
    CreateDefectiveReworkOrderByFlowDetail: vi.fn(),
  },
}))

vi.mock('@/lib/erp/flow-scan-api', () => ({
  FlowScanApi: {
    CheckDocumentState: vi.fn(),
  },
  FlowScanSourceType: { DailyPlanDetail: 1, ExtrusionPlanDetail: 2, DefectiveReworkOrderDocument: 3 },
  FlowScanDocumentKind: { FlowCard: 1, ProcessReceive: 2, FirstInspection: 3, ProcessCompletion: 4, FinalInspection: 5, Ncr: 6 },
  FlowScanCheckState: { NotCreated: 0, CreatedNotApproved: 1, CreatedApproved: 2, ApprovedReadyForNext: 3, Unfinished: 4, PrevCompletedCurrentUnfinished: 5 },
}))

vi.mock('@/lib/erp/lookup-core', () => ({ fetchLookup: vi.fn() }))

vi.mock('@/lib/image-loader', () => ({
  loadImageBase64: vi.fn(),
}))

vi.mock('@/infrastructure/repositories/quality/mappers/defectiveReworkOrderMapper', () => ({
  DefectiveReworkOrderMapper: {
    toDomain: vi.fn(),
  },
}))

vi.mock('@/domain/quality/ncr/services/DefectiveReworkOrderApprovalService', () => ({
  DefectiveReworkOrderApprovalService: {
    approve: vi.fn(),
    unapprove: vi.fn(),
  },
}))

vi.mock('@/types/erp-db.generated', () => {
  class DefectiveReworkOrderDocument {
    public id: unknown
    public PreCmpBQty: unknown
    public SomeBool: unknown
    public initDefaults() {
      this.id = 0
      this.PreCmpBQty = 0
      this.SomeBool = false
    }
  }

  class DefectiveReworkOrderDetail {
    public id: unknown
    public Qty: unknown
    public SomeDetailBool: unknown
    public initDefaults() {
      this.id = 0
      this.Qty = 0
      this.SomeDetailBool = false
    }
  }

  class FileRecordForNcr {
    public Billid: unknown
    public CloudFileid: unknown
    public FileName: unknown
    public Suffix: unknown
    public FileDescription: unknown
    public initDefaults() {
      this.Billid = 0
      this.CloudFileid = 0
      this.FileName = ''
      this.Suffix = ''
      this.FileDescription = ''
    }
  }

  const DocumentStatus = { 未审批: 0x40000000, 已审批: 1 }
  return { DefectiveReworkOrderDocument, DefectiveReworkOrderDetail, FileRecordForNcr, DocumentStatus }
})

describe('NcrApplicationService', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()
    delete (globalThis as any).window
    delete (globalThis as any).File
    delete (globalThis as any).FileReader
  })

  it('fetchById: id 非法时直接返回空结果', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.fetchById(0)).resolves.toEqual({ document: null, details: [] })
    expect((BillApi.GetBillWithDetails as unknown as Mock).mock.calls.length).toBe(0)
  })

  it('fetchById: 兼容 data 包裹与 Document/Details 字段名', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const getMock = BillApi.GetBillWithDetails as unknown as Mock
    const rawDoc = { Id: 123 }
    const rawDetails = [{ id: 1 }, { id: 2 }]
    getMock.mockResolvedValueOnce({ data: { Document: rawDoc, Details: rawDetails } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.fetchById(123)
    expect(res.document).toEqual(rawDoc)
    expect(res.details).toEqual(rawDetails)
    expect(getMock).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'DefectiveReworkOrderDocument', billId: 123 }))
  })

  it('fetchById: 后端明确失败且 payload 异常时抛出错误（保持与旧实现一致）', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const getMock = BillApi.GetBillWithDetails as unknown as Mock
    getMock.mockResolvedValueOnce({ success: false, message: 'bad', data: { Details: 'x' } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.fetchById(1)).rejects.toThrow('bad')
  })

  it('fetchById: 兼容无 data 包裹且使用 document/details 小写字段', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const getMock = BillApi.GetBillWithDetails as unknown as Mock
    const rawDoc = { Id: 1 }
    const rawDetails = [{ id: 1 }]
    getMock.mockResolvedValueOnce({ document: rawDoc, details: rawDetails })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.fetchById(1)).resolves.toEqual({ document: rawDoc, details: rawDetails })
  })

  it('fetchById: 后端明确失败时优先使用 payload.success/payload.message', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const getMock = BillApi.GetBillWithDetails as unknown as Mock
    getMock.mockResolvedValueOnce({ data: { success: false, message: 'bad2', Details: {} } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.fetchById(1)).rejects.toThrow('bad2')
  })

  it('fetchById: 后端明确失败但无 message 时使用默认文案', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const getMock = BillApi.GetBillWithDetails as unknown as Mock
    getMock.mockResolvedValueOnce({ data: { success: false, Details: {} } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.fetchById(1)).rejects.toThrow('获取单据失败')
  })

  it('fetchById: rawDetails 非数组但成功标记缺失时返回 details=[]（防御性分支）', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const getMock = BillApi.GetBillWithDetails as unknown as Mock
    getMock.mockResolvedValueOnce({ data: { Document: { Id: 1 }, Details: {} } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.fetchById(1)).resolves.toEqual({ document: { Id: 1 }, details: [] })
  })

  it('fetchById: 缺失 Details/details 字段时 details 兜底为空数组', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const getMock = BillApi.GetBillWithDetails as unknown as Mock
    getMock.mockResolvedValueOnce({ data: { Document: { Id: 1 } } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.fetchById(1)).resolves.toEqual({ document: { Id: 1 }, details: [] })
  })

  it('save: 无照片时走 GeneralBillSave，并清理明细元字段', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveMock = BillApi.GeneralBillSave as unknown as Mock
    saveMock.mockResolvedValueOnce({ objects: { billId: 9 } })

    const bill = { id: 0 } as any
    const details = [
      { Adversesituation: 'a', __localkey: 'k', ModifyTime: 'x', ParentModifyId: 1 } as any,
    ]

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({ bill, details })

    expect(res).toEqual({ id: 9 })
    expect(saveMock).toHaveBeenCalledTimes(1)
    const args = saveMock.mock.calls[0]?.[0] as any
    expect(args.tableName).toBe('DefectiveReworkOrderDocument')
    expect(args.details?.[0]).toMatchObject({ Adversesituation: 'a' })
    expect(args.details?.[0]).not.toHaveProperty('__localkey')
  })

  it('save: details 非数组时仍走通用保存（防御性分支）', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveMock = BillApi.GeneralBillSave as unknown as Mock
    saveMock.mockResolvedValueOnce({ objects: { billId: 2 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({ bill: { id: 0 } as any, details: null as any })

    expect(res).toEqual({ id: 2 })
    const args = saveMock.mock.calls[0]?.[0] as any
    expect(args.details).toEqual([])
  })

  it('save: 明细出现 null 时 stripDetailMetaFields 兜底为 {}（防御性分支）', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveMock = BillApi.GeneralBillSave as unknown as Mock
    saveMock.mockResolvedValueOnce({ objects: { billId: 3 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({ bill: { id: 0 } as any, details: [null as any] })

    expect(res).toEqual({ id: 3 })
    const args = saveMock.mock.calls[0]?.[0] as any
    expect(args.details).toEqual([{}])
  })

  it('save: 有照片时走 SaveDefectiveReworkOrderWithFiles（base64/dataURL/类型归一化）', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { loadImageBase64 } = await import('@/lib/image-loader')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const loadMock = loadImageBase64 as unknown as Mock
    loadMock.mockResolvedValueOnce({
      success: true,
      base64: 'data:image/png;base64,TQ',
      mime: 'image/png',
    })

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ IsSuccess: true, objects: { Id: 101 } })

    const bill = { id: 0, PreCmpBQty: '12', SomeBool: 'true' } as any
    const details = [{ id: 0, Qty: '', SomeDetailBool: 1 } as any]

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({
      bill,
      details,
      localPhotoEvidence: [{ uri: 'x', fileName: 'a.png' } as any],
    })

    expect(res).toEqual({ id: 101, clearLocalPhotoEvidence: true })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(1)
    const payload = saveWithFilesMock.mock.calls[0]?.[0] as any
    expect(payload).toMatchObject({ dbName: 'TEST_DB' })
    expect(payload.document).toMatchObject({ PreCmpBQty: 12, SomeBool: true })
    expect(payload.details?.[0]).toMatchObject({ Qty: 0, SomeDetailBool: true })
    expect(payload.files?.[0]).toMatchObject({ FileName: 'a.png', Suffix: '.png' })
    expect((payload.files?.[0] as any).Bytes).toBe('TQ==')
  })

  it('save: PC 本地文件分支（File + FileReader）能正常读取并生成 FileRecordForNcr', async () => {
    class MockFile {
      public constructor(public name: string, public type: string) {}
    }

    class MockFileReader {
      public result: string | null = null
      public onload: null | (() => void) = null
      public onerror: null | (() => void) = null
      public readAsDataURL() {
        this.result = 'data:image/webp;base64,TWE'
        this.onload?.()
      }
    }

    ;(globalThis as any).File = MockFile
    ;(globalThis as any).FileReader = MockFileReader

    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { loadImageBase64 } = await import('@/lib/image-loader')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const loadMock = loadImageBase64 as unknown as Mock

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ isSuccess: true, objects: { billId: 55 } })

    const localFile = new MockFile('photo.webp', 'image/webp') as any
    const service = new NcrApplicationService({ delete: vi.fn() } as any)

    const res = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ localFile } as any],
    })

    expect(res).toEqual({ id: 55, clearLocalPhotoEvidence: true })
    expect(loadMock).toHaveBeenCalledTimes(0)
    const payload = saveWithFilesMock.mock.calls[0]?.[0] as any
    expect(payload.files?.[0]).toMatchObject({ FileName: 'photo.webp', Suffix: '.webp' })
    expect((payload.files?.[0] as any).Bytes).toBe('TWE=')
  })

  it('save: 读取图片失败时返回 id=null 且 code 为错误信息', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { loadImageBase64 } = await import('@/lib/image-loader')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const loadMock = loadImageBase64 as unknown as Mock
    loadMock.mockResolvedValueOnce({ success: false, message: '读取失败' })

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ IsSuccess: true, objects: { Id: 1 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ uri: 'x' } as any],
    })

    expect(res).toEqual({ id: null, code: '读取失败' })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(0)
  })

  it('save: 读取图片失败但无 message 时返回默认“读取图片失败”（覆盖默认文案分支）', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { loadImageBase64 } = await import('@/lib/image-loader')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const loadMock = loadImageBase64 as unknown as Mock
    loadMock.mockResolvedValueOnce({ success: false } as any)

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ IsSuccess: true, objects: { Id: 1 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ uri: 'x' } as any],
    })

    expect(res).toEqual({ id: null, code: '读取图片失败' })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(0)
  })

  it('save: 随单保存接口失败时返回错误信息或默认“保存失败”', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { loadImageBase64 } = await import('@/lib/image-loader')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const loadMock = loadImageBase64 as unknown as Mock
    loadMock.mockResolvedValue({ success: true, base64: 'Zm9v', mime: 'image/jpeg' })

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ isSuccess: false, errorMessage: 'bad' })
    saveWithFilesMock.mockResolvedValueOnce({ IsSuccess: false, ErrorMessage: '' })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)

    await expect(
      service.save({ bill: { id: 0 } as any, details: [], localPhotoEvidence: [{ uri: 'x' } as any] }),
    ).resolves.toEqual({ id: null, code: 'bad' })

    await expect(
      service.save({ bill: { id: 0 } as any, details: [], localPhotoEvidence: [{ uri: 'x' } as any] }),
    ).resolves.toEqual({ id: null, code: '保存失败' })
  })

  it('save: 随单保存缺失成功标记时按失败处理并转字符串 ErrorMessage', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { loadImageBase64 } = await import('@/lib/image-loader')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const loadMock = loadImageBase64 as unknown as Mock
    loadMock.mockResolvedValueOnce({ success: true, base64: 'Zm9v', mime: 'image/png' })

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ ErrorMessage: 123 })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(
      service.save({ bill: { id: 0 } as any, details: [], localPhotoEvidence: [{ uri: 'x' } as any] }),
    ).resolves.toEqual({ id: null, code: '123' })

    expect(saveWithFilesMock).toHaveBeenCalledTimes(1)
  })

  it('save: buildFilesForUpload 抛出 null 时返回默认“读取图片失败”（覆盖 catch else + 默认文案）', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    ;(service as any).buildFilesForUpload = vi.fn().mockRejectedValueOnce(null)

    await expect(
      service.save({ bill: { id: 0 } as any, details: [], localPhotoEvidence: [{ uri: 'x' } as any] }),
    ).resolves.toEqual({ id: null, code: '读取图片失败' })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(0)
  })

  it('save: buildFilesForUpload 抛出字符串错误时透传错误文案（覆盖 error ?? \"\" 左分支）', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    ;(service as any).buildFilesForUpload = vi.fn().mockRejectedValueOnce('boom')

    await expect(
      service.save({ bill: { id: 0 } as any, details: [], localPhotoEvidence: [{ uri: 'x' } as any] }),
    ).resolves.toEqual({ id: null, code: 'boom' })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(0)
  })

  it('save: buildFilesForUpload 抛出 message=undefined 时返回默认“读取图片失败”（覆盖 message ?? \"\" 右分支）', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    ;(service as any).buildFilesForUpload = vi.fn().mockRejectedValueOnce({ message: undefined })

    await expect(
      service.save({ bill: { id: 0 } as any, details: [], localPhotoEvidence: [{ uri: 'x' } as any] }),
    ).resolves.toEqual({ id: null, code: '读取图片失败' })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(0)
  })

  it('save: base64url/空白规范化，以及 base64 非法时返回明确错误', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { loadImageBase64 } = await import('@/lib/image-loader')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const loadMock = loadImageBase64 as unknown as Mock
    loadMock
      .mockResolvedValueOnce({ success: true, base64: 'T-W_ \n', mime: 'image/png' })
      .mockResolvedValueOnce({ success: true, base64: 'a', mime: 'image/png' })

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ isSuccess: true, objects: { billId: 1 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)

    const ok = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ uri: 'x', fileName: '' } as any],
    })
    expect(ok.id).toBe(1)
    const payload = saveWithFilesMock.mock.calls[0]?.[0] as any
    expect((payload.files?.[0] as any).Bytes).toBe('T+W/')

    const bad = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ uri: 'x' } as any],
    })
    expect(bad).toEqual({ id: null, code: '图片Base64格式不正确' })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(1)
  })

  it('save: base64 在校验后变为空时触发兜底“读取图片失败”（覆盖防御分支）', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { loadImageBase64 } = await import('@/lib/image-loader')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    let hit = 0
    const loadMock = loadImageBase64 as unknown as Mock
    loadMock.mockResolvedValueOnce({
      success: true,
      mime: null,
      get base64() {
        hit += 1
        return hit === 1 ? 'Zm9v' : ''
      },
    } as any)

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ isSuccess: true, objects: { billId: 1 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ uri: 'x', fileName: '' } as any],
    })

    expect(res).toEqual({ id: null, code: '读取图片失败' })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(0)
  })

  it('save: 返回包缺失/无效 Id 时返回 id=null（extractBillId 容错）', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveMock = BillApi.GeneralBillSave as unknown as Mock
    saveMock.mockResolvedValueOnce(null)
    saveMock.mockResolvedValueOnce({ objects: { billId: 0 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)

    await expect(service.save({ bill: { id: 0 } as any, details: [] })).resolves.toEqual({ id: null })
    await expect(service.save({ bill: { id: 0 } as any, details: [] })).resolves.toEqual({ id: null })
  })

  it('save: 本地照片全部标记为 isRemoteOnly 时不走随单上传（保持旧行为）', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveMock = BillApi.GeneralBillSave as unknown as Mock
    saveMock.mockResolvedValueOnce({ objects: { billId: 7 } })

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ IsSuccess: true, objects: { Id: 999 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ uri: 'x', isRemoteOnly: true } as any],
    })
    expect(res).toEqual({ id: 7 })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(0)
  })

  it('save: PC 本地文件读取失败时返回“读取本地文件失败”（覆盖 readFileBase64 分支）', async () => {
    class MockFile {
      public constructor(public name: string, public type: string) {}
    }

    ;(globalThis as any).File = MockFile
    delete (globalThis as any).FileReader

    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ isSuccess: true, objects: { billId: 1 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ localFile: new MockFile('a.png', 'image/png') } as any],
    })

    expect(res).toEqual({ id: null, code: '读取本地文件失败' })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(0)
  })

  it('save: PC FileReader 返回非字符串 result 时读取失败（覆盖 typeof result !== string 分支）', async () => {
    class MockFile {
      public constructor(public name: string, public type: string) {}
    }

    class MockFileReader {
      public result: ArrayBuffer | null = null
      public onload: null | (() => void) = null
      public onerror: null | (() => void) = null
      public readAsDataURL() {
        this.result = new ArrayBuffer(0)
        this.onload?.()
      }
    }

    ;(globalThis as any).File = MockFile
    ;(globalThis as any).FileReader = MockFileReader

    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ isSuccess: true, objects: { billId: 1 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ localFile: new MockFile('a.png', 'image/png') } as any],
    })

    expect(res).toEqual({ id: null, code: '读取本地文件失败' })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(0)
  })

  it('save: PC FileReader 结果无逗号时仍能提取 base64（覆盖 comma<0 分支）', async () => {
    class MockFile {
      public constructor(public name: string, public type: string) {}
    }

    class MockFileReader {
      public result: string | null = null
      public onload: null | (() => void) = null
      public onerror: null | (() => void) = null
      public readAsDataURL() {
        this.result = 'Zm9v'
        this.onload?.()
      }
    }

    ;(globalThis as any).File = MockFile
    ;(globalThis as any).FileReader = MockFileReader

    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ isSuccess: true, objects: { billId: 66 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ localFile: new MockFile('photo', 'image/gif') } as any],
    })

    expect(res).toEqual({ id: 66, clearLocalPhotoEvidence: true })
    const payload = saveWithFilesMock.mock.calls[0]?.[0] as any
    expect((payload.files?.[0] as any).Bytes).toBe('Zm9v')
    expect(payload.files?.[0]).toMatchObject({ FileName: 'photo', Suffix: '.gif' })
  })

  it('save: PC FileReader.readAsDataURL 抛异常时返回读取失败（覆盖 catch 分支）', async () => {
    class MockFile {
      public constructor(public name: string, public type: string) {}
    }

    class MockFileReader {
      public result: string | null = null
      public onload: null | (() => void) = null
      public onerror: null | (() => void) = null
      public readAsDataURL() {
        throw new Error('boom')
      }
    }

    ;(globalThis as any).File = MockFile
    ;(globalThis as any).FileReader = MockFileReader

    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ isSuccess: true, objects: { billId: 1 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ localFile: new MockFile('a.png', 'image/png') } as any],
    })

    expect(res).toEqual({ id: null, code: '读取本地文件失败' })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(0)
  })

  it('save: PC FileReader.onerror 时返回读取失败（覆盖 onerror 分支）', async () => {
    class MockFile {
      public constructor(public name: string, public type: string) {}
    }

    class MockFileReader {
      public result: string | null = null
      public onload: null | (() => void) = null
      public onerror: null | (() => void) = null
      public readAsDataURL() {
        this.onerror?.()
      }
    }

    ;(globalThis as any).File = MockFile
    ;(globalThis as any).FileReader = MockFileReader

    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ isSuccess: true, objects: { billId: 1 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ localFile: new MockFile('a.png', 'image/png') } as any],
    })

    expect(res).toEqual({ id: null, code: '读取本地文件失败' })
    expect(saveWithFilesMock).toHaveBeenCalledTimes(0)
  })

  it('save: PC File.type 为空时 mime 归一化为 undefined（覆盖 file.type || undefined 分支）', async () => {
    class MockFile {
      public constructor(public name: string, public type: string) {}
    }

    class MockFileReader {
      public result: string | null = null
      public onload: null | (() => void) = null
      public onerror: null | (() => void) = null
      public readAsDataURL() {
        this.result = 'data:image/png;base64,Zm9v'
        this.onload?.()
      }
    }

    ;(globalThis as any).File = MockFile
    ;(globalThis as any).FileReader = MockFileReader

    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const saveWithFilesMock = QualityApi.SaveDefectiveReworkOrderWithFiles as unknown as Mock
    saveWithFilesMock.mockResolvedValueOnce({ isSuccess: true, objects: { billId: 77 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const res = await service.save({
      bill: { id: 0 } as any,
      details: [],
      localPhotoEvidence: [{ localFile: new MockFile('a.png', '') } as any],
    })

    expect(res).toEqual({ id: 77, clearLocalPhotoEvidence: true })
    const payload = saveWithFilesMock.mock.calls[0]?.[0] as any
    expect(payload.files?.[0]).toMatchObject({ FileName: 'a.png', Suffix: '.png' })
  })

  it('approve/unapprove: 领域校验失败时不调用后端审批接口', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { DefectiveReworkOrderMapper } = await import(
      '@/infrastructure/repositories/quality/mappers/defectiveReworkOrderMapper'
    )
    const { DefectiveReworkOrderApprovalService } = await import(
      '@/domain/quality/ncr/services/DefectiveReworkOrderApprovalService'
    )
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const approvalMock = BillApi.GeneralBillApproval as unknown as Mock

    const toDomainMock = DefectiveReworkOrderMapper.toDomain as unknown as Mock
    toDomainMock.mockReturnValue({})

    const approveCheckMock = DefectiveReworkOrderApprovalService.approve as unknown as Mock
    approveCheckMock.mockReturnValue({ ok: false, error: { message: '缺少检验员' } })

    const unapproveCheckMock = DefectiveReworkOrderApprovalService.unapprove as unknown as Mock
    unapproveCheckMock.mockReturnValue({ ok: false, error: { message: '状态不允许反审批' } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)

    await expect(service.approve(1, { bill: { id: 1 } as any, details: [] })).resolves.toEqual({
      success: false,
      message: '缺少检验员',
    })
    await expect(service.unapprove(1, { bill: { id: 1 } as any, details: [] })).resolves.toEqual({
      success: false,
      message: '状态不允许反审批',
    })

    expect(approvalMock).toHaveBeenCalledTimes(0)
  })

  it('approve/unapprove: 通过校验后调用后端并解析返回结构', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { DefectiveReworkOrderMapper } = await import(
      '@/infrastructure/repositories/quality/mappers/defectiveReworkOrderMapper'
    )
    const { DefectiveReworkOrderApprovalService } = await import(
      '@/domain/quality/ncr/services/DefectiveReworkOrderApprovalService'
    )
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const approvalMock = BillApi.GeneralBillApproval as unknown as Mock
    approvalMock.mockResolvedValueOnce({ issuccess: true, message: 'ok' })
    approvalMock.mockResolvedValueOnce({ isSuccess: false, ErrorMessage: 123 })

    const toDomainMock = DefectiveReworkOrderMapper.toDomain as unknown as Mock
    toDomainMock.mockReturnValue({})

    const approveCheckMock = DefectiveReworkOrderApprovalService.approve as unknown as Mock
    approveCheckMock.mockReturnValue({ ok: true })

    const unapproveCheckMock = DefectiveReworkOrderApprovalService.unapprove as unknown as Mock
    unapproveCheckMock.mockReturnValue({ ok: true })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)

    await expect(service.approve(10, { bill: { id: 10 } as any, details: [] })).resolves.toEqual({
      success: true,
      message: 'ok',
    })
    await expect(service.unapprove(11, { bill: { id: 11 } as any, details: [] })).resolves.toEqual({
      success: false,
      message: '123',
    })
    expect(approvalMock).toHaveBeenCalledTimes(2)
  })

  it('approve/unapprove: id 不合法时直接失败（不调用后端）', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const approvalMock = BillApi.GeneralBillApproval as unknown as Mock
    approvalMock.mockResolvedValueOnce({ issuccess: true, message: 'ok' })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.approve(0)).resolves.toEqual({ success: false, message: '单据ID不合法' })
    await expect(service.unapprove(-1)).resolves.toEqual({ success: false, message: '单据ID不合法' })
    expect(approvalMock).toHaveBeenCalledTimes(0)
  })

  it('approve/unapprove: snapshot 下 id=0 时 fallbackId 分支可被覆盖', async () => {
    const { DefectiveReworkOrderMapper } = await import(
      '@/infrastructure/repositories/quality/mappers/defectiveReworkOrderMapper'
    )
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const toDomainMock = DefectiveReworkOrderMapper.toDomain as unknown as Mock
    toDomainMock.mockReturnValue(null)

    const service = new NcrApplicationService({ delete: vi.fn() } as any)

    await expect(service.approve(0, { bill: { id: 0 } as any, details: [] })).resolves.toEqual({
      success: false,
      message: '单据ID不合法',
    })
    await expect(service.unapprove(0, { bill: { id: 0 } as any, details: [] })).resolves.toEqual({
      success: false,
      message: '单据ID不合法',
    })

    const firstCall = toDomainMock.mock.calls[0]?.[0] as any
    expect(firstCall?.fallbackId).toBe(0)
  })

  it('approve: 兼容 Message/errorMessage 字段解析', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const approvalMock = BillApi.GeneralBillApproval as unknown as Mock
    approvalMock.mockResolvedValueOnce({ issuccess: false, Message: 'bad' })
    approvalMock.mockResolvedValueOnce({ isSuccess: false, errorMessage: 'bad2' })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.approve(1)).resolves.toEqual({ success: false, message: 'bad' })
    await expect(service.approve(2)).resolves.toEqual({ success: false, message: 'bad2' })
  })

  it('approve: 兼容 ErrorMessage 字段，且 successRaw 缺失时默认 success=false', async () => {
    const { BillApi } = await import('@/lib/erp/bill-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const approvalMock = BillApi.GeneralBillApproval as unknown as Mock
    approvalMock.mockResolvedValueOnce({ ErrorMessage: 123 })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.approve(1)).resolves.toEqual({ success: false, message: '123' })
  })

  it('delete: 透传仓储删除结果，并在异常时给出兜底消息', async () => {
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const repo = { delete: vi.fn() } as any
    const repoMock = repo.delete as unknown as Mock
    repoMock.mockResolvedValueOnce({ success: true, message: 'ok' })
    repoMock.mockResolvedValueOnce({ success: false })
    repoMock.mockRejectedValueOnce(new Error('boom'))
    repoMock.mockRejectedValueOnce({}) // 无 message

    const service = new NcrApplicationService(repo)
    await expect(service.delete(1)).resolves.toEqual({ success: true, message: 'ok' })
    await expect(service.delete(1)).resolves.toEqual({ success: false, message: '' })
    await expect(service.delete(1)).resolves.toEqual({ success: false, message: 'boom' })
    await expect(service.delete(1)).resolves.toEqual({ success: false, message: '删除失败' })
  })

  it('delete: id 不合法时直接失败', async () => {
    const { NcrApplicationService } = await import('./NcrApplicationService')
    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.delete(0)).resolves.toEqual({ success: false, message: '单据ID不合法' })
  })

  it('executeScan: 覆盖空/不支持/id 打开/设置检验员/日计划生成等分支', async () => {
    const { fetchLookup } = await import('@/lib/erp/lookup-core')
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const lookupMock = fetchLookup as unknown as Mock
    lookupMock
      .mockResolvedValueOnce([]) // not found
      .mockResolvedValueOnce([{ id: '0', Name: 'X' }]) // invalid id
      .mockResolvedValueOnce([{ id: 9, Name: '张三' }]) // ok

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock
      .mockResolvedValueOnce({ success: true, message: '', data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] } })
      .mockResolvedValueOnce({ success: true, message: '', data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] } })
      .mockResolvedValueOnce({ success: true, message: '', data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] } })
      .mockResolvedValueOnce({ success: true, message: '', data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] } })

    const createMock = QualityApi.CreateDefectiveReworkOrderByDailyPlanScanCode as unknown as Mock
    createMock
      .mockResolvedValueOnce({ success: true, message: 'm', data: { Id: 88 } })
      .mockResolvedValueOnce({ success: false, message: 'bad' })
      .mockResolvedValueOnce({ success: true, message: '', data: { Id: 0 } })
      .mockRejectedValueOnce(new Error('net'))

    const service = new NcrApplicationService({ delete: vi.fn() } as any)

    await expect(service.executeScan('')).resolves.toEqual({
      type: 'ERROR',
      level: 'warning',
      message: '扫描内容为空',
    })

    await expect(service.executeScan('ABC')).resolves.toEqual({
      type: 'ERROR',
      level: 'warning',
      message: '暂不支持该条码',
    })

    await expect(service.executeScan('id:123', { allowOpenById: true })).resolves.toEqual({
      type: 'OPEN_BY_ID',
      id: 123,
    })

    await expect(service.executeScan('123', { allowOpenById: false })).resolves.toEqual({
      type: 'ERROR',
      level: 'warning',
      message: '暂不支持该条码',
    })

    await expect(service.executeScan('ZY-001', { allowSetInspector: false })).resolves.toEqual({
      type: 'ERROR',
      level: 'warning',
      message: '当前单据不可编辑，无法修改检验员',
    })

    await expect(service.executeScan('ZY-001')).resolves.toEqual({
      type: 'ERROR',
      level: 'error',
      message: '未找到该条码对应的职员',
    })

    await expect(service.executeScan('ZY-001')).resolves.toEqual({
      type: 'ERROR',
      level: 'error',
      message: '职员数据异常，请联系管理员',
    })

    await expect(service.executeScan('ZY-001')).resolves.toEqual({
      type: 'SET_INSPECTOR',
      employeeId: 9,
      employeeName: '张三',
    })

    await expect(service.executeScan('RJH-001')).resolves.toEqual({
      type: 'CREATED_BY_DAILY_PLAN',
      id: 88,
      message: 'm',
    })

    await expect(service.executeScan('RJH-001')).resolves.toEqual({
      type: 'ERROR',
      level: 'error',
      message: 'bad',
    })

    await expect(service.executeScan('RJH-001')).resolves.toEqual({
      type: 'ERROR',
      level: 'error',
      message: '后端返回单据ID异常，无法打开',
    })

    await expect(service.executeScan('RJH-001')).resolves.toEqual({
      type: 'ERROR',
      level: 'error',
      message: '扫码处理失败，请稍后重试',
    })
  })

  it('executeScan: 返工单条码（FGD-*）走 FlowScan 并按 FlowDetail 生成 NCR', async () => {
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockResolvedValueOnce({
      success: true,
      message: '',
      data: {
        Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }],
      },
    })

    const createMock = (QualityApi as any).CreateDefectiveReworkOrderByFlowDetail as Mock
    createMock.mockResolvedValueOnce({ success: true, message: 'm', data: { Id: 321 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.executeScan('FGD-001')).resolves.toEqual({ type: 'CREATED_BY_DAILY_PLAN', id: 321, message: 'm' })
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ flowDetailTableName: 'ProcessAssemblyFlowDetail', flowDetailId: 11, inspectorEmployeeid: 0 }),
    )
  })

  it('executeScan: 挤出计划条码（JCJH-*）走 FlowScan 并按 FlowDetail 生成 NCR', async () => {
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockResolvedValueOnce({
      success: true,
      message: '',
      data: {
        Items: [{ Matched: true, FlowDetail: { TableName: 'ProduceFlowDetail', id: 11 } }],
      },
    })

    const createMock = (QualityApi as any).CreateDefectiveReworkOrderByFlowDetail as Mock
    createMock.mockResolvedValueOnce({ success: true, message: 'm', data: { Id: 123 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.executeScan('JCJH-202603050001')).resolves.toEqual({ type: 'CREATED_BY_DAILY_PLAN', id: 123, message: 'm' })
    expect(flowScanMock).toHaveBeenCalledWith(expect.objectContaining({ sourceType: 2 }))
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ flowDetailTableName: 'ProduceFlowDetail', flowDetailId: 11, inspectorEmployeeid: 0 }),
    )
  })

  it('executeScan: 返工单条码未找到下游流程卡/工序时返回错误提示', async () => {
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockResolvedValueOnce({ success: true, message: '未找到由该不合格返工单生成的流程卡', data: { Items: [] } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.executeScan('FGD-404')).resolves.toEqual({
      type: 'ERROR',
      level: 'error',
      message: '未找到由该不合格返工单生成的流程卡',
    })
  })

  it('executeScan: 返工单扫码查询异常时返回 error', async () => {
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockRejectedValueOnce(new Error('net'))

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.executeScan('FGD-500')).resolves.toEqual({
      type: 'ERROR',
      level: 'error',
      message: '扫码处理失败，请稍后重试',
    })
  })

  it('executeScan: 日计划扫码存在多条当前工序明细时返回 NEED_PICK_FLOW_DETAIL（含排序/工种信息）', async () => {
    const { fetchLookup } = await import('@/lib/erp/lookup-core')
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockResolvedValueOnce({
      success: true,
      message: '',
      data: {
        Items: [
          { Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 22 } },
          { Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } },
        ],
      },
    })

    const lookupMock = fetchLookup as unknown as Mock
    lookupMock
      .mockResolvedValueOnce([{ id: 22, TypeofWorkid: 100, LocationIndex: 5 }])
      .mockResolvedValueOnce([{ id: 11, TypeofWorkid: 101, LocationIndex: 2 }])

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.executeScan('RJH-001')).resolves.toEqual({
      type: 'NEED_PICK_FLOW_DETAIL',
      scanCode: 'RJH-001',
      candidates: [
        { flowDetailTableName: 'ProcessAssemblyFlowDetail', flowDetailId: 11, typeofWorkId: 101, locationIndex: 2 },
        { flowDetailTableName: 'ProcessAssemblyFlowDetail', flowDetailId: 22, typeofWorkId: 100, locationIndex: 5 },
      ],
    })
  })

  it('executeScan: 日计划扫码多条当前工序明细且存在未审批单据时直接 OPEN_BY_ID（不弹窗选明细）', async () => {
    const { fetchLookup } = await import('@/lib/erp/lookup-core')
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockResolvedValueOnce({
      success: true,
      message: '',
      data: {
        Items: [
          {
            Matched: true,
            FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 22 },
            Documents: [
              { TableName: 'DefectiveReworkOrderDocument', Id: 8, Status: 0 },
              { TableName: 'DefectiveReworkOrderDocument', Id: 9, Status: 0 },
            ],
          },
          { Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } },
        ],
      },
    })

    const lookupMock = fetchLookup as unknown as Mock
    const createMock = QualityApi.CreateDefectiveReworkOrderByDailyPlanScanCode as unknown as Mock

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.executeScan('RJH-001')).resolves.toEqual({ type: 'OPEN_BY_ID', id: 9 })
    expect(lookupMock).not.toHaveBeenCalled()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('executeDailyPlanScanCreate: 已存在未完成单据时优先 OPEN_BY_ID（避免重复生成）', async () => {
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockResolvedValueOnce({
      success: true,
      message: '',
      data: {
        Items: [
          {
            Matched: true,
            FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', Id: 11 },
            Documents: [
              { TableName: 'DefectiveReworkOrderDocument', Id: 8, Status: 0 },
              { TableName: 'DefectiveReworkOrderDocument', Id: 9, Status: 0 },
            ],
          },
        ],
      },
    })

    const createMock = QualityApi.CreateDefectiveReworkOrderByDailyPlanScanCode as unknown as Mock
    createMock.mockResolvedValueOnce({ success: true, message: '', data: { Id: 1 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.executeDailyPlanScanCreate('RJH-001')).resolves.toEqual({ type: 'OPEN_BY_ID', id: 9 })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('executeDailyPlanScanCreate: 仅存在已审批单据时不应 OPEN_BY_ID，应继续创建', async () => {
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockResolvedValueOnce({
      success: true,
      message: '',
      data: {
        Items: [
          {
            Matched: true,
            FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 },
            Documents: [{ TableName: 'DefectiveReworkOrderDocument', Id: 9, Status: 1 }],
          },
        ],
      },
    })

    const createMock = QualityApi.CreateDefectiveReworkOrderByDailyPlanScanCode as unknown as Mock
    createMock.mockResolvedValueOnce({ success: true, message: '', data: { Id: 123 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.executeDailyPlanScanCreate('RJH-001')).resolves.toEqual({
      type: 'CREATED_BY_DAILY_PLAN',
      id: 123,
      message: undefined,
    })
  })

  it('executeDailyPlanScanCreate: 传入 pickedFlowDetail 时直接透传 FlowDetail 参数并生成', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const createMock = QualityApi.CreateDefectiveReworkOrderByDailyPlanScanCode as unknown as Mock
    createMock.mockResolvedValueOnce({ success: true, message: '', data: { Id: 1 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(
      service.executeDailyPlanScanCreate('RJH-001', {
        inspectorEmployeeId: 3,
        pickedFlowDetail: { tableName: 'ProcessAssemblyFlowDetail', id: 11 },
      }),
    ).resolves.toEqual({ type: 'CREATED_BY_DAILY_PLAN', id: 1, message: undefined })

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        scanForCode: 'RJH-001',
        inspectorEmployeeid: 3,
        flowDetailTableName: 'ProcessAssemblyFlowDetail',
        flowDetailId: 11,
      }),
    )
  })

  it('executeScan: 职员查询异常时返回“设置检验员失败，请稍后重试”', async () => {
    const { fetchLookup } = await import('@/lib/erp/lookup-core')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const lookupMock = fetchLookup as unknown as Mock
    lookupMock.mockRejectedValueOnce(new Error('db-down'))

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.executeScan('ZY-001')).resolves.toEqual({
      type: 'ERROR',
      level: 'error',
      message: '设置检验员失败，请稍后重试',
    })
  })

  it('executeScan: 日计划生成失败但 message 为空时使用默认文案', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockResolvedValueOnce({
      success: true,
      message: '',
      data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] },
    })

    const createMock = QualityApi.CreateDefectiveReworkOrderByDailyPlanScanCode as unknown as Mock
    createMock.mockResolvedValueOnce({ success: false, message: '' })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.executeScan('RJH-001')).resolves.toEqual({
      type: 'ERROR',
      level: 'error',
      message: '未能生成不合格返工单',
    })
  })

  it('executeScan: 日计划返回 data.id 且 message 缺失时 message 为 undefined（覆盖兼容分支）', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockResolvedValueOnce({
      success: true,
      message: '',
      data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] },
    })

    const createMock = QualityApi.CreateDefectiveReworkOrderByDailyPlanScanCode as unknown as Mock
    createMock.mockResolvedValueOnce({ success: true, data: { id: 77 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.executeScan('RJH-001')).resolves.toEqual({
      type: 'CREATED_BY_DAILY_PLAN',
      id: 77,
      message: undefined,
    })
  })

  it('executeScan: 允许 openById 时，非法 id 返回 error；不允许时返回 warning', async () => {
    const { NcrApplicationService } = await import('./NcrApplicationService')
    const service = new NcrApplicationService({ delete: vi.fn() } as any)

    await expect(
      service.executeScan('id:999999999999999999999999999999999999', { allowOpenById: true }),
    ).resolves.toEqual({ type: 'ERROR', level: 'error', message: '单据ID不合法' })

    await expect(
      service.executeScan('id:999999999999999999999999999999999999', { allowOpenById: false }),
    ).resolves.toEqual({ type: 'ERROR', level: 'warning', message: '单据ID不合法' })
  })

  it('executeScan: 能从 localStorage 读取 user 并透传给后端（含 fallback key）', async () => {
    ;(globalThis as any).window = {
      localStorage: {
        getItem: (key: string) => {
          if (key === 'erp:userInfo') return null
          if (key === 'userInfo') return JSON.stringify({ UserID: 1 })
          return null
        },
      },
    }

    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockResolvedValueOnce({
      success: true,
      message: '',
      data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] },
    })

    const createMock = QualityApi.CreateDefectiveReworkOrderByDailyPlanScanCode as unknown as Mock
    createMock.mockResolvedValueOnce({ success: true, message: '', data: { Id: 1 } })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await service.executeScan('RJH-001')
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ user: { UserID: 1 } }),
    )
  })

  it('executeScan: localStorage 为空/非对象/JSON 异常时 user 兜底为 {}', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const createMock = QualityApi.CreateDefectiveReworkOrderByDailyPlanScanCode as unknown as Mock
    createMock.mockResolvedValue({ success: false, message: 'x' })

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockResolvedValue({
      success: true,
      message: '',
      data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] },
    })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    const invalidJson = '{'

    ;(globalThis as any).window = { localStorage: { getItem: () => null } };
    await service.executeScan('RJH-001')
    expect(createMock.mock.calls[0]?.[0]?.user).toEqual({})

    ;(globalThis as any).window = { localStorage: { getItem: () => '1' } };
    await service.executeScan('RJH-001')
    expect(createMock.mock.calls[1]?.[0]?.user).toEqual({})

    ;(globalThis as any).window = { localStorage: { getItem: () => invalidJson } };
    await service.executeScan('RJH-001')
    expect(createMock.mock.calls[2]?.[0]?.user).toEqual({})
  })

  it('executeScan: 日计划返回超大 Id 时视为异常（覆盖 normalizePositiveInt 上限分支）', async () => {
    const { QualityApi } = await import('@/lib/erp/quality-api')
    const { FlowScanApi } = await import('@/lib/erp/flow-scan-api')
    const { NcrApplicationService } = await import('./NcrApplicationService')

    const flowScanMock = FlowScanApi.CheckDocumentState as unknown as Mock
    flowScanMock.mockResolvedValueOnce({
      success: true,
      message: '',
      data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] },
    })

    const createMock = QualityApi.CreateDefectiveReworkOrderByDailyPlanScanCode as unknown as Mock
    createMock.mockResolvedValueOnce({
      success: true,
      message: '',
      data: { Id: Number.MAX_SAFE_INTEGER + 1 },
    })

    const service = new NcrApplicationService({ delete: vi.fn() } as any)
    await expect(service.executeScan('RJH-001')).resolves.toEqual({
      type: 'ERROR',
      level: 'error',
      message: '后端返回单据ID异常，无法打开',
    })
  })

  it('内部方法：覆盖边界分支（仅用于覆盖率）', async () => {
    const { NcrApplicationService } = await import('./NcrApplicationService')
    const service = new NcrApplicationService({ delete: vi.fn() } as any)

    // findEmployeeByScanCode: scanCode nullish
    await expect((service as any).findEmployeeByScanCode(undefined)).resolves.toEqual({
      ok: false,
      reason: 'NOT_FOUND',
    })

    // findEmployeeByScanCode: 兼容 Id/ID 字段，以及 Name 缺失
    const { fetchLookup } = await import('@/lib/erp/lookup-core')
    const lookupMock = fetchLookup as unknown as Mock
    lookupMock.mockResolvedValueOnce([{ Id: '5' }])
    lookupMock.mockResolvedValueOnce([{ ID: 6 }])

    await expect((service as any).findEmployeeByScanCode('C1')).resolves.toEqual({
      ok: true,
      employee: { id: 5, name: '' },
    })
    await expect((service as any).findEmployeeByScanCode('C2')).resolves.toEqual({
      ok: true,
      employee: { id: 6, name: '' },
    })

    // normalizePayloadTypesByTemplate: src 非对象 / template 为 nullish
    expect((service as any).normalizePayloadTypesByTemplate(null, { n: 0 })).toBeNull()
    expect((service as any).normalizePayloadTypesByTemplate({ a: 1 }, undefined)).toEqual({ a: 1 })
    expect((service as any).normalizePayloadTypesByTemplate({ s: 'x' }, { s: '' })).toEqual({ s: 'x' })

    // number: NaN / Infinity
    expect((service as any).normalizePayloadTypesByTemplate({ n: 'abc' }, { n: 0 })).toEqual({ n: 0 })
    expect((service as any).normalizePayloadTypesByTemplate({ n: Infinity }, { n: 0 })).toEqual({ n: 0 })
    expect((service as any).normalizePayloadTypesByTemplate({ n: null }, { n: 0 })).toEqual({ n: 0 })

    // boolean: 'false' / unknown / 0 / other
    expect((service as any).normalizePayloadTypesByTemplate({ b: 'false' }, { b: false })).toEqual({ b: false })
    expect((service as any).normalizePayloadTypesByTemplate({ b: 'maybe' }, { b: false })).toEqual({ b: 'maybe' })
    expect((service as any).normalizePayloadTypesByTemplate({ b: 0 }, { b: false })).toEqual({ b: false })
    expect((service as any).normalizePayloadTypesByTemplate({ b: 2 }, { b: false })).toEqual({ b: 2 })

    // normalizeBase64: undefined / 空白 / data: 无逗号
    expect((service as any).normalizeBase64(undefined)).toBe('')
    expect((service as any).normalizeBase64('   ')).toBe('')
    expect((service as any).normalizeBase64('data:abc')).toBe('data:abc')

    // inferSuffixFromNameOrMime: mime 分支
    expect((service as any).inferSuffixFromNameOrMime('', undefined)).toBe('jpg')
    expect((service as any).inferSuffixFromNameOrMime('', 'image/gif')).toBe('gif')
    expect((service as any).inferSuffixFromNameOrMime('', 'image/bmp')).toBe('bmp')
    expect((service as any).inferSuffixFromNameOrMime('', 'image/jpeg')).toBe('jpg')
    expect((service as any).inferSuffixFromNameOrMime('', 'image/unknown')).toBe('jpg')
    expect((service as any).inferSuffixFromNameOrMime('a.PNG', undefined)).toBe('png')
    expect((service as any).inferSuffixFromNameOrMime(undefined, 'image/webp')).toBe('webp')

    // buildDefaultFileName: suffix nullish 时默认 jpg
    const fileName = (service as any).buildDefaultFileName(0, undefined)
    expect(typeof fileName).toBe('string')
    expect(fileName.startsWith('ncr_')).toBe(true)
    expect(fileName.endsWith('_1.jpg')).toBe(true)
  })

})
