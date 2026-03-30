import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { DocumentBase, type NormalizedDocumentBaseOptions } from './DocumentBase'
import { addScanListener } from '@/lib/android-bridge'

const pendingAfterResumed: Array<() => void> = []

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('@/lib/erp/bill-api', () => ({
  BillApi: {},
}))

vi.mock('@/lib/android-bridge', () => ({
  addScanListener: vi.fn(),
  runAfterAndroidAppResumed: (fn: () => void) => {
    pendingAfterResumed.push(fn)
  },
}))

type AnyDoc = Record<string, unknown>
type AnyDetail = Record<string, unknown>

function createOptions(): NormalizedDocumentBaseOptions<AnyDoc, AnyDetail> {
  return {
    service: {
      save: async () => ({}),
      approve: async () => ({}),
      unapprove: async () => ({}),
      extractId: () => 0,
    },
    createEmptyDocument: () => ({}),
    createInitialDetails: () => [],
    deriveStatus: () => 0,
    hasStatusFlag: () => false,
    statusFlagConfig: {},
    autoRefreshAfterSave: false,
    refreshAfterApprove: false,
    refreshAfterUnapprove: false,
    initialId: null,
  }
}

function bindForScan(doc: DocumentBase<AnyDoc, AnyDetail>) {
  doc.bindBridge({
    getDocument: () => ({}),
    getDetails: () => [],
    getStatus: () => 0,
    getStatusRef: () => 0,
    setDocument: () => void 0,
    setDetails: () => void 0,
    setStatus: () => void 0,
    docActions: {} as any,
  })
  doc.activateScanListener()
}

describe('DocumentBase 扫码监听：延迟队列路由到最新实例', () => {
  const handlers: Array<(payload: any) => void> = []
  const disposer1 = vi.fn()
  const disposer2 = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    handlers.length = 0
    pendingAfterResumed.length = 0

    ;(globalThis as any).window = { setTimeout }
    delete (globalThis as any).document
    delete (globalThis as any).window.__dj_scan_listener_globals__

    ;(addScanListener as any)
      .mockImplementationOnce((cb: any) => {
        handlers.push(cb)
        return disposer1
      })
      .mockImplementationOnce((cb: any) => {
        handlers.push(cb)
        return disposer2
      })
  })

  afterEach(() => {
    vi.useRealTimers()
    delete (globalThis as any).window
    delete (globalThis as any).document
  })

  it('扫码回调被延迟执行时，会路由到同 key 的最新实例（避免旧实例 toast 但 UI 不刷新）', () => {
    class PageADoc extends DocumentBase<AnyDoc, AnyDetail> {
      public received: any[] = []
      protected override onScanResult(payload: any): void {
        this.received.push(payload)
      }
    }

    const a1 = new PageADoc(createOptions())
    bindForScan(a1)

    // 扫码事件先进入旧实例监听器，但 runAfterAndroidAppResumed 仅入队，不立即执行
    handlers[0]({ barcode: 'RJH-001' })
    expect(pendingAfterResumed.length).toBe(1)

    // 页面/VM 重建：新实例接管 active handler（同 key）
    const a2 = new PageADoc(createOptions())
    bindForScan(a2)

    // 恢复后执行队列：应路由到最新实例
    pendingAfterResumed.shift()?.()
    expect(a1.received.length).toBe(0)
    expect(a2.received).toEqual([{ barcode: 'RJH-001' }])
  })

  it('恢复时若无 active handler，会暂存并在新实例绑定后补发', () => {
    class PageADoc extends DocumentBase<AnyDoc, AnyDetail> {
      public received: any[] = []
      protected override onScanResult(payload: any): void {
        this.received.push(payload)
      }
    }

    const a1 = new PageADoc(createOptions())
    bindForScan(a1)

    handlers[0]({ barcode: 'RJH-002' })
    expect(pendingAfterResumed.length).toBe(1)

    // 旧实例销毁（active handler 清理）
    a1.dispose()

    // 恢复执行队列：由于没有 active handler，会进入暂存队列
    pendingAfterResumed.shift()?.()
    expect(a1.received.length).toBe(0)

    // 新实例绑定后会自动补发（setTimeout(0)）
    const a2 = new PageADoc(createOptions())
    bindForScan(a2)
    vi.runAllTimers()

    expect(a2.received).toEqual([{ barcode: 'RJH-002' }])
  })

  it('旧实例可将扫码转交给当前 active 实例（避免旧实例处理完成但 UI 不刷新）', () => {
    class PageADoc extends DocumentBase<AnyDoc, AnyDetail> {
      public received: any[] = []
      public handoff(code: string): void {
        this.redeliverScanCodeToActive(code)
      }
      protected override onScanResult(payload: any): void {
        this.received.push(payload)
      }
    }

    const a1 = new PageADoc(createOptions())
    bindForScan(a1)

    const a2 = new PageADoc(createOptions())
    bindForScan(a2)

    a1.handoff('RJH-003')
    expect(pendingAfterResumed.length).toBe(1)

    pendingAfterResumed.shift()?.()
    expect(a2.received.length).toBe(1)
    expect(a2.received[0]?.barcode).toBe('RJH-003')
    expect(a2.received[0]?.__djForwardCount).toBe(1)
  })
})
