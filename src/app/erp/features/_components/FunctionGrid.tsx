"use client";
import type { FC } from "react";

export interface FunctionItem {
  id: string;
  name: string;
  icon: FC<{ className?: string }>;
  description?: string;
}

type FunctionGridProps = {
  title: string;
  items: FunctionItem[];
  onItemSelect: (item: FunctionItem) => void;
  showMobileMenuButton?: boolean;
  onMobileMenuOpen?: () => void;
};

/**
 *
 * 功能网格组件
 * 用途：按分类在右侧区域以网格形式呈现功能项，支持移动端显示菜单按钮。
 * 作用域：仅在路由 /erp/features 内部使用（私有组件）。
 * 主题与布局：
 * - 严格区分布局与主题：尺寸/间距采用 tokens.css 中的变量（如 --space-*），
 *   颜值因素（颜色/圆角/阴影）交由 theme.css 的语义类（如 .t-card、.t-text-*）与映射类（bg-background、border-border）控制，
 *   以保证多主题与密度切换时样式自动适配。
 * 参数说明：
 * - title: 当前分类标题。
 * - items: 功能项列表（为空时展示占位提示）。
 * - onItemSelect: 选择功能项的回调。
 * - showMobileMenuButton: 是否展示移动端菜单按钮（默认 false）。
 * - onMobileMenuOpen: 点击菜单按钮时触发的回调（可选）。
 * 返回值：React 元素（功能卡片网格）。
 *
 */
export const FunctionGrid: FC<FunctionGridProps> = ({
  title,
  items,
  onItemSelect,
  showMobileMenuButton = false,
  onMobileMenuOpen
}) => {
  return (
    <section className="h-full w-full overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 bg-background px-[var(--space-3)] py-[var(--space-3)] border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {showMobileMenuButton && onMobileMenuOpen && (
            <button
              type="button"
              onClick={onMobileMenuOpen}
              className="md:hidden rounded-[var(--radius-md)] p-2 text-muted-foreground hover:bg-[color-mix(in_srgb,var(--color-fg)_8%,transparent)] hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="打开导航菜单"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="p-[var(--space-3)]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-foreground">暂无功能项</h3>
            <p className="mt-1 text-sm text-muted-foreground">该分类下暂无可用的功能模块</p>
            <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--color-fg)_60%,transparent)]">
              如需使用相关功能，请联系系统管理员配置权限
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[var(--space-3)] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemSelect(item)}
                className="flex flex-col items-center justify-center t-card rounded-[var(--radius-md)] p-[var(--space-3)] text-center cursor-pointer transition-[box-shadow,background-color] duration-200 hover:shadow-[var(--shadow-2)] hover:bg-[color-mix(in_srgb,var(--color-accent)_4%,var(--color-surface))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={item.name}
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-field)] sm:h-12 sm:w-12">
                  <item.icon className="h-5 w-5 text-muted-foreground sm:h-6 sm:w-6" />
                </div>
                <span className="text-xs font-medium t-text-primary line-clamp-2 sm:text-sm">{item.name}</span>
                {item.description && (
                  <span className="mt-1 hidden text-xs t-text-secondary line-clamp-2 sm:block">
                    {item.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
