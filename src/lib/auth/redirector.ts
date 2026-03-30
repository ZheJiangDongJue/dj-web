import type { AppCode } from '@/types/auth'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.location !== 'undefined'
}

function getOrigin(): string | undefined {
  return isBrowser() ? window.location.origin : undefined
}

// 静态映射：确保 NEXT_PUBLIC_* 在构建期被内联（客户端可用）
const PUBLIC_APP_BASE: Record<AppCode, string | undefined> = {
  erp: process.env.NEXT_PUBLIC_APP_ERP_BASE_URL,
  oa: process.env.NEXT_PUBLIC_APP_OA_BASE_URL,
  bi: process.env.NEXT_PUBLIC_APP_BI_BASE_URL,
} as const

function getAppBase(app: AppCode): string | undefined {
  return PUBLIC_APP_BASE[app]
}

function normalizeApp(app?: string): AppCode {
  return app === 'oa' || app === 'bi' ? app : 'erp'
}

function normalizeBaseToURL(base: string | undefined): URL | null {
  if (!base || base.trim() === '') return null
  const trimmed = base.trim()
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      return new URL(trimmed)
    }
    const origin = getOrigin()
    if (origin && trimmed.startsWith('/')) {
      return new URL(trimmed, origin)
    }
  } catch {
    // ignore parse error
  }
  return null
}

function collectAllowedPrefixes(): string[] {
  const prefixes: string[] = []
  const origin = getOrigin()
  if (origin) prefixes.push(origin.replace(/\/$/, ''))
  const erp = normalizeBaseToURL(PUBLIC_APP_BASE.erp)
  const oa = normalizeBaseToURL(PUBLIC_APP_BASE.oa)
  const bi = normalizeBaseToURL(PUBLIC_APP_BASE.bi)
  for (const u of [erp, oa, bi]) {
    if (u) prefixes.push(u.toString().replace(/\/$/, ''))
  }
  return Array.from(new Set(prefixes))
}

function isAllowedRedirect(target: URL): boolean {
  if (!(target.protocol === 'http:' || target.protocol === 'https:')) return false
  const prefixes = collectAllowedPrefixes()
  const href = target.toString()
  return prefixes.some((p) => href.startsWith(p + '/') || href === p)
}

export function resolveTarget(app?: AppCode): URL {
  const code = normalizeApp(app as unknown as string | undefined)
  // 优先读取对应 app 的基址，找不到则回退到当前站点根
  const baseStr = getAppBase(code)
  const normalized = normalizeBaseToURL(baseStr)
  if (normalized) return normalized

  // 回退策略：浏览器环境使用同源根；非浏览器返回 about:blank，避免误导
  const origin = getOrigin()
  return origin ? new URL('/', origin) : new URL('about:blank')
}

export function redirect(url: URL): void {
  if (!isAllowedRedirect(url)) {
    // 阻止开放式跳转
    throw new Error('OPEN_REDIRECT_BLOCKED')
  }
  if (isBrowser()) {
    try {
      window.location.assign(url.toString())
    } catch {
      // ignore
    }
  }
}

const redirector = { resolveTarget, redirect }
export default redirector

