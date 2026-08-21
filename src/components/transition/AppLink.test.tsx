// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
import { RouteTransitionProvider } from "./RouteTransitionContext";
import { AppLink } from "./AppLink";
import {
  registerDocumentLeaveConfirmationHandler,
  registerDocumentLeaveGuard,
} from "@/lib/documents/document-leave-confirmation";

const pushSpy = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/start"),
  useRouter: vi.fn(() => ({ push: pushSpy })),
}));

vi.mock("next/link", () => ({
  default: ({ href, onClick, children, ...rest }: any) => (
    <a
      href={typeof href === "string" ? href : "#"}
      onClick={(event) => {
        onClick?.(event);
        // 测试替身不执行真实浏览器跳转，避免 jsdom 报告未实现的页面导航。
        event.preventDefault();
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  registerDocumentLeaveGuard(null);
  registerDocumentLeaveConfirmationHandler(null);
  pushSpy.mockClear();
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

  it("有草稿数据且用户取消时不执行路由跳转", async () => {
    registerDocumentLeaveGuard(() => true);
    registerDocumentLeaveConfirmationHandler(() => false);
    const { getByTestId } = render(
      <RouteTransitionProvider>
        <AppLink href="/erp/home" data-testid="link">
          去首页
        </AppLink>
      </RouteTransitionProvider>
    );

    await act(async () => {
      fireEvent.click(getByTestId("link"));
      await Promise.resolve();
    });

    expect(pushSpy).not.toHaveBeenCalled();
  });

  it("有草稿数据且用户确认时执行路由跳转", async () => {
    registerDocumentLeaveGuard(() => true);
    registerDocumentLeaveConfirmationHandler(() => true);
    const { getByTestId } = render(
      <RouteTransitionProvider>
        <AppLink href="/erp/home" data-testid="link">
          去首页
        </AppLink>
      </RouteTransitionProvider>
    );

    await act(async () => {
      fireEvent.click(getByTestId("link"));
      await Promise.resolve();
    });

    expect(pushSpy).toHaveBeenCalledWith("/erp/home");
  });
});
