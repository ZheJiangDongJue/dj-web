'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
import {
  QualityWarmupStatusPanel,
  type QualityPageWarmupPhase,
  type QualityWarmupStatusEntry,
} from '../shared/pageWarmup'

type FqcLookupContextValue = FqcLookupSnapshot & {
  refresh: () => Promise<void>
}

/**
 * FQC 单项基础联查完成后的增量状态。
 *
 * @remarks
 * 每项请求独立回写，保证哪一项先完成，哪一项就先显示绿色状态点；不等待其它请求结束。
 */
type FqcLookupProgressPatch =
  | {
      readonly key: 'inspector'
      readonly status: 'ready'
      readonly options: FqcLookupOption[]
    }
  | {
      readonly key: 'inspector'
      readonly status: 'error'
      readonly errorMessage: string
    }
  | {
      readonly key: 'material'
      readonly status: 'ready'
      readonly materialIndex: FqcMaterialIndex
    }
  | {
      readonly key: 'material'
      readonly status: 'error'
      readonly errorMessage: string
    }
  | {
      readonly key: 'process'
      readonly status: 'ready'
      readonly options: FqcLookupOption[]
    }
  | {
      readonly key: 'process'
      readonly status: 'error'
      readonly errorMessage: string
    }

const initialSnapshot: FqcLookupSnapshot = {
  phase: 'loading',
  visible: true,
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
  const readyHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSnapshot = useCallback(async (
    onProgress?: (patch: FqcLookupProgressPatch) => void,
  ): Promise<FqcLookupSnapshot> => {
    const inspectorRequest = fetchActiveEmployees()
    const materialRequest = fetchMaterials()
    const processRequest = fetchWorkTypes()

    void inspectorRequest.then(
      (value) => onProgress?.({
        key: 'inspector',
        status: 'ready',
        options: mapInspectorOptions(value),
      }),
      (reason) => onProgress?.({
        key: 'inspector',
        status: 'error',
        errorMessage: toErrorMessage(reason),
      }),
    )
    void materialRequest.then(
      (value) => onProgress?.({
        key: 'material',
        status: 'ready',
        materialIndex: mapMaterialIndex(value),
      }),
      (reason) => onProgress?.({
        key: 'material',
        status: 'error',
        errorMessage: toErrorMessage(reason),
      }),
    )
    void processRequest.then(
      (value) => onProgress?.({
        key: 'process',
        status: 'ready',
        options: mapProcessOptions(value),
      }),
      (reason) => onProgress?.({
        key: 'process',
        status: 'error',
        errorMessage: toErrorMessage(reason),
      }),
    )

    const [inspectorResult, materialResult, processResult] = await Promise.allSettled([
      inspectorRequest,
      materialRequest,
      processRequest,
    ])

    const inspectorStatus = resolveEntryStatus(inspectorResult)
    const materialStatus = resolveEntryStatus(materialResult)
    const processStatus = resolveEntryStatus(processResult)
    const hasError = [inspectorStatus, materialStatus, processStatus].includes('error')

    return {
      phase: hasError ? 'error' : 'ready',
      visible: true,
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

  /**
   * 将单项联查结果即时合并到共享快照。
   * @param patch 已完成或失败的单项联查结果。
   */
  const applyLookupProgress = useCallback((patch: FqcLookupProgressPatch) => {
    setSnapshot((current) => {
      const errors = { ...current.errors }
      const next: FqcLookupSnapshot = { ...current, errors }

      if (patch.key === 'inspector') {
        next.inspectorStatus = patch.status
        if (patch.status === 'ready') {
          next.inspectorOptions = patch.options
          delete errors.inspector
        } else {
          errors.inspector = patch.errorMessage
        }
      } else if (patch.key === 'material') {
        next.materialStatus = patch.status
        if (patch.status === 'ready') {
          next.materialIndex = patch.materialIndex
          delete errors.material
        } else {
          errors.material = patch.errorMessage
        }
      } else {
        next.processStatus = patch.status
        if (patch.status === 'ready') {
          next.processOptions = patch.options
          delete errors.process
        } else {
          errors.process = patch.errorMessage
        }
      }

      const statuses = [next.inspectorStatus, next.materialStatus, next.processStatus]
      next.visible = true
      const allSettled = statuses.every((status) => status === 'ready' || status === 'error')
      next.phase = allSettled
        ? statuses.includes('error') ? 'error' : 'ready'
        : 'loading'
      return next
    })
  }, [])

  /**
   * 清理完成态提示条的隐藏计时器。
   */
  const clearReadyHideTimer = useCallback(() => {
    if (readyHideTimerRef.current) {
      clearTimeout(readyHideTimerRef.current)
      readyHideTimerRef.current = null
    }
  }, [])

  /**
   * 按原质检页行为，在全部基础联查成功后短暂保留绿色状态灯。
   * @param phase 联查整体阶段；错误态和加载态不启动隐藏计时器。
   */
  const scheduleReadyHide = useCallback((phase: FqcLookupSnapshot['phase']) => {
    clearReadyHideTimer()
    if (phase !== 'ready') return

    readyHideTimerRef.current = setTimeout(() => {
      readyHideTimerRef.current = null
      setSnapshot((current) => (
        current.phase === 'ready' ? { ...current, visible: false } : current
      ))
    }, 1800)
  }, [clearReadyHideTimer])

  const refresh = useCallback(async () => {
    clearReadyHideTimer()
    setSnapshot((current) => ({
      ...current,
      phase: 'loading',
      visible: true,
      inspectorStatus: 'loading',
      materialStatus: 'loading',
      processStatus: 'loading',
      errors: {},
    }))
    const next = await fetchSnapshot(applyLookupProgress)
    setSnapshot(next)
    scheduleReadyHide(next.phase)
  }, [applyLookupProgress, clearReadyHideTimer, fetchSnapshot, scheduleReadyHide])

  useEffect(() => {
    let cancelled = false
    clearReadyHideTimer()
    void fetchSnapshot((patch) => {
      if (!cancelled) applyLookupProgress(patch)
    }).then((next) => {
      if (!cancelled) {
        setSnapshot(next)
        scheduleReadyHide(next.phase)
      }
    })
    return () => {
      cancelled = true
      clearReadyHideTimer()
    }
  }, [applyLookupProgress, clearReadyHideTimer, fetchSnapshot, scheduleReadyHide])

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
 * 已完成状态短暂保留提示条，让每个已加载基础数据项先显示绿色状态点，再按原逻辑隐藏。
 */
export function FqcLookupWarmupStrip({
  state,
  className,
}: {
  state: FqcLookupSnapshot
  className?: string
}) {
  if (state.phase === 'idle' || state.visible === false) return null

  const entries: QualityWarmupStatusEntry[] = [
    {
      key: 'inspector',
      label: '检验员',
      status: mapLookupStatusToWarmupStatus(state.inspectorStatus),
      errorMessage: state.errors.inspector,
    },
    {
      key: 'material',
      label: '物料',
      status: mapLookupStatusToWarmupStatus(state.materialStatus),
      errorMessage: state.errors.material,
    },
    {
      key: 'process',
      label: '工序',
      status: mapLookupStatusToWarmupStatus(state.processStatus),
      errorMessage: state.errors.process,
    },
  ]
  const phase: QualityPageWarmupPhase = state.phase === 'loading'
    ? 'running'
    : state.phase === 'ready'
      ? 'done'
      : 'error'

  return <QualityWarmupStatusPanel phase={phase} entries={entries} className={className} />
}

/**
 * 将 FQC 联查状态映射为公共基础数据面板状态。
 * @param status FQC 单类基础联查状态。
 * @returns 公共状态面板使用的状态。
 */
function mapLookupStatusToWarmupStatus(
  status: FqcLookupEntryStatus,
): QualityWarmupStatusEntry['status'] {
  if (status === 'ready') return 'done'
  if (status === 'error') return 'error'
  if (status === 'loading') return 'running'
  return 'pending'
}
