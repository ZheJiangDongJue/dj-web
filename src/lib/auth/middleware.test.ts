import { describe, it, expect, beforeEach, vi } from 'vitest'

type CookieBag = {
  set: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

const createCookieBag = (): CookieBag => ({
  set: vi.fn(),
  delete: vi.fn(),
})

vi.mock('next/server', () => {
  return {
    NextResponse: {
      redirect: (url: URL) => ({ kind: 'redirect', url, cookies: createCookieBag() }),
      next: () => ({ kind: 'next', cookies: createCookieBag() }),
    },
  }
})

import { middleware } from '../../middleware'

type ReqInit = {
  cookies?: Record<string, string>
  search?: string
}

function createRequest(path: string, init?: ReqInit) {
  const url = new URL(`https://example.com${path}${init?.search ?? ''}`)
  const cookieStore = init?.cookies ?? {}
  return {
    cookies: {
      get: (name: string) => (name in cookieStore ? { name, value: cookieStore[name] } : undefined),
    },
    nextUrl: {
      pathname: url.pathname,
      search: url.search,
      searchParams: url.searchParams,
      origin: url.origin,
      clone: () => new URL(url.toString()),
    },
  } as any
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('未登录访问受保护路由重定向到登录页并写入 redirect_to', () => {
    const req = createRequest('/erp', { search: '?page=1' })

    const res = middleware(req)

    expect(res.kind).toBe('redirect')
    expect(res.url.pathname).toBe('/login')
    expect(res.url.searchParams.get('next')).toBe('/erp?page=1')
    expect(res.cookies.set).toHaveBeenCalledWith({
      name: 'redirect_to',
      value: '/erp?page=1',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    })
  })

  it('已登录访问 login 时跳回原地址并清理 redirect_to', () => {
    const req = createRequest('/login', { cookies: { refreshToken: 'x', redirect_to: '/erp/dashboard' } })

    const res = middleware(req)

    expect(res.kind).toBe('redirect')
    expect(res.url.pathname).toBe('/erp/dashboard')
    expect(res.cookies.delete).toHaveBeenCalledWith('redirect_to')
  })

  it('从 logout 进入 login 时允许停留在登录页', () => {
    const req = createRequest('/login?from=logout', { cookies: { refreshToken: 'x' } })

    const res = middleware(req)

    expect(res.kind).toBe('next')
  })

  it('authed login with unsafe next 参数将回落到默认页', () => {
    const req = createRequest('/login?next=//evil', { cookies: { refreshToken: 'x' } })

    const res = middleware(req)

    expect(res.kind).toBe('redirect')
    expect(res.url.pathname).toBe('/erp')
  })

  it('未登录访问 login 直接放行', () => {
    const req = createRequest('/login')

    const res = middleware(req)

    expect(res.kind).toBe('next')
  })

  it('/.well-known 前缀绕过认证逻辑', () => {
    const req = createRequest('/.well-known/health')

    const res = middleware(req)

    expect(res.kind).toBe('next')
  })

  it('未登录访问 /login/* 子路径时 next 回落到 / 避免循环', () => {
    const req = createRequest('/login/callback', { search: '?x=1' })

    const res = middleware(req)

    expect(res.kind).toBe('redirect')
    expect(res.url.pathname).toBe('/login')
    expect(res.url.searchParams.get('next')).toBe('/')
    expect(res.cookies.set).toHaveBeenCalledWith({
      name: 'redirect_to',
      value: '/',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    })
  })
})
