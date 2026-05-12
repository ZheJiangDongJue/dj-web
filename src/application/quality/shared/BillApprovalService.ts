import { BillApi, type UserInfo } from '@/lib/erp/bill-api'
import { parseApprovalResponse } from '@/application/quality/shared/apiMessagePack'
import { extractErrorMessage } from '@/application/quality/shared/billCommon'

/**
 *
 * 通用单据审批服务配置。
 *
 */
export type BillApprovalConfig = {
  /** 单据表名。 */
  readonly tableName: string
  /** 用户信息获取器。 */
  readonly getUser: () => UserInfo
  /** 是否启用后端新审批框架（默认 false，与现有质量模块保持一致）。 */
  readonly useNewFramework?: boolean
}

/**
 *
 * 通用审批/反审批服务。
 * @remarks
 * - 统一封装 `BillApi.GeneralBillApproval` 的调用参数与返回解析；
 * - 不向外抛异常，统一返回 `{ success, message }`。
 *
 */
export class BillApprovalService {
  public constructor(private readonly config: BillApprovalConfig) {}

  /**
   *
   * 审批。
   * @param billId 单据主键。
   *
   */
  public async approve(billId: number): Promise<{ readonly success: boolean; readonly message: string }> {
    return this.executeApproval(billId, true)
  }

  /**
   *
   * 反审批。
   * @param billId 单据主键。
   *
   */
  public async unapprove(billId: number): Promise<{ readonly success: boolean; readonly message: string }> {
    return this.executeApproval(billId, false)
  }

  private async executeApproval(
    billId: number,
    isApprove: boolean,
  ): Promise<{ readonly success: boolean; readonly message: string }> {
    try {
      const res = await BillApi.GeneralBillApproval({
        tableName: this.config.tableName,
        user: this.config.getUser(),
        billId,
        isApprove,
        useNewFramework: this.config.useNewFramework ?? false,
      })
      return parseApprovalResponse(res)
    } catch (error) {
      const fallback = isApprove ? '审批失败' : '反审批失败'
      return { success: false, message: extractErrorMessage(error) || fallback }
    }
  }
}

