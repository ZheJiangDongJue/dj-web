"use client"

import * as React from "react"
import Combobox from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

/**
 *
 * GridSelect 组件
 * - 用于在 Grid/Flex 列中放置下拉选择，默认占满可用宽度（w-full min-w-0）
 * - 基于通用 Combobox 封装，统一受控：将 undefined 规范为 ''
 * - 默认高度 26px，调用方可通过 className/style 覆盖
 *
 */
export interface GridSelectOption {
  /**
   *
   * 选项显示文本
   *
   */
  label: string
  /**
   *
   * 选项值（提交/状态字段）
   *
   */
  value: string
}

export interface GridSelectProps {
  /**
   *
   * 受控值（空值请使用 ''）
   *
   */
  value: string
  /**
   *
   * 值变化回调（统一将 undefined 映射为 ''）
   *
   */
  onChange: (val: string) => void
  /**
   *
   * 选项列表
   *
   */
  options: GridSelectOption[]
  /**
   *
   * 占位文本（默认空串）
   *
   */
  placeholder?: string
  /**
   *
   * 禁用态
   *
   */
  disabled?: boolean
  /**
   *
   * 触发器的无障碍名称（用于聚焦/朗读）
   *
   */
  ariaLabel: string
  /**
   *
   * 额外类名（可覆盖宽高等样式）
   *
   */
  className?: string
  /**
   *
   * 行内样式（高度/内边距等）
   *
   */
  style?: React.CSSProperties
}

/**
 *
 * GridSelect 组件定义
 * @param props 参见 GridSelectProps
 *
 */
export default function GridSelect(props: GridSelectProps) {
  const {
    value,
    onChange,
    options,
    placeholder = "",
    disabled = false,
    ariaLabel,
    className,
    style,
  } = props

  /**
   *
   * 处理 Combobox 的值变化，并将 undefined 规范为 ''
   * @param v Combobox 返回值（string | undefined）
   *
   */
  function handleChange(v: string | undefined): void {
    onChange(v ?? "")
  }

  return (
    <Combobox
      value={value}
      onChange={handleChange}
      options={options}
      disabled={disabled}
      placeholder={placeholder}
      clearable={false}
      className={cn(
        "w-full min-w-0 shrink-0 text-[13px] h-[26px] min-h-[26px]",
        className,
      )}
      ariaLabel={ariaLabel}
      style={style}
    />
  )
}
