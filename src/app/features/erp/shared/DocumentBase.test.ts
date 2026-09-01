import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import {
  areDocumentMutationTimestampsEqual,
  DocumentBase,
  shouldReopenDocumentAfterRejectedMutation,
} from './DocumentBase'
import { createDocumentActions } from '@/lib/documents/DocumentActionsStore'
import { registerDocumentRefreshConfirmationHandler } from '@/lib/documents/document-refresh-confirmation'

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(() => 'loading-id'),
    dismiss: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

function createBaseForTest(options: {
  document?: Record<string, unknown>
  details?: unknown[]
  status?: number
  refreshAfterApprove?: boolean
  refreshAfterUnapprove?: boolean
  actionOptions?: Parameters<typeof createDocumentActions>[0]
  service?: Record<string, any>
} = {}) {
  let document: Record<string, unknown> = options.document ?? {}
  let details: unknown[] = options.details ?? []
  let status = options.status ?? 0
  const actions = createDocumentActions(options.actionOptions)
  const base = new DocumentBase<Record<string, unknown>, unknown>({
    service: options.service ?? {},
    createEmptyDocument: () => ({}),
    createInitialDetails: () => [],
    deriveStatus: () => 0,
    hasStatusFlag: () => false,
    statusFlagConfig: {
      frozen: 1,
      closed: 2,
      voided: 4,
      approved: 8,
      unapproved: 16,
    },
    refreshAfterApprove: options.refreshAfterApprove ?? false,
    refreshAfterUnapprove: options.refreshAfterUnapprove ?? false,
    initialId: null,
  } as any)

  base.bindBridge({
    getDocument: () => document,
    setDocument: (next) => { document = next },
    getDetails: () => details,
    setDetails: (next) => { details = next },
    getStatus: () => status,
    getStatusRef: () => status,
    setStatus: (next) => { status = Number(next) },
    docActions: actions,
  })

  return {
    base,
    actions,
    getDocument: () => document,
    getDetails: () => details,
  }
}

