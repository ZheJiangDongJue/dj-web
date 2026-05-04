// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import {
  RouteTransitionProvider,
  useRouteTransition,
} from "./RouteTransitionContext";
import { TopProgressBar } from "./TopProgressBar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/start"),
}));

afterEach(() => {
  cleanup();
});

function Trigger() {
  const { startTransition, endTransition } = useRouteTransition();
  return (
    <>
      <button data-testid="start" onClick={() => startTransition("/next")}>
        start
      </button>
      <button data-testid="end" onClick={() => endTransition()}>
        end
      </button>
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
    act(() => {
      getByTestId("start").click();
    });
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
    act(() => {
      getByTestId("start").click();
    });
    act(() => {
      getByTestId("end").click();
    });
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
    act(() => {
      getByTestId("start").click();
    });
    expect(bar.getAttribute("aria-hidden")).toBe("false");
  });
});
