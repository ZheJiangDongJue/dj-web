/**
 * 全局通用骨架屏（兜底）
 * - 通过 .app-loading-root 的 200ms animation-delay 实现"延迟显示"
 *   200ms 内完成的跳转，骨架屏永远不会被看见
 * - 布局：标题占位 + 响应式卡片网格（手机 2 列 / 平板 3 / PC 4）
 * - 颜色：使用 var(--color-skeleton) / var(--color-border)，自动跟随主题
 */
export default function GlobalLoading() {
  return (
    <div
      className="app-loading-root flex h-full min-h-0 flex-col"
      role="status"
      aria-label="加载中"
    >
      {/* 标题占位 */}
      <div className="px-[var(--space-3)] py-[var(--space-3)]">
        <div className="h-6 w-32 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />
      </div>

      {/* 响应式卡片网格 */}
      <div className="flex-1 px-[var(--space-3)] pb-[var(--space-3)]">
        <div className="grid grid-cols-2 gap-[var(--space-3)] sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-[var(--space-3)]"
            >
              <div className="h-10 w-10 rounded-full bg-[var(--color-skeleton)] animate-pulse" />
              <div className="h-4 w-16 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />
              <div className="h-3 w-24 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
