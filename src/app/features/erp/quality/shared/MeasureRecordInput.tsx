"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  useState,
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type ChangeEvent,
  type FocusEvent,
  type MouseEvent,
} from "react"
import styles from "./MeasureRecordInput.module.css"

type BaseInputProps = Omit<React.ComponentProps<typeof Input>,
  "value"
  | "defaultValue"
  | "ref"
  | "onChange"
  | "onBlur"
  | "onDoubleClick"
  | "type"
  | "inputMode"
  | "pattern"
  | "className"
  | "style">

const PASS_MARK = "√"
const COMPAT_PASS_MARK = "✓"
const FAIL_MARK = "×"

export interface MeasureRecordInputProps extends BaseInputProps {
  /**
   *
   * 当前实测记录文本。
   * - 允许数字、文字、符号与业务判定字符，组件不会做数字过滤。
   *
   */
  value: string
  /**
   *
   * 提交后的回调。
   * - 普通输入在失焦时提交；
   * - 双击切换判定字符时立即提交。
   *
   */
  onChange: (val: string) => void
  /**
   *
   * 自定义类名（仅布局相关）。
   *
   */
  className?: string
  /**
   *
   * 自定义样式（可用于精确高度/内边距覆写）。
   *
   */
  style?: CSSProperties
  /**
   *
   * 可选的 aria-label，便于无障碍与必填校验聚焦。
   *
   */
  ariaLabel?: string
  /**
   *
   * 是否在获得焦点时选中全部文本，默认 true。
   *
   */
  selectAllOnFocus?: boolean
}

/**
 *
 * 实测记录输入框。
 * - 不限制只能输入数字，保留录入人员输入的原始文本；
 * - 双击在“√/×”之间切换，用于快速录入合格/不合格类结果；
 * - 普通输入仅在失焦时提交，避免明细列表在移动端高频重渲染。
 *
 */
export function MeasureRecordInput({
  value,
  onChange,
  className,
  style,
  ariaLabel,
  selectAllOnFocus = true,
  disabled,
  readOnly,
  onFocus,
  ...rest
}: MeasureRecordInputProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const focusedRef = useRef(false)
  const lastCommittedValueRef = useRef(value)
  const [editingValue, setEditingValue] = useState<string | null>(null)
  const displayValue = editingValue ?? value
  const isVisualMark = displayValue === PASS_MARK || displayValue === FAIL_MARK

  /**
   *
   * 仅在“外部 value 变化且当前未聚焦”时同步 DOM，保留输入中的顺滑手感。
   *
   */
  useEffect(() => {
    lastCommittedValueRef.current = value
    const el = inputRef.current
    if (!el) return
    if (focusedRef.current) return
    if (el.value !== value) {
      try {
        el.value = value
      } catch {}
    }
  }, [value])

  /**
   *
   * 提交当前文本。
   * @param next 下一个实测记录文本。
   *
   */
  function commit(next: string): void {
    const el = inputRef.current
    if (el && el.value !== next) {
      try {
        el.value = next
      } catch {}
    }
    setEditingValue(next)

    if (lastCommittedValueRef.current === next) return
    lastCommittedValueRef.current = next
    onChange(next)
  }

  /**
   *
   * 输入过程中不做过滤，也不向上提交，避免移动端明细卡片频繁刷新。
   *
   */
  function handleChange(_e: ChangeEvent<HTMLInputElement>): void {
    setEditingValue(_e.currentTarget.value)
    // 保留原始文本即可，真正提交发生在 blur。
  }

  /**
   *
   * 失焦时提交用户输入的原始文本。
   *
   */
  function handleBlur(e: FocusEvent<HTMLInputElement>): void {
    focusedRef.current = false
    commit(e.currentTarget.value)
    setEditingValue(null)
  }

  /**
   *
   * 双击快速切换判定字符。
   * - 当前为“√”或兼容值“✓”时切到“×”；
   * - 其他任意值（含空值与“×”）切到“√”。
   *
   */
  function handleDoubleClick(e: MouseEvent<HTMLInputElement>): void {
    if (disabled || readOnly) return
    const current = e.currentTarget.value.trim()
    const next = current === PASS_MARK || current === COMPAT_PASS_MARK ? FAIL_MARK : PASS_MARK
    commit(next)
    try {
      e.currentTarget.select()
    } catch {}
  }

  /**
   *
   * 获焦时同步当前外部值，并按需选中全部文本方便快速覆盖。
   *
   */
  function handleFocus(e: FocusEvent<HTMLInputElement>): void {
    focusedRef.current = true
    const el = e.currentTarget
    if (el.value !== value) {
      try {
        el.value = value
      } catch {}
    }
    setEditingValue(el.value)
    if (selectAllOnFocus) {
      try {
        el.select()
      } catch {}
      window.setTimeout(() => {
        try {
          el.select()
        } catch {}
      }, 0)
    }
    onFocus?.(e)
  }

  return (
    <span
      className={styles.root}
      data-disabled={disabled ? 'true' : undefined}
    >
      <Input
        {...rest}
        id={id}
        ref={inputRef}
        type="text"
        inputMode="text"
        aria-label={ariaLabel}
        disabled={disabled}
        readOnly={readOnly}
        defaultValue={value}
        className={cn(
          "shrink-0 text-[13px]",
          isVisualMark && styles.markInput,
          className,
        )}
        data-measure-record-mark={isVisualMark ? 'true' : undefined}
        style={style}
        onChange={handleChange}
        onBlur={handleBlur}
        onDoubleClick={handleDoubleClick}
        onFocus={handleFocus}
      />
    </span>
  )
}
