import {
  DefectiveReworkOrder,
  type DefectiveReworkOrderApproveViolation,
  type DefectiveReworkOrderId,
} from '../entities/DefectiveReworkOrder'
import { ReworkOrderStatusFlag } from '../value-objects/ReworkOrderStatus'

/**
 *
 * NCR 审批相关错误码。
 *
 */
 export type DefectiveReworkOrderApprovalErrorCode =
 | 'ORDER_LOCKED'
 | 'ALREADY_APPROVED'
 | 'NOT_APPROVED'
 | 'APPROVE_PRECONDITION_FAILED'

/**
 *
 * NCR 审批/反审批失败信息（领域层）。
 *
 */
 export type DefectiveReworkOrderApprovalError = {

/**
 *
 * 错误码。
 *
 */
  readonly code: DefectiveReworkOrderApprovalErrorCode

  /**
   *
   * 可展示的错误信息。
   *
   */
  readonly message: string

  /**
   *
   * 审批前置条件失败时的详细错误项（可空）。
   *
   */
 readonly violations?: readonly DefectiveReworkOrderApproveViolation[]
 }

/**
 *
 * NCR 审批领域事件（仅表达“发生了什么”，不绑定事件总线实现）。
 * @remarks
 * 说明：当前领域层未引入通用 DomainEvent 基类，本事件类型用于 Application 层做桥接/落库/日志。\\n
 *
 */
 export type DefectiveReworkOrderApprovalEvent =
 | {

/**
 *
 * 事件类型。
 *
 */
      readonly type: 'DEFECTIVE_REWORK_ORDER_APPROVED'
      /**
       *
       * 单据主键。
       *
       */
      readonly orderId: DefectiveReworkOrderId
    }
  | {
      /**
       *
       * 事件类型。
       *
       */
      readonly type: 'DEFECTIVE_REWORK_ORDER_APPROVAL_REJECTED'
      /**
       *
       * 单据主键。
       *
       */
      readonly orderId: DefectiveReworkOrderId
      /**
       *
       * 失败原因。
       *
       */
      readonly reason: string
    }
  | {
      /**
       *
       * 事件类型。
       *
       */
      readonly type: 'DEFECTIVE_REWORK_ORDER_UNAPPROVED'
      /**
       *
       * 单据主键。
       *
       */
      readonly orderId: DefectiveReworkOrderId
    }
  | {
      /**
       *
       * 事件类型。
       *
       */
      readonly type: 'DEFECTIVE_REWORK_ORDER_UNAPPROVAL_REJECTED'
      /**
       *
       * 单据主键。
       *
       */
      readonly orderId: DefectiveReworkOrderId
      /**
       *
       * 失败原因。
       *
       */
      readonly reason: string
    }

/**
 *
 * NCR 审批/反审批操作结果（领域层）。
 *
 */
 export type DefectiveReworkOrderApprovalResult =
 | {

/**
 *
 * 是否成功。
 *
 */
      readonly ok: true
      /**
       *
       * 状态转换后的聚合实例。
       *
       */
      readonly order: DefectiveReworkOrder
      /**
       *
       * 领域事件列表。
       *
       */
      readonly events: readonly DefectiveReworkOrderApprovalEvent[]
    }
  | {
      /**
       *
       * 是否成功。
       *
       */
      readonly ok: false
      /**
       *
       * 原聚合实例（保持不变）。
       *
       */
      readonly order: DefectiveReworkOrder
      /**
       *
       * 失败信息。
       *
       */
      readonly error: DefectiveReworkOrderApprovalError
      /**
       *
       * 领域事件列表（包含失败事件）。
       *
       */
      readonly events: readonly DefectiveReworkOrderApprovalEvent[]
    }

