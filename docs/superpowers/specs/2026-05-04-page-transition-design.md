# 页面跳转过渡体验优化设计

- **状态**: Draft
- **日期**: 2026-05-04
- **范围**: `dj-web/` Next.js 15 App Router 全站路由跳转体验

## 1. 背景与问题

当前 `dj-web` 项目在路由跳转时存在**假死感**：

- 用户点击 `BottomTabs`、卡片、`<Link>` 等触发跳转后，**界面无任何即时反馈**。
- 仅 `/erp/features` 路由有 `loading.tsx` 骨架屏，其余路由（`/erp/home`、`/erp/me`、功能详情页等）**完全无加载提示**，用户在数据获取期间面对的是上一页的静态画面。
- `BottomTabs` 通过 `router.push` 切换标签时，没有"被点击"的视觉反馈，用户疑惑"我点了没"。

这种"假死"感的本质是三个层面的反馈缺失：

1. **点击瞬时反馈缺失** — 用户不确定操作是否被接收。
2. **过渡进度反馈缺失** — 用户不知道系统是否在工作。
3. **页面结构预期缺失** — 用户不知道下个页面长什么样、还要等多久。

## 2. 目标与非目标

### 目标

- 在跳转开始的 **0ms** 内向用户提供"已被点击"的视觉确认。
- 在跳转过程中提供持续的进度感知（顶部进度条）。
- 对超过 200ms 的跳转，提供页面结构预期（骨架屏）。
- 兼容深色模式与项目密度（density）系统，不破坏现有主题 token 体系。
- 渐进式接入，不要求一次性改造全部 `<Link>` 与 `router.push` 调用。

### 非目标

- 不实现页面切换的淡入淡出动画（避免动画堆叠）。
- 不实现 Ripple 水波纹（与项目极简风格不符）。
- 不为所有 9 条路由都写专属骨架屏（用通用骨架兜底）。
- 不实现真实进度感知（采用业界通用 0→90% 渐进涨的常见模式）。
- 不解决慢路由的根本性能问题（那是后端 / 数据层的责任）。

## 3. 设计概览

引入**三层反馈体系**，覆盖跳转生命周期的不同阶段：

```
Layer 1：点击瞬时反馈（0ms 延迟）
  - 被点击元素：data-pending="true" → opacity 0.6 + pointer-events:none
  - <body>：data-route-pending="true" → cursor:progress + 禁用 hover

Layer 2：顶部进度条（0ms 出现，淡入约 80ms）
  - 1-2px 细线，主题色（var(--color-accent)）
  - 0→90% 渐进涨，完成时冲到 100%，200ms 后淡出

Layer 3：骨架屏（200ms 后显示）
  - 通用兜底骨架（src/app/loading.tsx）
  - /erp/home 专属骨架
  - /erp/features 已有骨架（保留）
```

### 状态机

```
idle ──[click / router.push]──> pending ──[到达]──> idle
                                  │
                                  └──[5s 超时兜底]──> idle
```

- 进度条贯穿 `pending` 整个阶段。
- `<body data-route-pending>` 与 `pending` 状态同步。
- 骨架屏通过 Next.js 原生 `loading.tsx` 机制由路由系统决定，**显示时机**通过 CSS `animation-delay: 200ms` 控制——200ms 内完成的跳转，骨架屏永远不会被看见。

## 4. 模块拆分

按"小单元、清晰边界"原则，方案拆分为 6 个独立模块：

