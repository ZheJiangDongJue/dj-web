import { BillApi, type UserInfo } from '@/lib/erp/bill-api'
import { DEFAULT_DB_NAME } from '@/lib/config'
import { FlowScanDocumentKind, FlowScanSourceType } from '@/lib/erp/flow-scan-api'
import { QualityApi } from '@/lib/erp/quality-api'
import { fetchLookup } from '@/lib/erp/lookup-core'
import { loadImageBase64, type ErpImageItem } from '@/lib/image-loader'
import {
  type FlowDetailCandidate,
} from '@/application/quality/shared/flowDetailCandidates'
import { BillApprovalService } from '@/application/quality/shared/BillApprovalService'
import {
  ScanDocumentFlow,
  type ScanDocumentFlowResult,
} from '@/application/quality/shared/ScanDocumentFlow'
import { normalizePositiveInt, resolveUserFacingErrorMessage } from '@/application/quality/shared/billCommon'
import {
  DefectiveReworkOrderDetail,
  DefectiveReworkOrderDocument,
  DefectiveReworkOrderCheckDetail,
  FileRecordForNcr,
} from '@/types/erp-db.generated'
import type { DefectiveReworkOrderRepository } from '@/domain/quality/ncr/repositories/DefectiveReworkOrderRepository'
import { NcrScanService } from '@/domain/quality/ncr/services/NcrScanService'
import { DefectiveReworkOrderApprovalService } from '@/domain/quality/ncr/services/DefectiveReworkOrderApprovalService'
import { DefectiveReworkOrderMapper } from '@/infrastructure/repositories/quality/mappers/defectiveReworkOrderMapper'
import { pickDocumentAndDetails, pickField, unwrapDataContainer } from '@/application/quality/shared/apiMessagePack'

/**
 *
 * NCR（不合格返工单）在 BillApi 中使用的表名。
 * @remarks
 * 与后端 GeneralBill* 系列接口的 tableName 参数保持一致。\\n
 *
 */
 const NCR_TABLE_NAME = 'DefectiveReworkOrderDocument' as const

/**
 *
 * NCR “本地照片证据”最小结构（与 ViewModel 中的 LocalErpImageItem 结构兼容）。
 * @remarks
 * 说明：应用层不直接依赖表现层的类型定义；该类型仅用于结构化约束入参。\\n
 *
 */
 export type NcrLocalPhotoEvidenceItem = ErpImageItem & {

  readonly localFile?: File
  /**
   *
   * 可选：文件名（Android/其它来源）。
   *
   */
  readonly fileName?: string
  /**
   *
   * 可选：是否仅远程预览（不参与上传）。
   *
   */
  readonly isRemoteOnly?: boolean
}

/**
 *
 * 查询：按 ID 获取 NCR 单据头 + 明细。
 *
 */
 export type NcrBillWithDetails = {

  readonly document: DefectiveReworkOrderDocument | null
  /**
   *
   * 明细列表（不存在时为空数组）。
   *
   */
  readonly details: DefectiveReworkOrderDetail[]
}

/**
 *
 * 生成草稿：基于检验单生成 NCR（不合格返工单）草稿。
 *
 */
export type NcrDraftFromInspectionResult =
  | {
      readonly ok: true
      readonly document: DefectiveReworkOrderDocument
      readonly details: DefectiveReworkOrderDetail[]
      readonly checkDetails: DefectiveReworkOrderCheckDetail[]
      readonly sourceFlowDetailId?: number
      readonly sourceFlowDetailType?: string
    }
  | {
      readonly ok: false
      readonly message: string
    }

/**
 *
 * 保存用例的返回结果（与 DocumentActionsStore/DocumentBase 约定兼容）。
 *
 */
 export type NcrSaveResult = {

/**
 *
 * 保存后的单据主键。
 * @remarks
 * - number：保存成功（>0）；\\n
 * - null：保存失败（DocumentBase 会视为失败并展示 res.code）。\\n
 *
 */
 readonly id: number | null

/**
 *
 * 失败提示文案（保存失败时可选）。
 *
 */
 readonly code?: string

/**
 *
 * 用户可见的失败消息（优先展示，通常与 code 保持一致）。
 *
 */
 readonly message?: string

/**
 *
 * 是否建议调用方清空本地照片证据（仅在“随单保存上传”成功后为 true）。
 *
 */
 readonly clearLocalPhotoEvidence?: boolean
 }

/**
 *
 * 审批/反审批/删除等操作的统一返回结构（供 ViewModel 透传给 DocumentActionsStore/DocumentBase）。
 *
 */
 export type NcrActionResult = {

  readonly success: boolean
  /**
   *
   * 可展示的信息（失败时通常为原因）。
   *
   */
  readonly message: string
}

/**
 *
 * 扫码用例执行结果：应用层负责“解析 + IO”，ViewModel 负责“落地到状态 + toast 展示”。
 *
 */
