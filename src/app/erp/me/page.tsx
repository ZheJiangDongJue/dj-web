"use client";

/* eslint-disable @next/next/no-img-element */

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_DB_NAME } from "@/lib/config";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useResponsiveDensity } from "@/lib/useResponsiveDensity";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { MainFill } from "../../../components/layout/MainFill";
import { addAndroidNotificationListener, initAndroidBridge } from "@/lib/android-bridge";

type FetchState = "idle" | "loading" | "success" | "error";

interface UserProfile {
  name: string;
  avatarUrl: string;
}

type FetchUserProfileResult = { profile: UserProfile; isFallback: boolean };

type UserProfileApiResponse = {
  name?: unknown;
  avatarUrl?: unknown;
  Name?: unknown;
  AvatarUrl?: unknown;
};

/**
 *
 * 调试开关：cookie `debug=true/1/yes/on` 时输出关键流程日志。
 * 说明：仅用于定位路由跳转/登录态问题，默认不输出，避免污染控制台。
 *
 */
function isDebugCookieEnabled(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const raw = document.cookie ?? "";
    if (!raw) return false;
    return /(?:^|;\s*)debug=(?:true|1|yes|on)(?:;|$)/i.test(raw);
  } catch {
    return false;
  }
}

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 *
 * 生成占位头像（data URL），避免依赖外网资源。
 *
 */
function buildPlaceholderAvatarUrl(name: string): string {
  const trimmed = (name ?? "").trim();
  const initial = trimmed ? trimmed.slice(0, 1) : "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="#E5E7EB"/><text x="64" y="76" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto" font-size="56" fill="#6B7280">${escapeXml(initial)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function readFallbackNameFromStorage(): string | null {
  try {
    const raw = localStorage.getItem("erp:userInfo") ?? localStorage.getItem("userInfo");
    if (!raw) return null;
    const obj = JSON.parse(raw) as { name?: unknown; loginName?: unknown; userName?: unknown; username?: unknown };
    const name =
      (typeof obj?.name === "string" && obj.name.trim()) ||
      (typeof obj?.loginName === "string" && obj.loginName.trim()) ||
      (typeof obj?.userName === "string" && obj.userName.trim()) ||
      (typeof obj?.username === "string" && obj.username.trim()) ||
      "";
    return name ? name : null;
  } catch {
    return null;
  }
}

/**
 *
 * 拉取用户资料（名称与头像）。
 * - 优先调用后端 `/Me/GetProfile`（需要登录态）；
 * - 任意失败场景返回本地占位数据，避免页面崩溃。
 *
 */
async function fetchUserProfile(dbName?: string, userId?: number): Promise<FetchUserProfileResult> {
  const fallbackName = readFallbackNameFromStorage() ?? "访客";
  const fallback: UserProfile = { name: fallbackName, avatarUrl: buildPlaceholderAvatarUrl(fallbackName) };

  const db = typeof dbName === "string" && dbName.trim() ? dbName.trim() : undefined;
  const uid = typeof userId === "number" && Number.isFinite(userId) && userId > 0 ? userId : undefined;
  if (!db || !uid) {
    return { profile: fallback, isFallback: true };
  }

  const parse = (res: UserProfileApiResponse): UserProfile | null => {
    const nameRaw = (res as any)?.name ?? (res as any)?.Name;
    const avatarRaw = (res as any)?.avatarUrl ?? (res as any)?.AvatarUrl;
    const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
    const avatarUrl = typeof avatarRaw === "string" ? avatarRaw.trim() : "";
    if (!name) return null;
    return { name, avatarUrl: avatarUrl || buildPlaceholderAvatarUrl(name) };
  };

  const tryFetch = async (path: string): Promise<UserProfile | null> => {
    try {
      const res = await apiClient.getJson<UserProfileApiResponse>(path, { query: { dbName: db, userId: uid } });
      return parse(res);
    } catch {
      return null;
    }
  };

  const prof = (await tryFetch("/Me/GetProfile")) ?? (await tryFetch("/api/Me/GetProfile"));
  if (prof) return { profile: prof, isFallback: false };
  return { profile: fallback, isFallback: true };
}