| # | 模块 | 路径 | 职责 | 依赖 |
|---|------|------|------|------|
| 1 | `RouteTransitionContext` | `src/components/transition/RouteTransitionContext.tsx` | 全局状态源：`isPending`、`startTransition()`、`endTransition()`。基于 React Context + `useReducer` | 无 |
| 2 | `RouteTransitionProvider` | 同上 | 监听 `usePathname` 自动 `endTransition()`；同步 `<body data-route-pending>`；管理 5s 超时计时器 | 1 |
| 3 | `TopProgressBar` | `src/components/transition/TopProgressBar.tsx` | 自研顶部进度条 UI，监听 context 状态切换动画 | 1 |
| 4 | `AppLink` | `src/components/transition/AppLink.tsx` | 包装 `next/link` 的 `<Link>`，点击时 `startTransition()` 并把自身 `data-pending=true` | 1 |
| 5 | `useNavigateWithTransition` | `src/hooks/useNavigateWithTransition.ts` | 包装 `useRouter`，暴露 `push/replace/back`，每个方法自动调用 `startTransition()` | 1 |
| 6 | 通用骨架屏 | `src/app/loading.tsx`（**新增**） | 顶部标题占位 + 主体响应式卡片网格占位 | 无 |
| 6.1 | home 专属骨架 | `src/app/erp/home/loading.tsx`（**新增**） | 与 `/erp/home` 实际结构对齐 | 无 |

### 4.1 `RouteTransitionContext` 接口

```ts
interface RouteTransitionState {
  isPending: boolean;
  /** 当前跳转目标的 pathname，用于"同路径跳转"超时兜底 */
  targetPath: string | null;
}

interface RouteTransitionContextValue {
  isPending: boolean;
  /** 开启过渡。targetPath 用于跳转完成对比 */
  startTransition: (targetPath?: string) => void;
  /** 主动结束过渡（一般由 Provider 内部调用） */
  endTransition: () => void;
}
```

Reducer 负责三类 action：`START`、`END`、`TIMEOUT`。`TIMEOUT` 由 5s 兜底计时器派发，与 `END` 行为一致但用于日志/调试区分。

### 4.2 `RouteTransitionProvider` 行为

- 通过 `usePathname()` 监听路径变化：当 `targetPath !== null && pathname !== prevPathname` 时调用 `endTransition()`。
- 通过 `useEffect` 同步 `document.body.dataset.routePending`，进入 `pending` 时设为 `"true"`，结束时移除。
- `startTransition` 调用时启动 `setTimeout(endTransition, 5000)` 兜底；`endTransition` 时清除。
- SSR 阶段：state 初始 `isPending: false`，DOM 操作只在 `useEffect` 内执行，无水合不一致。

### 4.3 `TopProgressBar` 实现要点

- DOM：`<div role="progressbar" aria-hidden={!isPending}>` 固定在 `position: fixed; top: 0; left: 0`。
- 状态切换通过 className（`is-pending` / `is-complete`）驱动 CSS 动画，不用 JS 控制每帧 width。
- CSS 动画规范：

```css
.top-progress-bar {
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

.top-progress-bar.is-pending {
  opacity: 1;
  animation: top-progress-grow 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.top-progress-bar.is-complete {
  width: 100%;
  opacity: 0;
  transition: width 200ms ease-out, opacity 200ms ease-out 200ms;
}

@keyframes top-progress-grow {
  0%   { width: 0%; }
  10%  { width: 30%; }
  100% { width: 90%; }
}
```

- Page Visibility 处理：`document.visibilityState === 'hidden'` 时给元素加 `animation-play-state: paused`（CSS 媒介查询或 JS 监听皆可）。

### 4.4 `AppLink` 实现要点

```tsx
"use client";
import Link, { LinkProps } from "next/link";
import { useRouteTransition } from "./RouteTransitionContext";

export function AppLink(props: LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { startTransition } = useRouteTransition();
  const [pending, setPending] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.button !== 0) return;
    setPending(true);
    startTransition(typeof props.href === "string" ? props.href : undefined);
    props.onClick?.(e);
  };

  // 在路由完成后通过 isPending 变 false 自动重置 pending（useEffect 监听）
  // ...

  return <Link {...props} data-pending={pending || undefined} onClick={handleClick} />;
}
```

### 4.5 `useNavigateWithTransition` 实现要点

```ts
export function useNavigateWithTransition() {
  const router = useRouter();
  const { startTransition } = useRouteTransition();

  return useMemo(() => ({
    push: (href: string) => { startTransition(href); router.push(href); },
    replace: (href: string) => { startTransition(href); router.replace(href); },
    back: () => { startTransition(); router.back(); },
  }), [router, startTransition]);
}
```