export type NcrScanExecuteResult =
 | {

      readonly type: 'OPEN_BY_ID'
      /**
       *
       * 要打开的单据主键。
       *
       */
      readonly id: number
    }
  | {
      /**
       *
       * 结果类型：设置检验员。
       *
       */
      readonly type: 'SET_INSPECTOR'
      /**
       *
       * 检验员员工ID（Employeeid）。
       *
       */
      readonly employeeId: number
      /**
       *
       * 检验员名称（可选，用于 UI toast）。
       *
       */
      readonly employeeName?: string
    }
  | {
      /**
       *
       * 结果类型：已生成 NCR 草稿（不落库）。
       *
       */
      readonly type: 'DRAFT_LOADED'
      /**
       *
       * NCR 草稿单据头。
       *
       */
      readonly document: DefectiveReworkOrderDocument
      /**
       *
       * NCR 返工明细草稿。
       *
       */
      readonly details: DefectiveReworkOrderDetail[]
      /**
       *
       * 来源检验明细草稿（当前页面未完整渲染，但保留给后续保存/展示扩展）。
       *
       */
      readonly checkDetails: DefectiveReworkOrderCheckDetail[]
      /**
       *
       * 当前草稿所选来源流程卡明细主键。
       *
       */
      readonly sourceFlowDetailId?: number
      /**
       *
       * 当前草稿所选来源流程卡明细表名。
       *
       */
      readonly sourceFlowDetailType?: string
      /**
       *
       * 后端返回的提示信息（可选）。
       *
       */
      readonly message?: string
    }
  | {
      /**
       *
       * 结果类型：需要用户从多条“当前工序明细”中选择其一（用于扫码生成 NCR）。
       *
       */
      readonly type: 'NEED_PICK_FLOW_DETAIL'
      /**
       *
       * 日计划扫码编码（RJH-xxx）。
       *
       */
      readonly scanCode: string
      /**
       *
       * 候选流程卡明细列表（TableName + id）。
       *
       */
      readonly candidates: NcrScanFlowDetailCandidate[]
    }
  | {
      /**
       *
       * 结果类型：失败（由上层决定 toast 类型）。
       *
       */
      readonly type: 'ERROR'
      /**
       *
       * 错误级别：warning/error。
       *
       */
      readonly level: 'warning' | 'error'
      /**
       *
       * 可展示的错误信息。
       *
       */
      readonly message: string
    }

/**
 *
 * 扫码：候选流程卡工序明细（用于“多条当前工序明细”场景下的用户选择）。
 *
 */
export type NcrScanFlowDetailCandidate = FlowDetailCandidate

