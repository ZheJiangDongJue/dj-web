"use client";

import { useEffect, useState } from "react";
import { useRouteTransition } from "./RouteTransitionContext";
import styles from "./TopProgressBar.module.css";

const COMPLETE_FADE_MS = 400;

/**
 * 顶部进度条：
 * - is-pending：从 0% 渐进涨到 90%
 * - is-complete：冲到 100% 后淡出，淡出完成后回到 idle
 */
export function TopProgressBar() {
  const { isPending } = useRouteTransition();
  const [phase, setPhase] = useState<"idle" | "pending" | "complete">("idle");

  useEffect(() => {
    if (isPending) {
      setPhase("pending");
      return;
    }
    if (phase === "pending") {
      setPhase("complete");
      const t = setTimeout(() => setPhase("idle"), COMPLETE_FADE_MS);
      return () => clearTimeout(t);
    }
  }, [isPending, phase]);

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
