// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { RouteTransitionProvider } from "@/components/transition/RouteTransitionContext";
import { useNavigateWithTransition } from "./useNavigateWithTransition";
import {
  clearAllowedDocumentLeaveConfirmation,
  confirmDocumentLeave,
  registerDocumentLeaveConfirmationHandler,
  registerDocumentLeaveGuard,
} from "@/lib/documents/document-leave-confirmation";

const pushSpy = vi.fn();
const replaceSpy = vi.fn();
const backSpy = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/start"),
  useRouter: () => ({ push: pushSpy, replace: replaceSpy, back: backSpy }),
}));

afterEach(() => {
  cleanup();
  registerDocumentLeaveGuard(null);
  registerDocumentLeaveConfirmationHandler(null);
  clearAllowedDocumentLeaveConfirmation();
  pushSpy.mockClear();
  replaceSpy.mockClear();
  backSpy.mockClear();
  document.body.removeAttribute("data-route-pending");
});

function Probe({
  onReady,
}: {
  onReady: (api: ReturnType<typeof useNavigateWithTransition>) => void;
}) {
  const api = useNavigateWithTransition();
  onReady(api);
  return null;
}

describe("useNavigateWithTransition", () => {
  it("push 触发 router.push 并设置 body[data-route-pending]", () => {
    let api!: ReturnType<typeof useNavigateWithTransition>;
    render(
      <RouteTransitionProvider>
        <Probe
          onReady={(a) => {
            api = a;
          }}
        />
      </RouteTransitionProvider>
    );
    act(() => {
      api.push("/erp/home");
    });
    expect(pushSpy).toHaveBeenCalledWith("/erp/home");
    expect(document.body.dataset.routePending).toBe("true");
  });

  it("replace 同样触发 startTransition", () => {
    let api!: ReturnType<typeof useNavigateWithTransition>;
    render(
      <RouteTransitionProvider>
        <Probe
          onReady={(a) => {
            api = a;
          }}
        />
      </RouteTransitionProvider>
    );
    act(() => {
      api.replace("/erp/me");
    });
    expect(replaceSpy).toHaveBeenCalledWith("/erp/me");
    expect(document.body.dataset.routePending).toBe("true");
  });

  it("back 触发 startTransition（无 targetPath）", () => {
    let api!: ReturnType<typeof useNavigateWithTransition>;
    render(
      <RouteTransitionProvider>
        <Probe
          onReady={(a) => {
            api = a;
          }}
        />
      </RouteTransitionProvider>
    );
    act(() => {
      api.back();
    });
    expect(backSpy).toHaveBeenCalled();
    expect(document.body.dataset.routePending).toBe("true");
  });

  it("存在草稿且取消确认时阻止统一导航", async () => {
    registerDocumentLeaveGuard(() => true);
    registerDocumentLeaveConfirmationHandler(() => false);
    let api!: ReturnType<typeof useNavigateWithTransition>;
    render(
      <RouteTransitionProvider>
        <Probe onReady={(a) => { api = a; }} />
      </RouteTransitionProvider>
    );

    await act(async () => {
      api.push("/erp/home");
      await Promise.resolve();
    });

    expect(pushSpy).not.toHaveBeenCalled();
  });

  it("存在草稿且确认后执行统一导航", async () => {
    registerDocumentLeaveGuard(() => true);
    const confirmationHandler = vi.fn(async () => true);
    registerDocumentLeaveConfirmationHandler(confirmationHandler);
    let api!: ReturnType<typeof useNavigateWithTransition>;
    render(
      <RouteTransitionProvider>
        <Probe onReady={(a) => { api = a; }} />
      </RouteTransitionProvider>
    );

    await act(async () => {
      api.replace("/erp/me");
      await Promise.resolve();
    });

    expect(replaceSpy).toHaveBeenCalledWith("/erp/me");
    await expect(confirmDocumentLeave()).resolves.toBe(true);
    expect(confirmationHandler).toHaveBeenCalledOnce();
  });
});
