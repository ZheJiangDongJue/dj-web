"use client";
import type { FC } from "react";

type TabKey = "home" | "category" | "me";

type BottomTabsProps = {
  active: TabKey;
  onChange: (key: TabKey) => void;
  /**
   *
   * 底部栏定位方式：
   * - fixed：悬浮吸底（默认，覆盖内容，需要为内容区预留内边距）
   * - static：参与正常文档流（适合 Grid 布局第三行占位）
   * - sticky：粘性吸底（视需求选择）
   *
   */
  position?: "fixed" | "static" | "sticky";
};

const tabs: { key: TabKey; label: string; icon: FC<{ active: boolean }> }[] = [
  {
    key: "home",
    label: "首页",
    icon: ({ active }) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={active ? "text-blue-600" : "text-current"}
        aria-hidden
      >
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    key: "category",
    label: "功能",
    icon: ({ active }) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={active ? "text-blue-600" : "text-current"}
        aria-hidden
      >
        <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
      </svg>
    ),
  },
  {
    key: "me",
    label: "我的",
    icon: ({ active }) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={active ? "text-blue-600" : "text-current"}
        aria-hidden
      >
        <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5 0-9 2.5-9 5.5A.5.5 0 0 0 3.5 20h17a.5.5 0 0 0 .5-.5C21 16.5 17 14 12 14z" />
      </svg>
    ),
  },
];

/**
 *
 * 底部导航栏
 * - 提供可选的定位模式，以兼容不同布局方案（Fixed/Sticky/Grid）
 *
 */
export const BottomTabs: FC<BottomTabsProps> = ({ active, onChange, position = "fixed" }) => {
  const positionClass =
    position === "fixed"
      ? "fixed inset-x-0 bottom-0"
      : position === "sticky"
      ? "sticky bottom-0"
      : ""; // static
  return (
    <nav
      className={`t-surface ${positionClass} z-40 border-t border-neutral-200/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-neutral-900/75`}
      role="navigation"
      aria-label="底部切换"
    >
      <ul className="mx-auto flex h-12 max-w-[40rem] items-stretch justify-around px-2">
        {tabs.map((t) => (
          <li key={t.key} className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onChange(t.key)}
              aria-current={active === t.key ? "page" : undefined}
              className={`group flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-md text-xs font-medium transition-colors hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 ${
                active === t.key
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              <t.icon active={active === t.key} />
              <span className="truncate">{t.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
