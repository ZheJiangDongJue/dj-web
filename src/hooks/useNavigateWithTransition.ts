"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRouteTransition } from "@/components/transition/RouteTransitionContext";
import {
  allowNextDocumentLeaveConfirmation,
  allowNextDocumentLeaveNavigation,
  confirmDocumentLeave,
  hasDocumentLeaveGuard,
} from "@/lib/documents/document-leave-confirmation";

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
        const navigate = () => {
          startTransition(href);
          router.push(href);
        };
        if (!hasDocumentLeaveGuard()) {
          navigate();
          return;
        }
        void confirmDocumentLeave().then((allowed) => {
          if (!allowed) return;
          allowNextDocumentLeaveConfirmation();
          navigate();
        });
      },
      replace: (href) => {
        const navigate = () => {
          startTransition(href);
          router.replace(href);
        };
        if (!hasDocumentLeaveGuard()) {
          navigate();
          return;
        }
        void confirmDocumentLeave().then((allowed) => {
          if (!allowed) return;
          allowNextDocumentLeaveConfirmation();
          navigate();
        });
      },
      back: () => {
        const navigate = () => {
          startTransition();
          router.back();
        };
        if (!hasDocumentLeaveGuard()) {
          navigate();
          return;
        }
        void confirmDocumentLeave().then((allowed) => {
          if (!allowed) return;
          allowNextDocumentLeaveNavigation(true);
          navigate();
        });
      },
    }),
    [router, startTransition]
  );
}
