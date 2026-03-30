"use client"
import React from 'react'
import { createPortal } from 'react-dom'
import { ThemeContext, THEME_REGISTRY, type ThemeChoice, type ThemeId } from '@/components/theme/ThemeProvider'
import styles from './theme-switcher.module.css'

type Option = { id: ThemeChoice; name: string; desc?: string; preview?: { bg: string; surface: string; accent: string } }

const OPTIONS: Option[] = [
  { id: 'system' as ThemeChoice, name: '跟随系统', desc: '自动匹配系统浅/深色' },
  ...THEME_REGISTRY,
]

export default function ThemeSwitcher({ className }: { className?: string }) {
  const ctx = React.useContext(ThemeContext)
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = React.useState<{ top: number; right: number } | null>(null)
  

  const { choice, resolved, setChoice, density, setDensity } = ctx ?? {
    choice: 'system' as ThemeChoice,
    resolved: 'light' as ThemeId,
    setChoice: () => {},
    density: 'cozy' as 'compact' | 'cozy',
    setDensity: () => {},
  }

  const current = OPTIONS.find(o => o.id === choice) ?? OPTIONS[0]

  // 计算面板定位（相对视口固定定位，右对齐触发器）
  const updatePos = React.useCallback(() => {
    if (!open) return
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const right = Math.max(8, window.innerWidth - rect.right)
    const top = Math.max(8, rect.bottom)
    setPos({ top, right })
  }, [open])

  React.useEffect(() => {
    if (!open) return
    updatePos()
    const onResize = () => updatePos()
    const onScroll = () => updatePos()
    window.addEventListener('resize', onResize)
    // 使用捕获以便在任意可滚容器内滚动也能及时更新
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, updatePos])


  return (
    <div ref={containerRef} className={[styles.root, className ?? ''].join(' ')}>
      <button
        type="button"
        className={[styles.btn, 't-accent rounded-md px-3 py-1.5 text-xs/5'].join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        主题：{current.name}<span className="hidden lg:inline">{choice === 'system' && `(当前解析：${labelOf(resolved)})`}</span>
      </button>

      {open && pos && createPortal(
        <div
          className={styles.layer}
          role="presentation"
          aria-hidden={false}
          onMouseDown={() => setOpen(false)}
        >
          <div
            ref={panelRef}
            className={styles.panel}
            data-open={open ? 'true' : 'false'}
            // 固定定位到触发器下方，右对齐
            style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 1000 }}
            // 阻止面板内点击冒泡到遮罩，从而避免误关闭
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={[styles.card, 't-card'].join(' ')}>
              <div className={styles.header}>
                <div className={styles.title}>选择主题</div>
                <div className={styles.subtitle}>选择配色风格，实时预览</div>
              </div>
              <div
                className={styles.list}
                role="listbox"
                tabIndex={0}
                aria-label="选择主题"
              >
                {OPTIONS.map((opt) => (
                  <div
                    key={String(opt.id)}
                    role="option"
                    aria-selected={opt.id === choice}
                    className={styles.option}
                    onClick={() => { setChoice(opt.id); setOpen(false) }}
                  >
                    <div className={styles.swatch} aria-hidden>
                      {renderSwatches(opt, resolved)}
                    </div>
                    <div>
                      <div className={styles.label}>{opt.name}</div>
                      {opt.desc && <div className={styles.desc}>{opt.desc}</div>}
                    </div>
                    {opt.id === choice && <span aria-hidden>✓</span>}
                  </div>
                ))}
              </div>
              <div className={styles.footer}>
                <span className={styles.density}>
                  <span>当前解析：{labelOf(resolved)}</span>
                  <span aria-hidden="true">｜</span>
                  <span>密度：</span>
                  <div className={styles.seg} role="radiogroup" aria-label="界面密度">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={density === 'compact'}
                      className={[styles.segBtn, density === 'compact' ? styles.segBtnSelected : ''].join(' ')}
                      onClick={() => setDensity('compact')}
                    >紧凑</button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={density === 'cozy'}
                      className={[styles.segBtn, density === 'cozy' ? styles.segBtnSelected : ''].join(' ')}
                      onClick={() => setDensity('cozy')}
                    >宽松</button>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function labelOf(id: ThemeId): string {
  return (THEME_REGISTRY.find(t => t.id === id)?.name) ?? id
}

function renderSwatches(opt: Option, resolved: ThemeId) {
  // system 选项使用已解析主题的示例色块
  const p = opt.id === 'system'
    ? previewById(resolved)
    : opt.preview || previewById('light')
  return (
    <>
      <span className={styles.dot} style={{ background: p.bg }} />
      <span className={styles.dot} style={{ background: p.surface }} />
      <span className={styles.dot} style={{ background: p.accent }} />
    </>
  )
}

function previewById(id: ThemeId) {
  const t = THEME_REGISTRY.find(x => x.id === id)
  return t?.preview || { bg: '#fff', surface: '#f5f5f5', accent: '#2563eb' }
}
