import { NextRequest, NextResponse } from 'next/server'
import { createUpstreamAbortController, isUpstreamAbortError } from '@/app/api/_shared/upstreamProxyTimeout'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = { path?: string[] }

// 服务端可使用动态访问（Node 运行时读取）
function getEnv(name: string): string | undefined {
  try {
    return process.env?.[name]
  } catch {
    return undefined
  }
}

function joinPath(parts: string[]): string {
  return parts
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
}

/**
 * 将路径拆成不带空段的片段，供上游前缀去重使用。
 *
 * 浏览器端 ERP 客户端的 controllerPath 本身包含 `/api`，而同源代理的
 * catch-all 参数也会收到这个片段；上游前缀已经存在时不能再次拼接。
 */
function splitPath(value: string): string[] {
  return value
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
}

/**
 * 在请求路径缺少上游前缀时补齐前缀；已有前缀时保持原样。
 *
 * 这样同时兼容 `/api/erp/FlowScanApi/...` 与 `/api/erp/api/FlowScanApi/...`
 * 两种历史调用方式，最终都只向 ERP.WebApi 转发一个 `/api`。
 */
function prependPrefixOnce(pathParts: string[], prefix: string): string[] {
  const normalizedPath = pathParts.flatMap(splitPath)
  const normalizedPrefix = splitPath(prefix)
  if (normalizedPrefix.length === 0) return normalizedPath

  const alreadyPrefixed = normalizedPrefix.every(
    (part, index) => normalizedPath[index]?.toLowerCase() === part.toLowerCase(),
  )
  return alreadyPrefixed ? normalizedPath : [...normalizedPrefix, ...normalizedPath]
}

function getUpstreamPrefix(): string {
  const v = getEnv('ERP_UPSTREAM_PREFIX')
  // ERP.WebApi 的控制器统一挂在 /api 下；只有显式配置空字符串时才允许直连根路径。
  // 这样未配置 ERP_UPSTREAM_PREFIX 的默认环境不会把 /api/erp/... 转发成错误的 /... 路径。
  return v === undefined ? 'api' : v.trim()
}

function buildTargetURL(req: NextRequest, params: Params): URL | null {
  const base = getEnv('ERP_API_BASE_URL')?.replace(/\/$/, '')
  if (!base) return null
  const prefix = getUpstreamPrefix()
  const seg = joinPath(prependPrefixOnce(params.path ?? [], prefix))
  const search = req.nextUrl.search
  return new URL(`${base}/${seg}${search}`)
}

function buildUpstreamHeaders(req: NextRequest): Headers {
  const h = new Headers()
  const src = req.headers

  // 允许的转发头（避免传递 hop-by-hop 头）
  const allow = [
    'accept',
    'accept-language',
    'content-type',
    'authorization',
    'cookie',
    'user-agent',
    'x-request-id',
    'x-forwarded-for',
    'x-forwarded-proto',
    'x-csrf-token',
  ]

  for (const k of allow) {
    const v = src.get(k)
    if (v) h.set(k, v)
  }

  // 确保携带 Cookie（与 credentials 语义一致）
  const cookie = src.get('cookie')
  if (cookie) h.set('cookie', cookie)

  return h
}

async function proxy(req: NextRequest, params: Params) {
  const target = buildTargetURL(req, params)
  if (!target) {
    // 配置缺失：避免暴露内部细节
    return NextResponse.json({ code: 'SERVICE_UNAVAILABLE', message: '服务暂不可用' }, { status: 503 })
  }

  const method = req.method
  const headers = buildUpstreamHeaders(req)

  let body: BodyInit | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const buf = await req.arrayBuffer()
      if (buf && buf.byteLength > 0) body = buf
    } catch {
      // 读取 body 失败时，不携带主体
    }
  }

  const abort = createUpstreamAbortController(req)
  let upstream: Response
  let buf: ArrayBuffer
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
      signal: abort.signal,
    })
    buf = await upstream.arrayBuffer()
  } catch (error) {
    if (isUpstreamAbortError(error)) {
      console.error('[erp-proxy] upstream fetch timeout', {
        method,
        path: target.pathname,
      })
      return NextResponse.json({ code: 'NETWORK_TIMEOUT', message: '请求超时，请稍后重试' }, { status: 504 })
    }
    // 网络异常：记录最小必要信息，不包含敏感内容
    console.error('[erp-proxy] upstream fetch failed', {
      method,
      path: target.pathname,
    })
    return NextResponse.json({ code: 'NETWORK_ERROR', message: '网络异常，请稍后重试' }, { status: 502 })
  } finally {
    abort.clear()
  }

  // 读取上游响应体并复制头部（保留 Set-Cookie）
  const resHeaders = new Headers()

  // 先复制除 set-cookie 外的头部
  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase()
    if (k === 'set-cookie' || k === 'content-length' || k === 'content-encoding') return
    resHeaders.set(key, value)
  })

  // 保留 Set-Cookie（可能多值）
  const headerLike = upstream.headers as unknown as { getSetCookie?: () => string[] }
  const setCookies: string[] | undefined = typeof headerLike.getSetCookie === 'function' ? headerLike.getSetCookie() : undefined
  if (Array.isArray(setCookies) && setCookies.length > 0) {
    for (const c of setCookies) resHeaders.append('set-cookie', c)
  } else {
    const single = upstream.headers.get('set-cookie')
    if (single) resHeaders.set('set-cookie', single)
  }

  return new NextResponse(buf, { status: upstream.status, headers: resHeaders })
}

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  const params = await ctx.params
  return proxy(req, params)
}
export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  const params = await ctx.params
  return proxy(req, params)
}
export async function PUT(req: NextRequest, ctx: { params: Promise<Params> }) {
  const params = await ctx.params
  return proxy(req, params)
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<Params> }) {
  const params = await ctx.params
  return proxy(req, params)
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<Params> }) {
  const params = await ctx.params
  return proxy(req, params)
}
export async function HEAD(req: NextRequest, ctx: { params: Promise<Params> }) {
  const params = await ctx.params
  return proxy(req, params)
}
export async function OPTIONS(req: NextRequest, ctx: { params: Promise<Params> }) {
  const params = await ctx.params
  return proxy(req, params)
}
