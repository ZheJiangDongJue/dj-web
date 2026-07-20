// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react"
import type React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import Combobox, { type ComboboxOption } from "./combobox"

const popoverOpenAutoFocusPreventDefaultCalls: Array<ReturnType<typeof vi.fn>> =
  []

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({
    children,
    onOpenAutoFocus,
    className,
  }: {
    children: React.ReactNode
    onOpenAutoFocus?: (event: { preventDefault: () => void }) => void
    className?: string
  }) => {
    if (typeof onOpenAutoFocus === "function") {
      const preventDefault = vi.fn()
      onOpenAutoFocus({ preventDefault })
      popoverOpenAutoFocusPreventDefaultCalls.push(preventDefault)
    }
    return (
      <div data-testid="mock-popover-content" className={className}>
        {children}
      </div>
    )
  },
}))

afterEach(() => {
  cleanup()
  popoverOpenAutoFocusPreventDefaultCalls.length = 0
  vi.unstubAllGlobals()
})

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver = ResizeObserverStub
Element.prototype.scrollIntoView = vi.fn()

/**
 *
 * 构造大量员工选项，用于验证 Combobox 的滚动增量加载逻辑。
 * @param count 选项总量
 *
 */
function createEmployeeOptions(count: number): ComboboxOption[] {
  return Array.from({ length: count }, (_, index) => {
    const seq = String(index + 1).padStart(3, "0")
    return {
      label: `员工${seq}`,
      value: String(index + 1),
    }
  })
}

/**
 *
 * 将 CommandList 伪造为“已经滚动到底部”的几何参数，再触发滚动事件。
 * @param list 列表容器
 *
 */
function scrollToBottom(list: HTMLElement): void {
  Object.defineProperty(list, "scrollHeight", {
    value: 1000,
    configurable: true,
  })
  Object.defineProperty(list, "clientHeight", {
    value: 300,
    configurable: true,
  })
  Object.defineProperty(list, "scrollTop", {
    value: 700,
    configurable: true,
  })
  fireEvent.scroll(list)
}

describe("Combobox", () => {
  it("触底时自动按批次加载更多，直到全部选项可见", () => {
    const options = createEmployeeOptions(120)
    const { container, queryByText } = render(
      <Combobox open options={options} value="" maxVisibleOptions={30} />
    )

    expect(queryByText("员工001")).not.toBeNull()
    expect(queryByText("员工031")).toBeNull()
    expect(queryByText("员工120")).toBeNull()

    const commandList = container.querySelector("[data-slot='command-list']")
    expect(commandList).not.toBeNull()
    if (!commandList) {
      return
    }

    scrollToBottom(commandList)
    expect(queryByText("员工060")).not.toBeNull()
    expect(queryByText("员工061")).toBeNull()

    scrollToBottom(commandList)
    expect(queryByText("员工090")).not.toBeNull()
    expect(queryByText("员工091")).toBeNull()

    scrollToBottom(commandList)
    expect(queryByText("员工120")).not.toBeNull()
  })

  it("搜索仍可命中后续未首批渲染的选项", () => {
    const options = createEmployeeOptions(120)
    const { getByPlaceholderText, queryByText } = render(
      <Combobox open options={options} value="" maxVisibleOptions={30} />
    )

    expect(queryByText("员工120")).toBeNull()

    fireEvent.change(getByPlaceholderText("搜索..."), {
      target: { value: "员工120" },
    })

    expect(queryByText("员工120")).not.toBeNull()
  })

  it("弹层内容包含可视区高度约束类，避免移动端键盘弹出时越界", () => {
    const options = createEmployeeOptions(5)
    const { container, getByTestId } = render(
      <Combobox open options={options} value="" />
    )
    const popover = getByTestId("mock-popover-content")
    const cls = popover.getAttribute("class") ?? ""
    expect(cls).toContain("max-h-[min(var(--radix-popover-content-available-height),20rem)]")
    expect(cls).toContain("overflow-hidden")

    const commandList = container.querySelector("[data-slot='command-list']")
    expect(commandList).not.toBeNull()
    const commandListClass = commandList?.getAttribute("class") ?? ""
    expect(commandListClass).toContain(
      "max-h-[calc(min(var(--radix-popover-content-available-height),20rem)-2.25rem)]"
    )
    expect(commandListClass).toContain("overscroll-contain")
  })

  it("打开弹层时阻止默认自动聚焦，避免直接唤起移动端输入法", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(pointer: coarse)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    )

    const options = createEmployeeOptions(5)
    render(<Combobox open options={options} value="" />)
    expect(popoverOpenAutoFocusPreventDefaultCalls.length).toBeGreaterThan(0)
    const lastCall =
      popoverOpenAutoFocusPreventDefaultCalls[
        popoverOpenAutoFocusPreventDefaultCalls.length - 1
    ]
    expect(lastCall).toHaveBeenCalledTimes(1)
  })

  it("桌面端不阻止默认自动聚焦，保留键盘搜索体验", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    )

    const options = createEmployeeOptions(5)
    render(<Combobox open options={options} value="" />)
    expect(popoverOpenAutoFocusPreventDefaultCalls.length).toBeGreaterThan(0)
    const lastCall =
      popoverOpenAutoFocusPreventDefaultCalls[
        popoverOpenAutoFocusPreventDefaultCalls.length - 1
      ]
    expect(lastCall).toHaveBeenCalledTimes(0)
  })

  it("可关闭选项左侧的选中图标占位", () => {
    const options = createEmployeeOptions(2)
    const { container } = render(
      <Combobox open options={options} value="" showSelectionIcon={false} />
    )

    const firstItem = container.querySelector("[data-slot='command-item']")
    expect(firstItem).not.toBeNull()
    expect(firstItem?.querySelector("svg")).toBeNull()
  })
})
