import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

import { ensureWebMethods, runAfterAndroidAppResumed } from "./android-bridge";

class CustomEventPolyfill<TDetail = unknown> {
  public readonly type: string;
  public readonly detail?: TDetail;

  constructor(type: string, init?: { detail?: TDetail }) {
    this.type = type;
    this.detail = init?.detail;
  }
}

describe("android-bridge: runAfterAndroidAppResumed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as any).CustomEvent = CustomEventPolyfill;
    (globalThis as any).window = {
      setTimeout,
      dispatchEvent: vi.fn(),
    };
    delete (globalThis as any).window.__dj_android_app_lifecycle__;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as any).CustomEvent;
    delete (globalThis as any).window;
  });

  test("未处于 paused 时会在下一轮执行", () => {
    const fn = vi.fn();

    runAfterAndroidAppResumed(fn);

    expect(fn).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("处于 paused 时会等待 appResumed 再执行", () => {
    const fn = vi.fn();
    (globalThis as any).window.__dj_android_app_lifecycle__ = {
      status: "paused",
      updatedAt: 0,
      pendingAfterResumed: [],
    };

    runAfterAndroidAppResumed(fn);

    expect(fn).not.toHaveBeenCalled();
    expect((globalThis as any).window.__dj_android_app_lifecycle__.pendingAfterResumed.length).toBe(1);

    // 触发 appResumed 通知（会刷新队列并 safeDefer 到下一轮）
    ensureWebMethods();
    (globalThis as any).window.WebMethods.handleNotification("appResumed", {});
    vi.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(1);
    expect((globalThis as any).window.__dj_android_app_lifecycle__.pendingAfterResumed.length).toBe(0);
  });
});

