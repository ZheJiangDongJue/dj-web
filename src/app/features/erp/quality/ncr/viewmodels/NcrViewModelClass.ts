import { useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createDocumentActions } from '@/lib/documents/DocumentActionsStore'
import { createRequiredFieldManager, type RequiredFieldRegistration, type RequiredFieldManager } from '@/lib/validation/requiredFieldManager'
import { QualityDocumentBase } from '../../shared/QualityDocumentBase'
import { handleScanResultPayload } from '@/app/features/erp/quality/shared/scanEntry'
import type { ScanResultPayload } from '@/lib/android-bridge'
import { focusComboboxByAriaLabel } from '@/lib/dom/focusCombobox'
import { toNumericId, type DocumentService } from '@/app/features/erp/shared/DocumentBase'
import { hasStatusFlag, parseDocumentStatus } from '../../shared/helpers'
import { fetchActiveEmployees } from '@/lib/erp/employee'
import { fetchWorkTypes } from '@/lib/erp/type-of-work'
import type { DebugMenuItem } from '@/components/molecules/DebugFab'
import { DEFAULT_DB_NAME } from '@/lib/config'
import { formatActionErrorMessage } from '@/lib/errors/user-facing-error'
import { NcrApplicationService, type NcrScanExecuteResult, type NcrScanFlowDetailCandidate } from '@/application/quality/ncr/NcrApplicationService'
import { AppServicesContext, NcrApplicationServiceToken } from '@/infrastructure/di/AppServicesProvider'
import { DefectiveReworkOrderRepositoryImpl } from '@/infrastructure/repositories/quality/DefectiveReworkOrderRepositoryImpl'
import { DocumentStatus, DefectiveReworkOrderDetail, DefectiveReworkOrderDocument, type IFile } from '@/types/erp-db.generated'
import type { ErpImageItem } from '@/lib/image-loader'
import { mapFilesToErpImageItems } from '../types/photoEvidence'
import { GeneralApi, type QueryInput } from '@/lib/erp/general-api'
import { fetchLookup } from '@/lib/erp/lookup-core'
import {
  fetchReworkFlowDetailOptionsFromUpstreamFlowCard,
  resolveUpstreamFlowDetailIdFromDocumentBase,
  shouldRequireReworkFlowDetailFromDirectUpstream,
} from '../../shared/reworkFlowDetailOptions'

/**
 *
 * 下拉选项的标准结构。
 *
 */
export type SelectOption = import('../../shared/reworkFlowDetailOptions').SelectOption

/**
 * 返工工序切换时来源草稿接口返回的“无候选来源”消息。
 *
 * 该消息在扫码生成 NCR 时仍然需要提示；仅在返工工序切换的来源草稿刷新场景静默。
 */
const NO_ELIGIBLE_REWORK_DRAFT_MESSAGE = '未找到可生成不合格返工单的检验单（需满足：已审批 + 不合格 + 未生成返工单）'

/**
 * 判断来源草稿刷新结果是否属于返工路线切换时无需展示的无候选提示。
 * @param message 应用层返回的错误消息。
 * @returns 与目标消息一致时返回 true。
 */
function isSilentReworkDraftReloadMessage(message: unknown): boolean {
  return typeof message === 'string' && message.trim() === NO_ELIGIBLE_REWORK_DRAFT_MESSAGE
}

/**
 *
 * NCR “本地照片证据”图片项（与 image-loader 的 ErpImageItem 兼容）。
 * @remarks
 * - localFile/localObjectUrl 仅在 PC 浏览器选择文件时存在；Android 端通常通过 uri/path/id 等字段识别。\\n
 *
 */
export type LocalErpImageItem = ErpImageItem & {

  localFile?: File
  /**
   *
   * PC 浏览器生成的 objectURL（可选，用于预览；需在移除时释放）。
   *
   */
  localObjectUrl?: string
}

/**
 *
 * 构造 NCR 表头默认对象。
 * @remarks
 * - 使用 erp-db.generated 生成的 DTO class，并调用 initDefaults 初始化默认值。\\n
 *
 */
function createEmptyNcrDocument(): DefectiveReworkOrderDocument {
  const doc = new DefectiveReworkOrderDocument();
  doc.initDefaults();
  return doc;
}

/**
 *
 * 构造 NCR 明细默认对象。
 *
 */
function createEmptyNcrDetail(): DefectiveReworkOrderDetail {
  const detail = new DefectiveReworkOrderDetail();
  detail.initDefaults();
  return detail;
}

/**
 *
 * NCR 视图模型（类）。
 * @remarks
 * - 模仿 FQC 的实现方案：采用“类实例 + 外部订阅（useSyncExternalStore）”架构；\\n
 * - 下沉服务/流程至 ViewModel，页面仅负责渲染与事件绑定；\\n
 * - 复用 QualityDocumentBase（保存/审批/反审批/删除等通用流程）。\\n
 *
 */
export class NcrViewModel extends QualityDocumentBase<DefectiveReworkOrderDocument, DefectiveReworkOrderDetail> {
  public static __djScanListenerKey = 'dj-web:quality:ncr'

  /**
   *
   * 当前单据表头（Bill）。
   *
   */
  public bill: DefectiveReworkOrderDocument

  /**
   *
   * 当前单据明细列表（Details）。
   *
   */
  public details: DefectiveReworkOrderDetail[] = []

  /**
   *
   * 加载中标记（与 DocumentActions.loading 同步）。
   *
   */
  public loading = false

  /**
   *
   * 当前单据主键（与 DocumentActions.id 同步）。
   *
   */
  public currentId: number | null = null

  /**
   *
   * 当前单据的标准化状态值。
   * @remarks
   * - 始终从 bill.status 推导，避免出现重复状态源。\\n
   *
   */
  private get currentStatus(): number {
    return parseDocumentStatus((this.bill as any)?.status ?? (this.bill as any)?.Status)
  }

  /**
   *
   * 必填项管理器（供 View 注册字段校验）。
   *
   */
  public required: RequiredFieldManager<unknown> = createRequiredFieldManager<unknown>()

  /**
   *
   * 检验员下拉选项列表。
   *
   */
  public inspectorOptions: SelectOption[] = []

  /**
   *
   * 工种下拉选项列表（单据头：工种）。
   *
   */
  public processOptions: SelectOption[] = []

  /**
   *
   * 返工工序下拉选项列表（流程卡明细候选，value=明细id）。
   * @remarks
   * - 对齐 ERPClient：返工工序/返工工序2 保存的是“流程卡明细 id”，不是工种(TypeofWork)。\\n
   *
   */
  public badProcessOptions: SelectOption[] = []

  /**
   *
   * 来源草稿刷新进行中标记。
   * @remarks
   * - 返工工序切换会按后端默认规则重新生成草稿；\\n
   * - 用于避免用户在刷新过程中连续切换返工工序。\\n
   *
   */
  public sourceDraftReloadBusy = false

  /**
   *
   * “返工工序”是否需要按运行时必填样式提示。
   * @remarks
   * - 当 NCR 直接关联来源流程卡明细时，头部“返工工序”显示红色；
   * - 该状态只影响 UI 提示颜色，具体保存/审批校验仍由前后端业务规则兜底。
   *
   */
  public isReworkFlowDetailRequired = false

  /**
   *
   * 判定结果下拉选项列表。
   *
   */
  public judgeOptions: SelectOption[] = [
    { label: '合格', value: '1' },
    { label: '不合格', value: '4' },
    { label: '让步接收', value: '2' },
  ]

  /**
   *
   * 当前单据的物料编码（展示用）。
   * @remarks
   * - 后端可能不会返回 MaterialCode，需要通过 Materialid 联查 Material.Code；\\n
   * - 该字段仅用于 UI 展示，不写入后端保存 payload。
   *
   */
  public materialCode = ''

  /**
   *
   * 物料编码缓存：Material.id -> Material.Code
   *
   */
  private materialIndex: Record<string, string> = {}

  /**
   *
   * 物料编码加载序号（用于防止并发请求回写过期结果）。
   *
   */
  private materialCodeFetchSeq = 0
  private processOptionsFetchSeq = 0

