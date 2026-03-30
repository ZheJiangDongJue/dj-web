import { describe, it, expect, vi, beforeEach } from 'vitest'

import { DocumentBase, type NormalizedDocumentBaseOptions } from './DocumentBase'

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

type AnyDoc = { id: number; status: number }
type AnyDetail = { id: number }

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: any) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createOptions(service: NormalizedDocumentBaseOptions<AnyDoc, AnyDetail>['service']): NormalizedDocumentBaseOptions<AnyDoc, AnyDetail> {
  return {
    service,
    createEmptyDocument: () => ({ id: 0, status: 0 }),
    createInitialDetails: () => [],
    deriveStatus: (doc) => doc.status,
    hasStatusFlag: () => false,
    statusFlagConfig: {},
    autoRefreshAfterSave: false,
    refreshAfterApprove: false,
    refreshAfterUnapprove: false,
    initialId: null,
  }
}

function bindState(doc: DocumentBase<AnyDoc, AnyDetail>) {
  const state = {
    document: { id: 0, status: 0 } as AnyDoc,
    details: [] as AnyDetail[],
    status: 0,
    docActions: {
      state: { id: null as number | null },
      create: () => { state.docActions.state.id = null },
      setId: (id: number | null) => { state.docActions.state.id = id },
    } as any,
  }

  doc.bindBridge({
    getDocument: () => state.document,
    getDetails: () => state.details,
    getStatus: () => state.status,
    getStatusRef: () => state.status,
    setDocument: (next) => { state.document = next },
    setDetails: (next) => { state.details = next },
    setStatus: (next) => { state.status = next },
    docActions: state.docActions,
  })

  return state
}

describe('DocumentBase 加载时序保护（loadSeq）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refresh 并发返回时，仅最后一次写入状态', async () => {
    const d1 = createDeferred<{ document?: AnyDoc | null; details?: AnyDetail[] | null }>()
    const d2 = createDeferred<{ document?: AnyDoc | null; details?: AnyDetail[] | null }>()

    const fetchById = vi.fn()
      .mockImplementationOnce(() => d1.promise)
      .mockImplementationOnce(() => d2.promise)

    const doc = new DocumentBase<AnyDoc, AnyDetail>(createOptions({
      save: async () => ({}),
      approve: async () => ({}),
      unapprove: async () => ({}),
      fetchById,
      extractId: () => 0,
    }))

    const state = bindState(doc)

    const p1 = doc.refresh(1)
    const p2 = doc.refresh(2)

    d2.resolve({ document: { id: 2, status: 200 }, details: [{ id: 2 }] })
    await p2

    d1.resolve({ document: { id: 1, status: 100 }, details: [{ id: 1 }] })
    await p1

    expect(state.document.id).toBe(2)
    expect(state.status).toBe(200)
    expect(state.docActions.state.id).toBe(2)
  })

  it('reset 会取消进行中的 refresh 回写', async () => {
    const d1 = createDeferred<{ document?: AnyDoc | null; details?: AnyDetail[] | null }>()
    const fetchById = vi.fn().mockImplementationOnce(() => d1.promise)

    const doc = new DocumentBase<AnyDoc, AnyDetail>(createOptions({
      save: async () => ({}),
      approve: async () => ({}),
      unapprove: async () => ({}),
      fetchById,
      extractId: () => 0,
    }))

    const state = bindState(doc)

    const p = doc.refresh(1)
    doc.reset()

    d1.resolve({ document: { id: 1, status: 100 }, details: [{ id: 1 }] })
    await p

    expect(state.document.id).toBe(0)
    expect(state.status).toBe(0)
    expect(state.docActions.state.id).toBe(null)
  })

  it('openById 并发返回时，仅最后一次写入状态', async () => {
    const d1 = createDeferred<{ document?: AnyDoc | null; details?: AnyDetail[] | null }>()
    const d2 = createDeferred<{ document?: AnyDoc | null; details?: AnyDetail[] | null }>()

    const fetchById = vi.fn()
      .mockImplementationOnce(() => d1.promise)
      .mockImplementationOnce(() => d2.promise)

    const doc = new DocumentBase<AnyDoc, AnyDetail>(createOptions({
      save: async () => ({}),
      approve: async () => ({}),
      unapprove: async () => ({}),
      fetchById,
      extractId: () => 0,
    }))

    const state = bindState(doc)

    const p1 = doc.openById(1)
    const p2 = doc.openById(2)

    d2.resolve({ document: { id: 2, status: 200 }, details: [{ id: 2 }] })
    await p2

    d1.resolve({ document: { id: 1, status: 100 }, details: [{ id: 1 }] })
    await p1

    expect(state.document.id).toBe(2)
    expect(state.status).toBe(200)
    expect(state.docActions.state.id).toBe(2)
  })
})

