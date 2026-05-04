"use client";
import type { ReactNode } from "react";
import { useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useNavigateWithTransition } from "@/hooks/useNavigateWithTransition";
import { TopBar } from "../../components/erp/TopBar";
import { BottomTabs } from "../../components/erp/BottomTabs";

/**
 *
 * ERP 页面顶层布局（Grid 方案）
 * - 使用三行网格：header(自动高) / main(minmax(0,1fr)) / footer(自动高)
 * - main 作为滚动容器：内容不足则铺满，超出时仅 main 内滚动
 * - 与项目规范一致：布局类仅负责尺寸与位置，不侵入主题样式
 *
 */
export default function ErpLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/erp";
  const router = useNavigateWithTransition();

  type TabKey = "home" | "category" | "me";

  /**
   *
   * 根据路径推断当前激活的底部标签
   *
   */
  const activeTab: TabKey = useMemo(() => {
    if (pathname === "/erp" || pathname === "/erp/") return "home";
    if (pathname.startsWith("/erp/home")) return "home";
    if (pathname.startsWith("/erp/features")) return "category";
    if (pathname.startsWith("/erp/me")) return "me";
    // 其他子路由默认归为首页（可按需扩展）
    return "home";
  }, [pathname]);

  /**
   *
   * 底部标签的标题映射
   *
   */
  const tabLabel: Record<TabKey, string> = {
    home: "首页",
    category: "功能",
    me: "我的",
  };

  /**
   *
   * 处理底部标签切换
   *
   */
  const handleTabChange = useCallback(
    (key: TabKey) => {
      switch (key) {
        case "home":
          router.push("/erp/home");
          break;
        case "category":
          router.push("/erp/features");
          break;
        case "me":
          router.push("/erp/me");
          break;
      }
    },
    [router]
  );

  return (
    <div
      className="t-surface grid min-h-dvh grid-rows-[auto_minmax(0,1fr)_auto] bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
    >
      {/* 顶部区域 */}
      <TopBar title={tabLabel[activeTab]} />

      {/* 中间主区域：作为滚动容器 */}
      <main className="min-h-0 overflow-auto overscroll-contain" aria-label="ERP 主体">
        <div className="mx-auto w-full max-w-[120rem] px-3 sm:px-4 md:px-6 lg:px-8 flex flex-col h-full min-h-0">
          {children}
        </div>
      </main>

      {/* 底部标签区域：在 Grid 的第三行占位，不再覆盖内容 */}
      <BottomTabs active={activeTab} onChange={handleTabChange} position="static" />
    </div>
  );
}
