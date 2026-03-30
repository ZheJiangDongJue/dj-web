"use client"
import type { ReactNode } from 'react'

/**
 *
 * 分子组件：明细卡片列表（通用）
 * - 不限领域的通用列表容器，外部以 renderItem 定义单项展现
 * - 默认为每项包裹卡片容器（t-card），可通过 wrapEachItem 关闭
 *
 */
export function DetailsCardList<T>({
  items,
  getKey,
  renderItem,
  className,
  itemClassName,
  wrapEachItem = true,
}: {
  /**
   *
   * 列表数据
   *
   */
 items: T[]
  /**
   *
   * 生成每项的唯一 key
   *
   */
 getKey: (item: T, index: number) => string | number
  /**
   *
   * 自定义渲染单项
   *
   */
 renderItem: (ctx: { item: T; index: number }) => ReactNode
  /**
   *
   * 列表容器 className（覆盖默认滚动/间距样式）
   *
   */
 className?: string
  /**
   *
   * 单项容器 className（默认：t-card w-full p-2）
   *
   */
 itemClassName?: string
  /**
   *
   * 是否为每项包裹容器（默认 true）
   *
   */
 wrapEachItem?: boolean
}) {
  const listClass =
    className ?? 'w-full flex-1 min-h-0 space-y-2 overflow-y-auto overflow-x-hidden'
  const perItemClass = itemClassName ?? 't-card w-full p-2'

  return (
    <div className={listClass}>
      {items.map((item, index) => {
        const key = getKey(item, index)
        const content = renderItem({ item, index })
        return wrapEachItem ? (
          <div key={key} className={perItemClass}>
            {content}
          </div>
        ) : (
          <div key={key}>{content}</div>
        )
      })}
    </div>
  )
}
