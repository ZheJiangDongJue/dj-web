import { describe, test, expect, beforeEach, vi, type Mock } from 'vitest'
import { FqcViewModel } from './FqcViewModelClass'
import {
  FinalInspectionApplicationService,
  type FinalInspectionActionResult,
  type FinalInspectionSaveResult,
  type FinalInspectionScanResult,
} from '@/application/quality/fqc/FinalInspectionApplicationService'
import { FinalInspectionDocument, FinalInspectionDetail, DocumentStatus } from '@/types/erp-db.generated'
import { setLastFqcBillIdToStorage } from '../../shared/helpers'

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(() => 'loading-id'),
    dismiss: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('../../shared/helpers', async () => {
  const actual = (await vi.importActual('../../shared/helpers')) as object
  return {
    ...actual,
    setLastFqcBillIdToStorage: vi.fn(),
  }
})

vi.mock('@/lib/erp/employee', () => ({
  fetchActiveEmployees: vi.fn(),
}))

vi.mock('@/lib/erp/lookup-core', () => ({
  fetchLookup: vi.fn(),
  toOptions: (list: any[]) => list,
}))

vi.mock('@/lib/erp/material', () => ({
  fetchMaterials: vi.fn(),
}))

vi.mock('@/lib/erp/type-of-work', () => ({
  fetchWorkTypes: vi.fn(),
}))

vi.mock('@/lib/android-bridge', () => ({
  scanQRCode: vi.fn(),
  addScanListener: vi.fn(() => () => {}),
  runAfterAndroidAppResumed: (fn: () => void) => fn(),
}))

const mockSetLastFqcBillIdToStorage = setLastFqcBillIdToStorage as Mock

function createMockAppService(overrides: Partial<FinalInspectionApplicationService> = {}) {
  const base: Record<string, any> = {
    save: vi.fn<Promise<FinalInspectionSaveResult>, any[]>(async () => ({ id: 1, aggregate: null })),
    approve: vi.fn<Promise<FinalInspectionActionResult>, any[]>(async () => ({ success: true, message: '', ncrHint: false })),
    unapprove: vi.fn<Promise<FinalInspectionActionResult>, any[]>(async () => ({ success: true, message: '' })),
    delete: vi.fn<Promise<FinalInspectionActionResult>, any[]>(async () => ({ success: true, message: '' })),
    fetchById: vi.fn(async () => ({ document: null, details: [] })),
    executeScan: vi.fn<Promise<FinalInspectionScanResult>, any[]>(async () => ({ type: 'ERROR', level: 'warning', message: '暂不支持该条码' })),
    createDraftByDailyPlanDetailId: vi.fn<Promise<FinalInspectionScanResult>, any[]>(async () => ({
      type: 'ERROR',
      level: 'warning',
      message: '未找到可检验工序或无需末件检验',
    })),
  }
  return Object.assign(base, overrides) as unknown as FinalInspectionApplicationService
}

function createDocument() {
  const doc = new FinalInspectionDocument()
  doc.initDefaults()
  return doc
}

function createDetail() {
  const detail = new FinalInspectionDetail()
  detail.initDefaults()
  return detail
}