/**
 *
 * 个人中心页面（仅头像、名称与退出登录）。
 * - 移动端优先布局，简洁清晰；
 * - 组件内状态与副作用具备失败兜底，保证健壮性；
 *
 */
/**
 *
 * MePage 个人中心组件内部实现。
 * - 展示用户头像与名称；
 * - 提供退出登录能力；
 * - 初始化时根据 URL/localStorage 推断登录态并拉取资料。
 *
 */
function MePageInner() {
  const router = useRouter();
  const redirectToLogin = useCallback((url: string) => {
    try {
      router.replace(url);
    } catch {
      try {
        window.location.assign(url);
      } catch {
        // ignore
      }
    }
  }, [router]);
  const { refresh, logout } = useAuth({ redirectToLogin });
  const [state, setState] = useState<FetchState>("idle");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // 退出登录中的本地状态，用于控制按钮禁用与加载动效
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const isDebug = useMemo(() => isDebugCookieEnabled(), []);
  const searchParams = useSearchParams();
  // 根据屏幕方向/高度自动切换全局密度（仅影响尺寸与间距）
  useResponsiveDensity();
  const hasNavigatedByShakeRef = useRef(false);

  interface AuthState { dbName: string; userId: number }

  /**
   *
   * 从 URL 与 localStorage 猜测真实登录用户（dbName/userId）。
   * - 优先 URL 查询参数（便于调试）；
   * - 其次尝试常见本地存储 key（兼容历史实现）；
   *
   */
  const resolveAuthState = useCallback((): AuthState | null => {
    try {
      // 1) URL 参数
      const dbNameInUrl = searchParams.get("dbName");
      const userIdInUrl = Number(searchParams.get("userId"));
      if (dbNameInUrl && Number.isFinite(userIdInUrl) && userIdInUrl > 0) {
        return { dbName: dbNameInUrl, userId: userIdInUrl };
      }

      // 2) 本地存储（尝试多个候选 key）
      const candidates = [
        "erp:auth",
        "erp-auth",
        "dj-auth",
        "auth",
        "login",
        "user",
      ];

      for (const key of candidates) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const obj = JSON.parse(raw);
          const db = obj?.dbName ?? obj?.DbName ?? obj?.dbname;
          const id = obj?.UserInfo?.id ?? obj?.userInfo?.id ?? obj?.userId ?? obj?.userid;
          if (typeof db === "string" && Number.isFinite(Number(id)) && Number(id) > 0) {
            return { dbName: db, userId: Number(id) };
          }
        } catch {
          // ignore parse error
        }
      }

      // 3) 拆分存储的可能（dbName 与 userInfo 分开保存）
      const dbSplit = localStorage.getItem("erp:dbName") ?? localStorage.getItem("dbName");
      const userInfoSplit = localStorage.getItem("erp:userInfo") ?? localStorage.getItem("userInfo");
      if (dbSplit && userInfoSplit) {
        const ui = JSON.parse(userInfoSplit);
        const id = ui?.id ?? ui?.UserInfo?.id;
        if (typeof dbSplit === "string" && Number.isFinite(Number(id)) && Number(id) > 0) {
          return { dbName: dbSplit, userId: Number(id) };
        }
      }
    } catch {
      // ignore
    }
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (!isDebug) return;
    console.info("[erp.me] mounted", {
      pathname: window.location.pathname,
      search: window.location.search,
    });
    return () => {
      console.info("[erp.me] unmounted", {
        pathname: window.location.pathname,
        search: window.location.search,
      });
    };
  }, [isDebug]);

  /**
   *
   * 初始化拉取个人信息。
   *
   */
  const init = useCallback(async () => {
    setState("loading");
    let dbName: string | undefined;
    let userId: number | undefined;

    const auth = resolveAuthState();
    if (auth) {
      dbName = auth.dbName;
      userId = auth.userId;
      if (isDebug) {
        console.info("[erp.me] resolved auth from url/storage", { dbName, userId });
      }
    } else {
      // 无本地态时，尝试静默刷新获取 userId；dbName 用默认租户名
      try {
        const res = await refresh();
        dbName = DEFAULT_DB_NAME;
        userId = res.user.id;
        if (isDebug) {
          console.info("[erp.me] refresh success", { dbName, userId });
        }
        // 写入本地，便于后续页面/刷新后继续使用（不包含敏感信息）
        try {
          localStorage.setItem("erp:dbName", dbName);
          localStorage.setItem("erp:userInfo", JSON.stringify({ id: res.user.id, name: res.user.name }));
        } catch {}
      } catch (e) {
        if (isDebug) {
          console.warn("[erp.me] refresh failed", {
            message: (e as any)?.message,
          });
        }
      }
    }

    const { profile: prof, isFallback } = await fetchUserProfile(dbName, userId);
    if (isDebug) {
      console.info("[erp.me] fetch profile done", {
        hasDbName: Boolean(dbName),
        hasUserId: typeof userId === "number" && userId > 0,
        isFallback,
      });
    }
    setProfile(prof);
    setState(isFallback ? "error" : "success");
  }, [resolveAuthState, refresh, isDebug]);

  useEffect(() => {
    void init();
  }, [init]);

  /**
   *
   * 监听原生摇一摇事件：收到 deviceShake 通知后跳转桥接调试页面。
   * - 通过 ref 保证单次跳转，避免短时间内的重复 push；
   * - 页面卸载时重置 ref，返回本页后可再次响应摇动。
   *
   */
  useEffect(() => {
    initAndroidBridge();
    const off = addAndroidNotificationListener(({ type }) => {
      if (type !== "deviceShake" || hasNavigatedByShakeRef.current) {
        return;
      }
      hasNavigatedByShakeRef.current = true;
      try {
        router.push("/dev/android-bridge");
      } catch {
        try {
          window.location.href = "/dev/android-bridge";
        } catch {
          // ignore navigation fallback failure
        }
      }
    });

    return () => {
      hasNavigatedByShakeRef.current = false;
      off();
    };
  }, [router]);

  /**
   *
   * 退出登录：
   * 1) 尝试调用后端 Logout；
   * 2) 清理本地可能的登录态（如 localStorage 中的自定义条目）；
   * 3) 跳转至登录页。
   *
   */
  /**
   *
   * 清理本地登录态（覆盖常见键名，以兼容历史实现）。
   *
   */

  /**
   *
   * 导航到登录页。
   * - 使用 `router.replace` 避免返回到已退出的受保护页面。
   * - 附带 `from=logout`，使中间件在已登录 Cookie 未及时清除时仍放行登录页，避免被重定向到功能首页。
   * - 提供 `window.location.replace` 作为兼容降级。
   *
   */

  /**
   *
   * 退出登录处理：
   * - 总是调用 /api/auth/logout 以让服务端通过 Set-Cookie 清除 refreshToken（HttpOnly，无法由前端清理）。
   * - 随后调用后端业务 /Me/Logout（可选，清理服务端会话）。
   * - 最后清理本地态并跳转登录页。
   *
   */
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout({ reason: "manual-logout" });
    } finally {
      // If navigation fails/delays, keep UI consistent.
      setIsLoggingOut(false);
    }
  }, [logout]);

  // 从本地 userInfo 解析登录名
  const loginName = useMemo(() => {
    try {
      const raw = localStorage.getItem('erp:userInfo') || localStorage.getItem('userInfo');
      if (!raw) return null;
      const ui = JSON.parse(raw);
      return ui?.loginName ?? ui?.userName ?? ui?.username ?? null;
    } catch { return null; }
  }, []);

  // 是否展示骨架屏（仅在加载中/暂无资料时显示）
  const showSkeleton = state === "loading" || !profile;
  const data = profile;

  /**
   *
   * 处理跳转到设置入口：通过查询参数标识目标分区，避免 404。
   * - 后续若新增实际路由，可将此逻辑替换为 router.push('/erp/xxx')；
   *
   */
  const handleNavigateSettings = useCallback(
    (section: 'general' | 'account' | 'notification' | 'privacy' | 'about') => {
      try {
        // 关于与帮助：跳转至开发桥接页面
        if (section === 'about') {
          router.push('/dev/android-bridge');
          return;
        }
        const usp = new URLSearchParams(window.location.search);
        usp.set('section', section);
        router.push(`/erp/me?${usp.toString()}`);
      } catch {
        // 忽略异常，导航失败不影响页面
      }
    },
    [router]
  );

  /**
   *
   * 设置入口清单（可扩展）。
   *
   */
  const settingEntries: { key: 'general' | 'account' | 'notification' | 'privacy' | 'about'; label: string }[] = [
    // { key: 'general', label: '通用设置' },
    // { key: 'account', label: '账号设置' },
    // { key: 'notification', label: '通知偏好' },
    // { key: 'privacy', label: '隐私与安全' },
    // { key: 'about', label: '关于与帮助' },
  ];

  return (
    <MainFill className="w-full p-[var(--space-4)]">
      {/* 顶部：资料卡片 */}
      <section
        className="w-full max-w-md t-card t-glass p-[var(--space-3)] sm:p-[var(--space-4)] mx-auto"
        aria-label="个人中心"
      >
        <div className="l-stack items-center">
          {/* 头像 */}
          <div className="size-24 shrink-0 overflow-hidden rounded-full">
            {showSkeleton ? (
              <Skeleton className="size-full rounded-full" />
            ) : (
              // 使用普通 img，避免对 next/image 额外配置依赖
              <img
                src={data!.avatarUrl}
                alt={data!.name}
                className="size-full object-cover"
                loading="eager"
                decoding="async"
              />
            )}
          </div>

          {/* 名称 */}
          <div className="text-center">
            <h1 className="t-text-primary text-xl font-semibold tracking-tight">
              {showSkeleton ? (
                <Skeleton as="span" aria-hidden="true" className="inline-block h-6 w-32" />
              ) : (
                data!.name
              )}
            </h1>
            <p className="t-text-secondary mt-[var(--space-1)] text-sm">
              {showSkeleton ? (
                <Skeleton as="span" aria-hidden="true" className="inline-block h-4 w-40" />
              ) : (
                <>登录名：{loginName ?? '—'}</>
              )}
            </p>
            <p className="t-text-tertiary mt-[var(--space-1)] text-xs">
              {state === "loading" && "加载中..."}
              {state === "error" && "加载资料失败，已显示占位信息"}
              {state === "success" && " "}
            </p>
          </div>
        </div>
      </section>

      {/* 设置入口组：通用设置、账号设置等 */}
      <section
        className="w-full max-w-md t-card t-glass mx-auto mt-[var(--space-3)] sm:mt-[var(--space-4)]"
        aria-label="功能入口"
      >
        <ul className="divide-y divide-neutral-200/70 dark:divide-neutral-800">
          {settingEntries.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => handleNavigateSettings(item.key)}
                className="w-full px-[var(--space-3)] py-[var(--space-3)] sm:px-[var(--space-4)] flex items-center justify-between text-left hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 focus-visible:outline-none"
                aria-label={item.label}
              >
                <span className="t-text-primary text-sm font-medium">{item.label}</span>
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  className="t-text-tertiary"
                  aria-hidden
                >
                  <path fill="currentColor" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 占位：将底部操作推至页面底部（MainFill 为 flex-col） */}
      <div className="flex-1" aria-hidden="true" />

      {/* 底部：退出登录按钮（与卡片脱离，贴底显示） */}
      <div className="w-full max-w-md mx-auto mt-[var(--space-4)] px-[var(--space-1)] sm:px-0 pb-[var(--space-2)]">
        <button
          type="button"
          onClick={handleLogout}
          className="t-accent w-full rounded-[var(--radius-md)] inline-flex items-center justify-center text-sm font-medium focus-visible:outline-none disabled:opacity-50 gap-[var(--space-1)]"
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
          aria-label="退出账号"
        >
          {isLoggingOut ? (
            <>
              <Spinner className="size-4" />
              正在退出...
            </>
          ) : (
            <>退出登录</>
          )}
        </button>
      </div>
    </MainFill>
  );
}

export default function MePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <MePageInner />
    </Suspense>
  );
}
