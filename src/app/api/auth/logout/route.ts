import { NextRequest, NextResponse } from 'next/server'

/**
 *
 * 登出接口（由后端清 Cookie，并在同域透传 Set-Cookie）。
 * 目标：确保“后端负责清除 refreshToken/accessToken”，同时浏览器接受的是前端同域响应，
 * 从而让 Cookie 作用域位于前端域，避免跨域清理失效的问题。
 *
 */
export async function POST(req: NextRequest) {
  // 读取上游 ERP 地址
  const base = process.env.ERP_API_BASE_URL?.replace(/\/$/, '')

  // 兜底：若未配置上游，直接在当前域清除 Cookie（保证功能可用）
  if (!base) {
    const headers = new Headers()
    const expireAt = new Date(0).toUTCString()
    const common = `Path=/; SameSite=Lax; HttpOnly; Expires=${expireAt}`
    const csrfCommon = `Path=/; SameSite=Lax; Expires=${expireAt}`
    headers.append('Set-Cookie', `refreshToken=; ${common}`)
    headers.append('Set-Cookie', `accessToken=; ${common}`)
    headers.append('Set-Cookie', `csrfToken=; ${csrfCommon}`)
    return new NextResponse(JSON.stringify({ success: true, via: 'local-fallback' }), {
      status: 200,
      headers,
    })
  }

  // 将请求 Cookie 透传给上游，以便服务器定位并清除会话 Cookie
  const upstreamHeaders = new Headers()
  const cookie = req.headers.get('cookie')
  if (cookie) upstreamHeaders.set('cookie', cookie)
  upstreamHeaders.set('accept', 'application/json')
  // 提示后端原始协议，便于正确设置 Secure/SameSite
  const forwardedProto = req.headers.get('x-forwarded-proto') || (req.nextUrl.protocol.replace(':', '') || 'http')
  upstreamHeaders.set('x-forwarded-proto', forwardedProto)

  // 优先调用令牌登出（若后端支持），随后调用业务登出以确保覆盖
  const targets = [
    `${base}/api/loginapiex/Logout`,
    `${base}/Me/Logout`,
  ]

  const setCookies: string[] = []
  let lastStatus = 200
  for (const url of targets) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: upstreamHeaders,
        redirect: 'manual',
        cache: 'no-store',
      })
      lastStatus = res.status
      // 收集 Set-Cookie 头（可能多值）
      const anyHeaders = res.headers as unknown as { getSetCookie?: () => string[] }
      const multi = typeof anyHeaders.getSetCookie === 'function' ? anyHeaders.getSetCookie() : undefined
      if (Array.isArray(multi) && multi.length > 0) {
        for (const v of multi) setCookies.push(v)
      } else {
        const single = res.headers.get('set-cookie')
        if (single) setCookies.push(single)
      }
    } catch {
      // 忽略网络异常，继续尝试下一个端点
    }
  }

  // 构造同域响应并透传上游 Set-Cookie；若上游未返回，则本地兜底清除
  const headers = new Headers()
  if (setCookies.length > 0) {
    for (const c of setCookies) headers.append('Set-Cookie', c)
  } else {
    const expireAt = new Date(0).toUTCString()
    const common = `Path=/; SameSite=Lax; HttpOnly; Expires=${expireAt}`
    headers.append('Set-Cookie', `refreshToken=; ${common}`)
    headers.append('Set-Cookie', `accessToken=; ${common}`)
  }

  return new NextResponse(JSON.stringify({ success: true, via: 'backend' }), {
    status: lastStatus,
    headers,
  })
}
