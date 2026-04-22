import type { ButtonHTMLAttributes, ReactElement } from 'react'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 *
 * 统一的关闭/删除图标按钮。
 * - 使用圆形轮廓与 XIcon 图标，替代裸露的 “X” 字符按钮。
 * - 适用于明细行删除、卡片右上角关闭等小尺寸操作入口。
 *
 */
export interface CloseIconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /**
   *
   * 提供给屏幕阅读器的描述文本，例如 “删除明细”。
   *
   */
  ariaLabel: string
  /**
   *
   * 按钮视觉样式变体。
   * - outline：透明背景 + 轻边框（默认），适合叠在卡片/页面底色上；
   * - solid：实体底色（不透明），适合叠在图片/复杂背景上以保证可读性。
   *
   */
  variant?: 'outline' | 'solid'
}

/**
 *
 * 关闭图标按钮组件。
 * @param props 按钮属性与无障碍说明文本
 *
 */
export function CloseIconButton({
  ariaLabel,
  className,
  type = 'button',
  variant = 'outline',
  ...props
}: CloseIconButtonProps): ReactElement {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={cn(
        // 布局尺寸：小圆形图标按钮
        'flex h-[22px] w-[22px] items-center justify-center rounded-full',
        // 主题样式：默认弱提示（透明背景）；位图叠底场景可用 solid 变体提升对比度。
        variant === 'solid'
          ? [
              'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-sm',
              'border border-[var(--color-border)] transition-colors',
              'hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error-fg)]',
            ]
          : [
              'border border-border/80 text-muted-foreground transition-colors',
              'hover:bg-destructive/10 hover:text-destructive',
            ],
        'focus:outline-hidden focus:ring-2 focus:ring-destructive focus:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-60',
        // 图标尺寸与禁用事件穿透
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    >
      <XIcon aria-hidden="true" />
      <span className="sr-only">{ariaLabel}</span>
    </button>
  )
}
