/**
 *
 * 单据刷新确认对话框桥接。
 * @remarks
 * - DocumentBase 是非 React 类，不能直接渲染 Dialog；
 * - 页面布局通过 registerDocumentRefreshConfirmationHandler 注册真正的模态对话框；
 * - 业务流程通过 confirmDocumentRefreshBeforeApply 等待用户选择，再决定是否写入最新单据。
 *
 */
export type DocumentRefreshConfirmationOptions = {
  /** 当前动作名称，例如“保存”“审批”“反审批”“删除”。 */
  readonly actionName: string
  /** 触发原因：写入前检查或后端拒绝后的兜底。 */
  readonly reason?: 'precheck' | 'rejected'
}

export type DocumentRefreshConfirmationHandler = (
  options: DocumentRefreshConfirmationOptions,
) => Promise<boolean> | boolean

let currentHandler: DocumentRefreshConfirmationHandler | null = null

/**
 *
 * 注册单据刷新确认处理器。
 * @param handler 由 React 布局提供的确认弹窗函数，传入 null 表示清理。
 * @returns 取消注册函数；仅当当前处理器仍为本次注册值时才清理。
 *
 */
export function registerDocumentRefreshConfirmationHandler(
  handler: DocumentRefreshConfirmationHandler | null,
): () => void {
  currentHandler = handler
  return () => {
    if (currentHandler === handler) currentHandler = null
  }
}

/**
 *
 * 询问用户是否将当前单据更新到数据库最新版本。
 * @param options 确认上下文。
 * @returns 用户选择“更新”返回 true；取消或无可用处理器返回 false。
 *
 */
export async function confirmDocumentRefreshBeforeApply(
  options: DocumentRefreshConfirmationOptions,
): Promise<boolean> {
  if (currentHandler) {
    try {
      return !!(await currentHandler(options))
    } catch {
      return false
    }
  }

  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    try {
      return window.confirm('单据已被修改，是否更新到最新？')
    } catch {
      return false
    }
  }

  return false
}
