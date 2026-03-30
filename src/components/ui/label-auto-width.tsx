"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

/**
 *
 * 将文本按 CSS 的 text-transform 规则进行转换。
 * - 仅处理 none/uppercase/lowercase/capitalize 四种常见取值
 * - 对于非拉丁字符，capitalize 的效果与原生 CSS 可能存在差异，但基本可用
 *
 */
function applyTextTransform(text: string, transform: string): string {
  switch (transform) {
    case "uppercase":
      return text.toUpperCase()
    case "lowercase":
      return text.toLowerCase()
    case "capitalize":
      return text
        .split(/(\s+)/) // 保留分隔符
        .map((part) => (part.trim() ? part[0].toUpperCase() + part.slice(1) : part))
        .join("")
    default:
      return text
  }
}

/**
 *
 * 解析带有 px 的 CSS 数值属性为 number
 * - 对于未设置/非数字/"normal" 返回 0
 *
 */
function getPxNumber(value: string | null): number {
  if (!value) return 0
  const trimmed = value.trim()
  if (!trimmed || trimmed === "normal") return 0
  const n = Number.parseFloat(trimmed)
  return Number.isFinite(n) ? n : 0
}

/**
 *
 * 基于元素的计算样式，测量其文本单行所需的像素宽度。
 * - 使用 CanvasRenderingContext2D.measureText 进行测量
 * - 额外叠加 letter-spacing 与 padding-inline 的贡献
 * - 文本来源优先使用元素的 textContent，保证与真实渲染一致
 *
 */
function measureSingleLineTextWidth(el: HTMLElement): number {
  const computed = window.getComputedStyle(el)
  const textTransform = computed.textTransform || "none"

  const rawText = (el.textContent ?? "").replace(/\s+/g, " ").trim()
  const text = applyTextTransform(rawText, textTransform)

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return 0

  // 优先使用完整的 font 快照，退化再拼接
  const font = (computed as any).font as string | undefined
  if (font && font !== "") {
    ctx.font = font
  } else {
    const style = [
      computed.fontStyle,
      computed.fontVariant,
      computed.fontWeight,
      `${computed.fontSize}/${computed.lineHeight}`,
      computed.fontFamily,
    ]
      .filter(Boolean)
      .join(" ")
    ctx.font = style
  }

  const metrics = ctx.measureText(text)
  let width = metrics.width

  // 叠加 letter-spacing 带来的增量（按字符间隙个数计算）
  const letterSpacing = computed.letterSpacing
  if (letterSpacing && letterSpacing !== "normal") {
    const ls = getPxNumber(letterSpacing)
    if (ls !== 0 && text.length > 1) {
      width += ls * (text.length - 1)
    }
  }

  // 叠加左右内边距
  width += getPxNumber(computed.paddingLeft) + getPxNumber(computed.paddingRight)

  // 对齐至整数像素，避免抖动
  return Math.ceil(width)
}

export interface AutoWidthLabelProps
  extends React.ComponentProps<typeof LabelPrimitive.Root> {
  /**
   *
   * 当为 true 时，组件会在初始化后等待字体加载完成再进行一次测量，
   * 以避免网络字体尚未可用导致的首次宽度不准确。默认开启。
   *
   */
  awaitFontsReady?: boolean
}

/**
 *
 * 自适应宽度的 Label 组件（基于文本实时测量）。
 * 设计目标：
 * - 保持与现有 `Label` 组件风格一致（Radix Label + 项目类名）
 * - 根据自身文本内容动态计算并设置精确像素宽度
 * - 监听文本变化、字体/尺寸变化与窗口尺寸变化，自动重新测量
 * 注意事项：
 * - 该组件按“单行”文本测量，已默认添加 `whitespace-nowrap`
 * - 若 children 包含图标等非文本元素，其宽度不计入测量
 *
 */
function AutoWidthLabel({
  className,
  style,
  awaitFontsReady = true,
  ...props
}: AutoWidthLabelProps) {
  const ref = React.useRef<HTMLLabelElement | null>(null)
  const [measuredWidth, setMeasuredWidth] = React.useState<number | null>(null)

  // 将测量动作封装，保证引用稳定
  const doMeasure = React.useCallback(() => {
    const el = ref.current
    if (!el) return

    // 临时强制为单行用于测量（与真实渲染一致）
    const prevWhiteSpace = el.style.whiteSpace
    el.style.whiteSpace = "nowrap"
    try {
      const w = measureSingleLineTextWidth(el)
      if (w > 0) setMeasuredWidth(w)
    } finally {
      el.style.whiteSpace = prevWhiteSpace
    }
  }, [])

  // 初次测量 + 监听字体加载
  React.useLayoutEffect(() => {
    doMeasure()
    let canceled = false

    if (awaitFontsReady && (document as any).fonts?.ready) {
      ;(document as any).fonts
        .ready.then(() => {
          if (!canceled) doMeasure()
        })
        .catch(() => {})
    }

    return () => {
      canceled = true
    }
  }, [doMeasure, awaitFontsReady])

  // 监听文本、样式变化（大小/字体/字距等）与窗口尺寸变化
  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const ro = new ResizeObserver(() => doMeasure())
    ro.observe(el)

    const mo = new MutationObserver(() => doMeasure())
    mo.observe(el, { subtree: true, characterData: true, childList: true })

    const onResize = () => doMeasure()
    window.addEventListener("resize", onResize)

    return () => {
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener("resize", onResize)
    }
  }, [doMeasure])

  // 合并样式：如用户显式传入 width，则尊重用户设置
  const mergedStyle = React.useMemo<React.CSSProperties>(() => {
    const base: React.CSSProperties = { ...(style || {}) }
    if (measuredWidth != null && base.width == null) {
      base.width = `${measuredWidth}px`
    }
    return base
  }, [style, measuredWidth])

  return (
    <LabelPrimitive.Root
      ref={ref}
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none whitespace-nowrap group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      style={mergedStyle}
      {...props}
    />
  )
}

export { AutoWidthLabel }

