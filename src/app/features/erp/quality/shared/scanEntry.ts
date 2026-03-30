import { toast } from 'sonner'
import type { ScanResultPayload } from '@/lib/android-bridge'

export type ScanCodeHandler<TResult = unknown> = (code: string) => TResult | Promise<TResult>

export interface HandleScanResultPayloadOptions {
  /**
   * 执行具体业务分流的回调。
   */
  onCode: ScanCodeHandler
  /**
   * 扫码内容为空时的回调（可选）。
   */
  onEmpty?: () => void | Promise<void>
  /**
   * 收到扫码后的提示文案（默认：已接收扫码，正在处理…）。
   */
  receivedToastText?: string
  /**
   * 执行异常时的提示文案（默认：扫码处理失败，请稍后重试）。
   */
  errorToastText?: string
  /**
   * 日志标签（用于 console.error）。
   */
  logTag?: string
  /**
   * 可视化调试提示：是否启用（默认：自动检测 debug cookie）。
   */
  debugToast?: boolean
  /**
   * 可视化调试提示：扫码处理超时阈值（毫秒）。默认 12000；<=0 表示禁用。
   */
  debugTimeoutMs?: number
}

/**
 *
 * 从 Android 桥接回调的 payload 中提取扫码文本。
 * @param payload 扫码结果。
 * @returns 去除首尾空格后的扫码文本；不存在则返回空字符串。
 *
 */
export function getScanCodeFromPayload(payload: ScanResultPayload): string {
  return String((payload as any)?.barcode ?? '').trim()
}

function isPromiseLike(v: unknown): v is Promise<unknown> {
  return !!v && typeof v === 'object' && 'then' in (v as any) && typeof (v as any).then === 'function'
}

function isDebugCookieEnabled(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const raw = document.cookie ?? ''
    if (!raw) return false
    return /(?:^|;\s*)debug=(?:true|1|yes|on)(?:;|$)/i.test(raw)
  } catch {
    return false
  }
}

function resolveDebugToastEnabled(options: HandleScanResultPayloadOptions): boolean {
  if (typeof options.debugToast === 'boolean') return options.debugToast
  return isDebugCookieEnabled()
}

function clipText(s: string, maxLen: number): string {
  const str = String(s ?? '')
  if (!maxLen || maxLen <= 0 || str.length <= maxLen) return str
  return `${str.slice(0, maxLen)}…`
}

function getDebugResultSummary(result: unknown): string {
  if (result == null) return ''
  if (typeof result === 'string') return result.trim()
  if (typeof result === 'boolean') return result ? 'true' : 'false'
  if (typeof result !== 'object') return ''

  const anyResult = result as any
  const type = typeof anyResult.type === 'string' ? anyResult.type.trim() : ''
  const level = typeof anyResult.level === 'string' ? anyResult.level.trim() : ''
  const message = typeof anyResult.message === 'string' ? anyResult.message.trim() : ''

  const parts: string[] = []
  if (type) parts.push(type)

  if (type === 'ERROR') {
    if (level) parts.push(level)
    if (message) parts.push(clipText(message, 60))
    return parts.join(' | ')
  }

  // 常见结构化结果字段（仅用于 debug toast 展示）
  if (typeof anyResult.id === 'number' && Number.isFinite(anyResult.id)) {
    parts.push(`id=${anyResult.id}`)
  }
  if (typeof anyResult.employeeId === 'number' && Number.isFinite(anyResult.employeeId)) {
    parts.push(`employeeId=${anyResult.employeeId}`)
  }
  if (typeof anyResult.scanCode === 'string' && anyResult.scanCode.trim()) {
    parts.push(`scanCode=${clipText(anyResult.scanCode.trim(), 40)}`)
  }
  if (typeof anyResult.code === 'string' && anyResult.code.trim()) {
    parts.push(`code=${clipText(anyResult.code.trim(), 40)}`)
  }

  if (message) parts.push(clipText(message, 60))
  return parts.join(' | ')
}

