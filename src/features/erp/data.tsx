import type { ErpGroup } from "../../types/erp";
import type { FC } from "react";
import { ERP_PAGE_NAME } from "@/lib/erp/page-names";

/**
 *
 * ERP 模块导航项类型
 * 仅用于描述模块的最小信息：id 与展示名称。
 *
 */
export type ModuleNavItem = {
  id: string;
  name: string;
};

/**
 *
 * 简易图标：保证无外部依赖，同时支持 className 以继承尺寸/颜色
 *
 */
const TileIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
  </svg>
);

/**
 *
 * ERP 模块清单
 * 说明：用于左侧导航的模块列表。
 *
 */
export const erpModules: ModuleNavItem[] = [
  { id: "basic", name: "基础资料" },
  { id: "purchase", name: "采购系统" },
  { id: "sales", name: "销售系统" },
  { id: "inventory", name: "存货系统" },
  { id: "a0", name: "应收系统" },
  { id: "a1", name: "应付系统" },
  { id: "a2", name: "生产系统" },
  { id: "a3", name: "工艺系统" },
  { id: "quality", name: "品质系统" },
];

/**
 *
 * 按模块划分的功能分组
 * key 为模块 id；value 为该模块下的功能分组数组。
 *
 */
export const erpGroupsByModule: Record<string, ErpGroup[]> = {
  // basic: [
  //   {
  //     id: "basic-main",
  //     name: "常用",
  //     features: [
  //       { id: "material", name: "物料", icon: TileIcon },
  //       { id: "customer", name: "客户", icon: TileIcon },
  //       { id: "vendor", name: "供应商", icon: TileIcon },
  //     ],
  //   },
  // ],
  // purchase: [
  //   {
  //     id: "purchase-bills",
  //     name: "采购单据",
  //     features: [
  //       { id: "po", name: "采购订单", icon: TileIcon },
  //       { id: "grn", name: "采购收货单", icon: TileIcon },
  //       { id: "in", name: "采购入库单", icon: TileIcon },
  //       { id: "rtn-note", name: "采购退货通知", icon: TileIcon },
  //       { id: "rtn", name: "采购退库单", icon: TileIcon },
  //     ],
  //   },
  // ],
  quality: [
    {
      id: "quality-main",
      name: "质量管理",
      features: [
        { id: "fai", name: "首件检验", pageName: ERP_PAGE_NAME.FAI, icon: TileIcon },
        { id: "fqc", name: "末道检验", pageName: ERP_PAGE_NAME.FQC, icon: TileIcon },
        { id: "ncr", name: "不合格纪录单", pageName: ERP_PAGE_NAME.NCR, icon: TileIcon },
      ],
    },
  ],
};
