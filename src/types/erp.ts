import type { FC } from "react";

export type ErpFeature = {
  id: string;
  name: string;
  /**
   *
   * 行为角色权限的页面标识（PageName）。
   * - 该值用于与后端 `AuthModel` 权限 Map 对齐，进而控制“模块/功能入口”的可见性。
   * - 约束：必须与后端权限系统中的 PageName 完全一致（区分大小写）。
   * - 未提供时视为“无需权限控制/默认可见”（仅用于尚未接入权限体系的功能）。
   *
   */
  pageName?: string;
  href?: string;
  badge?: string | number;
  /**
   *
   * 功能图标组件
   * 要求：支持传入可选的 className 以便尺寸/颜色从父组件继承。
   *
   */
  icon?: FC<{ className?: string }>;
};

export type ErpGroup = {
  id: string;
  name: string;
  features: ErpFeature[];
  moreHref?: string;
};
