import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import type { FirstInspectionApplicationService } from '@/application/quality/fai/FirstInspectionApplicationService'
import { DocumentStatus } from '@/types/erp-db.generated'

vi.mock('sonner', () => ({
  toast: {
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
    } as unknown as FirstInspectionApplicationService

    const vm = new FaiViewModel(appService)
    ;(vm.bill as any).Code = 'FAI-001'
    ;(vm.bill as any).DocumentStatus = DocumentStatus.已审批
    await vm.handleSave()
    vm.status = DocumentStatus.已审批

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
})
