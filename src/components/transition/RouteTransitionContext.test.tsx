// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import {
  routeTransitionReducer,
  RouteTransitionProvider,
  useRouteTransition,
} from "./RouteTransitionContext";

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

  function Probe({
    onReady,
  }: {
    onReady: (api: ReturnType<typeof useRouteTransition>) => void;
  }) {
    const api = useRouteTransition();
    onReady(api);
    return null;
  }

  it("startTransition 设置 body[data-route-pending]=true", () => {
    let api!: ReturnType<typeof useRouteTransition>;
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
      api.startTransition("/erp/home");
    });
    expect(document.body.dataset.routePending).toBe("true");
  });

  it("pathname 变化后自动 endTransition 并移除 body 标记", () => {
    let api!: ReturnType<typeof useRouteTransition>;
    const { rerender } = render(
      <RouteTransitionProvider>
        <Probe
          onReady={(a) => {
            api = a;
          }}
        />
      </RouteTransitionProvider>
    );
    act(() => {
      api.startTransition("/erp/home");
    });
    expect(document.body.dataset.routePending).toBe("true");

    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/erp/home");
    rerender(
      <RouteTransitionProvider>
        <Probe
          onReady={(a) => {
            api = a;
          }}
        />
      </RouteTransitionProvider>
    );
    expect(document.body.dataset.routePending).toBeUndefined();
  });

  it("5 秒超时自动结束（同路径跳转兜底）", () => {
    let api!: ReturnType<typeof useRouteTransition>;
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
      api.startTransition("/start");
    });
    expect(document.body.dataset.routePending).toBe("true");

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(document.body.dataset.routePending).toBeUndefined();
  });
});
