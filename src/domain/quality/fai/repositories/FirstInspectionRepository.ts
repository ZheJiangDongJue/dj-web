import type { FirstInspection, FirstInspectionId } from '../entities/FirstInspection'

export { FirstInspection } from '../entities/FirstInspection'
export type { FirstInspectionId } from '../entities/FirstInspection'
export type { FirstInspectionDetail } from '../entities/FirstInspectionDetail'

/**
 *
 * 仓储操作结果（领域层）。
 *
 */
export interface FirstInspectionRepositoryActionResult {

  success: boolean
  /**
   *
   * 提示信息。
   *
   */
  message: string
  /**
   *
   * 可选业务码。
   *
   */
  code?: number | string
}

/**
 *
 * 首件检验查询条件。
 *
 */
export interface FirstInspectionFindConditions {

  dbName?: string
  /**
   *
   * 状态过滤。
   *
   */
  status?: number
  /**
   *
   * 检验员过滤。
   *
   */
  employeeId?: number
  /**
   *
   * 物料过滤。
   *
   */
  materialId?: number
  /**
   *
   * 工序过滤。
   *
   */
  typeOfWorkId?: number
  /**
   *
   * 内部键过滤。
   *
   */
  innerKey?: string
  /**
   *
   * 自定义 Id 列表。
   *
   */
  ids?: readonly number[]
  /**
   *
   * 最多返回条数。
   *
   */
  take?: number
}

/**
 *
 * 首件检验仓储接口（领域层）。
 *
 */
export interface FirstInspectionRepository {

/**
 *
 * 按 Id 获取首件检验（含明细）。
 * @param id 单据主键。
 * @returns 聚合根或 null。
 *
 */
  findById(id: FirstInspectionId): Promise<FirstInspection | null>

  /**
   *
   * 按条件查询首件检验列表。
   * @param conditions 查询条件。
   * @returns 聚合根列表。
   *
   */
  findByConditions(conditions: FirstInspectionFindConditions): Promise<FirstInspection[]>

  /**
   *
   * 保存首件检验（新增/修改）。
   * @param entity 聚合对象。
   * @returns 保存后的聚合对象。
   *
   */
  save(entity: FirstInspection): Promise<FirstInspection>

  /**
   *
   * 删除首件检验。
   * @param id 单据主键。
   * @returns 操作结果。
   *
   */
  delete(id: FirstInspectionId): Promise<FirstInspectionRepositoryActionResult>
}
