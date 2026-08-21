/**
 * 单据页面离开确认桥接。
 *
 * @remarks
 * - 单据 ViewModel 不是 React 组件，因此不能直接打开页面层的 Dialog；
 * - 页面布局负责注册真正的确认处理器，ViewModel/导航组件只通过本模块请求确认；
 * - 浏览器刷新、关闭标签页等场景由页面布局额外注册 `beforeunload` 处理。
 */

/** 离开单据页面时展示的确认文案；浏览器原生 beforeunload 可能只展示固定文案。 */
export const DOCUMENT_LEAVE_CONFIRMATION_MESSAGE =
  '当前单据有草稿数据，离开后未保存的数据可能丢失，确定要离开吗？'

/** 当前页面是否存在需要保护的单据内容。 */
export type DocumentLeaveGuard = () => boolean

/** 页面层提供的异步确认处理器。 */
export type DocumentLeaveConfirmationHandler = () => Promise<boolean> | boolean

let currentGuard: DocumentLeaveGuard | null = null
let currentHandler: DocumentLeaveConfirmationHandler | null = null
let bypassNextPopState = false
let bypassNextConfirmation = false

/**
 * 注册当前单据的离开守卫。
 *
 * @param guard 返回 true 表示当前页面存在已装载单据/草稿，或新建态已有用户修改。
 * @returns 取消本次注册的函数；不会误清理后续页面注册的守卫。
 */
export function registerDocumentLeaveGuard(guard: DocumentLeaveGuard | null): () => void {
  currentGuard = guard
  return () => {
    if (currentGuard === guard) currentGuard = null
  }
}

/**
 * 注册页面层的确认处理器。
 *
 * @param handler 页面 Dialog 的 Promise 处理函数，传入 null 表示清理。
 * @returns 取消本次注册的函数。
 */
export function registerDocumentLeaveConfirmationHandler(
  handler: DocumentLeaveConfirmationHandler | null,
): () => void {
  currentHandler = handler
  return () => {
    if (currentHandler === handler) currentHandler = null
  }
}

/**
 * 判断当前是否需要确认离开。
 *
 * @returns 守卫存在且返回 true 时为 true；守卫异常时按需保护数据处理为 true。
 */
export function hasDocumentLeaveGuard(): boolean {
  if (!currentGuard) return false
  try {
    return !!currentGuard()
  } catch {
    // 无法确认当前状态时选择拦截，避免异常导致草稿静默丢失。
    return true
  }
}

/**
 * 请求用户确认离开当前单据页面。
 *
 * @returns 无需保护或用户确认离开时为 true；用户取消、确认器异常或不可用时为 false。
 */
export async function confirmDocumentLeave(): Promise<boolean> {
  // 已经在上一层导航入口完成过确认时，消费一次性放行标记，避免同一次导航重复询问。
  if (consumeAllowedDocumentLeaveConfirmation()) return true
  if (!hasDocumentLeaveGuard()) return true

  if (currentHandler) {
    try {
      return !!(await currentHandler())
    } catch {
      return false
    }
  }

  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    try {
      return window.confirm(DOCUMENT_LEAVE_CONFIRMATION_MESSAGE)
    } catch {
      return false
    }
  }

  return false
}

/**
 * 标记下一次非浏览器后退导航已经完成确认。
 *
 * @remarks
 * AppLink、统一导航 Hook 和页面内部的 router.push/replace 都可能先询问，
 * 随后才执行真正导航。若导航链路还有第二层守卫，应直接消费该标记而不再弹窗。
 */
export function allowNextDocumentLeaveConfirmation(): void {
  bypassNextConfirmation = true
}

/** 消费一次已确认的非浏览器后退导航标记。 */
export function consumeAllowedDocumentLeaveConfirmation(): boolean {
  if (!bypassNextConfirmation) return false
  bypassNextConfirmation = false
  return true
}

/** 清理尚未被消费的导航放行标记。 */
export function clearAllowedDocumentLeaveConfirmation(): void {
  bypassNextConfirmation = false
}

/**
 * 标记下一次浏览器 popstate 为已确认导航。
 *
 * @remarks
 * 页面返回按钮在确认后调用 `router.back()` 时，必须跳过 popstate 守卫，避免重复询问。
 */
export function allowNextDocumentLeavePopState(): void {
  bypassNextPopState = true
}

/** 消费一次已确认的 popstate 标记。 */
export function consumeAllowedDocumentLeavePopState(): boolean {
  if (!bypassNextPopState) return false
  bypassNextPopState = false
  return true
}
