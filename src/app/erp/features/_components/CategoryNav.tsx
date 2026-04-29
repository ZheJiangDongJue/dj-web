"use client";
import type { FC } from "react";

/**
 *
 * 分类导航组件
 * 用途：在 ERP 分类页左侧呈现分类列表，并在移动端可作为抽屉侧栏使用。
 * 作用域：仅在路由 /erp/features 内部使用（私有组件）。
 * 参数说明：
 * - categories: 分类名称列表（允许为空数组）。
 * - activeCategory: 当前激活的分类名。
 * - onCategoryChange: 分类切换时触发的回调。
 * - isMobile: 是否为移动端模式（默认 false）。
 * - onMobileClose: 移动端情况下，点击后关闭抽屉的回调（可选）。
 * 返回值：React 元素（导航区域）。
 *
 */
type CategoryNavProps = {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  isMobile?: boolean;
  onMobileClose?: () => void;
  /**
   *
   * 空状态标题（categories 为空时显示）。
   * - 例如：权限加载中/暂无可用模块/权限加载失败等。
   *
   */
  emptyTitle?: string;
  /**
   *
   * 空状态描述（categories 为空时显示）。
   *
   */
  emptyDescription?: string;
};

/**
 *
 * 渲染分类导航列表；在移动端点击后可自动关闭抽屉。
 *
 */
export const CategoryNav: FC<CategoryNavProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  isMobile = false,
  onMobileClose,
  emptyTitle,
  emptyDescription,
}) => {
  /**
   *
   * 处理分类点击：
   * - 触发分类切换回调；
   * - 如处于移动端抽屉状态，点击后自动关闭抽屉以便用户回到内容区。
   *
   */
  const handleCategoryClick = (category: string) => {
    onCategoryChange(category);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <nav
      className={`h-full w-full ${
        isMobile
          ? "fixed inset-y-0 left-0 z-50 w-64 transform bg-background shadow-[var(--shadow-2)] transition-transform duration-300 ease-in-out md:hidden flex flex-col"
          : "flex h-full w-full flex-col bg-background border-r border-border"
      }`}
      aria-label="分类导航"
    >
      <div className="px-[var(--space-3)] py-[var(--space-3)] border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">分类</h2>
          {isMobile && onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="rounded-[var(--radius-md)] p-1 text-muted-foreground hover:bg-[color-mix(in_srgb,var(--color-fg)_8%,transparent)] hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="关闭导航"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {categories.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-[var(--space-3)] py-[var(--space-4)] text-center">
          <div>
            <div className="text-sm font-medium text-foreground">{emptyTitle ?? "暂无可用模块"}</div>
            <div className="mt-1 text-xs text-muted-foreground">{emptyDescription ?? "请联系管理员配置页面权限"}</div>
          </div>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto py-[var(--space-2)]">
          {categories.map((category) => (
            <li key={category} className="w-full">
              <button
                type="button"
                onClick={() => handleCategoryClick(category)}
                aria-current={activeCategory === category ? "true" : undefined}
                className={`w-full px-[var(--space-3)] py-[var(--space-3)] text-left text-sm font-medium rounded-[var(--radius-sm)] transition-colors duration-200 border-l-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  activeCategory === category
                    ? "border-l-[var(--color-accent)] text-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]"
                    : "border-l-transparent text-muted-foreground hover:bg-[color-mix(in_srgb,var(--color-fg)_8%,transparent)] hover:text-foreground"
                }`}
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
};
