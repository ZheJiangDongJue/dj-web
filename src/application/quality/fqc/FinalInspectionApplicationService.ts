import { BillApi, type UserInfo } from '@/lib/erp/bill-api'
import { DEFAULT_DB_NAME } from '@/lib/config'
import {
  type FlowDetailCandidate,
} from '@/application/quality/shared/flowDetailCandidates'
import { CreateFinalInspectionByAssemblyFlowDetail, CreateFinalInspectionByProduceFlowDetail } from '@/lib/erp/craft-api'
import { FlowScanDocumentKind, FlowScanSourceType } from '@/lib/erp/flow-scan-api'
import { QualityApi } from '@/lib/erp/quality-api'
import {
  type FinalInspection,
  type FinalInspectionRepository,
  type FinalInspectionFindConditions,
} from '@/domain/quality/fqc/repositories/FinalInspectionRepository'
import { FinalInspectionMapper } from '@/infrastructure/repositories/quality/mappers/finalInspectionMapper'
import { BillApprovalService } from '@/application/quality/shared/BillApprovalService'
import {
  ScanDocumentFlow,
  type ScanDocumentFlowResult,
  type ScanSourceConfig,
} from '@/application/quality/shared/ScanDocumentFlow'
import { extractErrorMessage, normalizePositiveInt, pickBillId } from '@/application/quality/shared/billCommon'
import { pickDocumentAndDetails } from '@/application/quality/shared/apiMessagePack'
import { validateApproveStatus, validateUnapproveStatus } from '@/application/quality/shared/documentStatus'
import {
  FinalInspectionDocument,
  FinalInspectionDetail,
} from '@/types/erp-db.generated'
import { getErpUserFromStorage } from '@/app/features/erp/quality/shared/helpers'

/**
 *
 * 扫码执行结果类型。
 *
 */
export type FinalInspectionScanResult =
 | { readonly type: 'OPEN_BY_ID'; readonly id: number }
 | { readonly type: 'SET_INSPECTOR'; readonly code: string }
 | {
 readonly type: 'NEED_PICK_FLOW_DETAIL'
 readonly scanCode: string
 readonly candidates: FlowDetailCandidate[]
 }
 | {
 readonly type: 'DRAFT_LOADED'
 readonly document: FinalInspectionDocument | null
 readonly details: FinalInspectionDetail[]
 readonly message?: string
 }
 | { readonly type: 'ERROR'; readonly level: 'warning' | 'error'; readonly message: string }

/**
 *
 * 保存用例的返回结果。
 *
 */
export type FinalInspectionSaveResult = {

  readonly id: number | null
  /**
   *
   * 持久化后的聚合根（可选）。
   *
   */
  readonly aggregate?: FinalInspection | null
  /**
   *
   * 失败提示。
   *
   */
  readonly message?: string
}

/**
 *
 * 审批/反审批用例返回结果。
 *
 */
export type FinalInspectionActionResult = {

  readonly success: boolean
  /**
   *
   * 提示信息。
   *
   */
  readonly message: string
  /**
   *
   * 审批成功且存在 NG 数量时提示 NCR 引导。
   *
   */
  readonly ncrHint?: boolean
}

/**
 *
 * 查询结果结构。
 *
 */
export type FinalInspectionBillWithDetails = {

  readonly document: FinalInspectionDocument | null
  /**
   *
   * 明细列表。
   *
   */
  readonly details: FinalInspectionDetail[]
  /**
   *
   * 聚合根（可选）。
   *
   */
  readonly aggregate?: FinalInspection | null
}

const TABLE_NAME = 'FinalInspectionDocument' as const

/**
 *
 * 末道检验应用服务（用例编排 + 事务封装）。
 *
 */
export class FinalInspectionApplicationService {
  public constructor(private readonly repository: FinalInspectionRepository) {}

  private readonly approvalService = new BillApprovalService({
    tableName: TABLE_NAME,
    getUser: () => this.getUser(),
  })

  private readonly scanFlow = new ScanDocumentFlow<FinalInspectionDocument, FinalInspectionDetail>({
    documentKind: FlowScanDocumentKind.FinalInspection,
    targetDocumentTableName: TABLE_NAME,
    getUser: () => this.getUser(),
    createDraft: ({ user, flowDetailTableName, flowDetailId }) => {
      const table = String(flowDetailTableName ?? '').trim()
      if (table.includes('ProcessAssembly')) {
        return CreateFinalInspectionByAssemblyFlowDetail<FinalInspectionDocument, FinalInspectionDetail>({
          dbName: DEFAULT_DB_NAME,
          user,
          detailid: flowDetailId,
        })
      }
      if (table.includes('Produce')) {
        return CreateFinalInspectionByProduceFlowDetail<FinalInspectionDocument, FinalInspectionDetail>({
          dbName: DEFAULT_DB_NAME,
          user,
          detailid: flowDetailId,
        })
      }
      return Promise.resolve({ success: false, message: '不支持的流程卡明细类型' } as any)
    },
    draftStrategy: { mode: 'document-and-details' },
    messages: {
      queryFailed: '查询流程卡工序明细失败',
      noFlowDetail: '未找到可检验工序或无需末道检验',
      createFailed: '生成草稿失败',
      scanFailed: '扫码处理失败',
      invalidCreatedId: '后端返回单据ID异常，无法打开',
      invalidFlowDetail: '工序明细参数不合法',
    },
    levels: {
      noFlowDetail: 'warning',
      createFailed: 'warning',
    },
  })