describe('DocumentBase 写入前时间戳校验', () => {
  let unregisterConfirm: (() => void) | null = null

  afterEach(() => {
    unregisterConfirm?.()
    unregisterConfirm = null
    vi.clearAllMocks()
  })

  it('可解析为同一时刻的更新时间与审批时间视为一致', () => {
    expect(areDocumentMutationTimestampsEqual(
      { UpdateTime: '2026-01-01T08:00:00.000Z', ApprovalTime: null },
      { updateTime: '2026-01-01T08:00:00Z', approvalTime: '' },
    )).toBe(true)
  })

  it('只将明确的状态同步失败文案识别为需要重新打开单据', () => {
    expect(shouldReopenDocumentAfterRejectedMutation('当前单据已经是审批状态了\n\n(可能因为网络问题让你这边状态没有同步)')).toBe(true)
    expect(shouldReopenDocumentAfterRejectedMutation('第1行仓库为空,无法保存')).toBe(false)
  })

  it('已有 ID 的单据保存前会先获取数据库最新时间戳，一致时继续保存', async () => {
    const callSave = vi.fn(async () => ({ id: 7 }))
    const fetchById = vi.fn(async () => ({
      document: { id: 7, UpdateTime: '2026-01-01T08:00:00.000Z', ApprovalTime: null },
      details: [],
    }))
    const { base, actions } = createBaseForTest({
      document: { id: 7, UpdateTime: '2026-01-01T08:00:00Z', ApprovalTime: null },
      actionOptions: { callSave },
      service: {
        fetchById,
        extractId: (result: any) => result?.id,
      },
    })
    actions.setId(7)

    await expect(base.handleSave()).resolves.toBe(7)

    expect(fetchById).toHaveBeenCalledWith(7)
    expect(callSave).toHaveBeenCalledOnce()
    expect(toast.warning).not.toHaveBeenCalled()
  })

  it('保存前发现更新时间不一致时阻断保存并重新打开最新单据', async () => {
    unregisterConfirm = registerDocumentRefreshConfirmationHandler(() => true)
    const callSave = vi.fn(async () => ({ id: 7 }))
    const latest = { id: 7, Code: 'NEW', UpdateTime: '2026-01-01T09:00:00Z', ApprovalTime: null }
    const fetchById = vi.fn(async () => ({ document: latest, details: [{ id: 1 }] }))
    const { base, actions, getDocument, getDetails } = createBaseForTest({
      document: { id: 7, Code: 'OLD', UpdateTime: '2026-01-01T08:00:00Z', ApprovalTime: null },
      actionOptions: { callSave },
      service: {
        fetchById,
        extractId: (result: any) => result?.id,
      },
    })
    actions.setId(7)

    await expect(base.handleSave()).resolves.toBeNull()

    expect(callSave).not.toHaveBeenCalled()
    expect(getDocument()).toEqual(latest)
    expect(getDetails()).toEqual([{ id: 1 }])
    expect(toast.warning).toHaveBeenCalledWith('已更新到数据库最新单据，请确认后再保存')
  })

  it('保存前发现更新时间不一致但用户取消时不更新页面数据', async () => {
    unregisterConfirm = registerDocumentRefreshConfirmationHandler(() => false)
    const callSave = vi.fn(async () => ({ id: 7 }))
    const latest = { id: 7, Code: 'NEW', UpdateTime: '2026-01-01T09:00:00Z', ApprovalTime: null }
    const original = { id: 7, Code: 'OLD', UpdateTime: '2026-01-01T08:00:00Z', ApprovalTime: null }
    const fetchById = vi.fn(async () => ({ document: latest, details: [{ id: 1 }] }))
    const { base, actions, getDocument, getDetails } = createBaseForTest({
      document: original,
      details: [],
      actionOptions: { callSave },
      service: {
        fetchById,
        extractId: (result: any) => result?.id,
      },
    })
    actions.setId(7)

    await expect(base.handleSave()).resolves.toBeNull()

    expect(callSave).not.toHaveBeenCalled()
    expect(getDocument()).toEqual(original)
    expect(getDetails()).toEqual([])
    expect(toast.warning).toHaveBeenCalledWith('保存未执行，当前页面仍保留原单据数据')
  })

  it('保存被后端已审批状态拒绝时会重新打开数据库最新单据', async () => {
    unregisterConfirm = registerDocumentRefreshConfirmationHandler(() => true)
    const callSave = vi.fn(async () => ({
      id: null,
      message: '当前单据已经是审批状态了\n\n(可能因为网络问题让你这边状态没有同步)',
    }))
    const latest = {
      id: 7,
      Code: 'APPROVED',
      Status: 1,
      UpdateTime: '2026-01-01T08:00:00Z',
      ApprovalTime: '2026-01-01T09:00:00Z',
    }
    const fetchById = vi
      .fn()
      .mockResolvedValueOnce({
        document: { id: 7, Code: 'OLD', Status: 0, UpdateTime: '2026-01-01T08:00:00Z', ApprovalTime: null },
        details: [],
      })
      .mockResolvedValueOnce({ document: latest, details: [{ id: 2 }] })
    const { base, actions, getDocument, getDetails } = createBaseForTest({
      document: { id: 7, Code: 'OLD', Status: 0, UpdateTime: '2026-01-01T08:00:00Z', ApprovalTime: null },
      actionOptions: { callSave },
      service: {
        fetchById,
        extractId: (result: any) => result?.id,
      },
    })
    actions.setId(7)

    await expect(base.handleSave()).resolves.toBeNull()

    expect(callSave).toHaveBeenCalledOnce()
    expect(fetchById).toHaveBeenCalledTimes(2)
    expect(getDocument()).toEqual(latest)
    expect(getDetails()).toEqual([{ id: 2 }])
    expect(toast.warning).toHaveBeenCalledWith('保存未执行，已更新到数据库最新单据，请确认后重试')
  })

  it('反审批前发现审批时间不一致时阻断反审批', async () => {
    unregisterConfirm = registerDocumentRefreshConfirmationHandler(() => true)
    const callUnapprove = vi.fn(async () => ({ success: true }))
    const latest = { id: 9, UpdateTime: '2026-01-01T08:00:00Z', ApprovalTime: '2026-01-01T09:00:00Z' }
    const fetchById = vi.fn(async () => ({ document: latest, details: [] }))
    const { base, actions, getDocument } = createBaseForTest({
      document: { id: 9, UpdateTime: '2026-01-01T08:00:00Z', ApprovalTime: '2026-01-01T08:30:00Z' },
      actionOptions: { callUnapprove },
      service: {
        fetchById,
        extractId: () => 9,
      },
    })
    actions.setId(9)

    await expect(base.handleUnapprove()).resolves.toBe(false)

    expect(callUnapprove).not.toHaveBeenCalled()
    expect(getDocument()).toEqual(latest)
    expect(toast.warning).toHaveBeenCalledWith('已更新到数据库最新单据，请确认后再反审批')
  })

  it('页面仍为已审批但服务端已反审批时，即使时间戳相同也确认更新并阻断反审批', async () => {
    // 模拟其他设备只切换审批状态，接口返回的更新时间和审批时间没有可检测变化。
    const confirmRefresh = vi.fn(() => true)
    unregisterConfirm = registerDocumentRefreshConfirmationHandler(confirmRefresh)
    const callUnapprove = vi.fn(async () => ({ success: true }))
    const latest = {
      id: 12,
      Status: 0,
      UpdateTime: '2026-01-01T08:00:00Z',
      ApprovalTime: '2026-01-01T09:00:00Z',
    }
    const fetchById = vi.fn(async () => ({ document: latest, details: [{ id: 3 }] }))
    const { base, actions, getDocument, getDetails } = createBaseForTest({
      document: {
        id: 12,
        Status: 1,
        UpdateTime: '2026-01-01T08:00:00Z',
        ApprovalTime: '2026-01-01T09:00:00Z',
      },
      status: 8,
      actionOptions: { callUnapprove },
      service: {
        fetchById,
        extractId: () => 12,
      },
    })
    actions.setId(12)

    await expect(base.handleUnapprove()).resolves.toBe(false)

    expect(fetchById).toHaveBeenCalledWith(12)
    expect(confirmRefresh).toHaveBeenCalledWith({ actionName: '反审批', reason: 'precheck' })
    expect(callUnapprove).not.toHaveBeenCalled()
    expect(getDocument()).toEqual(latest)
    expect(getDetails()).toEqual([{ id: 3 }])
    expect(toast.warning).toHaveBeenCalledWith('已更新到数据库最新单据，请确认后再反审批')
  })

  it('反审批接口返回状态冲突时确认更新最新未审批单据，不仅提示原始错误', async () => {
    // 模拟前置查询仍返回旧的已审批快照，反审批请求期间才发现其他设备已经完成反审批。
    const confirmRefresh = vi.fn(() => true)
    unregisterConfirm = registerDocumentRefreshConfirmationHandler(confirmRefresh)
    const callUnapprove = vi.fn(async () => ({
      success: false,
      message: '当前[xxx]的单据状态不允许反审批!',
    }))
    const current = {
      id: 13,
      Status: 1,
      UpdateTime: '2026-01-01T08:00:00Z',
      ApprovalTime: '2026-01-01T09:00:00Z',
    }
    const latest = {
      id: 13,
      Status: 0,
      UpdateTime: '2026-01-01T08:00:00Z',
      ApprovalTime: '2026-01-01T09:00:00Z',
    }
    const fetchById = vi
      .fn()
      .mockResolvedValueOnce({ document: current, details: [] })
      .mockResolvedValueOnce({ document: latest, details: [{ id: 4 }] })
    const { base, actions, getDocument, getDetails } = createBaseForTest({
      document: current,
      status: 8,
      actionOptions: { callUnapprove },
      service: {
        fetchById,
        extractId: () => 13,
      },
    })
    actions.setId(13)

    await expect(base.handleUnapprove()).resolves.toBe(false)

    expect(callUnapprove).toHaveBeenCalledOnce()
    expect(fetchById).toHaveBeenCalledTimes(2)
    expect(confirmRefresh).toHaveBeenCalledWith({ actionName: '反审批', reason: 'rejected' })
    expect(getDocument()).toEqual(latest)
    expect(getDetails()).toEqual([{ id: 4 }])
    expect(toast.warning).toHaveBeenCalledWith('反审批未执行，已更新到数据库最新单据，请确认后重试')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('成功审批后同步最新版本，随后反审批不因自身 ApprovalTime 变化触发确认', async () => {
    const confirmRefresh = vi.fn(() => true)
    unregisterConfirm = registerDocumentRefreshConfirmationHandler(confirmRefresh)
    const callSave = vi.fn(async () => ({ id: 21 }))
    const callApprove = vi.fn(async () => ({ success: true }))
    const callUnapprove = vi.fn(async () => ({ success: true }))
    const draft = {
      id: 21,
      UpdateTime: '2026-01-01T08:00:00Z',
      ApprovalTime: null,
    }
    const approved = {
      id: 21,
      Status: 1,
      UpdateTime: '2026-01-01T09:00:00Z',
      ApprovalTime: '2026-01-01T09:00:00Z',
    }
    const unapproved = {
      id: 21,
      Status: 0,
      UpdateTime: '2026-01-01T10:00:00Z',
      ApprovalTime: null,
    }
    const fetchById = vi
      .fn()
      .mockResolvedValueOnce({ document: draft, details: [] })
      .mockResolvedValueOnce({ document: draft, details: [] })
      .mockResolvedValueOnce({ document: approved, details: [{ id: 1 }] })
      .mockResolvedValueOnce({ document: approved, details: [{ id: 1 }] })
      .mockResolvedValueOnce({ document: unapproved, details: [{ id: 1 }] })
    const { base, actions, getDocument } = createBaseForTest({
      document: draft,
      actionOptions: { callSave, callApprove, callUnapprove },
      refreshAfterApprove: true,
      refreshAfterUnapprove: true,
      service: {
        fetchById,
        extractId: (result: any) => result?.id,
      },
    })
    actions.setId(21)

    await expect(base.handleApprove()).resolves.toBe(true)

    expect(getDocument()).toEqual(approved)
    expect(base.shouldConfirmLeave).toBe(false)
    await expect(base.handleUnapprove()).resolves.toBe(true)

    expect(callSave).toHaveBeenCalledOnce()
    expect(callApprove).toHaveBeenCalledWith(21)
    expect(callUnapprove).toHaveBeenCalledWith(21)
    expect(fetchById).toHaveBeenCalledTimes(5)
    expect(confirmRefresh).not.toHaveBeenCalled()
    expect(getDocument()).toEqual(unapproved)
    expect(base.shouldConfirmLeave).toBe(false)
  })

  it('成功反审批后同步最新版本，随后审批不因自身 ApprovalTime 变化触发确认', async () => {
    const confirmRefresh = vi.fn(() => true)
    unregisterConfirm = registerDocumentRefreshConfirmationHandler(confirmRefresh)
    const callSave = vi.fn(async () => ({ id: 22 }))
    const callApprove = vi.fn(async () => ({ success: true }))
    const callUnapprove = vi.fn(async () => ({ success: true }))
    const approved = {
      id: 22,
      Status: 1,
      UpdateTime: '2026-01-01T09:00:00Z',
      ApprovalTime: '2026-01-01T09:00:00Z',
    }
    const unapproved = {
      id: 22,
      Status: 0,
      UpdateTime: '2026-01-01T10:00:00Z',
      ApprovalTime: null,
    }
    const approvedAgain = {
      id: 22,
      Status: 1,
      UpdateTime: '2026-01-01T11:00:00Z',
      ApprovalTime: '2026-01-01T11:00:00Z',
    }
    const fetchById = vi
      .fn()
      .mockResolvedValueOnce({ document: approved, details: [{ id: 1 }] })
      .mockResolvedValueOnce({ document: unapproved, details: [{ id: 1 }] })
      .mockResolvedValueOnce({ document: unapproved, details: [{ id: 1 }] })
      .mockResolvedValueOnce({ document: unapproved, details: [{ id: 1 }] })
      .mockResolvedValueOnce({ document: approvedAgain, details: [{ id: 1 }] })
    const { base, actions, getDocument } = createBaseForTest({
      document: approved,
      actionOptions: { callSave, callApprove, callUnapprove },
      refreshAfterApprove: true,
      refreshAfterUnapprove: true,
      service: {
        fetchById,
        extractId: (result: any) => result?.id,
      },
    })
    actions.setId(22)

    await expect(base.handleUnapprove()).resolves.toBe(true)

    expect(getDocument()).toEqual(unapproved)
    await expect(base.handleApprove()).resolves.toBe(true)

    expect(callUnapprove).toHaveBeenCalledWith(22)
    expect(callSave).toHaveBeenCalledOnce()
    expect(callApprove).toHaveBeenCalledWith(22)
    expect(fetchById).toHaveBeenCalledTimes(5)
    expect(confirmRefresh).not.toHaveBeenCalled()
    expect(getDocument()).toEqual(approvedAgain)
  })

  it('删除前发现更新时间不一致时阻断删除', async () => {
    unregisterConfirm = registerDocumentRefreshConfirmationHandler(() => true)
    const remove = vi.fn(async () => ({ success: true }))
    const latest = { id: 11, UpdateTime: '2026-01-01T10:00:00Z', ApprovalTime: null }
    const fetchById = vi.fn(async () => ({ document: latest, details: [] }))
    const { base, actions, getDocument } = createBaseForTest({
      document: { id: 11, UpdateTime: '2026-01-01T09:00:00Z', ApprovalTime: null },
      service: {
        fetchById,
        remove,
        extractId: () => 11,
      },
    })
    actions.setId(11)

    await expect(base.handleDelete()).resolves.toBe(false)

    expect(remove).not.toHaveBeenCalled()
    expect(getDocument()).toEqual(latest)
    expect(toast.warning).toHaveBeenCalledWith('已更新到数据库最新单据，请确认后再删除')
  })
})

describe('DocumentBase.runBusyAction', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('动作超时时会释放 actionBusy、底层 loading 与 loading toast', async () => {
    vi.useFakeTimers()
    const { base, actions } = createBaseForTest()

    const pending = base.runBusyAction(
      '审批',
      () => {
        actions.setLoading(true)
        return new Promise<boolean>(() => undefined)
      },
      { timeoutMs: 100 },
    )

    expect(base.actionBusy).toBe(true)
    expect(actions.state.loading).toBe(true)

    await vi.advanceTimersByTimeAsync(100)
    await expect(pending).resolves.toBeUndefined()

    expect(base.actionBusy).toBe(false)
    expect(base.busyActionName).toBeNull()
    expect(actions.state.loading).toBe(false)
    expect(toast.dismiss).toHaveBeenCalledWith('loading-id')
    expect(toast.error).toHaveBeenCalledWith('审批处理超时，请刷新单据确认服务端状态后重试')
  })

  it('同步完成的动作不会显示 loading toast', async () => {
    const { base, actions } = createBaseForTest()

    const result = await base.runBusyAction('保存', async () => {
      actions.setLoading(true)
      return 42
    })

    expect(result).toBe(42)
    expect(base.actionBusy).toBe(false)
    expect(actions.state.loading).toBe(false)
    expect(toast.loading).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('异步耗时动作会显示并关闭 loading toast', async () => {
    vi.useFakeTimers()
    const { base, actions } = createBaseForTest()

    const pending = base.runBusyAction('保存', async () => {
      actions.setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 50))
      return 42
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(toast.loading).toHaveBeenCalledWith('保存中…', expect.objectContaining({ id: expect.any(String) }))

    await vi.advanceTimersByTimeAsync(50)
    await expect(pending).resolves.toBe(42)

    expect(base.actionBusy).toBe(false)
    expect(actions.state.loading).toBe(false)
    expect(toast.dismiss).toHaveBeenCalledWith('loading-id')
    expect(toast.error).not.toHaveBeenCalled()
  })
})