  /**
   *
   * 当前单据的“远程照片证据”附件列表。
   * @remarks
   * - 仅包含存在于服务器（CloudFile）中的图片文件；\\n
   * - 前端通过 image-loader/loadImageBase64 基于 dbName + cloudFileId 异步获取 base64 进行预览。\\n
   *
   */
  public serverPhotoEvidence: ErpImageItem[] = []

  /**
   *
   * 当前会话中尚未保存到服务器的“本地照片证据”列表。
   * @remarks
   * - Android：来自高级图片选择器（uri/path/id 等信息）；\\n
   * - PC：来自 input[type=file]（包含 localFile/localObjectUrl）。\\n
   *
   */
  public localPhotoEvidence: LocalErpImageItem[] = []

  /**
   *
   * 日计划扫码存在多条“当前工序明细”时的待选列表（用于弹窗选择）。
   *
   */
  public pendingDailyPlanFlowDetailPick: { scanCode: string; candidates: NcrScanFlowDetailCandidate[] } | null = null

  /**
   *
   * 日计划扫码“选择并生成”进行中标记（用于禁用弹窗按钮）。
   *
   */
  public dailyPlanPickBusy = false

  /**
   *
   * 当前草稿对应的来源流程卡明细表名（用于返工工序切换后重新生成草稿）。
   *
   */
  private currentSourceFlowDetailTableName = ''

  /**
   *
   * 当前草稿对应的来源流程卡明细主键（用于返工工序切换后重新生成草稿）。
   *
   */
  private currentSourceFlowDetailId: number | null = null

  /**
   *
   * “返工工序”运行时必填状态加载序号。
   * @remarks
   * - 单据切换/刷新可能并发触发多次异步查询；
   * - 使用序号丢弃过期回写，避免旧单据的红色提示串到新单据。
   *
   */
  private reworkFlowDetailRequiredFetchSeq = 0

  /**
   *
   * 操作进行中标记由 DocumentBase 提供（this.actionBusy / this.busyActionName），
   * 通过 runBusyAction 在远程操作期间统一维护，避免在各子类重复实现门闩。
   *
   */

  /**
   *
   * NCR 应用层服务（用例编排入口）。
   *
   */
  private readonly appService: NcrApplicationService

  /**
   *
   * 调试菜单项（供 DebugFab 渲染）。
   *
   */
  public debugMenu: DebugMenuItem[] = []

  /**
   *
   * 标准化字段名的模板（仅取键名，不会被修改）。
   *
   */
  private static readonly docNormalizeTemplate = (() => createEmptyNcrDocument())()

  /**
   *
   * 标准化字段名的明细模板（仅取键名，不会被修改）。
   *
   */
  private static readonly detailNormalizeTemplate = (() => createEmptyNcrDetail())()

  /**
   *
   * 本地明细行 key 自增种子（仅用于前端列表稳定性）。
   *
   */
  private static detailLocalKeySeed = 0

