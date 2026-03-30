import { DocumentBase } from '@/app/features/erp/shared/DocumentBase'

/**
 *
 * 质量域的文档服务契约。
 * - 与通用 DocumentService 的差异仅在 save 的形参命名（bill vs document）。
 *
 */
export interface QualityDocumentService<TBill, TDetail> {
  save: (payload: { bill: TBill; details: TDetail[] }) => Promise<any>
  approve: (id: number) => Promise<{ success?: boolean; message?: string; code?: string }>
  unapprove: (id: number) => Promise<{ success?: boolean; message?: string; code?: string }>
  remove?: (id: number) => Promise<{ success?: boolean; message?: string; code?: string }>
  fetchById?: (id: number) => Promise<{ document?: TBill | null; details?: TDetail[] | null }>
  extractId: (result: any) => number | null | undefined
}

/**
 *
 * 质量域 DocumentBase：在通用 DocumentBase 之上保留扩展点。
 * 目前暂不改变父类行为，仅作为质量域后续扩展的挂载位置。
 *
 */
export class QualityDocumentBase<TBill, TDetail> extends DocumentBase<TBill, TDetail> {
  /**
   *
   * 质量域审批流程：预留可插入质量域特有校验。
   *
   */
  public override async handleApprove(): Promise<boolean> {
    return super.handleApprove()
  }
}
