'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 *
 * 页面预热任务状态。
 *
 */
export type QualityPageWarmupTaskStatus = 'pending' | 'running' | 'done' | 'error'

/**
 *
 * 页面预热整体阶段。
 *
 */
export type QualityPageWarmupPhase = 'idle' | 'running' | 'done' | 'error'

/**
 *
 * 页面预热任务定义。
 * @remarks
 * - key 需要在当前页面任务列表内唯一；
 * - run 允许同步或异步，异常会被转换为当前任务的 error 状态，不阻断其它任务补齐。
 *
 */
export interface QualityPageWarmupTask {
  readonly key: string
  readonly label: string
  readonly run: () => unknown | Promise<unknown>
}

/**
 *
 * 单个预热任务的可视状态。
 *
 */
export interface QualityPageWarmupEntry {
  readonly key: string
  readonly label: string
  readonly status: QualityPageWarmupTaskStatus
  readonly errorMessage?: string
}

/**
 *
 * useQualityPageWarmup 入参。
 *
 */
export interface UseQualityPageWarmupOptions {
  readonly tasks: readonly QualityPageWarmupTask[]
  readonly autoStart?: boolean
  readonly successHoldMs?: number
}

/**
 *
 * 页面预热快照。
 *
 */
export interface QualityPageWarmupState {
  readonly phase: QualityPageWarmupPhase
  readonly visible: boolean
  readonly interactive: boolean
  readonly entries: readonly QualityPageWarmupEntry[]
  readonly totalCount: number
  readonly doneCount: number
  readonly runningCount: number
  readonly errorCount: number
  readonly pendingCount: number
  readonly summary: string
}

/**
 *
 * Hook 内部状态。
 *
 */
interface QualityPageWarmupInternalState {
  readonly taskSignature: string
  readonly phase: QualityPageWarmupPhase
  readonly visible: boolean
  readonly entries: QualityPageWarmupEntry[]
}

/**
 *
 * 将任意错误对象转换为适合展示/记录的短文本。
 * @param error 捕获到的任务异常。
 *
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error.trim()
  return '加载失败'
}

/**
 *
 * 根据任务定义构造初始可视状态。
 * @param tasks 页面预热任务列表。
 *
 */
function createEntries(tasks: readonly QualityPageWarmupTask[]): QualityPageWarmupEntry[] {
  return tasks.map((task) => ({
    key: task.key,
    label: task.label,
    status: 'pending',
  }))
}

/**
 *
 * 构建页面预热状态摘要。
 * @param phase 当前整体阶段。
 * @param doneCount 已完成任务数。
 * @param totalCount 总任务数。
 * @param errorCount 失败任务数。
 *
 */
function buildSummary(
  phase: QualityPageWarmupPhase,
  doneCount: number,
  totalCount: number,
  errorCount: number,
): string {
  if (totalCount <= 0) return '无需补齐基础数据'
  if (phase === 'done') return `基础数据已补齐 ${doneCount}/${totalCount}`
  if (phase === 'error') return `基础数据部分加载失败 ${doneCount}/${totalCount}，失败 ${errorCount} 项`
  if (phase === 'running') return `基础数据加载中 ${doneCount}/${totalCount}`
  return `基础数据待加载 0/${totalCount}`
}

/**
 *
 * 质量页面预热 Hook：统一调度“进页面后后台补齐”的基础数据任务。
 * @remarks
 * - 任务会并行启动，以减少总等待时间；
 * - 每个任务独立落状态，失败不会阻断其它任务；
 * - 返回的快照可直接交给 QualityPageWarmupStrip 做可视化提示。
 *
 */
