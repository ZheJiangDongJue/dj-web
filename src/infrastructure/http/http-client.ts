import { API_BASE, HTTP_TIMEOUT_MS } from '@/lib/config'
import { createAuthFetch, type CreateAuthFetchOptions } from './auth-fetch'

export interface HttpClientOptions {
  /**
   *
   * 后端基地址，默认读取 API_BASE
   *
   */
  baseUrl?: string
  /**
   *
   * 底层 fetch，可注入测试专用 mock
   *
   */
  fetch?: typeof fetch
  /**
   *
   * 认证拦截配置，传入则自动注入 Authorization 并支持刷新
   *
   */
  auth?: Omit<CreateAuthFetchOptions, 'fetch'>
  /**
   *
   * 默认请求头（后续可被覆盖）
   *
   */
  defaultHeaders?: HeadersInit
  /**
   *
   * 超时时间，默认使用配置项 HTTP_TIMEOUT_MS
   *
   */
  timeoutMs?: number
}

function mergeHeaders(base?: HeadersInit, extra?: HeadersInit): Headers {
  const merged = new Headers(base || {})
  if (extra) {
    new Headers(extra).forEach((v, k) => merged.set(k, v))
  }
  return merged
}

function resolveUrl(baseUrl: string, path: string | URL): string | URL {
  if (typeof path !== 'string') {
    return path
  }
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  const trimmed = baseUrl.replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${trimmed}${normalized}`
}

function linkSignal(origin: AbortSignal, target: AbortController) {
  if (origin.aborted) {
    target.abort(origin.reason)
    return
  }
  origin.addEventListener(
    'abort',
    () => {
      target.abort(origin.reason)
    },
    { once: true }
  )
}

/**
 *
 * 基础 HttpClient：封装超时与可选认证拦截。
 * - request 始终合并默认头
 * - 若提供 auth，将自动使用 createAuthFetch 处理 401/403 重试
 *
 */
export class HttpClient {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch
  private readonly defaultHeaders: HeadersInit
  private readonly timeoutMs: number

  constructor(options?: HttpClientOptions) {
    const baseFetch = options?.fetch ?? globalThis.fetch
    if (!baseFetch) {
      throw new Error('FETCH_NOT_AVAILABLE')
    }

    this.baseUrl = (options?.baseUrl ?? API_BASE).replace(/\/$/, '')
    this.defaultHeaders = options?.defaultHeaders ?? {}
    this.timeoutMs = options?.timeoutMs ?? HTTP_TIMEOUT_MS

    this.fetchImpl = options?.auth
      ? createAuthFetch({ ...options.auth, fetch: baseFetch })
      : baseFetch
  }

  async request(path: string | URL, init: RequestInit = {}): Promise<Response> {
    const url = resolveUrl(this.baseUrl, path)
    const headers = mergeHeaders(this.defaultHeaders, init.headers)

    const controller = new AbortController()
    if (init.signal) {
      linkSignal(init.signal, controller)
    }
    const timer =
      this.timeoutMs > 0
        ? setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), this.timeoutMs)
        : null

    try {
      return await this.fetchImpl(url, { ...init, headers, signal: controller.signal })
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
}

export default HttpClient
