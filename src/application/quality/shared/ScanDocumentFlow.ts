import { DEFAULT_DB_NAME } from '@/lib/config'
import { type ApiMessagePack, type UserInfo } from '@/lib/erp/bill-api'
import {
  FlowScanApi,
  FlowScanCheckState,
  type FlowScanDocumentKind,
  type FlowScanSourceType,
} from '@/lib/erp/flow-scan-api'
import {
  enrichFlowDetailCandidates,
  parseFlowDetailsFromCheckDocumentStateData,
  pickUnapprovedDocumentIdAcrossFlowDetails,
  type FlowDetailCandidate,
} from '@/application/quality/shared/flowDetailCandidates'
import { pickDocumentAndDetails, pickField, unwrapDataContainer } from '@/application/quality/shared/apiMessagePack'
import { extractErrorMessage, normalizePositiveInt } from '@/application/quality/shared/billCommon'

/**
 *
 * 扫码流程结果。
 *
 */
export type ScanDocumentFlowResult<TDoc, TDetail> =
  | { readonly type: 'OPEN_BY_ID'; readonly id: number }
  | { readonly type: 'NEED_PICK_FLOW_DETAIL'; readonly scanCode: string; readonly candidates: FlowDetailCandidate[] }
  | { readonly type: 'DRAFT_LOADED'; readonly document: TDoc | null; readonly details: TDetail[]; readonly message?: string }
  | { readonly type: 'CREATED_BY_ID'; readonly id: number; readonly message?: string }
  | { readonly type: 'ERROR'; readonly level: 'warning' | 'error'; readonly message: string }

/**
 *
 * 扫码来源配置。
 *
 */
export type ScanSourceConfig = {
  readonly sourceType: FlowScanSourceType
  /** 规范化扫码内容（如提取 JCJH-\d{12}）。 */
  readonly normalizeCode?: (raw: string) => string
  /** 日志前缀（如 [FAI]/[FQC]/[NCR]）。 */
  readonly logTag: string
}

/**
 *
 * 按工序明细创建草稿。
 *
 */
export type CreateDraftByFlowDetail<TDoc, TDetail, TContext = unknown> = (args: {
  readonly user: UserInfo
  readonly flowDetailTableName: string
  readonly flowDetailId: number
  readonly scanCode: string
  readonly context?: TContext
}) => Promise<ApiMessagePack<{ Document?: TDoc | null; Details?: TDetail[] }>>

/**
 *
 * 草稿策略：返回 document+details 或 created-id。
 *
 */
export type DraftResultStrategy<TDoc, TDetail> =
  | { readonly mode: 'document-and-details' }
  | {
      readonly mode: 'created-id'
      readonly pickId: (pack: ApiMessagePack<unknown>) => number
    }

/**
 *
 * 扫码流程文案配置（用于各业务服务差异化提示）。
 *
 */
export type ScanDocumentFlowMessages = {
  readonly queryFailed?: string
  readonly noFlowDetail?: string
  readonly createFailed?: string
  readonly invalidCreatedId?: string
  readonly invalidFlowDetail?: string
  readonly scanFailed?: string
}

/**
 *
 * 扫码流程级别配置（用于各业务服务差异化错误等级）。
 *
 */
export type ScanDocumentFlowLevels = {
  readonly noFlowDetail?: 'warning' | 'error'
  readonly createFailed?: 'warning' | 'error'
}

/**
 *
 * 通用扫码 -> 候选 -> 生成草稿 流程编排。
 * @remarks
 * - 不抛异常，统一返回结构化结果；
 * - 通过 `draftStrategy` 兼容 FAI/FQC（文档草稿）与 NCR（仅返回 id）。
 *
 */
export class ScanDocumentFlow<TDoc, TDetail, TContext = unknown> {
  public constructor(
    private readonly config: {
      readonly documentKind: FlowScanDocumentKind
      readonly targetDocumentTableName: string
      readonly getUser: () => UserInfo
      readonly createDraft: CreateDraftByFlowDetail<TDoc, TDetail, TContext>
      readonly draftStrategy: DraftResultStrategy<TDoc, TDetail>
      readonly messages?: ScanDocumentFlowMessages
      readonly levels?: ScanDocumentFlowLevels
    },
  ) {}

