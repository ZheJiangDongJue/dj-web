"use client";

import { useEffect } from "react";
import { initAndroidBridge } from "@/lib/android-bridge";

/**
 *
 * AndroidBridgeInitializer
 * 挂载于 /features 布局下，在客户端初始化安卓桥接逻辑。
 * - 仅负责触发 initAndroidBridge，一次挂载全局生效。
 *
 */
export default function AndroidBridgeInitializer() {
  useEffect(() => {
    initAndroidBridge();
  }, []);

  return null;
}