/**
 *
 * NCR 不合格返工单审批领域服务。
 * @remarks
 * - 负责封装“审批/反审批”跨状态的业务规则与状态转换；\\n
 * - 该服务为纯领域逻辑：不依赖 React/Next.js，不直接调用 API/仓储。\\n
 *
 */
 export class DefectiveReworkOrderApprovalService {

/**
 *
 * 审批：将未审批状态转换为已审批状态。
 * @remarks
 * 规则：\\n
 * 1) 单据不可处于锁定态（冻结/结案/作废）；\\n
 * 2) 不可重复审批；\\n
 * 3) 需满足聚合根的审批前置校验（检验员/不合格工序/明细记录）。\\n
 * @param order 返工单聚合根。
 * @returns 审批结果（成功返回新聚合，失败返回原聚合）。
 *
 */
  public static approve(order: DefectiveReworkOrder): DefectiveReworkOrderApprovalResult {
    if (order.status.isLocked()) {
      const error: DefectiveReworkOrderApprovalError = {
        code: 'ORDER_LOCKED',
        message: '当前单据已冻结/结案/作废，无法审批',
      }
      return {
        ok: false,
        order,
        error,
        events: [
          {
            type: 'DEFECTIVE_REWORK_ORDER_APPROVAL_REJECTED',
            orderId: order.id,
            reason: error.message,
          },
        ],
      }
    }

    if (order.status.isApproved()) {
      const error: DefectiveReworkOrderApprovalError = {
        code: 'ALREADY_APPROVED',
        message: '当前单据已审批，无法重复审批',
      }
      return {
        ok: false,
        order,
        error,
        events: [
          {
            type: 'DEFECTIVE_REWORK_ORDER_APPROVAL_REJECTED',
            orderId: order.id,
            reason: error.message,
          },
        ],
      }
    }

    const violations = order.validateBeforeApprove()
    if (violations.length > 0) {
      const error: DefectiveReworkOrderApprovalError = {
        code: 'APPROVE_PRECONDITION_FAILED',
        message: violations.map((v) => v.message).join('；'),
        violations,
      }
      return {
        ok: false,
        order,
        error,
        events: [
          {
            type: 'DEFECTIVE_REWORK_ORDER_APPROVAL_REJECTED',
            orderId: order.id,
            reason: error.message,
          },
        ],
      }
    }

    const approved = order.withStatus(order.status.with(ReworkOrderStatusFlag.Approved))
    return {
      ok: true,
      order: approved,
      events: [{ type: 'DEFECTIVE_REWORK_ORDER_APPROVED', orderId: order.id }],
    }
  }

  /**
   *
   * 反审批：将已审批状态转换为未审批状态。
   * @remarks
   * 规则：\\n
   * 1) 必须已审批；\\n
   * 2) 单据不可处于锁定态（冻结/结案/作废）。\\n
   * @param order 返工单聚合根。
   * @returns 反审批结果（成功返回新聚合，失败返回原聚合）。
   *
   */
  public static unapprove(order: DefectiveReworkOrder): DefectiveReworkOrderApprovalResult {
    if (order.status.isLocked()) {
      const error: DefectiveReworkOrderApprovalError = {
        code: 'ORDER_LOCKED',
        message: '当前单据已冻结/结案/作废，无法反审批',
      }
      return {
        ok: false,
        order,
        error,
        events: [
          {
            type: 'DEFECTIVE_REWORK_ORDER_UNAPPROVAL_REJECTED',
            orderId: order.id,
            reason: error.message,
          },
        ],
      }
    }

    if (!order.status.isApproved()) {
      const error: DefectiveReworkOrderApprovalError = {
        code: 'NOT_APPROVED',
        message: '当前单据未审批，无法反审批',
      }
      return {
        ok: false,
        order,
        error,
        events: [
          {
            type: 'DEFECTIVE_REWORK_ORDER_UNAPPROVAL_REJECTED',
            orderId: order.id,
            reason: error.message,
          },
        ],
      }
    }

    const unapproved = order.withStatus(order.status.without(ReworkOrderStatusFlag.Approved))
    return {
      ok: true,
      order: unapproved,
      events: [{ type: 'DEFECTIVE_REWORK_ORDER_UNAPPROVED', orderId: order.id }],
    }
  }
}