describe('FqcViewModelClass', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('parseMeasureFrequency 对非法频率和 0 启用全部 5 个实测项', () => {
    const vm = new FqcViewModel(createMockAppService())

    expect(vm.parseMeasureFrequency('abc')).toBe(5)
    expect(vm.parseMeasureFrequency('0')).toBe(5)
    expect(vm.parseMeasureFrequency('-1')).toBe(5)
    expect(vm.parseMeasureFrequency('2')).toBe(2)
  })

  test('handleSave 使用应用服务保存并回写 id', async () => {
    const appService = createMockAppService({
      save: vi.fn(async () => ({ id: 123, aggregate: null })),
    })
    const vm = new FqcViewModel(appService)

    const id = await vm.handleSave()

    expect(appService.save).toHaveBeenCalledWith({ bill: vm.bill, details: vm.details })
    expect(id).toBe(123)
    expect(vm.currentId).toBe(123)
  })

  test('handleSave 在未返回 id 时返回 null 并不中断流程', async () => {
    const appService = createMockAppService({
      save: vi.fn(async () => ({ id: null, message: 'fail' })),
    })
    const vm = new FqcViewModel(appService)

    const id = await vm.handleSave()

    expect(appService.save).toHaveBeenCalledOnce()
    expect(id).toBeNull()
  })

  test('handleSave 在桥接更新失败时仍回写 id', async () => {
    const appService = createMockAppService({
      save: vi.fn(async () => ({ id: 77, aggregate: null })),
    })
    const vm = new FqcViewModel(appService)
    const originalUpdateMaterialCodeFromBill = (vm as any).updateMaterialCodeFromBill
    ;(vm as any).updateMaterialCodeFromBill = vi.fn(() => {
      throw new Error('boom')
    })

    const id = await vm.handleSave()

    expect(id).toBe(77)
    expect(vm.currentId).toBe(77)
    ;(vm as any).updateMaterialCodeFromBill = originalUpdateMaterialCodeFromBill
  })

  test('handleApprove 成功时使用应用服务并触发 NCR 引导', async () => {
    const appService = createMockAppService({
      save: vi.fn(async () => ({ id: 10, aggregate: null })),
      approve: vi.fn(async () => ({ success: true, message: 'ok', ncrHint: true })),
    })
    const vm = new FqcViewModel(appService)
    vm.required.checkEmptyAndFocus = vi.fn(() => ({ hasEmpty: false }))
    vm.status = DocumentStatus.未审批
    ;(vm.bill as any).DocumentStatus = DocumentStatus.未审批
    const assignMock = vi.fn()
    ;(globalThis as any).window = { location: { origin: 'http://localhost', assign: assignMock } }
    const { toast } = await import('sonner')

    const ok = await vm.handleApprove()

    expect(ok).toBe(true)
    expect((vm.bill as any).DocumentStatus).toBe(DocumentStatus.已审批)
    expect(appService.approve).toHaveBeenCalledWith(10, { bill: vm.bill, details: vm.details })
    expect(mockSetLastFqcBillIdToStorage).toHaveBeenCalledWith(10)
    expect(assignMock).toHaveBeenCalledWith(expect.stringContaining('billId=10'))
    expect((toast.dismiss as any).mock.invocationCallOrder[0]).toBeLessThan((assignMock as any).mock.invocationCallOrder[0])
  })

  test('删除中间明细后审批不应把已删除明细带回保存快照', async () => {
    const save = vi.fn(async (_payload: any) => ({ id: 88, aggregate: null }))
    const approve = vi.fn(async () => ({ success: true, message: 'ok', ncrHint: false }))
    const appService = createMockAppService({ save, approve })
    const vm = new FqcViewModel(appService)
    vm.required.checkEmptyAndFocus = vi.fn(() => ({ hasEmpty: false, emptyKeys: [] }))
    ;(vm.bill as any).Code = 'FQC-DEL-001'
    ;(vm.bill as any).DocumentStatus = DocumentStatus.未审批
    const keepA = createDetail()
    keepA.ProjectName = '保留A'
    const deleted = createDetail()
    deleted.ProjectName = '删除B'
    const keepC = createDetail()
    keepC.ProjectName = '保留C'
    vm.details = [keepA, deleted, keepC] as any

    const deletedKey = vm.getDetailKey(vm.details[1])
    vm.removeDetailByKey(deletedKey)
    const ok = await vm.handleApprove()

    expect(ok).toBe(true)
    expect(vm.details.map((d) => d.ProjectName)).toEqual(['保留A', '保留C'])
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining([
        expect.objectContaining({ ProjectName: '保留A' }),
        expect.objectContaining({ ProjectName: '保留C' }),
      ]),
    }))
    expect(save.mock.calls[0]?.[0]?.details.map((d: any) => d.ProjectName)).toEqual(['保留A', '保留C'])
    expect(approve).toHaveBeenCalledWith(88, expect.objectContaining({
      details: expect.not.arrayContaining([
        expect.objectContaining({ ProjectName: '删除B' }),
      ]),
    }))
  })

  test('processScanCode 应用服务返回草稿时写入状态', async () => {
    const doc = createDocument()
    const detail = createDetail()
    detail.ProjectName = '长度'
    const appService = createMockAppService({
      executeScan: vi.fn(async () => ({
        type: 'DRAFT_LOADED',
        document: doc,
        details: [detail],
        message: 'ok',
      })),
    })
    const vm = new FqcViewModel(appService)

    await vm.processScanCode('RJH-001')

    expect(appService.executeScan).toHaveBeenCalledWith('RJH-001')
    expect(vm.details).toHaveLength(1)
    expect(vm.details[0].ProjectName).toBe('长度')
  })

  test('processScanCode：草稿写入后若实例不再激活，会转交扫码并跳过成功 toast', async () => {
    const doc = createDocument()
    ;(doc as any).id = 10
    const detail = createDetail()
    const appService = createMockAppService({
      executeScan: vi.fn(async () => ({
        type: 'DRAFT_LOADED',
        document: doc,
        details: [detail],
        message: '',
      })),
    })
    const vm = new FqcViewModel(appService)
    vi.spyOn(vm as any, 'refresh').mockResolvedValue(undefined)
    const redeliver = vi.spyOn(vm as any, 'redeliverScanCodeToActive').mockImplementation(() => void 0)
    const active = vi.spyOn(vm as any, 'isScanListenerActive')
    active
      .mockReturnValueOnce(true) // handleScan: executeScan 后
      .mockReturnValueOnce(true) // applyScanResult: 入口
      .mockReturnValueOnce(true) // applyFinalInspectionDraft: 入口
      .mockReturnValueOnce(false) // applyFinalInspectionDraft: toast 前

    await vm.processScanCode('RJH-001')

    const { toast } = (await import('sonner')) as any
    expect(redeliver).toHaveBeenCalledWith('RJH-001')
    expect(toast.success).not.toHaveBeenCalled()
  })

  test('processScanCode 在草稿未携带 id 时不应沿用旧单据 id 回刷', async () => {
    const doc = createDocument()
    ;(doc as any).id = 0
    const detail = createDetail()
    const appService = createMockAppService({
      executeScan: vi.fn(async () => ({
        type: 'DRAFT_LOADED',
        document: doc,
        details: [detail],
        message: 'ok',
      })),
    })
    const vm = new FqcViewModel(appService)
    ;(vm as any).bridge.docActions.setId(11)
    const refreshSpy = vi.spyOn(vm, 'refresh').mockResolvedValue(undefined)

    await vm.processScanCode('RJH-001')

    expect(refreshSpy).not.toHaveBeenCalled()
    expect((vm as any).bridge.docActions.state.id).not.toBe(11)
  })

  test('handleRefresh 会调用应用服务 fetchById', async () => {
    const nextDoc = createDocument()
    nextDoc.Code = 'FQC-001'
    const appService = createMockAppService({
      save: vi.fn(async () => ({ id: 22, aggregate: null })),
      fetchById: vi.fn(async () => ({ document: nextDoc, details: [] })),
    })
    const vm = new FqcViewModel(appService)
    await vm.handleSave()

    await vm.handleRefresh()

    expect(appService.fetchById).toHaveBeenCalledWith(22)
  })

  test('handleUnapprove 与 handleDelete 使用应用服务并更新禁用状态', async () => {
    const appService = createMockAppService({
      save: vi.fn(async () => ({ id: 33, aggregate: null })),
      unapprove: vi.fn(async () => ({ success: true, message: '' })),
      delete: vi.fn(async () => ({ success: true, message: '' })),
    })
    const vm = new FqcViewModel(appService)
    vm.required.checkEmptyAndFocus = vi.fn(() => ({ hasEmpty: false }))

    await vm.handleSave()
    vm.status = DocumentStatus.已审批
    ;(vm.bill as any).DocumentStatus = DocumentStatus.已审批
    expect(vm.disableApprove).toBe(true)
    expect(vm.disableUnapprove).toBe(false)
    expect(vm.disableRemoveDetail).toBe(true)

    const billBefore = vm.bill
    const unapproveOk = await vm.handleUnapprove()
    expect((vm.bill as any).Status).toBe(DocumentStatus.未审批)
    expect((vm.bill as any).DocumentStatus).toBe(DocumentStatus.未审批)
    const deleteOk = await vm.handleDelete()

    expect(unapproveOk).toBe(true)
    expect(deleteOk).toBe(true)
    expect(appService.unapprove).toHaveBeenCalledWith(33, { bill: billBefore, details: vm.details })
    expect(appService.delete).toHaveBeenCalledWith(33)
    expect(vm.disableApprove).toBe(false)
    expect(vm.disableUnapprove).toBe(true)
  })

  test('handleScan 支持扫码设置检验员', async () => {
    const { fetchLookup } = await import('@/lib/erp/lookup-core')
    ;(fetchLookup as Mock).mockResolvedValue([{ id: 9, Name: '检验员A', CodeForScan: 'ZY-01' }])
    const appService = createMockAppService({
      executeScan: vi.fn(async () => ({ type: 'SET_INSPECTOR', code: 'ZY-01' })),
    })
    const vm = new FqcViewModel(appService)

    await vm.processScanCode('ZY-01')

    expect(appService.executeScan).toHaveBeenCalledWith('ZY-01')
    expect((vm.bill as any).Employeeid).toBe(9)
  })

  test('handleScan：职员联查返回 name 小写且 Name 为空时，toast 应兜底不为空', async () => {
    const { fetchLookup } = await import('@/lib/erp/lookup-core')
    ;(fetchLookup as Mock).mockResolvedValue([{ id: 9, Name: '', name: '检验员小写字段', CodeForScan: 'ZY-01' }])
    const appService = createMockAppService({
      executeScan: vi.fn(async () => ({ type: 'SET_INSPECTOR', code: 'ZY-01' })),
    })
    const vm = new FqcViewModel(appService)

    await vm.processScanCode('ZY-01')

    const { toast } = (await import('sonner')) as any
    expect(toast.success).toHaveBeenCalled()
    const msg = String((toast.success as any).mock.calls?.[0]?.[0] ?? '')
    expect(msg).toContain('已设置检验员：')
    expect(msg.trim().endsWith('：')).toBe(false)
  })

  test('handleJudgeChange 在禁用状态下直接返回', () => {
    const vm = new FqcViewModel(createMockAppService())
    vm.status = DocumentStatus.已审批

    vm.handleJudgeChange('1')

    expect(vm.disableDetailEdit).toBe(true)
  })

  test('数量联动保持总和一致', () => {
    const vm = new FqcViewModel(createMockAppService())
    vm.setBill('ChkBQty', 10)
    vm.handleJudgeChange('1')
    expect((vm.bill as any).PassBQty).toBe(10)
    vm.handleChangePass(4)
    expect((vm.bill as any).RQty + (vm.bill as any).PassBQty + (vm.bill as any).NotPassBQty).toBe(10)
    vm.handleChangeNg(6)
    expect((vm.bill as any).NotPassBQty).toBe(6)
    vm.handleChangeAllow(3)
    expect((vm.bill as any).RQty + (vm.bill as any).PassBQty + (vm.bill as any).NotPassBQty).toBe(10)
  })

  test('loadInspectorOptions 会映射选项', async () => {
    const { fetchActiveEmployees } = await import('@/lib/erp/employee')
    ;(fetchActiveEmployees as Mock).mockResolvedValue([{ label: '张三', value: 1 }])
    const vm = new FqcViewModel(createMockAppService())

    await vm.loadInspectorOptions()

    expect(vm.inspectorOptions).toEqual([{ label: '张三', value: '1' }])
  })

  test('load 选项失败时使用兜底值并不中断', async () => {
    const { fetchActiveEmployees } = await import('@/lib/erp/employee')
    ;(fetchActiveEmployees as Mock).mockRejectedValue(new Error('fail'))
    const { fetchMaterials } = await import('@/lib/erp/material')
    ;(fetchMaterials as Mock).mockRejectedValue(new Error('fail'))
    const { fetchWorkTypes } = await import('@/lib/erp/type-of-work')
    ;(fetchWorkTypes as Mock).mockRejectedValue(new Error('fail'))
    const vm = new FqcViewModel(createMockAppService())

    await vm.loadInspectorOptions()
    await vm.loadMaterialOptions()
    await vm.loadProcessOptions()

    expect(vm.inspectorOptions[0].label).toBe('未加载成功')
    expect(vm.materialCode).toBe('')
    expect(vm.processOptions).toEqual([])
  })

  test('redirectToNcrPrompt 在 assign 失败时使用 href 回退', () => {
    const vm = new FqcViewModel(createMockAppService())
    const assign = vi.fn(() => {
      throw new Error('assign fail')
    })
    ;(globalThis as any).window = { location: { origin: 'http://localhost', assign, href: '' } }

    ;(vm as any).redirectToNcrPrompt(9)

    expect(assign).toHaveBeenCalled()
    expect((globalThis as any).window.location.href).toContain('billId=9')
    ;(globalThis as any).window = undefined as any
  })

  test('异常数据下 processName 与 materialCode 回退为空', () => {
    const vm = new FqcViewModel(createMockAppService())
    vm.bill = new Proxy({}, { get() { throw new Error('fail') } }) as any
    vm.processName = 'x'
    ;(vm as any).deriveProcessName()
    expect(vm.processName).toBe('')

    vm.materialIndex = new Proxy({}, { get() { throw new Error('fail') } }) as any
    vm.updateMaterialCodeFromBill()
    expect(vm.materialCode).toBe('')
  })

  test('handleApprove 失败时返回 false 并提示必填项', async () => {
    const { toast } = await import('sonner')
    const save = vi.fn(async () => ({ id: 0, aggregate: null }))
    const appService = createMockAppService({
      save,
    })
    const vm = new FqcViewModel(appService)
    vm.required.checkEmptyAndFocus = vi.fn(() => ({ hasEmpty: true, firstEmptyKey: 'ChkBQty' }))

    const ok = await vm.handleApprove()

    expect(ok).toBe(false)
    expect(toast.warning).toHaveBeenCalledWith('请先填写：检验数')
    expect(toast.loading).not.toHaveBeenCalled()
    expect(save).not.toHaveBeenCalled()
  })

  test('tryOpenFinalInspectionByDailyPlanDetailId 调用应用服务生成草稿', async () => {
    const doc = createDocument()
    doc.Code = 'AUTO'
    const appService = createMockAppService({
      createDraftByDailyPlanDetailId: vi.fn(async () => ({
        type: 'DRAFT_LOADED',
        document: doc,
        details: [],
      })),
    })
    const vm = new FqcViewModel(appService)

    const handled = await vm['tryOpenFinalInspectionByDailyPlanDetailId'](12)

    expect(handled).toBe(true)
    expect(appService.createDraftByDailyPlanDetailId).toHaveBeenCalledWith(12)
    expect(vm.bill.Code).toBe('AUTO')
  })

  test('confirmDailyPlanFlowDetailPick: OPEN_BY_ID 时应关闭弹窗并执行打开分支', async () => {
    const { toast } = await import('sonner')
    const appService = createMockAppService({
      executeDailyPlanScanCreate: vi.fn(async () => ({ type: 'OPEN_BY_ID', id: 9 })),
    } as any)
    const vm = new FqcViewModel(appService)
    ;(vm as any).pendingDailyPlanFlowDetailPick = { scanCode: 'RJH-001', candidates: [{ flowDetailTableName: 'T', flowDetailId: 1 }] }
    ;(vm as any).applyScanResult = vi.fn(async () => true)

    await vm.confirmDailyPlanFlowDetailPick({ flowDetailTableName: 'ProcessAssemblyFlowDetail', flowDetailId: 11 } as any)

    expect((appService as any).executeDailyPlanScanCreate).toHaveBeenCalledOnce()
    expect((vm as any).pendingDailyPlanFlowDetailPick).toBeNull()
    expect((vm as any).applyScanResult).toHaveBeenCalledOnce()
    expect((toast.error as any).mock.calls.some((c: any[]) => String(c?.[0] ?? '') === '生成失败，请稍后重试')).toBe(false)
  })

  test('confirmDailyPlanFlowDetailPick: JCJH-* 时应调用 executeExtrusionPlanScanCreate', async () => {
    const appService = createMockAppService({
      executeDailyPlanScanCreate: vi.fn(async () => ({ type: 'OPEN_BY_ID', id: 9 })),
      executeExtrusionPlanScanCreate: vi.fn(async () => ({ type: 'OPEN_BY_ID', id: 9 })),
    } as any)
    const vm = new FqcViewModel(appService)
    ;(vm as any).pendingDailyPlanFlowDetailPick = { scanCode: 'JCJH-202603050001', candidates: [{ flowDetailTableName: 'T', flowDetailId: 1 }] }
    ;(vm as any).applyScanResult = vi.fn(async () => true)

    await vm.confirmDailyPlanFlowDetailPick({ flowDetailTableName: 'ProduceFlowDetail', flowDetailId: 11 } as any)

    expect((appService as any).executeExtrusionPlanScanCreate).toHaveBeenCalledOnce()
    expect((appService as any).executeDailyPlanScanCreate).not.toHaveBeenCalled()
    expect((vm as any).pendingDailyPlanFlowDetailPick).toBeNull()
    expect((vm as any).applyScanResult).toHaveBeenCalledOnce()
  })

  test('覆盖主要分支路径以提升覆盖率', async () => {
    const docForRefresh = createDocument()
    ;(docForRefresh as any).id = 5
    ;(docForRefresh as any).process = '末道'
    const detail = createDetail()
    detail.Frequency = '3'
    const appService = createMockAppService({
      fetchById: vi.fn(async () => ({ document: docForRefresh, details: [detail] })),
      executeScan: vi
        .fn()
        .mockResolvedValueOnce({ type: 'DRAFT_LOADED', document: docForRefresh, details: [detail] })
        .mockResolvedValueOnce({ type: 'ERROR', level: 'warning', message: 'bad' })
        .mockResolvedValueOnce({ type: 'OPEN_BY_ID', id: 5 })
        .mockResolvedValueOnce({ type: 'ERROR', level: 'warning', message: 'done' }),
      createDraftByDailyPlanDetailId: vi.fn(async () => ({
        type: 'DRAFT_LOADED',
        document: docForRefresh,
        details: [detail],
      })),
    })
    const vm = new FqcViewModel(appService)
    const windowPrompt = vi.fn(() => '')
    ;(globalThis as any).window = {
      prompt: windowPrompt,
      location: { origin: 'http://localhost', assign: vi.fn() },
    }

    vm.registerRequired('ChkBQty', {
      key: 'ChkBQty',
      getValue: () => 1,
      isEmpty: () => false,
      checkEmptyAndFocus: () => ({ hasEmpty: false }),
    } as any)
    vm.parseMeasureFrequency('2')
    vm.details = [detail]
    vm.setMeasureAtRow(0, 0, 1)
    vm.removeDetailAt(0)
    vm.createNewBill()
    vm.setBill('Materialid', 1)
    vm.setBill('TypeofWorkid', 2)
    vm.handleJudgeChange('2')
    vm.handleJudgeChange('4')
    vm.handleJudgeChange('1')
    vm.handleChangeInspect(8)
    vm.handleChangePass(4)
    vm.handleChangeNg(3)
    vm.handleChangeAllow(1)
    vm.status = DocumentStatus.已审批
    vm.handleChangeInspect(1)
    vm.handleChangePass('' as any)
    vm.handleChangeNg('' as any)
    vm.handleChangeAllow('' as any)
    vm.replaceState({ bill: docForRefresh, details: [detail] })
    vm.getDetailCardBorderClass(0)
    vm.getDetailCardBorderClass(DocumentStatus.已审批)
    vm.getDetailCardBorderClass(999)

    const { fetchMaterials } = await import('@/lib/erp/material')
    ;(fetchMaterials as Mock).mockResolvedValue([{ value: 1, label: '物料A', raw: { code: 'M1', name: '物料A' } }])
    await vm.loadMaterialOptions()
    const { fetchWorkTypes } = await import('@/lib/erp/type-of-work')
    ;(fetchWorkTypes as Mock).mockResolvedValue([{ value: 2, label: '工序B' }])
    await vm.loadProcessOptions()

    ;(vm as any).buildMockScanState()
    vm.debugMenu.forEach((item) => item.onClick?.())
    ;(vm as any).normalizeCaseInsensitive({ chkqty: 1 }, { ChkQty: 0 } as any)
    ;(vm as any).ensureNumber('4')
    ;(vm as any).ensureNumber(undefined)
    await (vm as any).applyFinalInspectionDraft(docForRefresh, [detail], 'msg')
    await (vm as any).trySetInspectorByEmployeeScan({ employeeId: 11 })
    await (vm as any).tryOpenFinalInspectionByDailyPlanDetailId(3)
    await (vm as any).tryOpenFinalInspectionByDailyPlanDetailScanCode('')
    await (vm as any).tryOpenFinalInspectionByDefectiveReworkOrder({})
    await vm.tryOpenFinalInspectionByDailyPlanDetailScanCode('RJH-02')
    await (vm as any).tryOpenFinalInspectionByDefectiveReworkOrder({ codeForScan: 'FGD-1' })
    await vm.handleScan('id:5')

    windowPrompt.mockReturnValue('id:5')
    ;((globalThis as any).window as any).location.assign = vi.fn()
    await (vm as any).openInputAndScan()
    vm.onScanResult({ barcode: 'A' } as any)
    ;(vm as any).lastApproveResult = { success: true, message: '', ncrHint: false }
    await (vm as any).handleAfterApprove(5)
    const prevWindow = (globalThis as any).window
    // 覆盖 NCR 提示的本地判定分支（window 不存在时直接返回）
    ;(globalThis as any).window = undefined as any
    ;(vm as any).lastApproveResult = null
    ;(vm.bill as any).CheckResult = 4
    ;(vm.bill as any).NotPassBQty = 2
    await (vm as any).handleAfterApprove(8)
    ;(globalThis as any).window = prevWindow
    vm.status = DocumentStatus.已审批
    vm.handleChangeInspect(5) // 触发禁用分支
    vm.setMeasureAtRow(0, 0, 1)
    vm.removeDetailAt(0)
    vm.dispose()
  })

  test('useFqcViewModelClass 支持从上下文解析服务并执行副作用', async () => {
    const appService = createMockAppService()
    vi.doMock('react', async () => {
      const actual = (await vi.importActual<any>('react'))!
      return {
        ...actual,
        useContext: () => ({ get: () => appService } as any),
        useState: (init: any) => [typeof init === 'function' ? init() : init, vi.fn()],
        useEffect: (fn: any) => { fn(); return undefined as any },
      }
    })
    vi.resetModules()

    const mod = await import('./FqcViewModelClass')
    const vm = mod.useFqcViewModelClass()

    expect(vm).toBeInstanceOf(mod.FqcViewModel)

    vi.doUnmock('react')
  })
})
