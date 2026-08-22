import { afterEach, describe, expect, test, vi } from "vitest";

import {
  ensureWebMethods,
  registerAndroidBackHandler,
} from "./android-bridge";

describe("android-bridge: 网页返回请求", () => {
  afterEach(() => {
    registerAndroidBackHandler(null);
    delete (globalThis as any).window;
  });

  test("没有页面处理器时返回 false，允许原生兜底", () => {
    (globalThis as any).window = {};

    expect(ensureWebMethods().handleBack?.()).toBe(false);
  });

  test("页面处理器注册后会被调用并返回 true", () => {
    (globalThis as any).window = {};
    const handler = vi.fn();
    const unregister = registerAndroidBackHandler(handler);

    expect(ensureWebMethods().handleBack?.()).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);

    unregister();
    expect(ensureWebMethods().handleBack?.()).toBe(false);
  });

  test("原生先创建旧版 WebMethods 时会补齐返回方法且保留已有方法", () => {
    const handleNotification = vi.fn();
    (globalThis as any).window = {
      WebMethods: { handleNotification },
    };
    const handler = vi.fn();
    const unregister = registerAndroidBackHandler(handler);

    const methods = ensureWebMethods();

    expect(methods.handleNotification).toBe(handleNotification);
    expect(methods.handleBack?.()).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);

    unregister();
  });

  test("页面处理器异常时返回 false，允许原生兜底", () => {
    (globalThis as any).window = {};
    const error = new Error("back failed");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const unregister = registerAndroidBackHandler(() => {
      throw error;
    });

    expect(ensureWebMethods().handleBack?.()).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith("[AndroidBridge] 网页返回处理失败:", error);

    errorSpy.mockRestore();
    unregister();
  });
});
