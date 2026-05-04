/**
 * /erp/home 专属骨架屏
 * 与首页 Empty 占位结构对齐：圆形图标 + 标题 + 描述
 */
export default function HomeLoading() {
  return (
    <div
      className="app-loading-root flex h-full min-h-0 flex-col items-center justify-center gap-[var(--space-3)] p-[var(--space-4)]"
      role="status"
      aria-label="加载中"
    >
      {/* 圆形图标占位 */}
      <div className="h-16 w-16 rounded-full bg-[var(--color-skeleton)] animate-pulse" />

      {/* 标题占位 */}
      <div className="h-6 w-24 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />

      {/* 描述占位（两行） */}
      <div className="flex flex-col items-center gap-[var(--space-2)]">
        <div className="h-3 w-64 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />
        <div className="h-3 w-48 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />
      </div>
    </div>
  );
}
