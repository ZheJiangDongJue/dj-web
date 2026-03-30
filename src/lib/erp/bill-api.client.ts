/**
 *
 * ERP Bill API 客户端实现
 * - 与后端 @ERP.WebApi/Controllers/Api/BillApiController.cs 的 Action 同名对接
 * - 提供 BillApiClient 类用于生成按 Action 名调用的代理对象
 * - 认证与刷新：复用全局 authFetch（自动附加 Authorization，401/403 自动刷新）
 *
 */

import authFetch from '@/lib/auth/interceptor'
import { API_BASE } from '@/lib/config'
import type { ApiEnvelope, ApiError as AuthApiError } from '@/types/auth'

// ========================= 类型定义 =========================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface BillApiClientOptions {
  /**
   *
   * 后端根地址，如 http://localhost:5000
   *
   */
  baseUrl?: string
  /**
   *
   * 控制器路由前缀，默认 '/api/BillApi'（与 .NET 路由保持一致）
   *
   */
  controllerPath?: string
  /**
   *
   * 默认请求超时时间（毫秒），默认 20000ms
   *
   */
  timeoutMs?: number
}

export interface ActionCallOptions {
  /**
   *
   * 指定 HTTP 方法；不指定则按命名启发式推断
   *
   */
  method?: HttpMethod
  /**
   *
   * 查询参数（用于 GET 或与路径拼接）
   *
   */
  query?: Record<string, unknown>
  /**
   *
   * 请求体（用于 POST/PUT/PATCH）
   *
   */
  body?: unknown
  /**
   *
   * 额外请求头
   *
   */
  headers?: Record<string, string>
  /**
   *
   * 取消信号
   *
   */
  signal?: AbortSignal
  /**
   *
   * 覆盖单次调用的超时（毫秒）
   *
   */
  timeoutMs?: number
}

export type BillApiActionCaller = <TRes = unknown>(options?: ActionCallOptions) => Promise<TRes>

export interface BillApiActions {
  /**
   *
   * 动态：任意属性名都被当做后端 Action 同名方法
   * 例如：BillApi.List({ query: { page: 1 } }) 将请求 GET {base}/api/Bill/List?page=1
   *
   */
  [actionName: string]: BillApiActionCaller
}

// ========================= 工具函数 =========================

/**
 *
 * 安全 JSON 解析，失败返回 null
 * @param text 原始字符串
 *
 */
function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

/**
 *
 * 将对象序列化为查询串（浅层，数组多值展开）。
 * - 仅处理一层键值，值为基本类型/Date/数组
 * @param query 查询对象
 *
 */
function toQueryString(query?: Record<string, unknown>): string {
  if (!query || Object.keys(query).length === 0) return ''
  const parts: string[] = []
  for (const [key, raw] of Object.entries(query)) {
    if (raw === undefined || raw === null) continue
    const enc = (v: unknown) => encodeURIComponent(String(v))
    if (Array.isArray(raw)) {
      for (const v of raw) parts.push(`${encodeURIComponent(key)}=${enc(v instanceof Date ? v.toISOString() : v)}`)
    } else {
      const val = raw instanceof Date ? raw.toISOString() : raw
      parts.push(`${encodeURIComponent(key)}=${enc(val)}`)
    }
  }
  return parts.length ? `?${parts.join('&')}` : ''
}

/**
 *
 * 将后端错误体统一为 Error 对象（包含 code、message、status、url、action 等上下文）。
 * @param input 原始错误体
 * @param ctx   扩展上下文
 *
 */
function toUnifiedError(input: unknown, ctx: { status?: number; url?: string; action?: string }): Error {
  const api = input as Partial<AuthApiError & { code?: string; message?: string }>
  const code = api?.code || 'UNKNOWN_ERROR'
  const message = api?.message || '请求失败，请稍后重试'
  const err = new Error(message) as Error & { code?: string; status?: number; url?: string; action?: string }
  err.code = code
  err.status = ctx.status
  err.url = ctx.url
  err.action = ctx.action
  return err
}

