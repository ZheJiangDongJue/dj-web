"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 *
 * 选项类型定义
 *
 */
export interface ComboboxOption {
  /**
   *
   * 唯一值（提交表单/外部状态用）
   *
   */
  value: string
  /**
   *
   * 显示文本
   *
   */
  label: string
  /**
   *
   * 可选图标或任意 React 节点，显示在文本前
   *
   */
  icon?: React.ReactNode
  /**
   *
   * 禁用该项
   *
   */
  disabled?: boolean
  /**
   *
   * 额外可检索关键字（用于搜索匹配）
   *
   */
  keywords?: string[]
}

/**
 *
 * Combobox 内部使用的选项索引。
 *
 */
interface IndexedComboboxOption {
  /**
   *
   * 原始选项对象，选择时需要原样回传给调用方。
   *
   */
  option: ComboboxOption
  /**
   *
   * 统一小写后的检索文本，提前构建以降低打开弹层时的同步计算量。
   *
   */
  searchable: string
}

const DEFAULT_LOAD_MORE_STEP = 20
const LOAD_MORE_THRESHOLD_PX = 24

/**
 *
 * Combobox 组件 Props
 *
 */
export interface ComboboxProps {
  /**
   *
   * 选项列表
   *
   */
  options: ComboboxOption[]
  /**
   *
   * 受控值（优先级高于 defaultValue）
   *
   */
  value?: string
  /**
   *
   * 非受控默认值
   *
   */
  defaultValue?: string
  /**
   *
   * 值变化回调（返回值与完整 option）
   *
   */
  onChange?: (value: string | undefined, option?: ComboboxOption) => void
  /**
   *
   * 触发器占位文本
   *
   */
  placeholder?: string
  /**
   *
   * 搜索框占位文本
   *
   */
  searchPlaceholder?: string
  /**
   *
   * 搜索无结果时显示
   *
   */
  emptyMessage?: string
  /**
   *
   * 禁用整体组件
   *
   */
  disabled?: boolean
  /**
   *
   * 触发器的额外 className（影响尺寸/布局）
   *
   */
  className?: string
  /**
   *
   * 触发器的内联样式（影响尺寸/布局）
   *
   */
  style?: React.CSSProperties
  /**
   *
   * 触发器的无障碍名称（用于朗读器）
   *
   */
  ariaLabel?: string
  /**
   *
   * 浮层内容容器的额外 className
   *
   */
  contentClassName?: string
  /**
   *
   * 自定义渲染每个选项
   *
   */
  renderOption?: (option: ComboboxOption, selected: boolean) => React.ReactNode
  /**
   *
   * 是否允许清空（再次选择同一项或点击清除按钮）
   *
   */
  clearable?: boolean
  /**
   *
   * 触发器尺寸
   *
   */
  size?: "sm" | "default"
  /**
   *
   * 表单集成，若提供则输出隐藏 input[name]
   *
   */
  name?: string
  /**
   *
   * 受控 Popover 开关（可选）
   *
   */
  open?: boolean
  /**
   *
   * Popover 状态变化回调（可选）
   *
   */
  onOpenChange?: (open: boolean) => void
  /**
   *
   * 每次触底追加的选项数量。
   * @remarks
   * 组件会先渲染一批选项，随后在用户滚动到列表底部时继续追加同等规模的批次，直到全部加载完成。
   *
   */
  maxVisibleOptions?: number
}

/**
 *
 * 根据值在选项中查找对应项
 * @param options 选项集合
 * @param value 目标值
 * @returns 找到的选项或 undefined
 *
 */
function getOptionByValue(
  options: ComboboxOption[],
  value: string | undefined
): ComboboxOption | undefined {
  if (!value) return undefined
  return options.find((o) => o.value === value)
}

/**
 *
 * Combobox 组件（基于 Popover + Command）
 * - 支持受控/非受控两种用法
 * - 支持搜索过滤与清空
 * - 使用项目现有的样式约定，保持一致性
 *
 */
