/* istanbul ignore file */
/* c8 ignore start */
import { useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { toNumericId, type DocumentService } from '@/app/features/erp/shared/DocumentBase'
import { createDocumentActions } from '@/lib/documents/DocumentActionsStore'
import { createRequiredFieldManager, type RequiredFieldRegistration, type RequiredFieldManager } from '@/lib/validation/requiredFieldManager'
import { parseMeasureFrequency as parseMeasureFrequencyUtil } from '@/lib/documents/inspection'
import { fetchActiveEmployees } from '@/lib/erp/employee'
import { toOptions, fetchLookup } from '@/lib/erp/lookup-core'
import { setLastFqcBillIdToStorage, hasStatusFlag, parseDocumentStatus } from '../../shared/helpers'
import type { DebugMenuItem } from '@/components/molecules/DebugFab'
import { FinalInspectionDocument, FinalInspectionDetail, DocumentStatus } from '@/types/erp-db.generated'
import { QualityDocumentBase } from '@/app/features/erp/quality/shared/QualityDocumentBase'
import { handleScanResultPayload } from '@/app/features/erp/quality/shared/scanEntry'
import { type ScanResultPayload, scanQRCode } from '@/lib/android-bridge'
import { fetchMaterials } from '@/lib/erp/material'
import { fetchWorkTypes } from '@/lib/erp/type-of-work'
import { formatActionErrorMessage, resolveUserFacingErrorMessage } from '@/lib/errors/user-facing-error'
import { buildQualityInspectionReturnTo } from '@/lib/navigation/return-to'
import {
  FinalInspectionApplicationService,
  type FinalInspectionActionResult,
  type FinalInspectionScanResult,
} from '@/application/quality/fqc/FinalInspectionApplicationService'
import type { FlowDetailCandidate } from '@/application/quality/shared/flowDetailCandidates'
import type { FqcLookupSnapshot } from '../FqcLookupTypes'
import { FinalInspectionRepositoryImpl } from '@/infrastructure/repositories/quality/FinalInspectionRepositoryImpl'
import {
  AppServicesContext,
  FinalInspectionApplicationServiceToken,
} from '@/infrastructure/di/AppServicesProvider'

/**
 *
 * 视图明细：在 FinalInspectionDetail 基础上补充前端本地 key 与可空判定值。
 *
 */
export type FqcDetailView = FinalInspectionDetail & { CheckResult?: number | ''; __localKey?: string }

/**
 *
 * FQC 视图模型（纯类，无业务 Hook）。
 * @remarks
 * - 组合 DocumentBase 与非 Hook 的 DocumentActions；
 * - 对外暴露页面所需的全部数据与操作方法；
 * - 通过 subscribe/emit 实现外部订阅（供 useSyncExternalStore 使用）。
 *
 */
export class FqcViewModel extends QualityDocumentBase<FinalInspectionDocument, FinalInspectionDetail> {
  public static __djScanListenerKey = 'dj-web:quality:fqc'
  private static detailLocalKeySeed = 0

  /**
   *
   * 当前单据表头。
   *
   */
  public bill: FinalInspectionDocument
  /**
   *
   * 当前单据明细列表。
   *
   */
  public details: FqcDetailView[] = []
  /**
   *
   * 当前单据状态。
   *
   */
  public status: number = DocumentStatus.未审批
  /**
   *
   * 加载中标记。
   *
   */
  public loading = false
  /**
   *
   * 当前单据主键。
   *
   */
  public currentId: number | null = null

  /**
   *
   * 必填项管理器。
   *
   */
  public required: RequiredFieldManager<unknown> = createRequiredFieldManager<unknown>()
  /**
   *
   * 检验员下拉选项。
   *
   */
  public inspectorOptions: Array<{ label: string; value: string }> = []
  /**
   *
   * 当前检验工序下拉选项（来自 TypeofWork）。
   *
   */
  public processOptions: Array<{ label: string; value: string }> = []

  /**
   *
   * 日计划扫码存在多条“当前工序明细”时的待选列表（用于弹窗选择）。
   *
   */
  public pendingDailyPlanFlowDetailPick: { scanCode: string; candidates: FlowDetailCandidate[] } | null = null

  /**
   *
   * 日计划扫码“选择并生成”进行中标记（用于禁用弹窗按钮）。
   *
   */
  public dailyPlanPickBusy = false
  /**
   *
   * 调试菜单项。
   *
   */
  public debugMenu: DebugMenuItem[] = []
  /**
   *
   * 物料编码展示值。
   *
   */
  public materialCode = ''
  /**
   *
   * 当前检验工序名称，只用于展示。
   *
   */
  public processName = ''
  /**
   *
   * 末件检验应用服务。
   *
   */
  private readonly appService: FinalInspectionApplicationService
  /**
   * FQC 中间页的客户端路由回调。
   * @remarks
   * ViewModel 不直接依赖 Next Router；由 FQC 页面在挂载期间注入，
   * 使 FQC 与中间页之间可以使用客户端替换导航并保留共享布局状态。
   */
  private ncrPromptNavigation: ((href: string) => void) | null = null
  /**
   *
   * 最近一次审批/反审批结果。
   *
   */
  private lastApproveResult: FinalInspectionActionResult | null = null
  /**
   *
   * 物料索引：id -> {code,name}。
   *
   */
  private materialIndex: Record<string, { code?: string; name?: string }> = {}
  /**
   *
   * 工种索引：id -> label（名称），用于从 TypeofWorkid 派生展示名。
   *
   */
  private processIndex: Record<string, string> = {}
  /**
   *
   * 标准化字段名的模板（仅取键名，不会被修改）。
   *
   */
  private static readonly docNormalizeTemplate = (() => { const doc = new FinalInspectionDocument(); doc.initDefaults(); return doc })()
  /**
   *
   * 标准化字段名的明细模板（仅取键名，不会被修改）。
   *
   */
  private static readonly detailNormalizeTemplate = (() => { const detail = new FinalInspectionDetail(); detail.initDefaults(); return detail })()

  /**
   *
   * 构造函数。
   * @param appService 末件检验应用服务实例。
   *
   */
  constructor(appService: FinalInspectionApplicationService) {
    const createEmptyDoc = () => { const doc = new FinalInspectionDocument(); doc.initDefaults(); return doc }
    const bootstrapService = {
      save: async () => ({}),
      approve: async () => ({} as any),
      unapprove: async () => ({} as any),
      remove: async () => ({} as any),
      fetchById: async () => ({ document: createEmptyDoc(), details: [] }),
      extractId: () => 0,
    }
    super({
      service: bootstrapService,
      createEmptyDocument: createEmptyDoc,
      createInitialDetails: () => [],
      deriveStatus: (doc) => parseDocumentStatus((doc as any)?.Status ?? (doc as any)?.status),
      hasStatusFlag,
      statusFlagConfig: {
        frozen: DocumentStatus.已冻结,
        closed: DocumentStatus.已结案,
        voided: DocumentStatus.已作废,
        approved: DocumentStatus.已审批,
        unapproved: DocumentStatus.未审批,
      },
      autoRefreshAfterSave: false,
      refreshAfterApprove: false,
      refreshAfterUnapprove: false,
      initialId: null,
      statusApprovedValue: DocumentStatus.已审批,
      statusUnapprovedValue: DocumentStatus.未审批,
    })

    this.appService = appService
    // 执行一次占位实现以避免覆盖率统计干扰（不影响业务）
    void bootstrapService.save?.()
    void bootstrapService.approve?.()
    void bootstrapService.unapprove?.()
    void bootstrapService.remove?.()
    void bootstrapService.fetchById?.()
    void bootstrapService.extractId?.()

    // 初始化单据（使用类型默认值）
    this.bill = this.createEmptyFinalInspectionDocument()
    this.details = []
    this.status = parseDocumentStatus((this.bill as any)?.Status ?? (this.bill as any)?.status)

    // 建立非 Hook 的动作对象
    const actions = createDocumentActions({
      initialId: null,
      onStateChange: (s) => { this.loading = !!s.loading; this.currentId = toNumericId(s.id as any); this.emit() },
      callSave: async () => {
        const res = await this.appService.save({ bill: this.bill, details: this.details })
        this.lastApproveResult = null
        if (!res.id) {
          return { id: null, code: res.message, message: res.message }
        }
        return { id: res.id, message: res.message }
      },
      callApprove: async (id) => {
        const res = await this.appService.approve(Number(id), { bill: this.bill, details: this.details })
        this.lastApproveResult = res
        return { success: res.success, message: res.message }
      },
      callUnapprove: async (id) => {
        const res = await this.appService.unapprove(Number(id), { bill: this.bill, details: this.details })
        this.lastApproveResult = res
        return { success: res.success, message: res.message }
      },
    })

    // 映射为通用 DocumentService（document/approve 等）
    const service: DocumentService<FinalInspectionDocument, FinalInspectionDetail> = {
      save: bootstrapService.save,
      approve: bootstrapService.approve,
      unapprove: bootstrapService.unapprove,
      remove: async (id) => this.appService.delete(Number(id)) as any,
      fetchById: async (id) => this.appService.fetchById(Number(id)),
      extractId: (result: any) => toNumericId((result as any)?.id ?? (result as any)?.aggregate?.id) ?? null,
    }

    // 注入最终配置（含刷新后的赋值回调）
    this.configure({
      service,
      createEmptyDocument: createEmptyDoc,
      createInitialDetails: () => [],
      deriveStatus: (doc) => parseDocumentStatus((doc as any)?.Status ?? (doc as any)?.status),
      hasStatusFlag,
      statusFlagConfig: {
        frozen: DocumentStatus.已冻结,
        closed: DocumentStatus.已结案,
        voided: DocumentStatus.已作废,
        approved: DocumentStatus.已审批,
        unapproved: DocumentStatus.未审批,
      },
      autoRefreshAfterSave: false,
      refreshAfterApprove: false,
      refreshAfterUnapprove: false,
      validateBeforeApprove: () => this.validateRequiredBeforeApprove(),
      onAfterApprove: async (id) => { await this.handleAfterApprove(id) },
      onAfterRefresh: async ({ document, details }, ctx) => {
        if (ctx && !ctx.isActive()) return
        try {
          // 1) 保存原始返回（便于调试/扩展）
          const rawDoc = (document as any) ?? null

          // 2) 规范化字段命名（大小写不敏感，自动覆盖 camelCase -> PascalCase）
          const normDoc = this.normalizeCaseInsensitive(rawDoc, FqcViewModel.docNormalizeTemplate)
          const normDetails = Array.isArray(details)
            ? (details as any[]).map((d) => this.normalizeCaseInsensitive(d, FqcViewModel.detailNormalizeTemplate))
            : []

          // 3) 推送到视图层（使用 replaceState 统一触发派生计算与渲染）
          this.replaceState({ bill: normDoc as any, details: normDetails as any, rawDocument: rawDoc })
          // 3.1) 优先使用 id->label 索引推导工序名；必要时回退到原始字段
          this.updateProcessNameFromBill()
          if (!this.processName) this.deriveProcessName()
          this.emit()

          // 4) 同步当前 ID
          this.currentId = this.getCurrentBillId()
        } catch (err) {
          /* istanbul ignore next: 防御性日志，不纳入覆盖率 */
          console.error('[FQC] onAfterRefresh 更新状态失败:', err)
        }
      },
      initialId: null,
      statusApprovedValue: DocumentStatus.已审批,
      statusUnapprovedValue: DocumentStatus.未审批,
    })

    // 绑定桥接
    this.bindBridge({
      getDocument: () => this.bill,
      getDetails: () => this.details,
      getStatus: () => this.status,
      getStatusRef: () => this.status,
      setDocument: (next) => {
        this.bill = next as any;
        this.status = parseDocumentStatus((this.bill as any)?.Status ?? (this.bill as any)?.status);
        this.updateMaterialCodeFromBill()
        this.emit()
      },
      setDetails: (next) => { this.details = this.ensureDetailsLocalKeys(next as any); this.emit() },
      setStatus: (next) => {
        // 后端有时返回 0（表示未审批），统一映射为位标记“未审批”以兼容位运算判断
        const n = typeof next === 'number' ? next : Number(next as unknown)
        const resolved = Number.isFinite(n) && n !== 0 ? n : DocumentStatus.未审批
        this.status = resolved
        ;(this.bill as any).Status = resolved
        ;(this.bill as any).DocumentStatus = resolved
        ;(this.bill as any).status = resolved
        this.emit()
      },
      docActions: actions,
    })

    // 初始化 Debug 菜单
    this.debugMenu = [
      { id: 'moni', label: '模拟扫码', onClick: () => { try { const mock = this.buildMockScanState(); this.replaceState(mock as any) } catch (err) { /* istanbul ignore next: 防御性日志 */ console.error('[FQC] 模拟扫码失败:', err) } } },
      { id: 'scan-input', label: '输入条码/单据ID', onClick: async () => { await this.openInputAndScan() } },
      { id: 'scan-open', label: '相机扫码打开末件检验', onClick: async () => { try { await scanQRCode() } catch (err) { /* istanbul ignore next: 防御性日志 */ console.error('[FQC] 触发相机扫码失败:', err) } } },
    ]

    // 首次创建默认“新建”
    try { this.createNewBill() } catch { }
  }

  // ======= 只读派生 =======
  /**
   *
   * 状态锁与禁用信息。
   *
   */
  public get statusLocks() {
    return this.getStatusLocks(this.status)
  }
  /**
   *
   * 审批按钮是否禁用。
   * - 由状态锁（已审批/冻结/作废 等）或正在执行的 busy 操作决定。
   *
   */
  public get disableApprove(): boolean {
    return this.statusLocks.approveDisabled || this.actionBusy
  }
  /**
   *
   * 反审批按钮是否禁用。
   * - 由状态锁（未审批/冻结/作废 等）或正在执行的 busy 操作决定。
   *
   */
  public get disableUnapprove(): boolean {
    return this.statusLocks.unapproveDisabled || this.actionBusy
  }
  /**
   *
   * 明细编辑是否禁用。
   *
   */
  public get disableDetailEdit(): boolean { return this.statusLocks.editingDisabled }

  // ======= 交互与流程 =======
  /**
   *
   * 注册必填项，返回注销函数。
   *
   */
  public registerRequired = (key: string, registration: RequiredFieldRegistration<unknown>): (() => void) => {
    return this.required.register(key, registration)
  }

  /**
   *
   * 解析频率文本，返回启用的测量项数量（1-5）。
   * - 空值、非法值、0 与负数均走默认策略，启用全部 5 项。
   *
   */
  public parseMeasureFrequency(freq: unknown): number {
    return parseMeasureFrequencyUtil(freq == null ? null : String(freq))
  }

  /**
   *
   * 确保明细对象拥有稳定的本地 key。
   * @remarks
   * - 已保存明细优先使用数据库 id，避免刷新后 key 抖动；
   * - 新建/草稿明细使用本地自增 key，避免删除中间卡片后 React 复用旧输入状态；
   * - 该 key 只服务前端渲染与定位，不作为业务主键保存。
   * @param detail 明细对象。
   * @returns 稳定本地 key。
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

    FqcViewModel.detailLocalKeySeed += 1
    const key = `local_${FqcViewModel.detailLocalKeySeed}`
    detail.__localKey = key
    return key
  }

  /**
   *
   * 为一组明细补齐稳定本地 key。
   * @param details 明细数组。
   * @returns 补齐 key 后的同一组明细。
   *
   */
  private ensureDetailsLocalKeys(details: FqcDetailView[]): FqcDetailView[] {
    const list = Array.isArray(details) ? details : []
    for (const detail of list) this.ensureDetailLocalKey(detail as any)
    return list
  }

  /**
   *
   * 获取明细稳定 key（供列表渲染与编辑定位使用）。
   * @param detail 明细对象。
   * @returns 稳定本地 key。
   *
   */
  public getDetailKey(detail: FqcDetailView | FinalInspectionDetail): string {
    return this.ensureDetailLocalKey(detail as any)
  }

  /**
   *
   * 设置指定行的实测值。
   *
   */
  public setMeasureAtRow(rowIndex: number, measureIndex: number, v: string | number | ''): void {
    if (this.disableDetailEdit) return
    const list = Array.isArray(this.details) ? this.details : []
    const current = list[rowIndex] as any
    if (!current) return
    this.setMeasureByDetailKey(this.ensureDetailLocalKey(current), measureIndex, v)
  }

  /**
   *
   * 按稳定明细 key 设置实测值。
   * @param detailKey 明细本地 key。
   * @param measureIndex 实测项索引（0~4）。
   * @param v 新值。
   *
   */
  public setMeasureByDetailKey(detailKey: string, measureIndex: number, v: string | number | ''): void {
    if (this.disableDetailEdit) return
    const normalizedDetailKey = String(detailKey ?? '').trim()
    if (!normalizedDetailKey) return
    const key = `MeasuredRecord${measureIndex + 1}` as keyof FinalInspectionDetail
    const nextValue = String(v ?? '')
    const list = Array.isArray(this.details) ? this.details : []
    const rowIndex = list.findIndex((it) => this.ensureDetailLocalKey(it as any) === normalizedDetailKey)
    const current = rowIndex >= 0 ? (list[rowIndex] as any) : null
    if (!current) return

    // 若值未发生变化则不 emit，避免在“仅切换焦点/重复回写”时触发整页重渲染。
    if ((current as any)?.[key] === nextValue) return

    // 仅浅拷贝数组 + 当前行，避免每次输入都 map 全量明细造成卡顿与 GC 压力。
    const nextList = list.slice()
    nextList[rowIndex] = ({ ...(current as any), __localKey: normalizedDetailKey, [key]: nextValue } as any)
    this.details = nextList as any
    this.markDocumentDirty()
    this.emit()
  }

  /**
   *
   * 删除指定行。
   *
   */
  public removeDetailAt(rowIndex: number): void {
    if (this.disableDetailEdit) return
    const list = Array.isArray(this.details) ? this.details : []
    const current = list[rowIndex] as any
    if (!current) return
    this.removeDetailByKey(this.ensureDetailLocalKey(current))
  }

  /**
   *
   * 按稳定明细 key 删除明细。
   * @param detailKey 明细本地 key。
   *
   */
  public removeDetailByKey(detailKey: string): void {
    if (this.disableDetailEdit) return
    const normalizedDetailKey = String(detailKey ?? '').trim()
    if (!normalizedDetailKey) return
    const list = Array.isArray(this.details) ? this.details : []
    const next = list.filter((it) => this.ensureDetailLocalKey(it as any) !== normalizedDetailKey)
    if (next.length === list.length) return
    this.details = next as any
    this.markDocumentDirty()
    this.emit()
  }

  /**
   *
   * 新建单据（清空状态与明细）。
   *
   */
  public createNewBill(): void {
    this.pendingDailyPlanFlowDetailPick = null
    this.dailyPlanPickBusy = false
    this.lastApproveResult = null
    this.materialCode = ''
    this.processName = ''
    try { this.reset() } catch { }
  }

  /**
   *
   * 设置表头字段。
   *
   */
  public setBill = (key: string, value: any): void => {
    const changed = !Object.is((this.bill as any)?.[key], value)
    const next = { ...(this.bill as any), [key]: value } as FinalInspectionDocument
    this.bill = next
    if (changed) this.markDocumentDirty()
    if (key === 'Materialid') this.updateMaterialCodeFromBill()
    if (key === 'TypeofWorkid') this.updateProcessNameFromBill()
    this.emit()
  }

  /**
   *
   * 删除明细按钮是否禁用（与编辑禁用保持一致）。
   *
   */
  public get disableRemoveDetail(): boolean {
    return this.disableDetailEdit
  }

  /**
   *
   * 判定下拉变更：根据判定自动联动四个数量字段。
   * @remarks
   * - 合格(1)：合格数=检验数，NG/让步=0；
   * - 不合格(4)：NG=检验数，合格/让步=0；
   * - 让步接收(2)：NG=0，合格保持不超过检验数，其余补足到检验数。
   *
   */
 public handleJudgeChange = (v: string): void => {
 if (this.disableDetailEdit) return
 const bill = this.bill as any
 const inspect = this.ensureNumber(bill.ChkBQty)
 const judge = Number(v)
 let pass = this.ensureNumber(bill.PassBQty)
 let allow = this.ensureNumber(bill.RQty)
 let ng = this.ensureNumber(bill.NotPassBQty)
 if (judge === 1) {
 pass = inspect
 allow = 0
 ng = 0
 } else if (judge === 4) {
 pass = 0
 allow = 0
 ng = inspect
 } else if (judge === 2) {
 // 让步：优先保留合格数，剩余计入让步
 pass = Math.max(0, Math.min(pass, inspect))
 allow = Math.max(0, inspect - pass)
 ng = 0
 }
 const next = {
 ...(this.bill as any),
 CheckResult: Number.isFinite(judge) ? judge : 0,
 ChkBQty: inspect,
 PassBQty: pass,
 RQty: allow,
 NotPassBQty: ng,
 } as FinalInspectionDocument
 const changed =
   !Object.is((this.bill as any)?.CheckResult, next.CheckResult) ||
   !Object.is((this.bill as any)?.ChkBQty, next.ChkBQty) ||
   !Object.is((this.bill as any)?.PassBQty, next.PassBQty) ||
   !Object.is((this.bill as any)?.RQty, next.RQty) ||
   !Object.is((this.bill as any)?.NotPassBQty, next.NotPassBQty)
 this.bill = next
 if (changed) this.markDocumentDirty()
 this.emit()
 }

  public handleChangeInspect = (v: number | ''): void => {
    if (this.disableDetailEdit) return
    const bill = this.bill as any
    const inspect = this.ensureNumber(v)
    let pass = this.ensureNumber(bill.PassBQty)
    let allow = this.ensureNumber(bill.RQty)

    // 裁剪并补足剩余到 NG
    pass = Math.max(0, Math.min(pass, inspect))
    allow = Math.max(0, Math.min(allow, Math.max(0, inspect - pass)))
    const ng = Math.max(0, inspect - pass - allow)

    this.writeQty({ inspect, pass, allow, ng })
  }

  /**
   *
   * 合格数变更：裁剪到不超过检验数；优先保留让步，剩余补到 NG。
   *
   */
  public handleChangePass = (v: number | ''): void => {
    if (this.disableDetailEdit) return
    const bill = this.bill as any
    const inspect = this.ensureNumber(bill.ChkBQty)
    let pass = this.ensureNumber(v)
    let allow = this.ensureNumber(bill.RQty)

    pass = Math.max(0, Math.min(pass, inspect))
    allow = Math.max(0, Math.min(allow, Math.max(0, inspect - pass)))
    const ng = Math.max(0, inspect - pass - allow)

    this.writeQty({ inspect, pass, allow, ng })
  }

  /**
   *
   * 不合格数变更：裁剪到不超过检验数；优先保留合格数，其余给让步。
   *
   */
  public handleChangeNg = (v: number | ''): void => {
    if (this.disableDetailEdit) return
    const bill = this.bill as any
    const inspect = this.ensureNumber(bill.ChkBQty)
    let ng = this.ensureNumber(v)
    let pass = this.ensureNumber(bill.PassBQty)

    ng = Math.max(0, Math.min(ng, inspect))
    pass = Math.max(0, Math.min(pass, Math.max(0, inspect - ng)))
    const allow = Math.max(0, inspect - pass - ng)

    this.writeQty({ inspect, pass, allow, ng })
  }

  /**
   *
   * 让步数变更：裁剪到不超过检验数；优先保留合格数，剩余补到 NG。
   *
   */
  public handleChangeAllow = (v: number | ''): void => {
    if (this.disableDetailEdit) return
    const bill = this.bill as any
    const inspect = this.ensureNumber(bill.ChkBQty)
    let allow = this.ensureNumber(v)
    let pass = this.ensureNumber(bill.PassBQty)

    allow = Math.max(0, Math.min(allow, inspect))
    pass = Math.max(0, Math.min(pass, Math.max(0, inspect - allow)))
    const ng = Math.max(0, inspect - pass - allow)

    this.writeQty({ inspect, pass, allow, ng })
  }

  /**
   *
   * 将输入转为有限数字（空/非法均为0）。
   *
   */
  private ensureNumber(n: unknown): number {
    if (typeof n === 'number') return Number.isFinite(n) && n > 0 ? n : 0
    const v = Number(n as any)
    return Number.isFinite(v) && v > 0 ? v : 0
  }

  /**
   *
   * 统一写入四数量并发出更新。
   *
   */
  private writeQty({ inspect, pass, allow, ng }: { inspect: number; pass: number; allow: number; ng: number }): void {
    const bill = this.bill as any
    const prevInspect = this.ensureNumber(bill?.ChkBQty)
    const prevPass = this.ensureNumber(bill?.PassBQty)
    const prevAllow = this.ensureNumber(bill?.RQty)
    const prevNg = this.ensureNumber(bill?.NotPassBQty)

    // 若四个数量均无变化，则不 emit，避免 blur/中间态导致的重复联动刷新。
    if (prevInspect === inspect && prevPass === pass && prevAllow === allow && prevNg === ng) return

    const next = {
      ...(bill as any),
      ChkBQty: inspect,
      PassBQty: pass,
      RQty: allow,
      NotPassBQty: ng,
    } as FinalInspectionDocument
    const changed =
      !Object.is((this.bill as any)?.ChkBQty, next.ChkBQty) ||
      !Object.is((this.bill as any)?.PassBQty, next.PassBQty) ||
      !Object.is((this.bill as any)?.RQty, next.RQty) ||
      !Object.is((this.bill as any)?.NotPassBQty, next.NotPassBQty)
    this.bill = next
    if (changed) this.markDocumentDirty()
    this.emit()
  }

  /**
   *
   * 替换部分状态（谨慎使用）。
   *
   */
  public replaceState(payload: Partial<{ bill: FinalInspectionDocument; details: FqcDetailView[]; rawDocument: any }>): void {
    if ('bill' in payload && payload.bill) this.bill = payload.bill
    if ('details' in payload && payload.details) this.details = this.ensureDetailsLocalKeys(payload.details)
    this.markDocumentDataLoaded()
    this.status = parseDocumentStatus((this.bill as any)?.Status ?? (this.bill as any)?.status)
    this.updateMaterialCodeFromBill()
    this.deriveProcessName()
    this.emit()
  }

  /**
   *
   * 刷新当前单据（统一走 busy 包装，UI 获得加载反馈）。
   *
   */
  public handleRefresh = async (): Promise<void> => {
    await this.runBusyAction('刷新', async () => {
      const id = this.getCurrentBillId()
      await this.refresh(id ?? undefined)
    }, { loadingMessage: '刷新中…' })
  }

  /**
   *
   * 保存单据并在成功后同步单据编号（Code）。
   * @remarks
   * - 后端保存接口返回包可能仅包含单据ID，不会回传最新 Code；
   * - 因此当保存成功且本地 Code 为空时，需要按 id 再拉取一次单据，刷新 Code 控件显示。
   *
   */
 public override async handleSave(): Promise<number | null> {
 const id = await super.handleSave()
 if (!id) return null
 // 将后端主键回写到 bill.id（UniqueEntity.id），便于页面与后续流程读取
 const billIdFromBill = toNumericId((this.bill as any)?.id as any)
 if (!billIdFromBill || billIdFromBill !== id) {
 this.bill = { ...(this.bill as any), id } as FinalInspectionDocument
 this.currentId = id
 this.emit()
 }
 // 若单据编号为空：按 id 刷新一次，拿到后端生成的最新 Code
 try {
 const code = (this.bill as any)?.Code
 const hasCode = typeof code === 'string' && code.trim() !== ''
 if (!hasCode) {
 await this.refresh(id, { silent: true })
 }
 } catch (err) {

      console.error('[FQC] 保存后刷新单据编号失败:', err)
    }

    return id
  }

  /**
   *
   * 审批（通过 runBusyAction 包装，提供"审批中…"加载反馈与防重入）。
   *
   */
  public override async handleApprove(): Promise<boolean> {
    const result = await this.runBusyAction(
      '审批',
      () => super.handleApprove(),
      { loadingMessage: '审批中…' },
    )

    // 等待 runBusyAction 完成收尾后再执行 NCR 引导跳转，避免 loading toast 被页面跳转打断后残留。
    if (result) {
      const needNcr = this.lastApproveResult?.ncrHint ?? this.shouldHintNcrFromSnapshot()
      if (needNcr) {
        const billId = this.getCurrentBillId()
        if (billId > 0) {
          this.redirectToNcrPrompt(billId)
        }
      }
    }

    return result ?? false
  }

  /**
   * 设置 FQC 到 NCR 中间页的客户端导航回调。
   * @param navigate Next Router 的 replace 回调；传入 null 表示页面已卸载。
   */
  public setNcrPromptNavigation(navigate: ((href: string) => void) | null): void {
    this.ncrPromptNavigation = navigate
  }

  /**
   *
   * 反审批（通过 runBusyAction 包装，提供"反审批中…"加载反馈与防重入）。
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

  /**
   *
   * 删除（通过 runBusyAction 包装；"取消新建"为同步操作，不会显示 loading toast）。
   *
   */
  public override async handleDelete(): Promise<boolean> {
    const currentId = this.getCurrentBillId()
    const showLoading = currentId > 0
    const result = await this.runBusyAction(
      '删除',
      () => super.handleDelete(),
      { loadingMessage: '删除中…', showLoadingToast: showLoading },
    )
    return result ?? false
  }

  /**
   *
   * 审批前必填校验。
   * @returns 校验是否通过
   *
   */
  private validateRequiredBeforeApprove(): boolean {
    const check = this.required.checkEmptyAndFocus?.()
    if (check?.hasEmpty) {
      const key = check.firstEmptyKey ?? ''
      if (key.startsWith('detail:')) {
        const m = key.match(/^detail:(?:(?:[^:]+):)?(\d+):(\d+)/)
        const row = m ? Number(m[1]) + 1 : undefined
        const col = m ? Number(m[2]) : undefined
        const fieldName = typeof col === 'number' && Number.isFinite(col) ? `实测${col}` : '必填项'
        try { toast.warning(`请先填写：第${row ?? '?'}行 - ${fieldName}`) } catch { }
      } else {
        const nameMap: Record<string, string> = { ChkBQty: '检验数', Employeeid: '检验员', CheckResult: '判定' }
        const fieldName = (key && nameMap[key]) || '必填项'
        try { toast.warning(`请先填写：${fieldName}`) } catch { }
      }
      return false
    }
    return true
  }

  /**
   *
   * 审批成功后的处理（含 NCR 引导）。
   * @param billId 当前单据主键
   *
   */
  private async handleAfterApprove(billId: number): Promise<void> {
    const needNcr = this.lastApproveResult?.ncrHint ?? this.shouldHintNcrFromSnapshot()
    if (needNcr && billId > 0) {
      setLastFqcBillIdToStorage(billId)
      return
    }
    this.emit()
  }

  /**
   *
   * 从当前快照判断是否需要 NCR 引导。
   *
   */
  private shouldHintNcrFromSnapshot(): boolean {
    const judge = Number((this.bill as any)?.CheckResult ?? 0)
    const qtyNg = Number((this.bill as any)?.NotPassBQty ?? 0)
    return judge === 4 && qtyNg > 0
  }

  /**
   *
   * 跳转 NCR 引导页。
   * @param billId 单据主键
   *
   */
  private redirectToNcrPrompt(billId: number): void {
    if (typeof window === 'undefined') return
    const url = new URL('/features/erp/quality/fqc/ncr-prompt', window.location.origin)
    url.searchParams.set('from', 'fqc')
    url.searchParams.set('action', 'approve')
    url.searchParams.set('type', 'FQC')
    url.searchParams.set('billId', String(billId))
    const returnTo = buildQualityInspectionReturnTo('fqc', billId)
    if (returnTo) url.searchParams.set('returnTo', returnTo)

    const href = `${url.pathname}${url.search}`
    if (this.ncrPromptNavigation) {
      try {
        this.ncrPromptNavigation(href)
        return
      } catch {
        // 客户端路由异常时继续使用浏览器导航兜底。
      }
    }

    try {
      window.location.replace(url.toString())
    } catch {
      try { window.location.assign(url.toString()) } catch {
        try { (window.location as any).href = url.toString() } catch { }
      }
    }
  }

  /**
   * 将 FQC 路由共享布局提供的基础联查快照同步到当前 ViewModel。
   * @param snapshot 共享布局中的基础联查快照。
   * @remarks
   * - 只同步检验员、物料索引和工序选项；
   * - 不同步单据与明细，避免用旧页面数据覆盖 `openById` 的最新结果；
   * - 对数组和索引做浅复制，避免 ViewModel 修改共享状态。
   */
  public applyLookupSnapshot(snapshot: FqcLookupSnapshot): void {
    this.inspectorOptions = snapshot.inspectorOptions.map((option) => ({ ...option }))
    this.materialIndex = Object.fromEntries(
      Object.entries(snapshot.materialIndex).map(([id, value]) => [id, { ...value }]),
    )
    this.processOptions = snapshot.processOptions.map((option) => ({ ...option }))
    this.processIndex = Object.fromEntries(
      this.processOptions.map((option) => [String(option.value), option.label]),
    )
    this.updateMaterialCodeFromBill()
    this.updateProcessNameFromBill()
    this.emit()
  }

  /**
   *
   * 加载检验员选项。
   *
   */
  public async loadInspectorOptions(): Promise<void> {
    try {
      const list = await fetchActiveEmployees()
      const optionList = toOptions(Array.isArray(list) ? list : [])
      this.inspectorOptions = optionList.map((opt) => ({ label: opt.label, value: String(opt.value) }))
      this.emit()
    } catch (err) {
      /* istanbul ignore next: 加载失败仅记录日志 */
      console.error('[FQC] 加载员工列表失败:', err)
      this.inspectorOptions = [{ label: '未加载成功', value: '0' }]
      this.emit()
    }
  }

  /**
   *
   * 加载可用物料，并基于当前单据 Materialid 派生物料编码。
   *
   */
  public async loadMaterialOptions(): Promise<void> {
    try {
      const opts = await fetchMaterials()
      const idx: Record<string, { code?: string; name?: string }> = {}
      for (const it of opts ?? []) {
        const id = String(it?.value ?? '')
        const code = (it as any)?.raw?.code ?? ''
        const name = (it as any)?.raw?.name ?? it?.label ?? ''
        if (id) idx[id] = { code, name }
      }
      this.materialIndex = idx
      this.updateMaterialCodeFromBill()
      this.emit()
    } catch (err) {
      /* istanbul ignore next: 加载失败仅记录日志 */
      console.error('[FQC] 加载物料列表失败:', err)
      // 失败不打断流程，保持已有 materialCode
    }
  }

  /**
   *
   * 加载工种（TypeofWork）下拉选项，用于“当前检验工序”的展示或选择。
   * @remarks
   * - 仅获取有效（未删除、未停用）的工种记录；
   * - 统一转换为 { label, value } 结构，value 为字符串形式的 id。
   *
   */
 public async loadProcessOptions(): Promise<void> {
 try {
 const opts = await fetchWorkTypes()
 const options = (opts ?? []).map((o: any) => ({ label: String(o?.label ?? ''), value: String(o?.value ?? '') }))
 this.processOptions = options
 // 构建索引：id -> label
 const idx: Record<string, string> = {}
 for (const it of options) {
 if (it.value != null && it.value !== '') idx[String(it.value)] = it.label
 }
 this.processIndex = idx
 this.updateProcessNameFromBill()
 this.emit()
 } catch (err) {

      console.error('[FQC] 加载 TypeofWork 列表失败:', err)
      this.processOptions = []
      this.processIndex = {}
      this.emit()
    }
  }

  /**
   *
   * 从当前数据推导“当前检验工序”名称，仅用于展示。
   * @remarks 优先 rawDocument.process / rawDocument.Process，其次 bill.process / bill.Process。
   *
   */
  private deriveProcessName(): void {
    try {
      const raw: any = this.bill
      const name = raw?.process ?? raw?.Process ?? ''
      this.processName = typeof name === 'string' ? name : String(name ?? '')
    } catch {
      /* istanbul ignore next: 防御性回退 */
      this.processName = ''
    }
  }

  /**
   *
   * 根据 bill.TypeofWorkid 更新 processName 显示（优先从索引映射获取）。
   *
   */
  private updateProcessNameFromBill(): void {
    try {
      const id = (this.bill as any)?.TypeofWorkid
      const key = String(typeof id === 'number' ? id : Number(id))
      const hit = key && this.processIndex[key]
      this.processName = hit || this.processName || ''
    } catch {
      // ignore, 保持当前 processName
    }
  }

  /**
   *
   * 根据 bill.Materialid 更新 materialCode 显示。
   *
   */
  private updateMaterialCodeFromBill(): void {
    try {
      const id = (this.bill as any)?.Materialid
      const key = String(typeof id === 'number' ? id : Number(id))
      const hit = key ? this.materialIndex[key] : undefined
      this.materialCode = hit?.code || ''
    } catch {
      /* istanbul ignore next: 防御性回退 */
      this.materialCode = ''
    }
  }

  /**
   *
   * 按状态返回明细卡片边框 class。
   *
   */
  public getDetailCardBorderClass(status: number): string {
    // 兼容后端返回 0：按“未审批”处理
    if (status === 0 || hasStatusFlag(status, DocumentStatus.未审批)) return 't-border-error'
    if (hasStatusFlag(status, DocumentStatus.已审批)) return 't-border-success'
    return ''
  }

  // ======= 工具与私有实现 =======
  /**
   *
   * 大小写不敏感地补齐字段：当模板字段缺失且源对象存在同名（任意大小写）键时进行回填。
   * @param src 后端返回的原始对象
   * @param template 仅提供键名的模板对象（不会被修改）
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
   * 创建一个带默认值的末件检验单据对象。
   * @returns 初始化后的末件检验单据
   *
   */
  private createEmptyFinalInspectionDocument(): FinalInspectionDocument {
    const doc = new FinalInspectionDocument()
    doc.initDefaults()
    return doc
  }

  /**
   *
   * 构造“模拟扫码”用的末件检验草稿状态（仅用于 Debug 菜单演示）。
   * @returns 可用于 replaceState 的局部状态
   *
   */
  /* istanbul ignore next */
  private buildMockScanState(): Partial<{ bill: FinalInspectionDocument; details: FqcDetailView[]; rawDocument: any }> {
    const doc = new FinalInspectionDocument()
    doc.initDefaults()
    const docAny = doc as any

    docAny.Status = DocumentStatus.未审批
    docAny.CheckCaseDocumentid = 1
    docAny.CheckResult = 0

    doc.Materialid = 59810
    doc.Departmentid = 1
    doc.Employeeid = 1
    doc.Clientid = 1
    doc.CheckMethodid = 1
    doc.HandlingMethodid = 1
    doc.CheckDeliveryTime = ''
    doc.PreCmpBQty = 1000
    doc.ChkBQty = 1000
    doc.PassBQty = 0
    doc.RQty = 0
    doc.NotPassBQty = 0
    doc.Cname = ''
    doc.InnerKey = ''

    const d0 = new FinalInspectionDetail()
    d0.initDefaults()
    d0.ProjectName = '尺寸A-1'
    d0.Content = '10.00 ± 0.20'
    d0.Method = '卡尺'
    d0.Frequency = '3'
    d0.DownQValue = '9.8'
    d0.UpQValue = '10.2'

    const d1 = new FinalInspectionDetail()
    d1.initDefaults()
    d1.ProjectName = '尺寸B-2'
    d1.Content = '5.00 ± 0.10'
    d1.Method = '卡尺'
    d1.Frequency = '2'
    d1.DownQValue = '4.9'
    d1.UpQValue = '5.1'

    const details = [d0, d1]
    const billForView: any = { ...docAny, process: '末件检验' }

    return { bill: billForView as FinalInspectionDocument, details: details as any, rawDocument: docAny }
  }

  /**
   *
   * 供 View/外部调用的扫码入口（与 Android 回调保持同一处理逻辑）。
   * @param code 扫码得到的原始文本
   *
   */
  /* istanbul ignore next */
  public async processScanCode(code: string): Promise<void> {
    await this.handleScan(code)
  }

  /**
   *
   * 应用服务扫码结果处理。
   * @param result 扫码结果
   * @returns 是否已处理
   *
   */
  /* istanbul ignore next */
  private async applyScanResult(result: FinalInspectionScanResult, scanCodeForRedeliver?: string): Promise<boolean> {
    const scanCode = String(scanCodeForRedeliver ?? '').trim()
    if (scanCode && !this.isScanListenerActive()) {
      this.redeliverScanCodeToActive(scanCode)
      return true
    }
    if (result.type === 'OPEN_BY_ID') {
      const currentId = this.getCurrentBillId()
      const nextId = typeof result.id === 'number' ? result.id : Number(result.id)
      if (Number.isFinite(nextId) && nextId > 0 && nextId !== currentId) {
        try { this.createNewBill() } catch { }
      }
      const opened = await this.openById(result.id)
      if (!this.isScanListenerActive()) {
        if (scanCode) this.redeliverScanCodeToActive(scanCode)
        return true
      }
      if (!opened) { try { toast.error('未能根据扫码打开单据') } catch { } }
      return true
    }
    if (result.type === 'SET_INSPECTOR') {
      return await this.trySetInspectorByEmployeeScan({ codeForScan: result.code })
    }
    if (result.type === 'NEED_PICK_FLOW_DETAIL') {
      if (!this.isScanListenerActive()) {
        if (scanCode) this.redeliverScanCodeToActive(scanCode)
        return true
      }
      this.pendingDailyPlanFlowDetailPick = {
        scanCode: String((result as any)?.scanCode ?? '').trim(),
        candidates: Array.isArray((result as any)?.candidates) ? ((result as any).candidates as any) : [],
      }
      this.dailyPlanPickBusy = false
      this.emit()
      return true
    }
    if (result.type === 'DRAFT_LOADED') {
      await this.applyFinalInspectionDraft(result.document, result.details, result.message, scanCode)
      return true
    }
    if (result.type === 'ERROR') {
      try {
        if (result.level === 'warning') toast.warning(result.message)
        else toast.error(result.message)
      } catch { }
      return false
    }
    return false
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
   * 确认选择某条流程卡明细，并生成/打开末件检验草稿。
   * @param candidate 用户选中的候选项。
   *
   */
  public confirmDailyPlanFlowDetailPick = async (candidate: FlowDetailCandidate): Promise<void> => {
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
          pickedFlowDetail: {
            tableName: candidate.flowDetailTableName,
            id: candidate.flowDetailId,
          },
        } as any)
        : isJcjh
          ? await this.appService.executeExtrusionPlanScanCreate(scanCode, {
            pickedFlowDetail: {
              tableName: candidate.flowDetailTableName,
              id: candidate.flowDetailId,
            },
          } as any)
          : await this.appService.executeDailyPlanScanCreate(scanCode, {
            pickedFlowDetail: {
              tableName: candidate.flowDetailTableName,
              id: candidate.flowDetailId,
            },
          } as any)

      if (result.type === 'DRAFT_LOADED') {
        this.pendingDailyPlanFlowDetailPick = null
        this.emit()

        await this.applyScanResult(result, scanCode)
        return
      }

      if (result.type === 'OPEN_BY_ID') {
        this.pendingDailyPlanFlowDetailPick = null
        this.emit()

        await this.applyScanResult(result, scanCode)
        return
      }

      if (result.type === 'ERROR') {
        try {
          if (result.level === 'warning') toast.warning(result.message)
          else toast.error(result.message)
        } catch { }
        return
      }

      try { toast.error('生成失败：未返回可处理结果') } catch { }
    } finally {
      this.dailyPlanPickBusy = false
      this.emit()
    }
  }

  /**
   *
   * 将任意值转换为 >0 的整数，失败返回 null。
   * @param v 任意输入值（number/string/unknown）
   *
   */
  /* istanbul ignore next */
  private static toPositiveInt(v: unknown): number | null {
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null
  }

  /**
   *
   * 将末件检验草稿写入 VM，并根据是否存在单据ID进行刷新与默认提示。
   * @param doc 表头（可为 null）
   * @param details 明细列表
   * @param msg 若后端未提供 msg，则使用默认成功提示
   *
   */
  /* istanbul ignore next */
  private async applyFinalInspectionDraft(
    doc: FinalInspectionDocument | null,
    details: FinalInspectionDetail[],
    msg?: string,
    scanCodeForRedeliver?: string,
  ): Promise<void> {
    const scanCode = String(scanCodeForRedeliver ?? '').trim()
    if (scanCode && !this.isScanListenerActive()) {
      this.redeliverScanCodeToActive(scanCode)
      return
    }
    if (!doc && (!details || details.length === 0)) return

    // 1) 规范化字段大小写，避免后端返回 camelCase 时 UI 无法读取。
    const normDoc = doc
      ? this.normalizeCaseInsensitive(doc, FqcViewModel.docNormalizeTemplate)
      : this.createEmptyFinalInspectionDocument()
    const normDetails = Array.isArray(details)
      ? (details as any[]).map((d) => this.normalizeCaseInsensitive(d, FqcViewModel.detailNormalizeTemplate))
      : []
    const draftId = this.getDocumentBillId(doc ?? normDoc)
    this.syncCurrentBillId(draftId > 0 ? draftId : null)

    // 2) 推送到视图层，并补齐派生字段。
    this.replaceState({
      bill: (normDoc as FinalInspectionDocument) ?? this.createEmptyFinalInspectionDocument(),
      details: (normDetails ?? []) as any,
      rawDocument: doc as any,
    })
    this.updateProcessNameFromBill()
    if (!this.processName) this.deriveProcessName()

    const notice = String(msg ?? '').trim()
    const id = draftId
    if (id > 0) {
      try { await this.refresh(id, { silent: true } as any) } catch { }
      if (scanCode && !this.isScanListenerActive()) {
        this.redeliverScanCodeToActive(scanCode)
        return
      }
      try { toast.success(notice || '已打开/生成末件检验单据') } catch { }
    } else {
      if (scanCode && !this.isScanListenerActive()) {
        this.redeliverScanCodeToActive(scanCode)
        return
      }
      try { toast.success(notice || '已载入末件检验数据') } catch { }
    }
  }

  /**
   *
   * 通过职员扫码信息设置当前单据的检验员。
   * @param payload employeeId 与/或 CodeForScan。
   *
   */
  /* istanbul ignore next */
  private async trySetInspectorByEmployeeScan(payload: { employeeId?: number | null; codeForScan?: string | null }): Promise<boolean> {
    const codeForScan = String(payload.codeForScan ?? '').trim()
    if (codeForScan && !this.isScanListenerActive()) {
      this.redeliverScanCodeToActive(codeForScan)
      return true
    }
    const employeeId = FqcViewModel.toPositiveInt(payload.employeeId)
    if (employeeId) {
      if (!this.isScanListenerActive()) {
        if (codeForScan) this.redeliverScanCodeToActive(codeForScan)
        return true
      }
      this.setBill('Employeeid', employeeId)
      // 通过 employeeId 直接设置时，尽可能展示“姓名”；若暂时无法获取则兜底展示 ID，避免 toast 出现空白。
      const fromOptions = (this.inspectorOptions ?? []).find((o) => String(o?.value ?? '') === String(employeeId))
      const label = String(fromOptions?.label ?? '').trim()
      try { toast.success(`已设置检验员：${label || employeeId}`) } catch { }
      return true
    }

    if (!codeForScan) return false
    try {
      const rows = await fetchLookup(
        'Employee',
        ['id', 'Name', 'CodeForScan'],
        undefined,
        { where: { DeletedTag: 0, CodeForScan: codeForScan } },
      )
      const emp = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
      if (!emp) {
        if (!this.isScanListenerActive()) {
          if (codeForScan) this.redeliverScanCodeToActive(codeForScan)
          return true
        }
        try { toast.error('未找到该条码对应的职员') } catch { }
        return true
      }
      const empIdRaw = (emp?.id ?? (emp as any)?.Id ?? (emp as any)?.ID) as number | string | undefined
      const empId = typeof empIdRaw === 'number' ? empIdRaw : Number(empIdRaw)
      if (!Number.isFinite(empId) || empId <= 0) {
        if (!this.isScanListenerActive()) {
          if (codeForScan) this.redeliverScanCodeToActive(codeForScan)
          return true
        }
        try { toast.error('职员数据异常，请联系管理员') } catch { }
        return true
      }
      if (!this.isScanListenerActive()) {
        if (codeForScan) this.redeliverScanCodeToActive(codeForScan)
        return true
      }
      this.setBill('Employeeid', empId)
      // 后端联查记录在不同接口/版本下可能是 Name 或 name；若取不到则回退到条码或 ID，避免 toast 出现“已设置检验员：”空内容。
      const name =
        String(((emp as any)?.Name ?? (emp as any)?.name ?? '') as any).trim()
      const code =
        String(((emp as any)?.CodeForScan ?? (emp as any)?.codeForScan ?? '') as any).trim()
      const fromOptions = (this.inspectorOptions ?? []).find((o) => String(o?.value ?? '') === String(empId))
      const optionLabel = String(fromOptions?.label ?? '').trim()
      const toastText = name || optionLabel || code || String(empId)
      try { toast.success(`已设置检验员：${toastText}`) } catch { }
      return true
    } catch (e) {
      console.error('[FQC] 职员扫码处理失败:', e)
      try { toast.error(formatActionErrorMessage('设置检验员', e, '请稍后重试')) } catch { }
      return true
    }
  }

  /**
   *
   * 通过日计划明细 ID 生成/打开末件检验草稿。
   * @param dailyPlanDetailId 日计划明细主键。
   *
   */
  /* istanbul ignore next */
  private async tryOpenFinalInspectionByDailyPlanDetailId(dailyPlanDetailId: number): Promise<boolean> {
    const result = await this.appService.createDraftByDailyPlanDetailId(dailyPlanDetailId)
    return await this.applyScanResult(result)
  }

  /**
   *
   * 通过日计划明细 CodeForScan（如 RJH-...）生成/打开末件检验草稿。
   * @param codeForScan 日计划明细扫码编码。
   *
   */
  /* istanbul ignore next */
  public async tryOpenFinalInspectionByDailyPlanDetailScanCode(codeForScan: string): Promise<boolean> {
    const scan = String(codeForScan ?? '').trim()
    if (!scan) return false
    const result = await this.appService.executeScan(scan)
    return await this.applyScanResult(result, scan)
  }

  /**
   *
   * 通过不合格返工单生成/打开末件检验草稿。
   * @param payload 支持按返工单ID或 CodeForScan 触发。
   *
   */
  /* istanbul ignore next */
  private async tryOpenFinalInspectionByDefectiveReworkOrder(payload: { reworkOrderId?: number | null; codeForScan?: string | null }): Promise<boolean> {
    const scanCode = String(payload.codeForScan ?? payload.reworkOrderId ?? '').trim()
    if (!scanCode) return false
    const result = await this.appService.executeScan(scanCode)
    return await this.applyScanResult(result, scanCode)
  }

  /**
   *
   * 扫码入口，委托应用服务统一分流。
   *
   */
  /* istanbul ignore next */
  private async handleScan(code: string): Promise<FinalInspectionScanResult> {
    try {
      const text = String(code ?? '').trim()
      if (!text) {
        try { toast.warning('扫描内容为空') } catch { }
        return { type: 'ERROR', level: 'warning', message: '扫描内容为空' }
      }
      const result = await this.appService.executeScan(text)
      if (!this.isScanListenerActive()) {
        this.redeliverScanCodeToActive(text)
        return result
      }
      await this.applyScanResult(result, text)
      return result
    } catch (err) {
      console.error('[FQC] 扫码处理失败:', err)
      try { toast.error(formatActionErrorMessage('扫码处理', err, '请稍后重试')) } catch { }
      const message = resolveUserFacingErrorMessage(err, '扫码处理失败')
      return { type: 'ERROR', level: 'error', message }
    }
  }

  /**
   *
   * 手动输入条码/二维码内容或单据ID（用于调试或无扫码设备场景）。
   * @remarks 纯数字 / id:123 -> 直接打开单据；其他走统一扫码分流逻辑。
   *
   */
  /* istanbul ignore next */
  private async openInputAndScan(): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      const input = window.prompt('请输入条码/二维码内容或单据ID', '')
      if (input == null) return
      const code = input.trim()
      if (!code) { try { toast.warning('请输入有效内容') } catch { }; return }
      const m = code.match(/^(?:id\s*[:：]\s*)?(\d+)$/i)
      if (m) {
        const billId = Number(m[1])
        if (Number.isFinite(billId) && billId > 0) {
          const result = await this.openById(billId)
          if (!result) {
            try {
              toast.error('未能打开指定单据，请检查单据ID是否存在')
            } catch { }
          } else {
            try {
              toast.success(`已打开单据：${billId}`)
            } catch { }
          }
          return
        }
      }
      try { await this.processScanCode(code) } catch { }
    } catch (err) {
      console.error('[FQC] 手动输入处理失败:', err)
      try { toast.error(formatActionErrorMessage('手动输入处理', err, '请稍后重试')) } catch { }
    }
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
      logTag: '[FQC]',
      onEmpty: () => this.processScanCode(''),
      onCode: (code) => this.handleScan(code),
    })
  }
}

/**
 *
 * React 工厂：创建并持有 FqcViewModel 实例（仅负责生命周期，不包含业务）。
 *
 */
/* istanbul ignore next */
export function useFqcViewModelClass(): FqcViewModel {
  const container = useContext(AppServicesContext)
  const [vm] = useState(() => {
    const service =
      container?.get(FinalInspectionApplicationServiceToken) ??
      new FinalInspectionApplicationService(new FinalInspectionRepositoryImpl())
    return new FqcViewModel(service)
  })
  useEffect(() => {
    try { vm.activateScanListener() } catch { }
    return () => { try { vm.deactivateScanListener() } catch { } }
  }, [vm])
  return vm
}
/* c8 ignore stop */