/**
 *
 * NCR 应用层服务（用例编排 + 事务边界 + 错误封装）。
 * @remarks
 * 设计要点：\\n
 * - ViewModel 不直接调用领域服务/外部 API，而是通过本服务完成用例编排；\\n
 * - 事务边界：保存（含附件）/审批/反审批/删除均通过“单次后端调用”保证原子性；\\n
 * - 本服务不负责 toast/DOM 交互；仅返回结构化结果供表现层决定 UI 行为。\\n
 *
 */
 export class NcrApplicationService {

/**
 *
 * 单据头模板：用于“按字段类型归一化”（数字/布尔）时提供类型参照。
 *
 */
 private static readonly docNormalizeTemplate: DefectiveReworkOrderDocument = (() => {
 const doc = new DefectiveReworkOrderDocument()
 doc.initDefaults()
 return doc
 })()

/**
 *
 * 明细模板：用于“按字段类型归一化”（数字/布尔）时提供类型参照。
 *
 */
 private static readonly detailNormalizeTemplate: DefectiveReworkOrderDetail = (() => {
 const detail = new DefectiveReworkOrderDetail()
 detail.initDefaults()
 return detail
 })()

/**
 *
 * 构造应用服务。
 * @param repo 领域仓储（用于删除等操作，便于后续扩展）。
 *
 */
  public constructor(private readonly repo: DefectiveReworkOrderRepository) {}

  /**
   *
   * 通用审批服务。
   *
   */
  private readonly approvalService = new BillApprovalService({
    tableName: NCR_TABLE_NAME,
    getUser: () => getErpUserFromStorage(),
  })

  /**
   *
   * 创建 NCR 扫码流程编排器。
   * @param mode 创建模式：`daily` 走日计划接口，`flow-detail` 走工序明细接口。
   *
   */
  private createScanFlow(mode: 'daily' | 'flow-detail') {
    return new ScanDocumentFlow<
      DefectiveReworkOrderDocument,
      DefectiveReworkOrderDetail,
      { readonly inspectorEmployeeId: number }
    >({
      documentKind: FlowScanDocumentKind.Ncr,
      targetDocumentTableName: NCR_TABLE_NAME,
      getUser: () => getErpUserFromStorage(),
      createDraft: async ({ user, flowDetailTableName, flowDetailId, scanCode, context }) => {
        const inspectorEmployeeid = context?.inspectorEmployeeId ?? 0
        if (mode === 'daily') {
          return QualityApi.GetDefectiveReworkOrderDraftByDailyPlanScanCode({
            dbName: DEFAULT_DB_NAME,
            user,
            scanForCode: scanCode,
            inspectorEmployeeid,
            flowDetailTableName,
            flowDetailId,
          }) as any
        }
        return QualityApi.GetDefectiveReworkOrderDraftByFlowDetail({
          dbName: DEFAULT_DB_NAME,
          user,
          inspectorEmployeeid,
          flowDetailTableName,
          flowDetailId,
        }) as any
      },
      draftStrategy: { mode: 'document-and-details' },
      messages: {
        queryFailed: '查询流程卡工序明细失败',
        noFlowDetail: '未找到当前可用的流程卡工序明细',
        createFailed: '未能生成不合格返工单',
        invalidCreatedId: '后端返回草稿数据异常，无法打开',
        invalidFlowDetail: '工序明细参数不合法',
        scanFailed: '扫码处理失败，请稍后重试',
      },
      levels: {
        noFlowDetail: 'error',
        createFailed: 'error',
      },
    })
  }

  /**
   *
   * 用例：按单据 ID 获取 NCR 单据头与明细（供 DocumentBase.refresh/openById 使用）。
   * @param id 单据主键。
   * @returns 单据头 + 明细。
   *
   */
  public async fetchById(id: number): Promise<NcrBillWithDetails> {
    const billId = normalizePositiveInt(id)
    if (!billId) return { document: null, details: [] }

    const pack = await BillApi.GetBillWithDetails<{
      Document?: DefectiveReworkOrderDocument | null
      document?: DefectiveReworkOrderDocument | null
      Details?: DefectiveReworkOrderDetail[]
      details?: DefectiveReworkOrderDetail[]
      success?: boolean
      message?: string
    }>({ tableName: NCR_TABLE_NAME, billId })

    const anyPack = pack as unknown as Record<string, unknown>
    const payload = ((anyPack as any)?.data ?? anyPack) as Record<string, unknown>

    const document = ((payload as any)?.Document ?? (payload as any)?.document ?? null) as
      | DefectiveReworkOrderDocument
      | null

    const rawDetails = ((payload as any)?.Details ?? (payload as any)?.details ?? []) as unknown

    const successFlag: boolean | undefined =
      typeof (anyPack as any)?.success === 'boolean'
        ? ((anyPack as any).success as boolean)
        : typeof (payload as any)?.success === 'boolean'
          ? ((payload as any).success as boolean)
          : undefined

    // 与 fetchBillWithDetailsById 的行为保持一致：当后端明确失败且无有效 payload 时抛错
    if (successFlag === false && !document && !Array.isArray(rawDetails)) {
      const message =
        (anyPack as any)?.message ?? (payload as any)?.message ?? '获取单据失败'
      throw new Error(String(message))
    }

    return {
      document,
      details: Array.isArray(rawDetails) ? (rawDetails as DefectiveReworkOrderDetail[]) : [],
    }
  }

  /**
   *
   * 用例：基于检验单生成 NCR 草稿（不落库）。
   * @param input 检验单类型与主键。
   * @returns 草稿单据头 + 明细（当前通常为空数组）。
   *
   */
  public async createDraftByInspection(input: {
    readonly inspectionDocumentType: string
    readonly inspectionDocumentId: number
  }): Promise<NcrDraftFromInspectionResult> {
    const type = String(input?.inspectionDocumentType ?? '').trim()
    const id = normalizePositiveInt(input?.inspectionDocumentId)
    if (!type || !id) return { ok: false, message: '检验单参数不合法，无法生成草稿' }

    try {
      const user = getErpUserFromStorage()
      const pack = await QualityApi.GetDefectiveReworkOrderDraftByInspection<
        DefectiveReworkOrderDocument,
        DefectiveReworkOrderDetail,
        DefectiveReworkOrderCheckDetail
      >({
        dbName: DEFAULT_DB_NAME,
        user,
        inspectionDocumentType: type,
        inspectionDocumentId: id,
      })

      const draft = this.toNcrDraftLoadedResult(pack, '未能生成不合格返工单草稿')
      if (draft.type !== 'DRAFT_LOADED') {
        return {
          ok: false,
          message: draft.type === 'ERROR' ? draft.message : '未能生成不合格返工单草稿',
        }
      }

      return {
        ok: true,
        document: draft.document,
        details: draft.details,
        checkDetails: draft.checkDetails,
        sourceFlowDetailId: draft.sourceFlowDetailId,
        sourceFlowDetailType: draft.sourceFlowDetailType,
      }
    } catch (error) {
      console.error('[NCR] 生成不合格返工单草稿失败:', error)
      return { ok: false, message: '生成草稿失败，请稍后重试' }
    }
  }

  /**
   *
   * 用例：保存 NCR（支持“随单保存上传照片证据”）。
   * @remarks
   * 事务边界：\\n
   * - 当存在待上传照片时：使用后端 <c>SaveDefectiveReworkOrderWithFiles</c> 单次请求完成“单据+明细+附件”保存；\\n
   * - 否则走通用 <c>GeneralBillSave</c>。\\n
   * @param input 保存输入。
   * @returns 保存结果（与 DocumentBase 约定兼容）。
   *
   */
  public async save(input: {
    bill: DefectiveReworkOrderDocument
    details: DefectiveReworkOrderDetail[]
    localPhotoEvidence?: readonly NcrLocalPhotoEvidenceItem[]
  }): Promise<NcrSaveResult> {
    try {
      const rawDetails = Array.isArray(input.details) ? input.details : []
      const detailsPayload = rawDetails.map((d) => stripDetailMetaFields(d))

      const localPhotos = Array.isArray(input.localPhotoEvidence) ? input.localPhotoEvidence : []
      const uploadPhotos = localPhotos.filter((p) => !(p as any)?.isRemoteOnly)

      // 1) 有照片：走“随单上传”接口（后端单次事务）
      if (uploadPhotos.length > 0) {
        let files: FileRecordForNcr[] = []
        try {
          files = await this.buildFilesForUpload(uploadPhotos)
        } catch (error) {
          return buildSaveFailureResult(error, '读取图片失败')
        }

        const documentPayload = this.normalizePayloadTypesByTemplate(
          input.bill as any,
          NcrApplicationService.docNormalizeTemplate as any,
        )
        const normalizedDetailsPayload = detailsPayload.map((d) =>
          this.normalizePayloadTypesByTemplate(d as any, NcrApplicationService.detailNormalizeTemplate as any),
        )

        try {
          const res = await QualityApi.SaveDefectiveReworkOrderWithFiles({
            dbName: DEFAULT_DB_NAME,
            user: getErpUserFromStorage(),
            document: documentPayload as any,
            details: normalizedDetailsPayload as any,
            checkDetails: [],
            files: files as any,
          })

          const okRaw = (res as any)?.isSuccess ?? (res as any)?.IsSuccess
          const ok = typeof okRaw === 'boolean' ? okRaw : false
          if (!ok) {
            return buildSaveFailureResult(res, '保存失败')
          }

          const id = extractBillId(res)
          if (!id) return { id: null, code: '保存后未返回单据ID', message: '保存后未返回单据ID' }
          return { id, clearLocalPhotoEvidence: true }
        } catch (error) {
          return buildSaveFailureResult(error, '保存失败')
        }
      }

      // 2) 无照片：走通用保存（后端单次事务）
      try {
        const res = await BillApi.GeneralBillSave({
          tableName: NCR_TABLE_NAME,
          user: getErpUserFromStorage(),
          bill: input.bill as any,
          details: detailsPayload as any,
        })
        const id = extractBillId(res)
        if (!id) return { id: null, code: '保存后未返回单据ID', message: '保存后未返回单据ID' }
        return { id }
      } catch (error) {
        return buildSaveFailureResult(error, '保存失败')
      }
    } catch (error) {
      return buildSaveFailureResult(error, '保存失败')
    }
  }

  /**
   *
   * 用例：审批 NCR（保持与既有 UI 行为一致：仅做“调用后端审批接口”）。
   * @remarks
   * 说明：\\n
   * - 领域侧的前置条件校验（检验员/工序/明细记录）由 ViewModel 的 validateBeforeApprove 与领域服务共同保证；\\n
   * - 本用例保持与既有流程一致：先由 DocumentBase 触发保存，再调用审批接口。\\n
   * @param id 单据主键。
   * @param snapshot 可选：用于领域层快速校验的当前快照（不做 IO）。
   *
   */
  public async approve(
    id: number,
    snapshot?: { bill: DefectiveReworkOrderDocument; details: DefectiveReworkOrderDetail[] },
  ): Promise<NcrActionResult> {
    // 领域层校验：若快照不满足审批规则，则直接返回失败（避免无意义的后端调用）
    if (snapshot) {
      const domain = DefectiveReworkOrderMapper.toDomain({
        document: snapshot.bill as any,
        details: snapshot.details as any,
        fallbackId: Number(id) || 0,
      })
      if (domain) {
        const checked = DefectiveReworkOrderApprovalService.approve(domain)
        if (!checked.ok) {
          return { success: false, message: checked.error.message }
        }
      }
    }

    const billId = normalizePositiveInt(id)
    if (!billId) return { success: false, message: '单据ID不合法' }
    return this.approvalService.approve(billId)
  }

  /**
   *
   * 用例：反审批 NCR（保持与既有 UI 行为一致：仅做“调用后端反审批接口”）。
   * @param id 单据主键。
   * @param snapshot 可选：用于领域层快速校验的当前快照（不做 IO）。
   *
   */
  public async unapprove(
    id: number,
    snapshot?: { bill: DefectiveReworkOrderDocument; details: DefectiveReworkOrderDetail[] },
  ): Promise<NcrActionResult> {
    if (snapshot) {
      const domain = DefectiveReworkOrderMapper.toDomain({
        document: snapshot.bill as any,
        details: snapshot.details as any,
        fallbackId: Number(id) || 0,
      })
      if (domain) {
        const checked = DefectiveReworkOrderApprovalService.unapprove(domain)
        if (!checked.ok) {
          return { success: false, message: checked.error.message }
        }
      }
    }

    const billId = normalizePositiveInt(id)
    if (!billId) return { success: false, message: '单据ID不合法' }
    return this.approvalService.unapprove(billId)
  }

  /**
   *
   * 用例：删除 NCR 单据。
   * @remarks
   * - 若 id 不存在：视为“取消新建”，由上层（DocumentBase）处理；\\n
   * - 本用例只封装后端删除接口的结果解析与异常兜底。\\n
   * @param id 单据主键。
   *
   */
  public async delete(id: number): Promise<NcrActionResult> {
    const billId = normalizePositiveInt(id)
    if (!billId) return { success: false, message: '单据ID不合法' }

    try {
      const res = await this.repo.delete(billId)
      return { success: !!res?.success, message: String(res?.message ?? '') }
    } catch (error) {
      const msg =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as any).message ?? '')
          : ''
      return { success: false, message: msg.trim() ? msg : '删除失败' }
    }
  }

  /**
   *
   * 用例：解析并执行扫码（不直接改写 ViewModel 状态）。
   * @param text 扫码/手动输入文本。
   * @param options 执行选项。
   * @returns 结构化执行结果。
   *
   */
  public async executeScan(text: string, options?: {
    /**
     *
     * 当前已选择的检验员 Employeeid（用于日计划生成时透传）。
     *
     */
    readonly inspectorEmployeeId?: number | null
    /**
     *
     * 是否允许通过职员码修改检验员（不可编辑状态应传 false）。
     *
     */
    readonly allowSetInspector?: boolean
    /**
     *
     * 是否允许“id:123/纯数字”直接打开（默认 false，用于保持现有 handleScan 行为）。
     *
     */
    readonly allowOpenById?: boolean
  }): Promise<NcrScanExecuteResult> {
    const parsed = NcrScanService.parse(text, { inspectorEmployeeId: options?.inspectorEmployeeId })
    if (!parsed.ok) {
      // 为保持既有 UI 习惯：默认使用 warning（除非调用方显式允许 openById 且输入为非法 id）
      if (parsed.error.code === 'INVALID_ID' && options?.allowOpenById) {
        return { type: 'ERROR', level: 'error', message: parsed.error.message }
      }
      return { type: 'ERROR', level: 'warning', message: parsed.error.message }
    }

    switch (parsed.command.type) {
      case 'OPEN_DEFECTIVE_REWORK_ORDER_BY_ID': {
        // 兼容：在“禁止打开 id”模式下，将 OPEN_BY_ID 视为不支持，避免改变既有 handleScan 的行为。
        if (!options?.allowOpenById) {
          return { type: 'ERROR', level: 'warning', message: '暂不支持该条码' }
        }
        return { type: 'OPEN_BY_ID', id: parsed.command.id }
      }

      case 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DEFECTIVE_REWORK_ORDER_SCAN_CODE': {
        return this.executeDefectiveReworkOrderScanCreate(parsed.command.scanForCode, {
          inspectorEmployeeId: parsed.command.inspectorEmployeeId ?? 0,
        })
      }

      case 'SET_INSPECTOR_BY_EMPLOYEE_SCAN_CODE': {
        if (options?.allowSetInspector === false) {
          return { type: 'ERROR', level: 'warning', message: '当前单据不可编辑，无法修改检验员' }
        }

        try {
          const employee = await this.findEmployeeByScanCode(parsed.command.scanCode)
          if (!employee.ok) {
            if (employee.reason === 'INVALID_EMPLOYEE_ID') {
              return { type: 'ERROR', level: 'error', message: '职员数据异常，请联系管理员' }
            }
            return { type: 'ERROR', level: 'error', message: '未找到该条码对应的职员' }
          }

          return {
            type: 'SET_INSPECTOR',
            employeeId: employee.employee.id,
            employeeName: employee.employee.name,
          }
        } catch (error) {
          console.error('[NCR] 职员扫码处理失败:', error)
          return { type: 'ERROR', level: 'error', message: '设置检验员失败，请稍后重试' }
        }
      }

      case 'CREATE_DEFECTIVE_REWORK_ORDER_BY_DAILY_PLAN_SCAN_CODE': {
        return this.executeDailyPlanScanCreate(parsed.command.scanForCode, {
          inspectorEmployeeId: parsed.command.inspectorEmployeeId ?? 0,
        })
      }

      case 'CREATE_DEFECTIVE_REWORK_ORDER_BY_EXTRUSION_PLAN_SCAN_CODE': {
        return this.executeExtrusionPlanScanCreate(parsed.command.scanForCode, {
          inspectorEmployeeId: parsed.command.inspectorEmployeeId ?? 0,
        })
      }
    }
  }

  /**
   *
   * 用例：日计划扫码生成不合格返工单（支持“多条当前工序明细”时先返回候选列表）。
   *
   */
  public async executeDailyPlanScanCreate(
    scanForCode: string,
    options?: {
      readonly inspectorEmployeeId?: number | null
      readonly pickedFlowDetail?: { tableName: string; id: number } | null
    },
  ): Promise<NcrScanExecuteResult> {
    if (!options?.pickedFlowDetail) {
      return this.createDraftByDailyPlanDefaultOrder(scanForCode, {
        inspectorEmployeeId: options?.inspectorEmployeeId ?? 0,
      })
    }

    return this.toNcrScanResult(
      await this.createScanFlow('daily').run({
        scanForCode,
        source: {
          sourceType: FlowScanSourceType.DailyPlanDetail,
          logTag: '[NCR]',
        },
        pickedFlowDetail: options?.pickedFlowDetail ?? null,
        context: {
          inspectorEmployeeId: options?.inspectorEmployeeId ?? 0,
        },
      }),
    )
  }

  /**
   *
   * 用例：挤出计划扫码生成不合格返工单（JCJH-*，支持“多条当前工序明细”时先返回候选列表）。
   *
   */
  public async executeExtrusionPlanScanCreate(
    scanForCode: string,
    options?: {
      readonly inspectorEmployeeId?: number | null
      readonly pickedFlowDetail?: { tableName: string; id: number } | null
    },
  ): Promise<NcrScanExecuteResult> {
    return this.toNcrScanResult(
      await this.createScanFlow('flow-detail').run({
        scanForCode,
        source: {
          sourceType: FlowScanSourceType.ExtrusionPlanDetail,
          normalizeCode: (raw) => raw.match(/JCJH-\d{12}/i)?.[0] ?? raw,
          logTag: '[NCR]',
        },
        pickedFlowDetail: options?.pickedFlowDetail ?? null,
        context: {
          inspectorEmployeeId: options?.inspectorEmployeeId ?? 0,
        },
      }),
    )
  }

  /**
   *
   * 用例：不合格返工单扫码生成不合格返工单（继续下游 NCR，支持“多条当前工序明细”时先返回候选列表）。
   *
   */
  public async executeDefectiveReworkOrderScanCreate(
    scanForCode: string,
    options?: {
      readonly inspectorEmployeeId?: number | null
      readonly pickedFlowDetail?: { tableName: string; id: number } | null
    },
  ): Promise<NcrScanExecuteResult> {
    return this.toNcrScanResult(
      await this.createScanFlow('flow-detail').run({
        scanForCode,
        source: {
          sourceType: FlowScanSourceType.DefectiveReworkOrderDocument,
          normalizeCode: (raw) => raw.match(/FGD-\d{12}/i)?.[0] ?? raw,
          logTag: '[NCR]',
        },
        pickedFlowDetail: options?.pickedFlowDetail ?? null,
        context: {
          inspectorEmployeeId: options?.inspectorEmployeeId ?? 0,
        },
      }),
    )
  }

  /**
   *
   * 用例：按当前来源流程卡明细重新生成 NCR 草稿（不落库）。
   * @remarks
   * - 用于页面返工工序切换后按后端默认来源规则刷新草稿；\\n
   * - 这里不重新走扫码解析，避免把 UI 状态伪装成条码输入。\\n
   *
   */
  public async reloadDraftByFlowDetail(input: {
    readonly flowDetailTableName: string
    readonly flowDetailId: number
    readonly inspectorEmployeeId?: number | null
  }): Promise<NcrScanExecuteResult> {
    const flowDetailTableName = String(input?.flowDetailTableName ?? '').trim()
    const flowDetailId = normalizePositiveInt(input?.flowDetailId)
    if (!flowDetailTableName || !flowDetailId) {
      return { type: 'ERROR', level: 'error', message: '来源工序明细参数不合法' }
    }

    try {
      const pack = await QualityApi.GetDefectiveReworkOrderDraftByFlowDetail<
        DefectiveReworkOrderDocument,
        DefectiveReworkOrderDetail,
        DefectiveReworkOrderCheckDetail
      >({
        dbName: DEFAULT_DB_NAME,
        user: getErpUserFromStorage(),
        inspectorEmployeeid: input?.inspectorEmployeeId ?? 0,
        flowDetailTableName,
        flowDetailId,
      })

      return this.toNcrDraftLoadedResult(pack, '未能刷新来源草稿')
    } catch (error) {
      console.error('[NCR] 按流程卡明细重新生成不合格返工单草稿失败:', error)
      return { type: 'ERROR', level: 'error', message: '刷新来源草稿失败，请稍后重试' }
    }
  }

  /**
   *
   * 按 ERPClient 一致的默认顺序生成日计划 NCR 草稿。
   * @remarks
   * - 不预先用 FlowScan 缩小到“当前工序明细”，避免偏离后端默认候选排序；\n
   * - 后端排序：接收顺序 -> 来源单据类型默认顺序 -> 工序顺序 -> 明细 id -> 最新来源单据。
   *
   */
  private async createDraftByDailyPlanDefaultOrder(
    scanForCode: string,
    options?: { readonly inspectorEmployeeId?: number | null },
  ): Promise<NcrScanExecuteResult> {
    const scan = String(scanForCode ?? '').trim()
    if (!scan) return { type: 'ERROR', level: 'warning', message: '扫描内容为空' }

    try {
      const latestNcrId = await this.tryGetLatestNcrIdByDailyPlanScanCode(scan)
      if (latestNcrId > 0) return { type: 'OPEN_BY_ID', id: latestNcrId }

      const pack = await QualityApi.GetDefectiveReworkOrderDraftByDailyPlanScanCode<
        DefectiveReworkOrderDocument,
        DefectiveReworkOrderDetail,
        DefectiveReworkOrderCheckDetail
      >({
        dbName: DEFAULT_DB_NAME,
        user: getErpUserFromStorage(),
        scanForCode: scan,
        inspectorEmployeeid: options?.inspectorEmployeeId ?? 0,
      })

      return this.toNcrDraftLoadedResult(pack, '未能生成不合格返工单')
    } catch (error) {
      console.error('[NCR] 扫日计划条码生成不合格返工单草稿失败:', error)
      return { type: 'ERROR', level: 'error', message: '扫码处理失败，请稍后重试' }
    }
  }

  /**
   *
   * 按 ERPClient 扫码入口一致的规则，先查询日计划下游子孙最新 NCR。
   * @remarks
   * - 这里只判断“已有单据是否应打开”，不参与草稿来源候选排序；\n
   * - 若查询失败，降级继续走草稿生成，避免扫码主流程被只读检查阻断。
   *
   */
  private async tryGetLatestNcrIdByDailyPlanScanCode(scanForCode: string): Promise<number> {
    const scan = String(scanForCode ?? '').trim()
    if (!scan) return 0

    try {
      const pack = await QualityApi.GetLatestDefectiveReworkOrderIdByDailyPlanScanCode({
        dbName: DEFAULT_DB_NAME,
        user: getErpUserFromStorage(),
        scanForCode: scan,
      })

      const successRaw = pickField<unknown>(pack, 'success', 'Success', 'isSuccess', 'issuccess')
      if (successRaw === false) return 0

      const data = unwrapDataContainer(pack) ?? {}
      const id = normalizePositiveInt(pickField<unknown>(data, 'Id', 'id'))
      return id ?? 0
    } catch (error) {
      console.warn('[NCR] 查询日计划下游最新不合格返工单失败，继续尝试生成草稿:', error)
      return 0
    }
  }

  /**
   *
   * 将 shared 扫码结果映射为 NCR 对外返回协议。
   *
   */
  private toNcrScanResult(
    r: ScanDocumentFlowResult<DefectiveReworkOrderDocument, DefectiveReworkOrderDetail>,
  ): NcrScanExecuteResult {
    switch (r.type) {
      case 'OPEN_BY_ID':
        return { type: 'OPEN_BY_ID', id: r.id }
      case 'NEED_PICK_FLOW_DETAIL':
        return { type: 'NEED_PICK_FLOW_DETAIL', scanCode: r.scanCode, candidates: r.candidates }
      case 'CREATED_BY_ID':
        return { type: 'ERROR', level: 'error', message: 'NCR 不应返回 CREATED_BY_ID' }
      case 'DRAFT_LOADED':
        return this.toNcrDraftLoadedResult(
          {
            success: true,
            message: r.message,
            data: {
              ...(r.rawData ?? {}),
              Document: r.document,
              Details: r.details,
            },
          },
          '未能生成不合格返工单',
        )
      case 'ERROR':
        return { type: 'ERROR', level: r.level, message: r.message }
    }
  }

  /**
   *
   * 将后端 NCR 草稿返回包转换为应用层扫码结果。
   *
   */
  private toNcrDraftLoadedResult(
    pack: unknown,
    fallbackMessage: string,
  ): NcrScanExecuteResult {
    const ok = Boolean(pickField<unknown>(pack, 'success', 'Success', 'isSuccess', 'issuccess'))
    const message = this.pickPackMessage(pack)
    if (!ok) {
      return {
        type: 'ERROR',
        level: 'error',
        message: message || fallbackMessage,
      }
    }

    const picked = pickDocumentAndDetails<DefectiveReworkOrderDocument, DefectiveReworkOrderDetail>(pack)
    if (!picked?.document) {
      return {
        type: 'ERROR',
        level: 'error',
        message: message || '后端返回草稿数据异常（缺少 Document）',
      }
    }

    const data = unwrapDataContainer(pack) ?? {}
    const checkDetailsRaw = pickField<unknown>(data, 'CheckDetails', 'checkDetails')
    const sourceFlowDetailIdRaw =
      pickField<unknown>(data, 'SourceFlowDetailId', 'sourceFlowDetailId') ??
      pickField<unknown>(picked.document as any, 'CreateByDetailid', 'createByDetailid')
    const sourceFlowDetailTypeRaw =
      pickField<unknown>(data, 'SourceFlowDetailType', 'sourceFlowDetailType') ??
      pickField<unknown>(picked.document as any, 'CreateByDetailType', 'createByDetailType')

    const sourceFlowDetailId = normalizePositiveInt(sourceFlowDetailIdRaw)
    const sourceFlowDetailType = typeof sourceFlowDetailTypeRaw === 'string'
      ? sourceFlowDetailTypeRaw.trim()
      : sourceFlowDetailTypeRaw == null
        ? ''
        : String(sourceFlowDetailTypeRaw).trim()

    return {
      type: 'DRAFT_LOADED',
      document: picked.document,
      details: picked.details,
      checkDetails: Array.isArray(checkDetailsRaw) ? (checkDetailsRaw as DefectiveReworkOrderCheckDetail[]) : [],
      ...(sourceFlowDetailId ? { sourceFlowDetailId } : {}),
      ...(sourceFlowDetailType ? { sourceFlowDetailType } : {}),
      message: message || picked.message,
    }
  }

  /**
   *
   * 提取 ApiMessagePack 的用户可见消息。
   *
   */
  private pickPackMessage(pack: unknown): string {
    const rootMessage = pickField<unknown>(pack, 'message', 'Message')
    if (typeof rootMessage === 'string') return rootMessage.trim()
    if (rootMessage != null) return String(rootMessage).trim()

    const data = unwrapDataContainer(pack)
    const dataMessage = pickField<unknown>(data, 'message', 'Message')
    if (typeof dataMessage === 'string') return dataMessage.trim()
    if (dataMessage != null) return String(dataMessage).trim()
    return ''
  }

  /**
   *
   * 通过职员扫码码查询职员（Employee.CodeForScan）。
   * @param scanCode 职员条码。
   *
   */
  private async findEmployeeByScanCode(scanCode: string): Promise<
    | { ok: true; employee: { id: number; name: string } }
    | { ok: false; reason: 'NOT_FOUND' | 'INVALID_EMPLOYEE_ID' }
  > {
    const code = String(scanCode ?? '').trim()
    if (!code) return { ok: false, reason: 'NOT_FOUND' }

    const rows = await fetchLookup(
      'Employee',
      ['id', 'Name', 'CodeForScan'],
      undefined,
      { where: { DeletedTag: 0, CodeForScan: code }, take: 1 },
    )
    const emp = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
    if (!emp) return { ok: false, reason: 'NOT_FOUND' }

    const empIdRaw = (emp as any)?.id ?? (emp as any)?.Id ?? (emp as any)?.ID
    const empId = normalizePositiveInt(empIdRaw)
    if (!empId) return { ok: false, reason: 'INVALID_EMPLOYEE_ID' }

    // 兼容不同后端序列化风格：可能返回 Name 或 name。
    const name = String((emp as any)?.Name ?? (emp as any)?.name ?? '').trim()
    return { ok: true, employee: { id: empId, name } }
  }

  /**
   *
   * 将模板中为 number/boolean 的字段做类型归一化。
   * @remarks
   * - number：把可解析的数字字符串转换为 number；NaN/Infinity/null 归零（避免后端反序列化失败）；\\n
   * - boolean：兼容 'true'/'false' 或 0/1。\\n
   *
   */
 private normalizePayloadTypesByTemplate<T extends Record<string, any>>(src: T, template: Record<string, any>): T {
 if (!src || typeof src !== 'object') return src
 const out: Record<string, any> = { ...(src as any) }
 for (const key of Object.keys(template ?? {})) {
 const templateValue = (template as any)[key]
 const currentValue = out[key]
 if (typeof templateValue === 'number') {
 if (typeof currentValue === 'string') {
 const trimmed = currentValue.trim()
 const n = Number(trimmed)
 out[key] = trimmed === '' ? 0 : Number.isFinite(n) ? n : 0
 } else if (typeof currentValue === 'number') {
 if (!Number.isFinite(currentValue)) out[key] = 0
 } else if (currentValue === null) {
 out[key] = 0
 }
 continue
 }
 if (typeof templateValue === 'boolean') {
 if (typeof currentValue === 'string') {
 const trimmed = currentValue.trim().toLowerCase()
 if (trimmed === 'true') out[key] = true
 else if (trimmed === 'false') out[key] = false
 } else if (typeof currentValue === 'number') {
 if (currentValue === 0) out[key] = false
 else if (currentValue === 1) out[key] = true
 }
 }
 }
 return out as T
 }

