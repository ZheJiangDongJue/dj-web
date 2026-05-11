// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react"
import type React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import Combobox, { type ComboboxOption } from "./combobox"

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

afterEach(() => {
  cleanup()
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
})
