import type { ReactNode } from "react";
import FeaturesClientLayout from "./_components/FeaturesClientLayout";
import AndroidBridgeInitializer from "./_components/AndroidBridgeInitializer";

/**
 *
 * FeaturesLayout（服务端）
 * 说明：
 * - Next.js App Router 下，用于包裹 /features/* 的所有页面。
 * - 仅负责引入客户端布局骨架，不涉及任何业务逻辑。
 *
 */
export default function FeaturesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AndroidBridgeInitializer />
      <FeaturesClientLayout>{children}</FeaturesClientLayout>
    </>
  );
}
