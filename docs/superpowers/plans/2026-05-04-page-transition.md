# 页面跳转过渡体验优化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 通过"点击瞬时反馈 + 顶部进度条 + 骨架屏延迟显示"三层反馈体系，消除 Next.js App Router 路由跳转的"假死感"。

**Architecture:** 自研基于 React Context + useReducer 的全局过渡状态管理；在 `app/layout.tsx` 顶层挂载 Provider 与 TopProgressBar；提供 `<AppLink>` 与 `useNavigateWithTransition` 两个接入点；通过 Next.js 原生 `loading.tsx` + CSS `animation-delay` 实现骨架屏延迟显示。

**Tech Stack:** Next.js 15 / React 19 / TypeScript 5 / Tailwind CSS 4 / Vitest（测试）/ CSS Modules + tokens.css 主题系统

**Spec 引用:** `dj-web/docs/superpowers/specs/2026-05-04-page-transition-design.md`

---

## 文件结构总览

**新建文件**

| 路径 | 职责 |
|------|------|
| `src/components/transition/RouteTransitionContext.tsx` | Context + Provider + reducer + `useRouteTransition` hook |
| `src/components/transition/RouteTransitionContext.test.tsx` | reducer 与 Provider 单测 |
| `src/components/transition/TopProgressBar.tsx` | 自研顶部进度条 UI |
| `src/components/transition/TopProgressBar.module.css` | 进度条 CSS 动画 |
| `src/components/transition/TopProgressBar.test.tsx` | 进度条组件单测 |
| `src/components/transition/AppLink.tsx` | 包装 `next/link`，点击触发 startTransition |
| `src/components/transition/AppLink.test.tsx` | AppLink 行为测试 |
| `src/hooks/useNavigateWithTransition.ts` | 包装 `useRouter` 的 push/replace/back |
| `src/hooks/useNavigateWithTransition.test.tsx` | hook 行为测试 |
| `src/app/loading.tsx` | 全局通用骨架屏（兜底） |
| `src/app/erp/home/loading.tsx` | `/erp/home` 专属骨架屏 |

**修改文件**

| 路径 | 改动 |
|------|------|
| `src/app/layout.tsx` | 在 `ThemeProvider` 内挂载 `RouteTransitionProvider` 与 `<TopProgressBar />` |
| `src/app/erp/layout.tsx` | `useRouter` → `useNavigateWithTransition` |
| `src/app/globals.css` | 追加 `[data-pending]` 与 `body[data-route-pending]` 全局规则；追加骨架屏延迟显示动画 |
| `src/components/erp/BottomTabs.tsx`（可选） | 给 tab 按钮加 `data-pending` 标记（如父级已传 isPending） |

---

## Task 0：准备工作（创建目录与冒烟）

**Files:**
- Create: `src/components/transition/.gitkeep`

- [ ] **Step 1: 确认当前分支并验证基础环境**

Run:
```bash
cd dj-web
git status
npm run lint
```
Expected: `git status` 干净；`npm run lint` 通过。

- [ ] **Step 2: 创建 transition 目录占位**

```bash
mkdir -p src/components/transition
echo "" > src/components/transition/.gitkeep
```

- [ ] **Step 3: 提交占位**

```bash
git add src/components/transition/.gitkeep
git commit -m "chore(transition): 创建 transition 组件目录"
```

---

## Task 1：RouteTransitionContext —— 核心状态机

**Files:**
- Create: `src/components/transition/RouteTransitionContext.tsx`
- Test: `src/components/transition/RouteTransitionContext.test.tsx`

- [ ] **Step 1: 写失败的 reducer 单测**

创建 `src/components/transition/RouteTransitionContext.test.tsx`：

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import {
  routeTransitionReducer,
  RouteTransitionProvider,
  useRouteTransition,
} from "./RouteTransitionContext";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/start"),
}));
import { usePathname } from "next/navigation";

describe("routeTransitionReducer", () => {
  it("START 把 isPending 置为 true 并记录 targetPath", () => {
    const next = routeTransitionReducer(
      { isPending: false, targetPath: null },
      { type: "START", targetPath: "/erp/home" }
    );
    expect(next.isPending).toBe(true);
    expect(next.targetPath).toBe("/erp/home");
  });

  it("END 把 isPending 置为 false 并清空 targetPath", () => {
    const next = routeTransitionReducer(
      { isPending: true, targetPath: "/erp/home" },
      { type: "END" }
    );
    expect(next.isPending).toBe(false);
    expect(next.targetPath).toBeNull();
  });

  it("TIMEOUT 与 END 行为一致", () => {
    const next = routeTransitionReducer(
      { isPending: true, targetPath: "/erp/home" },
      { type: "TIMEOUT" }
    );
    expect(next.isPending).toBe(false);
    expect(next.targetPath).toBeNull();
  });

  it("空闲态收到 END 不会破坏 state", () => {
    const next = routeTransitionReducer(
      { isPending: false, targetPath: null },
      { type: "END" }
    );
    expect(next.isPending).toBe(false);
    expect(next.targetPath).toBeNull();
  });
});

