'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/**
 *
 * 流程卡工序明细候选项（用于"多条当前工序明细"场景下的用户选择）。
 *
 */
export type FlowDetailPickCandidate = {
  /** 工序明细表名（如 ProcessAssemblyFlowDetail / ProduceFlowDetail） */
  readonly flowDetailTableName: string
  /** 工序明细主键 */
  readonly flowDetailId: number
  /** 可选：工种 ID（用于 UI 展示标签） */
  readonly typeofWorkId?: number
  /** 可选：LocationIndex（用于 UI 排序/展示） */
  readonly locationIndex?: number
  /** 可选：计划数（BQty） */
  readonly bQty?: number
  /** 可选：工种内容（TypeofWork.Content） */
  readonly typeofWorkContent?: string
  /** 可选：NCR 来源阶段（接收/首件/完工/末件），普通工序选择场景可为空 */
  readonly sourceStage?: number | null
}

/**
 *
 * "选择流程卡工序明细"对话框（通用）。
 * @remarks
 * - NCR/首件检验/末件检验均可复用；\n
 * - 仅负责 UI 结构与交互，不关心"确认后做什么"（由调用方传入 onPick）。\n
 *
 */
export function FlowDetailPickDialog(props: {
  readonly open: boolean
  readonly title?: string
  readonly description?: string
  readonly candidates: readonly FlowDetailPickCandidate[]
  readonly busy?: boolean
  readonly resolveWorkTypeLabel?: (id?: number) => string
  readonly onPick: (candidate: FlowDetailPickCandidate) => void | Promise<void>
  readonly onCancel: () => void
}) {
  const candidates = Array.isArray(props.candidates) ? props.candidates : []
  const resolveWorkTypeLabel = props.resolveWorkTypeLabel

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onCancel()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{props.title ?? '请选择工序明细'}</DialogTitle>
          <DialogDescription>
            {props.description ?? '检测到多条"当前工序明细"，请选择要继续处理的工种'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {candidates.map((c) => {
            const workType =
              (resolveWorkTypeLabel?.(c.typeofWorkId) ?? '') ||
              (c.typeofWorkId ? '工种ID：' + c.typeofWorkId : '工种：未知')
            const flowKind = c.flowDetailTableName.includes('ProcessAssembly')
              ? '组装'
              : c.flowDetailTableName.includes('Produce')
                ? '生产'
                : c.flowDetailTableName
            const plannedQty =
              typeof c.bQty === 'number' && Number.isFinite(c.bQty) && c.bQty > 0
                ? c.bQty
                : undefined
            const workContent = c.typeofWorkContent?.trim() || ''
            return (
              <button
                key={c.flowDetailTableName + ':' + c.flowDetailId + ':' + (c.sourceStage ?? '')}
                type="button"
                disabled={!!props.busy}
                onClick={() => void props.onPick(c)}
                className="w-full rounded-md border border-[#d0d0d0] px-3 py-2 text-left disabled:opacity-60"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-medium truncate">{workType}</span>
                    {plannedQty !== undefined && (
                      <span className="text-[12px] opacity-60 shrink-0">{plannedQty}</span>
                    )}
                  </div>
                  <span className="text-[12px] opacity-60 shrink-0">{flowKind}</span>
                </div>
                <div className="mt-1 text-[12px] opacity-60">{workContent || '无'}</div>
              </button>
            )
          })}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => props.onCancel()}
            className="h-[28px] px-3 text-[12px] rounded border border-[#797979]"
            disabled={!!props.busy}
          >
            取消
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FlowDetailPickDialog
