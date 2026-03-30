import { beforeEach, describe, expect, it, vi } from 'vitest'

const approvalMock = vi.hoisted(() => vi.fn())
const getBillWithDetailsMock = vi.hoisted(() => vi.fn())
const getAssemblyDraftMock = vi.hoisted(() => vi.fn())
const getProduceDraftMock = vi.hoisted(() => vi.fn())
const createAssemblyDraftMock = vi.hoisted(() => vi.fn())
const createProduceDraftMock = vi.hoisted(() => vi.fn())
const flowScanCheckMock = vi.hoisted(() => vi.fn())
const createByAssemblyFlowDetailMock = vi.hoisted(() => vi.fn())
const createByProduceFlowDetailMock = vi.hoisted(() => vi.fn())
const fetchLookupMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/erp/bill-api', () => ({
  BillApi: {
    GeneralBillApproval: approvalMock,
    GetBillWithDetails: getBillWithDetailsMock,
  },
}))

vi.mock('@/lib/erp/quality-api', () => ({
  QualityApi: {
    GetAssemblyFlowWithFirstInspectionByDailyPlanScanCode: getAssemblyDraftMock,
    GetProduceFlowWithFirstInspectionByExtrusionPlanScanCode: getProduceDraftMock,
    CreateFirstInspectionByDailyPlanAssembly: createAssemblyDraftMock,
    CreateFirstInspectionByDailyPlanProduce: createProduceDraftMock,
  },
}))

vi.mock('@/lib/erp/flow-scan-api', () => ({
  FlowScanApi: { CheckDocumentState: flowScanCheckMock },
  FlowScanSourceType: { DailyPlanDetail: 1, ExtrusionPlanDetail: 2, DefectiveReworkOrderDocument: 3 },
  FlowScanDocumentKind: { FirstInspection: 3 },
  FlowScanCheckState: { NotCreated: 0, Unfinished: 4, PrevCompletedCurrentUnfinished: 5 },
}))

