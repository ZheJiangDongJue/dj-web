import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import type { FirstInspectionApplicationService } from '@/application/quality/fai/FirstInspectionApplicationService'
import { DocumentStatus, FirstInspectionDetail } from '@/types/erp-db.generated'

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
    setLastFaiBillIdToStorage: vi.fn(),
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

describe('FaiViewModelClass', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).window = {}
    delete (globalThis as any).document
    // 清理全局注册表，避免跨测试污染
    delete (globalThis as any).window.__dj_scan_listener_globals__
  })

  afterEach(() => {
    delete (globalThis as any).window
    delete (globalThis as any).document
  })

  function createDetail(projectName: string) {
    const detail = new FirstInspectionDetail()
    detail.initDefaults()
    detail.ProjectName = projectName
    return detail
  }

  test('parseMeasureFrequency 对非法频率和 0 启用全部 5 个实测项', async () => {
    vi.resetModules()
    const { FaiViewModel } = await import('./FaiViewModelClass')
    const vm = new FaiViewModel({} as any)

    expect(vm.parseMeasureFrequency('abc')).toBe(5)
    expect(vm.parseMeasureFrequency('0')).toBe(5)
    expect(vm.parseMeasureFrequency('-1')).toBe(5)
    expect(vm.parseMeasureFrequency('2')).toBe(2)
  })

  test('useFaiViewModelClass 在 Strict Effects 演练中不应清空 bridge', async () => {
    const appService = {
      save: vi.fn(),
      approve: vi.fn(),
      unapprove: vi.fn(),
      delete: vi.fn(),
      fetchById: vi.fn(),
      executeScan: vi.fn(),
      createDraftByDailyPlanDetailId: vi.fn(),
    } as unknown as FirstInspectionApplicationService

    // 模拟 React dev StrictMode 的 Strict Effects：effect 执行 → cleanup → 再执行
    vi.doMock('react', async () => {
      const actual = (await vi.importActual<any>('react'))!
      return {
        ...actual,
        useContext: () => ({ get: () => appService } as any),
        useState: (init: any) => [typeof init === 'function' ? init() : init, vi.fn()],
        useEffect: (fn: any) => {
          const cleanup = fn()
          if (typeof cleanup === 'function') cleanup()
          fn()
          return undefined as any
        },
      }
    })
    vi.resetModules()

    const mod = await import('./FaiViewModelClass')
    const vm = mod.useFaiViewModelClass()

    expect(vm).toBeInstanceOf(mod.FaiViewModel)
    // 若 cleanup 调用了 dispose()，这里会变为 null，导致 handleApprove() 直接失败
    expect((vm as any).bridge).toBeTruthy()

    vi.doUnmock('react')
  })

  test('redirectToNcrPrompt 优先使用 replace，失败时回退到 assign/href', async () => {
    const { FaiViewModel } = await import('./FaiViewModelClass')
    const vm = new FaiViewModel({} as any)
    const replace = vi.fn(() => {
      throw new Error('replace fail')
    })
    const assign = vi.fn(() => {
      throw new Error('assign fail')
    })
    ;(globalThis as any).window = { location: { origin: 'http://localhost', replace, assign, href: '' } }

    ;(vm as any).redirectToNcrPrompt(9)

    expect(replace).toHaveBeenCalled()
    expect(assign).toHaveBeenCalled()
    expect((globalThis as any).window.location.href).toContain('billId=9')
    ;(globalThis as any).window = undefined as any
  })

  test('confirmDailyPlanFlowDetailPick: OPEN_BY_ID 时应关闭弹窗并执行打开分支', async () => {
    vi.resetModules()
    const { toast } = await import('sonner')
    const { FaiViewModel } = await import('./FaiViewModelClass')

    const executeDailyPlanScanCreate = vi.fn(async () => ({ type: 'OPEN_BY_ID', id: 9 }))
    const vm = new FaiViewModel({ executeDailyPlanScanCreate } as any)
    ;(vm as any).pendingDailyPlanFlowDetailPick = { scanCode: 'RJH-001', candidates: [{ flowDetailTableName: 'T', flowDetailId: 1 }] }
    ;(vm as any).applyScanResult = vi.fn(async () => true)

    await vm.confirmDailyPlanFlowDetailPick({ flowDetailTableName: 'ProcessAssemblyFlowDetail', flowDetailId: 11 } as any)

    expect(executeDailyPlanScanCreate).toHaveBeenCalledOnce()
    expect((vm as any).pendingDailyPlanFlowDetailPick).toBeNull()
    expect((vm as any).applyScanResult).toHaveBeenCalledOnce()
    expect((toast.error as any).mock.calls.some((c: any[]) => String(c?.[0] ?? '') === '生成失败，请稍后重试')).toBe(false)
  })

  test('confirmDailyPlanFlowDetailPick: JCJH-* 时应调用 executeExtrusionPlanScanCreate', async () => {
    vi.resetModules()
    const { FaiViewModel } = await import('./FaiViewModelClass')

    const executeDailyPlanScanCreate = vi.fn(async () => ({ type: 'OPEN_BY_ID', id: 9 }))
    const executeExtrusionPlanScanCreate = vi.fn(async () => ({ type: 'OPEN_BY_ID', id: 9 }))
    const vm = new FaiViewModel({ executeDailyPlanScanCreate, executeExtrusionPlanScanCreate } as any)
    ;(vm as any).pendingDailyPlanFlowDetailPick = { scanCode: 'JCJH-202603050001', candidates: [{ flowDetailTableName: 'T', flowDetailId: 1 }] }
    ;(vm as any).applyScanResult = vi.fn(async () => true)

    await vm.confirmDailyPlanFlowDetailPick({ flowDetailTableName: 'ProduceFlowDetail', flowDetailId: 11 } as any)

    expect(executeExtrusionPlanScanCreate).toHaveBeenCalledOnce()
    expect(executeDailyPlanScanCreate).not.toHaveBeenCalled()
    expect((vm as any).pendingDailyPlanFlowDetailPick).toBeNull()
    expect((vm as any).applyScanResult).toHaveBeenCalledOnce()
  })

  test('handleUnapprove 后会回写 bill.Status', async () => {
    vi.resetModules()
    const { FaiViewModel } = await import('./FaiViewModelClass')

    const appService = {
      save: vi.fn(async () => ({ id: 33, aggregate: null })),
      unapprove: vi.fn(async () => ({ success: true, message: '' })),
      fetchById: vi.fn(async () => ({ document: null, details: [] })),
    } as unknown as FirstInspectionApplicationService

    const vm = new FaiViewModel(appService)
    ;(vm.bill as any).Code = 'FAI-001'
    ;(vm.bill as any).DocumentStatus = DocumentStatus.已审批
    await vm.handleSave()
    vm.status = DocumentStatus.已审批
    ;(appService as any).fetchById = vi.fn(async () => ({ document: vm.bill, details: vm.details }))

    const billBefore = vm.bill
    const ok = await vm.handleUnapprove()

    expect(ok).toBe(true)
    expect((vm.bill as any).Status).toBe(DocumentStatus.未审批)
    expect((vm.bill as any).DocumentStatus).toBe(DocumentStatus.未审批)
    expect(appService.unapprove).toHaveBeenCalledWith(33, { bill: billBefore, details: vm.details })
  })

  test('handleApprove 后会同步回写 bill.DocumentStatus', async () => {
    vi.resetModules()
    const { FaiViewModel } = await import('./FaiViewModelClass')

    const appService = {
      save: vi.fn(async () => ({ id: 10, aggregate: null })),
      approve: vi.fn(async () => ({ success: true, message: 'ok', ncrHint: false })),
    } as unknown as FirstInspectionApplicationService

    const vm = new FaiViewModel(appService)
    vm.required.checkEmptyAndFocus = vi.fn(() => ({ hasEmpty: false }))
    ;(vm.bill as any).Code = 'FAI-001'
    ;(vm.bill as any).DocumentStatus = DocumentStatus.未审批
    ;(appService as any).fetchById = vi.fn(async () => ({ document: vm.bill, details: vm.details }))

    const ok = await vm.handleApprove()

    expect(ok).toBe(true)
    expect((vm.bill as any).DocumentStatus).toBe(DocumentStatus.已审批)
  })

  test('handleApprove 触发 NCR 引导时应先收尾 loading 再跳转', async () => {
    vi.resetModules()
    const { toast } = await import('sonner')
    const { FaiViewModel } = await import('./FaiViewModelClass')

    const appService = {
      save: vi.fn(async () => ({ id: 20, aggregate: null })),
      approve: vi.fn(async () => ({ success: true, message: 'ok', ncrHint: true })),
    } as unknown as FirstInspectionApplicationService

    const vm = new FaiViewModel(appService)
    vm.required.checkEmptyAndFocus = vi.fn(() => ({ hasEmpty: false }))
    ;(vm.bill as any).Code = 'FAI-002'
    ;(vm.bill as any).DocumentStatus = DocumentStatus.未审批
    ;(vm.bill as any).CheckResult = 4
    ;(vm.bill as any).NotPassBQty = 1
    const assignMock = vi.fn()
    ;(globalThis as any).window = { location: { origin: 'http://localhost', assign: assignMock } }

    const ok = await vm.handleApprove()

    expect(ok).toBe(true)
    expect((vm.bill as any).DocumentStatus).toBe(DocumentStatus.已审批)
    expect((toast.dismiss as any).mock.invocationCallOrder[0]).toBeLessThan((assignMock as any).mock.invocationCallOrder[0])
    expect(assignMock).toHaveBeenCalledWith(expect.stringContaining('billId=20'))
  })

  test('删除中间明细后审批不应把已删除明细带回保存快照', async () => {
    vi.resetModules()
    const { FaiViewModel } = await import('./FaiViewModelClass')

    const save = vi.fn(async (_payload: any) => ({ id: 88, aggregate: null }))
    const approve = vi.fn(async () => ({ success: true, message: 'ok', ncrHint: false }))
    const appService = {
      save,
      approve,
      unapprove: vi.fn(),
      delete: vi.fn(),
      fetchById: vi.fn(),
      executeScan: vi.fn(),
      createDraftByDailyPlanDetailId: vi.fn(),
    } as unknown as FirstInspectionApplicationService

    const vm = new FaiViewModel(appService)
    vm.required.checkEmptyAndFocus = vi.fn(() => ({ hasEmpty: false, emptyKeys: [] }))
    ;(appService as any).fetchById = vi.fn(async () => ({ document: vm.bill, details: vm.details }))
    ;(vm.bill as any).Code = 'FAI-DEL-001'
    ;(vm.bill as any).DocumentStatus = DocumentStatus.未审批
    vm.details = [createDetail('保留A'), createDetail('删除B'), createDetail('保留C')] as any

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

  test('新建态修改表头或明细后应触发离开保护，重新新建后清除保护', async () => {
    vi.resetModules()
    const { FaiViewModel } = await import('./FaiViewModelClass')
    const vm = new FaiViewModel({} as any)

    expect(vm.hasDocumentData).toBe(false)
    expect(vm.shouldConfirmLeave).toBe(false)

    vm.setBill('Employeeid', 7)
    expect(vm.shouldConfirmLeave).toBe(true)

    vm.createNewBill()
    const detail = createDetail('尺寸A')
    vm.details = [detail as any]
    vm.setMeasureByDetailKey(vm.getDetailKey(detail), 0, '10')
    expect(vm.shouldConfirmLeave).toBe(true)

    vm.createNewBill()
    expect(vm.hasDocumentData).toBe(false)
    expect(vm.shouldConfirmLeave).toBe(false)
  })

  test('processScanCode 在草稿未携带 id 时不应沿用旧单据 id 回刷', async () => {
    vi.resetModules()
    const { FaiViewModel } = await import('./FaiViewModelClass')

    const appService = {
      save: vi.fn(),
      approve: vi.fn(),
      unapprove: vi.fn(),
      delete: vi.fn(),
      fetchById: vi.fn(),
      executeScan: vi.fn(async () => ({
        type: 'DRAFT_LOADED',
        document: { id: 0 } as any,
        details: [{} as any],
        message: 'ok',
      })),
      createDraftByDailyPlanDetailId: vi.fn(),
    } as unknown as FirstInspectionApplicationService

    const vm = new FaiViewModel(appService)
    ;(vm as any).bridge.docActions.setId(11)
    const refreshSpy = vi.spyOn(vm, 'refresh').mockResolvedValue(undefined)

    await vm.processScanCode('RJH-001')

    expect(refreshSpy).not.toHaveBeenCalled()
    expect((vm as any).bridge.docActions.state.id).not.toBe(11)
  })

  test('processScanCode：扫码设置检验员时 toast 文案应兜底不为空（name 小写场景）', async () => {
    vi.resetModules()
    const { toast } = await import('sonner')
    const { fetchLookup } = await import('@/lib/erp/lookup-core')
    const { FaiViewModel } = await import('./FaiViewModelClass')

    ;(fetchLookup as any).mockResolvedValue([{ id: 9, Name: '', name: '检验员小写字段', CodeForScan: 'ZY-01' }])

    const appService = {
      save: vi.fn(),
      approve: vi.fn(),
      unapprove: vi.fn(),
      delete: vi.fn(),
      fetchById: vi.fn(),
      executeScan: vi.fn(async () => ({ type: 'SET_INSPECTOR', code: 'ZY-01' })),
      createDraftByDailyPlanDetailId: vi.fn(),
    } as unknown as FirstInspectionApplicationService

    const vm = new FaiViewModel(appService)

    await vm.processScanCode('ZY-01')

    expect((appService as any).executeScan).toHaveBeenCalledWith('ZY-01')
    expect(((vm.bill as any).Employeeid)).toBe(9)
    expect((toast.success as any).mock.calls.length).toBeGreaterThan(0)
    const msg = String((toast.success as any).mock.calls?.[0]?.[0] ?? '')
    expect(msg).toContain('已设置检验员：')
    expect(msg.trim().endsWith('：')).toBe(false)
  })
})