describe("RouteTransitionProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/start");
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.removeAttribute("data-route-pending");
  });

  function Probe({ onReady }: { onReady: (api: ReturnType<typeof useRouteTransition>) => void }) {
    const api = useRouteTransition();
    onReady(api);
    return null;
  }

  it("startTransition 设置 body[data-route-pending]=true", () => {
    let api!: ReturnType<typeof useRouteTransition>;
    render(
      <RouteTransitionProvider>
        <Probe onReady={(a) => { api = a; }} />
      </RouteTransitionProvider>
    );
    act(() => { api.startTransition("/erp/home"); });
    expect(document.body.dataset.routePending).toBe("true");
  });

  it("pathname 变化后自动 endTransition 并移除 body 标记", () => {
    let api!: ReturnType<typeof useRouteTransition>;
    const { rerender } = render(
      <RouteTransitionProvider>
        <Probe onReady={(a) => { api = a; }} />
      </RouteTransitionProvider>
    );
    act(() => { api.startTransition("/erp/home"); });
    expect(document.body.dataset.routePending).toBe("true");

    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/erp/home");
    rerender(
      <RouteTransitionProvider>
        <Probe onReady={(a) => { api = a; }} />
      </RouteTransitionProvider>
    );
    expect(document.body.dataset.routePending).toBeUndefined();
  });

  it("5 秒超时自动结束（同路径跳转兜底）", () => {
    let api!: ReturnType<typeof useRouteTransition>;
    render(
      <RouteTransitionProvider>
        <Probe onReady={(a) => { api = a; }} />
      </RouteTransitionProvider>
    );
    act(() => { api.startTransition("/start"); }); // 同路径
    expect(document.body.dataset.routePending).toBe("true");

    act(() => { vi.advanceTimersByTime(5000); });
    expect(document.body.dataset.routePending).toBeUndefined();
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run:
```bash
npm run test -- src/components/transition/RouteTransitionContext.test.tsx
```
Expected: FAIL with "Cannot find module './RouteTransitionContext'"

- [ ] **Step 3: 实现 Context、reducer、Provider、hook**

创建 `src/components/transition/RouteTransitionContext.tsx`：

```tsx
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
```

- [ ] **Step 4: 运行测试验证通过**

Run:
```bash
npm run test -- src/components/transition/RouteTransitionContext.test.tsx
```
Expected: PASS（所有 7 个测试）

- [ ] **Step 5: 提交**

```bash
git add src/components/transition/RouteTransitionContext.tsx src/components/transition/RouteTransitionContext.test.tsx
git rm src/components/transition/.gitkeep
git commit -m "feat(transition): 添加路由过渡 Context 与 5s 超时兜底"
```

---

## Task 2：TopProgressBar —— 顶部进度条组件

**Files:**
- Create: `src/components/transition/TopProgressBar.tsx`
- Create: `src/components/transition/TopProgressBar.module.css`
- Test: `src/components/transition/TopProgressBar.test.tsx`

- [ ] **Step 1: 写失败的组件单测**

创建 `src/components/transition/TopProgressBar.test.tsx`：

```tsx
import { describe, it, expect } from "vitest";
import { render, act } from "@testing-library/react";
import { vi } from "vitest";
import { RouteTransitionProvider, useRouteTransition } from "./RouteTransitionContext";
import { TopProgressBar } from "./TopProgressBar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/start"),
}));

function Trigger() {
  const { startTransition, endTransition } = useRouteTransition();
  return (
    <>
      <button data-testid="start" onClick={() => startTransition("/next")}>start</button>
      <button data-testid="end" onClick={() => endTransition()}>end</button>
    </>
  );
}

describe("TopProgressBar", () => {
  it("默认渲染，无 is-pending / is-complete class", () => {
    const { container } = render(
      <RouteTransitionProvider>
        <TopProgressBar />
      </RouteTransitionProvider>
    );
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).not.toBeNull();
    expect(bar!.className).not.toMatch(/is-pending|is-complete/);
  });

  it("startTransition 后获得 is-pending class", () => {
    const { container, getByTestId } = render(
      <RouteTransitionProvider>
        <TopProgressBar />
        <Trigger />
      </RouteTransitionProvider>
    );
    act(() => { getByTestId("start").click(); });
    const bar = container.querySelector('[role="progressbar"]')!;
    expect(bar.className).toMatch(/is-pending/);
  });

  it("endTransition 后从 is-pending 切到 is-complete", () => {
    const { container, getByTestId } = render(
      <RouteTransitionProvider>
        <TopProgressBar />
        <Trigger />
      </RouteTransitionProvider>
    );
    act(() => { getByTestId("start").click(); });
    act(() => { getByTestId("end").click(); });
    const bar = container.querySelector('[role="progressbar"]')!;
    expect(bar.className).toMatch(/is-complete/);
    expect(bar.className).not.toMatch(/is-pending/);
  });

  it("aria-hidden 在空闲时为 true，pending 时为 false", () => {
    const { container, getByTestId } = render(
      <RouteTransitionProvider>
        <TopProgressBar />
        <Trigger />
      </RouteTransitionProvider>
    );
    const bar = container.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute("aria-hidden")).toBe("true");
    act(() => { getByTestId("start").click(); });
    expect(bar.getAttribute("aria-hidden")).toBe("false");
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run:
```bash
npm run test -- src/components/transition/TopProgressBar.test.tsx
```
Expected: FAIL with "Cannot find module './TopProgressBar'"

- [ ] **Step 3: 实现 CSS Module**

创建 `src/components/transition/TopProgressBar.module.css`：

```css
.bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  width: 0%;
  background: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent);
  opacity: 0;
  z-index: 9999;
  pointer-events: none;
  transition: opacity 200ms ease-out;
}

