import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

import { sendToAndroid } from "./android-bridge";

type CapturedAndroidPayload = {
  action: string;
  data: unknown;
  callbackId: string;
};

describe("android-bridge: sendToAndroid timeout policy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as any).window = {
      android: {
        receiveMessage: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as any).window;
  });

  test("交互类 action 默认不启用硬超时", async () => {
    let captured: CapturedAndroidPayload | undefined;
    (globalThis as any).window.android.receiveMessage = vi.fn((payload: string) => {
      captured = JSON.parse(payload) as CapturedAndroidPayload;
    });

    const promise = sendToAndroid("pickImage");

    expect((globalThis as any).window.android.receiveMessage).toHaveBeenCalledTimes(1);
    expect(captured?.action).toBe("pickImage");
    const callbackId = String(captured?.callbackId ?? "");
    expect(callbackId).toMatch(/^js_callback_/);
    expect(typeof (globalThis as any).window[callbackId]).toBe("function");

    let settled = false;
    promise.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      }
    );

    await Promise.resolve();
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(60_000);
    await Promise.resolve();
    expect(settled).toBe(false);

    const resultPayload = { success: true, message: "ok", foo: 1 };
    (globalThis as any).window[callbackId](resultPayload);

    await expect(promise).resolves.toEqual(resultPayload);
    expect((globalThis as any).window[callbackId]).toBeUndefined();
  });

  test("非交互类 action 默认 10s 超时", async () => {
    let captured: CapturedAndroidPayload | undefined;
    (globalThis as any).window.android.receiveMessage = vi.fn((payload: string) => {
      captured = JSON.parse(payload) as CapturedAndroidPayload;
    });

    const promise = sendToAndroid("getDeviceInfo");

    expect((globalThis as any).window.android.receiveMessage).toHaveBeenCalledTimes(1);
    const callbackId = String(captured?.callbackId ?? "");
    expect(callbackId).toMatch(/^js_callback_/);
    expect(typeof (globalThis as any).window[callbackId]).toBe("function");
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(10_000);
    await expect(promise).rejects.toThrow(/Android 调用超时：action=getDeviceInfo/);
    expect((globalThis as any).window[callbackId]).toBeUndefined();
  });

  test("允许显式传入 timeoutMs 覆盖默认策略", async () => {
    let captured: CapturedAndroidPayload | undefined;
    (globalThis as any).window.android.receiveMessage = vi.fn((payload: string) => {
      captured = JSON.parse(payload) as CapturedAndroidPayload;
    });

    const promise = sendToAndroid("pickImage", {}, 100);

    expect((globalThis as any).window.android.receiveMessage).toHaveBeenCalledTimes(1);
    const callbackId = String(captured?.callbackId ?? "");
    expect(callbackId).toMatch(/^js_callback_/);
    expect(typeof (globalThis as any).window[callbackId]).toBe("function");
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(100);
    await expect(promise).rejects.toThrow(/Android 调用超时：action=pickImage/);
    expect((globalThis as any).window[callbackId]).toBeUndefined();
  });
});

