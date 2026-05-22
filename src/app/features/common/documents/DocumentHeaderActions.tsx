"use client";
import React from 'react';

/**
 *
 * 内嵌轻量 Spinner（与 ApproveFooterBar 保持一致的视觉规范）。
 * - 复用 Tailwind `animate-spin`；
 * - 颜色继承 currentColor，自适配主题色。
 *
 */
function InlineSpinner({ size = 12 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block align-[-2px] mr-[4px] animate-spin rounded-full border-2 border-current"
      style={{ width: size, height: size, borderTopColor: 'transparent' }}
    />
  );
}

export interface DocumentHeaderActionsProps {
  /**
   *
   * 新增按钮回调（一般无远程请求，可不显示 busy）。
   *
   */
  onCreate?: () => void | Promise<void>;
  /**
   *
   * 删除按钮回调（远程请求，建议结合 deleteBusy）。
   *
   */
  onDelete?: () => void | Promise<void>;
  /**
   *
   * 刷新按钮回调（远程请求，建议结合 refreshBusy）。
   *
   */
  onRefresh?: () => void | Promise<void>;
  /**
   *
   * 删除是否处于执行中：显示 spinner + "删除中…" 文本。
   *
   */
  deleteBusy?: boolean;
  /**
   *
   * 刷新是否处于执行中：显示 spinner + "刷新中…" 文本。
   *
   */
  refreshBusy?: boolean;
  /**
   *
   * 全局耗时操作进行中：禁用全部按钮，防止 race condition。
   *
   */
  globalBusy?: boolean;
  /**
   *
   * 业务自定义禁用项（与 busy 取并集后生效）。
   *
   */
  createDisabled?: boolean;
  deleteDisabled?: boolean;
  refreshDisabled?: boolean;
}

/**
 *
 * 单据顶部操作条：新增 / 删除 / 刷新。
 * - 提供统一的 busy + disabled 状态，避免在 FAI/FQC/NCR 各自维护类似 markup；
 * - 视觉与原 HeaderActions 完全一致（保持 1px 边框 + grid-cols-3 + 24px 高度）；
 * - 删除/刷新 在执行期间显示 spinner 与"删除中…/刷新中…"，并禁用所有按钮。
 *
 */
export function DocumentHeaderActions(props: DocumentHeaderActionsProps) {
  const {
    onCreate,
    onDelete,
    onRefresh,
    deleteBusy = false,
    refreshBusy = false,
    globalBusy = false,
    createDisabled = false,
    deleteDisabled = false,
    refreshDisabled = false,
  } = props;

  const anyBusy = deleteBusy || refreshBusy || globalBusy;
  const createBtnDisabled = createDisabled || anyBusy;
  const deleteBtnDisabled = deleteDisabled || anyBusy;
  const refreshBtnDisabled = refreshDisabled || anyBusy;

  return (
    <div
      className="grid grid-cols-3 gap-0 w-full border border-[#797979]"
      style={{ height: '24px', minHeight: '24px' }}
    >
      <button
        type="button"
        aria-label="新增"
        disabled={createBtnDisabled}
        className="w-full h-full leading-[24px] px-0 py-0 text-[12px] rounded-none bg-[#0079FE] text-white disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
        onClick={() => {
          if (createBtnDisabled) return;
          void onCreate?.();
        }}
      >
        新增
      </button>
      <button
        type="button"
        aria-label="删除"
        aria-busy={deleteBusy || undefined}
        disabled={deleteBtnDisabled}
        className="w-full h-full leading-[24px] px-0 py-0 text-[12px] rounded-none border-l border-[#797979] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
        onClick={() => {
          if (deleteBtnDisabled) return;
          void onDelete?.();
        }}
      >
        {deleteBusy && <InlineSpinner />}
        {deleteBusy ? '删除中…' : '删除'}
      </button>
      <button
        type="button"
        aria-label="刷新"
        aria-busy={refreshBusy || undefined}
        disabled={refreshBtnDisabled}
        className="w-full h-full leading-[24px] px-0 py-0 text-[12px] rounded-none border-l border-[#797979] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
        onClick={() => {
          if (refreshBtnDisabled) return;
          void onRefresh?.();
        }}
      >
        {refreshBusy && <InlineSpinner />}
        {refreshBusy ? '刷新中…' : '刷新'}
      </button>
    </div>
  );
}

export default DocumentHeaderActions;
