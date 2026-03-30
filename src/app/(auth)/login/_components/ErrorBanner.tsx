"use client"
import React from 'react'

export type BannerVariant = 'error' | 'warning' | 'info' | 'success'

interface ErrorBannerProps {
  message?: string | null
  className?: string
  onClose?: () => void
  /**
   *
   * 自动隐藏的毫秒数；不传或 <=0 则不自动隐藏
   *
   */
  autoHideMs?: number
  /**
   *
   * 语义角色，错误默认使用 alert
   *
   */
  role?: 'alert' | 'status'
  /**
   *
   * 样式变体，默认 error
   *
   */
  variant?: BannerVariant
}

function variantClasses(variant: BannerVariant): string {
  switch (variant) {
    case 'warning':
      return 't-banner t-banner--warning'
    case 'info':
      return 't-banner t-banner--info'
    case 'success':
      return 't-banner t-banner--success'
    case 'error':
    default:
      return 't-banner t-banner--error'
  }
}

export default function ErrorBanner({
  message,
  className,
  onClose,
  autoHideMs,
  role = 'alert',
  variant = 'error',
}: ErrorBannerProps) {
  const [open, setOpen] = React.useState<boolean>(!!message)
  const latestOnClose = React.useRef(onClose)
  // 在 effect 中同步外部回调，避免渲染期间写入 ref 触发规则
  React.useEffect(() => {
    latestOnClose.current = onClose
  }, [onClose])

  React.useEffect(() => {
    setOpen(!!message)
  }, [message])

  React.useEffect(() => {
    if (!open || !autoHideMs || autoHideMs <= 0) return
    const timer = setTimeout(() => {
      setOpen(false)
      latestOnClose.current?.()
    }, autoHideMs)
    return () => clearTimeout(timer)
  }, [open, autoHideMs])

  if (!open || !message) return null

  const cls = [variantClasses(variant), className ?? ''].join(' ')

  return (
    <div role={role} aria-live={role === 'alert' ? 'assertive' : 'polite'} className={cls}>
      <span className="sr-only">提示: </span>
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={() => {
          setOpen(false)
          latestOnClose.current?.()
        }}
        className="shrink-0 rounded px-2 py-0.5 text-xs/5 border border-transparent hover:border-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        aria-label="关闭提示"
      >
        关闭
      </button>
    </div>
  )
}