### 4.6 通用骨架屏 `src/app/loading.tsx`

- 布局：`<div>` 容器，2 行结构（标题占位 + 卡片网格占位）。
- 网格：手机 2 列 / 平板 3 列 / PC 4 列，使用项目现有响应式断点。
- 颜色：`bg-[var(--color-skeleton)]`、`border-[var(--color-border)]`，使用 `animate-pulse`。
- 延迟显示：

```css
@keyframes skeleton-fade-in { to { opacity: 1; } }

.app-loading-root {
  opacity: 0;
  animation: skeleton-fade-in 200ms 200ms forwards;
}
```

200ms `animation-delay` 保证短跳转不闪骨架。

## 5. 数据流

```
用户点击 <AppLink> 或 useNavigateWithTransition().push()
   │
   ▼
RouteTransitionContext.startTransition(targetPath)
   ├─→ 立即：isPending=true
   ├─→ 立即：body[data-route-pending]=true（useEffect）
   ├─→ 立即：被点击元素 data-pending=true（AppLink 内部 state）
   ├─→ TopProgressBar 立即开始 0→90% 动画
   └─→ 启动 5s 兜底超时
   │
   ▼
Next.js 完成路由切换（usePathname 变化）
   │
   ▼
Provider useEffect 检测 pathname 变化 → endTransition()
   ├─→ isPending=false
   ├─→ 清除 body 标记
   ├─→ AppLink useEffect 清除元素 data-pending
   ├─→ TopProgressBar 切换到 is-complete → 100% 后淡出
   └─→ 清除 5s 超时
```

## 6. 样式与主题集成

### 6.1 `globals.css` 新增规则

```css
/* 被点击的具体元素 */
[data-pending="true"] {
  opacity: 0.6;
  transition: opacity 80ms ease-out;
  pointer-events: none;
}

/* 全局 pending 状态 */
body[data-route-pending="true"] {
  cursor: progress;
}

/* pending 时禁用 hover 错觉 */
body[data-route-pending="true"] .t-accent:hover,
body[data-route-pending="true"] a:hover {
  filter: none;
}
```

### 6.2 主题 token 依赖

- `var(--color-accent)` — 进度条颜色，自动跟随主题切换（深色/浅色）。
- `var(--color-skeleton)` — 骨架屏底色，已存在于 `tokens.css`。
- `var(--color-border)` — 骨架屏边框，已存在。

不引入新 token；如已有 `--color-accent-glow` 则使用，否则进度条 `box-shadow` 直接复用 `--color-accent`。

## 7. 集成清单

| 改动点 | 文件 | 改动内容 |
|--------|------|----------|
| 全局挂载 Provider 和进度条 | `src/app/layout.tsx` | 在 `<ThemeProvider>` 内、`<AppServicesProvider>` 外侧包裹 `<RouteTransitionProvider>` 与 `<TopProgressBar />` |
| 替换 BottomTabs 的 `router.push` | `src/app/erp/layout.tsx` | `useRouter` → `useNavigateWithTransition` |
| 通用骨架屏 | `src/app/loading.tsx`（**新增**） | 见 4.6 |
| 专属 home 骨架屏 | `src/app/erp/home/loading.tsx`（**新增**） | 与 home 实际结构对齐（首页结构由实施阶段确认） |
| 全局点击反馈 CSS | `src/app/globals.css` | 追加 6.1 规则 |
| `<Link>` 替换为 `<AppLink>` | 现有 `next/link` 使用点（10 个文件） | **渐进迁移**，本设计不要求一次完成 |
| `router.push` 替换 | 现有调用点 | **渐进迁移**，先改 `BottomTabs`，其余跟进 |

## 8. 边界场景与错误处理