export function useQualityPageWarmup(options: UseQualityPageWarmupOptions): QualityPageWarmupState {
  const { tasks, autoStart = true, successHoldMs = 0 } = options
  const nextTaskSignature = tasks.map((task) => task.key).join('|')
  const [internalState, setInternalState] = useState<QualityPageWarmupInternalState>(() => ({
    taskSignature: nextTaskSignature,
    phase: autoStart && tasks.length > 0 ? 'running' : tasks.length === 0 ? 'done' : 'idle',
    visible: tasks.length > 0,
    entries: createEntries(tasks).map((entry) => ({
      ...entry,
      status: autoStart && tasks.length > 0 ? 'running' : entry.status,
    })),
  }))

  if (internalState.taskSignature !== nextTaskSignature) {
    setInternalState({
      taskSignature: nextTaskSignature,
      phase: autoStart && tasks.length > 0 ? 'running' : tasks.length === 0 ? 'done' : 'idle',
      visible: tasks.length > 0,
      entries: createEntries(tasks).map((entry) => ({
        ...entry,
        status: autoStart && tasks.length > 0 ? 'running' : entry.status,
      })),
    })
  }

  useEffect(() => {
    let cancelled = false
    let hideTimer: ReturnType<typeof setTimeout> | null = null

    if (!autoStart || tasks.length === 0) {
      return () => {
        cancelled = true
      }
    }

    const markTask = (
      key: string,
      status: QualityPageWarmupTaskStatus,
      errorMessage?: string,
    ) => {
      if (cancelled) return
      setInternalState((current) => {
        if (current.taskSignature !== nextTaskSignature) return current
        return {
          ...current,
          entries: current.entries.map((entry) =>
            entry.key === key
              ? { ...entry, status, errorMessage }
              : entry,
          ),
        }
      })
    }

    void (async () => {
      const results = await Promise.all(
        tasks.map(async (task) => {
          try {
            await task.run()
            markTask(task.key, 'done')
            return true
          } catch (error) {
            markTask(task.key, 'error', getErrorMessage(error))
            return false
          }
        }),
      )

      if (cancelled) return
      const hasError = results.some((success) => !success)
      setInternalState((current) => (
        current.taskSignature === nextTaskSignature
          ? { ...current, phase: hasError ? 'error' : 'done' }
          : current
      ))

      if (!hasError && successHoldMs > 0) {
        hideTimer = setTimeout(() => {
          if (cancelled) return
          setInternalState((current) => (
            current.taskSignature === nextTaskSignature ? { ...current, visible: false } : current
          ))
        }, successHoldMs)
      }
    })()

    return () => {
      cancelled = true
      if (hideTimer) clearTimeout(hideTimer)
    }
  // 仅按任务 key 签名重启预热；页面传入的新数组引用不应导致重复拉取。
  // 任务函数由当前 effect 闭包捕获，签名变化时会开启新一轮预热。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, successHoldMs, nextTaskSignature])

  return useMemo(() => {
    const { entries, phase, visible } = internalState
    const totalCount = entries.length
    const doneCount = entries.filter((entry) => entry.status === 'done').length
    const runningCount = entries.filter((entry) => entry.status === 'running').length
    const errorCount = entries.filter((entry) => entry.status === 'error').length
    const pendingCount = entries.filter((entry) => entry.status === 'pending').length

    return {
      phase,
      visible,
      interactive: phase === 'done' || phase === 'error' || totalCount === 0,
      entries,
      totalCount,
      doneCount,
      runningCount,
      errorCount,
      pendingCount,
      summary: buildSummary(phase, doneCount, totalCount, errorCount),
    }
  }, [internalState])
}

/**
 *
 * 合并可选 className，避免为一个状态条额外引入样式依赖。
 * @param values className 片段。
 *
 */
function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

/**
 *
 * 根据任务状态返回状态点样式。
 * @param status 任务状态。
 *
 */
function getDotClass(status: QualityPageWarmupTaskStatus): string {
  if (status === 'done') return 'bg-emerald-500'
  if (status === 'error') return 'bg-red-500'
  if (status === 'running') return 'bg-[var(--color-accent)] animate-pulse'
  return 'bg-[var(--color-border)]'
}

/**
 *
 * 根据任务状态返回标签样式。
 * @param status 任务状态。
 *
 */
function getChipClass(status: QualityPageWarmupTaskStatus): string {
  if (status === 'done') return 'border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
  if (status === 'error') return 'border-red-500/35 text-red-700 dark:text-red-300'
  if (status === 'running') return 'border-[color-mix(in_srgb,var(--color-accent)_38%,transparent)] t-text-primary'
  return 'border-[var(--color-border)] t-text-tertiary'
}

/**
 *
 * 质量页面预热状态条。
 * @remarks
 * - 放在单据头顶部，提示基础数据正在后台补齐；
 * - 不承载交互，仅用 role=status 和 aria-live 向辅助技术暴露状态变化。
 *
 */
export function QualityPageWarmupStrip({
  state,
  className,
}: {
  readonly state: QualityPageWarmupState
  readonly className?: string
}) {
  if (!state.visible || state.totalCount <= 0) return null

  const stripClassName = cx(
    'rounded-md border px-2.5 py-2 text-[12px]',
    state.phase === 'error'
      ? 'border-red-500/30 bg-red-500/[0.06]'
      : state.phase === 'done'
        ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
        : 'border-[color-mix(in_srgb,var(--color-accent)_28%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-accent)_7%,transparent)]',
    className,
  )

  return (
    <div className={stripClassName} role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className={cx('size-2 shrink-0 rounded-full', getDotClass(state.phase === 'error' ? 'error' : state.phase === 'done' ? 'done' : 'running'))}
          />
          <span className="truncate font-medium t-text-primary">{state.summary}</span>
        </div>
        <span className="shrink-0 t-text-secondary">{state.doneCount}/{state.totalCount}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {state.entries.map((entry) => (
          <span
            key={entry.key}
            className={cx(
              'inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 leading-none',
              getChipClass(entry.status),
            )}
            title={entry.errorMessage}
          >
            <span aria-hidden="true" className={cx('size-1.5 rounded-full', getDotClass(entry.status))} />
            {entry.label}
          </span>
        ))}
      </div>
    </div>
  )
}
