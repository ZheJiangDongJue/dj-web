"use client"

import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_DB_NAME } from '@/lib/config'
import { CheckAuthCached } from '@/lib/erp/auth-api'
import { Permissions } from '@/types/erp-db.generated'

export type ErpAuthState = {
  dbName: string
  userId: number
}

export type ErpPagePermissionsStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface UseErpPagePermissionsOptions {
  /**
   *
   * 账套名（dbName）；未提供时优先尝试 localStorage，再回退 DEFAULT_DB_NAME。
   *
   */
  dbName?: string
  /**
   *
   * 用户 id（userId）；未提供时尝试从 localStorage 读取。
   *
   */
  userId?: number
  /**
   *
   * 需要校验的权限位；默认 Permissions.浏览（用于“入口可见性”）。
   *
   */
  auth?: Permissions
  /**
   *
   * 是否启用权限加载（默认 true）。
   * - 适用于某些页面在未登录态/未准备好 userId 时延后加载。
   *
   */
  enabled?: boolean
}

function safeParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 *
 * 从 localStorage 读取 ERP 登录态的最小信息（dbName/userId）。
 * - 本项目约定：登录成功后写入 `erp:dbName` 与 `erp:userInfo`（不包含敏感信息）。
 * - 若读取失败返回 null，由调用方决定降级策略（例如：不做过滤或提示重试）。
 *
 */
export function readErpAuthStateFromLocalStorage(): ErpAuthState | null {
  if (typeof window === 'undefined') return null
  try {
    const dbNameRaw = window.localStorage.getItem('erp:dbName')
    const userRaw = window.localStorage.getItem('erp:userInfo')
    const dbName = (dbNameRaw ?? DEFAULT_DB_NAME).trim()
    if (!dbName) return null

    if (!userRaw) return null
    const userObj = safeParseJson(userRaw) as { id?: unknown } | null
    const id = Number(userObj?.id)
    if (!Number.isFinite(id) || id <= 0) return null

    return { dbName, userId: id }
  } catch {
    return null
  }
}

/**
 *
 * 批量加载页面权限（PageName -> 是否允许）。
 * - 当前仅用于“入口可见性”，默认校验 `Permissions.浏览`。
 * - 返回值：允许访问的 PageName 集合（Set）。
 *
 */
async function loadAllowedPageNames({
  dbName,
  userId,
  pageNames,
  auth,
}: {
  dbName: string
  userId: number
  pageNames: string[]
  auth: Permissions
}): Promise<Set<string>> {
  const results = await Promise.all(
    pageNames.map(async (pageName) => {
      const ok = await CheckAuthCached({ dbName, userId, pageName, auth })
      return ok ? pageName : null
    }),
  )
  return new Set(results.filter((x): x is string => typeof x === 'string' && x.trim().length > 0))
}

/**
 *
 * Hook：基于 AuthApi.CheckAuth（后端内部调用 AuthModel）获取 PageName 对应的可见权限集合。
 *
 */
export function useErpPagePermissions(pageNames: Array<string | null | undefined>, options?: UseErpPagePermissionsOptions) {
  const enabled = options?.enabled ?? true
  const auth = options?.auth ?? Permissions.浏览
  const overrideDbName = (options?.dbName ?? '').trim()
  const overrideUserId = options?.userId

  const normalizedPageNames = useMemo(() => {
    const list = pageNames
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter((x) => x.length > 0)
    // 去重 + 排序，保证依赖稳定（避免因为顺序不同导致重复请求）
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b))
  }, [pageNames])

  const pageKey = useMemo(() => normalizedPageNames.join('|'), [normalizedPageNames])

  const [status, setStatus] = useState<ErpPagePermissionsStatus>('idle')
  const [error, setError] = useState<unknown>(null)
  const [allowedPageNames, setAllowedPageNames] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    const schedule = (fn: () => void) => {
      // 避免在 effect 主体内同步 setState（eslint: react-hooks/set-state-in-effect）
      Promise.resolve().then(() => {
        if (cancelled) return
        fn()
      })
    }

    // 空列表：无需请求，直接 ready
    if (!pageKey) {
      schedule(() => {
        setAllowedPageNames((prev) => (prev.size === 0 ? prev : new Set()))
        setStatus('ready')
        setError(null)
      })
      return () => {
        cancelled = true
      }
    }

    const fromStorage = readErpAuthStateFromLocalStorage()
    const dbName = overrideDbName || fromStorage?.dbName || DEFAULT_DB_NAME
    const userId =
      (Number.isFinite(Number(overrideUserId)) && Number(overrideUserId) > 0 ? Number(overrideUserId) : undefined) ??
      fromStorage?.userId ??
      0

    if (!dbName || !Number.isFinite(userId) || userId <= 0) {
      // 无法确定 userId 时不发请求，交由调用方决定降级策略
      schedule(() => {
        setAllowedPageNames((prev) => (prev.size === 0 ? prev : new Set()))
        setStatus('error')
        setError(new Error('无法获取用户信息（userId），无法加载权限。'))
      })
      return () => {
        cancelled = true
      }
    }

    schedule(() => {
      setStatus('loading')
      setError(null)
    })

    void loadAllowedPageNames({ dbName, userId, pageNames: pageKey.split('|'), auth })
      .then((allowed) => {
        if (cancelled) return
        setAllowedPageNames(allowed)
        setStatus('ready')
      })
      .catch((e) => {
        if (cancelled) return
        setAllowedPageNames((prev) => (prev.size === 0 ? prev : new Set()))
        setStatus('error')
        setError(e)
      })

    return () => {
      cancelled = true
    }
  }, [auth, enabled, overrideDbName, overrideUserId, pageKey])

  return { status, error, allowedPageNames }
}
