"use client"
import type { PointerEvent as ReactPointerEvent, ReactElement, ReactNode, WheelEvent } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2Icon } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { CloseIconButton } from '@/components/ui/close-icon-button'
import { cn } from '@/lib/utils'

import styles from './image-overlay-viewer.module.css'

export interface ImageOverlayViewerAction {
  /**
   *
   * 唯一标识，用于 React key 与埋点等。
   *
   */
  id: string
  /**
   *
   * 按钮展示的文字标签。
   *
   */
  label: string
  /**
   *
   * 可选图标，一般使用 lucide-react 图标。
   *
   */
  icon?: ReactNode
  /**
   *
   * 操作回调，入参提供当前图片上下文。
   *
   */
  onClick: (payload: { src: string; alt?: string }) => void | Promise<void>
  /**
   *
   * 是否禁用当前操作。
   *
   */
  disabled?: boolean
}

export interface ImageOverlayViewerToolbarProps {
  /**
   *
   * 当前预览图片的地址。
   *
   */
  src: string
  /**
   *
   * 当前预览图片的替代文本。
   *
   */
  alt?: string
  /**
   *
   * 当前缩放比例，1 表示原始尺寸。
   *
   */
  scale: number
  /**
   *
   * 默认操作按钮集合，便于外部复用或重排。
   *
   */
  actions?: ImageOverlayViewerAction[]
}

export interface ImageOverlayViewerProps {
  /**
   *
   * 是否打开覆盖层。
   *
   */
  open: boolean
  /**
   *
   * 图片地址。
   *
   */
  src: string
  /**
   *
   * 图片的替代文本，用于无障碍与标题填充。
   *
   */
  alt?: string
  /**
   *
   * 可选标题，未传时默认回退到 alt。
   *
   */
  title?: string
  /**
   *
   * 可选描述文案，显示在标题下方。
   *
   */
  description?: string
  /**
   *
   * 打开状态变更回调。
   *
   */
  onOpenChange?: (open: boolean) => void
  /**
   *
   * 是否允许“点击/触摸空白背景关闭”策略。
   * - 开启时：在视口空白区域（非图片/工具栏）按下会触发关闭；鼠标仅响应左键。
   * - 关闭时：空白区域按下不会触发任何行为（避免误触导致关闭或拖拽图片）。
   * @default true
   *
   */
  closeOnBackdropPointerDown?: boolean
  /**
   *
   * 底部操作按钮集合，例如保存、分享等。
   *
   */
  actions?: ImageOverlayViewerAction[]
  /**
   *
   * 初始缩放比例，默认 1。
   *
   */
  initialScale?: number
  /**
   *
   * 打开时图片的适配模式：
   * - 'contain'：自适应屏幕，整体完整可见；
   * - 'original'：按原分辨率（比例 1:1）展示，超出部分可拖拽查看。
   * 若同时指定 initialScale，则 initialScale 会先生效，图片加载后按该模式自动调整缩放。
   *
   */
  initialFitMode?: 'contain' | 'original'
  /**
   *
   * 最小缩放比例，默认 0.05（5%）。
   * - 作为缩放下限，控制用户滚轮/捏合时最小能缩到多少；
   * - contain 初次适配不会被该值限制（否则大图可能无法完整落在屏幕内）。
   *
   */
  minScale?: number
  /**
   *
   * 最大缩放比例，默认 4。
   *
   */
  maxScale?: number
  /**
   *
   * 外层 className，可用于自定义层级等。
   *
   */
  className?: string
  /**
   *
   * 自定义工具栏内容。
   * - 传入 ReactNode 时，组件会直接渲染该节点；
   * - 传入函数时，会以 render prop 形式调用，提供当前图片上下文与默认 actions；
   * - 未提供时，回退到内部基于 actions 的默认工具栏。
   *
   */
  toolbar?: ReactNode | ((props: ImageOverlayViewerToolbarProps) => ReactNode)
}

interface PointerPosition {
  x: number
  y: number
}

interface TransformState {
  scale: number
  x: number
  y: number
}

interface DragState {
  active: boolean
  pointerId: number | null
  startX: number
  startY: number
  originX: number
  originY: number
}

interface PinchState {
  active: boolean
  initialDistance: number
  initialScale: number
}

/**
 *
 * 将数值限制在指定区间内。
 * @param value 原始数值
 * @param min 最小值
 * @param max 最大值
 *
 */
function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  if (value < min) return min
  if (value > max) return max
  return value
}

