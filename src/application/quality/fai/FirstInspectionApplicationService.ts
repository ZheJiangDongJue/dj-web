import { BillApi, type UserInfo } from '@/lib/erp/bill-api'
import { DEFAULT_DB_NAME } from '@/lib/config'
import {
  type FlowDetailCandidate,
} from '@/application/quality/shared/flowDetailCandidates'
import { CreateFirstInspectionByAssemblyFlowDetail, CreateFirstInspectionByProduceFlowDetail } from '@/lib/erp/craft-api'
import { FlowScanDocumentKind, FlowScanSourceType } from '@/lib/erp/flow-scan-api'
import { QualityApi } from '@/lib/erp/quality-api'
import {
  type FirstInspection,
  type FirstInspectionRepository,
  type FirstInspectionFindConditions,
} from '@/domain/quality/fai/repositories/FirstInspectionRepository'
import { FirstInspectionMapper } from '@/infrastructure/repositories/quality/mappers/firstInspectionMapper'
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
  FirstInspectionDocument,
  FirstInspectionDetail,
  CheckResult,
} from '@/types/erp-db.generated'
import { getErpUserFromStorage } from '@/app/features/erp/quality/shared/helpers'

/**
 *
 * 扫码执行结果类型。
 *
 */
export type FirstInspectionScanResult =
 | { readonly type: 'OPEN_BY_ID'; readonly id: number }
 | { readonly type: 'SET_INSPECTOR'; readonly code: string }
 | {
 readonly type: 'NEED_PICK_FLOW_DETAIL'
 readonly scanCode: string
 readonly candidates: FlowDetailCandidate[]
 }
 | {
 readonly type: 'DRAFT_LOADED'
 readonly document: FirstInspectionDocument | null
 readonly details: FirstInspectionDetail[]
 readonly message?: string
 }
 | { readonly type: 'ERROR'; readonly level: 'warning' | 'error'; readonly message: string }

/**
 *
 * 保存用例的返回结果。
 *
 */
