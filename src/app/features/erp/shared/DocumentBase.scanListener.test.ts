import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { DocumentBase, type NormalizedDocumentBaseOptions } from './DocumentBase'
import { addScanListener } from '@/lib/android-bridge'

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
  runAfterAndroidAppResumed: (fn: () => void) => fn(),
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

describe('DocumentBase 扫码监听（全局单例）', () => {
  const disposer1 = vi.fn()
  const disposer2 = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).window = {}
    delete (globalThis as any).document
    // 清理全局注册表，避免跨测试污染
    delete (globalThis as any).window.__dj_scan_listener_globals__

    ;(addScanListener as any)
      .mockImplementationOnce(() => disposer1)
      .mockImplementationOnce(() => disposer2)
  })

  afterEach(() => {
    delete (globalThis as any).window
    delete (globalThis as any).document
  })

  it('进入新页面时会清理旧页面监听，避免扫码命中多次', () => {
    class PageADoc extends DocumentBase<AnyDoc, AnyDetail> {}
    class PageBDoc extends DocumentBase<AnyDoc, AnyDetail> {}

    const a = new PageADoc(createOptions())
    bindForScan(a)

    const globals1 = (globalThis as any).window.__dj_scan_listener_globals__
    expect(Object.keys(globals1.registry)).toEqual(['PageADoc'])

    const b = new PageBDoc(createOptions())
    bindForScan(b)

    // 新页面注册时会清理 registry 内全部旧 disposer
    expect(disposer1).toHaveBeenCalledTimes(1)

    const globals2 = (globalThis as any).window.__dj_scan_listener_globals__
    expect(Object.keys(globals2.registry)).toEqual(['PageBDoc'])

    // 旧实例后续 dispose 不应影响当前页面监听
    a.dispose()
    expect(Object.keys(globals2.registry)).toEqual(['PageBDoc'])

    b.dispose()
    expect(Object.keys(globals2.registry)).toEqual([])
  })
})