/**
 *
 * 规范化 Base64：兼容 dataURL、空白、base64url 与 padding。
 * @param input 输入 base64 或 dataURL。
 *
 */
  private normalizeBase64(input: string): string {
    let value = String(input ?? '').trim()
    if (!value) return value

    // 兼容 dataURL: data:image/png;base64,xxxx
    if (value.startsWith('data:')) {
      const comma = value.indexOf(',')
      if (comma >= 0) value = value.slice(comma + 1)
    }

    // 兼容 Android/服务端可能出现的换行/空白
    value = value.replace(/\s+/g, '')

    // 兼容 base64url（URL_SAFE）：-_ → +/
    value = value.replace(/-/g, '+').replace(/_/g, '/')

    // 规范化 padding
    const mod = value.length % 4
    if (mod === 2) value = `${value}==`
    else if (mod === 3) value = `${value}=`
    else if (mod === 1) throw new Error('图片Base64格式不正确')

    return value
  }

  /**
   *
   * 推断文件后缀：优先从文件名取扩展名，其次从 mime 推断。
   *
   */
 private inferSuffixFromNameOrMime(fileName: string, mime?: string): string {
 const name = String(fileName ?? '').trim()
 const dot = name.lastIndexOf('.')
 if (dot > 0 && dot < name.length - 1) return name.slice(dot + 1).toLowerCase()
 const m = String(mime ?? '').toLowerCase()
 if (m.includes('png')) return 'png'
 if (m.includes('gif')) return 'gif'
 if (m.includes('webp')) return 'webp'
 if (m.includes('bmp')) return 'bmp'
 if (m.includes('jpeg') || m.includes('jpg')) return 'jpg'
 return 'jpg'
 }

