"use client";
import Link from "next/link";
import { MainFill } from "../../../../../components/layout/MainFill";
import { useFeaturesPageTitle } from "../../../_components";

/**
 *
 * ERP 动态功能页
 * 设计目的：
 * - 根容器使用 flex 占据父级（layout 主区）的剩余空间，确保在 Grid 布局中行为稳定。
 * - 避免在页面内部使用视口高度（如 min-h-dvh），以免破坏父级滚动容器的尺寸约束。
 *
 */
export default function ErpFeaturePage({ params }: { params: { module: string; feature: string } }) {
  const { module, feature } = params;
  // 设置页头标题，遵循“顶部页头 + 子内容”的框架
  useFeaturesPageTitle(`${module} / ${feature}`);

  return (
    <MainFill>
      {/* 内容主区：由 features/layout 提供头部，本页仅关注业务内容 */}
      <div className="mx-auto w-full max-w-[120rem] p-4">
        <section className="rounded-lg border border-neutral-200/70 bg-neutral-50/60 p-6 shadow-sm dark:border-neutral-700/50 dark:bg-neutral-800/50">
          <h2 className="mb-1 text-lg font-semibold">功能占位页面</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            您点击了 <span className="font-medium">{module}</span> 模块的 <span className="font-medium">{feature}</span> 功能。
          </p>
          <div className="mt-4">
            <Link href="/erp" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500">
              返回 ERP 主页
            </Link>
          </div>
        </section>
      </div>
    </MainFill>
  );
}

