import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/lib/android-bridge', () => ({
  scanQRCode: vi.fn(),
  addScanListener: vi.fn(() => () => {}),
  runAfterAndroidAppResumed: (fn: () => void) => fn(),
}))

vi.mock('@/lib/erp/employee', () => ({
  fetchActiveEmployees: vi.fn(),
}))

vi.mock('@/lib/erp/type-of-work', () => ({
  fetchWorkTypes: vi.fn(),
}))

vi.mock('@/lib/erp/lookup-core', () => ({
  fetchLookup: vi.fn(),
  toOptions: (list: any[]) => list,
}))

describe('NcrViewModelClass', () => {
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

  test('confirmDailyPlanFlowDetailPick: JCJH-* 时应调用 executeExtrusionPlanScanCreate', async () => {
    const { NcrViewModel } = await import('./NcrViewModelClass')

    const executeDailyPlanScanCreate = vi.fn(async () => ({ type: 'OPEN_BY_ID', id: 9 }))
    const executeExtrusionPlanScanCreate = vi.fn(async () => ({ type: 'OPEN_BY_ID', id: 9 }))

    const vm = new NcrViewModel({
      delete: vi.fn(async () => ({ success: true, message: '' })),
      fetchById: vi.fn(async () => ({ document: null, details: [] })),
      executeDailyPlanScanCreate,
      executeExtrusionPlanScanCreate,
    } as any)

    ;(vm.bill as any).Employeeid = 7
    ;(vm as any).pendingDailyPlanFlowDetailPick = { scanCode: 'JCJH-202603050001', candidates: [{ flowDetailTableName: 'T', flowDetailId: 1 }] }
    ;(vm as any).openById = vi.fn(async () => true)
    ;(vm as any).createNewBill = vi.fn()
    ;(vm as any).getCurrentBillId = vi.fn(() => null)

    await vm.confirmDailyPlanFlowDetailPick({ flowDetailTableName: 'ProduceFlowDetail', flowDetailId: 11 } as any)

    expect(executeExtrusionPlanScanCreate).toHaveBeenCalledOnce()
    expect(executeDailyPlanScanCreate).not.toHaveBeenCalled()
    expect((vm as any).pendingDailyPlanFlowDetailPick).toBeNull()
  })
})

