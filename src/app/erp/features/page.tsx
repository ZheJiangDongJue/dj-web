"use client";
import { useEffect, type FC } from "react";
import { useRouter } from "next/navigation";
import { CategoryNav } from "./_components/CategoryNav";
import { FunctionGrid, type FunctionItem } from "./_components/FunctionGrid";
import { erpModules, erpGroupsByModule } from "@/features/erp/data";
import { MainFill } from "../../../components/layout/MainFill";
import { useSessionState } from "@/lib/hooks/useSessionState";

/**
 *
 * 默认网格图标（支持 className 以便尺寸/颜色继承）
 *
 */
const DefaultTileIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
  </svg>
);

/**
 *
 * 构建指定模块的功能项列表
 * @param moduleId 模块 id（来自数据源 erpModules）
 * @returns 适配 FunctionGrid 的功能项数组
 *
 */
const buildFunctionItems = (moduleId: string): FunctionItem[] => {
  const groups = erpGroupsByModule[moduleId] ?? [];
  return groups.flatMap((g) =>
    (g.features ?? []).map((f) => {
      const Icon = f.icon ?? DefaultTileIcon;
      return {
        id: f.id,
        name: f.name,
        icon: ({ className }) => <Icon className={className} />,
      } as FunctionItem;
    })
  );
};

/**
 *
 * ERP 分类页
 * 需求：移动端导航从"抽屉"改为"左侧常驻"。
 * 实现：取消移动端抽屉与尺寸监听逻辑，始终渲染左侧导航列；右侧为功能网格区域。
 * 说明：布局遵循"布局类与主题类样式分离"的项目规范，宽度随断点渐进增强。
 *
 */
export default function ErpCategoryPage() {
  const router = useRouter();
  // 从数据源派生分类（显示名称）与初始分类
  const categoryNames = erpModules.map((m) => m.name);
  const [activeCategory, setActiveCategory] = useSessionState<string>(
    "erp.features.activeCategory",
    categoryNames[0] ?? ""
  );
  const activeModuleId = erpModules.find((m) => m.name === activeCategory)?.id ?? "";
  const functionItems = buildFunctionItems(activeModuleId);

  /**
   *
   * 校验存储的分类是否仍然有效：
   * - 若已不存在于当前分类列表（例如数据更新），回退到首个分类。
   *
   */
  useEffect(() => {
    if (!activeCategory || !categoryNames.includes(activeCategory)) {
      setActiveCategory(categoryNames[0] ?? "");
    }
  }, [activeCategory, categoryNames, setActiveCategory]);

  /**
   *
   * 处理分类选择事件
   * 在移动端也不再关闭任何抽屉（因已改为常驻侧栏）。
   *
   */
  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
  };

  /**
   *
   * 处理功能项选择事件，跳转到 /erp/[module]/[feature]
   * @param item 被点击的功能项（包含 feature id）
   *
   */
  const handleItemSelect = (item: FunctionItem) => {
    if (!activeModuleId) {
      console.warn("无法确定当前模块，取消跳转。");
      return;
    }
    const href = `/features/erp/${encodeURIComponent(activeModuleId)}/${encodeURIComponent(item.id)}`;
    router.push(href);
  };

  return (
    <>
      {/* 键盘快捷键：跳至主内容区域 */}
      <a
        href="#erp-features-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-[var(--space-3)] focus:top-[var(--space-3)] focus:z-50 focus:rounded-[var(--radius-md)] focus:bg-[var(--color-accent)] focus:px-[var(--space-3)] focus:py-[var(--space-2)] focus:text-white focus:no-underline focus:outline-none"
      >
        跳至主内容
      </a>
      <MainFill aria-label="分类" className="flex-row overflow-hidden">
        {/* 左侧导航常驻（含移动端）。宽度随断点渐进增强 */}
        <div className="block w-[100px] flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] sm:w-[100px] md:w-[120px] lg:w-[160px]">
          <CategoryNav
            categories={categoryNames}
            activeCategory={activeCategory}
            onCategoryChange={handleCategorySelect}
          />
        </div>

        {/* 右侧功能组区域 */}
        <div id="erp-features-main" className="flex-1 overflow-hidden">
          <FunctionGrid title={activeCategory} items={functionItems} onItemSelect={handleItemSelect} />
        </div>
      </MainFill>
    </>
  );
}