/**
 *
 * 统一处理 DocumentBase 推送的扫码事件。
 * - 负责：trim/空值分支、toast 提示、异常兜底。
 * - 不负责：具体业务分流（由调用方在 onCode 内实现）。
 * @param payload Android 扫码结果。
 * @param options 处理选项。
 *
 */
export function handleScanResultPayload(payload: ScanResultPayload, options: HandleScanResultPayloadOptions): void {
  const code = getScanCodeFromPayload(payload)
  const logTag = options.logTag ?? '[scanEntry]'

  // Android 壳通过 evaluateJavascript 回调时，WebView 可能仍处于 pause/resume 边界。
  // 这里统一延迟到下一轮事件循环再执行实际业务，避免出现“已接收扫码”但后续网络请求不触发/无反馈的情况。
  const defer = (fn: () => void) => {
    if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
      window.setTimeout(fn, 0)
      return
    }
    fn()
  }

  if (!code) {
    defer(() => {
      try {
        const r = options.onEmpty?.()
        if (isPromiseLike(r)) {
          r.catch((err) => {
            console.error(`${logTag} 处理空扫码失败:`, err)
          })
        }
      } catch (err) {
        console.error(`${logTag} 处理空扫码失败:`, err)
      }
    })
    return
  }

  const debugToastEnabled = resolveDebugToastEnabled(options)
  const timeoutMsRaw = typeof options.debugTimeoutMs === 'number' ? options.debugTimeoutMs : 12_000
  const timeoutMs = Number.isFinite(timeoutMsRaw) ? timeoutMsRaw : 12_000

  try {
    toast.info(options.receivedToastText ?? '已接收扫码，正在处理…')
  } catch {
    // ignore toast failure
  }

  if (debugToastEnabled) {
    try { toast.info(`${logTag} 扫码文本：${clipText(code, 120)}`) } catch { }
  }

  defer(() => {
    const startedAt = Date.now()
    const codeForToast = clipText(code, 80)
    let timedOut = false
    let timeoutId: any = null

    if (debugToastEnabled && timeoutMs > 0 && typeof setTimeout === 'function') {
      timeoutId = setTimeout(() => {
        timedOut = true
        try { toast.warning(`${logTag} 扫码处理超时（>${timeoutMs}ms）：${codeForToast}`) } catch { }
      }, timeoutMs)
    }

    const finalizeOk = (result: unknown) => {
      if (timeoutId) { try { clearTimeout(timeoutId) } catch { } }
      if (!debugToastEnabled) return
      const elapsed = Date.now() - startedAt
      const summary = getDebugResultSummary(result)
      const suffix = timedOut ? '（超时后完成）' : ''
      try { toast.info(`${logTag} 扫码处理完成${suffix}(${elapsed}ms)：${summary || 'OK'}`) } catch { }
    }

    const finalizeError = (err: unknown, result?: unknown) => {
      if (timeoutId) { try { clearTimeout(timeoutId) } catch { } }
      if (!debugToastEnabled) return
      const elapsed = Date.now() - startedAt
      const summary = getDebugResultSummary(result)
      const msg =
        summary ||
        (typeof err === 'object' && err !== null && 'message' in (err as any)
          ? clipText(String((err as any).message ?? ''), 60)
          : '')
      const suffix = timedOut ? '（超时后失败）' : ''
      try { toast.warning(`${logTag} 扫码处理异常${suffix}(${elapsed}ms)：${msg || 'ERROR'}`) } catch { }
    }

    try {
      const r = options.onCode(code)
      if (isPromiseLike(r)) {
        r.then((res) => {
          finalizeOk(res)
        }).catch((err) => {
          console.error(`${logTag} 处理扫码失败:`, err)
          try {
            toast.error(options.errorToastText ?? '扫码处理失败，请稍后重试')
          } catch { }
          finalizeError(err)
        })
        return
      }
      finalizeOk(r)
    } catch (err) {
      console.error(`${logTag} 处理扫码失败:`, err)
      try {
        toast.error(options.errorToastText ?? '扫码处理失败，请稍后重试')
      } catch { }
      finalizeError(err)
    }
  })
}