/**
 *
 * 构造默认文件名（当来源缺失文件名时使用）。
 *
 */
 private buildDefaultFileName(index: number, suffix: string): string {
 const safeSuffix = String(suffix ?? '').trim().replace(/^\./, '') || 'jpg'
 const ts = Date.now()
 return `ncr_${ts}_${index + 1}.${safeSuffix}`
 }

/**
 *
 * 将本地照片证据列表转换为后端所需的 FileRecordForNcr 列表。
 * @param localPhotos 待上传的本地照片列表。
 *
 */
  private async buildFilesForUpload(localPhotos: readonly NcrLocalPhotoEvidenceItem[]): Promise<FileRecordForNcr[]> {
    const files: FileRecordForNcr[] = []
    for (let i = 0; i < localPhotos.length; i += 1) {
      const photo = localPhotos[i]
      const localFile = (photo as any)?.localFile as File | undefined

      let base64: string | null = null
      let mime: string | undefined

      // 1) PC：优先读取本地 File
      if (typeof File !== 'undefined' && localFile instanceof File) {
        const read = await readFileBase64(localFile)
        if (!read?.base64) {
          throw new Error('读取本地文件失败')
        }
        base64 = read.base64
        mime = read.mime
      } else {
        // 2) Android/其它：走 image-loader（兼容 uri/path/id）
        const loadResult = await loadImageBase64(photo as ErpImageItem, { type: 'original', maxDim: 2048 })
        if (!loadResult.success || !loadResult.base64) {
          const msg = String(loadResult.message ?? '读取图片失败')
          throw new Error(msg)
        }
        base64 = loadResult.base64
        mime = loadResult.mime ?? undefined
      }

      if (!base64) {
        throw new Error('读取图片失败')
      }
      base64 = this.normalizeBase64(base64)

      const nameRaw = String((photo as any)?.fileName ?? (photo as any)?.name ?? localFile?.name ?? '').trim()
      const suffix = this.inferSuffixFromNameOrMime(nameRaw, mime)
      const fileName = nameRaw || this.buildDefaultFileName(i, suffix)

      const rec = new FileRecordForNcr()
      rec.initDefaults()
      rec.Billid = 0
      rec.CloudFileid = 0
      rec.FileName = fileName
      // ERPClient 侧图片判断要求后缀含点（.png/.jpg/...），此处统一规范化，避免跨端显示不一致
      rec.Suffix = suffix.startsWith('.') ? suffix : `.${suffix}`
      rec.FileDescription = ''
      ;(rec as any).Bytes = base64
      files.push(rec)
    }
    return files
  }
}

