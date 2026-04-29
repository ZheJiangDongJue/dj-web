"use client";

import { useEffect } from "react";

/**
 * ERP 功能导航页错误边界
 * 捕获页面渲染异常，提供用户友好的错误提示和重试入口
 */
export default function FeaturesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ERP 功能导航页加载失败:", error);
  }, [error]);

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-[var(--space-3)] p-[var(--space-4)]"
      role="alert"
    >
      <svg
        className="h-16 w-16 text-[var(--color-error-fg)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <h2 className="text-lg font-semibold text-[var(--color-fg)]">页面加载失败</h2>
      <p className="text-sm text-[color-mix(in_srgb,var(--color-fg)_82%,transparent)]">
        请检查网络连接后重试
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-[var(--space-4)] py-[var(--space-2)] text-sm font-medium text-white transition-colors duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
      >
        重新加载
      </button>
    </div>
  );
}
