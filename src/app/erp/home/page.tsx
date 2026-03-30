"use client";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty";
import { Home as HomeIcon } from "lucide-react";
import { MainFill } from "../../../components/layout/MainFill";

/**
 *
 * ERP 首页
 * - 使用 MainFill 作为根布局容器，填充父级剩余空间；
 * - 避免使用视口高度计算，保持与布局主区的滚动/收缩一致。
 *
 */
export default function ErpIndexPage() {
  return (
    <MainFill aria-label="首页">
      <Empty className="w-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HomeIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle>首页</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>
            欢迎使用 ERP 系统。请通过分类浏览功能进入相应页面。
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    </MainFill>
  );
}
