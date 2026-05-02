"use client"

import { Input } from "@/components/ui/input"
import {
  useEffect,
  useId,
  useRef,
  type ChangeEvent,
  type FocusEvent,
  type CSSProperties,
} from "react"

type BaseInputProps = Omit<React.ComponentProps<typeof Input>,
  "value"
  | "defaultValue"
  | "ref"
  | "onChange"
  | "onBlur"
  | "type"
  | "inputMode"
  | "pattern"
  | "className"
  | "style">

export interface NumberInputProps extends BaseInputProps {
  /**
   *
   * 当前值（数字或空）
   *
   */
  value: number | ""
  /**
   *
   * 失焦后的提交回调（数字或空）
   *
   */
  onChange: (val: number | "") => void
  /**
   *
   * 输入中的即时回调（数字或空）。
   * - 用于“边输边联动”的场景；不影响 onChange（失焦提交）。
   *
   */
  onValueChange?: (val: number | "") => void
  /**
   *
   * 输入中的 onValueChange 节流间隔（毫秒）。
   * - 仅影响可选的 onValueChange（即时回调），不影响 onChange（失焦提交）。
   * - 典型用途：在外部值联动较重（会触发大范围渲染）时，降低回调频率以改善移动端输入卡顿。
   * - 设为 0 表示不节流（默认）。
   *
   */
  onValueChangeThrottleMs?: number
  /**
   *
   * 自定义类名（仅布局相关）
   *
   */
  className?: string
  /**
   *
   * 自定义样式（可用于精确高度/内边距覆写）
   *
   */
  style?: CSSProperties
  /**
   *
   * 可选的 aria-label，便于无障碍
   *
   */
  ariaLabel?: string
  /**
   *
   * 模式：decimal 支持小数；integer 仅整数（保留中间态）
   *
   */
  mode?: "decimal" | "integer"
  /**
   *
   * 是否在获得焦点时选中全部文本，默认 true。
   * - 移动端（iOS Safari）下为保证可靠性，内部会使用微延迟再调用 select()。
   *
   */
  selectAllOnFocus?: boolean
  /**
   *
   * 额外的 onFocus 回调（可选）。
   * - 组件会在完成“选中全部文本”的逻辑后再调用该回调。
   *
   */
  onFocus?: React.FocusEventHandler<HTMLInputElement>
}

/**
 *
 * 数字输入（原子组件）
 * - 支持小数中间态保留（如 "12."），聚焦时不向父组件提交，失焦再提交标准化的数值
 * - 主题外观由 Input 组件及全局主题变量决定；此组件仅处理交互与值规范
 *
 */
