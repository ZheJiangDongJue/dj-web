"use client"
import React from 'react'
import { useSearchParams } from 'next/navigation'
import type { AppCode } from '@/types/auth'
import type { ApiError } from '@/types/auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '@/lib/validation/auth'
import { AuthService } from '@/lib/auth/service'
import { DEFAULT_DB_NAME } from '@/lib/config'
import TokenStorage from '@/lib/auth/token-storage'
import {
  readSavedLoginCredentials,
  saveLoginCredentials,
} from '@/lib/auth/login-credential-storage'
import { resolveTarget, redirect } from '@/lib/auth/redirector'
import ErrorBanner from './ErrorBanner'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

interface Props {
  className?: string
  /**
   *
   * 目标应用（未传时从 URL 中读取，缺省为 erp）
   *
   */
  app?: AppCode
}

function isAppCode(v: string): v is AppCode {
  return v === 'erp' || v === 'oa' || v === 'bi'
}

export default function LoginForm({ className, app }: Props) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  // 登录成功后再由 effect 写入 Cookie 与跳转，满足 immutability 规则
  const [pendingRedirectApp, setPendingRedirectApp] = React.useState<AppCode | null>(null)
  const search = useSearchParams()
  const urlApp = React.useMemo<AppCode | null>(() => {
    const raw = search?.get('app')
    return isAppCode(raw ?? '') ? raw as AppCode : null
  }, [search])
  // 仅在首次渲染读取一次本地凭据；helper 内部已处理 SSR 与 localStorage 异常。
  const [savedCredentials] = React.useState(() => readSavedLoginCredentials())
  // 密码持久化偏好与已保存的账号独立，未勾选时仍应回填用户名但保持未勾选状态。
  const [rememberPassword, setRememberPassword] = React.useState(() => savedCredentials?.rememberPassword ?? false)
  // 优先使用 props.app；否则从 URL 查询参数读取；最终回退为 'erp'
  const initialApp = React.useMemo<AppCode>(
    () => (app ?? urlApp ?? savedCredentials?.app ?? 'erp'),
    [app, savedCredentials?.app, urlApp]
  )
  // 目标应用由调用方、URL 或已保存记录决定，不再由登录页提供下拉选择。
  const [targetApp, setTargetApp] = React.useState<AppCode>(initialApp)

  const updateTargetApp = React.useCallback((next: AppCode) => {
    setTargetApp(next)
  }, [])

  // 当外部指定 app 或 URL 参数变化时同步；无显式来源时允许本地保存的目标应用接管。
  React.useEffect(() => {
    if (app) {
      updateTargetApp(app)
      return
    }
    if (urlApp) {
      updateTargetApp(urlApp)
    }
  }, [app, updateTargetApp, urlApp])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
    reset,
  } = useForm<LoginFormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: savedCredentials?.username ?? '',
      password: savedCredentials?.password ?? '',
    },
  })

  // 水合完成后再次从本地存储回填，确保退出登录返回页面时密码字段也被明确写入 DOM。
  React.useEffect(() => {
    const saved = readSavedLoginCredentials()
    if (!saved) return

    reset({
      username: saved.username,
      password: saved.password,
    })

    if (!app && !urlApp) {
      updateTargetApp(saved.app)
    }
    setRememberPassword(saved.rememberPassword)
  }, [app, reset, updateTargetApp, urlApp])

  const onSubmit = handleSubmit(async (values) => {
    setErrorMsg(null)
    const effectiveApp = targetApp
    try {
      const res = await AuthService.login({
        username: values.username,
        password: values.password,
        provider: 'Credential',
        app: effectiveApp,
      })
      // 登录成功：写入 AccessToken（仅内存）并跳转
      TokenStorage.set(res.accessToken, {
        context: {
          app: effectiveApp,
          userId: res.user.id,
        }
      })
      // 兼容下游页面所需：将 dbName 与 userInfo 写入本地，便于 /erp/me 拉取资料时携带参数
      try {
        localStorage.setItem('erp:dbName', DEFAULT_DB_NAME)
        localStorage.setItem('erp:userInfo', JSON.stringify({ id: res.user.id, name: res.user.name, loginName: values.username }))
      } catch { /* ignore */ }
      // 无论是否勾选都保留账号；密码仅在用户明确允许时写入本地存储。
      saveLoginCredentials({
        app: effectiveApp,
        username: values.username,
        password: values.password,
        rememberPassword,
      })
      // 触发后续 effect 执行 Cookie 写入 + 跳转
      setPendingRedirectApp(effectiveApp)
    } catch (e) {
      const err = e as ApiError
      setErrorMsg(err?.message ?? '登录失败，请稍后重试')
      setFocus('password')
    }
  })

  // 成功后在 effect 中写 Cookie 并跳转（避免在回调里直接修改全局）
  React.useEffect(() => {
    if (!pendingRedirectApp) return
    try {
      const parts = [
        `dj_last_app=${pendingRedirectApp}`,
        'Path=/',
        // 180 天有效期
        'Max-Age=15552000',
        'SameSite=Lax',
      ]
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        parts.push('Secure')
      }
      document.cookie = parts.join('; ')
    } catch { /* ignore */ }
    try {
      const url = resolveTarget(pendingRedirectApp)
      redirect(url)
    } finally {
      // 避免重复触发
      setPendingRedirectApp(null)
    }
  }, [pendingRedirectApp])

  return (
    <form
      aria-labelledby="login-form-title"
      aria-busy={isSubmitting || undefined}
      onSubmit={onSubmit}
      noValidate
      className={[
        't-card t-glass l-grid',
        'p-[var(--space-3)] sm:p-[var(--space-4)]',
        className ?? '',
      ].join(' ')}
    >
      <h2 id="login-form-title" className="sr-only">
        登录表单
      </h2>

      {/* 错误提示 */}
      <ErrorBanner message={errorMsg ?? undefined} onClose={() => setErrorMsg(null)} autoHideMs={8000} />

      <div className="l-grid">
        <label htmlFor="username" className="text-sm font-medium">
          用户名
        </label>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="next"
          required
          aria-invalid={!!errors.username || undefined}
          aria-describedby={errors.username ? 'username-err' : undefined}
          disabled={isSubmitting}
          className="h-11 disabled:opacity-60"
          {...register('username')}
        />
        {errors.username && (
          <p id="username-err" className="text-xs text-rose-600 dark:text-rose-300">
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="l-grid">
        <label htmlFor="password" className="text-sm font-medium">
          密码
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            enterKeyHint="go"
            aria-invalid={!!errors.password || undefined}
            aria-describedby={errors.password ? 'password-err' : undefined}
            disabled={isSubmitting}
            className="h-11 pr-12 disabled:opacity-60"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 inline-flex items-center text-slate-500 hover:text-slate-700"
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            aria-pressed={showPassword}
            title={showPassword ? '隐藏密码' : '显示密码'}
            disabled={isSubmitting}
          >
            {showPassword ? (
              <EyeOff aria-hidden className="h-5 w-5" />
            ) : (
              <Eye aria-hidden className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-err" className="text-xs text-rose-600 dark:text-rose-300">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="l-row gap-2">
        <input
          id="remember-password"
          type="checkbox"
          checked={rememberPassword}
          onChange={(event) => setRememberPassword(event.target.checked)}
          disabled={isSubmitting}
          className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
        />
        <label htmlFor="remember-password" className="cursor-pointer select-none text-sm t-text-secondary">
          记住密码
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="t-accent h-11 min-h-11 rounded-md disabled:opacity-60"
        aria-label="提交登录"
      >
        {isSubmitting ? '登录中…' : '登录'}
      </button>
    </form>
  )
}
