import type { DefectiveReworkOrder, DefectiveReworkOrderId } from '../entities/DefectiveReworkOrder'

export { DefectiveReworkOrder } from '../entities/DefectiveReworkOrder'
export type { DefectiveReworkOrderId } from '../entities/DefectiveReworkOrder'

/**
 *
 * 说明：NCR 领域模型已从“快照占位”升级为强类型聚合根/实体/值对象。
 * @remarks
 * - 聚合根定义位于 <c>domain/quality/ncr/entities</c>；\\n
 * - 本文件保留仓储接口与操作结果类型，并对外 re-export 聚合根与 Id，便于上层依赖稳定入口。\\n
 *
 */

/**
 *
 * 仓储操作结果（领域层）。
 * @remarks
 * - 将后端 ApiMessagePack/DbChangedPackResult 统一映射为领域可用的最小结果形态。\\n
 * - 领域层不暴露后端 DTO，避免基础设施细节泄漏。\\n
 *
 */
 export interface DefectiveReworkOrderRepositoryActionResult {

/**
 *
 * 是否成功。
 *
 */
  success: boolean

  /**
   *
   * 可展示的提示信息（失败时通常包含原因）。
   *
   */
  message: string

  /**
   *
   * 可选业务码/状态码（透传用于调试或上层策略判断）。
   *
   */
  code?: number | string
}

/**
 *
 * NCR 不合格返工单仓储接口（领域层）。
 * @remarks
 * - 领域层只定义“需要的能力”，不强制遵循通用 CRUD；实现层负责对接现有 WebApi。\\n
 * - 所有方法均返回领域对象/领域结果，避免返回 API DTO。\\n
 *
 */
 export interface DefectiveReworkOrderRepository {

/**
 *
 * 按 Id 获取不合格返工单（含明细）。
 * @param id 单据主键。
 * @returns 存在返回聚合；不存在返回 null。
 *
 */
  getById(id: DefectiveReworkOrderId): Promise<DefectiveReworkOrder | null>

  /**
   *
   * 保存不合格返工单（新增/修改）。
   * @param entity 聚合对象。
   * @returns 保存后的聚合对象（通常包含后端生成的 Id）。
   *
   */
  save(entity: DefectiveReworkOrder): Promise<DefectiveReworkOrder>

  /**
   *
   * 审批不合格返工单。
   * @param id 单据主键。
   * @returns 领域操作结果。
   *
   */
  approve(id: DefectiveReworkOrderId): Promise<DefectiveReworkOrderRepositoryActionResult>

  /**
   *
   * 反审批不合格返工单。
   * @param id 单据主键。
   * @returns 领域操作结果。
   *
   */
  unapprove(id: DefectiveReworkOrderId): Promise<DefectiveReworkOrderRepositoryActionResult>

  /**
   *
   * 删除不合格返工单。
   * @param id 单据主键。
   * @returns 领域操作结果。
   *
   */
  delete(id: DefectiveReworkOrderId): Promise<DefectiveReworkOrderRepositoryActionResult>
}