  public async fetchById(id: number): Promise<FinalInspectionBillWithDetails> {
    const billId = normalizePositiveInt(id)
    if (!billId) return { document: null, details: [], aggregate: null }

    const aggregate = await this.repository.findById(billId)
    if (!aggregate) return { document: null, details: [], aggregate: null }

    const persistence = FinalInspectionMapper.toPersistence(aggregate)
    return { document: persistence.document, details: persistence.details, aggregate }
  }

  public async findByConditions(conditions: FinalInspectionFindConditions): Promise<FinalInspectionBillWithDetails[]> {
    const list = await this.repository.findByConditions(conditions)
    return list.map((aggregate) => {
      const persistence = FinalInspectionMapper.toPersistence(aggregate)
      return { document: persistence.document, details: persistence.details, aggregate }
    })
  }

  public async save(input: {
    readonly bill: FinalInspectionDocument
    readonly details: FinalInspectionDetail[]
  }): Promise<FinalInspectionSaveResult> {
    try {
      const aggregate = FinalInspectionMapper.toDomain({
        document: input.bill as any,
        details: input.details as any,
        fallbackId: pickBillId(input.bill),
      })
      if (!aggregate) return { id: null, aggregate: null, message: '无法解析末道检验数据' }

      const saved = await this.repository.save(aggregate)
      return { id: saved.id, aggregate: saved }
    } catch (error) {
      const message = extractErrorMessage(error) || '保存失败'
      return { id: null, aggregate: null, message }
    }
  }

  public async approve(
    id: number,
    snapshot?: { readonly bill: FinalInspectionDocument; readonly details: FinalInspectionDetail[] },
  ): Promise<FinalInspectionActionResult> {
    const billId = normalizePositiveInt(id)
    if (!billId) return { success: false, message: '审批前请先保存单据' }

    const aggregate = snapshot
      ? FinalInspectionMapper.toDomain({ document: snapshot.bill as any, details: snapshot.details as any, fallbackId: billId })
      : await this.repository.findById(billId)

    if (aggregate) {
      const validation = validateApproveStatus(aggregate.status, billId)
      if (!validation.ok) return { success: false, message: validation.message }
      if (!normalizePositiveInt(aggregate.id)) return { success: false, message: '审批前请先保存单据' }
    }

    const { success, message } = await this.approvalService.approve(billId)
    const ncrHint = aggregate
      ? aggregate.quantitySplit.ngQuantity > 0 || aggregate.details.some((d) => d.result.value === 4)
      : false
    return { success, message, ncrHint: success ? ncrHint : undefined }
  }

  public async unapprove(
    id: number,
    snapshot?: { readonly bill: FinalInspectionDocument; readonly details: FinalInspectionDetail[] },
  ): Promise<FinalInspectionActionResult> {
    const billId = normalizePositiveInt(id)
    if (!billId) return { success: false, message: '单据ID不合法' }

    const aggregate = snapshot
      ? FinalInspectionMapper.toDomain({ document: snapshot.bill as any, details: snapshot.details as any, fallbackId: billId })
      : await this.repository.findById(billId)

    if (aggregate) {
      const validation = validateUnapproveStatus(aggregate.status)
      if (!validation.ok) return { success: false, message: validation.message }
    }

    const { success, message } = await this.approvalService.unapprove(billId)
    return { success, message }
  }

  public async delete(id: number): Promise<FinalInspectionActionResult> {
    const billId = normalizePositiveInt(id)
    if (!billId) return { success: false, message: '单据ID不合法' }
    try {
      const res = await this.repository.delete(billId)
      return { success: !!res?.success, message: res?.message ?? '' }
    } catch (error) {
      const message = extractErrorMessage(error) || '删除失败'
      return { success: false, message }
    }
  }

  public async createDraftByDailyPlanDetailId(dailyPlanDetailId: number): Promise<FinalInspectionScanResult> {
    const id = normalizePositiveInt(dailyPlanDetailId)
    if (!id) return { type: 'ERROR', level: 'error', message: '日计划明细无效' }

    const user = this.getUser()
    const [packAssembly, packProduce] = await Promise.all([
      QualityApi.CreateFinalInspectionByDailyPlanAssembly<FinalInspectionDocument, FinalInspectionDetail>({ user, dailyPlanDetailId: id }),
      QualityApi.CreateFinalInspectionByDailyPlanProduce<FinalInspectionDocument, FinalInspectionDetail>({ user, dailyPlanDetailId: id }),
    ])

    const pickAssembly = pickDocumentAndDetails<FinalInspectionDocument, FinalInspectionDetail>(packAssembly)
    const pickProduce = pickDocumentAndDetails<FinalInspectionDocument, FinalInspectionDetail>(packProduce)
    const picked = pickAssembly ?? pickProduce
    if (!picked) {
      return { type: 'ERROR', level: 'warning', message: '未找到可检验工序或无需末道检验' }
    }
    return { type: 'DRAFT_LOADED', ...picked }
  }