/**
 *
 * 计算两个指针点之间的直线距离。
 * @param a 第一个点
 * @param b 第二个点
 *
 */
function distanceBetween(a: PointerPosition, b: PointerPosition): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

/**
 *
 * 通用图片覆盖层浏览器组件。
 * - 使用 Dialog 包裹，提供可访问性的覆盖层结构；
 * - 支持鼠标滚轮缩放、指针拖拽平移，以及双指捏合缩放；
 * - 底部提供操作按钮区，可注入“保存”、“分享”等业务操作；
 * - 布局遵循“布局类 + 主题类”分离，视觉交由 theme.css 控制。
 *
 */
export function ImageOverlayViewer({
  open,
  src,
  alt,
  title,
  description,
  onOpenChange,
  closeOnBackdropPointerDown = true,
  actions,
  initialScale = 1,
  minScale = 0.05,
  maxScale = 4,
  initialFitMode = 'contain',
  className,
  toolbar,
}: ImageOverlayViewerProps): ReactElement | null {
  const [transform, setTransform] = useState<TransformState>(() => ({
    scale: initialScale,
    x: 0,
    y: 0,
  }))
  const [isDragging, setIsDragging] = useState(false)
  const [isImageLayoutNatural, setIsImageLayoutNatural] = useState(false)

  const pointersRef = useRef<Map<number, PointerPosition>>(new Map())
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const naturalSizeRef = useRef<{ width: number; height: number } | null>(null)
  const dragRef = useRef<DragState>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  })
  const pinchRef = useRef<PinchState>({
    active: false,
    initialDistance: 0,
    initialScale: initialScale,
  })

  /**
   *
   * 打开覆盖层时重置视图状态。
   * 使用 requestAnimationFrame 延后一帧，避免在 effect 中同步 setState 触发级联渲染告警。
   *
   */
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      setTransform({ scale: initialScale, x: 0, y: 0 })
      // 每次打开/切换图片时，先按“受约束布局（max-width: 100%）”渲染一帧，
      // 等图片加载完成后再切换到“原始尺寸布局 + transform 缩放”。
      // 这样可以避免出现：先铺满屏幕 -> onLoad 后又被二次缩放回很小的问题。
      setIsImageLayoutNatural(false)
      naturalSizeRef.current = null
      dragRef.current = {
        active: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
      }
      pinchRef.current = {
        active: false,
        initialDistance: 0,
        initialScale: initialScale,
      }
      pointersRef.current.clear()
      setIsDragging(false)
    })
    return () => cancelAnimationFrame(id)
  }, [open, src, initialScale])

  /**
   *
   * 根据视口和图片尺寸，将平移坐标限制在可见范围内。
   * 规则：
   * - 允许图片在视口内自由移动，只要仍有任意部分在视口内即可；
   * - 只有当整张图片要完全离开视口时，才会被限制（保证不会拖到完全看不见）。
   * @param next 目标变换状态
   *
   */
  function clampTransformValues(next: TransformState): TransformState {
    const viewport = viewportRef.current
    const naturalSize = naturalSizeRef.current
    if (!viewport || !naturalSize) return next

    const rect = viewport.getBoundingClientRect()
    const viewportWidth = rect.width || 1
    const viewportHeight = rect.height || 1

    const scaledWidth = naturalSize.width * next.scale
    const scaledHeight = naturalSize.height * next.scale

    // 允许图片中心在视口中心左右移动的最大距离：
    // |x| > (scaledWidth + viewportWidth) / 2 时，图片与视口将完全分离（无交集）。
    const limitX = (scaledWidth + viewportWidth) / 2
    const limitY = (scaledHeight + viewportHeight) / 2

    let { x, y } = next
    if (x > limitX) x = limitX
    else if (x < -limitX) x = -limitX

    if (y > limitY) y = limitY
    else if (y < -limitY) y = -limitY

    return { ...next, x, y }
  }

  /**
   *
   * 图片加载完成时，根据初始适配模式计算合适的缩放比例。
   * @param mode 初始适配模式（自适应/原分辨率）
   *
   */
  const handleImageLoad = useCallback(
    (mode: 'contain' | 'original') => {
      if (!open) return
      const viewport = viewportRef.current
      const img = imageRef.current
      if (!viewport || !img) return

      const rect = viewport.getBoundingClientRect()
      const viewportWidth = rect.width || 1
      const viewportHeight = rect.height || 1

      const naturalWidth = img.naturalWidth || viewportWidth
      const naturalHeight = img.naturalHeight || viewportHeight

      // 记录原始尺寸，便于后续在拖拽/缩放时限制平移范围。
      naturalSizeRef.current = { width: naturalWidth, height: naturalHeight }

      let baseScale: number
      if (mode === 'contain') {
        const scaleX = viewportWidth / naturalWidth
        const scaleY = viewportHeight / naturalHeight
        // 不放大超过 1，避免小图被强制放大导致锯齿
        baseScale = Math.min(scaleX, scaleY, 1)
      } else {
        // 原分辨率：按 1:1 展示，超出部分通过拖拽查看
        baseScale = 1
      }

      // contain 模式下初次适配不受 minScale 限制，保证大图能完整落在屏幕内；
      // original 模式则仍然按最小/最大缩放边界约束。
      const nextScale =
        mode === 'contain'
          ? Math.min(baseScale, maxScale)
          : clamp(baseScale, minScale, maxScale)

      setTransform(
        clampTransformValues({
          scale: nextScale,
          x: 0,
          y: 0,
        }),
      )
      setIsImageLayoutNatural(true)

      dragRef.current = {
        active: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
      }
      pinchRef.current = {
        active: false,
        initialDistance: 0,
        initialScale: nextScale,
      }
      pointersRef.current.clear()
      setIsDragging(false)
    },
    [open, minScale, maxScale],
  )

  const hasActions = (actions?.length ?? 0) > 0
  const displayTitle = useMemo(() => title || alt || '图像预览', [title, alt])

  /**
   *
   * 计算需要展示的工具栏内容。
   * - 优先使用外部传入的 toolbar（支持 ReactNode 与 render prop）；
   * - 否则回退到内部默认工具栏；
   * - 若两者都缺失，则不渲染工具栏区域。
   *
   */
  const toolbarContent = useMemo<ReactNode | null>(() => {
    if (typeof toolbar === 'function') {
      try {
        return toolbar({
          src,
          alt,
          scale: transform.scale,
          actions,
        })
      } catch (error) {
        console.error('[ImageOverlayViewer] render toolbar error:', error)
        return null
      }
    }

    if (toolbar) {
      return toolbar
    }

    if (!hasActions) {
      return null
    }

    return (
      <div className={cn(styles.toolbarInner, 't-card t-glass')}>
        <div className={styles.toolbarActions}>
          {actions?.map((action) => {
            const hasIcon = Boolean(action.icon)
            return (
              <button
                key={action.id}
                type="button"
                disabled={action.disabled}
                className={cn(
                  styles.toolbarButton,
                  !hasIcon && styles.toolbarButtonIconOnly,
                  't-accent text-xs disabled:opacity-60 disabled:pointer-events-none',
                )}
                onClick={async () => {
                  try {
                    await action.onClick({ src, alt })
                  } catch (error) {
                    console.error('[ImageOverlayViewer] action error:', error)
                  }
                }}
              >
                {action.icon ?? <Maximize2Icon className="size-4" />}
                {action.label ? (
                  <span className={styles.toolbarButtonLabel}>{action.label}</span>
                ) : null}
              </button>
            )
          })}
        </div>
        <div className={styles.toolbarScale}>
          {Math.round(transform.scale * 100)}%
        </div>
      </div>
    )
  }, [toolbar, src, alt, transform.scale, actions, hasActions])

  /**
   *
   * 处理鼠标滚轮缩放（桌面端）。
   * @param event 滚轮事件
   *
   */
  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      event.preventDefault()
      const { deltaY } = event
      const factor = deltaY < 0 ? 1.1 : 0.9
      setTransform((prev) => {
        const nextScale = clamp(prev.scale * factor, minScale, maxScale)
        const raw: TransformState = { ...prev, scale: nextScale }
        return clampTransformValues(raw)
      })
    },
    [minScale, maxScale],
  )

  /**
   *
   * 处理指针按下事件：记录指针并根据指针数量进入拖拽或捏合状态。
   * @param event 指针事件
   *
   */
  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      // 点击黑色背景关闭：仅在点击 viewport 自身（非图片/工具栏/按钮）时触发。
      if (event.target === event.currentTarget) {
        if (!closeOnBackdropPointerDown) {
          return
        }
        // 仅响应主键点击，避免右键等误触（触摸/笔通常为 0）。
        if (event.pointerType === 'mouse' && event.button !== 0) {
          return
        }
        try {
          onOpenChange?.(false)
        } catch {
          // 忽略外部回调错误，避免影响关闭
        }
        return
      }

      event.currentTarget.setPointerCapture(event.pointerId)
      const point: PointerPosition = { x: event.clientX, y: event.clientY }
      const map = pointersRef.current
      map.set(event.pointerId, point)

      if (map.size === 1) {
        // 单指拖拽
        dragRef.current = {
          active: true,
          pointerId: event.pointerId,
          startX: point.x,
          startY: point.y,
          originX: transform.x,
          originY: transform.y,
        }
        setIsDragging(true)
      } else if (map.size === 2) {
        // 双指捏合
        const [p1, p2] = Array.from(map.values())
        pinchRef.current = {
          active: true,
          initialDistance: distanceBetween(p1, p2),
          initialScale: transform.scale,
        }
        dragRef.current = {
          active: false,
          pointerId: null,
          startX: 0,
          startY: 0,
          originX: transform.x,
          originY: transform.y,
        }
        setIsDragging(false)
      }
    },
    [transform.x, transform.y, transform.scale, onOpenChange, closeOnBackdropPointerDown],
  )

  /**
   *
   * 处理指针移动事件：根据当前状态执行平移或缩放。
   * @param event 指针事件
   *
   */
  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const map = pointersRef.current
      if (!map.has(event.pointerId)) return

      const point: PointerPosition = { x: event.clientX, y: event.clientY }
      map.set(event.pointerId, point)

      if (pinchRef.current.active && map.size === 2) {
        // 双指捏合缩放
        const [p1, p2] = Array.from(map.values())
        const currentDistance = distanceBetween(p1, p2)
        if (currentDistance <= 0 || !Number.isFinite(currentDistance)) return
        const ratio = currentDistance / (pinchRef.current.initialDistance || 1)
        setTransform((prev) => {
          const baseScale = pinchRef.current.initialScale || prev.scale
          const nextScale = clamp(baseScale * ratio, minScale, maxScale)
          const raw: TransformState = { ...prev, scale: nextScale }
          return clampTransformValues(raw)
        })
        return
      }

      if (dragRef.current.active && dragRef.current.pointerId === event.pointerId) {
        // 单指拖拽平移
        const { startX, startY, originX, originY } = dragRef.current
        const dx = point.x - startX
        const dy = point.y - startY
        setTransform((prev) => {
          const raw: TransformState = {
            ...prev,
            x: originX + dx,
            y: originY + dy,
          }
          return clampTransformValues(raw)
        })
      }
    },
    [minScale, maxScale],
  )

  /**
   *
   * 处理指针结束事件：清理指针与拖拽/捏合状态。
   * @param event 指针事件
   *
   */
  const handlePointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const map = pointersRef.current
    map.delete(event.pointerId)

    if (dragRef.current.pointerId === event.pointerId) {
      dragRef.current = {
        active: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        originX: transform.x,
        originY: transform.y,
      }
      setIsDragging(false)
    }

    if (map.size < 2) {
      pinchRef.current = {
        active: false,
        initialDistance: 0,
        initialScale: transform.scale,
      }
    }
  }, [transform.x, transform.y, transform.scale])

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="fullscreen"
        overlayClassName="bg-transparent"
        showCloseButton={false}
        className={cn(
          styles.root,
          'w-screen h-screen max-w-none max-h-none p-0 border-none bg-transparent shadow-none',
          className,
        )}
      >
        <div className={styles.backdrop} />
        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <DialogTitle className={styles.headerMain} title={displayTitle}>
                {displayTitle}
              </DialogTitle>
              {description ? (
                <DialogDescription className={styles.headerSub}>
                  {description}
                </DialogDescription>
              ) : null}
            </div>
            <CloseIconButton
              ariaLabel="关闭图像预览"
              variant="solid"
              className="h-9 w-9 md:h-10 md:w-10"
              onClick={() => {
                try {
                  onOpenChange?.(false)
                } catch {
                  // 忽略外部回调错误，避免影响关闭
                }
              }}
            />
          </header>

          <div
            className={styles.viewport}
            ref={viewportRef}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          >
            <div
              className={cn(
                styles.imageLayer,
                isImageLayoutNatural && styles.imageLayerNatural,
                isDragging && styles.imageLayerGrabbing,
              )}
              style={{
                transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
              }}
            >
              <img
                ref={imageRef}
                src={src}
                alt={alt}
                className={cn(styles.image, isImageLayoutNatural && styles.imageNatural)}
                onLoad={() => handleImageLoad(initialFitMode)}
              />
            </div>

            <div className={styles.toolbar} aria-hidden={!toolbarContent}>
              {toolbarContent}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
