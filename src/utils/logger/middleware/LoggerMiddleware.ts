/**
/**
 * LoggerMiddleware
 * Next.js 中间件集成：为每个请求生成/传播 requestId，并在转发与响应头中携带。
 * 说明：
 * - 该文件仅依赖 `next/server` 与 Web API，适用于 Next.js 中间件（Edge 运行时）。
 * - 我们不在此处直接依赖 ContextManager（其在 Node 侧使用 ALS），
 *   中间件的职责是将 requestId 注入到请求头，后续在 Route Handler/Server Component 内可读取此头，
 *   再结合 ContextManager.runWith(...) 建立请求范围上下文。
 */

import { NextRequest, NextResponse } from 'next/server'

export const REQUEST_ID_HEADER = 'x-request-id'
export const REQUEST_START_HEADER = 'x-request-start'

function generateRequestId(): string {
  // Web Crypto API（Edge 环境可用）。
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // 兜底：时间戳+随机数
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function ensureRequestId(request: NextRequest): string {
  const existing = request.headers.get(REQUEST_ID_HEADER) || request.cookies.get(REQUEST_ID_HEADER)?.value
  return existing || generateRequestId()
}

/**
 *
 * 生成包含追踪信息的响应对象，向下游传递 requestId。
 * 使用方式（项目根）：
 * middleware.ts
 *   import { loggerMiddleware } from './src/utils/logger/middleware/LoggerMiddleware'
 *   export const config = { matcher: ['/((?!_next|static).*)'] }
 *   export default loggerMiddleware
 */
export function loggerMiddleware(request: NextRequest): NextResponse {
  const requestId = ensureRequestId(request)

  // 将 requestId 注入转发的请求头
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(REQUEST_ID_HEADER, requestId)

  // 标记请求开始时间（用于后续度量）
  const start = Date.now().toString()
  requestHeaders.set(REQUEST_START_HEADER, start)

  // 继续下游处理（携带自定义头）
  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // 同时在响应头回传 requestId，便于客户端与网关追踪
  response.headers.set(REQUEST_ID_HEADER, requestId)
  response.headers.set(REQUEST_START_HEADER, start)

  // 可选：同步到 Cookie，保证后续跨跳转仍可关联。
  // 注意：在严格跨域/安全场景下可关闭此行为或设置更严格的属性。
  response.cookies.set(REQUEST_ID_HEADER, requestId, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  })

  return response
}

/**
 *
 * 从 NextRequest 提取可用于 ContextManager 的上下文信息。
 * 在服务端 Route Handler 内：
 *   const ctx = extractRequestContext(req)
 *   ContextManager.runWith(ctx, () => {/* 你的处理逻辑 *\/})
 *
 */
export function extractRequestContext(request: NextRequest) {
  const requestId = request.headers.get(REQUEST_ID_HEADER) || request.cookies.get(REQUEST_ID_HEADER)?.value
  return requestId ? { requestId } : {}
}

export default loggerMiddleware