function pickErrorMessageFromJson(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null
  const any = json as Record<string, unknown>
  const candidates: unknown[] = [
    any.message,
    (any as any).Message,
    any.errorMessage,
    (any as any).ErrorMessage,
    any.error,
    (any as any).Error,
    any.msg,
    (any as any).Msg,
  ]
  for (const v of candidates) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

/**
 *
 * 根据 Action 名推断 HTTP 方法：
 * - 以 Get/List/Query/Fetch 开头：GET
 * - 以 Delete/Remove 开头：DELETE
 * - 以 Update/Edit/Put 开头：PUT
 * - 以 Patch 开头：PATCH
 * - 其他：POST
 * @param action 后端 Action 名
 *
 */
function inferMethodByAction(action: string): HttpMethod {
  const name = action.toLowerCase()
  if (name.startsWith('get') || name.startsWith('list') || name.startsWith('query') || name.startsWith('fetch')) return 'GET'
  if (name.startsWith('delete') || name.startsWith('remove')) return 'DELETE'
  if (name.startsWith('update') || name.startsWith('edit') || name.startsWith('put')) return 'PUT'
  if (name.startsWith('patch')) return 'PATCH'
  return 'POST'
}

// ========================= 客户端实现 =========================

export class BillApiClient {
  private readonly baseUrl: string
  private readonly controllerPath: string
  private readonly timeoutMs: number

  /**
   *
   * 构造函数
   * @param options 可选参数：后端根地址、控制器路径、默认超时
   *
   */
  constructor(options?: BillApiClientOptions) {
    this.baseUrl = (options?.baseUrl ?? API_BASE).replace(/\/$/, '')
    this.controllerPath = `/${(options?.controllerPath ?? '/api/BillApi').replace(/^\/+/, '')}`
    this.timeoutMs = options?.timeoutMs ?? 20_000
  }

  /**
   *
   * 构造完整 URL（含查询串）
   * @param action 接口 Action 名（与后端方法同名）
   * @param query  查询参数
   * @returns 完整绝对 URL
   *
   */
  private buildUrl(action: string, query?: Record<string, unknown>): string {
    const qs = toQueryString(query)
    return `${this.baseUrl}${this.controllerPath}/${encodeURIComponent(action)}${qs}`
  }

  /**
   *
   * 原样获取后端响应体（不做信封解包，不改写结构）。
   * 约定：
   * 1) 若响应体可被 JSON 解析，则直接返回该 JSON（可能是统一信封，也可能是任意对象）
   * 2) 若非 JSON，则在 2xx 时返回原始文本（string）
   * 3) 204/空体：返回 null
   * 4) 非 2xx 状态：尽量从返回体提取错误信息，统一抛出 Error
   * 注意：与 callAction 不同，本方法不会对形如 ApiEnvelope<T> 的数据做「success 判断」与 data 解包，
   *       以便调用方自行决定如何处理。
   * @param action  后端 Action 名
   * @param options 请求选项（方法、查询、体、头、超时等）
   *
   */
  async callActionRaw<TRaw = unknown>(action: string, options?: ActionCallOptions): Promise<TRaw> {
    const method: HttpMethod = options?.method ?? inferMethodByAction(action)
    const url = this.buildUrl(action, method === 'GET' ? options?.query : undefined)

    const headers = new Headers(options?.headers)
    if (!headers.has('Accept')) headers.set('Accept', 'application/json')
    if (method !== 'GET' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? this.timeoutMs)

    try {
      const res = await authFetch(url, {
        method,
        headers,
        body: method === 'GET' ? undefined : options?.body ? JSON.stringify(options.body) : undefined,
        signal: options?.signal ?? controller.signal,
        credentials: 'include',
      })

      const status = res.status
      const raw = await res.text()

      // 空体处理
      if (!raw) {
        if (status === 204) return null as TRaw
        if (!res.ok) throw toUnifiedError({ code: 'UNKNOWN_ERROR', message: `请求失败（HTTP ${status}）` }, { status, url, action })
        return null as TRaw
      }

      // 优先尝试 JSON 解析；解析失败则按文本处理
      const json = safeJsonParse<unknown>(raw)
      if (!json) {
        if (res.ok) return raw as unknown as TRaw
        const snippet = raw.slice(0, 200).trim()
        throw toUnifiedError(
          { code: 'UNKNOWN_ERROR', message: snippet ? `${snippet}（HTTP ${status}）` : `请求失败（HTTP ${status}）` },
          { status, url, action },
        )
      }

      // 保持「原样」返回解析出的 JSON（不做信封解包）
      if (res.ok) return json as TRaw

      // 非 2xx：尽量提取 message
      const msg = pickErrorMessageFromJson(json)
      throw toUnifiedError({ code: 'UNKNOWN_ERROR', message: msg || `请求失败（HTTP ${status}）` }, { status, url, action })
    } catch (err) {
      // 统一二次包装（可能来自网络/超时/Abort）
      const isAbortError = (e: unknown): boolean =>
        typeof e === 'object' && e !== null && 'name' in e && (e as { name?: string }).name === 'AbortError'
      const hasCode = (e: unknown): e is { code?: string } =>
        typeof e === 'object' && e !== null && 'code' in e

      if (isAbortError(err)) {
        throw toUnifiedError({ code: 'NETWORK_TIMEOUT', message: '请求超时' }, { url, action })
      }
      if (hasCode(err)) {
        throw err as Error
      }
      const msg = typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message?: unknown }).message ?? '')
        : ''
      throw toUnifiedError({ code: 'UNKNOWN_ERROR', message: msg || '网络异常' }, { url, action })
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   *
   * 调用某个后端 Action
   * 约定：
   * 1) 若响应符合 ApiEnvelope<T> 且 success=true，则返回 data
   * 2) 若响应符合 ApiEnvelope<T> 且 success=false，则抛出统一错误
   * 3) 若为普通 JSON，则直接返回该 JSON
   * 4) 204/空体：返回 null
   * @param action  后端 Action 名
   * @param options 请求选项（方法、查询、体、头、超时等）
   *
   */
  async callAction<TRes = unknown>(action: string, options?: ActionCallOptions): Promise<TRes> {
    const method: HttpMethod = options?.method ?? inferMethodByAction(action)
    const url = this.buildUrl(action, method === 'GET' ? options?.query : undefined)

    const headers = new Headers(options?.headers)
    if (!headers.has('Accept')) headers.set('Accept', 'application/json')
    if (method !== 'GET' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? this.timeoutMs)

    try {
      const res = await authFetch(url, {
        method,
        headers,
        body: method === 'GET' ? undefined : options?.body ? JSON.stringify(options.body) : undefined,
        signal: options?.signal ?? controller.signal,
        credentials: 'include',
      })

      const status = res.status
      const raw = await res.text()
      if (!raw) {
        if (status === 204) return null as TRes
        if (!res.ok) throw toUnifiedError({ code: 'UNKNOWN_ERROR', message: `请求失败（HTTP ${status}）` }, { status, url, action })
        return null as TRes
      }

      const json = safeJsonParse<unknown>(raw)
      if (!json) {
        // 返回的不是 JSON
        if (res.ok) return raw as unknown as TRes
        const snippet = raw.slice(0, 200).trim()
        throw toUnifiedError(
          { code: 'UNKNOWN_ERROR', message: snippet ? `${snippet}（HTTP ${status}）` : `请求失败（HTTP ${status}）` },
          { status, url, action },
        )
      }

      // 优先尝试按照统一信封解析
      const env = json as Partial<ApiEnvelope<TRes>>
      const looksLikeEnvelope = typeof env === 'object' && env !== null && 'success' in env && 'code' in env && 'message' in env
      if (looksLikeEnvelope) {
        if (res.ok && env.success) {
          return (env.data as TRes)
        }
        throw toUnifiedError({ code: env.code, message: env.message }, { status, url, action })
      }

      // 否则当作普通 JSON
      if (res.ok) return json as TRes
      // 尝试用 { message } 或 { error } 生成错误
      const msg = pickErrorMessageFromJson(json)
      throw toUnifiedError({ code: 'UNKNOWN_ERROR', message: msg || `请求失败（HTTP ${status}）` }, { status, url, action })
    } catch (err) {
      // 统一二次包装（可能来自网络/超时/Abort）
      const isAbortError = (e: unknown): boolean =>
        typeof e === 'object' && e !== null && 'name' in e && (e as { name?: string }).name === 'AbortError'
      const hasCode = (e: unknown): e is { code?: string } =>
        typeof e === 'object' && e !== null && 'code' in e

      if (isAbortError(err)) {
        throw toUnifiedError({ code: 'NETWORK_TIMEOUT', message: '请求超时' }, { url, action })
      }
      if (hasCode(err)) {
        throw err as Error
      }
      const msg = typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message?: unknown }).message ?? '')
        : ''
      throw toUnifiedError({ code: 'UNKNOWN_ERROR', message: msg || '网络异常' }, { url, action })
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   *
   * 以“方法同名”的形式暴露接口（动态 Proxy）
   * - 访问任意属性名时，返回一个函数 (options) => callAction(actionName, options)
   * - 用法示例：
   *   const BillApi = client.asActions()
   *   const data = await BillApi.GetList({ query: { page: 1 } })
   *
   */
  asActions(): BillApiActions {
    const call = this.callAction.bind(this)
    return new Proxy<Record<string, BillApiActionCaller>>({}, {
      get(_t, prop) {
        if (typeof prop !== 'string') return undefined as unknown as BillApiActionCaller
        const action = prop
        const fn: BillApiActionCaller = (options?: ActionCallOptions) => call(action, options)
        return fn
      },
    }) as BillApiActions
  }

  /**
   *
   * 以“方法同名”的形式暴露接口，但返回原始响应结构（不做信封解包）。
   * - 用法示例：
   *   const BillApi = client.asActionsRaw()
   *   const envelope = await BillApi.GetList({ query: { page: 1 } })
   *
   */
  asActionsRaw(): BillApiActions {
    const call = this.callActionRaw.bind(this)
    return new Proxy<Record<string, BillApiActionCaller>>({}, {
      get(_t, prop) {
        if (typeof prop !== 'string') return undefined as unknown as BillApiActionCaller
        const action = prop
        const fn: BillApiActionCaller = (options?: ActionCallOptions) => call(action, options)
        return fn
      },
    }) as BillApiActions
  }
}

export default BillApiClient
