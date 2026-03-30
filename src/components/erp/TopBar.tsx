"use client";
import type { FC } from "react";

type TopBarProps = {
  title: string;
};

export const TopBar: FC<TopBarProps> = ({ title }) => {
  return (
    <header
      className="t-surface sticky top-0 z-40 w-full border-b border-neutral-200/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-neutral-900/75"
      role="banner"
    >
      <div className="mx-auto flex h-12 max-w-[120rem] items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white">ERP</span>
          <h1 className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100 md:text-lg">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* 预留：搜索/密度/主题切换 */}
        </div>
      </div>
    </header>
  );
};