/**
 *
 * 从 localStorage 中读取 ERP 用户信息。
 * @remarks
 * - 优先读取键 'erp:userInfo'，其次兼容 'userInfo'；\\n
 * - SSR/异常场景返回空对象；\\n
 * - 保持与既有质量模块一致。\\n
 *
 */
 function getErpUserFromStorage(): UserInfo {
 if (typeof window === 'undefined') return {}
 try {
 const raw = window.localStorage.getItem('erp:userInfo') ?? window.localStorage.getItem('userInfo')
 if (!raw) return {}
 const parsed = JSON.parse(raw)
 return parsed && typeof parsed === 'object' ? (parsed as UserInfo) : {}
 } catch {
 return {}
 }
 }

/**
 *
 * 读取 File 为 base64（浏览器环境）。
 * @param file 本地 File 对象。
 *
 */
async function readFileBase64(file: File): Promise<{ base64: string; mime?: string } | null> {
  if (!file) return null
  if (typeof FileReader === 'undefined') return null
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        resolve(null)
        return
      }
      const comma = result.indexOf(',')
      const base64 = comma >= 0 ? result.slice(comma + 1) : result
      resolve({ base64, mime: file.type || undefined })
    }
    reader.onerror = () => resolve(null)
    try {
      reader.readAsDataURL(file)
    } catch {
      resolve(null)
    }
  })
}