export function NumberInput({
  value,
  onChange,
  className,
  style,
  ariaLabel,
  mode = "decimal",
  onValueChange,
  onValueChangeThrottleMs = 0,
  selectAllOnFocus = true,
  onFocus,
  ...rest
}: NumberInputProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const focusedRef = useRef(false)
  const lastEmittedValueRef = useRef<number | "" | null>(null)
  const pendingEmitRef = useRef<{ timer: number | null; value: number | "" } | null>(null)

  /**
   *
   * 非受控输入：仅在“外部 value 变化且当前未聚焦”时，同步写入 DOM。
   * - 避免每次按键 setState 触发 React 重渲染，在低端 Android WebView 下可显著改善输入卡顿（字符分批出现）。
   *
   */
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    if (focusedRef.current) return
    const next = value === "" ? "" : String(value)
    if (el.value !== next) {
      try {
        el.value = next
      } catch {}
    }
  }, [value])

  useEffect(() => {
    return () => {
      const pending = pendingEmitRef.current
      if (pending?.timer != null) {
        try {
          window.clearTimeout(pending.timer)
        } catch {}
      }
      pendingEmitRef.current = null
    }
  }, [])

  /**
   *
   * 仅用于 onValueChange：在输入高频变化时对外部回调做节流，避免每次按键都触发外部大范围渲染。
   *
   */
  function emitValueChangeThrottled(next: number | ""): void {
    if (!onValueChange) return

    // 值未变化则不重复发射（尤其是 "1" -> "1." 这种中间态）
    if (lastEmittedValueRef.current === next) return

    const throttleMs = Math.max(0, Math.floor(onValueChangeThrottleMs))
    if (throttleMs === 0) {
      lastEmittedValueRef.current = next
      onValueChange(next)
      return
    }

    const pending = pendingEmitRef.current
    if (pending?.timer != null) {
      // 仅更新“最新值”，不修改已存在对象，避免触发 react-hooks/immutability 规则报错。
      pendingEmitRef.current = { timer: pending.timer, value: next }
      return
    }

    const timer = window.setTimeout(() => {
      const p = pendingEmitRef.current
      pendingEmitRef.current = null
      if (!p) return
      lastEmittedValueRef.current = p.value
      try {
        onValueChange(p.value)
      } catch {}
    }, throttleMs)

    pendingEmitRef.current = { timer, value: next }
  }

  /**
   *
   * 取消尚未触发的 onValueChange 定时器。
   * - 典型场景：失焦时会立即触发 onChange（提交），此时再触发延迟的 onValueChange 只会造成重复联动与卡顿。
   *
   */
  function cancelPendingValueChange(): void {
    const pending = pendingEmitRef.current
    if (pending?.timer != null) {
      try {
        window.clearTimeout(pending.timer)
      } catch {}
    }
    pendingEmitRef.current = null
  }

  /**
   *
   * 将输入内容过滤为“数字/可选小数点”的中间态字符串。
   * @param raw 原始输入值。
   * @returns 过滤后的展示值（用于写回 input.value）。
   *
   */
  function sanitize(raw: string): string {
    let s = raw

    if (mode === "decimal") {
      // 仅保留数字与（可选）小数点
      s = s.replace(/[^0-9.]/g, "")
      const dot = s.indexOf(".")
      // 仅保留第一个点
      if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "")
      // 前导点转为 0.
      if (s.startsWith(".")) s = `0${s}`

      // 前导零规范：仅去掉“整数部分”的多余 0，保留 0.xxx
      const dot2 = s.indexOf(".")
      if (dot2 !== -1) {
        const intPart = s.slice(0, dot2).replace(/^0+(?=\d)/, "")
        s = intPart + s.slice(dot2)
      } else {
        s = s.replace(/^0+(?=\d)/, "")
      }
    } else {
      // integer：仅保留数字
      s = s.replace(/[^0-9]/g, "")
      s = s.replace(/^0+(?=\d)/, "")
    }

    return s
  }

  /**
   *
   * 将展示字符串解析为数值（或空）。
   * @param s sanitize 后的展示值。
   *
   */
  function toNumberOrEmpty(s: string): number | "" {
    const trimmed = s.trim()
    if (trimmed === "" || trimmed === ".") return ""
    const n = mode === "decimal" ? parseFloat(trimmed) : parseInt(trimmed, 10)
    return Number.isNaN(n) ? "" : n
  }

  /**
   *
   * 输入时：
   * - 过滤非数字/点字符，仅保留第一个点（decimal 模式）
   * - 前导点转为 0.，清理多余前导零（但允许 0.xxx）
   * - 仅写回 input.value（非受控），不触发父组件 onChange
   *
   */
  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    const el = e.currentTarget
    const nextDisplay = sanitize(el.value)
    if (el.value !== nextDisplay) {
      try {
        el.value = nextDisplay
      } catch {}
    }

    // 输入中的即时回调：不改变 onChange（失焦）语义
    if (onValueChange) {
      emitValueChangeThrottled(toNumberOrEmpty(nextDisplay))
    }
  }

  /**
   *
   * 失焦时：
   * - 去除尾部点，解析为数字（或空），提交给父组件，并规范化显示
   *
   */
  function handleBlur(_e: FocusEvent<HTMLInputElement>): void {
    cancelPendingValueChange()
    focusedRef.current = false

    const el = inputRef.current
    let s = sanitize(el?.value ?? "").trim()
    if (s === "" || s === ".") {
      // 仅在值实际发生变化时才向上提交，避免“仅切换焦点”也触发外部重渲染
      if (value !== "") onChange("")
      if (el) el.value = ""
      return
    }
    if (mode === "decimal" && s.endsWith(".")) s = s.slice(0, -1)

    const n = mode === "decimal" ? parseFloat(s) : parseInt(s, 10)
    if (Number.isNaN(n)) {
      if (value !== "") onChange("")
      if (el) el.value = ""
    } else {
      // 仅在值变化时提交，避免 blur 时重复触发外部联动
      if (value !== n) onChange(n)
      if (el) el.value = String(n)
    }
  }

  /**
   *
   * 获焦时：
   * - 标记 focused 状态；
   * - 若启用 selectAllOnFocus，则选中全部文本（含 iOS 兼容处理）。
   * - 之后调用外部 onFocus（若存在）。
   *
   */
  function handleFocus(e: FocusEvent<HTMLInputElement>): void {
    focusedRef.current = true
    // 获焦时用当前外部值刷新显示，保证进入编辑态的初始文本与受控值一致
    const el = e.currentTarget
    const next = value === "" ? "" : String(value)
    if (el.value !== next) {
      try {
        el.value = next
      } catch {}
    }
    if (selectAllOnFocus) {
      try {
        el.select()
      } catch {}
      setTimeout(() => {
        try {
          if (typeof el.select === "function") {
            el.select()
          } else if (typeof el.setSelectionRange === "function") {
            el.setSelectionRange(0, el.value.length)
          }
        } catch {}
      }, 0)
    }
    onFocus?.(e)
  }

  return (
    <Input
      {...rest}
      id={id}
      inputMode={mode === "decimal" ? "decimal" : "numeric"}
      type="text"
      pattern={mode === "decimal" ? "[0-9]*\\.?[0-9]*" : "[0-9]*"}
      aria-label={ariaLabel}
      className={`shrink-0 text-right text-[13px] ${className ?? ""}`}
      ref={inputRef}
      defaultValue={value === "" ? "" : String(value)}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      style={style}
    />
  )
}
