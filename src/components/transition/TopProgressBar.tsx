"use client";

import { useEffect, useState } from "react";
import { useRouteTransition } from "./RouteTransitionContext";
import styles from "./TopProgressBar.module.css";

const COMPLETE_FADE_MS = 400;

type Phase = "idle" | "pending" | "complete";

/**
 * 顶部进度条：
 * - is-pending：从 0% 渐进涨到 90%
 * - is-complete：冲到 100% 后淡出，淡出完成后回到 idle
 *
 * 实现要点：
 * - phase 通过"渲染期间检测 isPending 变化"派生（合法的 React 模式，
 *   等价于 derived state with previous-state tracking）
 * - "complete → idle" 的 400ms 淡出由 effect 内异步 setTimeout 触发，
 *   不构成"effect 内同步 setState"
 */
export function TopProgressBar() {
  const { isPending } = useRouteTransition();
  const [phase, setPhase] = useState<Phase>("idle");
  const [prevIsPending, setPrevIsPending] = useState(isPending);

  // 渲染期间根据 isPending 变化调整 phase（合法的 derived state 模式）
  if (prevIsPending !== isPending) {
    setPrevIsPending(isPending);
    setPhase(isPending ? "pending" : "complete");
  }

  // complete 阶段 400ms 后回到 idle（异步 setState，不触发同步规则）
  useEffect(() => {
    if (phase !== "complete") return;
    const t = setTimeout(() => setPhase("idle"), COMPLETE_FADE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const className = [
    styles.bar,
    phase === "pending" ? styles["is-pending"] : "",
    phase === "complete" ? styles["is-complete"] : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      role="progressbar"
      aria-hidden={phase !== "pending"}
      aria-label="页面加载进度"
      className={className}
    />
  );
}
