import { toast } from 'sonner'
import { BillApi } from '@/lib/erp/bill-api'
import { addScanListener, runAfterAndroidAppResumed, type ScanResultPayload } from '@/lib/android-bridge'
import type { DocumentActions } from '@/lib/documents/useDocumentActions'
import { extractUserFacingErrorMessage, formatActionErrorMessage, resolveUserFacingErrorMessage } from '@/lib/errors/user-facing-error'

/**
 *
 * 扫码监听全局注册表：确保任意时刻仅保留同一派生类的最新监听器。
 * - key：派生类的稳定标识
 * - value：addScanListener 返回的销毁函数
 *
 */
type ScanDisposer = () => void
type ScanResultHandler = (payload: ScanResultPayload) => void
type PendingScanPayload = { at: number; payload: ScanResultPayload }
type MutationTimestampSnapshot = {
  readonly updateTime: string
  readonly approvalTime: string
  readonly hasAnyField: boolean
}
type ScanListenerGlobals = {
  registry: Record<string, ScanDisposer | undefined>
  seq: number
  activeKey?: string
  activeHandler?: ScanResultHandler
  pendingByKey?: Record<string, PendingScanPayload[]>
}

const GLOBAL_SCAN_LISTENER_KEY = '__dj_scan_listener_globals__'
const DEFAULT_BUSY_ACTION_TIMEOUT_MS = 45_000
let busyActionToastSeq = 0

/**
 *
 * 通用耗时动作超时错误。
 * @remarks
 * - 用于区分真正的业务异常与前端兜底超时；
 * - 超时时外层会释放 UI 门闩，并提示用户刷新单据确认服务端最终状态。
 *
 */
class BusyActionTimeoutError extends Error {
  public constructor(
    public readonly actionName: string,
    public readonly timeoutMs: number,
  ) {
    super(`${actionName}处理超时`)
    this.name = 'BusyActionTimeoutError'
  }
}

function isBusyActionTimeoutError(error: unknown): error is BusyActionTimeoutError {
  return error instanceof BusyActionTimeoutError
}

function normalizeBusyActionTimeoutMs(timeoutMs: number | undefined): number {
  if (timeoutMs == null) return DEFAULT_BUSY_ACTION_TIMEOUT_MS
  if (!Number.isFinite(timeoutMs)) return DEFAULT_BUSY_ACTION_TIMEOUT_MS
  return Math.max(0, Math.floor(timeoutMs))
}

function nextBusyActionToastId(): string {
  busyActionToastSeq = (busyActionToastSeq % Number.MAX_SAFE_INTEGER) + 1
  return `dj-document-busy-${busyActionToastSeq}`
}

function getScanListenerHost(): any {
  if (typeof window !== 'undefined') return window as any
  // 兼容旧 WebView：部分环境没有 globalThis
  if (typeof globalThis !== 'undefined') return globalThis as any
  return {} as any
}

function getScanListenerGlobals(): ScanListenerGlobals {
  const host = getScanListenerHost()
  const existing = host?.[GLOBAL_SCAN_LISTENER_KEY] as any
  if (existing && typeof existing.seq === 'number' && existing.registry) {
    // 兼容旧版本（Map 注册表）：迁移到普通对象，避免不同运行时/旧 WebView 的兼容性问题。
    if (typeof Map !== 'undefined' && existing.registry instanceof Map) {
      const migrated: ScanListenerGlobals = {
        registry: Object.create(null) as any,
        seq: existing.seq,
        activeKey: typeof existing.activeKey === 'string' ? existing.activeKey : undefined,
        activeHandler: typeof existing.activeHandler === 'function' ? existing.activeHandler : undefined,
        pendingByKey: typeof existing.pendingByKey === 'object' && existing.pendingByKey ? existing.pendingByKey : undefined,
      }
      for (const [k, v] of existing.registry.entries()) {
        migrated.registry[String(k)] = v
      }
      try { host[GLOBAL_SCAN_LISTENER_KEY] = migrated } catch { }
      return migrated
    }

    if (typeof existing.registry === 'object') {
      return existing as ScanListenerGlobals
    }
  }
  const created: ScanListenerGlobals = { registry: Object.create(null) as any, seq: 0 }
  try {
    host[GLOBAL_SCAN_LISTENER_KEY] = created
  } catch {
    // ignore
  }
  return created
}

const PENDING_SCAN_MAX = 5
const PENDING_SCAN_TTL_MS = 30_000
const PENDING_SCAN_GLOBAL_KEY = '__dj_scan_pending_global__'

function ensureGlobalPendingScanStore(host: any): PendingScanPayload[] {
  if (!host) return []
  const existing = host[PENDING_SCAN_GLOBAL_KEY] as PendingScanPayload[] | undefined
  if (Array.isArray(existing)) return existing
  const created: PendingScanPayload[] = []
  try { host[PENDING_SCAN_GLOBAL_KEY] = created } catch { }
  return created
}

function enqueueGlobalPendingScan(payload: ScanResultPayload): void {
  const host = getScanListenerHost()
  const list = ensureGlobalPendingScanStore(host)
  list.push({ at: Date.now(), payload })
  if (list.length > PENDING_SCAN_MAX) {
    list.splice(0, list.length - PENDING_SCAN_MAX)
  }
}

function consumeGlobalPendingScans(): ScanResultPayload[] {
  const host = getScanListenerHost()
  const list = ensureGlobalPendingScanStore(host)
  if (list.length === 0) return []
  const now = Date.now()
  const valid = list.filter((i) => now - i.at <= PENDING_SCAN_TTL_MS).map((i) => i.payload)
  list.length = 0
  return valid
}

