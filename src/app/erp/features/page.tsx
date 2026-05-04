"use client";
import { useEffect, useMemo, type FC } from "react";
import { useRouter } from "next/navigation";
import { CategoryNav } from "./_components/CategoryNav";
import { FunctionGrid, type FunctionItem } from "./_components/FunctionGrid";
import { erpModules, erpGroupsByModule } from "@/features/erp/data";
import { MainFill } from "../../../components/layout/MainFill";
import { useSessionState } from "@/lib/hooks/useSessionState";
import { useErpPagePermissions } from "@/hooks/useErpPagePermissions";
import { Spinner } from "@/components/ui/spinner";

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
 * @param canViewPageName 用于“入口可见性”过滤的函数；不传则不过滤
 * @returns 适配 FunctionGrid 的功能项数组
 *
 */
const buildFunctionItems = (moduleId: string, canViewPageName?: (pageName?: string) => boolean): FunctionItem[] => {
  const groups = erpGroupsByModule[moduleId] ?? [];
  return groups.flatMap((g) =>
    (g.features ?? [])
      .filter((f) => (canViewPageName ? canViewPageName(f.pageName) : true))
      .map((f) => {
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

  /**
   *
   * 需要参与权限判断的 PageName 列表（从功能配置中收集）。
   * 说明：未标注 pageName 的功能视为“默认可见”，不会进入权限检查列表。
   *
   */
  const featurePageNames = useMemo(() => {
    return Object.values(erpGroupsByModule)
      .flatMap((groups) => groups.flatMap((g) => (g.features ?? []).map((f) => f.pageName)))
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  }, []);

  const { status: permStatus, error: permError, allowedPageNames } = useErpPagePermissions(featurePageNames);

  /**
   *
   * 页面入口可见性判断：
   * - 未标注 PageName：默认可见（便于逐步接入权限系统）。
   * - 权限加载完成：严格按 `Permissions.浏览` 过滤。
   * - 权限加载失败：降级为“全部可见”，并提示用户刷新/联系管理员。
   *
   */
  const canViewPageName = useMemo(() => {
    return (pageName?: string) => {
      const name = typeof pageName === "string" ? pageName.trim() : "";
      if (!name) return true;
      if (permStatus === "ready") return allowedPageNames.has(name);
      if (permStatus === "error") return false;
      // loading/idle：由 UI 单独展示“加载中”，此处返回 true 避免类别列表抖动
      return true;
    };
  }, [allowedPageNames, permStatus]);

  /**
   *
   * 根据权限过滤“模块（分类）”列表：
   * - 若模块未配置任何功能：保留（用于占位/渐进上线）。
   * - 若模块配置了功能：仅当至少存在 1 个可见功能时才展示该模块。
   *
   */
  const visibleModules = useMemo(() => {
    // 默认不展示模块：避免在权限尚未加载完成时给用户造成“入口可用”的误解
    if (permStatus === "idle" || permStatus === "loading") return [];

    return erpModules.filter((m) => {
      const groups = erpGroupsByModule[m.id] ?? [];
      const features = groups.flatMap((g) => g.features ?? []);
      // 没有任何页面（功能）时隐藏模块入口
      if (features.length === 0) return false;
      return features.some((f) => canViewPageName(f.pageName));
    });
  }, [canViewPageName, permStatus]);

  // 从数据源派生分类（显示名称）与初始分类
  const categoryNames = useMemo(() => visibleModules.map((m) => m.name), [visibleModules]);
  const [activeCategory, setActiveCategory] = useSessionState<string>(
    "erp.features.activeCategory",
    categoryNames[0] ?? ""
  );
  const activeModuleId = visibleModules.find((m) => m.name === activeCategory)?.id ?? "";
  const functionItems = useMemo(() => {
    if (!activeModuleId) return [];
    // 仅在权限 ready 时过滤入口；error 时降级显示全部；loading/idle 时 UI 会显示加载中
    const filter = permStatus === "ready" || permStatus === "error" ? canViewPageName : undefined;
    return buildFunctionItems(activeModuleId, filter);
  }, [activeModuleId, canViewPageName, permStatus]);

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
            emptyTitle={
              permStatus === "idle" || permStatus === "loading"
                ? "正在加载权限..."
                : permStatus === "error"
                ? "权限加载失败"
                : "暂无可用模块"
            }
            emptyDescription={
              permStatus === "idle" || permStatus === "loading"
                ? "请稍候"
                : permStatus === "error"
                ? "请刷新页面重试，或联系管理员检查权限配置"
                : "请联系管理员配置页面权限"
            }
          />
        </div>

        {/* 右侧功能组区域 */}
        <div id="erp-features-main" className="flex-1 overflow-hidden">
          {permStatus === "loading" || permStatus === "idle" ? (
            <div className="flex h-full w-full items-center justify-center bg-background p-[var(--space-4)]">
              <div className="t-card t-glass flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)]">
                <Spinner className="size-4" aria-hidden />
                <span className="text-sm t-text-secondary">正在加载权限...</span>
              </div>
            </div>
          ) : (
            <>
              {permStatus === "error" && (
                <div className="border-b border-border bg-[color-mix(in_srgb,var(--color-accent)_6%,transparent)] px-[var(--space-3)] py-[var(--space-2)] text-xs">
                  <span className="t-text-secondary">
                    权限加载失败，已隐藏受控入口。请刷新页面重试，或联系管理员检查权限配置。
                  </span>
                  {!!permError && (
                    <span className="sr-only">
                      {typeof (permError as any)?.message === "string" ? (permError as any).message : ""}
                    </span>
                  )}
                </div>
              )}
              <FunctionGrid title={activeCategory} items={functionItems} onItemSelect={handleItemSelect} />
            </>
          )}
        </div>
      </MainFill>
    </>
  );
}
