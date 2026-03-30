import type { FC } from "react";

export type ErpFeature = {
  id: string;
  name: string;
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
