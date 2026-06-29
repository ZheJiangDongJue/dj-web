import { HTTP_TIMEOUT_MS } from '@/lib/config'

/**
 *
 * 将外层请求的取消信号与代理自身超时合并成单个上游请求信号。
 * @remarks
 * - 浏览器端取消/超时后，Next Route Handler 会尽快中断转发到 ERP.WebApi 的 fetch；
 * - 代理自身也设置默认超时，避免上游连接或响应体读取永久挂起。
 *
 */
export function createUpstreamAbortController(req: Request): { readonly signal: AbortSignal; readonly clear: () => void } {
  const controller = new AbortController()
  const source = req.signal

  if (source?.aborted) {
    controller.abort(source.reason)
  } else {
    source?.addEventListener('abort', () => controller.abort(source.reason), { once: true })
  }

  const timeout =
    HTTP_TIMEOUT_MS > 0
      ? setTimeout(() => {
          controller.abort(new DOMException('Upstream request timed out', 'TimeoutError'))
        }, HTTP_TIMEOUT_MS)
      : null

  return {
    signal: controller.signal,
    clear: () => {
      if (timeout) clearTimeout(timeout)
    },
  }
}

/**
 *
 * 判断是否是代理取消/超时类错误。
 *
 */
export function isUpstreamAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('name' in error)) return false
  const name = (error as { name?: string }).name
  return name === 'AbortError' || name === 'TimeoutError'
}
