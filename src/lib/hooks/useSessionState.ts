"use client";
import { useEffect, useRef, useState } from "react";

/**
 *
 * 使用 sessionStorage 在同一浏览器会话中持久化状态的 Hook。
 * 设计目标：
 * - 在浏览器刷新或路由往返时保留状态（会话级，标签页关闭即失效）。
 * - SSR / Hydration 友好：在非浏览环境下不访问 window 对象，并确保首屏服务端与客户端初始渲染一致。
 * - 具备健壮的 JSON 解析与错误兜底，不因存储损坏导致崩溃。
 * 使用示例：
 * const [value, setValue] = useSessionState("my.key", 0)
 * @param key 唯一存储键名，建议使用以路由为前缀的命名（如 "erp.features.activeCategory"）
 * @param initialState 初始值（当没有存储值或解析失败时使用）
 * @returns [state, setState] 与 useState 返回值一致
 *
 */
export function useSessionState<T>(key: string, initialState: T) {
  const isBrowser = typeof window !== "undefined";

  /**
   *
   * 从 sessionStorage 读取并解析存储值。
   * 若读取失败、键不存在或解析异常，安全返回 fallback。
   *
   */
  const readFromStorage = (k: string, fallback: T): T => {
    if (!isBrowser) return fallback;
    try {
      const raw = window.sessionStorage.getItem(k);
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  // 初始渲染阶段（包括 SSR 与客户端 hydration）统一使用 initialState，
  // 避免因浏览器端直接读取 sessionStorage 而导致的首屏标记不一致。
  const [state, setState] = useState<T>(initialState);
  const keyRef = useRef(key);

  // 若 key 发生变化（极少数场景），同步最新键名
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  /**
   *
   * 在客户端挂载后异步从 sessionStorage 读取最新值，
   * 若存在持久化值则覆盖初始状态。
   * 注意：该副作用不会在服务端执行，因此不会造成 SSR 与 Hydration 的差异。
   *
   */
  useEffect(() => {
    if (!isBrowser) return;
    const stored = readFromStorage(keyRef.current, initialState);
    // 仅在存储值与当前 state 不一致时才更新，避免不必要的额外渲染。
    if (stored !== state) {
      setState(stored);
    }
    // 这里有意不将 state 放入依赖数组，以避免每次状态变化都重复从 storage 读取。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBrowser, initialState, keyRef]);

  // 在 state 变化时持久化到 sessionStorage
  useEffect(() => {
    if (!isBrowser) return;
    try {
      window.sessionStorage.setItem(keyRef.current, JSON.stringify(state));
    } catch {
      // 存储异常时静默失败，避免影响主流程
    }
  }, [isBrowser, state]);

  return [state, setState] as const;
}
