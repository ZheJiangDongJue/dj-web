import { NextRequest, NextResponse } from 'next/server'

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
  return parts.map((p) => p.replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/')
}

// 读取用于对接 ERP 后端登录接口（如 Api/LoginApiEx）的上游路径前缀
// 通过环境变量 ERP_AUTH_UPSTREAM_PREFIX 配置；未配置时保持现有默认前缀 'api/auth'
function getAuthUpstreamPrefix(): string {
  const v = getEnv('ERP_AUTH_UPSTREAM_PREFIX')
  return (v && v.trim()) || 'api/auth'
}

function buildTargetURL(req: NextRequest, params: Params): URL | null {
  const base = getEnv('ERP_API_BASE_URL')?.replace(/\/$/, '')
  if (!base) return null
  // 允许将 /api/auth/[...path] 代理到任意上游前缀（例如 Api/LoginApiEx）
  const prefix = getAuthUpstreamPrefix()
  const seg = joinPath([prefix, ...(params.path ?? [])])
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

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
    })
  } catch (e) {
    // 网络异常：记录最小必要信息，不包含敏感内容
    console.error('[auth-proxy] upstream fetch failed', {
      method,
      path: target.pathname,
    })
    return NextResponse.json({ code: 'NETWORK_ERROR', message: '网络异常，请稍后重试' }, { status: 502 })
  }

  // 读取上游响应体并复制头部（保留 Set-Cookie）
  const buf = await upstream.arrayBuffer()
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
