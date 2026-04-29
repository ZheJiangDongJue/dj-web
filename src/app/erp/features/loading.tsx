"use client";

/**
 * ERP 功能导航页加载骨架屏
 * 在分类切换期间显示，模拟左侧导航 + 右侧卡片网格的布局结构
 */
export default function Loading() {
  return (
    <div className="flex h-full overflow-hidden" aria-label="加载中" role="status">
      {/* 左侧导航骨架 */}
      <aside className="w-[100px] flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] sm:w-[100px] md:w-[120px] lg:w-[160px]">
        <div className="space-y-[var(--space-2)] p-[var(--space-3)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse"
            />
          ))}
        </div>
      </aside>

      {/* 右侧功能网格骨架 */}
      <main className="flex-1 overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-[var(--space-3)] py-[var(--space-3)]">
          <div className="h-6 w-24 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />
        </div>
        <div className="p-[var(--space-3)]">
          <div className="grid grid-cols-3 gap-[var(--space-3)] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-[var(--space-3)]"
              >
                <div className="h-10 w-10 rounded-full bg-[var(--color-skeleton)] animate-pulse sm:h-12 sm:w-12" />
                <div className="h-4 w-16 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
