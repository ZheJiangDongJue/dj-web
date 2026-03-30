"use client"
import React from 'react'

// 支持多主题与“系统”选项
export type ThemeId = 'light' | 'dark' | 'ocean' | 'forest' | 'rose'
export type ThemeChoice = ThemeId | 'system'

export type ThemeMeta = {
  id: ThemeId
  name: string
  desc?: string
  preview?: { bg: string; surface: string; accent: string }
}

export const THEME_REGISTRY: ThemeMeta[] = [
  { id: 'light', name: '浅色', desc: '明亮背景，适合日常办公', preview: { bg: '#ffffff', surface: '#f7f9fc', accent: '#2563eb' } },
  { id: 'dark', name: '深色', desc: '护眼深色背景', preview: { bg: '#0b0f17', surface: '#121826', accent: '#3b82f6' } },
  { id: 'ocean', name: '海洋', desc: '蓝青冷调，清爽通透', preview: { bg: '#071a24', surface: '#0d2633', accent: '#00bcd4' } },
  { id: 'forest', name: '森林', desc: '绿色自然，沉稳有氧', preview: { bg: '#0b1610', surface: '#0f1f17', accent: '#22c55e' } },
  { id: 'rose', name: '玫瑰', desc: '粉红暖调，柔和亲近', preview: { bg: '#1b0b12', surface: '#240f19', accent: '#fb7185' } },
]

type ThemeContextValue = {
  // 用户选择（含 system）
  choice: ThemeChoice
  // 实际应用到文档上的主题（不含 system）
  resolved: ThemeId
  setChoice: (t: ThemeChoice) => void
  // 界面密度（紧凑/宽松）
  density: 'compact' | 'cozy'
  setDensity: (d: 'compact' | 'cozy') => void
}

export const ThemeContext = React.createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'theme-choice'
const DENSITY_KEY = 'ui-density'

function getSystemTheme(): ThemeId {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredChoice(): ThemeChoice {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'system') return 'system'
  if (['light', 'dark', 'ocean', 'forest', 'rose'].includes(stored ?? '')) return stored as ThemeId
  return 'system'
}

/**
 *
 * applyTheme
 * 将解析后的主题应用到 html[data-theme]。
 *
 */
function applyTheme(id: ThemeId) {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.setAttribute('data-theme', id)
}

function readStoredDensity(): 'compact' | 'cozy' {
  if (typeof window === 'undefined') return 'cozy'
  const v = window.localStorage.getItem(DENSITY_KEY)
  return v === 'compact' ? 'compact' : 'cozy'
}

/**
 *
 * applyDensity
 * 将密度应用至 html[data-density]。
 *
 */
function applyDensity(v: 'compact' | 'cozy') {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-density', v)
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 初始选择与解析主题
  const [choice, setChoiceState] = React.useState<ThemeChoice>('system')
  const [resolved, setResolved] = React.useState<ThemeId>('light')
  const [density, setDensityState] = React.useState<'compact' | 'cozy'>('cozy')

  // 初始化：从存储读取选择并解析应用
  React.useEffect(() => {
    const c = readStoredChoice()
    const r = c === 'system' ? getSystemTheme() : c
    setChoiceState(c)
    setResolved(r)
    applyTheme(r)
    const d = readStoredDensity()
    setDensityState(d)
    applyDensity(d)
  }, [])

  // 监听系统主题变化（当选择为 system 时生效）
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (choice === 'system') {
        const r = getSystemTheme()
        setResolved(r)
        applyTheme(r)
      }
    }
    try { mql.addEventListener('change', onChange) } catch { mql.addListener(onChange) }
    return () => {
      try { mql.removeEventListener('change', onChange) } catch { mql.removeListener(onChange) }
    }
  }, [choice])

  const setChoice = React.useCallback((t: ThemeChoice) => {
    setChoiceState(t)
    try { window.localStorage.setItem(STORAGE_KEY, t) } catch {}
    const r = t === 'system' ? getSystemTheme() : t
    setResolved(r)
    applyTheme(r)
  }, [])

  const setDensity = React.useCallback((d: 'compact' | 'cozy') => {
    setDensityState(d)
    try { window.localStorage.setItem(DENSITY_KEY, d) } catch {}
    applyDensity(d)
  }, [])

  const value = React.useMemo(() => ({ choice, resolved, setChoice, density, setDensity }), [choice, resolved, setChoice, density, setDensity])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
