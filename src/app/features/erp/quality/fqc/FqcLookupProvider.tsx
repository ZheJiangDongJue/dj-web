'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchActiveEmployees } from '@/lib/erp/employee'
import { toOptions } from '@/lib/erp/lookup-core'
import { fetchMaterials } from '@/lib/erp/material'
import { fetchWorkTypes } from '@/lib/erp/type-of-work'
import type {
  FqcLookupEntryStatus,
  FqcLookupOption,
  FqcLookupSnapshot,
  FqcMaterialIndex,
} from './FqcLookupTypes'

type FqcLookupContextValue = FqcLookupSnapshot & {
  refresh: () => Promise<void>
}

const initialSnapshot: FqcLookupSnapshot = {
  phase: 'loading',
  inspectorStatus: 'loading',
  materialStatus: 'loading',
  processStatus: 'loading',
  inspectorOptions: [],
  materialIndex: {},
  processOptions: [],
  errors: {},
}

const FqcLookupContext = createContext<FqcLookupContextValue | null>(null)

/**
 * 将异常转换为基础联查状态条可展示的短文本。
 * @param error 联查异常。
 * @returns 用户可读的错误原因。
 */
function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  if (typeof error === 'string' && error.trim()) return error.trim()
  return '加载失败'
}

/**
 * 将员工联查结果映射为 FQC 下拉选项。
 */
function mapInspectorOptions(list: unknown): FqcLookupOption[] {
  return toOptions(Array.isArray(list) ? list : []).map((option) => ({
    label: option.label,
    value: String(option.value),
  }))
}

/**
 * 将物料联查结果映射为 FQC 物料索引。
 * @remarks 保持现有 FQC 的字段读取规则，避免本次路由生命周期改动扩大字段兼容范围。
 */
function mapMaterialIndex(list: unknown): FqcMaterialIndex {
  const index: FqcMaterialIndex = {}
  for (const option of Array.isArray(list) ? list : []) {
    const id = String((option as any)?.value ?? '')
    const raw = (option as any)?.raw
    if (id) {
      index[id] = {
        code: raw?.code ?? '',
        name: raw?.name ?? (option as any)?.label ?? '',
      }
    }
  }
  return index
}

/**
 * 将工序联查结果映射为 FQC 下拉选项。
 */
function mapProcessOptions(list: unknown): FqcLookupOption[] {
  return (Array.isArray(list) ? list : []).map((option: any) => ({
    label: String(option?.label ?? ''),
    value: String(option?.value ?? ''),
  }))
}

/**
 * 将 Promise.allSettled 的结果转换为单类联查状态。
 */
function resolveEntryStatus<T>(result: PromiseSettledResult<T>): FqcLookupEntryStatus {
  return result.status === 'fulfilled' ? 'ready' : 'error'
}

/**
 * FQC 路由共享基础联查 Provider。
 * @remarks
 * - 该组件应放在 "/fqc" 路由布局中，使 FQC 页面与 NCR 中间页共享同一实例；
 * - 基础联查只在 Provider 首次挂载时执行；
 * - 页面切换不会销毁该快照，单据数据仍由 FQC ViewModel 单独按 ID 获取。
 */
export function FqcLookupProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<FqcLookupSnapshot>(initialSnapshot)

  const fetchSnapshot = useCallback(async (): Promise<FqcLookupSnapshot> => {
    const [inspectorResult, materialResult, processResult] = await Promise.allSettled([
      fetchActiveEmployees(),
      fetchMaterials(),
      fetchWorkTypes(),
    ])

    const inspectorStatus = resolveEntryStatus(inspectorResult)
    const materialStatus = resolveEntryStatus(materialResult)
    const processStatus = resolveEntryStatus(processResult)
    const hasError = [inspectorStatus, materialStatus, processStatus].includes('error')

    return {
      phase: hasError ? 'error' : 'ready',
      inspectorStatus,
      materialStatus,
      processStatus,
      inspectorOptions: inspectorResult.status === 'fulfilled' ? mapInspectorOptions(inspectorResult.value) : [],
      materialIndex: materialResult.status === 'fulfilled' ? mapMaterialIndex(materialResult.value) : {},
      processOptions: processResult.status === 'fulfilled' ? mapProcessOptions(processResult.value) : [],
      errors: {
        ...(inspectorResult.status === 'rejected'
          ? { inspector: toErrorMessage(inspectorResult.reason) }
          : {}),
        ...(materialResult.status === 'rejected'
          ? { material: toErrorMessage(materialResult.reason) }
          : {}),
        ...(processResult.status === 'rejected'
          ? { process: toErrorMessage(processResult.reason) }
          : {}),
      },
    }
  }, [])

  const refresh = useCallback(async () => {
    setSnapshot((current) => ({
      ...current,
      phase: 'loading',
      inspectorStatus: 'loading',
      materialStatus: 'loading',
      processStatus: 'loading',
      errors: {},
    }))
    setSnapshot(await fetchSnapshot())
  }, [fetchSnapshot])

  useEffect(() => {
    let cancelled = false
    void fetchSnapshot().then((next) => {
      if (!cancelled) setSnapshot(next)
    })
    return () => {
      cancelled = true
    }
  }, [fetchSnapshot])

  const contextValue = useMemo<FqcLookupContextValue>(
    () => ({ ...snapshot, refresh }),
    [refresh, snapshot],
  )

  return <FqcLookupContext.Provider value={contextValue}>{children}</FqcLookupContext.Provider>
}

/**
 * 读取 FQC 路由共享基础联查快照。
 * @returns 当前基础联查状态和刷新方法。
 * @throws 未挂载 FqcLookupProvider 时抛出配置错误。
 */
export function useFqcLookup(): FqcLookupContextValue {
  const context = useContext(FqcLookupContext)
  if (!context) throw new Error('useFqcLookup 必须在 FqcLookupProvider 内使用')
  return context
}

/**
 * FQC 基础联查状态提示条。
 * @remarks
 * 已完成状态不显示提示，命中共享布局状态时不会重新出现加载条。
 */
export function FqcLookupWarmupStrip({
  state,
  className,
}: {
  state: FqcLookupSnapshot
  className?: string
}) {
  if (state.phase === 'idle' || state.phase === 'ready') return null

  const summary =
    state.phase === 'loading'
      ? '基础数据加载中'
      : `基础数据部分加载失败（${Object.keys(state.errors).length} 项）`

  return (
    <div
      className={[
        'flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-xs',
        state.phase === 'loading'
          ? 'border-[color-mix(in_srgb,var(--color-accent)_38%,transparent)] t-text-primary'
          : 'border-red-500/35 text-red-700 dark:text-red-300',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
    >
      <span>{summary}</span>
      {state.phase === 'loading' && <span className="animate-pulse">请稍候…</span>}
      {state.phase === 'error' && (
        <span>
          {Object.entries(state.errors)
            .map(([key, message]) => `${key}: ${message}`)
            .join('；')}
        </span>
      )}
    </div>
  )
}
