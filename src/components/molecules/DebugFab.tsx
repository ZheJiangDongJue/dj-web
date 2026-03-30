'use client'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type MouseEvent } from 'react'

export interface DebugMenuItem {
  id: string
  label: string
  onClick: () => void | Promise<void>
  icon?: ReactNode
  disabled?: boolean
}

export type DebugFabProps = {
  /**
   *
   * 是否可见：
   * - 未显式传入时，组件会自动读取 cookie: debug（true/1/yes/on）决定是否显示。
   *
   */
  visible?: boolean
  /**
   *
   * 悬浮按钮的菜单项（点击执行回调）。
   *
   */
  menuItems?: DebugMenuItem[]
  /**
   *
   * 打开/关闭状态变更回调（可选）。
   *
   */
  onOpenChange?: (open: boolean) => void
  /**
   *
   * 按钮提示文本（可选）。
   *
   */
  tooltip?: string
}

/**
 *
 * 从浏览器 cookie 中读取指定键值。
 * - 仅在客户端环境安全调用；SSR 阶段返回 undefined。
 *
 */
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  try {
    const raw = document.cookie ?? ''
    if (!raw) return undefined
    const parts = raw.split(';')
    for (const part of parts) {
      const [k, ...rest] = part.trim().split('=')
      if (k === name) return decodeURIComponent(rest.join('='))
    }
  } catch {}
  return undefined
}

/**
 *
 * 判断是否开启调试模式（cookie: debug=true/1/yes/on）。
 *
 */
function isDebugCookieEnabled(): boolean {
  const v = getCookie('debug')
  if (!v) return false
  const s = String(v).trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes' || s === 'on'
}

/**
 *
 * 全局通用：调试悬浮按钮（可注入菜单项）。
 * - 布局：固定在右侧偏下；菜单自按钮上方弹出。
 * - 主题：按钮使用 .t-accent；菜单使用 .t-card 叠加 .t-glass；尺寸随密度变量变化。
 *
 */
export function DebugFab({ visible, menuItems = [], onOpenChange, tooltip = '调试菜单' }: DebugFabProps) {
  const [open, setOpen] = useState(false)
  /**
   *
   * 首次挂载标记：
   * - 解决 SSR/CSR 初始渲染差异导致的 Hydration Mismatch。
   * - 仅在客户端挂载完成后，才根据 cookie 决定是否展示调试按钮。
   *
   */
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const shouldShow = useMemo(
    () => (typeof visible === 'boolean' ? visible : (mounted && isDebugCookieEnabled())),
    [visible, mounted],
  )

  /**
   *
   * 切换菜单开关。
   *
   */
  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev
      try { onOpenChange?.(next) } catch {}
      return next
    })
  }, [onOpenChange])

  /**
   *
   * 点击外部关闭菜单。
   *
   */
  useEffect(() => {
    if (!open) return
    const handler = (ev: Event) => {
      const el = containerRef.current
      if (!el) return
      const target = ev.target as Node | null
      if (target && el.contains(target)) return
      setOpen(false)
      try { onOpenChange?.(false) } catch {}
    }
    document.addEventListener('pointerdown', handler, { capture: true })
    return () => document.removeEventListener('pointerdown', handler, true)
  }, [open, onOpenChange])

  /**
   *
   * 键盘 ESC 关闭菜单。
   *
   */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  /**
   *
   * 标记组件已在客户端挂载：
   * - 初始渲染保持与服务器一致（不展示 DebugFab），避免水合不匹配。
   * - 挂载完成后再读取 cookie 决定是否显示。
   * - 使用 requestAnimationFrame 延后一次 tick，避免在 effect 内同步 setState 的告警。
   *
   */
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!shouldShow) return null

  return (
    <div ref={containerRef} className="fixed right-4 bottom-24 z-[60]">
      {/* 菜单 */}
      {open && (
        <div
          role="menu"
          aria-label="调试菜单"
          className="absolute bottom-full right-0 mb-2 min-w-40 t-card t-glass rounded-[var(--radius-md)] shadow-md border border-border p-[var(--space-2)]"
        >
          {menuItems.length === 0 ? (
            <div className="px-3 py-2 text-sm t-text-secondary">暂无调试项</div>
          ) : (
            <ul className="flex flex-col gap-1">
              {menuItems.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={it.disabled}
                    onClick={async (e: MouseEvent) => {
                      e.stopPropagation()
                      try { await it.onClick() } catch (err) { console.error('[DebugFab] 执行失败:', err) }
                      setOpen(false)
                      try { onOpenChange?.(false) } catch {}
                    }}
                    className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm t-text-primary hover:bg-[color-mix(in_srgb,var(--color-fg)_8%,transparent)] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="inline-flex items-center gap-2">
                      {it.icon}
                      <span>{it.label}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 悬浮按钮 */}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title={tooltip}
        onClick={toggle}
        className="t-accent rounded-full p-0 shadow-md hover:shadow-[var(--shadow-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ width: 'var(--control-h)' }}
      >
        {/* 齿轮图标 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto h-5 w-5"
          aria-hidden
        >
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09c0 .65.39 1.24 1 1.51h0c.57.26 1.24.23 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.46.46-.59 1.15-.33 1.82h0c.27.61.86 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.65 0-1.24.39-1.51 1Z" />
        </svg>
      </button>
    </div>
  )
}

export default DebugFab