  /**
   *
   * 扫码共用入口（支持三种来源）。
   *
   */
  public async run(args: {
    readonly scanForCode: string
    readonly source: ScanSourceConfig
    readonly pickedFlowDetail?: { tableName: string; id: number } | null
    readonly context?: TContext
  }): Promise<ScanDocumentFlowResult<TDoc, TDetail>> {
    const raw = String(args.scanForCode ?? '').trim()
    if (!raw) return { type: 'ERROR', level: 'warning', message: '扫描内容为空' }

    const scanCode = this.normalizeScanCode(raw, args.source)
    const user = this.config.getUser()
    const picked = this.normalizePickedFlowDetail(args.pickedFlowDetail)

    if (args.pickedFlowDetail && !picked) {
      return {
        type: 'ERROR',
        level: 'error',
        message: this.config.messages?.invalidFlowDetail ?? '工序明细参数不合法',
      }
    }

    if (!picked) {
      return this.runWithoutPicked({ scanCode, source: args.source, user, context: args.context })
    }
    return this.runWithPicked({ scanCode, source: args.source, user, picked, context: args.context })
  }

  private normalizeScanCode(raw: string, source: ScanSourceConfig): string {
    if (!source.normalizeCode) return raw
    const next = String(source.normalizeCode(raw) ?? '').trim()
    return next || raw
  }

  private normalizePickedFlowDetail(
    picked: { tableName: string; id: number } | null | undefined,
  ): { tableName: string; id: number } | null {
    if (!picked) return null
    const tableName = String(picked.tableName ?? '').trim()
    const id = normalizePositiveInt(picked.id)
    if (!tableName || !id) return null
    return { tableName, id }
  }

  private async runWithoutPicked(input: {
    readonly scanCode: string
    readonly source: ScanSourceConfig
    readonly user: UserInfo
    readonly context?: TContext
  }): Promise<ScanDocumentFlowResult<TDoc, TDetail>> {
    try {
      const checkPack = await this.callCheckDocumentState(input)
      const ok = this.pickSuccess(checkPack)
      const msg = this.pickMessage(checkPack)

      if (!ok) {
        return {
          type: 'ERROR',
          level: 'error',
          message: msg || this.config.messages?.queryFailed || '查询流程卡工序明细失败',
        }
      }

      const data = unwrapDataContainer(checkPack)
      const flowDetails = parseFlowDetailsFromCheckDocumentStateData(data)
      if (flowDetails.length === 0) {
        return {
          type: 'ERROR',
          level: this.config.levels?.noFlowDetail ?? 'warning',
          message: msg || this.config.messages?.noFlowDetail || '未找到可检验工序或无需生成单据',
        }
      }

      if (flowDetails.length > 1) {
        const unapprovedId = pickUnapprovedDocumentIdAcrossFlowDetails(
          data,
          flowDetails,
          this.config.targetDocumentTableName,
        )
        if (unapprovedId > 0) return { type: 'OPEN_BY_ID', id: unapprovedId }

        const candidates = await enrichFlowDetailCandidates(flowDetails)
        return { type: 'NEED_PICK_FLOW_DETAIL', scanCode: input.scanCode, candidates }
      }

      const only = flowDetails[0]
      const unapprovedId = pickUnapprovedDocumentIdAcrossFlowDetails(data, [only], this.config.targetDocumentTableName)
      if (unapprovedId > 0) return { type: 'OPEN_BY_ID', id: unapprovedId }

      return this.createFromFlowDetail(input.user, input.scanCode, only.tableName, only.id, msg, input.context)
    } catch (error) {
      console.error(`${input.source.logTag} 扫码查询流程卡工序明细失败:`, error)
      return {
        type: 'ERROR',
        level: 'error',
        message: this.config.messages?.scanFailed || '扫码处理失败',
      }
    }
  }