  public async executeScan(text: string): Promise<FinalInspectionScanResult> {
    const raw = String(text ?? '').trim()
    if (!raw) return { type: 'ERROR', level: 'warning', message: '扫描内容为空' }

    try {
      const idMatch = raw.match(/^(?:id\s*[:：]\s*)?(\d+)$/i)
      if (idMatch) {
        const id = normalizePositiveInt(idMatch[1])
        if (id) return { type: 'OPEN_BY_ID', id }
        return { type: 'ERROR', level: 'error', message: '单据ID不合法' }
      }

      if (raw.toUpperCase().includes('ZY-')) {
        return { type: 'SET_INSPECTOR', code: raw }
      }

      if (/^JCJH/i.test(raw)) {
        return this.executeExtrusionPlanScanCreate(raw)
      }

      if (/^RJH/i.test(raw)) {
        return this.executeDailyPlanScanCreate(raw)
      }

      if (/^(?:FGD|ZZGXJSFGD|ZZGXWCFGD)/i.test(raw)) {
        return this.executeDefectiveReworkOrderScanCreate(raw)
      }

      const fallback = await this.tryCreateDraftFromGenericScan(raw)
      if (fallback) return fallback

      return { type: 'ERROR', level: 'warning', message: '暂不支持该条码' }
    } catch (error) {
      const message = extractErrorMessage(error) || '扫码处理失败'
      return { type: 'ERROR', level: 'error', message }
    }
  }

  public async executeExtrusionPlanScanCreate(
    scanForCode: string,
    options?: { readonly pickedFlowDetail?: { tableName: string; id: number } | null },
  ): Promise<FinalInspectionScanResult> {
    const source: ScanSourceConfig = {
      sourceType: FlowScanSourceType.ExtrusionPlanDetail,
      normalizeCode: (raw) => raw.match(/JCJH-\d{12}/i)?.[0] ?? raw,
      logTag: '[FQC]',
    }
    return this.toScanResult(
      await this.scanFlow.run({ scanForCode, source, pickedFlowDetail: options?.pickedFlowDetail }),
    )
  }

  public async executeDailyPlanScanCreate(
    scanForCode: string,
    options?: { readonly pickedFlowDetail?: { tableName: string; id: number } | null },
  ): Promise<FinalInspectionScanResult> {
    const source: ScanSourceConfig = {
      sourceType: FlowScanSourceType.DailyPlanDetail,
      logTag: '[FQC]',
    }
    return this.toScanResult(
      await this.scanFlow.run({ scanForCode, source, pickedFlowDetail: options?.pickedFlowDetail }),
    )
  }

  public async executeDefectiveReworkOrderScanCreate(
    scanForCode: string,
    options?: { readonly pickedFlowDetail?: { tableName: string; id: number } | null },
  ): Promise<FinalInspectionScanResult> {
    const source: ScanSourceConfig = {
      sourceType: FlowScanSourceType.DefectiveReworkOrderDocument,
      normalizeCode: (raw) => raw.match(/FGD-\d{12}/i)?.[0] ?? raw,
      logTag: '[FQC]',
    }
    return this.toScanResult(
      await this.scanFlow.run({ scanForCode, source, pickedFlowDetail: options?.pickedFlowDetail }),
    )
  }

  private async tryCreateDraftFromGenericScan(scanCode: string): Promise<FinalInspectionScanResult | null> {
    const user = this.getUser()
    const packA = await QualityApi.GetAssemblyFlowWithFinalInspectionByDailyPlanScanCode<FinalInspectionDocument, FinalInspectionDetail>(
      DEFAULT_DB_NAME,
      scanCode,
      user,
    )
    const pickedA = pickDocumentAndDetails<FinalInspectionDocument, FinalInspectionDetail>(packA)
    if (pickedA) return { type: 'DRAFT_LOADED', ...pickedA }

    const packB = await QualityApi.GetProduceFlowWithFinalInspectionByExtrusionPlanScanCode<FinalInspectionDocument, FinalInspectionDetail>(
      DEFAULT_DB_NAME,
      scanCode,
      user,
    )
    const pickedB = pickDocumentAndDetails<FinalInspectionDocument, FinalInspectionDetail>(packB)
    return pickedB ? { type: 'DRAFT_LOADED', ...pickedB } : null
  }

  private toScanResult(
    r: ScanDocumentFlowResult<FinalInspectionDocument, FinalInspectionDetail>,
  ): FinalInspectionScanResult {
    if (r.type === 'CREATED_BY_ID') {
      return { type: 'ERROR', level: 'error', message: '末道检验不应返回 CREATED_BY_ID' }
    }
    return r
  }

  private getUser(): UserInfo {
    return getErpUserFromStorage()
  }
}
