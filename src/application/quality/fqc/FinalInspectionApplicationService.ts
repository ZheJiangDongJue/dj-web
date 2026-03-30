import { BillApi, type ApiMessagePack, type UserInfo } from '@/lib/erp/bill-api'
import { DEFAULT_DB_NAME } from '@/lib/config'
import {
  enrichFlowDetailCandidates,
  pickUnapprovedDocumentIdAcrossFlowDetails,
  parseFlowDetailsFromCheckDocumentStateData,
  type FlowDetailCandidate,
} from '@/application/quality/shared/flowDetailCandidates'
import { CreateFinalInspectionByAssemblyFlowDetail, CreateFinalInspectionByProduceFlowDetail } from '@/lib/erp/craft-api'
import { FlowScanApi, FlowScanCheckState, FlowScanDocumentKind, FlowScanSourceType } from '@/lib/erp/flow-scan-api'
import { QualityApi } from '@/lib/erp/quality-api'
import {
  type FinalInspection,
  type FinalInspectionRepository,
  type FinalInspectionFindConditions,
} from '@/domain/quality/fqc/repositories/FinalInspectionRepository'
import { FinalInspectionMapper } from '@/infrastructure/repositories/quality/mappers/finalInspectionMapper'
import {
  FinalInspectionDocument,
  FinalInspectionDetail,
  DocumentStatus,
  CheckResult,
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
 * @remarks
 * - 参考 NCR 应用服务模式：应用层负责编排与错误封装，领域/基础设施负责模型与持久化；<br/>
 * - 与 UI 解耦：不直接触发 toast，仅返回结构化结果供上层决定提示；<br/>
 * - 事务边界：保存/审批/反审批均通过单次后端调用保证原子性。
 *
 */
 export class FinalInspectionApplicationService {

/**
 *
 * 构造函数。
 * @param repository 末道检验仓储实现。
 *
 */
  public constructor(private readonly repository: FinalInspectionRepository) {}

  /**
   *
   * 按 Id 获取末道检验单据头与明细。
   * @param id 单据主键。
   * @returns 包含持久化模型与聚合根的结果。
   *
   */
  public async fetchById(id: number): Promise<FinalInspectionBillWithDetails> {
    const billId = this.normalizePositiveInt(id)
    if (!billId) return { document: null, details: [], aggregate: null }

    const aggregate = await this.repository.findById(billId)
    if (!aggregate) return { document: null, details: [], aggregate: null }

    const persistence = FinalInspectionMapper.toPersistence(aggregate)
    return { document: persistence.document, details: persistence.details, aggregate }
  }

  /**
   *
   * 按条件查询末道检验列表。
   * @param conditions 查询条件。
   * @returns 单据列表（含聚合根）。
   *
   */
  public async findByConditions(conditions: FinalInspectionFindConditions): Promise<FinalInspectionBillWithDetails[]> {
    const list = await this.repository.findByConditions(conditions)
    return list.map((aggregate) => {
      const persistence = FinalInspectionMapper.toPersistence(aggregate)
      return { document: persistence.document, details: persistence.details, aggregate }
    })
  }

  /**
   *
   * 保存末道检验单据。
   * @param input 表头与明细。
   * @returns 保存结果。
   *
   */
  public async save(input: {
    readonly bill: FinalInspectionDocument
    readonly details: FinalInspectionDetail[]
  }): Promise<FinalInspectionSaveResult> {
    try {
      const aggregate = FinalInspectionMapper.toDomain({
        document: input.bill as any,
        details: input.details as any,
        fallbackId: this.pickBillId(input.bill),
      })
      if (!aggregate) return { id: null, aggregate: null, message: '无法解析末道检验数据' }

      const saved = await this.repository.save(aggregate)
      return { id: saved.id, aggregate: saved }
    } catch (error) {
      const message = this.extractErrorMessage(error) || '保存失败'
      return { id: null, aggregate: null, message }
    }
  }

  /**
   *
   * 审批末道检验。
   * @param id 单据主键。
   * @param snapshot 可选：当前编辑快照，用于快速校验。
   * @returns 审批结果。
   *
   */
  public async approve(
    id: number,
    snapshot?: { readonly bill: FinalInspectionDocument; readonly details: FinalInspectionDetail[] },
  ): Promise<FinalInspectionActionResult> {
    const billId = this.normalizePositiveInt(id)
    if (!billId) return { success: false, message: '审批前请先保存单据' }

    const aggregate = snapshot
      ? FinalInspectionMapper.toDomain({ document: snapshot.bill as any, details: snapshot.details as any, fallbackId: billId })
      : await this.repository.findById(billId)

    const validation = aggregate ? this.validateApprove(aggregate) : { ok: true as const, ncrHint: false }
    if (!validation.ok) return { success: false, message: validation.message }

    const res = (await BillApi.GeneralBillApproval({
      tableName: TABLE_NAME,
      user: this.getUser(),
      billId,
      isApprove: true,
      useNewFramework: false,
    })) as ApiMessagePack

    const { success, message } = this.parseApprovalResponse(res)
    return { success, message, ncrHint: success ? validation.ncrHint : undefined }
  }

  /**
   *
   * 反审批末道检验。
   * @param id 单据主键。
   * @param snapshot 可选：当前编辑快照，用于快速校验。
   * @returns 反审批结果。
   *
   */
  public async unapprove(
    id: number,
    snapshot?: { readonly bill: FinalInspectionDocument; readonly details: FinalInspectionDetail[] },
  ): Promise<FinalInspectionActionResult> {
    const billId = this.normalizePositiveInt(id)
    if (!billId) return { success: false, message: '单据ID不合法' }

    const aggregate = snapshot
      ? FinalInspectionMapper.toDomain({ document: snapshot.bill as any, details: snapshot.details as any, fallbackId: billId })
      : await this.repository.findById(billId)

    const validation = aggregate ? this.validateUnapprove(aggregate) : { ok: true as const }
    if (!validation.ok) return { success: false, message: validation.message }

    const res = (await BillApi.GeneralBillApproval({
      tableName: TABLE_NAME,
      user: this.getUser(),
      billId,
      isApprove: false,
      useNewFramework: false,
    })) as ApiMessagePack

    const { success, message } = this.parseApprovalResponse(res)
    return { success, message }
  }

  /**
   *
   * 删除末道检验。
   * @param id 单据主键。
   * @returns 删除结果。
   *
   */
  public async delete(id: number): Promise<FinalInspectionActionResult> {
    const billId = this.normalizePositiveInt(id)
    if (!billId) return { success: false, message: '单据ID不合法' }
    try {
      const res = await this.repository.delete(billId)
      return { success: !!res?.success, message: res?.message ?? '' }
    } catch (error) {
      const message = this.extractErrorMessage(error) || '删除失败'
      return { success: false, message }
    }
  }

  /**
   *
   * 按日计划明细 ID 生成或打开末道检验草稿。
   * @param dailyPlanDetailId 日计划明细主键。
   * @returns 草稿结果。
   *
   */
  public async createDraftByDailyPlanDetailId(dailyPlanDetailId: number): Promise<FinalInspectionScanResult> {
    const id = this.normalizePositiveInt(dailyPlanDetailId)
    if (!id) return { type: 'ERROR', level: 'error', message: '日计划明细无效' }

    const user = this.getUser()
    const [packAssembly, packProduce] = await Promise.all([
      QualityApi.CreateFinalInspectionByDailyPlanAssembly<FinalInspectionDocument, FinalInspectionDetail>({ user, dailyPlanDetailId: id }),
      QualityApi.CreateFinalInspectionByDailyPlanProduce<FinalInspectionDocument, FinalInspectionDetail>({ user, dailyPlanDetailId: id }),
    ])

    const pickAssembly = this.pickDocumentAndDetails(packAssembly)
    const pickProduce = this.pickDocumentAndDetails(packProduce)
    const picked = pickAssembly ?? pickProduce
    if (!picked) {
      return { type: 'ERROR', level: 'warning', message: '未找到可检验工序或无需末道检验' }
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
  public async executeScan(text: string): Promise<FinalInspectionScanResult> {
    const raw = String(text ?? '').trim()
    if (!raw) return { type: 'ERROR', level: 'warning', message: '扫描内容为空' }

    try {
      const idMatch = raw.match(/^(?:id\s*[:：]\s*)?(\d+)$/i)
      if (idMatch) {
        const id = this.normalizePositiveInt(idMatch[1])
        if (id) return { type: 'OPEN_BY_ID', id }
        return { type: 'ERROR', level: 'error', message: '单据ID不合法' }
      }

      if (raw.toUpperCase().includes('ZY-')) {
        return { type: 'SET_INSPECTOR', code: raw }
      }

      if (/^JCJH/i.test(raw)) {
        return await this.executeExtrusionPlanScanCreate(raw)
      }

      if (/^RJH/i.test(raw)) {
        return await this.executeDailyPlanScanCreate(raw)
      }

      if (/^(?:FGD|ZZGXJSFGD|ZZGXWCFGD)/i.test(raw)) {
        return await this.executeDefectiveReworkOrderScanCreate(raw)
      }

      const fallback = await this.tryCreateDraftFromGenericScan(raw)
      if (fallback) return fallback

      return { type: 'ERROR', level: 'warning', message: '暂不支持该条码' }
    } catch (error) {
      const message = this.extractErrorMessage(error) || '扫码处理失败'
      return { type: 'ERROR', level: 'error', message }
    }
  }

  /**
   *
   * 用例：挤出计划扫码生成/打开末道检验草稿（JCJH-*，支持“多条当前工序明细”时先返回候选列表）。
   * @remarks
   * - 先调用 `FlowScanApi.CheckDocumentState` 查询“当前工序明细”；\n
   * - 若存在多条明细，则由调用方弹窗选择其一，再调用本方法传入 pickedFlowDetail；\n
   * - 选择后按明细入口（CraftApi）生成草稿，避免“多条当前工序”时后端自动选错。\n
   *
   */
  public async executeExtrusionPlanScanCreate(
    scanForCode: string,
    options?: { readonly pickedFlowDetail?: { tableName: string; id: number } | null },
  ): Promise<FinalInspectionScanResult> {
    const rawScan = String(scanForCode ?? '').trim()
    if (!rawScan) return { type: 'ERROR', level: 'warning', message: '扫描内容为空' }

    // 兼容：扫码内容包含额外前缀时，尝试提取标准 JCJH-xxxxxxxxxxxx
    const normalized = rawScan.match(/JCJH-\d{12}/i)?.[0] ?? rawScan

    const user = this.getUser()
    const picked = options?.pickedFlowDetail ?? null

    if (!picked) {
      try {
        const pack = await FlowScanApi.CheckDocumentState({
          dbName: DEFAULT_DB_NAME,
          user,
          sourceType: FlowScanSourceType.ExtrusionPlanDetail,
          scanForCode: normalized,
          sourceDetailId: 0,
          documentKind: FlowScanDocumentKind.FinalInspection,
          state: FlowScanCheckState.PrevCompletedCurrentUnfinished,
          includeTableRecords: true,
        })

        const ok = !!(pack as any)?.success
        const msg = String((pack as any)?.message ?? '').trim()
        if (!ok) {
          return { type: 'ERROR', level: 'error', message: msg || '查询流程卡工序明细失败' }
        }

        const data = ((pack as any)?.data ?? (pack as any)?.Data ?? null) as any
        const parsed = parseFlowDetailsFromCheckDocumentStateData(data)

        if (parsed.length === 0) return { type: 'ERROR', level: 'warning', message: msg || '未找到可检验工序或无需末道检验' }

        if (parsed.length > 1) {
          const unapprovedId = pickUnapprovedDocumentIdAcrossFlowDetails(data, parsed, TABLE_NAME)
          if (unapprovedId > 0) return { type: 'OPEN_BY_ID', id: unapprovedId }
          const candidates = await enrichFlowDetailCandidates(parsed)
          return { type: 'NEED_PICK_FLOW_DETAIL', scanCode: normalized, candidates }
        }

        const only = parsed[0]
        const unapprovedId = pickUnapprovedDocumentIdAcrossFlowDetails(data, [only], TABLE_NAME)
        if (unapprovedId > 0) return { type: 'OPEN_BY_ID', id: unapprovedId }

        const draftPack = await this.createDraftByFlowDetail(user, only.tableName, only.id)
        const pickedDraft = this.pickDocumentAndDetails(draftPack)
        if (pickedDraft) {
          return { type: 'DRAFT_LOADED', ...pickedDraft }
        }

        const draftMsg = String((draftPack as any)?.message ?? (draftPack as any)?.Message ?? '').trim()
        return { type: 'ERROR', level: 'warning', message: draftMsg || msg || '未找到可检验工序或无需末道检验' }
      } catch (error) {
        console.error('[FQC] 挤出计划扫码查询流程卡工序明细失败:', error)
        return { type: 'ERROR', level: 'error', message: '扫码处理失败' }
      }
    }

    // 已选择某条工序明细：优先打开已有未审批单据，否则按明细入口生成草稿
    const flowDetailTableName = String(picked.tableName ?? '').trim()
    const flowDetailId = this.normalizePositiveInt(picked.id)
    if (!flowDetailTableName || !flowDetailId) {
      return { type: 'ERROR', level: 'error', message: '工序明细参数不合法' }
    }

    try {
      try {
        const checkPack = await FlowScanApi.CheckDocumentState({
          dbName: DEFAULT_DB_NAME,
          user,
          sourceType: FlowScanSourceType.ExtrusionPlanDetail,
          scanForCode: normalized,
          sourceDetailId: 0,
          documentKind: FlowScanDocumentKind.FinalInspection,
          state: FlowScanCheckState.PrevCompletedCurrentUnfinished,
          includeTableRecords: true,
        })
        const ok = !!(checkPack as any)?.success
        if (ok) {
          const data = ((checkPack as any)?.data ?? (checkPack as any)?.Data ?? null) as any
          const unapprovedId = pickUnapprovedDocumentIdAcrossFlowDetails(
            data,
            [{ tableName: flowDetailTableName, id: flowDetailId }],
            TABLE_NAME,
          )
          if (unapprovedId > 0) return { type: 'OPEN_BY_ID', id: unapprovedId }
        }
      } catch {
        // ignore：查询失败时继续尝试生成草稿
      }

      const pack = await this.createDraftByFlowDetail(user, flowDetailTableName, flowDetailId)
      const pickedDraft = this.pickDocumentAndDetails(pack)
      return pickedDraft
        ? { type: 'DRAFT_LOADED', ...pickedDraft }
        : { type: 'ERROR', level: 'warning', message: '未找到可检验工序或无需末道检验' }
    } catch (error) {
      console.error('[FQC] 按流程卡明细生成末道检验草稿失败:', error)
      const msg = typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message ?? '')
        : ''
      return { type: 'ERROR', level: 'error', message: msg || '生成草稿失败' }
    }
  }

  /**
   *
   * 用例：日计划扫码生成/打开末道检验草稿（支持“多条当前工序明细”时先返回候选列表）。
   * @remarks
   * - 先调用 `FlowScanApi.CheckDocumentState` 查询“当前工序明细”；\n
   * - 若存在多条明细，则由调用方弹窗选择其一，再调用本方法传入 pickedFlowDetail；\n
   * - 选择后按明细入口（CraftApi）生成草稿，避免“多条当前工序”时后端自动选错。\n
   *
   */
  public async executeDailyPlanScanCreate(
    scanForCode: string,
    options?: { readonly pickedFlowDetail?: { tableName: string; id: number } | null },
  ): Promise<FinalInspectionScanResult> {
    const scan = String(scanForCode ?? '').trim()
    if (!scan) return { type: 'ERROR', level: 'warning', message: '扫描内容为空' }

    const user = this.getUser()
    const picked = options?.pickedFlowDetail ?? null

    if (!picked) {
      try {
        const pack = await FlowScanApi.CheckDocumentState({
          dbName: DEFAULT_DB_NAME,
          user,
          sourceType: FlowScanSourceType.DailyPlanDetail,
          scanForCode: scan,
          sourceDetailId: 0,
          documentKind: FlowScanDocumentKind.FinalInspection,
          state: FlowScanCheckState.PrevCompletedCurrentUnfinished,
          includeTableRecords: true,
        })

        const ok = !!(pack as any)?.success
        const msg = String((pack as any)?.message ?? '').trim()
        if (!ok) {
          return { type: 'ERROR', level: 'error', message: msg || '查询流程卡工序明细失败' }
        }

        const data = ((pack as any)?.data ?? (pack as any)?.Data ?? null) as any
        const parsed = parseFlowDetailsFromCheckDocumentStateData(data)

        if (parsed.length === 0) return { type: 'ERROR', level: 'warning', message: msg || '未找到可检验工序或无需末道检验' }

        if (parsed.length > 1) {
          const unapprovedId = pickUnapprovedDocumentIdAcrossFlowDetails(data, parsed, TABLE_NAME)
          if (unapprovedId > 0) return { type: 'OPEN_BY_ID', id: unapprovedId }
          const candidates = await enrichFlowDetailCandidates(parsed)
          return { type: 'NEED_PICK_FLOW_DETAIL', scanCode: scan, candidates }
        }

        const only = parsed[0]
        const unapprovedId = pickUnapprovedDocumentIdAcrossFlowDetails(data, [only], TABLE_NAME)
        if (unapprovedId > 0) return { type: 'OPEN_BY_ID', id: unapprovedId }

        const draftPack = await this.createDraftByFlowDetail(user, only.tableName, only.id)
        const pickedDraft = this.pickDocumentAndDetails(draftPack)
        if (pickedDraft) {
          return { type: 'DRAFT_LOADED', ...pickedDraft }
        }

        const draftMsg = String((draftPack as any)?.message ?? (draftPack as any)?.Message ?? '').trim()
        return { type: 'ERROR', level: 'warning', message: draftMsg || msg || '未找到可检验工序或无需末道检验' }
      } catch (error) {
        console.error('[FQC] 日计划扫码查询流程卡工序明细失败:', error)
        return { type: 'ERROR', level: 'error', message: '扫码处理失败' }
      }
    }

    const flowDetailTableName = String(picked.tableName ?? '').trim()
    const flowDetailId = this.normalizePositiveInt(picked.id)
    if (!flowDetailTableName || !flowDetailId) {
      return { type: 'ERROR', level: 'error', message: '工序明细参数不合法' }
    }

    try {
      try {
        const checkPack = await FlowScanApi.CheckDocumentState({
          dbName: DEFAULT_DB_NAME,
          user,
          sourceType: FlowScanSourceType.DailyPlanDetail,
          scanForCode: scan,
          sourceDetailId: 0,
          documentKind: FlowScanDocumentKind.FinalInspection,
          state: FlowScanCheckState.PrevCompletedCurrentUnfinished,
          includeTableRecords: true,
        })
        const ok = !!(checkPack as any)?.success
        if (ok) {
          const data = ((checkPack as any)?.data ?? (checkPack as any)?.Data ?? null) as any
          const unapprovedId = pickUnapprovedDocumentIdAcrossFlowDetails(
            data,
            [{ tableName: flowDetailTableName, id: flowDetailId }],
            TABLE_NAME,
          )
          if (unapprovedId > 0) return { type: 'OPEN_BY_ID', id: unapprovedId }
        }
      } catch {
        // ignore：查询失败时继续尝试生成草稿
      }

      const pack = await this.createDraftByFlowDetail(user, flowDetailTableName, flowDetailId)
      const pickedDraft = this.pickDocumentAndDetails(pack)
      return pickedDraft
        ? { type: 'DRAFT_LOADED', ...pickedDraft }
        : { type: 'ERROR', level: 'warning', message: '未找到可检验工序或无需末道检验' }
    } catch (error) {
      console.error('[FQC] 按流程卡明细生成末道检验草稿失败:', error)
      const msg = typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message ?? '')
        : ''
      return { type: 'ERROR', level: 'error', message: msg || '生成草稿失败' }
    }
  }

  private createDraftByFlowDetail(
    user: UserInfo,
    flowDetailTableName: string,
    flowDetailId: number,
  ): Promise<ApiMessagePack<{ Document?: FinalInspectionDocument | null; Details?: FinalInspectionDetail[] }>> {
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
  }

  /**
   *
   * 用例：返工单扫码生成/打开末道检验草稿（FGD-*）。
   * @param scanForCode 返工单条码（CodeForScan）。
   *
   */
  public async executeDefectiveReworkOrderScanCreate(
    scanForCode: string,
    options?: { readonly pickedFlowDetail?: { tableName: string; id: number } | null },
  ): Promise<FinalInspectionScanResult> {
    const rawScan = String(scanForCode ?? '').trim()
    if (!rawScan) return { type: 'ERROR', level: 'warning', message: '扫描内容为空' }

    // 兼容：扫码内容包含额外前缀时，尝试提取标准 FGD-xxxxxxxxxxxx
    const normalized = rawScan.match(/FGD-\d{12}/i)?.[0] ?? rawScan

    const user = this.getUser()
    const picked = options?.pickedFlowDetail ?? null

    if (!picked) {
      try {
        const pack = await FlowScanApi.CheckDocumentState({
          dbName: DEFAULT_DB_NAME,
          user,
          sourceType: FlowScanSourceType.DefectiveReworkOrderDocument,
          scanForCode: normalized,
          sourceDetailId: 0,
          documentKind: FlowScanDocumentKind.FinalInspection,
          state: FlowScanCheckState.PrevCompletedCurrentUnfinished,
          includeTableRecords: true,
        })

        const ok = !!(pack as any)?.success
        const msg = String((pack as any)?.message ?? '').trim()
        if (!ok) {
          return { type: 'ERROR', level: 'error', message: msg || '查询流程卡工序明细失败' }
        }

        const data = ((pack as any)?.data ?? (pack as any)?.Data ?? null) as any
        const parsed = parseFlowDetailsFromCheckDocumentStateData(data)

        if (parsed.length === 0) {
          return { type: 'ERROR', level: 'warning', message: msg || '未找到可检验工序或无需末道检验' }
        }

        if (parsed.length > 1) {
          const unapprovedId = pickUnapprovedDocumentIdAcrossFlowDetails(data, parsed, TABLE_NAME)
          if (unapprovedId > 0) return { type: 'OPEN_BY_ID', id: unapprovedId }
          const candidates = await enrichFlowDetailCandidates(parsed)
          return { type: 'NEED_PICK_FLOW_DETAIL', scanCode: normalized, candidates }
        }

        const only = parsed[0]
        const unapprovedId = pickUnapprovedDocumentIdAcrossFlowDetails(data, [only], TABLE_NAME)
        if (unapprovedId > 0) return { type: 'OPEN_BY_ID', id: unapprovedId }

        const packDraft = await this.createDraftByFlowDetail(user, only.tableName, only.id)
        const pickedDraft = this.pickDocumentAndDetails(packDraft)
        return pickedDraft
          ? { type: 'DRAFT_LOADED', ...pickedDraft }
          : { type: 'ERROR', level: 'warning', message: '未找到可检验工序或无需末道检验' }
      } catch (error) {
        console.error('[FQC] 返工单扫码查询流程卡工序明细失败:', error)
        return { type: 'ERROR', level: 'error', message: '扫码处理失败' }
      }
    }

    // 已选择某条工序明细：优先打开已有未审批单据，否则按明细入口生成草稿
    try {
      try {
        const checkPack = await FlowScanApi.CheckDocumentState({
          dbName: DEFAULT_DB_NAME,
          user,
          sourceType: FlowScanSourceType.DefectiveReworkOrderDocument,
          scanForCode: normalized,
          sourceDetailId: 0,
          documentKind: FlowScanDocumentKind.FinalInspection,
          state: FlowScanCheckState.PrevCompletedCurrentUnfinished,
          includeTableRecords: true,
        })
        const ok = !!(checkPack as any)?.success
        if (ok) {
          const data = ((checkPack as any)?.data ?? (checkPack as any)?.Data ?? null) as any
          const unapprovedId = pickUnapprovedDocumentIdAcrossFlowDetails(
            data,
            [{ tableName: picked.tableName, id: picked.id }],
            TABLE_NAME,
          )
          if (unapprovedId > 0) return { type: 'OPEN_BY_ID', id: unapprovedId }
        }
      } catch {
        // ignore：查询失败时继续尝试生成草稿
      }

      const pack = await this.createDraftByFlowDetail(user, picked.tableName, picked.id)
      const pickedDraft = this.pickDocumentAndDetails(pack)
      return pickedDraft
        ? { type: 'DRAFT_LOADED', ...pickedDraft }
        : { type: 'ERROR', level: 'warning', message: '未找到可检验工序或无需末道检验' }
    } catch (error) {
      console.error('[FQC] 按流程卡明细生成末道检验草稿失败:', error)
      const msg = typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message ?? '')
        : ''
      return { type: 'ERROR', level: 'error', message: msg || '生成草稿失败' }
    }
  }

  /**
   *
   * 兜底：尝试通用生产/装配条码生成草稿。
   * @param scanCode 扫码内容。
   * @returns 草稿结果或 null。
   *
   */
  private async tryCreateDraftFromGenericScan(scanCode: string): Promise<FinalInspectionScanResult | null> {
    const user = this.getUser()
    const packA = await QualityApi.GetAssemblyFlowWithFinalInspectionByDailyPlanScanCode<FinalInspectionDocument, FinalInspectionDetail>(
      DEFAULT_DB_NAME,
      scanCode,
      user,
    )
    const pickedA = this.pickDocumentAndDetails(packA)
    if (pickedA) return { type: 'DRAFT_LOADED', ...pickedA }

    const packB = await QualityApi.GetProduceFlowWithFinalInspectionByExtrusionPlanScanCode<FinalInspectionDocument, FinalInspectionDetail>(
      DEFAULT_DB_NAME,
      scanCode,
      user,
    )
    const pickedB = this.pickDocumentAndDetails(packB)
    return pickedB ? { type: 'DRAFT_LOADED', ...pickedB } : null
  }

  /**
   *
   * 审批前校验：状态锁与重复审批。
   * @param aggregate 聚合根。
   * @returns 校验结果。
   *
   */
  private validateApprove(
    aggregate: FinalInspection,
  ): { readonly ok: true; readonly ncrHint: boolean } | { readonly ok: false; readonly message: string } {
    const status = aggregate.status
    if (this.hasStatusFlag(status, DocumentStatus.已冻结) || this.hasStatusFlag(status, DocumentStatus.已结案) || this.hasStatusFlag(status, DocumentStatus.已作废)) {
      return { ok: false, message: '当前单据已冻结/结案/作废，无法审批' }
    }
    if (this.hasStatusFlag(status, DocumentStatus.已审批)) {
      return { ok: false, message: '当前单据已审批，无法重复审批' }
    }
    if (!this.normalizePositiveInt(aggregate.id)) {
      return { ok: false, message: '审批前请先保存单据' }
    }
    const ncrHint = aggregate.quantitySplit.ngQuantity > 0 || aggregate.details.some((d) => d.result.value === CheckResult.不合格)
    return { ok: true, ncrHint }
  }

  /**
   *
   * 反审批前校验：必须已审批且未锁定。
   * @param aggregate 聚合根。
   * @returns 校验结果。
   *
   */
  private validateUnapprove(
    aggregate: FinalInspection,
  ): { readonly ok: true } | { readonly ok: false; readonly message: string } {
    const status = aggregate.status
    if (this.hasStatusFlag(status, DocumentStatus.已冻结) || this.hasStatusFlag(status, DocumentStatus.已结案) || this.hasStatusFlag(status, DocumentStatus.已作废)) {
      return { ok: false, message: '当前单据已冻结/结案/作废，无法反审批' }
    }
    if (!this.hasStatusFlag(status, DocumentStatus.已审批)) {
      return { ok: false, message: '当前单据未审批，无法反审批' }
    }
    return { ok: true }
  }

  /**
   *
   * 解析审批接口返回。
   * @param res 返回包。
   *
   */
  private parseApprovalResponse(res: ApiMessagePack): { readonly success: boolean; readonly message: string } {
    const successRaw = (res as any)?.issuccess ?? (res as any)?.isSuccess ?? (res as any)?.success ?? (res as any)?.Success
    const messageRaw =
      (res as any)?.message ?? (res as any)?.Message ?? (res as any)?.errorMessage ?? (res as any)?.ErrorMessage ?? (res as any)?.msg
    const success = typeof successRaw === 'boolean' ? successRaw : false
    const message = typeof messageRaw === 'string' ? messageRaw : messageRaw == null ? '' : String(messageRaw)
    return { success, message }
  }

  /**
   *
   * 从 ApiMessagePack 中提取 document 与 details。
   * @param pack 任意返回包。
   *
   */
  private pickDocumentAndDetails(
    pack: unknown,
  ): { document: FinalInspectionDocument | null; details: FinalInspectionDetail[]; message?: string } | null {
    if (!pack || typeof pack !== 'object') return null
    const root = pack as Record<string, unknown> & { data?: Record<string, unknown> }
    const data = (root.data ?? (root as any).Data ?? root) as Record<string, unknown>
    const document = (data?.Document ?? data?.document ?? null) as FinalInspectionDocument | null
    const details = (Array.isArray(data?.Details) ? data?.Details : Array.isArray(data?.details) ? data?.details : []) as FinalInspectionDetail[]
    const messageRaw = (root as any)?.message ?? (root as any)?.Message ?? (data as any)?.message ?? (data as any)?.Message
    const message = typeof messageRaw === 'string' ? messageRaw : undefined
    if (!document && (!details || details.length === 0)) return null
    return { document, details: details ?? [], message }
  }

  /**
   *
   * 从表头提取数字型主键。
   * @param bill 表头。
   *
   */
  private pickBillId(bill: FinalInspectionDocument): number {
    const candidates: unknown[] = [
      (bill as any)?.id,
      (bill as any)?.Id,
      (bill as any)?.ID,
      (bill as any)?.BillId,
      (bill as any)?.billId,
    ]
    for (const raw of candidates) {
      const n = this.normalizePositiveInt(raw)
      if (n) return n
    }
    return 0
  }

  /**
   *
   * 标准化为正整数。
   * @param value 输入值。
   *
   */
  private normalizePositiveInt(value: unknown): number | null {
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null
    if (n > Number.MAX_SAFE_INTEGER) return null
    return n
  }

  /**
   *
   * 状态位包含判断。
   * @param status 状态值。
   * @param flag 标记位。
   *
   */
  private hasStatusFlag(status: number, flag: number): boolean {
    return status === flag || (status & flag) !== 0
  }

  /**
   *
   * 统一获取 ERP 用户信息。
   *
   */
  private getUser(): UserInfo {
    return getErpUserFromStorage()
  }

  /**
   *
   * 提取错误信息。
   * @param error 错误对象。
   *
   */
  private extractErrorMessage(error: unknown): string | null {
    if (!error) return null
    if (typeof error === 'string') return error
    if (typeof error === 'object' && 'message' in (error as any)) {
      return String((error as any).message ?? '')
    }
    return null
  }
}
