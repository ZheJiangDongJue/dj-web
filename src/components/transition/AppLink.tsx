"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef, useEffect, useState } from "react";
import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useRouteTransition } from "./RouteTransitionContext";

export type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  LinkProps & {
    children?: React.ReactNode;
  };

/**
 * 包装 next/link 的 Link：
 * - 点击时立即标记 data-pending=true 并触发 RouteTransition.startTransition
 * - 通过 useEffect 监听 isPending 变 false 自动清除 data-pending
 * - Ctrl/Meta/Shift/Alt/中键 / preventDefault 不触发过渡（保留浏览器原生行为）
 */
export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink(
  { onClick, href, ...rest },
  ref
) {
  const { startTransition, isPending } = useRouteTransition();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isPending && pending) {
      setPending(false);
    }
  }, [isPending, pending]);

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