export function Combobox({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = "选择一个选项",
  searchPlaceholder = "搜索...",
  emptyMessage = "未找到匹配项",
  disabled,
  className,
  style,
  ariaLabel,
  contentClassName,
  renderOption,
  clearable = true,
  size = "default",
  name,
  open: controlledOpen,
  onOpenChange,
  maxVisibleOptions = DEFAULT_LOAD_MORE_STEP,
}: ComboboxProps) {
  const loadMoreStep = Number.isFinite(maxVisibleOptions)
    ? Math.max(1, Math.floor(maxVisibleOptions))
    : DEFAULT_LOAD_MORE_STEP

  const [searchValue, setSearchValue] = React.useState("")
  const [visibleCount, setVisibleCount] = React.useState(loadMoreStep)
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue
  )
  const isControlled = controlledValue !== undefined
  const selectedValue = isControlled ? controlledValue : uncontrolledValue

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isOpenControlled = controlledOpen !== undefined
  const open = isOpenControlled ? controlledOpen : uncontrolledOpen

  const selectedOption = React.useMemo(
    () => getOptionByValue(options, selectedValue),
    [options, selectedValue]
  )

  const indexedOptions = React.useMemo<IndexedComboboxOption[]>(
    () =>
      options.map((option) => ({
        option,
        searchable: [option.label, option.value, ...(option.keywords ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase(),
      })),
    [options]
  )

  React.useEffect(() => {
    setVisibleCount(loadMoreStep)
  }, [loadMoreStep, open, searchValue])

  const searchTerm = searchValue.trim().toLocaleLowerCase()

  const filteredOptions = React.useMemo(() => {
    return searchTerm
      ? indexedOptions.filter((item) => item.searchable.includes(searchTerm))
      : indexedOptions
  }, [indexedOptions, searchTerm])

  const visibleOptions = React.useMemo(() => {
    const limited = filteredOptions.slice(0, visibleCount)

    if (!searchTerm && selectedValue) {
      const selectedItem = indexedOptions.find(
        (item) => item.option.value === selectedValue
      )
      if (
        selectedItem &&
        !limited.some((item) => item.option.value === selectedValue)
      ) {
        return [selectedItem, ...limited]
      }
    }

    return limited
  }, [filteredOptions, indexedOptions, searchTerm, selectedValue, visibleCount])

  const hasMoreOptions = visibleCount < filteredOptions.length

  /**
   *
   * 当列表滚动到底部时，追加下一批选项。
   * @param event 列表滚动事件
   *
   */
  function handleListScroll(event: React.UIEvent<HTMLDivElement>): void {
    const list = event.currentTarget
    const distanceToBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight
    if (distanceToBottom > LOAD_MORE_THRESHOLD_PX) return
    setVisibleCount((prev) =>
      Math.min(prev + loadMoreStep, filteredOptions.length)
    )
  }

  /**
   *
   * 统一触发值更新（受控/非受控）
   * @param nextValue 新值
   * @param option 对应选项
   *
   */
  function updateValue(
    nextValue: string | undefined,
    option?: ComboboxOption
  ): void {
    if (!isControlled) {
      setUncontrolledValue(nextValue)
    }
    onChange?.(nextValue, option)
  }

  /**
   *
   * 统一管理弹层开关（受控/非受控）
   *
   */
  function setOpen(next: boolean): void {
    if (!isOpenControlled) {
      setUncontrolledOpen(next)
    }
    onOpenChange?.(next)
  }

  /**
   *
   * 选择某个选项
   * - 若 clearable 且重复选择当前值，则清空
   * - 成功选择后关闭弹层
   *
   */
  function handleSelect(option: ComboboxOption): void {
    if (option.disabled) return
    const nextValue =
      clearable && option.value === selectedValue ? undefined : option.value
    updateValue(nextValue, option)
    setOpen(false)
  }

  /**
   *
   * 清空当前选择
   *
   */
  function handleClear(): void {
    updateValue(undefined, undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {name ? (
        // 提供表单集成：同步一个隐藏 input
        <input type="hidden" name={name} value={selectedValue ?? ""} />
      ) : null}

      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="combobox-trigger"
          data-size={size}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          style={style}
          className={cn(
            // 参考 SelectTrigger 的视觉风格，保持一致
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8",
            className
          )}
        >
          <span className="line-clamp-1 flex items-center gap-2">
            {selectedOption?.icon}
            {selectedOption?.label ?? (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>

          <span className="ml-0 flex items-center gap-1">
            {clearable && selectedValue ? (
              <XIcon
                className="size-4 opacity-50 hover:opacity-80"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!disabled) handleClear()
                }}
                aria-label="清除"
              />
            ) : null}
            <ChevronsUpDownIcon className="size-4 opacity-50" />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn("p-0 min-w-56", contentClassName)}
      >
        <Command className="p-0">
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList onScroll={handleListScroll}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {visibleOptions.map(({ option: opt, searchable }) => {
                const selected = opt.value === selectedValue
                return (
                  <CommandItem
                    key={opt.value}
                    value={searchable}
                    onSelect={() => handleSelect(opt)}
                    // cmdk 支持 aria-disabled，通过 data-[disabled] 控制样式
                    disabled={opt.disabled}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 size-4",
                        selected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {renderOption ? (
                      renderOption(opt, selected)
                    ) : (
                      <span className="flex items-center gap-2">
                        {opt.icon}
                        {opt.label}
                      </span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {hasMoreOptions ? (
              <div
                aria-hidden="true"
                className="text-muted-foreground px-3 py-2 text-center text-xs"
              >
                继续下滑加载更多
              </div>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default Combobox
