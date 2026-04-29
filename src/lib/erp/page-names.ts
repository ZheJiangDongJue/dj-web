/**
 *
 * ERP PageName 常量表（与“行为角色权限”系统对齐）。
 *
 * 背景：
 * - ERPClient/WPF 端使用 `PageName` 作为权限粒度（页面入口/功能入口）。
 * - 后端 `AuthModel.GetAuth(dbName, userId)` 返回的权限 Map 以 `PageName` 为 Key。
 * - dj-web 使用 Next.js 文件路由，不天然具备 `PageName` 概念，因此需要在前端显式维护一份稳定标识。
 *
 * 约束与约定：
 * - 这里的值必须与后端权限系统中的 `PageName` 完全一致（区分大小写）。
 * - 推荐直接使用 ERPClient 中对应页面的类型名（如：FirstInspectionDocumentEditorPage），
 *   以便与现有权限数据复用，避免重复维护两套权限表。
 *
 */

export const ERP_PAGE_NAME = {
  /**
   *
   * 首件检验（FAI）
   *
   */
  FAI: 'FirstInspectionDocumentEditorPage',
  /**
   *
   * 末道检验（FQC）
   *
   */
  FQC: 'FinalInspectionDocumentEditorPage',
  /**
   *
   * 不合格记录单（NCR / 不合格返工单）
   *
   */
  NCR: 'DefectiveReworkOrderDocumentEditorPage',
} as const

/**
 *
 * ERP PageName 字面量类型（便于在配置中获得类型提示）。
 *
 */
export type ErpPageName = (typeof ERP_PAGE_NAME)[keyof typeof ERP_PAGE_NAME]