function dedupeScanPayloads(list: ScanResultPayload[]): ScanResultPayload[] {
  if (!Array.isArray(list) || list.length <= 1) return list
  const seen = new Set<string>()
  const out: ScanResultPayload[] = []
  for (const p of list) {
    const barcode = String((p as any)?.barcode ?? '').trim()
    const key = barcode ? `b:${barcode}` : `j:${safeJsonStringify(p)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(p)
  }
  return out
}

function safeJsonStringify(v: unknown): string {
  try {
    return JSON.stringify(v) ?? ''
  } catch {
    return ''
  }
}

function pickCaseInsensitiveField(
  record: Record<string, unknown>,
  names: readonly string[],
): { readonly found: boolean; readonly value: unknown } {
  const expected = new Set(names.map((name) => name.toLowerCase()))
  for (const [key, value] of Object.entries(record)) {
    if (expected.has(key.toLowerCase())) return { found: true, value }
  }
  return { found: false, value: undefined }
}

/**
 *
 * 将数据库时间字段归一为可比较值。
 * @remarks
 * - 兼容 null/空串、Date、ISO 字符串、SQL/接口常见的 `/Date(ms)/`；
 * - 可解析时间按毫秒时间戳比较，避免格式差异造成误判；
 * - 无法解析时保留整理后的原始文本，确保真正不同的值仍会被拦截。
 * @param value 原始时间字段值。
 *
 */
function normalizeMutationTimestamp(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isFinite(time) ? `ms:${time}` : ''
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? `n:${value}` : ''
  }

  const text = String(value).trim()
  if (!text) return ''

  const dotNetMatch = text.match(/^\/Date\((-?\d+)(?:[+-]\d+)?\)\/$/)
  if (dotNetMatch) {
    const time = Number(dotNetMatch[1])
    return Number.isFinite(time) ? `ms:${time}` : `raw:${text}`
  }

  const time = Date.parse(text)
  if (Number.isFinite(time)) return `ms:${time}`
  return `raw:${text.replace(/\s+/g, ' ')}`
}

/**
 *
 * 提取用于写入前并发校验的单据时间戳。
 * @param document 单据表头对象。
 * @returns 更新时间、审批时间及是否存在可比较字段。
 *
 */
function getMutationTimestampSnapshot(document: unknown): MutationTimestampSnapshot {
  const record = (document ?? {}) as Record<string, unknown>
  const update = pickCaseInsensitiveField(record, ['UpdateTime'])
  const approval = pickCaseInsensitiveField(record, ['ApprovalTime', 'DocumentApprovalTime'])

  return {
    updateTime: normalizeMutationTimestamp(update.value),
    approvalTime: normalizeMutationTimestamp(approval.value),
    hasAnyField: update.found || approval.found,
  }
}

/**
 *
 * 判断本地单据与数据库单据的写入相关时间戳是否一致。
 * @param localDocument 当前页面中的单据。
 * @param latestDocument 后端按 ID 重新获取的最新单据。
 *
 */
export function areDocumentMutationTimestampsEqual(
  localDocument: unknown,
  latestDocument: unknown,
): boolean {
  const local = getMutationTimestampSnapshot(localDocument)
  const latest = getMutationTimestampSnapshot(latestDocument)

  if (!local.hasAnyField && !latest.hasAnyField) return true
  return local.updateTime === latest.updateTime && local.approvalTime === latest.approvalTime
}

/**
 *
 * 判断后端保存失败是否来自“单据状态已在数据库变化”。
 * @remarks
 * - 这类错误通常表示前端状态没有同步数据库最新审批状态；
 * - 只识别明确的状态冲突文案，避免普通业务校验失败时覆盖用户正在编辑的数据。
 * @param message 后端返回的用户可见错误信息。
 *
 */
export function shouldReopenDocumentAfterRejectedMutation(message: string | null | undefined): boolean {
  const text = String(message ?? '').replace(/\s+/g, '')
  if (!text) return false

  return (
    text.includes('当前单据已经是审批状态了') ||
    text.includes('当前单据已审批,无法修改') ||
    text.includes('当前单据已审批，无法修改') ||
    text.includes('当前单据不是未审批状态') ||
    text.includes('状态没有同步')
  )
}

function ensurePendingScanStore(globals: ScanListenerGlobals): Record<string, PendingScanPayload[]> {
  let store = globals.pendingByKey
  if (!store || typeof store !== 'object') {
    store = Object.create(null) as Record<string, PendingScanPayload[]>
    globals.pendingByKey = store
  }
  return store
}

function enqueuePendingScan(globals: ScanListenerGlobals, key: string, payload: ScanResultPayload): void {
  const store = ensurePendingScanStore(globals)
  const list = store[key] ?? (store[key] = [])
  list.push({ at: Date.now(), payload })
  if (list.length > PENDING_SCAN_MAX) {
    list.splice(0, list.length - PENDING_SCAN_MAX)
  }
}

function consumePendingScans(globals: ScanListenerGlobals, key: string): ScanResultPayload[] {
  const store = ensurePendingScanStore(globals)
  const list = store[key]
  if (!list || list.length === 0) return []

  store[key] = []
  const now = Date.now()
  return list.filter((i) => now - i.at <= PENDING_SCAN_TTL_MS).map((i) => i.payload)
}

function nextScanDebugId(): number {
  const globals = getScanListenerGlobals()
  globals.seq += 1
  return globals.seq
}

function isScanDebugEnabled(): boolean {
  // 统一调试开关：仅使用 debug cookie（避免同时存在多种 debug 标志）
  if (typeof document !== 'undefined') {
    try {
      const raw = document.cookie ?? ''
      if (raw && /(?:^|;\s*)debug=(?:true|1|yes|on)(?:;|$)/i.test(raw)) return true
    } catch {
      // ignore
    }
  }

  return false
}

function getScanListenerKey(instance: object): string {
  const ctor = instance.constructor as any
  const explicit = ctor?.__djScanListenerKey
  if (typeof explicit === 'string' && explicit.trim().length > 0) {
    return explicit.trim()
  }

  const name = typeof ctor?.name === 'string' && ctor.name.length > 0 ? ctor.name : 'DocumentBase'
  // 使用 name 作为跨 bundle 稳定 key；如确有同名冲突，可在派生类上定义 static __djScanListenerKey 覆盖。
  return name
}

/**
 *
 * 基础服务契约：用于 DocumentBase 与具体业务服务对接。
 *
 */
export interface DocumentService<TDocument, TDetail> {
  save: (payload: { document: TDocument; details: TDetail[] }) => Promise<any>
  approve: (id: number) => Promise<{ success?: boolean; message?: string; code?: string }>
  unapprove: (id: number) => Promise<{ success?: boolean; message?: string; code?: string }>
  remove?: (id: number) => Promise<{ success?: boolean; message?: string; code?: string }>
  fetchById?: (id: number) => Promise<{ document?: TDocument | null; details?: TDetail[] | null }>
  extractId: (result: any) => number | null | undefined
}

/**
 *
 * 业务状态标记配置。
 *
 */
export interface StatusFlagConfig {
  frozen?: number
  closed?: number
  voided?: number
  approved?: number
  unapproved?: number
}

/**
 *
 * 用于桥接 React Hook 状态与 DocumentBase 类。
 * - 注意：DocumentBase 本身不依赖 React，仅通过该 Bridge 读写外部状态。
 *
 */
export interface DocumentBaseBridge<TDocument, TDetail> {
  getDocument(): TDocument
  getDetails(): TDetail[]
  getStatus(): number
  getStatusRef(): number
  setDocument(next: TDocument): void
  setDetails(next: TDetail[]): void
  setStatus(next: number): void
  docActions: DocumentActions
}

/**
 *
 * DocumentBase 内部使用的已归一化配置。
 *
 */
export interface NormalizedDocumentBaseOptions<TDocument, TDetail> {
  service: DocumentService<TDocument, TDetail>
  createEmptyDocument: () => TDocument
  createInitialDetails: () => TDetail[]
  deriveStatus: (document: TDocument) => number
  hasStatusFlag: (status: number, flag: number) => boolean
  statusFlagConfig: StatusFlagConfig
  validateBeforeApprove?: () => boolean
  autoRefreshAfterSave: boolean
  refreshAfterApprove: boolean
  refreshAfterUnapprove: boolean
  onAfterSave?: (id: number | null) => void | Promise<void>
  onAfterApprove?: (id: number) => void | Promise<void>
  onAfterUnapprove?: (id: number) => void | Promise<void>
  onAfterRefresh?: (
    payload: { document: TDocument; details: TDetail[] },
    ctx?: DocumentLoadContext,
  ) => void | Promise<void>
  initialId: number | string | null
  statusApprovedValue?: number
  statusUnapprovedValue?: number
}

export interface DocumentLoadContext {
  seq: number
  isActive: () => boolean
}

/**
 *
 * DocumentBase 暴露给外部的公共能力接口，便于子类扩展/替换实现。
 *
 */
export interface DocumentBaseLike<TDocument, TDetail> {
  configure(options: NormalizedDocumentBaseOptions<TDocument, TDetail>): void
  bindBridge(bridge: DocumentBaseBridge<TDocument, TDetail>): void
  getStatusLocks(
    status: number,
  ): { isLocked: boolean; approveDisabled: boolean; unapproveDisabled: boolean; editingDisabled: boolean }
  getDisableDetailEdit(status: number): boolean
  getResolvedCurrentId(stateId: string | number | null | undefined): number | null
  reset(): void
  refresh(id?: number | null, opts?: { silent?: boolean }): Promise<void>
  handleSave(): Promise<number | null>
  handleApprove(): Promise<boolean>
  handleUnapprove(): Promise<boolean>
  handleDelete(): Promise<boolean>
}

/**
 *
 * DocumentBase 实例构造器类型，便于子类通过 BaseCtor 注入。
 *
 */
export type DocumentBaseCtor<TDocument, TDetail> = new (
  options: NormalizedDocumentBaseOptions<TDocument, TDetail>,
) => DocumentBaseLike<TDocument, TDetail>

/**
 *
 * 通用单据基类：承载保存/审批/反审批/删除等核心流程。
 * - 不直接依赖 React，通过 DocumentBaseBridge 与外部状态对接。
 *
 */
export class DocumentBase<TDocument, TDetail> implements DocumentBaseLike<TDocument, TDetail> {
  // 订阅管理
  private subscribers = new Set<() => void>()
  private _version = 0
  /**
   *
   * 外部订阅快照版本号（每次 emit 自增，供 useSyncExternalStore 检测变更）
   *
   */
  public get revision(): number { return this._version }

  private options: NormalizedDocumentBaseOptions<TDocument, TDetail>
  private bridge: DocumentBaseBridge<TDocument, TDetail> | null = null
  private disposeScanListener: (() => void) | null = null
  private scanListenerRegistryKey: string | null = null
  private activeScanHandler: ScanResultHandler | null = null
  private loadSeq = 0

  /**
   *
   * 当前是否有“远程耗时操作”正在执行。
   * @remarks
   * - 由 runBusyAction 维护：在执行期间为 true，结束后回 false；
   * - 视图层可据此禁用按钮、显示加载文本/spinner。
   *
   */
  public actionBusy = false

  /**
   *
   * 当前正在执行的操作名（用于按钮文本切换，例如 "审批"/"反审批"/"删除"/"刷新"）。
   * - 与 actionBusy 同步维护，actionBusy=false 时为 null。
   *
   */
  public busyActionName: string | null = null

  /**
   *
   * 统一封装“远程耗时操作”的执行壳，为 UI 提供一致的 busy 反馈与防重入。
   * @remarks
   * - 进入时：actionBusy=true，busyActionName=actionName，emit 通知订阅者；
   * - 可选显示 sonner 的 loading toast；操作期间通知用户“正在处理”；
   * - 结束（无论成功/失败）：dismiss loading toast，actionBusy=false，busyActionName=null，emit；
   * - 默认 45 秒超时兜底，避免后端连接、认证刷新或页面跳转异常导致按钮永久禁用；
   * - 默认开启“跳过重复点击”：若已有 busy 操作进行，直接返回 undefined，避免并发请求；
   * - 除前端兜底超时外，不会捕获/吞掉异常：仍然由调用方处理。
   * @param actionName 操作名（例如 "审批"/"反审批"/"删除"）。
   * @param task 实际的异步任务。
   * @param opts 可选参数：自定义 loading 文本/是否显示 toast/是否跳过 busy/超时时间。
   * @returns 任务的返回值；若因 busy 跳过则返回 undefined。
   *
   */
  public async runBusyAction<T>(
    actionName: string,
    task: () => Promise<T>,
    opts?: {
      loadingMessage?: string
      showLoadingToast?: boolean
      skipIfBusy?: boolean
      timeoutMs?: number
    },
  ): Promise<T | undefined> {
    const skipIfBusy = opts?.skipIfBusy !== false
    if (skipIfBusy && this.actionBusy) {
      return undefined
    }
    this.actionBusy = true
    this.busyActionName = actionName
    this.emit()

    const showLoadingToast = opts?.showLoadingToast !== false
    let loadingToastId: string | number | undefined
    const forcedLoadingToastId = showLoadingToast ? nextBusyActionToastId() : undefined
    let loadingToastHandle: ReturnType<typeof setTimeout> | null = null
    let taskSettled = false
    const showDeferredLoadingToast = () => {
      loadingToastHandle = null
      if (!showLoadingToast || taskSettled) return
      try {
        // 兼容测试环境（mock 的 toast 没有 loading），动态访问以避免抛错。
        const loading = (toast as unknown as {
          loading?: (msg: string, data?: { id?: string | number }) => string | number
        }).loading
        if (typeof loading === 'function') {
          loadingToastId = loading(opts?.loadingMessage ?? `${actionName}中…`, { id: forcedLoadingToastId })
        }
      } catch {
        // ignore
      }
    }

    const timeoutMs = normalizeBusyActionTimeoutMs(opts?.timeoutMs)
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null
    let taskPromise: Promise<T> | null = null

    try {
      taskPromise = task()
      if (showLoadingToast) {
        // 延后一拍再显示 loading：必填校验/状态锁等同步早退不应产生“审批中”提示。
        loadingToastHandle = setTimeout(showDeferredLoadingToast, 0)
      }
      if (timeoutMs <= 0) return await taskPromise

      return await Promise.race<T>([
        taskPromise,
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(
            () => reject(new BusyActionTimeoutError(actionName, timeoutMs)),
            timeoutMs,
          )
        }),
      ])
    } catch (error) {
      if (!isBusyActionTimeoutError(error)) throw error

      // 兜底超时后原任务可能仍在后台完成；这里先吞掉后续 reject，避免未处理 Promise。
      try { void taskPromise?.catch(() => undefined) } catch { }
      try {
        toast.error(`${error.actionName}处理超时，请刷新单据确认服务端状态后重试`)
      } catch {
        // ignore
      }
      return undefined
    } finally {
      taskSettled = true
      if (timeoutHandle) clearTimeout(timeoutHandle)
      if (loadingToastHandle) clearTimeout(loadingToastHandle)
      if (loadingToastId != null || forcedLoadingToastId != null) {
        try {
          const dismiss = (toast as unknown as { dismiss?: (id?: string | number) => void }).dismiss
          if (typeof dismiss === 'function') {
            const ids = [loadingToastId, forcedLoadingToastId]
              .filter((id): id is string | number => id != null)
            for (const id of [...new Set(ids)]) dismiss(id)
          }
        } catch {
          // ignore
        }
      }
      try {
        this.bridge?.docActions.setLoading(false)
      } catch {
        // 兜底释放失败不应阻断 actionBusy 复位
      }
      this.actionBusy = false
      this.busyActionName = null
      this.emit()
    }
  }

  constructor(options: NormalizedDocumentBaseOptions<TDocument, TDetail>) {
    this.options = options
  }

  /**
   *
   * 清理资源（取消扫码监听等）
   *
   */
  public dispose(): void {
    try { this.destroyScanListener() } catch { }
    this.subscribers.clear()
    this.bridge = null
  }

  /**
   *
   * 订阅 ViewModel 的变更，返回取消订阅函数
   *
   */
  public subscribe(fn: () => void): () => void {
    this.subscribers.add(fn)
    return () => { try { this.subscribers.delete(fn) } catch { } }
  }

  /**
   *
   * 通知订阅者
   *
   */
  protected emit(): void {
    // 每次状态变更自增版本号，驱动 useSyncExternalStore 产生新快照
    this._version++
    for (const fn of this.subscribers) { try { fn() } catch { } }
  }

  /**
   *
   * 初始化扫码监听：订阅 Android 桥接 scanResult 事件，记录销毁函数。
   *
   */
  protected initScanListener(): void {
    if (typeof window === 'undefined') return

    this.destroyScanListener()
    const registryKey = getScanListenerKey(this)
    const globals = getScanListenerGlobals()
    const registry = globals.registry
    const debugId = isScanDebugEnabled() ? nextScanDebugId() : null
    if (debugId != null) {
      try { console.log(`[DocumentBase] initScanListener#${debugId} key=${registryKey}`) } catch { }
    }

    // 全局单例模式：同一时刻仅允许一个扫码监听器处于激活状态。
    // 原因：路由切换/页面未卸载时，旧页面的 ViewModel 可能仍然存活，导致扫码事件被多个页面同时处理。
    for (const k of Object.keys(registry)) {
      const disposer = registry[k]
      if (!disposer) continue
      try {
        disposer()
      } catch {
        // ignore stale cleanup errors
      } finally {
        try { delete registry[k] } catch { }
      }
    }
    // 清理全局 active handler（由最新的 initScanListener 重新写入）
    try {
      globals.activeKey = undefined
      globals.activeHandler = undefined
    } catch {
      // ignore
    }

    try {
      const ownerKey = registryKey
      this.disposeScanListener = addScanListener((payload) => {
        try {
          if (debugId != null) {
            console.log(`[DocumentBase] 收到扫码结果#${debugId}:`, payload)
          }
          runAfterAndroidAppResumed(() => {
            try {
              const globalsNow = getScanListenerGlobals()
              const activeKey = globalsNow.activeKey
              const activeHandler = globalsNow.activeHandler
              if (activeKey === ownerKey && typeof activeHandler === 'function') {
                activeHandler(payload)
                return
              }

              // 兜底：如果扫码回调执行时页面/VM 已重建，暂存 payload，等待同 key 的新监听器接管后再处理。
              enqueuePendingScan(globalsNow, ownerKey, payload)
              // 进一步兜底：仅在“key 不一致”时写入全局队列，避免与 per-key 暂存重复导致二次补发。
              if (activeKey && activeKey !== ownerKey) {
                enqueueGlobalPendingScan(payload)
              }
              if (debugId != null) {
                console.log(`[DocumentBase] 暂存扫码结果#${debugId} key=${ownerKey}:`, payload)
              }
            } catch (error) {
              console.error('[DocumentBase] 处理扫码结果失败:', error)
            }
          })
        } catch (error) {
          console.error('[DocumentBase] 处理扫码结果失败:', error)
        }
      })
      this.scanListenerRegistryKey = registryKey
      registry[registryKey] = this.disposeScanListener

      // 设置当前激活 handler：后续（含 pause/resume 延迟队列）统一路由到“最新绑定的实例”
      const handler: ScanResultHandler = (payload) => this.onScanResult(payload)
      this.activeScanHandler = handler
      globals.activeKey = registryKey
      globals.activeHandler = handler

      // 若存在暂存的扫码结果（常见于扫码期间页面重建/监听器切换），在下一轮自动补发一次
      const pending = consumePendingScans(globals, registryKey)
      const pendingGlobal = consumeGlobalPendingScans()
      const pendingMerged = dedupeScanPayloads([...pending, ...pendingGlobal])
      if (pendingMerged.length > 0) {
        const deliver = () => {
          try {
            const globalsNow = getScanListenerGlobals()
            if (globalsNow.activeKey !== registryKey || globalsNow.activeHandler !== handler) {
              // active 已被其它页面接管：避免跨页面误处理，直接丢弃
              return
            }
            for (const p of pendingMerged) {
              try {
                handler(p)
              } catch (error) {
                console.error('[DocumentBase] 补发扫码结果失败:', error)
              }
            }
          } catch (error) {
            console.error('[DocumentBase] 补发扫码结果失败:', error)
          }
        }

        if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
          window.setTimeout(deliver, 0)
        } else {
          deliver()
        }
      }
    } catch (error) {
      console.warn('[DocumentBase] 初始化扫码监听失败:', error)
      this.disposeScanListener = null
      this.scanListenerRegistryKey = null
      this.activeScanHandler = null
    }
  }

  /**
   *
   * 销毁扫码监听，供派生类在 dispose 阶段释放资源。
   *
   */
  protected destroyScanListener(): void {
    const registryKey = this.scanListenerRegistryKey
    const disposer = this.disposeScanListener
    if (!registryKey && !disposer) return

    const registry = getScanListenerGlobals().registry
    const globals = getScanListenerGlobals()
    if (disposer) {
      try {
        disposer()
      } catch {
        // ignore
      }
    }
    if (registryKey) {
      const existing = registry[registryKey]
      if (!disposer || existing === disposer) {
        try { delete registry[registryKey] } catch { }
      }
    }
    // 若当前实例是全局 active handler，则一并清理，避免旧 handler 被后续队列误调用
    if (this.activeScanHandler && globals.activeKey === registryKey && globals.activeHandler === this.activeScanHandler) {
      try {
        globals.activeKey = undefined
        globals.activeHandler = undefined
      } catch {
        // ignore
      }
    }
    this.disposeScanListener = null
    this.scanListenerRegistryKey = null
    this.activeScanHandler = null
  }

  /**
   *
   * 子类可覆写此方法处理统一标准化的 scanResult 数据。
   * @param payload 扫码完成后透传的标准化结果
   *
   */
  protected onScanResult(_payload: ScanResultPayload): void {
    // 默认空实现，由各业务文档自行覆盖
  }

  /**
   *
   * 判断当前实例是否仍为“扫码激活实例”。
   * - 用途：处理扫码期间页面/VM 重建导致的“旧实例 toast 但 UI 不刷新”问题。
   * - 约束：仅在 initScanListener 已成功初始化时才有意义；未初始化时视为 active（不阻断业务）。
   *
   */
  protected isScanListenerActive(): boolean {
    if (typeof window === 'undefined') return true
    const key = this.scanListenerRegistryKey
    const handler = this.activeScanHandler
    if (!key || !handler) return true
    const globals = getScanListenerGlobals()
    return globals.activeKey === key && globals.activeHandler === handler
  }

  /**
   *
   * 将扫码投递给“当前激活实例”处理（用于旧实例发现自己已不再 active 的场景）。
   * @param payload 原始扫码 payload（至少应包含 barcode）。
   *
   */
  protected redeliverScanToActive(payload: ScanResultPayload): void {
    if (typeof window === 'undefined') return

    const ownerKey = this.scanListenerRegistryKey ?? getScanListenerKey(this)
    const rawCount = (payload as any)?.__djForwardCount
    const forwardCount = typeof rawCount === 'number' && Number.isFinite(rawCount) ? rawCount : 0

    // 防止极端情况下循环转交（例如页面频繁重建/active 来回切换）
    if (forwardCount >= 2) return

    const forwarded = {
      ...(payload as any),
      __djForwardCount: forwardCount + 1,
      __djForwardedAt: Date.now(),
      __djForwardedFrom: ownerKey,
    } as ScanResultPayload

    runAfterAndroidAppResumed(() => {
      try {
        const globalsNow = getScanListenerGlobals()
        const activeKey = globalsNow.activeKey
        const activeHandler = globalsNow.activeHandler

        if (typeof activeHandler === 'function') {
          // 直接转交给当前激活 handler（不要求同 key；以“当前屏幕”为准）
          if (isScanDebugEnabled()) {
            try {
              console.log(`[DocumentBase] 转交扫码: from=${ownerKey} to=${String(activeKey ?? '')}`)
            } catch { }
          }
          activeHandler(forwarded)
          return
        }

        // 若暂时没有 active handler（处于重建窗口），按 ownerKey 暂存，等待后续同 key 实例接管。
        enqueuePendingScan(globalsNow, ownerKey, forwarded)
      } catch (error) {
        console.error('[DocumentBase] 转交扫码失败:', error)
      }
    })
  }

  /**
   *
   * 快捷方法：以条码字符串构造 payload 并转交。
   * @param code 扫码文本。
   *
   */
  protected redeliverScanCodeToActive(code: string): void {
    const barcode = String(code ?? '').trim()
    if (!barcode) return
    this.redeliverScanToActive({ barcode } as ScanResultPayload)
  }
  /**
   *
   * 更新配置（允许在外部依赖变化时动态覆盖）。
   *
   */
  public configure(options: NormalizedDocumentBaseOptions<TDocument, TDetail>): void {
    this.options = options
  }

  /**
   *
   * 绑定桥接层：让基类可以读写视图层的文档、明细、状态以及统一的动作。
   *
   */
  public bindBridge(bridge: DocumentBaseBridge<TDocument, TDetail>): void {
    this.bridge = bridge
  }

  private bumpLoadSeq(): number {
    this.loadSeq += 1
    return this.loadSeq
  }

  private isLoadSeqActive(seq: number): boolean {
    return seq === this.loadSeq
  }

  /**
   *
   * 将已获取的服务端单据快照写回当前页面状态。
   * @remarks
   * - 用于普通刷新、按 ID 打开，以及写入前并发校验失败后的“重新打开最新单据”；
   * - 写入后会执行业务方的 onAfterRefresh，以便各页面继续做字段标准化、显示名补齐等处理。
   * @param targetId 单据主键。
   * @param document 服务端最新表头。
   * @param details 服务端最新明细。
   * @param ctx 当前加载上下文。
   *
   */
  private async applyLoadedSnapshot(
    targetId: number,
    document: TDocument,
    details: TDetail[],
    ctx: DocumentLoadContext,
  ): Promise<void> {
    if (!this.bridge) return

    const { deriveStatus, onAfterRefresh } = this.options
    const { docActions, setDocument, setDetails, setStatus } = this.bridge

    setDocument(document)
    setDetails(details)
    setStatus(deriveStatus(document))
    docActions.setId(targetId)
    await onAfterRefresh?.({ document, details }, ctx)
  }

  /**
   *
   * 写入前校验当前单据是否仍与数据库中的更新时间、审批时间一致。
   * @remarks
   * - 仅对已有 ID 的单据生效；新增草稿无数据库版本可比较，直接放行；
   * - 校验失败时会用数据库最新数据重新打开当前单据，并提示用户确认后重试；
   * - 校验接口失败时阻断写入，避免在无法确认版本的情况下覆盖他人修改。
   * @param actionName 当前即将执行的写入动作名，用于提示文案。
   *
   */
  private async ensureDocumentFreshBeforeMutation(actionName: string): Promise<boolean> {
    if (!this.bridge) return false

    const { service } = this.options
    const currentId = this.getCurrentBillId()
    if (!currentId) return true
    if (!service.fetchById) return true

    const seq = this.bumpLoadSeq()
    const ctx: DocumentLoadContext = { seq, isActive: () => this.isLoadSeqActive(seq) }

    try {
      const res = await service.fetchById(currentId)
      if (!this.isLoadSeqActive(seq)) return false

      const latestDoc = (res?.document ?? null) as TDocument | null
      const latestDetails = Array.isArray(res?.details) ? (res.details as TDetail[]) : []
      if (!latestDoc) {
        try {
          toast.error(`${actionName}前无法获取数据库中的最新单据，请刷新后重试`)
        } catch {
          // ignore
        }
        return false
      }

      const currentDoc = this.bridge.getDocument()
      if (areDocumentMutationTimestampsEqual(currentDoc, latestDoc)) {
        return true
      }

      await this.applyLoadedSnapshot(currentId, latestDoc, latestDetails, ctx)
      try {
        toast.warning(`当前单据已被其他操作修改，已重新打开最新数据，请确认后再${actionName}`)
      } catch {
        // ignore
      }
      return false
    } catch (error) {
      if (!this.isLoadSeqActive(seq)) return false
      console.error(`[DocumentBase] ${actionName}前校验单据最新状态失败:`, error)
      try {
        toast.error(resolveUserFacingErrorMessage(error, `${actionName}前验证最新单据失败，请刷新后重试`))
      } catch {
        // ignore
      }
      return false
    }
  }

  /**
   *
   * 写入被后端以“状态已变化”拒绝后，重新打开数据库中的最新单据。
   * @remarks
   * - 这是写入前时间戳校验之外的兜底：即使前置校验未命中，后端最终拒绝写入时也要让页面回到最新状态；
   * - 仅由明确的状态冲突错误触发，避免普通保存失败覆盖本地输入。
   * @param actionName 当前动作名。
   *
   */
  private async reopenLatestDocumentAfterRejectedMutation(actionName: string): Promise<boolean> {
    if (!this.bridge) return false

    const { service } = this.options
    const currentId = this.getCurrentBillId()
    if (!currentId || !service.fetchById) return false

    const seq = this.bumpLoadSeq()
    const ctx: DocumentLoadContext = { seq, isActive: () => this.isLoadSeqActive(seq) }

    try {
      const res = await service.fetchById(currentId)
      if (!this.isLoadSeqActive(seq)) return false

      const latestDoc = (res?.document ?? null) as TDocument | null
      if (!latestDoc) return false

      const latestDetails = Array.isArray(res?.details) ? (res.details as TDetail[]) : []
      await this.applyLoadedSnapshot(currentId, latestDoc, latestDetails, ctx)
      try {
        toast.warning(`${actionName}未执行，已重新打开数据库最新单据，请确认后重试`)
      } catch {
        // ignore
      }
      return true
    } catch (error) {
      if (!this.isLoadSeqActive(seq)) return false
      console.error(`[DocumentBase] ${actionName}失败后重新打开最新单据失败:`, error)
      return false
    }
  }

  /**
   *
   * 激活扫码监听（包含副作用）。
   * @remarks
   * - 内部会订阅 Android 桥接 scanResult 事件，并写入全局 active handler；
   * - 必须在 React commit 后调用（例如在 useEffect/useLayoutEffect 中），避免 render 阶段创建但未挂载的实例抢占监听器，导致“toast 有但 UI 不刷新”。
   *
   */
  public activateScanListener(): void {
    this.initScanListener()
  }

  /**
   *
   * 停用扫码监听（仅回收副作用）。
   * @remarks
   * - 只会注销 Android 扫码监听并清理全局 active handler；
   * - 不会清空 bridge/subscribers，避免在 React dev Strict Effects 演练中误伤当前实例。
   *
   */
  public deactivateScanListener(): void {
    this.destroyScanListener()
  }

  /**
   *
   * 基于业务状态位生成锁定信息（审批/反审/编辑禁用）。
   *
   */
  public getStatusLocks(
    status: number,
  ): { isLocked: boolean; approveDisabled: boolean; unapproveDisabled: boolean; editingDisabled: boolean } {
    const { hasStatusFlag, statusFlagConfig } = this.options
    return buildStatusLocks(status, hasStatusFlag, statusFlagConfig)
  }

  /**
   *
   * 计算“明细编辑禁用”统一开关：冻结/结案/作废/已审批下禁用。
   *
   */
  public getDisableDetailEdit(status: number): boolean {
    return this.getStatusLocks(status).editingDisabled
  }

  /**
   *
   * 将可能的字符串/数字主键统一转换为有效的数字 ID。
   *
   */
  public getResolvedCurrentId(stateId: string | number | null | undefined): number | null {
    const { initialId } = this.options
    const id = toNumericId(stateId ?? initialId)
    return id
  }

  /**
   *
   * 获取当前桥接状态下的单据主键（兼容多种字段命名）。
   * @returns 合法的单据 ID，未找到则返回 0
   *
   */
  protected getCurrentBillId(): number {
    const idFromState = toNumericId(this.bridge?.docActions?.state?.id as any)
    if (idFromState) return idFromState

    const doc = this.bridge?.getDocument?.() as Record<string, unknown> | undefined
    const record = doc ?? {}
    const candidates = ['id', 'Id', 'ID', 'billId', 'BillId', 'billid'] as const
    for (const key of candidates) {
      const n = toNumericId(record[key] as any)
      if (n) return n
    }
    return 0
  }

  /**
   *
   * 仅从单据对象本身提取主键，不回退到桥接状态。
   * @remarks
   * - 适用于“新草稿/刚加载单据”这类场景，避免把上一张单据的 state.id 误当成当前单据；
   * - 若文档尚未带出主键，则返回 0。
   *
   */
  protected getDocumentBillId(document: unknown): number {
    const record = (document ?? {}) as Record<string, unknown>
    const candidates = ['id', 'Id', 'ID', 'billId', 'BillId', 'billid'] as const
    for (const key of candidates) {
      const n = toNumericId(record[key] as any)
      if (n) return n
    }
    return 0
  }

  /**
   *
   * 同步当前桥接主键。
   * @remarks
   * - 传入 null 表示清空当前单据，避免后续流程复用过期 state.id；
   * - 该方法只负责写入动作状态，不改动表头/明细本身。
   *
   */
  protected syncCurrentBillId(id: number | null): void {
    if (!this.bridge) return
    try {
      this.bridge.docActions.setId(id)
    } catch {
      // 保护性更新：不阻断单据载入流程
    }
  }

  /**
   *
   * 重置文档与明细为默认值，并清空当前 ID。
   *
   */
  public reset(): void {
    if (!this.bridge) return

    const { createEmptyDocument, deriveStatus } = this.options
    const { docActions, setDocument, setDetails, setStatus } = this.bridge

    this.bumpLoadSeq()
    const emptyDoc = createEmptyDocument()
    setDocument(emptyDoc)
    // 重置时清空所有明细，保持“新增即空”的唯一语义
    setDetails([] as unknown as TDetail[])
    setStatus(deriveStatus(emptyDoc))

    try {
      docActions.create()
      docActions.setId(null)
    } catch {
      // 保护性调用：不阻断重置流程
    }
  }

  /**
   *
   * 根据主键从服务端刷新当前单据数据。
   *
   */
  public async refresh(id?: number | null, opts?: { silent?: boolean }): Promise<void> {
    if (!this.bridge) return

    const { service, createEmptyDocument, deriveStatus, onAfterRefresh, initialId } = this.options
    const { docActions, setDocument, setDetails, setStatus } = this.bridge

    if (!service.fetchById) return

    const targetId = toNumericId(id ?? docActions.state.id ?? initialId)
    if (!targetId) return

    const seq = this.bumpLoadSeq()
    const ctx: DocumentLoadContext = { seq, isActive: () => this.isLoadSeqActive(seq) }
    try {
      const res = await service.fetchById(targetId)
      if (!this.isLoadSeqActive(seq)) return
      const nextDoc = (res?.document as TDocument | null | undefined) ?? createEmptyDocument()
      const nextDetails = Array.isArray(res?.details) ? (res?.details as TDetail[]) : []

      setDocument(nextDoc)
      setDetails(nextDetails)
      const nextStatus = deriveStatus(nextDoc)
      setStatus(nextStatus)
      docActions.setId(targetId)
      await onAfterRefresh?.({ document: nextDoc, details: nextDetails }, ctx)
    } catch (error) {
      if (!this.isLoadSeqActive(seq)) return
      console.error('[DocumentBase] 刷新失败:', error)
      if (!opts?.silent) {
        try {
          toast.error(resolveUserFacingErrorMessage(error, '获取最新单据失败'))
        } catch {
          // 避免 toast 失败阻断流程
        }
      }
    }
  }

  /**
   *
   * 根据主键打开单据（不存在则返回 null）。
   * - 先用 service.fetchById 预检：若不存在则不刷新状态，直接返回 null，避免出现“已打开单据”误提示；
   * - 若存在，再调用 refresh(id, { silent: true }) 将数据写入桥接状态；
   * - 返回标准化快照 { document, details }，以便调用方据此提示。
   *
   */
  public async openById(id: number): Promise<{ document: TDocument; details: TDetail[] } | null> {
    if (!this.bridge) return null

    const { service, deriveStatus, onAfterRefresh } = this.options
    const { docActions, setDocument, setDetails, setStatus } = this.bridge

    const targetId = toNumericId(id)
    if (!targetId) return null

    const seq = this.bumpLoadSeq()
    const ctx: DocumentLoadContext = { seq, isActive: () => this.isLoadSeqActive(seq) }

    // 有能力按 ID 查询时，先做预检，防止把“空白单据”当作打开成功
    if (service.fetchById) {
      try {
        const res = await service.fetchById(targetId)
        const doc = (res?.document ?? null) as TDocument | null
        if (!doc) {
          // 单据不存在：不刷新、不修改当前状态，交由调用方做提示
          return null
        }
        const details = Array.isArray(res?.details) ? (res!.details as TDetail[]) : []
        // 若期间被新加载覆盖，则不再写入状态，但仍返回快照（避免调用方误报“未找到”）
        if (!this.isLoadSeqActive(seq)) return { document: doc, details }

        setDocument(doc)
        setDetails(details)
        setStatus(deriveStatus(doc))
        docActions.setId(targetId)
        await onAfterRefresh?.({ document: doc, details }, ctx)
        return { document: doc, details }
      } catch {
        // 如服务端抛出“单据不存在”等错误，这里统一视为未找到
        return null
      }
    }

    // 回退路径：无 fetchById 时沿用原逻辑
    await this.refresh(targetId, { silent: true })
    if (!this.bridge) return null
    try {
      const { getDocument, getDetails } = this.bridge
      return { document: getDocument(), details: getDetails() }
    } catch {
      return null
    }
  }

  /**
   *
   * 保存当前单据并返回主键。
   *
   */
  public async handleSave(): Promise<number | null> {
    if (!this.bridge) return null

    const { service, autoRefreshAfterSave, onAfterSave, initialId } = this.options
    const { docActions } = this.bridge

    try {
      if (!(await this.ensureDocumentFreshBeforeMutation('保存'))) return null

      const res = await docActions.save({})
      // 约定：当 callSave 明确返回 { id: null } 时，表示“本次保存失败”，不可回退沿用旧 id。
      if (
        res &&
        typeof res === 'object' &&
        Object.prototype.hasOwnProperty.call(res, 'id') &&
        (res as any).id === null
      ) {
        const msg = extractUserFacingErrorMessage(res) || (typeof (res as any)?.code === 'string' ? String((res as any).code).trim() : '')
        try {
          toast.error(formatActionErrorMessage('保存', { message: msg }, '保存失败'))
        } catch {
          // ignore
        }
        if (shouldReopenDocumentAfterRejectedMutation(msg)) {
          await this.reopenLatestDocumentAfterRejectedMutation('保存')
        }
        return null
      }
      const id =
        toNumericId(service.extractId(res)) ??
        toNumericId((res as any)?.id as any) ??
        toNumericId(docActions.state.id) ??
        toNumericId(initialId)

      if (!id) {
        try {
          toast.error('保存失败：未获取到有效单据ID')
        } catch {
          // ignore
        }
        return null
      }

      if (id) {
        docActions.setId(id)

        // 同步更新当前桥接文档中的主键字段，避免后续保存因 id 为 0 导致重复建单。
        try {
          const bridge = this.bridge
          if (bridge) {
            const currentDoc = bridge.getDocument() as any
            if (currentDoc && typeof currentDoc === 'object') {
              const nextDoc: any = { ...currentDoc }

              // 尝试更新常见的主键字段命名；若不存在任何主键字段，则至少保证 id 字段为最新值。
              const hasExplicitIdKeys =
                'Id' in nextDoc ||
                'ID' in nextDoc ||
                'BillId' in nextDoc ||
                'billId' in nextDoc ||
                'billid' in nextDoc

              if ('id' in nextDoc || !hasExplicitIdKeys) {
                nextDoc.id = id
              }
              if ('Id' in nextDoc) nextDoc.Id = id
              if ('ID' in nextDoc) nextDoc.ID = id
              if ('BillId' in nextDoc) nextDoc.BillId = id
              if ('billId' in nextDoc) nextDoc.billId = id
              if ('billid' in nextDoc) nextDoc.billid = id

              bridge.setDocument(nextDoc)
            }
          }
        } catch {
          // 保护性更新：忽略同步失败，保持保存流程成功
        }
      }

      if (autoRefreshAfterSave && id && service.fetchById) {
        await this.refresh(id, { silent: true })
      }

      await onAfterSave?.(id ?? null)
      return id ?? null
    } catch (error) {
      console.error('[DocumentBase] 保存失败:', error)
      const msg = extractUserFacingErrorMessage(error)
      try {
        toast.error(formatActionErrorMessage('保存', error, '保存失败'))
      } catch {
        // 避免 toast 失败阻断主流程
      }
      if (shouldReopenDocumentAfterRejectedMutation(msg)) {
        await this.reopenLatestDocumentAfterRejectedMutation('保存')
      }
      return null
    }
  }

  /**
   *
   * 审批当前单据。
   *
   */
  public async handleApprove(): Promise<boolean> {
    if (!this.bridge) return false

    const {
      hasStatusFlag,
      statusFlagConfig,
      validateBeforeApprove,
      refreshAfterApprove,
      statusApprovedValue,
      onAfterApprove,
      service,
    } = this.options
    const { docActions, getStatusRef, setStatus } = this.bridge

    if (!(await this.ensureDocumentFreshBeforeMutation('审批'))) {
      return false
    }

    if (validateBeforeApprove && !validateBeforeApprove()) {
      return false
    }

    const locks = buildStatusLocks(getStatusRef(), hasStatusFlag, statusFlagConfig)
    if (locks.isLocked || locks.approveDisabled) return false

    const id = await this.handleSave()
    if (!id) return false

    const result = await docActions.approve(id)
    if (!result.success) {
      try {
        toast.error(formatActionErrorMessage('审批', result, '审批失败'))
      } catch {
        // ignore
      }
      return false
    }

    if (refreshAfterApprove && service.fetchById) {
      await this.refresh(id)
    } else if (statusApprovedValue != null) {
      setStatus(statusApprovedValue)
    }

    await onAfterApprove?.(id)
    try {
      toast.success('审批成功')
    } catch {
      // ignore
    }
    return true
  }

  /**
   *
   * 反审批当前单据。
   *
   */
  public async handleUnapprove(): Promise<boolean> {
    if (!this.bridge) return false

    const {
      hasStatusFlag,
      statusFlagConfig,
      refreshAfterUnapprove,
      statusUnapprovedValue,
      onAfterUnapprove,
      initialId,
      service,
    } = this.options
    const { docActions, getStatusRef, setStatus } = this.bridge

    if (!(await this.ensureDocumentFreshBeforeMutation('反审批'))) {
      return false
    }

    const locks = buildStatusLocks(getStatusRef(), hasStatusFlag, statusFlagConfig)
    if (locks.isLocked || locks.unapproveDisabled) return false

    let id = toNumericId(docActions.state.id) ?? toNumericId(initialId)
    if (!id) {
      id = await this.handleSave()
    }
    if (!id) return false

    const result = await docActions.unapprove(id)
    if (!result.success) {
      try {
        toast.error(formatActionErrorMessage('反审批', result, '反审批失败'))
      } catch {
        // ignore
      }
      return false
    }

    if (refreshAfterUnapprove && service.fetchById) {
      await this.refresh(id)
    } else if (statusUnapprovedValue != null) {
      setStatus(statusUnapprovedValue)
    }

    await onAfterUnapprove?.(id)
    try {
      toast.success('反审批成功')
    } catch {
      // ignore
    }
    return true
  }

  /**
   *
   * 删除当前单据。
   *
   */
  public async handleDelete(): Promise<boolean> {
    if (!this.bridge) return false

    const { service } = this.options
    const { docActions } = this.bridge

    const currentId = this.getCurrentBillId()
    // 新建未保存（无有效 ID）：视为“取消新建”，直接清空即可
    if (!currentId) {
      this.reset()
      try {
        toast.success('已取消新建')
      } catch {
        // ignore
      }
      return true
    }

    if (!service.remove) return false
    if (!(await this.ensureDocumentFreshBeforeMutation('删除'))) return false

    try {
      const res = await service.remove(currentId)
      const ok = !!res?.success
      if (ok) {
        this.reset()
        try {
          toast.success('删除成功')
        } catch {
          // ignore
        }
        return true
      }

      const msg = resolveUserFacingErrorMessage(res, '删除失败')
      try {
        toast.error(msg)
      } catch {
        // ignore
      }
      return false
    } catch (error) {
      const msg = resolveUserFacingErrorMessage(error, '删除失败')
      try {
        toast.error(msg)
      } catch {
        // ignore
      }
      // 尝试保持动作状态一致
      try {
        docActions.setId(null)
      } catch {
        // ignore
      }
      return false
    }
  }
}

