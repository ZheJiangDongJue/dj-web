"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRouteTransition } from "@/components/transition/RouteTransitionContext";

export type NavigateApi = {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
};

/**
 * 包装 Next.js useRouter，使每次跳转都先调用 startTransition，
 * 触发顶部进度条与 body[data-route-pending] 反馈。
 */
export function useNavigateWithTransition(): NavigateApi {
  const router = useRouter();
  const { startTransition } = useRouteTransition();

  return useMemo<NavigateApi>(
    () => ({
      push: (href) => {
        startTransition(href);
        router.push(href);
      },
      replace: (href) => {
        startTransition(href);
        router.replace(href);
      },
      back: () => {
        startTransition();
        router.back();
      },
    }),
    [router, startTransition]
  );
}
