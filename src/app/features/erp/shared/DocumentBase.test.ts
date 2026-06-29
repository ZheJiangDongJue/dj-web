import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { DocumentBase } from './DocumentBase'
import { createDocumentActions } from '@/lib/documents/DocumentActionsStore'

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(() => 'loading-id'),
    dismiss: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

function createBaseForTest() {
  let document: Record<string, unknown> = {}
  let details: unknown[] = []
  let status = 0
  const actions = createDocumentActions()
  const base = new DocumentBase<Record<string, unknown>, unknown>({
    service: {},
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

  return { base, actions }
}

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