export type FirstInspectionSaveResult = {

  readonly id: number | null
  /**
   *
   * 持久化后的聚合根（可选）。
   *
   */
  readonly aggregate?: FirstInspection | null
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
export type FirstInspectionActionResult = {

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
export type FirstInspectionBillWithDetails = {

  readonly document: FirstInspectionDocument | null
  /**
   *
   * 明细列表。
   *
   */
  readonly details: FirstInspectionDetail[]
  /**
   *
   * 聚合根（可选）。
   *
   */
  readonly aggregate?: FirstInspection | null
}

const TABLE_NAME = 'FirstInspectionDocument' as const

/**
 *
 * 首件检验应用服务（用例编排 + 事务封装）。
 * @remarks
 * - 应用层仅负责流程编排与结果结构化；
 * - 状态校验、审批调用、扫码流程均复用 shared 层；
 * - 对外返回契约保持不变，避免影响 ViewModel。
 *
 */
export class FirstInspectionApplicationService {
  public constructor(private readonly repository: FirstInspectionRepository) {}

  /**
   *
   * 通用审批服务。
   *
   */
  private readonly approvalService = new BillApprovalService({
    tableName: TABLE_NAME,
    getUser: () => this.getUser(),
  })

  /**
   *
   * 通用扫码流程编排器。
   *
   */
  private readonly scanFlow = new ScanDocumentFlow<FirstInspectionDocument, FirstInspectionDetail>({
    documentKind: FlowScanDocumentKind.FirstInspection,
    targetDocumentTableName: TABLE_NAME,
    getUser: () => this.getUser(),
    createDraft: ({ user, flowDetailTableName, flowDetailId }) => {
      const table = String(flowDetailTableName ?? '').trim()
      if (table.includes('ProcessAssembly')) {
        return CreateFirstInspectionByAssemblyFlowDetail<FirstInspectionDocument, FirstInspectionDetail>({
          dbName: DEFAULT_DB_NAME,
          user,
          detailid: flowDetailId,
        })
      }
      if (table.includes('Produce')) {
        return CreateFirstInspectionByProduceFlowDetail<FirstInspectionDocument, FirstInspectionDetail>({
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
      noFlowDetail: '未找到可检验工序或无需首件检验',
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

  /**
   *
   * 按 Id 获取首件检验单据头与明细。
   * @param id 单据主键。
   * @returns 包含持久化模型与聚合根的结果。
   *
   */
  public async fetchById(id: number): Promise<FirstInspectionBillWithDetails> {
    const billId = normalizePositiveInt(id)
    if (!billId) return { document: null, details: [], aggregate: null }

    const pack = await BillApi.GetBillWithDetails<{ Document?: FirstInspectionDocument | null; Details?: FirstInspectionDetail[] }>({
      tableName: TABLE_NAME,
      billId,
    })
    const picked = pickDocumentAndDetails<FirstInspectionDocument, FirstInspectionDetail>(pack)
    const document = picked?.document ?? null
    const details = picked?.details ?? []

    const aggregate =
      document || details.length > 0
        ? FirstInspectionMapper.toDomain({ document: document as any, details: details as any, fallbackId: billId })
        : null

    return { document, details, aggregate }
  }

  /**
   *
   * 按条件查询首件检验列表。
   * @param conditions 查询条件。
   * @returns 单据列表（含聚合根）。
   *
   */
  public async findByConditions(conditions: FirstInspectionFindConditions): Promise<FirstInspectionBillWithDetails[]> {
    const list = await this.repository.findByConditions(conditions)
    return list.map((aggregate) => {
      const persistence = FirstInspectionMapper.toPersistence(aggregate)
      return { document: persistence.document, details: persistence.details, aggregate }
    })
  }

  /**
   *
   * 保存首件检验单据。
   * @param input 表头与明细。
   * @returns 保存结果。
   *
   */
  public async save(input: {
    readonly bill: FirstInspectionDocument
    readonly details: FirstInspectionDetail[]
  }): Promise<FirstInspectionSaveResult> {
    try {
      const aggregate = FirstInspectionMapper.toDomain({
        document: input.bill as any,
        details: input.details as any,
        fallbackId: pickBillId(input.bill),
      })
      if (!aggregate) return { id: null, aggregate: null, message: '无法解析首件检验数据' }

      const saved = await this.repository.save(aggregate)
      return { id: saved.id, aggregate: saved }
    } catch (error) {
      const message = extractErrorMessage(error) || '保存失败'
      return { id: null, aggregate: null, message }
    }
  }

  /**
   *
   * 审批首件检验。
   * @param id 单据主键。
   * @param snapshot 可选：当前编辑快照，用于快速校验。
   * @returns 审批结果。
   *
   */
  public async approve(
    id: number,
    snapshot?: { readonly bill: FirstInspectionDocument; readonly details: FirstInspectionDetail[] },
  ): Promise<FirstInspectionActionResult> {
    const billId = normalizePositiveInt(id)
    if (!billId) return { success: false, message: '审批前请先保存单据' }

    const aggregate = snapshot
      ? FirstInspectionMapper.toDomain({ document: snapshot.bill as any, details: snapshot.details as any, fallbackId: billId })
      : await this.repository.findById(billId)

    if (aggregate) {
      const validation = validateApproveStatus(aggregate.status, billId)
      if (!validation.ok) return { success: false, message: validation.message }
      if (!normalizePositiveInt(aggregate.id)) return { success: false, message: '审批前请先保存单据' }
    }

    const { success, message } = await this.approvalService.approve(billId)
    const ncrHint = aggregate
      ? aggregate.quantitySplit.ngQuantity > 0 || aggregate.details.some((d) => d.result.value === CheckResult.不合格)
      : false
    return { success, message, ncrHint: success ? ncrHint : undefined }
  }

  /**
   *
   * 反审批首件检验。
   * @param id 单据主键。
   * @param snapshot 可选：当前编辑快照，用于快速校验。
   * @returns 反审批结果。
   *
   */
  public async unapprove(
    id: number,
    snapshot?: { readonly bill: FirstInspectionDocument; readonly details: FirstInspectionDetail[] },
  ): Promise<FirstInspectionActionResult> {
    const billId = normalizePositiveInt(id)
    if (!billId) return { success: false, message: '单据ID不合法' }

    const aggregate = snapshot
      ? FirstInspectionMapper.toDomain({ document: snapshot.bill as any, details: snapshot.details as any, fallbackId: billId })
      : await this.repository.findById(billId)

    if (aggregate) {
      const validation = validateUnapproveStatus(aggregate.status)
      if (!validation.ok) return { success: false, message: validation.message }
    }

    const { success, message } = await this.approvalService.unapprove(billId)
    return { success, message }
  }

  /**
   *
   * 删除首件检验。
   * @param id 单据主键。
   * @returns 删除结果。
   *
   */
  public async delete(id: number): Promise<FirstInspectionActionResult> {
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

  /**
   *
   * 按日计划明细 ID 生成或打开首件检验草稿。
   * @param dailyPlanDetailId 日计划明细主键。
   * @returns 草稿结果。
   *
   */
  public async createDraftByDailyPlanDetailId(dailyPlanDetailId: number): Promise<FirstInspectionScanResult> {
    const id = normalizePositiveInt(dailyPlanDetailId)
    if (!id) return { type: 'ERROR', level: 'error', message: '日计划明细无效' }

    const user = this.getUser()
    const [packAssembly, packProduce] = await Promise.all([
      QualityApi.CreateFirstInspectionByDailyPlanAssembly<FirstInspectionDocument, FirstInspectionDetail>({ user, dailyPlanDetailId: id }),
      QualityApi.CreateFirstInspectionByDailyPlanProduce<FirstInspectionDocument, FirstInspectionDetail>({ user, dailyPlanDetailId: id }),
    ])

    const pickAssembly = pickDocumentAndDetails<FirstInspectionDocument, FirstInspectionDetail>(packAssembly)
    const pickProduce = pickDocumentAndDetails<FirstInspectionDocument, FirstInspectionDetail>(packProduce)
    const picked = pickAssembly ?? pickProduce
    if (!picked) {
      return { type: 'ERROR', level: 'warning', message: '未找到可检验工序或无需首件检验' }
    }
    return { type: 'DRAFT_LOADED', ...picked }
  }

  /**
   *
   * 按扫码执行用例：分流“打开/设置检验员/生成草稿”。
   * @param text 扫码内容。
   * @returns 结构化结果。
   *
   */
  public async executeScan(text: string): Promise<FirstInspectionScanResult> {
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

      if (/^FGD/i.test(raw)) {
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

  /**
   *
   * 挤出计划扫码（JCJH-*）。
   *
   */
  public async executeExtrusionPlanScanCreate(
    scanForCode: string,
    options?: { readonly pickedFlowDetail?: { tableName: string; id: number } | null },
  ): Promise<FirstInspectionScanResult> {
    const source: ScanSourceConfig = {
      sourceType: FlowScanSourceType.ExtrusionPlanDetail,
      normalizeCode: (raw) => raw.match(/JCJH-\d{12}/i)?.[0] ?? raw,
      logTag: '[FAI]',
    }
    return this.toScanResult(
      await this.scanFlow.run({ scanForCode, source, pickedFlowDetail: options?.pickedFlowDetail }),
    )
  }

  /**
   *
   * 日计划扫码（RJH-*）。
   *
   */
  public async executeDailyPlanScanCreate(
    scanForCode: string,
    options?: { readonly pickedFlowDetail?: { tableName: string; id: number } | null },
  ): Promise<FirstInspectionScanResult> {
    const source: ScanSourceConfig = {
      sourceType: FlowScanSourceType.DailyPlanDetail,
      logTag: '[FAI]',
    }
    return this.toScanResult(
      await this.scanFlow.run({ scanForCode, source, pickedFlowDetail: options?.pickedFlowDetail }),
    )
  }

  /**
   *
   * 返工单扫码（FGD-*）。
   *
   */
  public async executeDefectiveReworkOrderScanCreate(
    scanForCode: string,
    options?: { readonly pickedFlowDetail?: { tableName: string; id: number } | null },
  ): Promise<FirstInspectionScanResult> {
    const source: ScanSourceConfig = {
      sourceType: FlowScanSourceType.DefectiveReworkOrderDocument,
      normalizeCode: (raw) => raw.match(/FGD-\d{12}/i)?.[0] ?? raw,
      logTag: '[FAI]',
    }
    return this.toScanResult(
      await this.scanFlow.run({ scanForCode, source, pickedFlowDetail: options?.pickedFlowDetail }),
    )
  }

  /**
   *
   * 兜底：尝试通用生产/装配条码生成草稿。
   * @param scanCode 扫码内容。
   * @returns 草稿结果或 null。
   *
   */
  private async tryCreateDraftFromGenericScan(scanCode: string): Promise<FirstInspectionScanResult | null> {
    const user = this.getUser()
    const packA = await QualityApi.GetAssemblyFlowWithFirstInspectionByDailyPlanScanCode<FirstInspectionDocument, FirstInspectionDetail>(
      DEFAULT_DB_NAME,
      scanCode,
      user,
    )
    const pickedA = pickDocumentAndDetails<FirstInspectionDocument, FirstInspectionDetail>(packA)
    if (pickedA) return { type: 'DRAFT_LOADED', ...pickedA }

    const packB = await QualityApi.GetProduceFlowWithFirstInspectionByExtrusionPlanScanCode<FirstInspectionDocument, FirstInspectionDetail>(
      DEFAULT_DB_NAME,
      scanCode,
      user,
    )
    const pickedB = pickDocumentAndDetails<FirstInspectionDocument, FirstInspectionDetail>(packB)
    return pickedB ? { type: 'DRAFT_LOADED', ...pickedB } : null
  }

  /**
   *
   * 将通用扫码结果映射为 FAI 对外返回类型。
   *
   */
  private toScanResult(
    r: ScanDocumentFlowResult<FirstInspectionDocument, FirstInspectionDetail>,
  ): FirstInspectionScanResult {
    if (r.type === 'CREATED_BY_ID') {
      return { type: 'ERROR', level: 'error', message: '首件检验不应返回 CREATED_BY_ID' }
    }
    return r
  }

  /**
   *
   * 统一获取 ERP 用户信息。
   *
   */
  private getUser(): UserInfo {
    return getErpUserFromStorage()
  }
}