/**
 *
 * 将可能的字符串/数字主键统一转换为有效的数字 ID。
 * @param id 原始主键值。
 * @returns 合法数字主键，非法则返回 null。
 *
 */
export function toNumericId(id: string | number | null | undefined): number | null {
  const n = typeof id === 'string' ? Number(id) : id
  return Number.isFinite(n as number) && (n as number) > 0 ? (n as number) : null
}

/**
 *
 * 基于状态标记与状态位函数计算审批锁定状态。
 * @param status 当前状态值。
 * @param hasStatusFlag 状态位判断函数。
 * @param flags 业务定义的状态位集合。
 * @returns 锁定标记与审批/反审禁用标记。
 *
 */
export function buildStatusLocks(
  status: number,
  hasStatusFlag: (status: number, flag: number) => boolean,
  flags: StatusFlagConfig,
): { isLocked: boolean; approveDisabled: boolean; unapproveDisabled: boolean; editingDisabled: boolean } {
  // 强制转为数字，防止出现字符串 '0' 导致按位判断失效
  const n = typeof status === 'number' ? status : Number(status as unknown)
  const base = Number.isFinite(n) ? n : 0
  // 兼容：后端部分接口以 0 表示“未审批”。将其视作包含未审批位。
  const s = base === 0 && flags.unapproved != null ? (base | flags.unapproved) : base

  // 锁定态：冻结/结案/作废 统一视为完全锁定
  const locked =
    (flags.frozen != null && hasStatusFlag(s, flags.frozen)) ||
    (flags.closed != null && hasStatusFlag(s, flags.closed)) ||
    (flags.voided != null && hasStatusFlag(s, flags.voided))

  // 审批/反审批按钮禁用逻辑：
  const approveDisabled = locked || (flags.approved != null && hasStatusFlag(s, flags.approved))
  const unapproveDisabled = locked || (flags.unapproved != null && hasStatusFlag(s, flags.unapproved))

  // 编辑禁用：在完全锁定或“已审批”时禁止编辑内容，但允许执行“反审批”
  const editingDisabled = locked || (flags.approved != null && hasStatusFlag(s, flags.approved))

  return { isLocked: locked, approveDisabled, unapproveDisabled, editingDisabled }
}