.is-pending {
  opacity: 1;
  animation: top-progress-grow 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.is-complete {
  width: 100%;
  opacity: 0;
  animation: none;
  transition: width 200ms ease-out, opacity 200ms ease-out 200ms;
}

@keyframes top-progress-grow {
  0% { width: 0%; }
  10% { width: 30%; }
  100% { width: 90%; }
}

/* 用户切换标签时暂停动画，避免回来后从 0 重新开始 */
@media (prefers-reduced-motion: reduce) {
  .is-pending,
  .is-complete {
    animation-duration: 1ms;
    transition-duration: 1ms;
  }
}
```

- [ ] **Step 4: 实现组件**

创建 `src/components/transition/TopProgressBar.tsx`：

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouteTransition } from "./RouteTransitionContext";
import styles from "./TopProgressBar.module.css";

const COMPLETE_FADE_MS = 400; // = transition + 延迟，匹配 .is-complete 的 200ms width + 200ms opacity-delay

/**
 * 顶部进度条：
 * - is-pending：从 0% 渐进涨到 90%
 * - is-complete：冲到 100% 后淡出，淡出完成后回到 idle 状态（width 0%、opacity 0）
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
```

- [ ] **Step 5: 运行测试验证通过**

Run:
```bash
npm run test -- src/components/transition/TopProgressBar.test.tsx
```
Expected: PASS（4 个测试）

- [ ] **Step 6: 提交**

```bash
git add src/components/transition/TopProgressBar.tsx src/components/transition/TopProgressBar.module.css src/components/transition/TopProgressBar.test.tsx
git commit -m "feat(transition): 添加自研顶部进度条 TopProgressBar"
```

---

## Task 3：useNavigateWithTransition —— 路由 hook

**Files:**
- Create: `src/hooks/useNavigateWithTransition.ts`
- Test: `src/hooks/useNavigateWithTransition.test.tsx`

- [ ] **Step 1: 写失败的 hook 测试**

创建 `src/hooks/useNavigateWithTransition.test.tsx`：

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { RouteTransitionProvider } from "@/components/transition/RouteTransitionContext";
import { useNavigateWithTransition } from "./useNavigateWithTransition";

const pushSpy = vi.fn();
const replaceSpy = vi.fn();
const backSpy = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/start"),
  useRouter: () => ({ push: pushSpy, replace: replaceSpy, back: backSpy }),
}));

function Probe({ onReady }: { onReady: (api: ReturnType<typeof useNavigateWithTransition>) => void }) {
  const api = useNavigateWithTransition();
  onReady(api);
  return null;
}

