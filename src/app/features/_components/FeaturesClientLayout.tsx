"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { notFound, usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { scanQRCode } from "@/lib/android-bridge";
import {
  registerDocumentRefreshConfirmationHandler,
  type DocumentRefreshConfirmationOptions,
} from "@/lib/documents/document-refresh-confirmation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 *
 * FeaturesLayoutContext
 * 用途：为 /features/* 路由下的页面提供“设置页面标题”的能力。
 * - 页面可以通过 `useFeaturesPageTitle(title)` 在客户端设置头部标题。
 * - 标题必须显式设置；未设置将阻止进入该路由（触发 404）。
 *
 */
type Ctx = {
  setTitle: (title: string | undefined) => void;
  clearTitle: () => void;
};

type RefreshConfirmState = {
  options: DocumentRefreshConfirmationOptions;
  resolve: (value: boolean) => void;
};

const FeaturesLayoutContext = createContext<Ctx | null>(null);

/**
 *
 * useFeaturesPageTitle
 * 在页面（客户端组件）中调用，为当前页面头设置标题。
 * 调用示例：
 *   const { setTitle } = useFeaturesPageTitle(`${module} / ${feature}`)
 * 注意：
 * - 建议在页面的顶层组件中调用，以确保标题在初始渲染后立即生效。
 * - 传入 undefined/空串 视为未设置，布局会触发 404 阻止进入。
 *
 */
export function useFeaturesPageTitle(title?: string) {
  const ctx = useContext(FeaturesLayoutContext);
  useEffect(() => {
    if (!ctx) return;
    // 标题必须显式设置为非空字符串，否则视为未设置
    ctx.setTitle(title);
    return () => {
      // 组件卸载或 title 变化时清理，避免串页。
      ctx.clearTitle();
    };
  }, [ctx, title]);

  return useMemo(() => ({ setTitle: ctx?.setTitle, clearTitle: ctx?.clearTitle }), [ctx]);
}

/**
 *
 * FeaturesClientLayout（客户端组件）
 * 职责：实现“顶部页面头 + 子页面内容区域”的通用框架，并提供上下文能力；强制要求显式标题。
 * - 顶部：左侧返回，中间标题，右侧占位（预留操作区）。
 * - 内容：除头部外的全部区域，用于渲染子页面内容，支持滚动。
 * - 安全：当没有历史记录时，返回键会跳转到合理的回退路由（/erp 或 /）。
 *
 */
export default function FeaturesClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // 由页面通过上下文设置的标题（优先级最高）。
  const [explicitTitle, setExplicitTitle] = useState<string | undefined>(undefined);
  const [refreshConfirm, setRefreshConfirm] = useState<RefreshConfirmState | null>(null);

  // 仅允许显式设置标题，删除兜底逻辑
  const title = explicitTitle;

  // 在首帧之后校验：未显式设置标题则不允许进入（触发 404）
  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!title || title.trim().length === 0) {
          notFound();
        }
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
    // 当路径或标题变化时重新校验；标题由子页面设置
  }, [pathname, title]);

  // 返回逻辑：如果没有历史记录则跳指定路由。
  const onBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    // 根据路径选择较为合理的回退页面
    if ((pathname || "").startsWith("/features/erp")) {
      router.push("/erp");
    } else {
      router.push("/");
    }
  }, [pathname, router]);

  const ctxValue = useMemo<Ctx>(() => ({
    // 只接受非空标题，其余视为未设置
    setTitle: (t?: string) => {
      if (typeof t === "string" && t.trim().length > 0) {
        setExplicitTitle(t.trim());
      } else {
        setExplicitTitle(undefined);
      }
    },
    clearTitle: () => setExplicitTitle(undefined),
  }), []);

  const handleScan = useCallback(async () => {
    try {
      await scanQRCode();
    } catch (error) {
      console.error("[FeaturesClientLayout] 触发扫码失败:", error);
      try {
        toast.error("无法启动扫码，请确认运行在安卓终端");
      } catch {
        // ignore toast failure
      }
    }
  }, []);

  const closeRefreshConfirm = useCallback((value: boolean) => {
    setRefreshConfirm((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  useEffect(() => {
    return registerDocumentRefreshConfirmationHandler((options) => {
      return new Promise<boolean>((resolve) => {
        setRefreshConfirm((current) => {
          current?.resolve(false);
          return { options, resolve };
        });
      });
    });
  }, []);

  return (
    <FeaturesLayoutContext.Provider value={ctxValue}>
      <div className="flex min-h-dvh h-dvh flex-col overflow-hidden">
        {/* 页头：只负责布局与骨架，颜色/圆角等为主题层职责 */}
        <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/90 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-neutral-800 dark:bg-neutral-900/75 dark:supports-[backdrop-filter]:bg-neutral-900/60">
          <div className="mx-auto grid max-w-[120rem] grid-cols-3 items-center">
            {/* 左：返回 */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={onBack}
                aria-label="返回上一页"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:active:bg-neutral-700/60"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-5"
                  aria-hidden
                >
                  <path d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">返回</span>
              </button>
            </div>

            {/* 中：标题（居中） */}
            <div className="flex items-center justify-center">
              <h1 className="line-clamp-1 text-base font-semibold text-neutral-900 dark:text-white md:text-lg">
                {title}
              </h1>
            </div>

            {/* 右：扫码入口 */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleScan}
                aria-label="扫码"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:active:bg-neutral-700/60"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-5"
                  aria-hidden
                >
                  <path d="M3 7h4V3H3v4zm14 0h4V3h-4v4zM3 21h4v-4H3v4zm14 0h4v-4h-4v4z" />
                  <path d="M9 13h6M9 17h2m4 0h2M13 9h2" />
                </svg>
                <span className="hidden sm:inline">扫码</span>
              </button>
            </div>
          </div>
        </header>

        {/* 内容区：占据除头部外的全部空间 */}
        <main className="flex min-h-0 flex-1 flex-col">
          {children}
        </main>

        <Dialog
          open={!!refreshConfirm}
          onOpenChange={(open) => {
            if (!open) closeRefreshConfirm(false);
          }}
        >
          <DialogContent className="max-w-[22rem]" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>单据已被修改</DialogTitle>
              <DialogDescription>
                是否更新到最新？
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                onClick={() => closeRefreshConfirm(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-700 active:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                onClick={() => closeRefreshConfirm(true)}
              >
                更新
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FeaturesLayoutContext.Provider>
  );
}
