"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const TIMEOUT_MS = 5000;

export type RouteTransitionState = {
  isPending: boolean;
  targetPath: string | null;
};

export type RouteTransitionAction =
  | { type: "START"; targetPath: string | null }
  | { type: "END" }
  | { type: "TIMEOUT" };

export function routeTransitionReducer(
  state: RouteTransitionState,
  action: RouteTransitionAction
): RouteTransitionState {
  switch (action.type) {
    case "START":
      return { isPending: true, targetPath: action.targetPath };
    case "END":
    case "TIMEOUT":
      return { isPending: false, targetPath: null };
    default:
      return state;
  }
}

export type RouteTransitionContextValue = {
  isPending: boolean;
  startTransition: (targetPath?: string) => void;
  endTransition: () => void;
};

const RouteTransitionContext = createContext<RouteTransitionContextValue | null>(null);

/**
 * 路由过渡 Provider：监听 pathname 变化自动结束过渡，
 * 同步 body[data-route-pending] 标记，并提供 5s 超时兜底。
 */
export function RouteTransitionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(routeTransitionReducer, {
    isPending: false,
    targetPath: null,
  });
  const pathname = usePathname() ?? "";
  const prevPathnameRef = useRef<string>(pathname);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeoutSafely = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startTransition = useCallback(
    (targetPath?: string) => {
      clearTimeoutSafely();
      dispatch({ type: "START", targetPath: targetPath ?? null });
      timeoutRef.current = setTimeout(() => {
        dispatch({ type: "TIMEOUT" });
      }, TIMEOUT_MS);
    },
    [clearTimeoutSafely]
  );

  const endTransition = useCallback(() => {
    clearTimeoutSafely();
    dispatch({ type: "END" });
  }, [clearTimeoutSafely]);

  // 监听 pathname 变化：变化即视为跳转完成
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (state.isPending) {
        endTransition();
      }
    }
  }, [pathname, state.isPending, endTransition]);

  // 同步 body 标记
  useEffect(() => {
    if (state.isPending) {
      document.body.dataset.routePending = "true";
    } else {
      delete document.body.dataset.routePending;
    }
  }, [state.isPending]);

  // 卸载时清理计时器
  useEffect(() => {
    return () => {
      clearTimeoutSafely();
    };
  }, [clearTimeoutSafely]);

  const value = useMemo<RouteTransitionContextValue>(
    () => ({ isPending: state.isPending, startTransition, endTransition }),
    [state.isPending, startTransition, endTransition]
  );

  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
    </RouteTransitionContext.Provider>
  );
}

/**
 * 读取路由过渡上下文。必须在 RouteTransitionProvider 内使用。
 */
export function useRouteTransition(): RouteTransitionContextValue {
  const ctx = useContext(RouteTransitionContext);
  if (!ctx) {
    throw new Error("useRouteTransition must be used inside RouteTransitionProvider");
  }
  return ctx;
}
