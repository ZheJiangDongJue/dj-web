// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ERP_PAGE_NAME } from "@/lib/erp/page-names";
import { useErpPagePermissions } from "@/hooks/useErpPagePermissions";
import ErpCategoryPage from "./page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/hooks/useErpPagePermissions", () => ({
  useErpPagePermissions: vi.fn(),
}));

const mockUseErpPagePermissions = vi.mocked(useErpPagePermissions);

describe("ErpCategoryPage 权限过滤", () => {
  beforeEach(() => {
    pushMock.mockClear();
    mockUseErpPagePermissions.mockReset();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("只展示拥有浏览权限的功能入口", () => {
    mockUseErpPagePermissions.mockReturnValue({
      status: "ready",
      error: null,
      allowedPageNames: new Set([ERP_PAGE_NAME.FQC]),
    });

    render(<ErpCategoryPage />);

    expect(screen.getByRole("button", { name: "品质系统" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "末件检验" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "首件检验" })).toBeNull();
    expect(screen.queryByRole("button", { name: "不合格纪录单" })).toBeNull();
  });

  it("没有任何浏览权限时不展示模块分类和功能入口", () => {
    mockUseErpPagePermissions.mockReturnValue({
      status: "ready",
      error: null,
      allowedPageNames: new Set(),
    });

    render(<ErpCategoryPage />);

    expect(screen.getByText("暂无可用模块")).toBeTruthy();
    expect(screen.getByText("暂无功能项")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "品质系统" })).toBeNull();
    expect(screen.queryByRole("button", { name: "首件检验" })).toBeNull();
    expect(screen.queryByRole("button", { name: "末件检验" })).toBeNull();
    expect(screen.queryByRole("button", { name: "不合格纪录单" })).toBeNull();
  });

  it("权限加载失败时隐藏受控入口", () => {
    mockUseErpPagePermissions.mockReturnValue({
      status: "error",
      error: new Error("load failed"),
      allowedPageNames: new Set(),
    });

    render(<ErpCategoryPage />);

    expect(screen.getByText("权限加载失败")).toBeTruthy();
    expect(screen.getByText(/已隐藏受控入口/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "首件检验" })).toBeNull();
    expect(screen.queryByRole("button", { name: "末件检验" })).toBeNull();
    expect(screen.queryByRole("button", { name: "不合格纪录单" })).toBeNull();
  });
});