export interface FetchBillWithDetailsOptions<TDocument, TDetail> {
  tableName: string
  billId: number
  errorMessageOnFail?: string
}

/**
 *
 * 基于 BillApi.GetBillWithDetails 的通用“单据+明细”获取函数。
 * - 兼容服务端返回 ApiMessagePack<T> 或直接返回数据两种形态；
 * - 若既不存在表头也不存在明细且后端标记失败，则抛出带 message 的错误；
 * - 始终返回标准化的 { document, details } 结构。
 *
 */
export async function fetchBillWithDetailsById<TDocument, TDetail>(
  options: FetchBillWithDetailsOptions<TDocument, TDetail>,
): Promise<{ document: TDocument | null; details: TDetail[] }> {
  const { tableName, billId, errorMessageOnFail } = options

  const pack = await BillApi.GetBillWithDetails<{
    Document?: TDocument | null
    Details?: TDetail[]
  }>({
    tableName,
    billId,
  } as any)

  const anyPack = pack as any
  const payload = (anyPack?.data ?? anyPack) as {
    Document?: TDocument | null
    document?: TDocument | null
    Details?: TDetail[]
    details?: TDetail[]
    success?: boolean
    message?: string
  }

  const document = (payload?.Document ?? payload?.document ?? null) as TDocument | null
  const rawDetails = (payload?.Details ?? payload?.details ?? []) as unknown

  const successFlag: boolean | undefined =
    typeof anyPack?.success === 'boolean'
      ? anyPack.success
      : typeof payload?.success === 'boolean'
        ? payload.success
        : undefined

  if (successFlag === false && !document && !Array.isArray(rawDetails)) {
    const message = anyPack?.message ?? payload?.message ?? errorMessageOnFail ?? '获取单据失败'
    throw new Error(String(message))
  }

  return {
    document,
    details: Array.isArray(rawDetails) ? (rawDetails as TDetail[]) : [],
  }
}

/**
 *
 * 从保存返回包中提取单据主键（兼容多种返回结构）。
 * - 优先 objects/Objects 下的 BillId
 * - 其次 data 下的 BillId
 * - 最后从根对象提取 BillId
 *
 */
export function extractBillIdFromSaveResult(saveRes: any): number {
  if (!saveRes || typeof saveRes !== 'object') return 0
  const root = saveRes as any
  const pickFrom = (src: any): number => {
    if (!src || typeof src !== 'object') return 0
    const candidates = [src.BillId, src.billId, src.billid]
    for (const v of candidates) {
      const n = typeof v === 'number' ? v : Number(v as unknown)
      if (Number.isFinite(n) && n > 0) return n
    }
    return 0
  }
  const objectsId = pickFrom(root.objects ?? root.Objects)
  if (objectsId > 0) return objectsId
  const dataId = pickFrom(root.data)
  if (dataId > 0) return dataId
  return pickFrom(root)
}