vi.mock('@/lib/erp/craft-api', () => ({
  CreateFirstInspectionByAssemblyFlowDetail: createByAssemblyFlowDetailMock,
  CreateFirstInspectionByProduceFlowDetail: createByProduceFlowDetailMock,
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
   * 首件检验表头（测试桩）。
   *
   */
  class FirstInspectionDocument {
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
   * 首件检验明细（测试桩）。
   *
   */
  class FirstInspectionDetail {
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

  return { FirstInspectionDocument, FirstInspectionDetail, DocumentStatus, CheckResult }
})

import { FirstInspectionApplicationService } from './FirstInspectionApplicationService'
import { FirstInspection } from '@/domain/quality/fai/entities/FirstInspection'
import { FirstInspectionDetail } from '@/domain/quality/fai/entities/FirstInspectionDetail'
import { InspectionQuantitySplit } from '@/domain/quality/fqc/value-objects/InspectionQuantitySplit'
import { InspectionResult } from '@/domain/quality/fqc/value-objects/InspectionResult'
import { MeasureRecords } from '@/domain/quality/fqc/value-objects/MeasureRecords'
import { CheckResult, DocumentStatus, FirstInspectionDocument } from '@/types/erp-db.generated'

describe('FirstInspectionApplicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createDetail = (id: number, inspect = 1, pass = 1) =>
    new FirstInspectionDetail({
      id,
      projectName: 'p',
      content: 'c',
      quantitySplit: InspectionQuantitySplit.create({
        inspectQuantity: inspect,
        okQuantity: pass,
        concessionQuantity: 0,
        ngQuantity: Math.max(0, inspect - pass),
      }),
      result: InspectionResult.from(CheckResult.合格),
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
    new FirstInspection({
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
      result: InspectionResult.from(CheckResult.合格),
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
    const doc = new FirstInspectionDocument()
    doc.initDefaults()
    doc.id = 10
    doc.Status = DocumentStatus.未审批
    const detail = new (await import('@/types/erp-db.generated')).FirstInspectionDetail()
    detail.initDefaults()
    detail.id = 1
    getBillWithDetailsMock.mockResolvedValueOnce({ data: { Document: doc, Details: [detail] } })

    const service = new FirstInspectionApplicationService(repo as any)
    const result = await service.fetchById(10)

    expect(getBillWithDetailsMock).toHaveBeenCalledWith({ tableName: 'FirstInspectionDocument', billId: 10 })
    expect(result.document).toBeInstanceOf(FirstInspectionDocument)
    expect(result.details).toHaveLength(1)
    expect(result.aggregate?.id).toBe(10)
  })

  it('save: 映射聚合并调用仓储', async () => {
    const repo = createRepo()
    const savedAggregate = createAggregate(99)
    repo.save.mockResolvedValue(savedAggregate)

    const service = new FirstInspectionApplicationService(repo as any)
    const bill: any = { id: 0, Status: 0, Employeeid: 1, ChkBQty: 1, PassBQty: 1, NotPassBQty: 0 }
    const details: any[] = [{ id: 0, ChkBQty: 1, PassBQty: 1, CheckResult: CheckResult.合格, Method: 'm', Frequency: '1' }]

    const res = await service.save({ bill, details })

    expect(repo.save).toHaveBeenCalledOnce()
    expect(res.id).toBe(99)
  })

  it('approve: id 非法时直接返回失败', async () => {
    const service = new FirstInspectionApplicationService(createRepo() as any)
    await expect(service.approve(0)).resolves.toEqual({ success: false, message: '审批前请先保存单据' })
  })

  it('approve: 成功时返回 ncrHint（当 NG 数量或明细不合格）', async () => {
    const repo = createRepo()
    repo.findById.mockResolvedValueOnce(createAggregate(5, DocumentStatus.未审批, 2, 1))
    approvalMock.mockResolvedValueOnce({ success: true, message: 'ok' })

    const service = new FirstInspectionApplicationService(repo as any)
    const res = await service.approve(5)

    expect(approvalMock).toHaveBeenCalledOnce()
    expect(res.success).toBe(true)
    expect(res.ncrHint).toBe(true)
  })

  it('executeScan: 支持打开/检验员/日计划草稿', async () => {
    const service = new FirstInspectionApplicationService(createRepo() as any)

    const open = await service.executeScan('id:123')
    expect(open).toEqual({ type: 'OPEN_BY_ID', id: 123 })

    const invalid = await service.executeScan('id:0')
    expect(invalid).toEqual({ type: 'ERROR', level: 'error', message: '单据ID不合法' })

    const setInspector = await service.executeScan('ZY-01')
    expect(setInspector).toEqual({ type: 'SET_INSPECTOR', code: 'ZY-01' })

    flowScanCheckMock.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: {
        Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }],
      },
    })
    createByAssemblyFlowDetailMock.mockResolvedValueOnce({ data: { Document: { id: 1 }, Details: [] }, message: 'ok', success: true })
    const daily = await service.executeScan('RJH-001')
    expect(daily.type).toBe('DRAFT_LOADED')
  })

  it('executeScan: 日计划草稿为 ProduceFlowDetail 时走 produce 明细入口', async () => {
    const service = new FirstInspectionApplicationService(createRepo() as any)

    flowScanCheckMock.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: {
        Items: [{ Matched: true, FlowDetail: { TableName: 'ProduceFlowDetail', id: 99 } }],
      },
    })
    createByProduceFlowDetailMock.mockResolvedValueOnce({ data: { Document: { id: 2 }, Details: [] }, message: 'ok', success: true })
    const res = await service.executeScan('RJH-002')
    expect(res.type).toBe('DRAFT_LOADED')
  })

  it('executeScan: 挤出计划条码（JCJH-*）走 FlowScanApi 且 sourceType=ExtrusionPlanDetail', async () => {
    const service = new FirstInspectionApplicationService(createRepo() as any)

    flowScanCheckMock.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: {
        Items: [{ Matched: true, FlowDetail: { TableName: 'ProduceFlowDetail', id: 99 } }],
      },
    })
    createByProduceFlowDetailMock.mockResolvedValueOnce({ data: { Document: { id: 3 }, Details: [] }, message: 'ok', success: true })

    const res = await service.executeScan('JCJH-202603050001')
    expect(flowScanCheckMock).toHaveBeenCalledWith(expect.objectContaining({ sourceType: 2 }))
    expect(res.type).toBe('DRAFT_LOADED')
  })

  it('executeDailyPlanScanCreate: 多条当前工序明细时返回 NEED_PICK_FLOW_DETAIL', async () => {
    const service = new FirstInspectionApplicationService(createRepo() as any)

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
    expect((res as any).candidates[0]).toEqual(
      expect.objectContaining({ flowDetailTableName: 'ProcessAssemblyFlowDetail', flowDetailId: 11, typeofWorkId: 101 }),
    )
  })

  it('executeDailyPlanScanCreate: 多条当前工序明细且存在未审批单据时直接 OPEN_BY_ID', async () => {
    const service = new FirstInspectionApplicationService(createRepo() as any)

    flowScanCheckMock.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: {
        Items: [
          {
            Matched: true,
            FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 },
            Documents: [
              { TableName: 'FirstInspectionDocument', Id: 9, Status: 0 },
              { TableName: 'FirstInspectionDocument', Id: 10, Status: 0 },
              { TableName: 'OtherDoc', Id: 999, Status: 0 },
            ],
          },
          { Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 22 } },
        ],
      },
    })

    const res = await service.executeScan('RJH-MULTI')
    expect(res).toEqual({ type: 'OPEN_BY_ID', id: 10 })
    expect(fetchLookupMock).not.toHaveBeenCalled()
  })

  it('executeDailyPlanScanCreate: 选择明细后按明细入口生成草稿', async () => {
    const service = new FirstInspectionApplicationService(createRepo() as any)

    createByAssemblyFlowDetailMock.mockResolvedValueOnce({ data: { Document: { id: 1 }, Details: [] }, success: true })
    const res = await service.executeDailyPlanScanCreate('RJH-PICK', {
      pickedFlowDetail: { tableName: 'ProcessAssemblyFlowDetail', id: 11 },
    })
    expect(createByAssemblyFlowDetailMock).toHaveBeenCalledOnce()
    expect(res.type).toBe('DRAFT_LOADED')
  })

  it('executeScan: 返工单条码（FGD-*）生成/打开首件检验草稿', async () => {
    const service = new FirstInspectionApplicationService(createRepo() as any)
    flowScanCheckMock.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] },
    })
    createByAssemblyFlowDetailMock.mockResolvedValueOnce({ success: true, message: 'ok', data: { Document: { id: 7 }, Details: [] } })

    await expect(service.executeScan('FGD-001')).resolves.toEqual({
      type: 'DRAFT_LOADED',
      document: { id: 7 },
      details: [],
      message: 'ok',
    })
    expect(flowScanCheckMock).toHaveBeenCalledOnce()
    expect(createByAssemblyFlowDetailMock).toHaveBeenCalledOnce()
  })

  it('executeScan: 返工单草稿生成失败时展示后端 message', async () => {
    const service = new FirstInspectionApplicationService(createRepo() as any)
    flowScanCheckMock.mockResolvedValueOnce({ success: false, message: 'bad' })

    await expect(service.executeScan('FGD-002')).resolves.toEqual({ type: 'ERROR', level: 'error', message: 'bad' })
  })

  it('executeScan: 不支持条码时返回 warning', async () => {
    const service = new FirstInspectionApplicationService(createRepo() as any)
    getAssemblyDraftMock.mockResolvedValueOnce(null)
    getProduceDraftMock.mockResolvedValueOnce(null)
    await expect(service.executeScan('UNKNOWN')).resolves.toEqual({ type: 'ERROR', level: 'warning', message: '暂不支持该条码' })
  })

  it('createDraftByDailyPlanDetailId: 优先取任一有效草稿', async () => {
    const service = new FirstInspectionApplicationService(createRepo() as any)
    createAssemblyDraftMock.mockResolvedValueOnce(null)
    createProduceDraftMock.mockResolvedValueOnce({ data: { Document: {}, Details: [{ id: 1 }] }, success: true })
    const res = await service.createDraftByDailyPlanDetailId(1)
    expect(res.type).toBe('DRAFT_LOADED')
  })

  it('executeScan: 异常时返回 error', async () => {
    const service = new FirstInspectionApplicationService(createRepo() as any)
    flowScanCheckMock.mockRejectedValueOnce(42)
    const res = await service.executeScan('RJH-NO-MESSAGE')
    expect(res).toEqual({ type: 'ERROR', level: 'error', message: '扫码处理失败' })
  })
})
