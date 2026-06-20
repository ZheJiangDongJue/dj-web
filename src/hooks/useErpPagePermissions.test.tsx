// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { CheckAuthCached } from "@/lib/erp/auth-api";
import { Permissions } from "@/types/erp-db.generated";
import { useErpPagePermissions } from "./useErpPagePermissions";

vi.mock("@/lib/erp/auth-api", () => ({
  CheckAuthCached: vi.fn(),
}));

const mockCheckAuthCached = vi.mocked(CheckAuthCached);

describe("useErpPagePermissions", () => {
  beforeEach(() => {
    mockCheckAuthCached.mockReset();
    window.localStorage.clear();
    window.localStorage.setItem("erp:dbName", "ERP_TEST");
    window.localStorage.setItem("erp:userInfo", JSON.stringify({ id: 42 }));
  });

  afterEach(() => {
    cleanup();
  });

  it("默认按浏览权限加载并只保留允许访问的 PageName", async () => {
    mockCheckAuthCached.mockImplementation(async ({ pageName }) => pageName === "AllowedPage");

    let latest: ReturnType<typeof useErpPagePermissions> | null = null;

    function Probe() {
      const state = useErpPagePermissions(["AllowedPage", "DeniedPage"]);
      useEffect(() => {
        latest = state;
      }, [state]);
      return <div>{state.status}</div>;
    }

    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("ready")).toBeTruthy();
    });

    expect(latest?.allowedPageNames.has("AllowedPage")).toBe(true);
    expect(latest?.allowedPageNames.has("DeniedPage")).toBe(false);
    expect(mockCheckAuthCached).toHaveBeenCalledWith({
      dbName: "ERP_TEST",
      userId: 42,
      pageName: "AllowedPage",
      auth: Permissions.浏览,
    });
    expect(mockCheckAuthCached).toHaveBeenCalledWith({
      dbName: "ERP_TEST",
      userId: 42,
      pageName: "DeniedPage",
      auth: Permissions.浏览,
    });
  });

  it("不会把字符串 false 当作允许访问的 PageName", async () => {
    mockCheckAuthCached.mockImplementation(async ({ pageName }) =>
      pageName === "AllowedPage" ? true : ("false" as unknown as boolean),
    );

    let latest: ReturnType<typeof useErpPagePermissions> | null = null;

    function Probe() {
      const state = useErpPagePermissions(["AllowedPage", "DeniedPage"]);
      useEffect(() => {
        latest = state;
      }, [state]);
      return <div>{state.status}</div>;
    }

    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("ready")).toBeTruthy();
    });

    expect(latest?.allowedPageNames.has("AllowedPage")).toBe(true);
    expect(latest?.allowedPageNames.has("DeniedPage")).toBe(false);
  });
});
