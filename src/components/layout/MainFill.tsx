"use client";
import type { HTMLAttributes, PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

export interface MainFillProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

/**
 *
 * MainFill 布局容器
 * 用途：统一为页面或模块提供“占满父级剩余空间”的布局能力，
 * 仅关注布局（不侵入主题），避免误用视口高度导致的滚动/收缩问题。
 * 行为说明：
 * - 应用于父级为 flex 容器（通常是 flex-col）时，使用 `flex-1 min-h-0` 占据剩余空间；
 * - 组件内部不处理滚动，如需滚动可在子级区域单独设置 `overflow-auto`；
 * - 支持额外 className 合并，遵循 Tailwind 的优先级与冲突合并规则。
 *
 */
export function MainFill({ className, children, ...rest }: MainFillProps) {
  return (
    <div
      {...rest}
      className={twMerge(clsx("flex flex-col flex-1 min-h-0", className))}
    >
      {children}
    </div>
  );
}

