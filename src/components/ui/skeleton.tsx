import { cn } from "@/lib/utils"

/**
 *
 * Skeleton 骨架屏组件。
 * - 颜色遵循主题：使用 `.t-skeleton`，由 theme.css 基于 `--color-surface` 与 `--color-fg` 动态混合；
 * - 默认包含 `animate-pulse` 动画与中等圆角；
 * - 通过 `className` 可覆盖尺寸与圆角（例如 `rounded-full`）。
 * - 需要放在仅允许 phrasing content 的标签内（如 `<p>/<h1>`）时，可用 `as="span"` 并配合 `inline-block`。
 *
 */
type SkeletonProps = React.HTMLAttributes<HTMLElement> & { as?: "div" | "span" }

function Skeleton({ as: Comp = "div", className, ...props }: SkeletonProps) {
  return (
    <Comp
      data-slot="skeleton"
      className={cn("t-skeleton animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
