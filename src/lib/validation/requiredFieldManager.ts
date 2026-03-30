/**
 *
 * 必填项管理器（RequiredFieldManager）
 * 用于在页面中以“注册”的方式集中管理一组控件，
 * 提供：注册、注销、取值、空值检测（自动聚焦第一个空控件）等能力。
 * 设计要点：
 * - 控件以唯一 key 进行注册，支持按注册顺序进行空值检测。
 * - 每个控件可提供 getValue 函数与 focus 行为（优先使用 focus，若提供 element 则尝试 element.focus）。
 * - isEmpty 可定制空值判断，未提供时使用内置健壮的默认判断。
 * - 安全适配 SSR：仅在浏览器环境尝试聚焦。
 *
 */

export type FocusableElement = {
  focus: () => void
  scrollIntoView?: (arg?: ScrollIntoViewOptions) => void
}

/**
 *
 * 单个控件的注册信息
 *
 */
export interface RequiredFieldRegistration<TValue = unknown> {
  /**
   *
   * 获取控件当前值（用于取值与判空）。
   *
   */
  getValue: () => TValue
  /**
   *
   * 聚焦控件（优先使用此函数）。
   *
   */
  focus?: () => void
  /**
   *
   * 若未提供自定义 focus，可提供真实 DOM 元素以便自动聚焦。
   *
   */
  element?: FocusableElement | null
  /**
   *
   * 自定义空值判断函数，覆盖默认策略。
   *
   */
  isEmpty?: (value: TValue) => boolean
}

/**
 *
 * 空值检测的结果
 *
 */
export interface EmptyCheckResult {
  /**
   *
   * 是否存在空值控件
   *
   */
  hasEmpty: boolean
  /**
   *
   * 第一个空值控件的 key（若无空值则为 undefined）
   *
   */
  firstEmptyKey?: string
  /**
   *
   * 所有空值控件的 key 列表（按注册顺序）
   *
   */
  emptyKeys: string[]
}

/**
 *
 * 默认空值判断（健壮性强的通用策略）：
 * - undefined / null 为空
 * - string: 去除两端空白后长度为 0 为空
 * - array: 长度为 0 为空
 * - Map/Set: size 为 0 为空
 * - object: 无自有可枚举键为空
 * - number/boolean/symbol/bigint: 一律认为非空（如需特殊规则请提供 isEmpty）。
 *
 */
export function defaultIsEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (value instanceof Map || value instanceof Set) return value.size === 0
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  return false
}

/**
 *
 * 安全尝试聚焦：仅在浏览器环境执行，并尽可能将元素滚动到可视范围。
 *
 */
function tryFocus<TValue>(entry: RequiredFieldRegistration<TValue>): void {
  // 仅在浏览器环境尝试聚焦
  if (typeof window === 'undefined') return

  try {
    if (typeof entry.focus === 'function') {
      entry.focus()
      return
    }

    const el = entry.element
    if (el && typeof el.focus === 'function') {
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
      el.focus()
    }
  } catch {
    // 聚焦失败时静默处理，避免影响主流程
  }
}

/**
 *
 * 必填项管理器
 *
 */
export class RequiredFieldManager<TValue = unknown> {
  private readonly items = new Map<string, RequiredFieldRegistration<TValue>>()

  /**
   *
   * 注册一个控件。
   * @param key 控件唯一标识
   * @param registration 控件注册信息
   * @returns 返回一个函数以便便捷注销（unregister）
   *
   */
  register(key: string, registration: RequiredFieldRegistration<TValue>): () => void {
    if (!key || typeof key !== 'string') {
      throw new Error('register 失败：key 必须为非空字符串')
    }
    if (!registration || typeof registration.getValue !== 'function') {
      throw new Error('register 失败：registration 必须包含 getValue 函数')
    }

    this.items.set(key, registration)
    return () => this.unregister(key)
  }

  /**
   *
   * 注销指定 key 的控件。
   * @param key 控件唯一标识
   * @returns 是否成功删除
   *
   */
  unregister(key: string): boolean {
    return this.items.delete(key)
  }

  /**
   *
   * 清空所有注册项。
   *
   */
  clear(): void {
    this.items.clear()
  }

  /**
   *
   * 获取当前已注册的 key 列表（按注册顺序）。
   *
   */
  keys(): string[] {
    return Array.from(this.items.keys())
  }

  /**
   *
   * 获取指定 key 的值。
   *
   */
  getValue(key: string): TValue | undefined {
    const entry = this.items.get(key)
    return entry?.getValue()
  }

  /**
   *
   * 获取所有值（按注册顺序合并为对象）。
   *
   */
  getValues(): Record<string, TValue> {
    const result: Record<string, TValue> = {}
    for (const [key, entry] of this.items) {
      result[key] = entry.getValue()
    }
    return result
  }

  /**
   *
   * 检测空值，不触发聚焦。
   * @returns 空值检测结果（包含是否有空、首个空 key、全部空 key）
   *
   */
  checkEmpty(): EmptyCheckResult {
    const emptyKeys: string[] = []

    for (const [key, entry] of this.items) {
      const value = entry.getValue()
      const isEmpty = entry.isEmpty ? entry.isEmpty(value) : defaultIsEmpty(value)
      if (isEmpty) emptyKeys.push(key)
    }

    return {
      hasEmpty: emptyKeys.length > 0,
      firstEmptyKey: emptyKeys[0],
      emptyKeys,
    }
  }

  /**
   *
   * 检测空值并聚焦第一个空控件。
   * @returns 结果同 checkEmpty，若存在空值会尝试聚焦第一个空控件
   *
   */
  checkEmptyAndFocus(): EmptyCheckResult {
    const result = this.checkEmpty()
    if (result.hasEmpty && result.firstEmptyKey) {
      const first = this.items.get(result.firstEmptyKey)
      if (first) tryFocus(first)
    }
    return result
  }
}

/**
 *
 * 轻量工厂方法：创建一个新的必填项管理器实例。
 *
 */
export function createRequiredFieldManager<TValue = unknown>(): RequiredFieldManager<TValue> {
  return new RequiredFieldManager<TValue>()
}

/**
 *
 * React Hook 版本（不强依赖 React，可在客户端组件中使用）。
 * 注意：
 * - 本 Hook 通过惰性创建方式在首次调用时生成单例实例，组件卸载不会自动 clear。
 * - 若需与组件生命周期强绑定，请在组件卸载时手动调用 manager.clear()。
 *
 */
export function useRequiredFieldManager<TValue = unknown>(): RequiredFieldManager<TValue> {
  // 在 React 客户端组件/Hook 中使用，顶层调用 useRef 符合 Hooks 规则
  // 若需在非 React 环境中使用，请改用 createRequiredFieldManager()
  const React = require('react') as typeof import('react')
  const ref = React.useRef<RequiredFieldManager<TValue> | null>(null)
  if (ref.current == null) {
    ref.current = new RequiredFieldManager<TValue>()
  }
  return ref.current
}

/**
 * 使用示例（仅文档，不会被编译执行）：
 * const manager = createRequiredFieldManager<string>()
 * // 注册
 * const unregister = manager.register('username', {
 *   getValue: () => usernameState,
 *   element: inputRef.current, // 或提供 focus: () => inputRef.current?.focus()
 * })
 * // 统一取值
 * const values = manager.getValues() // => { username: 'xxx', ... }
 * // 校验并聚焦第一个空控件
 * const { hasEmpty, firstEmptyKey } = manager.checkEmptyAndFocus()
 * if (!hasEmpty) {
 *   // 提交逻辑
 * }
 * // 注销（组件卸载或不再需要时）
 * unregister()
 */
