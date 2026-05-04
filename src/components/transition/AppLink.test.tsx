// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
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

afterEach(() => {
  cleanup();
  document.body.removeAttribute("data-route-pending");
});

describe("AppLink", () => {
  it("点击后元素获得 data-pending=true", () => {
    const { getByTestId } = render(
      <RouteTransitionProvider>
        <AppLink href="/erp/home" data-testid="link">
          去首页
        </AppLink>
      </RouteTransitionProvider>
    );
    const a = getByTestId("link") as HTMLAnchorElement;
    expect(a.dataset.pending).toBeUndefined();
    act(() => {
      fireEvent.click(a);
    });
    expect(a.dataset.pending).toBe("true");
    expect(document.body.dataset.routePending).toBe("true");
  });

  it("Ctrl/Meta/中键点击不触发过渡（让浏览器原生行为生效）", () => {
    const { getByTestId } = render(
      <RouteTransitionProvider>
        <AppLink href="/erp/home" data-testid="link">
          去首页
        </AppLink>
      </RouteTransitionProvider>
    );
    const a = getByTestId("link") as HTMLAnchorElement;
    act(() => {
      fireEvent.click(a, { ctrlKey: true });
    });
    expect(a.dataset.pending).toBeUndefined();
    expect(document.body.dataset.routePending).toBeUndefined();
  });

  it("透传自定义 onClick 处理器", () => {
    const onClick = vi.fn();
    const { getByTestId } = render(
      <RouteTransitionProvider>
        <AppLink href="/erp/home" data-testid="link" onClick={onClick}>
          去首页
        </AppLink>
      </RouteTransitionProvider>
    );
    act(() => {
      fireEvent.click(getByTestId("link"));
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