  private async runWithPicked(input: {
    readonly scanCode: string
    readonly source: ScanSourceConfig
    readonly user: UserInfo
    readonly picked: { tableName: string; id: number }
    readonly context?: TContext
  }): Promise<ScanDocumentFlowResult<TDoc, TDetail>> {
    try {
      try {
        const checkPack = await this.callCheckDocumentState(input)
        if (this.pickSuccess(checkPack)) {
          const data = unwrapDataContainer(checkPack)
          const unapprovedId = pickUnapprovedDocumentIdAcrossFlowDetails(
            data,
            [{ tableName: input.picked.tableName, id: input.picked.id }],
            this.config.targetDocumentTableName,
          )
          if (unapprovedId > 0) return { type: 'OPEN_BY_ID', id: unapprovedId }
        }
      } catch {
        // ignore: 查询失败时继续尝试创建草稿
      }

      return this.createFromFlowDetail(input.user, input.scanCode, input.picked.tableName, input.picked.id, undefined, input.context)
    } catch (error) {
      console.error(`${input.source.logTag} 按流程卡工序明细生成草稿失败:`, error)
      return {
        type: 'ERROR',
        level: 'error',
        message: this.config.messages?.scanFailed || '扫码处理失败',
      }
    }
  }

  private async createFromFlowDetail(
    user: UserInfo,
    scanCode: string,
    flowDetailTableName: string,
    flowDetailId: number,
    fallbackMessage?: string,
    context?: TContext,
  ): Promise<ScanDocumentFlowResult<TDoc, TDetail>> {
    try {
      const pack = await this.config.createDraft({ user, flowDetailTableName, flowDetailId, scanCode, context })
      const message = this.pickMessage(pack)
      if (this.config.draftStrategy.mode === 'document-and-details') {
        const picked = pickDocumentAndDetails<TDoc, TDetail>(pack)
        if (picked) return { type: 'DRAFT_LOADED', ...picked }
        return {
          type: 'ERROR',
          level: this.config.levels?.createFailed ?? 'warning',
          message: message || fallbackMessage || this.config.messages?.noFlowDetail || '未找到可检验工序或无需生成单据',
        }
      }

      const ok = this.pickSuccess(pack)
      if (!ok) {
        return {
          type: 'ERROR',
          level: this.config.levels?.createFailed ?? 'warning',
          message: message || this.config.messages?.createFailed || '未能生成单据',
        }
      }

      const id = normalizePositiveInt(this.config.draftStrategy.pickId(pack as ApiMessagePack<unknown>))
      if (!id) {
        return {
          type: 'ERROR',
          level: 'error',
          message: this.config.messages?.invalidCreatedId || '后端返回单据ID异常，无法打开',
        }
      }
      return { type: 'CREATED_BY_ID', id, message: message || undefined }
    } catch (error) {
      const msg = extractErrorMessage(error)
      const fallback = this.config.messages?.scanFailed || this.config.messages?.createFailed || '生成草稿失败'
      return {
        type: 'ERROR',
        level: 'error',
        message: fallback || msg || '生成草稿失败',
      }
    }
  }

  private async callCheckDocumentState(input: {
    readonly scanCode: string
    readonly source: ScanSourceConfig
    readonly user: UserInfo
  }): Promise<ApiMessagePack<unknown>> {
    return FlowScanApi.CheckDocumentState({
      dbName: DEFAULT_DB_NAME,
      user: input.user,
      sourceType: input.source.sourceType,
      scanForCode: input.scanCode,
      sourceDetailId: 0,
      documentKind: this.config.documentKind,
      state: FlowScanCheckState.PrevCompletedCurrentUnfinished,
      includeTableRecords: true,
    })
  }

  private pickSuccess(pack: unknown): boolean {
    const raw = pickField<unknown>(pack, 'success', 'Success', 'isSuccess', 'issuccess')
    return Boolean(raw)
  }

  private pickMessage(pack: unknown): string {
    const rootMessage = pickField<unknown>(pack, 'message', 'Message')
    if (typeof rootMessage === 'string') return rootMessage.trim()
    if (rootMessage != null) return String(rootMessage).trim()

    const data = unwrapDataContainer(pack)
    const dataMessage = pickField<unknown>(data, 'message', 'Message')
    if (typeof dataMessage === 'string') return dataMessage.trim()
    if (dataMessage != null) return String(dataMessage).trim()
    return ''
  }
}
