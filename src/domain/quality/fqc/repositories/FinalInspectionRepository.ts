import type { FinalInspection, FinalInspectionId } from '../entities/FinalInspection'

export { FinalInspection } from '../entities/FinalInspection'
export type { FinalInspectionId } from '../entities/FinalInspection'
export type { FinalInspectionDetail } from '../entities/FinalInspectionDetail'

/**
 *
 * 仓储操作结果（领域层）。
 *
 */
 export interface FinalInspectionRepositoryActionResult {

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
 * 末道检验查询条件。
 *
 */
 export interface FinalInspectionFindConditions {

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
 * 末道检验仓储接口（领域层）。
 *
 */
 export interface FinalInspectionRepository {

/**
 *
 * 按 Id 获取末道检验（含明细）。
 * @param id 单据主键。
 * @returns 聚合根或 null。
 *
 */
  findById(id: FinalInspectionId): Promise<FinalInspection | null>

  /**
   *
   * 按条件查询末道检验列表。
   * @param conditions 查询条件。
   * @returns 聚合根列表。
   *
   */
  findByConditions(conditions: FinalInspectionFindConditions): Promise<FinalInspection[]>

  /**
   *
   * 保存末道检验（新增/修改）。
   * @param entity 聚合对象。
   * @returns 保存后的聚合对象。
   *
   */
  save(entity: FinalInspection): Promise<FinalInspection>

  /**
   *
   * 删除末道检验。
   * @param id 单据主键。
   * @returns 操作结果。
   *
   */
  delete(id: FinalInspectionId): Promise<FinalInspectionRepositoryActionResult>
}
