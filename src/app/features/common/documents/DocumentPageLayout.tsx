"use client";
import { PropsWithChildren, ReactNode } from "react";
import { MainFill } from "@/components/layout/MainFill";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

/**
 *
 * 通用：单据页面布局（头 + 明细 + 工具条）
 * - 不关心业务字段，仅负责布局与结构分区
 * - 头部/明细/工具条均由外部传入（children 或 render props）
 *
 */
/**
 *
 * 只读包裹层：当 enabled=true 时，将子树设置为只读，不可编辑。
 * - 通过 fieldset disabled 统一禁用原生表单控件（保留滚动能力）
 * - data-readonly 标记可供样式或子组件探测是否处于只读状态
 *
 */
function ReadOnlyScope(props: { enabled?: boolean; children: React.ReactNode; className?: string }) {
  const { enabled, children, className } = props;
  if (!enabled) {
    if (!className) return <>{children}</>;
    return <div className={className}>{children}</div>;
  }
  return (
    <div
      aria-readonly="true"
      data-readonly="true"
      className={clsx('relative', className)}
    >
      {/* 使用 display: contents 避免影响布局盒模型 */}
      <fieldset disabled className="contents">{children}</fieldset>
    </div>
  );
}

export default function DocumentPageLayout({
  header,
  details,
  footer,
  className,
  sectionClassName,
  headerWrapperClassName,
  detailsWrapperClassName,
  footerWrapperClassName,
  /**
   *
   * 是否只读：当为 true 时，整页内容（header + details）进入只读，
   * 通过 ReadOnlyScope 统一禁用交互；footer（如 反审批 按钮区）保持可用。
   *
   */
  readOnly,
}: PropsWithChildren<{
  /**
   *
   * 单据头区域（表头）
   *
   */
  header: ReactNode;
  /**
   *
   * 明细区域
   *
   */
  details: ReactNode;
  /**
   *
   * 底部工具条（审批/反审批等）
   *
   */
  footer?: ReactNode;
  /**
   *
   * 外层 className，可选（作用于 MainFill）
   *
   */
  className?: string;
  /**
   *
   * section 的额外类名（用于自定义栅格/间距等），不会覆盖默认语义类
   * - 例如：传入模块化 CSS 的布局类，以复用既有网格布局
   *
   */
  sectionClassName?: string;
  /**
   *
   * 头部包裹层额外类名（合并进默认 px-3）
   *
   */
  headerWrapperClassName?: string;
  /**
   *
   * 明细包裹层额外类名（合并进默认 mt-[2px] px-3）
   *
   */
  detailsWrapperClassName?: string;
  /**
   *
   * 底部 footer 包裹层的额外类名（用于粘底或跨页面复用）
   *
   */
  footerWrapperClassName?: string;
  /**
   *
   * 是否只读（未传则走自动检测）
   *
   */
  readOnly?: boolean;
}>) {
  // 计算类名（合并 Tailwind 类，后者优先）
  const sectionCls = twMerge(
    clsx(
      'mx-auto flex w-full max-w-[414px] flex-1 flex-col px-0 overflow-hidden min-h-0',
      sectionClassName,
    ),
  );
  const headerWrapCls = twMerge(clsx('px-3 shrink-0', headerWrapperClassName));
  const detailsWrapCls = twMerge(
    clsx(
      'mt-[2px] flex-1 min-h-0 px-3 overflow-y-auto overflow-x-hidden',
      detailsWrapperClassName,
    ),
  );
  const footerWrapCls = twMerge(
    clsx('shrink-0', footerWrapperClassName),
  );

  // 自动只读：若页面（通过质量模块的共享 Hook）写入了 window.__dj_doc_readonly，则按其值控制
  let autoReadOnly = false;
  try {
    // @ts-ignore - 运行时可选全局开关
    autoReadOnly = typeof window !== 'undefined' && window.__dj_doc_readonly === true;
  } catch {}
  const effectiveReadOnly = readOnly ?? autoReadOnly;

  return (
    <MainFill className={className ?? 'w-full'}>
      <ReadOnlyScope
        enabled={!!effectiveReadOnly}
        className="flex flex-1 flex-col min-h-0"
      >
        <section className={sectionCls}>
          {/* 单据头 */}
          <div className={headerWrapCls}>{header}</div>
          {/* 明细区 */}
          <div className={detailsWrapCls}>{details}</div>
        </section>
      </ReadOnlyScope>
      {footer ? <div className={footerWrapCls}>{footer}</div> : null}
    </MainFill>
  );
}
