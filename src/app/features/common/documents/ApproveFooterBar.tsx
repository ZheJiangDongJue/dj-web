"use client";
import React from 'react';

export interface ApproveFooterBarProps {
  /**
   *
   * 审批是否禁用
   *
   */
  approveDisabled?: boolean;
  /**
   *
   * 反审批是否禁用
   *
   */
  unapproveDisabled?: boolean;
  /**
   *
   * 审批触发
   *
   */
  onApprove?: () => void | Promise<void>;
  /**
   *
   * 反审批触发
   *
   */
  onUnapprove?: () => void | Promise<void>;
}

/**
 *
 * 通用：底部审批操作条（保持原样式结构）
 * - 左：审批（主按钮） 右：反审批（次级按钮）
 * - 使用 t-surface/t-accent/border-border 等原有主题类
 * - 通过父级布局（DocumentPageLayout）粘到底部并参与高度计算
 * - 组件本身保留安全区 padding，避免与底部手势区域冲突
 *
 */
export function ApproveFooterBar(props: ApproveFooterBarProps) {
  // 标准属性解构并设置默认值
  const {
    onApprove,
    onUnapprove,
    approveDisabled = false,
    unapproveDisabled = false,
  } = props;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[414px] px-3 pb-[env(safe-area-inset-bottom)]">
        <div className="t-surface border-t border-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-neutral-900/75">
          <div className="grid grid-cols-2 gap-3 py-2">
            <button
              type="button"
              aria-label="审批"
              disabled={!!approveDisabled}
              className="t-accent w-full rounded-[var(--radius-md)] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => void onApprove?.()}
            >
              审批
            </button>
            <button
              type="button"
              aria-label="反审批"
              disabled={!!unapproveDisabled}
              className="w-full rounded-[var(--radius-md)] text-sm font-medium t-text-primary border border-border bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => void onUnapprove?.()}
            >
              反审批
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApproveFooterBar;
