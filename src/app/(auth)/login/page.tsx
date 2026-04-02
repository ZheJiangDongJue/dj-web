import React from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect as nextRedirect } from 'next/navigation'
import type { AppCode } from '@/types/auth'

import LoginPanel from './_components/LoginPanel'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'

export const metadata = {
  title: '东爵应用平台登录',
}

/**
 *
 * 规范化子应用标识。
 * - 输入必须是 'erp' | 'oa' | 'bi'，否则回退为 'erp'
 * @param input 外部传入的 app 标识（可空）
 * @returns 合法的 AppCode
 *
 */
function normalizeApp(input?: string | null): AppCode {
  return input === 'oa' || input === 'bi' ? input : 'erp'
}

/**
 *
 * 根据子应用标识解析其站内首页相对路径。
 * - 仅允许返回相对路径，若配置为绝对地址则回退为 '/'
 * @param app 合法的 AppCode
 * @returns 该子应用的相对根路径
 *
 */
function resolveBase(app: AppCode): string {
  const map: Record<AppCode, string | undefined> = {
    erp: process.env.NEXT_PUBLIC_APP_ERP_BASE_URL,
    oa: process.env.NEXT_PUBLIC_APP_OA_BASE_URL,
    bi: process.env.NEXT_PUBLIC_APP_BI_BASE_URL,
  }
  const raw = (map[app] || '/').trim()
  // 仅允许相对路径，避免跨站跳转导致 Cookie 不可用
  if (!raw.startsWith('/')) return '/'
  return raw
}

/**
 *
 * 登录页（SSR）
 * - 若检测到 refreshToken，视为已登录：优先跳转到 searchParams.next（若安全且有效），否则跳转到上次使用的子应用首页。
 * - 不在此处调用刷新接口并透传 Set-Cookie，统一交由 middleware 处理真实刷新与 Cookie 写入，避免丢失 Set-Cookie 的问题。
 *
 */
export default async function LoginPage({
  searchParams,
}: {
  // Next.js 15 起：searchParams 为 Promise，需要 await 再访问属性
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  // 已登录用户：直接跳转到站内首页（或目标应用首页）
  // 说明：cookie 中并不会存 accessToken（前端仅内存保存），登录态以 refreshToken 为准。
  // 因此此处只进行可见性判断，不在页面内透传 Set-Cookie；由 middleware 统一处理跳转与刷新。
  const store = await cookies()
  const rt = store.get('refreshToken')?.value
  const lastApp = normalizeApp(store.get('dj_last_app')?.value)
  const base = resolveBase(lastApp)

  // 先解析异步 searchParams，再安全读取 next / from / force
  const sp = (await searchParams) ?? {}
  const rawNext = sp.next
  const next = typeof rawNext === 'string' ? rawNext : undefined
  const safeNext = next && next.startsWith('/') && !next.startsWith('/login') ? next : undefined

  const rawFrom = sp.from
  const from = typeof rawFrom === 'string' ? rawFrom : undefined
  const isFromLogout = from === 'logout'

  const rawForce = sp.force
  const force = typeof rawForce === 'string' ? rawForce : undefined
  const forceLogin = Boolean(force && /^(?:true|1|yes|on)$/i.test(force)) || isFromLogout

  // 若存在 refreshToken，则说明登录态可用，直接跳转（优先 next 参数）
  // 但当显式要求强制进入登录页（force=1）或退出后回到登录页（from=logout）时，放行登录页渲染。
  if (rt && !forceLogin) {
    const debug = store.get('debug')?.value
    if (debug && /^(?:true|1|yes|on)$/i.test(debug)) {
      console.info('[login] detected refreshToken, redirecting', {
        hasRefreshToken: true,
        to: safeNext ?? base,
      })
    }
    nextRedirect(safeNext ?? base)
  }
  return (
    <div className="relative min-h-dvh grid grid-rows-[auto_1fr_auto] bg-app-gradient">
      <a href="#main" className="sr-only focus:not-sr-only absolute left-3 top-2 z-50 px-3 py-2 rounded bg-[var(--color-accent)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent)]">跳到主要内容</a>
      <header className="relative z-50 px-3 py-3 sm:px-6 sm:py-4 t-glass border-b border-[var(--color-border)]">
        <div className="l-container l-row justify-between">
          <Link className="text-base font-semibold tracking-tight rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent)] t-text-primary hover:opacity-90" href="/" aria-label="返回首页">
            东爵应用平台
          </Link>
          <ThemeSwitcher />
        </div>
      </header>

      <main id="main" className="px-3 sm:px-6 py-6 sm:py-10 grid items-center">
        <section
          aria-labelledby="login-title"
          className="l-container l-grid lg:grid-cols-12 lg:items-center"
        >
          <div className="hidden lg:block lg:col-span-6 xl:col-span-7 self-center">
            <div className="p-[var(--space-3)] sm:p-[var(--space-4)]">
              <h2 className="text-2xl font-semibold mb-3 t-text-primary">欢迎回来</h2>
              <p className="t-text-secondary text-sm leading-6 max-w-prose">
                统一身份认证入口，支持 ERP / OA / BI 多应用登录。请使用公司账号完成登录。
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 xl:col-span-5">
            <div className="mx-auto w-full max-w-md">
              <h1 id="login-title" className="text-xl font-semibold mb-4 t-text-primary">
                账号登录
              </h1>

              {/* Error 占位（后续由 ErrorBanner 组件替换）*/}
              <div
                id="error-region"
                role="status"
                aria-live="polite"
                className="sr-only"
              />

              <LoginPanel app={lastApp} />
            </div>
          </div>
        </section>
      </main>

      <footer className="px-3 sm:px-6 py-6 t-glass border-t border-[var(--color-border)]">
        <div className="l-container text-xs t-text-secondary">
          © {new Date().getFullYear()} 东爵信息. 保留所有权利。
        </div>
      </footer>
    </div>
  )
}
