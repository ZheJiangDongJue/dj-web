"use client"

import { Input } from "@/components/ui/input"
import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type CSSProperties,
} from "react"

type BaseInputProps = Omit<React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "inputMode" | "pattern" | "className" | "style">

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
  selectAllOnFocus = true,
  onFocus,
  ...rest
}: NumberInputProps) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const [display, setDisplay] = useState<string>(value === "" ? "" : String(value))

  // 去除 effect 内同步 setState，改为渲染期按聚焦态切换显示来源

  /**
   *
   * 输入时：
   * - 过滤非数字/点字符，仅保留第一个点（decimal 模式）
   * - 前导点转为 0.，清理多余前导零（但允许 0.xxx）
   * - 仅更新本地 display，不触发父组件 onChange
   *
   */
  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    let raw = e.target.value

    // 仅保留数字与（可选）小数点
    if (mode === "decimal") {
      raw = raw.replace(/[^0-9.]/g, "")
      const dot = raw.indexOf(".")
      if (dot !== -1) raw = raw.slice(0, dot + 1) + raw.slice(dot + 1).replace(/\./g, "")
      if (raw.startsWith(".")) raw = `0${raw}`
    } else {
      raw = raw.replace(/[^0-9]/g, "")
    }

    // 前导零规范（00012 -> 12；但 0.xxx 保留）
    if (raw.length > 1 && raw[0] === "0" && (mode === "integer" || raw[1] !== ".")) {
      raw = String(parseInt(raw, 10))
    }

    setDisplay(raw)

    // 输入中的即时回调：不改变 onChange（失焦）语义
    if (onValueChange) {
      const s = raw.trim()
      if (s === "" || s === ".") {
        onValueChange("")
      } else {
        const n = mode === "decimal" ? parseFloat(s) : parseInt(s, 10)
        if (Number.isNaN(n)) onValueChange("")
        else onValueChange(n)
      }
    }
  }

  /**
   *
   * 失焦时：
   * - 去除尾部点，解析为数字（或空），提交给父组件，并规范化显示
   *
   */
  function handleBlur(_e: FocusEvent<HTMLInputElement>): void {
    let s = display.trim()
    if (s === "" || s === ".") {
      setDisplay("")
      onChange("")
      setFocused(false)
      return
    }
    if (mode === "decimal" && s.endsWith(".")) s = s.slice(0, -1)

    const n = mode === "decimal" ? parseFloat(s) : parseInt(s, 10)
    if (Number.isNaN(n)) {
      setDisplay("")
      onChange("")
    } else {
      setDisplay(String(n))
      onChange(n)
    }
    setFocused(false)
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
    setFocused(true)
    // 获焦时用当前外部值刷新显示，保证进入编辑态的初始文本与受控值一致
    setDisplay(value === "" ? "" : String(value))
    if (selectAllOnFocus) {
      const el = e.currentTarget
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
      id={id}
      inputMode={mode === "decimal" ? "decimal" : "numeric"}
      type="text"
      pattern={mode === "decimal" ? "[0-9]*\\.?[0-9]*" : "[0-9]*"}
      aria-label={ariaLabel}
      className={`shrink-0 text-right text-[13px] ${className ?? ""}`}
      value={focused ? display : (value === "" ? "" : String(value))}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      style={style}
      {...rest}
    />
  )
}