| 场景 | 行为 |
|------|------|
| 跳转到当前路由（同 URL） | `usePathname` 不变 → 5s 超时兜底关闭 |
| 快速连续点击多个链接 | 后点击的 `targetPath` 覆盖前一个；`pointer-events:none` 阻止同元素重复点击 |
| 浏览器后退/前进 | `usePathname` 变化触发正常 `endTransition()` |
| 跳转目标 server 抛错 | Next.js 渲染最近 `error.tsx`，`usePathname` 仍变化 → 正常关闭 |
| 跳转到第三方 / 外部 redirect | 5s 超时兜底关闭 |
| SSR 阶段 | `isPending: false` 初始值，DOM 操作仅在 `useEffect` 内执行 |
| 跳转中切换标签页 | Page Visibility 监听暂停 CSS 动画；恢复时继续 |
| 用户在 pending 中再次点击同元素 | `pointer-events: none` 已禁用 |
| 用户在 pending 中点击其他链接 | 允许，新的 `targetPath` 覆盖旧的 |

## 9. 测试策略

| 层级 | 内容 | 工具 |
|------|------|------|
| **单元（必须）** | `RouteTransitionContext` reducer：`START` / `END` / `TIMEOUT` 三个分支 | 项目已有的测试框架 |
| 单元 | `TopProgressBar`：根据 `isPending` 切换 className `is-pending` / `is-complete` | Testing Library |
| 集成 | 点击 `<AppLink>` → body 标记 + 元素标记同时出现；模拟 pathname 变化后清除 | Testing Library + jsdom |
| 集成 | `useNavigateWithTransition().push()` → `router.push` 被调用且 `startTransition` 被触发 | Testing Library |
| E2E（推荐） | iPhone XR 视口，从 `/erp/home` 跳到 `/erp/features`：进度条出现 → 消失；快跳转无骨架；慢跳转 200ms 后骨架淡入 | playwright-mcp |

最低门槛：reducer 单测必须有，5s 超时分支必须用测试锁住。

## 10. 风险与权衡

| 风险 | 影响 | 缓解 |
|------|------|------|
| `<body data-route-pending>` 全局选择器可能与现有 CSS 冲突 | 中 | 仅作用于 `cursor` 与少量 hover 规则，影响面可控；如冲突则收敛到容器级 |
| 5s 超时兜底可能误关闭真实超长跳转 | 低 | 6s+ 跳转本身是后端问题；超时阈值后续可调 |
| `<AppLink>` 渐进式替换期间老 `<Link>` 元素无个体反馈 | 中 | body 全局标记仍生效，至少不假死 |
| `router.push` 调用分散在 10 个 ClientPage 文件 | 中 | 同上，渐进迁移；可选追加 ESLint 规则警告直接 `useRouter` |
| CSS animation-delay 在极慢机型仍可能闪烁 | 低 | 用户机型可控；必要时降级 JS 计时器 |
| Page Visibility 暂停动画在 Safari 旧版本支持不全 | 低 | 退化为不暂停，影响极小 |

## 11. 实施分阶段（建议给 writing-plans 参考）

1. **阶段 1：核心基础设施**
   - `RouteTransitionContext` + `Provider` + reducer 单测
   - `TopProgressBar` 组件 + CSS
   - 在 `app/layout.tsx` 顶层挂载

2. **阶段 2：导航 API 与高频替换**
   - `useNavigateWithTransition` hook
   - `AppLink` 组件
   - 改造 `BottomTabs` / `ErpLayout` 使用新 API

3. **阶段 3：骨架屏**
   - `src/app/loading.tsx` 通用骨架
   - `src/app/erp/home/loading.tsx` 专属骨架
   - `globals.css` 追加 `[data-pending]` / `[data-route-pending]` 规则

4. **阶段 4：渐进迁移**
   - 把高频卡片 `<Link>` 替换为 `<AppLink>`
   - 把高频 `router.push` 替换为 `useNavigateWithTransition`
   - 不要求一次性完成

5. **阶段 5：验证**
   - `npm run lint`
   - playwright-mcp 在 iPhone XR 视口下手动验证三层反馈
