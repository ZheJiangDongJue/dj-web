import { beforeEach, describe, expect, it, vi } from 'vitest'

const approvalMock = vi.hoisted(() => vi.fn())
const getAssemblyDraftMock = vi.hoisted(() => vi.fn())
const getProduceDraftMock = vi.hoisted(() => vi.fn())
const flowScanCheckMock = vi.hoisted(() => vi.fn())
const createByAssemblyFlowDetailMock = vi.hoisted(() => vi.fn())
const createByProduceFlowDetailMock = vi.hoisted(() => vi.fn())
const fetchLookupMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/erp/bill-api', () => ({
  BillApi: {
    GeneralBillApproval: approvalMock,
  },
}))

vi.mock('@/lib/erp/quality-api', () => ({
  QualityApi: {
    GetAssemblyFlowWithFinalInspectionByDailyPlanScanCode: getAssemblyDraftMock,
    GetProduceFlowWithFinalInspectionByExtrusionPlanScanCode: getProduceDraftMock,
  },
  DEFAULT_DB_NAME: 'db-mock',
}))

vi.mock('@/lib/erp/flow-scan-api', () => ({
  FlowScanApi: { CheckDocumentState: flowScanCheckMock },
  FlowScanSourceType: { DailyPlanDetail: 1, ExtrusionPlanDetail: 2, DefectiveReworkOrderDocument: 3 },
  FlowScanDocumentKind: { FinalInspection: 5 },
  FlowScanCheckState: { NotCreated: 0, Unfinished: 4, PrevCompletedCurrentUnfinished: 5 },
}))

vi.mock('@/lib/erp/craft-api', () => ({
  CreateFinalInspectionByAssemblyFlowDetail: createByAssemblyFlowDetailMock,
  CreateFinalInspectionByProduceFlowDetail: createByProduceFlowDetailMock,
}))

vi.mock('@/lib/erp/lookup-core', () => ({
  fetchLookup: fetchLookupMock,
}))

vi.mock('@/app/features/erp/quality/shared/helpers', () => ({
  getErpUserFromStorage: vi.fn(() => ({ name: 'tester' })),
}))

vi.mock('@/types/erp-db.generated', () => {
  /**
   *
   * 末道检验表头（测试桩）。
   *
   */
  class FinalInspectionDocument {
    public id?: number
    public Status?: number
    public Materialid?: number
    public Departmentid?: number
    public Employeeid?: number
    public Clientid?: number
    public CheckMethodid?: number
    public CheckCaseDocumentid?: number
    public HandlingMethodid?: number
    public CheckDeliveryTime?: string | null
    public CheckResult?: number
    public PreCmpBQty?: number
    public ChkBQty?: number
    public PassBQty?: number
    public RQty?: number
    public NotPassBQty?: number
    public Cname?: string
    public InnerKey?: string
    public SeverityLevel?: number
    public TypeofWorkid?: number
    public Qty?: number

    /**
     *
     * 填充默认值（测试桩）。
     *
     */
    public initDefaults() {
      this.Materialid ??= 0
      this.Departmentid ??= 0
      this.Employeeid ??= 0
      this.Clientid ??= 0
      this.CheckMethodid ??= 0
      this.CheckCaseDocumentid ??= 0
      this.HandlingMethodid ??= 0
      this.CheckResult ??= 1
      this.PreCmpBQty ??= 0
      this.ChkBQty ??= 0
      this.PassBQty ??= 0
      this.RQty ??= 0
      this.NotPassBQty ??= 0
      this.Cname ??= ''
      this.InnerKey ??= ''
      this.SeverityLevel ??= 0
      this.TypeofWorkid ??= 0
      this.Qty ??= 0
    }
  }

  /**
   *
   * 末道检验明细（测试桩）。
   *
   */
  class FinalInspectionDetail {
    public id?: number
    public ProjectName?: string
    public Content?: string
    public ChkBQty?: number
    public PassBQty?: number
    public PassRate?: number
    public CheckResult?: number
    public AQL?: string
    public ACRE?: string
    public Method?: string
    public Frequency?: string
    public MeasuredRecord1?: string
    public MeasuredRecord2?: string
    public MeasuredRecord3?: string
    public MeasuredRecord4?: string
    public MeasuredRecord5?: string
    public DownQValue?: string
    public UpQValue?: string
    public CmpQValue?: string

    /**
     *
     * 填充默认值（测试桩）。
     *
     */
    public initDefaults() {
      this.ProjectName ??= ''
      this.Content ??= ''
      this.ChkBQty ??= 0
      this.PassBQty ??= 0
      this.PassRate ??= 0
      this.CheckResult ??= 1
      this.AQL ??= ''
      this.ACRE ??= ''
      this.Method ??= ''
      this.Frequency ??= ''
      this.MeasuredRecord1 ??= ''
      this.MeasuredRecord2 ??= ''
      this.MeasuredRecord3 ??= ''
      this.MeasuredRecord4 ??= ''
      this.MeasuredRecord5 ??= ''
      this.DownQValue ??= ''
      this.UpQValue ??= ''
      this.CmpQValue ??= ''
    }
  }

  const DocumentStatus = {
    未审批: 0,
    已审批: 1,
    已冻结: 2,
    已结案: 4,
    已作废: 8,
  }

  const CheckResult = { 合格: 1, 让步接收: 2, 不合格: 4 }

  return { FinalInspectionDocument, FinalInspectionDetail, DocumentStatus, CheckResult }
})

