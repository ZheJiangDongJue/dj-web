"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useState } from "react";
import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useRouteTransition } from "./RouteTransitionContext";
import {
  allowNextDocumentLeaveConfirmation,
  confirmDocumentLeave,
  hasDocumentLeaveGuard,
} from "@/lib/documents/document-leave-confirmation";

export type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  LinkProps & {
    children?: React.ReactNode;
  };

/**
 * 包装 next/link 的 Link：
 * - 点击时立即标记 data-pending=true 并触发 RouteTransition.startTransition
 * - 当全局 isPending 由 true 变 false 时，于渲染期间清除本地 pending
 *   （合法的 derived state 模式，避免 effect 内同步 setState）
 * - Ctrl/Meta/Shift/Alt/中键 / preventDefault 不触发过渡（保留浏览器原生行为）
 */
export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink(
  { onClick, href, ...rest },
  ref
) {
  const { startTransition, isPending } = useRouteTransition();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [prevIsPending, setPrevIsPending] = useState(isPending);

  // 渲染期间侦测 isPending 变化，true → false 时清空本地 pending
  if (prevIsPending !== isPending) {
    setPrevIsPending(isPending);
    if (!isPending && pending) {
      setPending(false);
    }
  }

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    ) {
      return;
    }

    const targetPath =
      typeof href === "string" ? href : e.currentTarget.getAttribute("href") ?? "";
    const isExternalHref = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(targetPath);
    if (isExternalHref || rest.target === "_blank" || rest.download) {
      // 外部地址、新窗口和下载不会离开当前文档，交给浏览器原生行为处理。
      return;
    }
    if (hasDocumentLeaveGuard()) {
      e.preventDefault();
      setPending(true);
      void confirmDocumentLeave().then((allowed) => {
        if (!allowed) {
          setPending(false);
          return;
        }
        if (!targetPath) {
          setPending(false);
          return;
        }
        allowNextDocumentLeaveConfirmation();
        startTransition(targetPath);
        router.push(targetPath);
      });
      return;
    }

    setPending(true);
    startTransition(typeof href === "string" ? href : undefined);
  }

  return (
    <Link
      {...rest}
      href={href}
      ref={ref}
      onClick={handleClick}
      data-pending={pending ? "true" : undefined}
    />
  );
});
