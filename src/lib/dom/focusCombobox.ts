/**
 *
 * 通过 aria-label 聚焦并可选展开一个基于 Combobox 的触发按钮。
 * 适配当前项目 Combobox 结构（触发器拥有 data-slot="combobox-trigger"）。
 * 设计目标：
 * - 调用简单：传入 aria-label 即可；
 * - 行为稳健：支持滚动到视口中间、优先 preventScroll 的安全聚焦；
 * - 兼容性：若找不到触发器，尝试回退到目标元素本身；
 * - 静默失败：任何 DOM 异常不会抛出，返回 false 提示未成功。
 * @param ariaLabel 目标 combobox 触发器的 aria-label 文本
 * @param options 可选项：控制滚动/展开等行为
 * @returns 是否找到元素并完成聚焦（不代表一定成功展开）
 *
 */
export function focusComboboxByAriaLabel(
  ariaLabel: string,
  options?: {
    /**
     *
     * 是否滚动到可视区域（默认 true）
     *
     */
 scrollIntoView?: boolean
    /**
     *
     * 滚动行为（默认 'smooth'）
     *
     */
 scrollBehavior?: ScrollBehavior
    /**
     *
     * 滚动定位（默认 'center'）
     *
     */
 scrollBlock?: ScrollLogicalPosition
    /**
     *
     * 聚焦后是否点击以尝试展开弹层（默认 true）
     *
     */
 openOnFocus?: boolean
    /**
     *
     * 仅当未找到触发器时，是否允许退回到 aria 元素本身（默认 true）
     *
     */
 fallbackToTarget?: boolean
  },
): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false

  const {
    scrollIntoView = true,
    scrollBehavior = 'smooth',
    scrollBlock = 'center',
    openOnFocus = true,
    fallbackToTarget = true,
  } = options || {}

  try {
    // 1) 先按 aria-label 精确选择
    const target = document.querySelector<HTMLElement>(`[aria-label="${ariaLabel}"]`)
    if (!target) return false

    // 2) 再向上寻找符合 data-slot 的触发器；否则可退回到目标
    const trigger = (target.closest('[data-slot="combobox-trigger"]') as HTMLElement) ||
      (target.matches?.('[data-slot="combobox-trigger"]') ? (target as HTMLElement) : undefined) ||
      (fallbackToTarget ? target : undefined)
    if (!trigger) return false

    // 3) 滚动与聚焦（尽量避免聚焦导致的二次滚动）
    if (scrollIntoView) {
      try { trigger.scrollIntoView({ block: scrollBlock, behavior: scrollBehavior }) } catch {}
    }
    try {
      // 优先 preventScroll，避免和上面的 scrollIntoView 抢滚动
      ;(trigger as any).focus?.({ preventScroll: true })
    } catch {
      try { trigger.focus() } catch {}
    }

    // 4) 可选尝试展开
    if (openOnFocus && !trigger.hasAttribute('disabled')) {
      try { trigger.click() } catch {}
    }

    return true
  } catch {
    return false
  }
}

/**
 *
 * 直接对已知触发器元素执行滚动/聚焦/展开。
 * 一般情况下更推荐使用 {@link focusComboboxByAriaLabel}。
 * @param trigger 已定位到的 combobox 触发器元素
 * @param options 可选项，同 {@link focusComboboxByAriaLabel}
 * @returns 是否完成聚焦
 *
 */
export function focusComboboxTrigger(
  trigger: HTMLElement | null | undefined,
  options?: {
    scrollIntoView?: boolean
    scrollBehavior?: ScrollBehavior
    scrollBlock?: ScrollLogicalPosition
    openOnFocus?: boolean
  },
): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  if (!trigger) return false
  const {
    scrollIntoView = true,
    scrollBehavior = 'smooth',
    scrollBlock = 'center',
    openOnFocus = true,
  } = options || {}

  try {
    if (scrollIntoView) {
      try { trigger.scrollIntoView({ block: scrollBlock, behavior: scrollBehavior }) } catch {}
    }
    try {
      ;(trigger as any).focus?.({ preventScroll: true })
    } catch {
      try { trigger.focus() } catch {}
    }
    if (openOnFocus && !trigger.hasAttribute('disabled')) {
      try { trigger.click() } catch {}
    }
    return true
  } catch {
    return false
  }
}