import { FinalInspectionApplicationService } from './FinalInspectionApplicationService'
import { FinalInspection } from '@/domain/quality/fqc/entities/FinalInspection'
import { FinalInspectionDetail } from '@/domain/quality/fqc/entities/FinalInspectionDetail'
import { InspectionQuantitySplit } from '@/domain/quality/fqc/value-objects/InspectionQuantitySplit'
import { InspectionResult } from '@/domain/quality/fqc/value-objects/InspectionResult'
import { MeasureRecords } from '@/domain/quality/fqc/value-objects/MeasureRecords'
import { DocumentStatus, FinalInspectionDocument, CheckResult } from '@/types/erp-db.generated'

describe('FinalInspectionApplicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createDetail = (id: number, inspect = 1, pass = 1) =>
    new FinalInspectionDetail({
      id,
      projectName: 'p',
      content: 'c',
      quantitySplit: InspectionQuantitySplit.create({
        inspectQuantity: inspect,
        okQuantity: pass,
        concessionQuantity: 0,
        ngQuantity: Math.max(0, inspect - pass),
      }),
      result: InspectionResult.from(1),
      aql: '',
      acre: '',
      method: 'm',
      frequency: '1',
      measureRecords: MeasureRecords.from(['1']),
      downQValue: '',
      upQValue: '',
      cmpQValue: '',
      passRate: 0,
    })

  const createAggregate = (id = 1, status = DocumentStatus.未审批, detailInspect = 1, detailPass = 1) =>
    new FinalInspection({
      id,
      createByDocumentId: null,
      createByDocumentType: '',
      createByDetailId: null,
      createByDetailType: '',
      status,
      materialId: 1,
      departmentId: 1,
      employeeId: 2,
      clientId: 3,
      checkMethodId: 4,
      checkCaseDocumentId: 5,
      handlingMethodId: 6,
      checkDeliveryTime: null,
      result: InspectionResult.from(1),
      preCompleteBadQty: 0,
      quantitySplit: InspectionQuantitySplit.create({
        inspectQuantity: detailInspect,
        okQuantity: detailPass,
        concessionQuantity: 0,
        ngQuantity: Math.max(0, detailInspect - detailPass),
      }),
      cname: '',
      innerKey: '',
      severityLevel: 0,
      typeOfWorkId: 0,
      qty: 1,
      details: [createDetail(1, detailInspect, detailPass)],
    })

  const createRepo = () => ({
    findById: vi.fn(),
    findByConditions: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  })

  it('fetchById: 返回持久化单据头+明细', async () => {
    const repo = createRepo()
    repo.findById.mockResolvedValue(createAggregate(10))

    const service = new FinalInspectionApplicationService(repo as any)
    const result = await service.fetchById(10)

    expect(repo.findById).toHaveBeenCalledWith(10)
    expect(result.document).toBeInstanceOf(FinalInspectionDocument)
    expect(result.details).toHaveLength(1)
    expect(result.aggregate?.id).toBe(10)
  })

  it('save: 映射聚合并调用仓储', async () => {
    const repo = createRepo()
    const savedAggregate = createAggregate(99)
    repo.save.mockResolvedValue(savedAggregate)

    const service = new FinalInspectionApplicationService(repo as any)
    const bill: any = {
      id: 0,
      Status: 0,
      CreateByDocumentid: 101,
      CreateByDocumentType: 'ProcessAssemblyFlowDocument',
      CreateByDetailid: 202,
      CreateByDetailType: 'ProcessAssemblyFlowDetail',
      Employeeid: 1,
      ChkBQty: 1,
      PassBQty: 1,
      NotPassBQty: 0,
    }
    const details: any[] = [{ id: 0, ChkBQty: 1, PassBQty: 1, CheckResult: 1, Method: 'm', Frequency: '1' }]
    const res = await service.save({ bill, details })

    expect(res.id).toBe(99)
    expect(repo.save).toHaveBeenCalled()
    const [passed] = (repo.save as any).mock.calls[0] as [FinalInspection]
    expect(passed.createByDocumentId).toBe(101)
    expect(passed.createByDocumentType).toBe('ProcessAssemblyFlowDocument')
    expect(passed.createByDetailId).toBe(202)
    expect(passed.createByDetailType).toBe('ProcessAssemblyFlowDetail')
  })

  it('approve: 使用快照校验并提示 NCR 引导', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)
    approvalMock.mockResolvedValue({ issuccess: true, message: 'ok' })

    const bill: any = { id: 7, Status: 0, Employeeid: 1, ChkBQty: 2, PassBQty: 1, NotPassBQty: 1 }
    const details: any[] = [
      { id: 1, ChkBQty: 1, PassBQty: 0, CheckResult: CheckResult.不合格, Method: 'm', Frequency: '1' },
    ]

    const res = await service.approve(7, { bill, details })

    expect(approvalMock).toHaveBeenCalledWith(
      expect.objectContaining({ tableName: 'FinalInspectionDocument', billId: 7, isApprove: true }),
    )
    expect(res.success).toBe(true)
    expect(res.ncrHint).toBe(true)
  })

  it('approve: 状态锁或未保存时返回失败', async () => {
    const repo = createRepo()
    repo.findById.mockResolvedValue(createAggregate(5, DocumentStatus.已冻结))
    const service = new FinalInspectionApplicationService(repo as any)

    await expect(service.approve(0)).resolves.toEqual({ success: false, message: '审批前请先保存单据' })
    await expect(service.approve(5)).resolves.toMatchObject({ success: false, message: expect.stringContaining('冻结') })
    expect(approvalMock).not.toHaveBeenCalled()
  })

  it('approve: 使用仓储快照并处理重复审批', async () => {
    const repo = createRepo()
    repo.findById.mockResolvedValue(createAggregate(8, DocumentStatus.已审批))
    const service = new FinalInspectionApplicationService(repo as any)
    const res = await service.approve(8)
    expect(res.success).toBe(false)
    expect(res.message).toContain('审批')
  })

  it('unapprove: 必须已审批且未锁定', async () => {
    const repo = createRepo()
    repo.findById.mockResolvedValue(createAggregate(3, DocumentStatus.已审批))
    const service = new FinalInspectionApplicationService(repo as any)
    approvalMock.mockResolvedValue({ issuccess: true, message: 'ok' })

    const fail = await service.unapprove(3, { bill: { id: 3, Status: 0 } as any, details: [] })
    expect(fail.success).toBe(false)

    repo.findById.mockResolvedValue(createAggregate(3, DocumentStatus.已审批 | DocumentStatus.已冻结))
    const locked = await service.unapprove(3)
    expect(locked.success).toBe(false)
  })

  it('unapprove: 正常反审批流程', async () => {
    const repo = createRepo()
    repo.findById.mockResolvedValue(createAggregate(11, DocumentStatus.已审批))
    approvalMock.mockResolvedValue({ isSuccess: true, Message: 'done' })

    const service = new FinalInspectionApplicationService(repo as any)
    const res = await service.unapprove(11)

    expect(res.success).toBe(true)
    expect(approvalMock).toHaveBeenCalledWith(
      expect.objectContaining({ tableName: 'FinalInspectionDocument', billId: 11, isApprove: false }),
    )
  })

  it('unapprove: 兼容 Success/msg 分支', async () => {
    const repo = createRepo()
    repo.findById.mockResolvedValue(createAggregate(31, DocumentStatus.已审批))
    approvalMock.mockResolvedValue({ Success: true, msg: 123 })
    const service = new FinalInspectionApplicationService(repo as any)
    const res = await service.unapprove(31)
    expect(res.success).toBe(true)
    expect(res.message).toBe('123')
  })

  it('findByConditions: 返回列表并映射持久化模型', async () => {
    const repo = createRepo()
    repo.findByConditions.mockResolvedValue([createAggregate(1), createAggregate(2)])
    const service = new FinalInspectionApplicationService(repo as any)

    const list = await service.findByConditions({ take: 2 })
    expect(repo.findByConditions).toHaveBeenCalled()
    expect(list).toHaveLength(2)
    expect(list[1].document).toBeInstanceOf(FinalInspectionDocument)
  })

  it('save: 无法解析数据时返回失败信息', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)
    const res = await service.save({ bill: null as any, details: [] })
    expect(res.id).toBeNull()
    expect(res.message).toContain('无法解析')
  })

  it('save: 仓储抛错时返回兜底提示', async () => {
    const repo = createRepo()
    repo.save.mockRejectedValueOnce('boom')
    const service = new FinalInspectionApplicationService(repo as any)
    const bill: any = { id: 1, Status: 0, ChkBQty: 1, PassBQty: 1 }
    const details: any[] = [{ id: 1, ChkBQty: 1, PassBQty: 1, CheckResult: 1, Method: 'm', Frequency: '1' }]
    const res = await service.save({ bill, details })
    expect(res.id).toBeNull()
    expect(res.message).toBe('boom')
  })

  it('executeScan: 支持 id/日计划/返工单分流', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)

    const open = await service.executeScan('id:123')
    expect(open).toEqual({ type: 'OPEN_BY_ID', id: 123 })

    const invalid = await service.executeScan('id:0')
    expect(invalid).toEqual({ type: 'ERROR', level: 'error', message: '单据ID不合法' })

    flowScanCheckMock.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] },
    })
    createByAssemblyFlowDetailMock.mockResolvedValueOnce({ data: { Document: {}, Details: [] }, message: 'ok', success: true })
    const daily = await service.executeScan('RJH-001')
    expect(daily.type).toBe('DRAFT_LOADED')

    flowScanCheckMock.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] },
    })
    createByAssemblyFlowDetailMock.mockResolvedValueOnce({ data: { Document: {}, Details: [] }, message: 'ok', success: true })
    const rework = await service.executeScan('FGD-001')
    expect(rework.type).toBe('DRAFT_LOADED')
  })

  it('executeScan: 挤出计划条码（JCJH-*）走 FlowScanApi 且 sourceType=ExtrusionPlanDetail', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)

    flowScanCheckMock.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProduceFlowDetail', id: 99 } }] },
    })
    createByProduceFlowDetailMock.mockResolvedValueOnce({ data: { Document: {}, Details: [] }, message: 'ok', success: true })

    const res = await service.executeScan('JCJH-202603050001')
    expect(flowScanCheckMock).toHaveBeenCalledWith(expect.objectContaining({ sourceType: 2 }))
    expect(res.type).toBe('DRAFT_LOADED')
  })

  it('executeDailyPlanScanCreate: 多条当前工序明细时返回 NEED_PICK_FLOW_DETAIL', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)

    flowScanCheckMock.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: {
        Items: [
          { Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } },
          { Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 22 } },
        ],
      },
    })

    fetchLookupMock.mockImplementation(async (_tableName: string, _fields: string[], _order: any, query: any) => {
      const id = Number((query as any)?.where?.id)
      if (id === 11) return [{ id: 11, TypeofWorkid: 101, LocationIndex: 1 }]
      if (id === 22) return [{ id: 22, TypeofWorkid: 202, LocationIndex: 2 }]
      return []
    })

    const res = await service.executeScan('RJH-MULTI')
    expect(res.type).toBe('NEED_PICK_FLOW_DETAIL')
    expect((res as any).candidates).toHaveLength(2)
  })

  it('executeDailyPlanScanCreate: 多条当前工序明细且存在未审批单据时直接 OPEN_BY_ID', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)

    flowScanCheckMock.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: {
        Items: [
          {
            Matched: true,
            FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 },
            Documents: [
              { TableName: 'FinalInspectionDocument', Id: 10, Status: 0 },
              { TableName: 'FinalInspectionDocument', Id: 11, Status: 0 },
              { TableName: 'OtherDoc', Id: 999, Status: 0 },
            ],
          },
          { Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 22 } },
        ],
      },
    })

    const res = await service.executeScan('RJH-MULTI')
    expect(res).toEqual({ type: 'OPEN_BY_ID', id: 11 })
    expect(fetchLookupMock).not.toHaveBeenCalled()
  })

  it('executeDailyPlanScanCreate: 选择明细后按明细入口生成草稿', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)

    createByAssemblyFlowDetailMock.mockResolvedValueOnce({ data: { Document: { id: 1 }, Details: [] }, success: true })
    const res = await service.executeDailyPlanScanCreate('RJH-PICK', {
      pickedFlowDetail: { tableName: 'ProcessAssemblyFlowDetail', id: 11 },
    })
    expect(createByAssemblyFlowDetailMock).toHaveBeenCalledOnce()
    expect(res.type).toBe('DRAFT_LOADED')
  })

  it('executeScan: 兜底与异常处理', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)

    getAssemblyDraftMock.mockResolvedValueOnce(null)
    getProduceDraftMock.mockResolvedValueOnce({ data: { Document: { id: 1 }, Details: [] } })
    const fallback = await service.executeScan('OTHER-CODE')
    expect(fallback.type).toBe('DRAFT_LOADED')

    const empty = await service.executeScan('')
    expect(empty).toEqual({ type: 'ERROR', level: 'warning', message: '扫描内容为空' })

    getAssemblyDraftMock.mockRejectedValueOnce(new Error('boom'))
    const err = await service.executeScan('OTHER-ERR')
    expect(err.type).toBe('ERROR')
  })

  it('executeScan: 支持设置检验员与不支持的条码', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)

    const inspector = await service.executeScan('ZY-123')
    expect(inspector).toEqual({ type: 'SET_INSPECTOR', code: 'ZY-123' })

    getAssemblyDraftMock.mockResolvedValueOnce(null)
    getProduceDraftMock.mockResolvedValueOnce(null)
    const unsupported = await service.executeScan('UNSUPPORTED-CODE')
    expect(unsupported).toEqual({ type: 'ERROR', level: 'warning', message: '暂不支持该条码' })
  })

  it('approve: 聚合无 Id 时返回失败', async () => {
    const repo = createRepo()
    repo.findById.mockResolvedValue(createAggregate(0))
    const service = new FinalInspectionApplicationService(repo as any)
    const res = await service.approve(5)
    expect(res.success).toBe(false)
    expect(res.message).toContain('保存')
  })

  it('approve: 处理后端审批失败与 NCR 提示关闭', async () => {
    const repo = createRepo()
    repo.findById.mockResolvedValue(createAggregate(12, DocumentStatus.未审批, 1, 1))
    approvalMock.mockResolvedValue({ success: false, message: 'fail' })
    const service = new FinalInspectionApplicationService(repo as any)
    const res = await service.approve(12)
    expect(res.success).toBe(false)
    expect(res.ncrHint).toBeUndefined()
    expect(res.message).toBe('fail')
  })

  it('executeScan: 异常信息缺失时返回默认提示', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)

    flowScanCheckMock.mockRejectedValueOnce(42)
    const res = await service.executeScan('RJH-NO-MESSAGE')
    expect(res).toEqual({ type: 'ERROR', level: 'error', message: '扫码处理失败' })
  })

  it('executeScan: pack 成功但无数据时回退不支持', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)

    flowScanCheckMock.mockResolvedValueOnce({ success: true, data: { Items: [] } })
    const res = await service.executeScan('RJH-NO-DATA')
    expect(res).toEqual({ type: 'ERROR', level: 'warning', message: '未找到可检验工序或无需末道检验' })
  })

  it('executeScan: 仅明细返回时仍提供草稿', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)
    getAssemblyDraftMock.mockResolvedValueOnce({ data: { document: null, details: [{ id: 1 }] } })
    const res = await service.executeScan('OTHER-DETAIL-ONLY')
    expect(res).toEqual({ type: 'DRAFT_LOADED', document: null, details: [{ id: 1 }], message: undefined })
  })

  it('executeScan: 详情字段非数组时回退为空数组', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)
    getAssemblyDraftMock.mockResolvedValueOnce({ data: { Document: { id: 30 }, Details: 'not-array' } })
    const res = await service.executeScan('OTHER-NOT-ARRAY')
    expect(res).toEqual({ type: 'DRAFT_LOADED', document: expect.any(Object), details: [], message: undefined })
  })

  it('executeScan: 兼容 Data/Message 分支', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)
    getAssemblyDraftMock.mockResolvedValueOnce({ Data: { document: { id: 20 }, details: [{ id: 1 }] }, Message: 'upper-msg' })
    const res = await service.executeScan('OTHER-DATA')
    expect(res).toEqual({
      type: 'DRAFT_LOADED',
      document: expect.any(Object),
      details: expect.any(Array),
      message: 'upper-msg',
    })
  })

  it('approve: 聚合缺失时也尝试调用审批接口', async () => {
    const repo = createRepo()
    repo.findById.mockResolvedValue(null)
    approvalMock.mockResolvedValue({ isSuccess: true, message: 'ok' })
    const service = new FinalInspectionApplicationService(repo as any)
    const res = await service.approve(21)
    expect(res.success).toBe(true)
    expect(approvalMock).toHaveBeenCalled()
  })

  it('fetchById: 超出安全整数时直接返回空结果', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)
    const huge = await service.fetchById(Number.MAX_SAFE_INTEGER + 100)
    expect(huge.document).toBeNull()
    expect(repo.findById).not.toHaveBeenCalled()
  })

  it('executeScan: 返工单接口无数据时返回明确提示', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)
    flowScanCheckMock.mockResolvedValueOnce({ success: true, message: '', data: { Items: [] } })
    const res = await service.executeScan('FGD-NONE')
    expect(res).toEqual({ type: 'ERROR', level: 'warning', message: '未找到可检验工序或无需末道检验' })
    expect(getAssemblyDraftMock).not.toHaveBeenCalled()
    expect(getProduceDraftMock).not.toHaveBeenCalled()
  })

  it('save: 捕获对象错误信息', async () => {
    const repo = createRepo()
    repo.save.mockRejectedValueOnce({ message: 'obj-fail' })
    const service = new FinalInspectionApplicationService(repo as any)
    const bill: any = { id: 1, Status: 0, ChkBQty: 1, PassBQty: 1 }
    const details: any[] = [{ id: 1, ChkBQty: 1, PassBQty: 1, CheckResult: 1, Method: 'm', Frequency: '1' }]
    const res = await service.save({ bill, details })
    expect(res.message).toBe('obj-fail')
  })

  it('save: 空 message 对象时保持空串', async () => {
    const repo = createRepo()
    repo.save.mockRejectedValueOnce({ message: undefined })
    const service = new FinalInspectionApplicationService(repo as any)
    const bill: any = { id: 1, Status: 0, ChkBQty: 1, PassBQty: 1 }
    const details: any[] = [{ id: 1, ChkBQty: 1, PassBQty: 1, CheckResult: 1, Method: 'm', Frequency: '1' }]
    const res = await service.save({ bill, details })
    expect(res.message).toBe('保存失败')
  })

  it('save: 未知错误返回默认提示', async () => {
    const repo = createRepo()
    repo.save.mockRejectedValueOnce(undefined)
    const service = new FinalInspectionApplicationService(repo as any)
    const bill: any = { id: 1, Status: 0, ChkBQty: 1, PassBQty: 1 }
    const details: any[] = [{ id: 1, ChkBQty: 1, PassBQty: 1, CheckResult: 1, Method: 'm', Frequency: '1' }]
    const res = await service.save({ bill, details })
    expect(res.message).toBe('保存失败')
  })

  it('executeScan: 兼容小写 details/message 字段', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)
    getAssemblyDraftMock.mockResolvedValueOnce({ document: { id: 9 }, details: [], message: 'lower' })
    const res = await service.executeScan('OTHER-lower')
    expect(res).toEqual({ type: 'DRAFT_LOADED', document: expect.any(Object), details: [], message: 'lower' })
  })

  it('executeScan: 非对象返回时安全兜底', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)
    getAssemblyDraftMock.mockResolvedValueOnce(123 as any)
    getProduceDraftMock.mockResolvedValueOnce(null)
    const res = await service.executeScan('OTHER-num')
    expect(res).toEqual({ type: 'ERROR', level: 'warning', message: '暂不支持该条码' })
  })

  it('fetchById: 负数 id 不触发仓储', async () => {
    const repo = createRepo()
    const service = new FinalInspectionApplicationService(repo as any)
    const res = await service.fetchById(-1)
    expect(res.document).toBeNull()
    expect(repo.findById).not.toHaveBeenCalled()
  })
})