/**
 *
 * 从保存返回包中提取单据主键（兼容多种返回结构）。
 * @remarks
 * - 对齐既有 ncrService.extractNcrBillId 的容错范围；\\n
 * - 兼容 DbChangedPackResult/ApiMessagePack 等多种结构。\\n
 *
 */
function extractBillId(result: unknown): number | null {
 if (!result || typeof result !== 'object') return null
 const pack = result as Record<string, unknown> & { objects?: Record<string, unknown> | null }
 const candidates: unknown[] = [
 (pack as any).billId,
 (pack as any).BillId,
 (pack as any).billid,
 (pack as any).objects?.billId,
 (pack as any).objects?.BillId,
 (pack as any).objects?.billid,
 (pack as any).objects?.id,
 (pack as any).objects?.Id,
 (pack as any).objects?.ID,
 ]
 for (const v of candidates) {
 const n = typeof v === 'number' ? v : Number(v)
 if (Number.isFinite(n) && n > 0) return n
 }
 return null
 }

/**
 *
 * 将保存阶段的异常/失败包统一为可展示结果。
 * @param error 原始异常或失败包。
 * @param fallback 默认失败文案。
 *
 */
function buildSaveFailureResult(error: unknown, fallback: string): NcrSaveResult {
  const resolved = resolveUserFacingErrorMessage(error, fallback)
  if (resolved !== fallback) {
    return { id: null, code: resolved, message: resolved }
  }

  const rawMessage = extractNumericSaveMessage(error)
  const message = rawMessage || resolved
  return { id: null, code: message, message }
}

/**
 *
 * 从保存返回包中提取数字型消息字段并转成可展示文本。
 * @param error 保存结果或异常对象。
 *
 */
function extractNumericSaveMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return ''
  const record = error as Record<string, unknown>
  for (const key of ['message', 'Message', 'errorMessage', 'ErrorMessage', 'msg', 'Msg']) {
    const raw = record[key]
    if (raw === undefined || raw === null) continue
    if (typeof raw === 'number' || typeof raw === 'boolean') {
      const text = String(raw).trim()
      if (text) return text
    }
  }
  return ''
}

/**
 *
 * 清理 NCR 明细中仅用于前端 UI 的元字段，避免后端保存时误入库。
 * @param src 原始明细对象。
 *
 */
function stripDetailMetaFields(src: unknown): Record<string, any> {
  const omit = new Set([
    '__localkey',
    'modifytime',
    'modifymode',
    'generatebyid',
    'parentmodifyid',
    'modifyemployeeid',
  ])
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries((src ?? {}) as Record<string, any>)) {
    if (omit.has(String(key).toLowerCase())) continue
    out[key] = value
  }
  return out
}
