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
    expect(executeExtrusionPlanScanCreate).toHaveBeenCalledWith(
      'JCJH-202603050001',
      expect.objectContaining({
        pickedFlowDetail: { tableName: 'ProduceFlowDetail', id: 11 },
      }),
    )
    expect(executeDailyPlanScanCreate).not.toHaveBeenCalled()
    expect((vm as any).pendingDailyPlanFlowDetailPick).toBeNull()
  })

  test('返工工序切换：按当前来源工序重拉并保留返工工序', async () => {
    const { fetchWorkTypes } = await import('@/lib/erp/type-of-work')
    const { fetchLookup } = await import('@/lib/erp/lookup-core')
    const { NcrViewModel } = await import('./NcrViewModelClass')

    ;(fetchWorkTypes as any).mockResolvedValue([])
    ;(fetchLookup as any).mockResolvedValue([])

    const reloadDraftByFlowDetail = vi.fn(async () => ({
      type: 'DRAFT_LOADED',
      document: {
        id: 0,
        Code: 'DRAFT-FLOW-11',
        CreateByDetailType: 'ProcessAssemblyFlowDetail',
        CreateByDetailid: 11,
        ReworkTypeofWorkid: 11,
        ReworkTypeofWork2id: 0,
        status: 0,
      },
      details: [],
      checkDetails: [],
      sourceFlowDetailType: 'ProcessAssemblyFlowDetail',
      sourceFlowDetailId: 11,
      message: 'ok',
    }))

    const vm = new NcrViewModel({
      delete: vi.fn(async () => ({ success: true, message: '' })),
      fetchById: vi.fn(async () => ({ document: null, details: [] })),
      reloadDraftByFlowDetail,
    } as any)

    await (vm as any).applyDraftLoadedResult({
      type: 'DRAFT_LOADED',
      document: {
        id: 0,
        Code: 'DRAFT-FLOW-OLD',
        CreateByDetailType: 'ProcessAssemblyFlowDetail',
        CreateByDetailid: 11,
        ReworkTypeofWorkid: 11,
        ReworkTypeofWork2id: 0,
        status: 0,
      },
      details: [],
      checkDetails: [],
      sourceFlowDetailType: 'ProcessAssemblyFlowDetail',
      sourceFlowDetailId: 11,
      message: 'ok',
    })

    ;(vm.bill as any).Employeeid = 7
    ;(vm.bill as any).ReworkTypeofWorkid = 77
    ;(vm.bill as any).ReworkTypeofWork2id = 88
    vm.badProcessOptions = [
      { label: '工序A', value: '11', flowDetailTableName: 'ProcessAssemblyFlowDetail' },
    ]

    await (vm as any).reloadSourceByReworkFlowDetailChange(11)

    expect(reloadDraftByFlowDetail).toHaveBeenCalledOnce()
    expect(reloadDraftByFlowDetail).toHaveBeenCalledWith({
      flowDetailTableName: 'ProcessAssemblyFlowDetail',
      flowDetailId: 11,
      inspectorEmployeeId: 7,
    })
    expect((vm.bill as any).ReworkTypeofWorkid).toBe(77)
    expect((vm.bill as any).ReworkTypeofWork2id).toBe(88)
  })

  test('返工工序切换：按新工序重新刷新来源草稿', async () => {
    const { fetchWorkTypes } = await import('@/lib/erp/type-of-work')
    const { fetchLookup } = await import('@/lib/erp/lookup-core')
    const { NcrViewModel } = await import('./NcrViewModelClass')

    ;(fetchWorkTypes as any).mockResolvedValue([])
    ;(fetchLookup as any).mockResolvedValue([])

    const reloadDraftByFlowDetail = vi.fn()
      .mockResolvedValueOnce({
        type: 'DRAFT_LOADED',
        document: {
          id: 0,
          Code: 'DRAFT-FLOW-22',
          CreateByDetailType: 'ProcessAssemblyFlowDetail',
          CreateByDetailid: 22,
          ReworkTypeofWorkid: 22,
          ReworkTypeofWork2id: 0,
          status: 0,
        },
        details: [],
        checkDetails: [],
        sourceFlowDetailType: 'ProcessAssemblyFlowDetail',
        sourceFlowDetailId: 22,
        message: 'ok',
      })

    const vm = new NcrViewModel({
      delete: vi.fn(async () => ({ success: true, message: '' })),
      fetchById: vi.fn(async () => ({ document: null, details: [] })),
      reloadDraftByFlowDetail,
    } as any)

    await (vm as any).applyDraftLoadedResult({
      type: 'DRAFT_LOADED',
      document: {
        id: 0,
        Code: 'DRAFT-FLOW-11',
        CreateByDetailType: 'ProcessAssemblyFlowDetail',
        CreateByDetailid: 11,
        ReworkTypeofWorkid: 11,
        ReworkTypeofWork2id: 0,
        status: 0,
      },
      details: [],
      checkDetails: [],
      sourceFlowDetailType: 'ProcessAssemblyFlowDetail',
      sourceFlowDetailId: 11,
      message: 'ok',
    })

    vm.badProcessOptions = [
      { label: '工序A', value: '11', flowDetailTableName: 'ProcessAssemblyFlowDetail' },
      { label: '工序B', value: '22', flowDetailTableName: 'ProcessAssemblyFlowDetail' },
    ]
    ;(vm.bill as any).Employeeid = 7

    await vm.handleReworkFlowDetailChange('ReworkTypeofWorkid', '22')

    expect(reloadDraftByFlowDetail).toHaveBeenCalledOnce()
    expect(reloadDraftByFlowDetail).toHaveBeenCalledWith({
      flowDetailTableName: 'ProcessAssemblyFlowDetail',
      flowDetailId: 22,
      inspectorEmployeeId: 7,
    })
    expect((vm.bill as any).ReworkTypeofWorkid).toBe(22)
  })
})