  /**
   *
   * 构造 NCR ViewModel。
   * @param appService NCR 应用层服务。
   *
   */
  constructor(appService: NcrApplicationService) {
    // 以占位配置初始化，随后在运行期通过 configure/bridge 建立联动
    super({
      service: {
        save: async () => ({}),
        approve: async () => ({} as any),
        unapprove: async () => ({} as any),
        /**
         *
         * 删除当前 NCR 单据。
         * @remarks
         * - 仅用于开启删除能力的门闩；实际删除仍经由 DocumentActions.remove。\\n
         *
         */
        remove: async (id: number) => {
          return appService.delete(Number(id))
        },

        /**
         *
         * 按 ID 获取 NCR 表头+明细（供 DocumentBase.refresh/openById 使用）。
         *
         */
        fetchById: async (id: number) => {
          return appService.fetchById(Number(id))
        },
        extractId: () => 0,
      } as unknown as DocumentService<DefectiveReworkOrderDocument, DefectiveReworkOrderDetail>,
      createEmptyDocument: createEmptyNcrDocument,
      createInitialDetails: () => [],
      deriveStatus: (doc) => parseDocumentStatus((doc as any)?.status ?? (doc as any)?.Status),
      hasStatusFlag,
      statusFlagConfig: {
        frozen: DocumentStatus.已冻结,
        closed: DocumentStatus.已结案,
        voided: DocumentStatus.已作废,
        approved: DocumentStatus.已审批,
        unapproved: DocumentStatus.未审批,
      },
      validateBeforeApprove: () => {
        const b = this.bill as any
        const emp = Number(b?.Employeeid)
        if (!Number.isFinite(emp) || emp <= 0) {
          try { toast.warning('请先填写：检验员') } catch { }
          try { focusComboboxByAriaLabel('检验员') } catch { }
          return false
        }
        const proc = Number(b?.TypeofWorkid)
        if (!Number.isFinite(proc) || proc <= 0) {
          try { toast.warning('请先填写：工种') } catch { }
          try { focusComboboxByAriaLabel('工种') } catch { }
          return false
        }
        const list = Array.isArray(this.details) ? this.details : []
        if (list.length <= 0) {
          try { toast.warning('请至少填写：不合格记录（至少 1 行）') } catch { }
          if (typeof window !== 'undefined') {
            try {
              const el = document.querySelector<HTMLElement>('[aria-label="新增明细"]')
              if (el) {
                try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }) } catch { }
                try { el.focus() } catch { }
              }
            } catch { }
          }
          return false
        }
        for (let i = 0; i < list.length; i++) {
          const it = list[i] as any
          const s = String(it?.Adversesituation ?? '').trim()
          if (s === '') {
            try { toast.warning(`请先填写：第${i + 1}行 - 记录`) } catch { }
            if (typeof window !== 'undefined') {
              try {
                const selector = `[aria-label="第${i + 1}行-记录"]`
                const el = document.querySelector<HTMLElement>(selector)
                if (el) {
                  try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }) } catch { }
                  try { el.focus() } catch { }
                }
              } catch { }
            }
            return false
          }
        }
        // 照片证据：审批前必须至少有 1 张（已保存到服务器或当前会话本地选择均视为有效）。
        const serverPhotos = Array.isArray(this.serverPhotoEvidence) ? this.serverPhotoEvidence : []
        const localPhotos = Array.isArray(this.localPhotoEvidence) ? this.localPhotoEvidence : []
        if (serverPhotos.length + localPhotos.length <= 0) {
          try { toast.warning('请先上传：照片证据') } catch { }
          if (typeof window !== 'undefined') {
            try {
              const el = document.querySelector<HTMLElement>('[title=\"添加照片\"]')
              if (el) {
                try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }) } catch { }
                try { el.focus() } catch { }
              }
            } catch { }
          }
          return false
        }
        return true
      },
      autoRefreshAfterSave: true,
      refreshAfterApprove: false,
      refreshAfterUnapprove: false,
      onAfterSave: async (id) => {
        const n = typeof id === 'number' ? id : Number(id)
        if (Number.isFinite(n) && n > 0) {
          // 审批/保存后的照片证据补拉不应阻塞主流程；改为后台刷新，避免“审批中”提示被长请求拖住。
          void this.loadServerPhotoEvidence(n)
        }
      },
      // 刷新后确保界面与服务端同步，并补齐显示字段
      onAfterRefresh: async ({ document, details }, ctx) => {
        if (ctx && !ctx.isActive()) return
        await this.enrichAfterRefresh(document, Array.isArray(details) ? details : [])
      },
      initialId: null,
      statusApprovedValue: DocumentStatus.已审批,
      statusUnapprovedValue: DocumentStatus.未审批,
    })
    this.appService = appService
    // 初始化本地状态
    this.bill = createEmptyNcrDocument()
    this.details = []
    // 建立非 Hook 的动作对象
    const actions = createDocumentActions({
      initialId: null,
      onStateChange: (s) => { this.loading = !!s.loading; this.currentId = toNumericId(s.id as any); this.emit() },
      callSave: async () => {
        const res = await this.appService.save({
          bill: this.bill,
          details: this.details,
          localPhotoEvidence: this.localPhotoEvidence,
        })
        if (res.clearLocalPhotoEvidence) {
          // 上传成功：清理本地照片证据，避免后续重复上传
          this.clearLocalPhotoEvidence()
        }
        return { id: res.id, code: res.code, message: res.message ?? res.code }
      },
      callApprove: async (id) => {
        return this.appService.approve(Number(id), { bill: this.bill, details: this.details })
      },
      callUnapprove: async (id) => {
        return this.appService.unapprove(Number(id), { bill: this.bill, details: this.details })
      },
      callDelete: async (id) => {
        return this.appService.delete(Number(id))
      },
    })
    // 绑定桥接：统一通过 bill.status 作为唯一状态来源
    this.bindBridge({
      getDocument: () => this.bill,
      getDetails: () => this.details,
      getStatus: () => this.currentStatus,
      getStatusRef: () => this.currentStatus,
      setDocument: (next) => {
        this.bill = next
        this.emit()
      },
      setDetails: (next) => { this.details = Array.isArray(next) ? next : []; this.emit() },
      setStatus: (next) => {
        const n = typeof next === 'number' ? next : Number(next as unknown)
        const resolved = Number.isFinite(n) && n !== 0 ? n : DocumentStatus.未审批
        this.bill = { ...(this.bill as any), status: resolved } as DefectiveReworkOrderDocument
        this.emit()
      },
      docActions: actions,
    })
  }

  /**
   *
   * 重置单据（新建/删除成功/取消新建等场景）。
   * @remarks
   * - 基类仅重置单据/明细/ID；NCR 还需要同步清空“照片证据”，避免残留上一单的预览。\\n
   *
   */
  public override reset(): void {
    super.reset()
    this.serverPhotoEvidence = []
    this.clearLocalPhotoEvidence()
    this.materialCode = ''
    this.clearSourceContext()
    this.ensureAtLeastOneDetailRow()
  }

  /**
   *
   * 新建（重置）单据。
   *
   */
  public createNewBill(): void {
    this.pendingDailyPlanFlowDetailPick = null
    this.dailyPlanPickBusy = false
    try {
      this.reset()
    } catch (err) {
      console.error('[NCR] 重置单据失败:', err)
    }
    // 新建单据时清空照片证据，防止残留上一单的附件预览。
    this.serverPhotoEvidence = []
    this.clearLocalPhotoEvidence()
    this.badProcessOptions = []
    this.clearSourceContext()
    this.emit()
  }

  /**
   *
   * 基于检验单生成 NCR 草稿（不落库），并加载到当前 ViewModel。
   * @param inspectionDocumentType 检验单类型（兼容：FAI/FQC/表名）。
   * @param inspectionDocumentId   检验单主键。
   * @returns 是否加载成功。
   *
   */
  public async createDraftByInspection(
    inspectionDocumentType: string,
    inspectionDocumentId: number,
  ): Promise<boolean> {
    const type = String(inspectionDocumentType ?? '').trim()
    const id = toNumericId(inspectionDocumentId)
    if (!type || !id) return false

    try {
      const result = await this.appService.createDraftByInspection({
        inspectionDocumentType: type,
        inspectionDocumentId: id,
      })

      if (!result.ok) {
        try { toast.error(result.message || '未能生成不合格返工单草稿') } catch { }
        return false
      }

      // 草稿是“新建态”：仅在生成成功且准备应用草稿数据时再重置，避免失败/异常时清空当前编辑态
      try { this.createNewBill() } catch { }

      // 草稿不落库：id 仍为空（currentId=null），但需要规范化字段名与 status 读法
      await this.enrichAfterRefresh(result.document as any, result.details as any)
      this.applySourceContext({
        type: 'DRAFT_LOADED',
        document: result.document,
        details: result.details,
        checkDetails: result.checkDetails,
        sourceFlowDetailId: result.sourceFlowDetailId,
        sourceFlowDetailType: result.sourceFlowDetailType,
      })
      await this.loadProcessOptions()
      this.currentId = null
      this.emit()
      return true
    } catch (error) {
      console.error('[NCR] 生成不合格返工单草稿失败:', error)
      try { toast.error(formatActionErrorMessage('生成草稿', error, '请稍后重试')) } catch { }
      return false
    }
  }

  /**
   *
   * 将后端返回的 NCR 草稿加载到当前页面（不落库）。
   * @param result 扫码用例返回的草稿结果。
   * @returns 是否加载成功。
   *
   */
  private async applyDraftLoadedResult(
    result: Extract<NcrScanExecuteResult, { type: 'DRAFT_LOADED' }>,
    options?: {
      /**
       *
       * 刷新来源草稿时保留用户已经选择的返工工序。
       *
       */
      readonly preserveReworkSelection?: {
        readonly reworkTypeofWorkId?: number | null
        readonly reworkTypeofWork2Id?: number | null
      }
    },
  ): Promise<boolean> {
    if (!result?.document) {
      try { toast.error('已生成草稿，但返回数据异常') } catch { }
      return false
    }

    try { this.createNewBill() } catch { }

    await this.enrichAfterRefresh(result.document as any, result.details as any)
    this.applySourceContext(result)

    const preserve = options?.preserveReworkSelection
    const reworkTypeofWorkId = toNumericId(preserve?.reworkTypeofWorkId)
    const reworkTypeofWork2Id = toNumericId(preserve?.reworkTypeofWork2Id)
    if (reworkTypeofWorkId || reworkTypeofWork2Id) {
      this.bill = {
        ...(this.bill as any),
        ...(reworkTypeofWorkId ? { ReworkTypeofWorkid: reworkTypeofWorkId } : {}),
        ...(reworkTypeofWork2Id ? { ReworkTypeofWork2id: reworkTypeofWork2Id } : {}),
      } as DefectiveReworkOrderDocument
    }

    await this.loadProcessOptions()

    this.currentId = null
    this.serverPhotoEvidence = []
    this.clearLocalPhotoEvidence()
    this.emit()
    return true
  }

  /**
   *
   * 清空来源上下文。
   * @remarks
   * - 用于新建/重置，避免上一张草稿的来源流程卡明细影响下一次刷新。\\n
   *
   */
  private clearSourceContext(): void {
    this.reworkFlowDetailRequiredFetchSeq += 1
    this.sourceDraftReloadBusy = false
    this.currentSourceFlowDetailTableName = ''
    this.currentSourceFlowDetailId = null
    this.isReworkFlowDetailRequired = false
  }

  /**
   *
   * 从单据头回填来源上下文。
   * @param document 单据头 DTO。
   *
   */
  private applySourceContextFromDocument(document: any): void {
    const flowDetailId = toNumericId(document?.CreateByDetailid ?? document?.createByDetailid)
    const flowDetailTableName = pickText(document?.CreateByDetailType ?? document?.createByDetailType)

    this.currentSourceFlowDetailId = flowDetailId || null
    this.currentSourceFlowDetailTableName = flowDetailTableName
  }

  /**
   *
   * 从草稿响应回填来源上下文。
   * @param result 后端草稿响应映射后的应用层结果。
   *
   */
  private applySourceContext(result: Extract<NcrScanExecuteResult, { type: 'DRAFT_LOADED' }>): void {
    const document = result.document as any
    const flowDetailId = toNumericId(
      result.sourceFlowDetailId ?? document?.CreateByDetailid ?? document?.createByDetailid,
    )
    const flowDetailTableName = pickText(
      result.sourceFlowDetailType ?? document?.CreateByDetailType ?? document?.createByDetailType,
    )

    this.currentSourceFlowDetailId = flowDetailId || null
    this.currentSourceFlowDetailTableName = flowDetailTableName
  }

  /**
   *
   * 刷新“返工工序”运行时必填提示状态。
   * @remarks
   * - 判断链路为：当前 NCR -> 上游检验/工序单据 -> 流程卡明细；
   * - 只影响头部标签颜色，不改变返工工序候选列表与保存 payload。
   * @param document 用于判断的单据头；默认使用当前 bill。
   *
   */
  private async refreshReworkFlowDetailRequiredState(document: any = this.bill): Promise<void> {
    const seq = ++this.reworkFlowDetailRequiredFetchSeq

    let required = false
    try {
      required = await shouldRequireReworkFlowDetailFromDirectUpstream(document)
    } catch {
      required = false
    }

    if (seq !== this.reworkFlowDetailRequiredFetchSeq) return
    if (this.isReworkFlowDetailRequired === required) return

    this.isReworkFlowDetailRequired = required
    this.emit()
  }

  /**
   *
   * 解析某个返工工序下拉值对应的流程卡明细表名与主键。
   * @remarks
   * - 下拉选项由 fetchReworkFlowDetailOptionsFromUpstreamFlowCard 写入 flowDetailTableName；\\n
   * - 兼容历史/测试数据缺少扩展字段时，回退到当前来源上下文或单据头 CreateByDetail*。\\n
   * @param flowDetailIdRaw 下拉值。
   *
   */
  private resolveReworkFlowDetailSelection(
    flowDetailIdRaw: unknown,
  ): { readonly flowDetailTableName: string; readonly flowDetailId: number } | null {
    const flowDetailIdInput =
      typeof flowDetailIdRaw === 'number' || typeof flowDetailIdRaw === 'string' || flowDetailIdRaw == null
        ? flowDetailIdRaw
        : String(flowDetailIdRaw)
    const flowDetailId = toNumericId(flowDetailIdInput)
    if (!flowDetailId) return null

    const option = (this.badProcessOptions ?? []).find((item) => String(item?.value ?? '') === String(flowDetailId))
    const tableFromOption = pickText((option as any)?.flowDetailTableName)
    if (tableFromOption) return { flowDetailTableName: tableFromOption, flowDetailId }

    if (this.currentSourceFlowDetailId === flowDetailId && this.currentSourceFlowDetailTableName) {
      return { flowDetailTableName: this.currentSourceFlowDetailTableName, flowDetailId }
    }

    const tableNames = Array.from(new Set(
      (this.badProcessOptions ?? [])
        .map((item) => pickText((item as any)?.flowDetailTableName))
        .filter(Boolean),
    ))
    if (tableNames.length === 1) {
      return { flowDetailTableName: tableNames[0], flowDetailId }
    }

    const billDetailId = toNumericId((this.bill as any)?.CreateByDetailid ?? (this.bill as any)?.createByDetailid)
    const billDetailTableName = pickText((this.bill as any)?.CreateByDetailType ?? (this.bill as any)?.createByDetailType)
    if (billDetailId === flowDetailId && billDetailTableName) {
      return { flowDetailTableName: billDetailTableName, flowDetailId }
    }

    return null
  }

  /**
   *
   * 从当前返工工序/返工工序2 中解析一个用于来源草稿刷新的流程卡明细。
   * @param preferredFlowDetailId 当前刚变更的返工工序明细 id，优先使用。
   *
   */
  private resolveAnySelectedReworkFlowDetail(
    preferredFlowDetailId?: number | null,
  ): { readonly flowDetailTableName: string; readonly flowDetailId: number } | null {
    const preferred = this.resolveReworkFlowDetailSelection(preferredFlowDetailId)
    if (preferred) return preferred

    const first = this.resolveReworkFlowDetailSelection(
      (this.bill as any)?.ReworkTypeofWorkid ?? (this.bill as any)?.reworkTypeofWorkid,
    )
    if (first) return first

    return this.resolveReworkFlowDetailSelection(
      (this.bill as any)?.ReworkTypeofWork2id ?? (this.bill as any)?.reworkTypeofWork2id,
    )
  }

  /**
   *
   * 获取当前两个返工工序选择的快照。
   * @returns 用于重拉草稿后恢复返工工序的快照。
   *
   */
  private getReworkSelectionSnapshot(): {
    readonly reworkTypeofWorkId: number | null
    readonly reworkTypeofWork2Id: number | null
  } {
    return {
      reworkTypeofWorkId: toNumericId((this.bill as any)?.ReworkTypeofWorkid ?? (this.bill as any)?.reworkTypeofWorkid) || null,
      reworkTypeofWork2Id: toNumericId((this.bill as any)?.ReworkTypeofWork2id ?? (this.bill as any)?.reworkTypeofWork2id) || null,
    }
  }

  /**
   *
   * 处理返工工序变更后的来源草稿刷新。
   * @remarks
   * - 返工工序指向新的来源流程卡明细后，按后端默认候选重新生成草稿；\\n
   * - 草稿刷新只覆盖来源字段和检验数据，用户选择的返工路线会保留。\\n
   * @param preferredFlowDetailId 当前刚选择的流程卡明细 id。
   *
   */
  private async reloadSourceByReworkFlowDetailChange(
    preferredFlowDetailId: number | null,
    preserveReworkSelection = this.getReworkSelectionSnapshot(),
  ): Promise<void> {
    if (this.sourceDraftReloadBusy) return

    const selected = this.resolveAnySelectedReworkFlowDetail(preferredFlowDetailId)
    if (!selected) {
      this.currentSourceFlowDetailTableName = ''
      this.currentSourceFlowDetailId = null
      this.emit()
      return
    }

    this.currentSourceFlowDetailTableName = selected.flowDetailTableName
    this.currentSourceFlowDetailId = selected.flowDetailId

    this.sourceDraftReloadBusy = true
    this.emit()

    try {
      const result = await this.runBusyAction(
        '切换返工工序',
        () => this.appService.reloadDraftByFlowDetail({
          flowDetailTableName: selected.flowDetailTableName,
          flowDetailId: selected.flowDetailId,
          inspectorEmployeeId: toNumericId((this.bill as any)?.Employeeid ?? (this.bill as any)?.employeeid),
        }),
        { loadingMessage: '切换返工工序中…', showLoadingToast: false },
      )

      if (!result) return

      if (result.type === 'DRAFT_LOADED') {
        const loaded = await this.applyDraftLoadedResult(result, { preserveReworkSelection })
        if (loaded) {
          try { toast.success('已按返工工序刷新来源草稿') } catch { }
        }
        return
      }

      if (result.type === 'ERROR') {
        if (isSilentReworkDraftReloadMessage(result.message)) {
          return
        }

        try {
          if (result.level === 'warning') toast.warning(result.message)
          else toast.error(result.message)
        } catch { }
      }
    } finally {
      this.sourceDraftReloadBusy = false
      this.emit()
    }
  }

  /**
   *
   * 修改返工工序字段，并按新工序刷新来源草稿。
   * @param field 返工工序字段名。
   * @param value 下拉值（流程卡明细 id）。
   *
   */
  public handleReworkFlowDetailChange = async (
    field: 'ReworkTypeofWorkid' | 'ReworkTypeofWork2id',
    value: string,
  ): Promise<void> => {
    if (this.disableDetailEdit) return

    const nextId = toNumericId(value) || 0
    const snapshot = this.getReworkSelectionSnapshot()
    const preserveReworkSelection = {
      reworkTypeofWorkId: field === 'ReworkTypeofWorkid' ? nextId || null : snapshot.reworkTypeofWorkId,
      reworkTypeofWork2Id: field === 'ReworkTypeofWork2id' ? nextId || null : snapshot.reworkTypeofWork2Id,
    }
    this.bill = { ...(this.bill as any), [field]: nextId } as DefectiveReworkOrderDocument
    this.emit()

    await this.reloadSourceByReworkFlowDetailChange(nextId || null, preserveReworkSelection)
  }

  /**
   *
   * 统一生成图片项的稳定 key（与页面 PhotoGrid 的 getPhotoKey 逻辑一致）。
   * @param item 图片项。
   *
   */
  private getPhotoKey(item: ErpImageItem): string {
    if (!item) return ''
    if ((item as any).id) return String((item as any).id)
    if ((item as any).uri) return String((item as any).uri)
    if ((item as any).path) return String((item as any).path)
    try { return JSON.stringify(item) } catch { return '' }
  }

  /**
   *
   * 设置本地“照片证据”（替换）。
   * @param items 新的本地图片列表。
   *
   */
  public setLocalPhotoEvidence(items: LocalErpImageItem[]): void {
    if (this.disableDetailEdit) {
      try { toast.warning('当前状态不允许修改照片证据') } catch { }
      return
    }
    this.localPhotoEvidence = Array.isArray(items) ? items : []
    this.emit()
  }

  /**
   *
   * 追加本地“照片证据”（PC 环境常用）。
   * @param items 追加的本地图片列表。
   *
   */
  public appendLocalPhotoEvidence(items: LocalErpImageItem[]): void {
    if (this.disableDetailEdit) {
      try { toast.warning('当前状态不允许修改照片证据') } catch { }
      return
    }
    const next = [...(this.localPhotoEvidence ?? [])]
    for (const it of items ?? []) next.push(it)
    this.localPhotoEvidence = next
    this.emit()
  }

  /**
   *
   * 从本地“照片证据”中移除指定照片，并在必要时释放 objectURL。
   * @param target 要移除的目标图片。
   *
   */
  public removeLocalPhotoEvidence(target: ErpImageItem): void {
    if (this.disableDetailEdit) {
      try { toast.warning('当前状态不允许修改照片证据') } catch { }
      return
    }
    const key = this.getPhotoKey(target)
    if (!key) return

    const prev = Array.isArray(this.localPhotoEvidence) ? this.localPhotoEvidence : []
    const next: LocalErpImageItem[] = []

    for (const item of prev) {
      const itemKey = this.getPhotoKey(item)
      if (itemKey === key) {
        const objUrl = (item as any)?.localObjectUrl
        if (typeof objUrl === 'string' && objUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
          try { URL.revokeObjectURL(objUrl) } catch { }
        }
        continue
      }
      next.push(item)
    }

    this.localPhotoEvidence = next
    this.emit()
  }

  /**
   *
   * 从“远程照片证据”（服务器附件列表）中移除指定照片。
   * @remarks
   * - 用于“点击图片 → 查看器 → 垃圾桶删除”后，确保 UI 列表与当前状态保持一致；\\\\n
   * - 不依赖页面侧额外的 hidden 集合，避免出现“加减正常但列表不跟随变化”的双状态问题。\\\\n
   *
   * @param target 要移除的目标图片。
   *
   */
  public removeServerPhotoEvidence(target: ErpImageItem): void {
    if (this.disableDetailEdit) {
      try { toast.warning('当前状态不允许修改照片证据') } catch { }
      return
    }
    const key = this.getPhotoKey(target)
    if (!key) return

    const prev = Array.isArray(this.serverPhotoEvidence) ? this.serverPhotoEvidence : []
    const next: ErpImageItem[] = []
    for (const item of prev) {
      const itemKey = this.getPhotoKey(item)
      if (itemKey === key) continue
      next.push(item)
    }
    this.serverPhotoEvidence = next
    this.emit()
  }

  /**
   *
   * 清空本地“照片证据”，并释放可能存在的 objectURL。
   *
   */
  public clearLocalPhotoEvidence(): void {
    const prev = Array.isArray(this.localPhotoEvidence) ? this.localPhotoEvidence : []
    for (const item of prev) {
      const objUrl = (item as any)?.localObjectUrl
      if (typeof objUrl === 'string' && objUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        try { URL.revokeObjectURL(objUrl) } catch { }
      }
    }
    this.localPhotoEvidence = []
    this.emit()
  }

  /**
   *
   * 确保明细对象拥有稳定的本地 key（用于列表渲染与编辑定位）。
   * @remarks
   * - 若已存在 __localKey 则复用；\\n
   * - 若存在有效 id 则使用 id_ 前缀；\\n
   * - 否则使用 local_ 自增序列。\\n
   * @param detail 明细对象（通常为 Plain Object / DTO）。
   *
   */
  private ensureDetailLocalKey(detail: any): string {
    if (!detail || typeof detail !== 'object') return ''
    const existing = typeof detail.__localKey === 'string' ? detail.__localKey.trim() : ''
    if (existing) return existing

    const idRaw = detail.id ?? detail.Id ?? detail.ID
    const id = typeof idRaw === 'number' ? idRaw : Number(idRaw)
    if (Number.isFinite(id) && id > 0) {
      const key = `id_${id}`
      detail.__localKey = key
      return key
    }

    NcrViewModel.detailLocalKeySeed += 1
    const key = `local_${NcrViewModel.detailLocalKeySeed}`
    detail.__localKey = key
    return key
  }

  /**
   *
   * 获取明细行稳定 key（用于列表渲染与编辑定位）。
   * @param detail 明细 DTO。
   *
   */
  public getDetailKey(detail: DefectiveReworkOrderDetail): string {
    return this.ensureDetailLocalKey(detail as any)
  }

  /**
   *
   * 用局部补丁更新表头。
   * @param patch 要合并的表头字段补丁。
   *
   */
  public updateBill = (patch: Partial<DefectiveReworkOrderDocument>): void => {
    // 审批/冻结/结案/作废状态下禁止修改
    if (this.disableDetailEdit) return
    const next = { ...(this.bill as any), ...(patch as any) } as DefectiveReworkOrderDocument
    this.bill = next
    this.emit()
  }

  /**
   *
   * 删除明细按钮是否禁用（与编辑禁用一致）。
   *
   */
  public get disableRemoveDetail(): boolean {
    if (this.disableDetailEdit) return true
    const list = Array.isArray(this.details) ? this.details : []
    return list.length <= 1
  }

  /**
   *
   * 添加一条不合格记录（新增明细行）。
   *
   */
  public addDetail = (): void => {
    if (this.disableDetailEdit) return
    const next = [...(this.details ?? [])]
    const detail = createEmptyNcrDetail()
    this.ensureDetailLocalKey(detail as any)
    next.push(detail)
    this.details = next
    this.emit()
  }

  /**
   *
   * 根据本地 key 删除一条记录。
   * @param key 本地 key。
   *
   */
  public removeDetail = (key: string): void => {
    if (this.disableDetailEdit) return
    const current = Array.isArray(this.details) ? this.details : []
    if (current.length <= 1) {
      try { toast.warning('不合格记录明细至少保留 1 行') } catch { }
      return
    }
    const targetKey = String(key ?? '')
    const next = (this.details ?? []).filter((it: any) => this.ensureDetailLocalKey(it) !== targetKey)
    if (next.length <= 0) {
      const detail = createEmptyNcrDetail()
      this.ensureDetailLocalKey(detail as any)
      next.push(detail)
    }
    this.details = next
    this.emit()
  }

  /**
   *
   * 确保“明细”至少存在 1 行（符合业务规则：不合格记录必须至少有一条明细）。
   * @remarks
   * - 仅在可编辑状态下生效；冻结/结案/作废/已审批时不主动补行。\\\n
   *
   */
  private ensureAtLeastOneDetailRow(): void {
    if (this.disableDetailEdit) return
    const list = Array.isArray(this.details) ? this.details : []
    if (list.length > 0) return
    const detail = createEmptyNcrDetail()
    this.ensureDetailLocalKey(detail as any)
    this.details = [detail]
    this.emit()
  }

  /**
   *
   * 修改指定明细的“不合格记录”文本。
   * @param key 明细本地 key。
   * @param reason 新的记录文本。
   *
   */
  public changeDetailReason = (key: string, reason: string): void => {
    if (this.disableDetailEdit) return
    const targetKey = String(key ?? '')
    const next = (this.details ?? []).map((it: any) =>
      this.ensureDetailLocalKey(it) === targetKey
        ? { ...it, Adversesituation: String(reason ?? '') }
        : it,
    )
    this.details = next
    this.emit()
  }

  /**
   *
   * 注册必填规则。
   * @param key 字段标识。
   * @param registration 字段规则。
   *
   */
  public registerRequired(
    key: string,
    registration: RequiredFieldRegistration<unknown>,
  ): () => void {
    return this.required.register(key, registration)
  }

  /**
   *
   * 按 NCR 单据 ID 从服务器加载“照片证据”附件列表，并更新本地状态。
   * @remarks
   * - 使用 GeneralApi.GetItemsEx 查询 FileRecordForNcr 表；\\n
   * - 只在成功返回时更新 serverPhotoEvidence，失败时记录日志并清空列表。\\n
   * @param billId 单据主键 ID。
   *
   */
  private async loadServerPhotoEvidence(billId: number): Promise<void> {
    const idNum = Number(billId)
    if (!Number.isFinite(idNum) || idNum <= 0) {
      this.serverPhotoEvidence = []
      this.emit()
      return
    }

    try {
      const query: QueryInput = {
        tableName: 'FileRecordForNcr',
        // 注意：目前服务端 GeneralApi.GetItemsEx 在传入 Where 时会抛异常，
        // 因此这里只按表名拉取全部记录，在前端按 Billid 进行过滤。
      }

      const res = await GeneralApi.GetItemsEx<
        Array<Record<string, unknown>>
      >(DEFAULT_DB_NAME, query)

      const rowsRaw =
        (res as any)?.data ??
        (Array.isArray(res) ? res : [])

      const rows: Array<Record<string, unknown>> = Array.isArray(rowsRaw) ? rowsRaw : []

      // 仅保留当前单据的附件，并统一字段命名为 IFile 兼容形态。
      const files: Array<
        Pick<IFile, 'CloudFileid' | 'FileName' | 'Suffix'> & { id?: number; Billid?: number }
      > = rows
        .filter((r) => {
          const billRaw = (r as any).Billid ?? (r as any).billid
          const bill = typeof billRaw === 'number' ? billRaw : Number(billRaw)
          return Number.isFinite(bill) && bill === idNum
        })
        .map((r) => {
          const cloudRaw = (r as any).CloudFileid ?? (r as any).cloudFileid
          const nameRaw = (r as any).FileName ?? (r as any).fileName
          const suffixRaw = (r as any).Suffix ?? (r as any).suffix
          const idRaw = (r as any).id
          const billRaw = (r as any).Billid ?? (r as any).billid

          const cloudId = typeof cloudRaw === 'number' ? cloudRaw : Number(cloudRaw)
          const billIdNum = typeof billRaw === 'number' ? billRaw : Number(billRaw)

          return {
            CloudFileid: Number.isFinite(cloudId) ? cloudId : 0,
            FileName: String(nameRaw ?? ''),
            Suffix: String(suffixRaw ?? ''),
            id: typeof idRaw === 'number' ? idRaw : Number.isFinite(Number(idRaw)) ? Number(idRaw) : undefined,
            Billid: Number.isFinite(billIdNum) ? billIdNum : undefined,
          }
        })
        .filter((f) => f.CloudFileid > 0 && !!f.FileName)

      if (this.getCurrentBillId() !== idNum) return
      this.serverPhotoEvidence = mapFilesToErpImageItems(files, DEFAULT_DB_NAME)
      this.emit()
    } catch (error) {
      if (this.getCurrentBillId() !== idNum) return
      console.error('[NCR] 加载照片证据失败:', error)
      this.serverPhotoEvidence = []
      this.emit()
    }
  }

  /**
   *
   * 按 ID 打开 NCR 单据，并在成功后同步加载“照片证据”附件。
   * @remarks
   * - 若单据不存在，则返回 null 且清空附件状态；\\n
   * - 附件加载失败不会阻断单据打开，仅在控制台记录错误。\\n
   * @param id 单据主键 ID。
   *
   */
  public override async openById(
    id: number,
  ): Promise<{ document: DefectiveReworkOrderDocument; details: DefectiveReworkOrderDetail[] } | null> {
    const targetId = toNumericId(id)
    const result = await super.openById(id)

    // 若单据已被其它打开动作覆盖，则不再继续加载/清理附件与下拉（避免串单）。
    if (targetId && this.getCurrentBillId() !== targetId) return result

    if (!result) {
      if (this.serverPhotoEvidence.length > 0) {
        this.serverPhotoEvidence = []
        this.clearLocalPhotoEvidence()
        this.emit()
      }
      return null
    }

    this.clearLocalPhotoEvidence()
    if (targetId) await this.loadServerPhotoEvidence(targetId)
    await this.loadProcessOptions()
    return result
  }

  /**
   *
   * 刷新：若存在当前 ID，则重新读取表头+明细，并同步加载附件（通过 runBusyAction 提供加载反馈）。
   *
   */
  public async handleRefresh(): Promise<void> {
    const id = toNumericId((this as any).currentId)
    if (!id) return
    await this.runBusyAction('刷新', async () => {
      await this.refresh(id)
      await this.loadServerPhotoEvidence(id)
      await this.loadProcessOptions()
    }, { loadingMessage: '刷新中…' })
  }

  /**
   *
   * 删除当前单据（对外别名；通过 runBusyAction 提供加载反馈，新建草稿场景不显示 toast）。
   *
   */
  public async handleDeleteBill(): Promise<void> {
    const currentId = this.getCurrentBillId()
    const showLoading = currentId > 0
    await this.runBusyAction(
      '删除',
      () => this.handleDelete(),
      { loadingMessage: '删除中…', showLoadingToast: showLoading },
    )
  }

  /**
   *
   * 统一非负整数转换（供 NumberInput 使用）。
   * @param v 输入值（number 或空字符串）。
   *
   */
  public toNonNegInt(v: number | '' | undefined): number {
    const n = typeof v === 'number' ? v : Number(v)
    if (!Number.isFinite(n) || n < 0) return 0
    return Math.floor(n)
  }

  /**
   *
   * 模拟扫码：快速填充示例数据。
   *
   */
  public handleMockScan = (): void => {
    try {
      const d1 = createEmptyNcrDetail()
      d1.Adversesituation = '端子压接裂纹'
      const d2 = createEmptyNcrDetail()
      d2.Adversesituation = '外观刮伤'
      const mockDetails: DefectiveReworkOrderDetail[] = [d1, d2]
      const patch: Partial<DefectiveReworkOrderDocument> = {
        Employeeid: 1,
        PreCmpBQty: 1200,
        TypeofWorkid: 101,
        InnerKey: 'NCR-TEST-001',
      }
      this.updateBill(patch)
      this.details = mockDetails
      this.emit()
    } catch (err) {
      console.error('[NCR] 模拟扫码失败:', err)
    }
  }

  /**
   *
   * 扫码/手动输入条码：触发扫码解析并执行对应动作。
   * @remarks
   * - 允许输入形如 `id:123` 或纯数字 ID，表示直接打开指定 NCR 单据。\\n
   * - 其它文本按 handleScan 逻辑进行解析（职员码 / 日计划码 / 不支持提示）。\\n
   *
   */
  public async handleScanOrInput(): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      const input = window.prompt('请输入条码/二维码内容或单据ID', '')
      if (input == null) return
      const code = String(input).trim()
      if (!code) { try { toast.warning('请输入有效内容') } catch { }; return }
      const m = code.match(/^(?:id\s*[:：]\s*)?(\d+)$/i)
      if (m) {
        const ncrId = Number(m[1])
        if (Number.isFinite(ncrId) && ncrId > 0) {
          const opened = await this.openById(ncrId)
          if (opened) { try { toast.success(`已打开NCR单据：${ncrId}`) } catch { } } else { try { toast.error('未能打开指定NCR单据') } catch { } }
          return
        }
      }
      await this.handleScan(code)
    } catch (err) {
      console.error('[NCR] 手动输入/扫码失败:', err)
      try { toast.error(formatActionErrorMessage('扫码处理', err, '请稍后重试')) } catch { }
    }
  }

  /**
   *
   * 处理扫码文本（核心解析入口）。
   * @remarks
   * - 职员条码：设置当前单据的检验员（Employeeid）；\\n
   * - 日计划条码：调用后端生成新的不合格返工单并打开；\\n
   * - 其它：提示暂不支持。\\n
   * @param text 扫码/输入文本。
   *
   */
  public async handleScan(text: string): Promise<NcrScanExecuteResult> {
    const result = await this.appService.executeScan(text, {
      inspectorEmployeeId: toNumericId((this.bill as any)?.Employeeid),
      allowSetInspector: !this.disableDetailEdit,
      allowOpenById: false,
    })

    if (!this.isScanListenerActive()) {
      this.redeliverScanCodeToActive(text)
      return result
    }

    if (result.type === 'NEED_PICK_FLOW_DETAIL') {
      if (!this.isScanListenerActive()) {
        this.redeliverScanCodeToActive(text)
        return result
      }
      this.pendingDailyPlanFlowDetailPick = { scanCode: result.scanCode, candidates: result.candidates }
      this.emit()
      return result
    }

    if (result.type === 'SET_INSPECTOR') {
      if (!this.isScanListenerActive()) {
        this.redeliverScanCodeToActive(text)
        return result
      }
      this.updateBill({ Employeeid: result.employeeId })
      // 优先展示姓名：应用层返回的 employeeName -> 下拉选项映射；最后再回退到 ID。
      const name = String(result.employeeName ?? '').trim()
      const fromOptions = (this.inspectorOptions ?? []).find((o) => String(o?.value ?? '') === String(result.employeeId))
      const optionLabel = String(fromOptions?.label ?? '').trim()
      const toastText = name || optionLabel || String(result.employeeId)
      try { toast.success(`已设置检验员：${toastText}`) } catch { }
      return result
    }

    if (result.type === 'DRAFT_LOADED') {
      const loaded = await this.applyDraftLoadedResult(result)
      if (!this.isScanListenerActive()) {
        this.redeliverScanCodeToActive(text)
        return result
      }
      if (loaded) {
        try { toast.success(result.message || '已生成不合格返工单草稿，请保存后继续处理') } catch { }
      }
      return result
    }

    if (result.type === 'OPEN_BY_ID') {
      const currentId = this.getCurrentBillId()
      const nextId = typeof result.id === 'number' ? result.id : Number(result.id)
      if (Number.isFinite(nextId) && nextId > 0 && nextId !== currentId) {
        try { this.createNewBill() } catch { }
      }
      const opened = await this.openById(result.id)
      if (!this.isScanListenerActive()) {
        this.redeliverScanCodeToActive(text)
        return result
      }
      if (opened) {
        if (!this.isScanListenerActive()) {
          this.redeliverScanCodeToActive(text)
          return result
        }
        try { toast.success(`已打开NCR单据：${result.id}`) } catch { }
      } else {
        if (!this.isScanListenerActive()) {
          this.redeliverScanCodeToActive(text)
          return result
        }
        try { toast.error('未能打开指定NCR单据') } catch { }
      }
      return result
    }

    if (!this.isScanListenerActive()) {
      this.redeliverScanCodeToActive(text)
      return result
    }
    try {
      if (result.level === 'warning') toast.warning(result.message)
      else toast.error(result.message)
    } catch { }
    return result
  }

  /**
   *
   * 接收基础类推送的扫码结果。
   *
   */
  /* istanbul ignore next */
  protected override onScanResult(payload: ScanResultPayload): void {
    if (!this.isScanListenerActive()) {
      this.redeliverScanToActive(payload)
      return
    }
    handleScanResultPayload(payload, {
      logTag: '[NCR]',
      onEmpty: () => { void this.handleScan('') },
      onCode: (code) => this.handleScan(code),
    })
  }

  /**
   *
   * 取消“选择流程卡明细”弹窗。
   *
   */
  public cancelDailyPlanFlowDetailPick = (): void => {
    this.pendingDailyPlanFlowDetailPick = null
    this.dailyPlanPickBusy = false
    this.emit()
  }

  /**
   *
   * 确认选择某条流程卡明细，并生成不合格返工单（NCR）。
   * @param candidate 用户选中的候选项。
   *
   */
  public confirmDailyPlanFlowDetailPick = async (candidate: NcrScanFlowDetailCandidate): Promise<void> => {
    const pending = this.pendingDailyPlanFlowDetailPick
    if (!pending) return

    const scanCode = String(pending.scanCode ?? '').trim()
    if (!scanCode) return

    if (!candidate?.flowDetailTableName || !candidate?.flowDetailId) return

    this.dailyPlanPickBusy = true
    this.emit()
    try {
      const isFgd = /^FGD/i.test(scanCode)
      const isJcjh = /^JCJH/i.test(scanCode)
      const result = isFgd
        ? await this.appService.executeDefectiveReworkOrderScanCreate(scanCode, {
          inspectorEmployeeId: toNumericId((this.bill as any)?.Employeeid),
          pickedFlowDetail: {
            tableName: candidate.flowDetailTableName,
            id: candidate.flowDetailId,
          },
        })
        : isJcjh
          ? await this.appService.executeExtrusionPlanScanCreate(scanCode, {
            inspectorEmployeeId: toNumericId((this.bill as any)?.Employeeid),
            pickedFlowDetail: {
            tableName: candidate.flowDetailTableName,
            id: candidate.flowDetailId,
          },
        })
          : await this.appService.executeDailyPlanScanCreate(scanCode, {
            inspectorEmployeeId: toNumericId((this.bill as any)?.Employeeid),
            pickedFlowDetail: {
            tableName: candidate.flowDetailTableName,
            id: candidate.flowDetailId,
          },
        })

      if (result.type === 'DRAFT_LOADED') {
        this.pendingDailyPlanFlowDetailPick = null
        this.emit()

        const loaded = await this.applyDraftLoadedResult(result)
        if (!this.isScanListenerActive()) {
          this.redeliverScanCodeToActive(scanCode)
          return
        }
        if (loaded) {
          try { toast.success(result.message || '已生成不合格返工单草稿，请保存后继续处理') } catch { }
        }
        return
      }

      if (result.type === 'OPEN_BY_ID') {
        const currentId = this.getCurrentBillId()
        const nextId = typeof result.id === 'number' ? result.id : Number(result.id)
        if (Number.isFinite(nextId) && nextId > 0 && nextId !== currentId) {
          try { this.reset() } catch { }
        }
        const opened = await this.openById(result.id)
        if (!this.isScanListenerActive()) {
          this.redeliverScanCodeToActive(scanCode)
          return
        }

        if (opened) {
          this.pendingDailyPlanFlowDetailPick = null
          this.emit()
          try { toast.success(`已打开NCR单据：${result.id}`) } catch { }
          return
        }

        try { toast.error('未能打开指定NCR单据') } catch { }
        return
      }

      if (result.type === 'ERROR') {
        try { toast.error(result.message) } catch { }
        return
      }

      // 兜底：保持弹窗不关闭，仅提示不支持
      try { toast.error('生成失败：未返回可处理结果') } catch { }
    } finally {
      this.dailyPlanPickBusy = false
      this.emit()
    }
  }

  /**
   *
   * 大小写不敏感地补齐字段：当模板字段缺失且源对象存在同名（任意大小写）键时进行回填。
   * @remarks
   * - 对齐 FQC 的 normalize 机制，避免手工维护字段清单导致漏字段。\\n
   * @param src 后端返回的原始对象。
   * @param template 仅提供键名的模板对象（不会被修改）。
   *
   */
  private normalizeCaseInsensitive<T extends object>(src: any, template: T): T {
    const targetKeys = Object.keys(template ?? {})
    const sourceEntries = Object.keys(src ?? {}).reduce<Record<string, string>>((map, key) => {
      map[key.toLowerCase()] = key
      return map
    }, {})
    const out: Record<string, any> = { ...(src ?? {}) }
    for (const key of targetKeys) {
      const hitKey = sourceEntries[key.toLowerCase()]
      if (hitKey && out[key] == null && out[hitKey] != null) out[key] = out[hitKey]
    }
    return out as T
  }

  /**
   *
   * 刷新后规范化字段。
   * @remarks
   * - 兼容后端 camelCase/小写：同步到 PascalCase（例如 code -> Code）；\\n
   * - 明细行同步键名：确保 Adversesituation 无论后端返回大小写如何，前端都能读取到。\\n
   * @param document 后端返回的单据头。
   * @param details 后端返回的明细列表。
   *
   */
  private async enrichAfterRefresh(document: any, details: any[]): Promise<void> {
    const rawDoc = (document as any) ?? null
    const normDoc = this.normalizeCaseInsensitive(rawDoc, NcrViewModel.docNormalizeTemplate)

    const parsedStatus = parseDocumentStatus((normDoc as any)?.status ?? (normDoc as any)?.Status)
    const enriched = {
      ...normDoc,
      status: parsedStatus, // 方便视图直接读取小写 status
    }

    // 物料编码：优先使用后端直接返回的字段，否则通过 Materialid 联查 Material.Code
    const materialCodeDirect = pickText((enriched as any)?.MaterialCode ?? (enriched as any)?.materialCode)
    const materialId = toNumericId((enriched as any)?.Materialid ?? (enriched as any)?.materialid)
    if (materialId && materialCodeDirect) {
      this.materialIndex[String(materialId)] = materialCodeDirect
    }
    const cachedMaterialCode = materialId ? this.materialIndex[String(materialId)] : ''
    this.materialCode = materialCodeDirect || cachedMaterialCode || ''

    const normDetails = Array.isArray(details)
      ? details.map((d) => this.normalizeCaseInsensitive(d, NcrViewModel.detailNormalizeTemplate))
      : []

    this.bill = enriched as any
    for (const d of normDetails) {
      this.ensureDetailLocalKey(d)
    }
    this.applySourceContextFromDocument(enriched)
    this.isReworkFlowDetailRequired = false
    this.details = normDetails as any[]
    this.emit()
    void this.refreshReworkFlowDetailRequiredState(enriched)
    this.ensureAtLeastOneDetailRow()

    // 异步补齐物料编码（不阻断刷新/打开流程）
    if (materialId && !this.materialCode) {
      void this.ensureMaterialCodeById(materialId)
    }
  }

  /**
   *
   * 按 Material.id 联查物料编码，并在仍匹配当前单据时写回 materialCode。
   *
   */
  private async ensureMaterialCodeById(materialId: number): Promise<void> {
    const id = toNumericId(materialId)
    if (!id) return

    const key = String(id)
    const cached = this.materialIndex[key]
    if (cached) {
      if (!this.materialCode) {
        this.materialCode = cached
        this.emit()
      }
      return
    }

    this.materialCodeFetchSeq += 1
    const seq = this.materialCodeFetchSeq

    const rows = await fetchLookup('Material', ['id', 'Code'], undefined, { where: { id }, take: 1 })
    // 若期间出现了新请求，则丢弃过期结果
    if (seq !== this.materialCodeFetchSeq) return

    const hit = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any) : null
    const code = pickText(hit?.Code ?? hit?.code)
    if (!code) return

    this.materialIndex[key] = code

    // 仅当当前单据仍引用该物料时才回写，避免串单
    const currentMaterialId = toNumericId((this.bill as any)?.Materialid ?? (this.bill as any)?.materialid)
    if (currentMaterialId !== id) return

    this.materialCode = code
    this.emit()
  }

  /**
   *
   * 加载下拉选项：检验员。
   *
   */
  public async loadInspectorOptions(): Promise<void> {
    try {
      const rows = await fetchActiveEmployees()
      this.inspectorOptions = (rows ?? []).map((r: any) => ({
        label: String(r?.name ?? ''),
        value: String(r?.id ?? ''),
      }))
      this.emit()
    } catch {
      this.inspectorOptions = []
      this.emit()
    }
  }

  /**
   *
   * 加载下拉选项：工种/返工工序。
   * @remarks
   * - 工种：取全部工种（TypeofWork）；\\n
   * - 返工工序：对齐 ERPClient，取“上游祖先流程卡”的工序明细列表，且返工字段保存的是明细 id。\\n
   *
   */
  public async loadProcessOptions(): Promise<void> {
    this.processOptionsFetchSeq += 1
    const seq = this.processOptionsFetchSeq
    const docForOptions = this.bill as any
    try {
      const opts = await fetchWorkTypes()
      if (seq !== this.processOptionsFetchSeq) return
      const basic = (opts ?? []).map((o: any) => {
        const workTypeContent = String(o?.workTypeContent ?? o?.raw?.Content ?? o?.raw?.content ?? '').trim()
        return {
          label: String(o?.label ?? ''),
          value: String(o?.value ?? ''),
          ...(workTypeContent ? { workTypeContent } : {}),
        }
      })
      const bad = await fetchReworkFlowDetailOptionsFromUpstreamFlowCard({
        documentBase: docForOptions,
        workTypeOptions: basic,
        selectedFlowDetailIds: [
          docForOptions?.ReworkTypeofWorkid ?? docForOptions?.reworkTypeofWorkid,
          docForOptions?.ReworkTypeofWork2id ?? docForOptions?.reworkTypeofWork2id,
        ],
      })
      if (seq !== this.processOptionsFetchSeq) return
      this.processOptions = basic
      this.badProcessOptions = bad

      // 与 ERPClient 一致：若返工工序尚未选择，则尝试从上游祖先流程卡明细自动带入。
      // 为了改为不自动选择返工工序, 先注释自动选择逻辑
      //  const currentReworkId = toNumericId((docForOptions as any)?.ReworkTypeofWorkid ?? (docForOptions as any)?.reworkTypeofWorkid)
      //  if (!currentReworkId) {
      //    const autoFlowDetailId = await resolveUpstreamFlowDetailIdFromDocumentBase(docForOptions as any)
      //    if (seq !== this.processOptionsFetchSeq) return
      //    if (autoFlowDetailId && autoFlowDetailId > 0) {
      //      this.bill = { ...(this.bill as any), ReworkTypeofWorkid: autoFlowDetailId } as any
      //    }
      //  }
      this.emit()
    } catch {
      if (seq !== this.processOptionsFetchSeq) return
      this.badProcessOptions = []
      this.processOptions = []
      this.emit()
    }
  }

  /**
   *
   * 是否禁用明细编辑（冻结/结案/作废/已审批）。
   *
   */
  public get disableDetailEdit(): boolean { return this.getDisableDetailEdit(this.currentStatus) }

  /**
   *
   * 审批按钮是否禁用（便于直接绑定到按钮）。
   *
   */
  public get approveDisabled(): boolean {
    return this.loading || this.actionBusy || this.getStatusLocks(this.currentStatus).approveDisabled
  }

  /**
   *
   * 反审批按钮是否禁用（便于直接绑定到按钮）。
   *
   */
  public get unapproveDisabled(): boolean {
    return this.loading || this.actionBusy || this.getStatusLocks(this.currentStatus).unapproveDisabled
  }

  /**
   *
   * 审批当前单据（通过 runBusyAction 包装，提供"审批中…"加载反馈与防重入）。
   *
   */
  public override async handleApprove(): Promise<boolean> {
    const result = await this.runBusyAction(
      '审批',
      () => super.handleApprove(),
      { loadingMessage: '审批中…' },
    )
    return result ?? false
  }

  /**
   *
   * 反审批当前单据（通过 runBusyAction 包装，提供"反审批中…"加载反馈与防重入）。
   *
   */
  public override async handleUnapprove(): Promise<boolean> {
    const result = await this.runBusyAction(
      '反审批',
      () => super.handleUnapprove(),
      { loadingMessage: '反审批中…' },
    )
    return result ?? false
  }
}

/**
 *
 * React 工厂：创建并持有 NcrViewModel 实例（负责生命周期）。
 * @remarks
 * - 优先从 AppServicesProvider（DI 容器）获取 NcrApplicationService；\\n
 * - 若未挂载 Provider，则回退到“手动 new”以保持页面可用。\\n
 *
 */
export function useNcrViewModelClass(): NcrViewModel {
  const container = useContext(AppServicesContext)
  const [vm] = useState(() => {
    const appService = container?.get(NcrApplicationServiceToken) ?? new NcrApplicationService(new DefectiveReworkOrderRepositoryImpl())
    return new NcrViewModel(appService)
  })
  useEffect(() => {
    try { vm.activateScanListener() } catch { }
    return () => { try { vm.deactivateScanListener() } catch { } }
  }, [vm])
  return vm
}

function pickText(input: unknown): string {
  if (typeof input === 'string') return input.trim()
  if (input == null) return ''
  return String(input).trim()
}
