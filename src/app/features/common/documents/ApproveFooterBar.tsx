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
   * 审批是否处于"执行中"状态：显示 spinner 与"审批中…"文本，并禁止重复点击。
   *
   */
  approveBusy?: boolean;
  /**
   *
   * 反审批是否处于"执行中"状态：显示 spinner 与"反审批中…"文本，并禁止重复点击。
   *
   */
  unapproveBusy?: boolean;
  /**
   *
   * 全局耗时操作进行中：用于联动禁用两个按钮（即便不是审批/反审批，比如保存/删除）。
   *
   */
  globalBusy?: boolean;
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
 * 内嵌轻量 Spinner（避免引入额外依赖）。
 * - 复用 Tailwind 内置 `animate-spin` 关键帧；
 * - 边框采用 currentColor，自适配主题色；
 * - 仅做装饰，对屏幕阅读器隐藏，按钮自带的 aria-busy 已足以描述状态。
 *
 */
function InlineSpinner({ size = 14 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block align-[-2px] mr-[6px] animate-spin rounded-full border-2 border-current"
      style={{
        width: size,
        height: size,
        borderTopColor: 'transparent',
      }}
    />
  );
}

/**
 *
 * 通用：底部审批操作条（保持原样式结构）
 * - 左：审批（主按钮） 右：反审批（次级按钮）
 * - 使用 t-surface/t-accent/border-border 等原有主题类
 * - 通过父级布局（DocumentPageLayout）粘到底部并参与高度计算
 * - 组件本身保留安全区 padding，避免与底部手势区域冲突
 * - 操作期间：按钮显示 spinner + "审批中…"/"反审批中…" 文案，且整体禁用以防重入
 *
 */
export function ApproveFooterBar(props: ApproveFooterBarProps) {
  const {
    onApprove,
    onUnapprove,
    approveDisabled = false,
    unapproveDisabled = false,
    approveBusy = false,
    unapproveBusy = false,
    globalBusy = false,
  } = props;

  // 仅要任何一项 busy（含全局），所有按钮一律禁用，避免并发请求/状态错乱
  const anyBusy = approveBusy || unapproveBusy || globalBusy;
  const approveBtnDisabled = !!approveDisabled || anyBusy;
  const unapproveBtnDisabled = !!unapproveDisabled || anyBusy;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[414px] px-3 pb-[env(safe-area-inset-bottom)]">        <div className="t-surface border-t border-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-neutral-900/75">
          <div className="grid grid-cols-2 gap-3 py-2">
            <button
              type="button"
              aria-label="审批"
              aria-busy={approveBusy || undefined}
              disabled={approveBtnDisabled}
              className="t-accent w-full rounded-[var(--radius-md)] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
              onClick={() => {
                if (approveBtnDisabled) return;
                void onApprove?.();
              }}
            >
              {approveBusy && <InlineSpinner />}
              {approveBusy ? '审批中…' : '审批'}
            </button>
            <button
              type="button"
              aria-label="反审批"
              aria-busy={unapproveBusy || undefined}
              disabled={unapproveBtnDisabled}
              className="w-full rounded-[var(--radius-md)] text-sm font-medium t-text-primary border border-border bg-transparent disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
              onClick={() => {
                if (unapproveBtnDisabled) return;
                void onUnapprove?.();
              }}
            >
              {unapproveBusy && <InlineSpinner />}
              {unapproveBusy ? '反审批中…' : '反审批'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApproveFooterBar;