describe("useNavigateWithTransition", () => {
  it("push 触发 router.push 并设置 body[data-route-pending]", () => {
    let api!: ReturnType<typeof useNavigateWithTransition>;
    render(
      <RouteTransitionProvider>
        <Probe onReady={(a) => { api = a; }} />
      </RouteTransitionProvider>
    );
    act(() => { api.push("/erp/home"); });
    expect(pushSpy).toHaveBeenCalledWith("/erp/home");
    expect(document.body.dataset.routePending).toBe("true");
  });

  it("replace 同样触发 startTransition", () => {
    let api!: ReturnType<typeof useNavigateWithTransition>;
    render(
      <RouteTransitionProvider>
        <Probe onReady={(a) => { api = a; }} />
      </RouteTransitionProvider>
    );
    act(() => { api.replace("/erp/me"); });
    expect(replaceSpy).toHaveBeenCalledWith("/erp/me");
    expect(document.body.dataset.routePending).toBe("true");
  });

  it("back 触发 startTransition（无 targetPath）", () => {
    let api!: ReturnType<typeof useNavigateWithTransition>;
    render(
      <RouteTransitionProvider>
        <Probe onReady={(a) => { api = a; }} />
      </RouteTransitionProvider>
    );
    act(() => { api.back(); });
    expect(backSpy).toHaveBeenCalled();
    expect(document.body.dataset.routePending).toBe("true");
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run:
```bash
npm run test -- src/hooks/useNavigateWithTransition.test.tsx
```
Expected: FAIL with "Cannot find module './useNavigateWithTransition'"

- [ ] **Step 3: 实现 hook**

创建 `src/hooks/useNavigateWithTransition.ts`：

```ts
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRouteTransition } from "@/components/transition/RouteTransitionContext";

export type NavigateApi = {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
};

/**
 * 包装 Next.js useRouter，使每次跳转都先调用 startTransition，
 * 触发顶部进度条与 body[data-route-pending] 反馈。
 */
export function useNavigateWithTransition(): NavigateApi {
  const router = useRouter();
  const { startTransition } = useRouteTransition();

  return useMemo<NavigateApi>(
    () => ({
      push: (href) => {
        startTransition(href);
        router.push(href);
      },
      replace: (href) => {
        startTransition(href);
        router.replace(href);
      },
      back: () => {
        startTransition();
        router.back();
      },
    }),
    [router, startTransition]
  );
}
```

- [ ] **Step 4: 运行测试验证通过**

Run:
```bash
npm run test -- src/hooks/useNavigateWithTransition.test.tsx
```
Expected: PASS（3 个测试）

- [ ] **Step 5: 提交**

```bash
git add src/hooks/useNavigateWithTransition.ts src/hooks/useNavigateWithTransition.test.tsx
git commit -m "feat(transition): 添加 useNavigateWithTransition 路由 hook"
```

---

## Task 4：AppLink —— Link 组件包装

**Files:**
- Create: `src/components/transition/AppLink.tsx`
- Test: `src/components/transition/AppLink.test.tsx`

- [ ] **Step 1: 写失败的 AppLink 测试**

创建 `src/components/transition/AppLink.test.tsx`：

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { RouteTransitionProvider } from "./RouteTransitionContext";
import { AppLink } from "./AppLink";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/start"),
}));

vi.mock("next/link", () => ({
  default: ({ href, onClick, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

describe("AppLink", () => {
  it("点击后元素获得 data-pending=true", () => {
    const { getByTestId } = render(
      <RouteTransitionProvider>
        <AppLink href="/erp/home" data-testid="link">去首页</AppLink>
      </RouteTransitionProvider>
    );
    const a = getByTestId("link") as HTMLAnchorElement;
    expect(a.dataset.pending).toBeUndefined();
    act(() => { fireEvent.click(a); });
    expect(a.dataset.pending).toBe("true");
    expect(document.body.dataset.routePending).toBe("true");
  });

  it("Ctrl/Meta/中键点击不触发过渡（让浏览器原生行为生效）", () => {
    const { getByTestId } = render(
      <RouteTransitionProvider>
        <AppLink href="/erp/home" data-testid="link">去首页</AppLink>
      </RouteTransitionProvider>
    );
    const a = getByTestId("link") as HTMLAnchorElement;
    act(() => { fireEvent.click(a, { ctrlKey: true }); });
    expect(a.dataset.pending).toBeUndefined();
    expect(document.body.dataset.routePending).toBeUndefined();
  });

  it("透传自定义 onClick 处理器", () => {
    const onClick = vi.fn();
    const { getByTestId } = render(
      <RouteTransitionProvider>
        <AppLink href="/erp/home" data-testid="link" onClick={onClick}>去首页</AppLink>
      </RouteTransitionProvider>
    );
    act(() => { fireEvent.click(getByTestId("link")); });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run:
```bash
npm run test -- src/components/transition/AppLink.test.tsx
```
Expected: FAIL with "Cannot find module './AppLink'"

- [ ] **Step 3: 实现 AppLink**

创建 `src/components/transition/AppLink.tsx`：

```tsx
"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef, useEffect, useState } from "react";
import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useRouteTransition } from "./RouteTransitionContext";

export type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  LinkProps & {
    children?: React.ReactNode;
  };

/**
 * 包装 next/link 的 Link：
 * - 点击时立即标记 data-pending=true 并触发 RouteTransition.startTransition
 * - 通过 useEffect 监听 isPending 变 false 自动清除 data-pending
 * - Ctrl/Meta/中键 / preventDefault 不触发过渡（保留浏览器原生行为）
 */
export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink(
  { onClick, href, ...rest },
  ref
) {
  const { startTransition, isPending } = useRouteTransition();
  const [pending, setPending] = useState(false);

  // 路由完成后清除自身的 pending 标记
  useEffect(() => {
    if (!isPending && pending) {
      setPending(false);
    }
  }, [isPending, pending]);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    ) {
      return;
    }
    setPending(true);
    startTransition(typeof href === "string" ? href : undefined);
  }

  return (
    <Link
      {...rest}
      href={href}
      ref={ref}
      onClick={handleClick}
      data-pending={pending ? "true" : undefined}
    />
  );
});
```

- [ ] **Step 4: 运行测试验证通过**

Run:
```bash
npm run test -- src/components/transition/AppLink.test.tsx
```
Expected: PASS（3 个测试）

- [ ] **Step 5: 提交**

```bash
git add src/components/transition/AppLink.tsx src/components/transition/AppLink.test.tsx
git commit -m "feat(transition): 添加 AppLink 链接包装组件"
```

---

## Task 5：全局 CSS 规则 —— 点击反馈与骨架屏延迟

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: 阅读现有 globals.css 末尾结构**

Run:
```bash
cd dj-web
wc -l src/app/globals.css
```
（记录行数，确保追加而不是覆盖）

- [ ] **Step 2: 在 globals.css 末尾追加点击反馈规则**

打开 `src/app/globals.css`，**在文件末尾追加**以下内容（不要修改前面任何内容）：

```css
/* ========================================
 * 路由过渡反馈（RouteTransition）
 * 配合 RouteTransitionProvider / AppLink 使用
 * ======================================== */

/* 被点击的具体元素：opacity 降低 + 禁用重复点击 */
[data-pending="true"] {
  opacity: 0.6;
  transition: opacity 80ms ease-out;
  pointer-events: none;
}

/* 全局 pending：光标变 progress */
body[data-route-pending="true"] {
  cursor: progress;
}

/* pending 时禁用 hover 视觉错觉 */
body[data-route-pending="true"] .t-accent:hover,
body[data-route-pending="true"] a:hover {
  filter: none;
}

/* loading.tsx 骨架屏延迟显示：避免快速跳转闪烁 */
@keyframes app-skeleton-fade-in {
  to { opacity: 1; }
}

.app-loading-root {
  opacity: 0;
  animation: app-skeleton-fade-in 200ms 200ms forwards;
}

/* 尊重用户的减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .app-loading-root {
    animation-duration: 1ms;
    animation-delay: 0ms;
  }
  [data-pending="true"] {
    transition: none;
  }
}
```

- [ ] **Step 3: 运行 lint 验证 CSS 没破坏**

Run:
```bash
npm run lint
```
Expected: PASS（无 lint 错误）

- [ ] **Step 4: 提交**

```bash
git add src/app/globals.css
git commit -m "style(transition): 追加点击反馈与骨架屏延迟显示全局规则"
```

---

## Task 6：通用骨架屏 `app/loading.tsx`

**Files:**
- Create: `src/app/loading.tsx`

- [ ] **Step 1: 创建通用兜底骨架屏**

创建 `src/app/loading.tsx`：

```tsx
/**
 * 全局通用骨架屏（兜底）
 * - 通过 .app-loading-root 的 200ms animation-delay 实现"延迟显示"
 *   200ms 内完成的跳转，骨架屏永远不会被看见
 * - 布局：标题占位 + 响应式卡片网格（手机 2 列 / 平板 3 / PC 4）
 * - 颜色：使用 var(--color-skeleton) / var(--color-border)，自动跟随主题
 */
export default function GlobalLoading() {
  return (
    <div
      className="app-loading-root flex h-full min-h-0 flex-col"
      role="status"
      aria-label="加载中"
    >
      {/* 标题占位 */}
      <div className="px-[var(--space-3)] py-[var(--space-3)]">
        <div className="h-6 w-32 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />
      </div>

      {/* 响应式卡片网格 */}
      <div className="flex-1 px-[var(--space-3)] pb-[var(--space-3)]">
        <div className="grid grid-cols-2 gap-[var(--space-3)] sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-[var(--space-3)]"
            >
              <div className="h-10 w-10 rounded-full bg-[var(--color-skeleton)] animate-pulse" />
              <div className="h-4 w-16 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />
              <div className="h-3 w-24 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: lint 验证**

Run:
```bash
npm run lint
```
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/app/loading.tsx
git commit -m "feat(transition): 添加全局通用骨架屏兜底"
```

---

## Task 7：`/erp/home` 专属骨架屏

**Files:**
- Read first: `src/app/erp/home/page.tsx`（理解结构）
- Create: `src/app/erp/home/loading.tsx`

- [ ] **Step 1: 阅读 home 页面真实结构**

Run:
```bash
cat src/app/erp/home/page.tsx
```
Expected: 看到 home 页的 JSX 结构（一般是上方搜索/banner + 下方功能卡片网格）

- [ ] **Step 2: 创建与实际结构对齐的骨架**

> **注意**：以下骨架是基于"首页 = 横向 banner + 功能区分类网格"的常见模式。
> 实施时如发现 `home/page.tsx` 结构差异较大，按"主要分块的位置和大小"调整即可，颜色与 `var(--color-skeleton)` 保持一致。

创建 `src/app/erp/home/loading.tsx`：

```tsx
/**
 * /erp/home 专属骨架屏
 * 结构与首页对齐：顶部 Banner / 功能分组卡片
 */
export default function HomeLoading() {
  return (
    <div
      className="app-loading-root flex h-full min-h-0 flex-col gap-[var(--space-3)] p-[var(--space-3)]"
      role="status"
      aria-label="加载中"
    >
      {/* 顶部 banner 占位 */}
      <div className="h-32 w-full rounded-[var(--radius-md)] bg-[var(--color-skeleton)] animate-pulse" />

      {/* 分组 1 标题 */}
      <div className="h-5 w-24 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />

      {/* 分组 1 网格 */}
      <div className="grid grid-cols-4 gap-[var(--space-2)]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`g1-${i}`}
            className="flex flex-col items-center gap-[var(--space-2)]"
          >
            <div className="h-12 w-12 rounded-[var(--radius-md)] bg-[var(--color-skeleton)] animate-pulse" />
            <div className="h-3 w-12 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />
          </div>
        ))}
      </div>

      {/* 分组 2 标题 */}
      <div className="h-5 w-24 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />

      {/* 分组 2 网格 */}
      <div className="grid grid-cols-4 gap-[var(--space-2)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`g2-${i}`}
            className="flex flex-col items-center gap-[var(--space-2)]"
          >
            <div className="h-12 w-12 rounded-[var(--radius-md)] bg-[var(--color-skeleton)] animate-pulse" />
            <div className="h-3 w-12 rounded-[var(--radius-sm)] bg-[var(--color-skeleton)] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: lint 验证**

Run:
```bash
npm run lint
```
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/app/erp/home/loading.tsx
git commit -m "feat(transition): 添加 /erp/home 专属骨架屏"
```

---

## Task 8：在 RootLayout 挂载 Provider 与进度条

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 阅读现有 layout.tsx**

Run:
```bash
cat src/app/layout.tsx
```
确认现有结构：`<html>` → `<body>` → `ThemeProvider` → `AppServicesProvider` → `DensityClient` + `Toaster` + `{children}`。

- [ ] **Step 2: 在 ThemeProvider 内部、AppServicesProvider 同层包裹 RouteTransitionProvider**

修改 `src/app/layout.tsx`，找到 imports 段尾部追加：

```tsx
import { RouteTransitionProvider } from "@/components/transition/RouteTransitionContext";
import { TopProgressBar } from "@/components/transition/TopProgressBar";
```

然后修改 JSX，把：

```tsx
<ThemeProvider>
  <AppServicesProvider>
    <DensityClient />
    {/* 全局提示容器（sonner） */}
    <Toaster position="top-center" richColors closeButton />
    {children}
  </AppServicesProvider>
</ThemeProvider>
```

改为：

```tsx
<ThemeProvider>
  <RouteTransitionProvider>
    <TopProgressBar />
    <AppServicesProvider>
      <DensityClient />
      {/* 全局提示容器（sonner） */}
      <Toaster position="top-center" richColors closeButton />
      {children}
    </AppServicesProvider>
  </RouteTransitionProvider>
</ThemeProvider>
```

> **位置说明**：`RouteTransitionProvider` 必须包裹所有可能调用 `useRouteTransition`/`useNavigateWithTransition`/`<AppLink>` 的子树。`<TopProgressBar />` 渲染顺序无影响（fixed 定位），但放在 Provider 紧内层最直观。

- [ ] **Step 3: lint 验证**

Run:
```bash
npm run lint
```
Expected: PASS

- [ ] **Step 4: 启动 dev 冒烟（手动）**

Run:
```bash
npm run dev
```

打开浏览器到 `http://localhost:3000/`（登录页）。手动检查：
- 页面正常渲染、无控制台错误
- 顶部不应出现进度条（idle 状态）
- DOM 检查器：`document.body` 没有 `data-route-pending` 属性

确认后停掉 dev。

- [ ] **Step 5: 提交**

```bash
git add src/app/layout.tsx
git commit -m "feat(transition): 在 RootLayout 挂载 RouteTransitionProvider 与 TopProgressBar"
```

---

## Task 9：BottomTabs 切换接入 useNavigateWithTransition

**Files:**
- Modify: `src/app/erp/layout.tsx`

- [ ] **Step 1: 阅读现有 ErpLayout**

Run:
```bash
cat src/app/erp/layout.tsx
```

确认它使用 `useRouter()` 实现底部 tab 跳转。

- [ ] **Step 2: 把 useRouter 替换为 useNavigateWithTransition**

修改 `src/app/erp/layout.tsx`：

把 import：
```tsx
import { usePathname, useRouter } from "next/navigation";
```

改为：
```tsx
import { usePathname } from "next/navigation";
import { useNavigateWithTransition } from "@/hooks/useNavigateWithTransition";
```

把组件内：
```tsx
const router = useRouter();
```

改为：
```tsx
const router = useNavigateWithTransition();
```

> 其余 `router.push(...)` 调用代码不需修改——`useNavigateWithTransition` 暴露了相同的 `push` 方法签名。

- [ ] **Step 3: lint 验证**

Run:
```bash
npm run lint
```
Expected: PASS

- [ ] **Step 4: dev 冒烟（手动 E2E 验证）**

Run:
```bash
npm run dev
```

iPhone XR 视口下：
1. 登录后到 `/erp/home`
2. 点击底部 "功能" tab → **应看到**：顶部进度条出现 → 路由切换到 `/erp/features` → 进度条冲到 100% 后淡出
3. 点击 "首页" tab → **应看到**：顶部进度条 + `/erp/home` 专属骨架屏（如果数据加载 >200ms）
4. 快速来回点击 tab → 不应出现页面假死、不应有 JS 错误
5. DOM 检查器：跳转期间 `document.body` 应有 `data-route-pending="true"`，光标变 `progress`

- [ ] **Step 5: 提交**

```bash
git add src/app/erp/layout.tsx
git commit -m "feat(transition): BottomTabs 切换接入 useNavigateWithTransition"
```

---

## Task 10：高频卡片链接迁移到 `<AppLink>`（渐进迁移示范）

**Files:**
- Modify: `src/app/erp/features/page.tsx`（如果使用了 `<Link>`，作为迁移示范）

> **说明**：此 Task 只做**1 个示范文件**的迁移。其余 `<Link>` 与 `router.push` 调用点交给后续 PR 渐进迁移，避免单次改动过大。

- [ ] **Step 1: 找到一个高频使用 `<Link>` 的页面**

Run:
```bash
grep -nE 'from "next/link"' src/app/erp/features/page.tsx src/app/erp/me/page.tsx 2>/dev/null
```

选定一个（建议 `src/app/erp/features/page.tsx`，如不含 `Link` 则尝试 `me/page.tsx`）。

- [ ] **Step 2: 替换 import**

把：
```tsx
import Link from "next/link";
```

改为：
```tsx
import { AppLink as Link } from "@/components/transition/AppLink";
```

> **小技巧**：用 `as Link` 别名可避免大面积重命名 JSX。

- [ ] **Step 3: lint + 类型检查**

Run:
```bash
npm run lint
```
Expected: PASS

- [ ] **Step 4: dev 冒烟**

启动 dev，进入该页面：
1. 点击其中一个 `Link` 卡片
2. 应看到该卡片立即 `opacity:0.6`（被点击的视觉确认）
3. 顶部进度条出现，目标页加载完成后清除
4. 同时 `<body data-route-pending>` 切换正常

- [ ] **Step 5: 提交**

```bash
git add src/app/erp/features/page.tsx
git commit -m "refactor(transition): features 页 Link 迁移到 AppLink（示范）"
```

---

## Task 11：最终验证与全量测试

**Files:** 无（仅运行验证）

- [ ] **Step 1: 全量单测**

Run:
```bash
npm run test
```
Expected: 所有测试通过；transition 相关 4 个测试文件全部 PASS。

- [ ] **Step 2: lint**

Run:
```bash
npm run lint
```
Expected: PASS

- [ ] **Step 3: 生产构建冒烟**

Run:
```bash
npm run build
```
Expected: 构建成功，无 TypeScript 错误、无 Next.js 警告（关于 RSC/CSR 边界）。

- [ ] **Step 4: iPhone XR 视口手动 E2E**

启动 `npm run dev`，使用 playwright-mcp 或 Chrome DevTools 设置为 iPhone XR (414×896)，依次验证：

| 操作 | 预期 |
|------|------|
| 登录后跳到 `/erp/home` | 顶部进度条出现 → 消失；快速跳转无骨架闪烁 |
| `/erp/home` → 点 "功能" tab | 进度条 + 骨架屏（如 >200ms） |
| `/erp/features` → 点功能分类 | 进度条出现，进入功能详情页 |
| 浏览器后退按钮 | 进度条出现 → 路径变化后正常关闭 |
| 跳转中再次点击同一卡片 | 卡片 `pointer-events:none` 阻止重复点击 |
| 跳转中切到其他浏览器 tab 再回来 | 进度条不丢失、最终正常关闭 |
| 切换深色/浅色主题后跳转 | 进度条颜色跟随主题（`var(--color-accent)`） |

- [ ] **Step 5: 提交"完成"标记（无代码变更，仅 commit message 收尾）**

```bash
git log --oneline -15
```

确认 11 个 task 的 commits 都存在。如有最终细节修复，在此 commit。

---

## 风险提醒

1. **同路径跳转**（`router.push` 到当前 URL）`pathname` 不变，靠 5s 超时兜底。如果项目里大量存在"点击当前 tab 刷新"的逻辑，超时阈值可能体验不佳——届时再缩短到 2s 或显式禁用同路径跳转。
2. **AppLink 渐进迁移期间**老 `<Link>` 元素无个体反馈，但 body 全局 `data-route-pending` 仍生效，最低体验仍优于改造前。
3. **骨架屏延迟显示用 CSS animation-delay** 在极慢机型可能仍闪烁——若发现实际问题，把 `app-loading-root` 改为 JS 计时器版本（`useEffect` 200ms 后切 `opacity:1`）。
4. **`cursor: progress`** 在触屏设备上不可见——这是 PC 体验增强，不影响移动端核心。

## 自审清单

- ✅ Spec 第 4 节模块清单 → 全部对应 Task 1/2/3/4/6/7
- ✅ Spec 第 6 节 globals.css 规则 → Task 5
- ✅ Spec 第 7 节集成清单 → Task 8（layout）+ Task 9（ErpLayout）+ Task 10（迁移示范）
- ✅ Spec 第 8 节边界场景 → reducer 测试覆盖 START/END/TIMEOUT；超时兜底测试覆盖同路径跳转
- ✅ Spec 第 9 节测试策略 → reducer 单测必须有 ✓；TopProgressBar、AppLink、useNavigateWithTransition 各有单测 ✓；E2E 在 Task 11 手动验证
- ✅ 类型一致：`startTransition(targetPath?: string)` 在 Context/AppLink/useNavigateWithTransition 三处签名一致；`endTransition()` 无参数一致
- ✅ Spec 第 11 节实施分阶段 → 计划 Task 1-11 完全对应（基础设施 → 导航 API → 骨架屏 → 集成 → 迁移示范 → 验证）
- ✅ 无 TBD/TODO/"add appropriate error handling" 等占位符
- ✅ 每个 step 都有可运行命令 + 预期输出 / 完整代码块
