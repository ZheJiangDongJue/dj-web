/**
 *
 * Quality API（与后端 QualityController 对齐）
 * 说明：
 * - 后端：ERP.WebApi.Controllers.Api.QualityController
 * - 路由：/api/Quality/[action]
 * - 本文件仅保留“后端真实存在”的接口封装，避免通过假设猜测接口形态。
 *
 */
import { BillApiClient, type ActionCallOptions } from './bill-api.client'
import { getItemsExSafe } from './lookup-core'
import { CreateFinalInspectionByProduceFlowDetail, CreateFirstInspectionByProduceFlowDetail } from './craft-api'
import { DEFAULT_DB_NAME } from '@/lib/config'
import type { UserInfo } from '@/lib/erp/bill-api'
import type { ApiMessagePack, DbChangedPackResult } from '@/types/api'

/**
 *
 * 单例客户端（指向 /api/Quality）
 *
 */
const _client = new BillApiClient({ controllerPath: '/api/Quality' })

/**
 *
 * 生产流程卡相关客户端（指向 /api/ProduceFlowApi）
 *
 */
const _produceFlowClient = new BillApiClient({ controllerPath: '/api/ProduceFlowApi' })

export interface DefectiveReworkOrderFinalInspectionDraftInput {
  dbName?: string
  user: UserInfo
  defectiveReworkOrderDocumentId?: number
  scanForCode?: string
}

export interface DefectiveReworkOrderFirstInspectionDraftInput {
  dbName?: string
  user: UserInfo
  defectiveReworkOrderDocumentId?: number
  scanForCode?: string
}

export interface CreateDefectiveReworkOrderByDailyPlanScanCodeInput {
  dbName?: string
  user: UserInfo
  scanForCode: string
  inspectorEmployeeid?: number
  /** 可选：指定流程卡明细表名（如 ProcessAssemblyFlowDetail/ProduceFlowDetail），用于多“当前工序明细”时由客户端先选择 */
  flowDetailTableName?: string
  /** 可选：指定流程卡明细主键（与 flowDetailTableName 配套） */
  flowDetailId?: number
}

export interface DefectiveReworkOrderDraftByInspectionInput {
  dbName?: string
  user: UserInfo
  /** 检验单据类型：支持 'FAI'/'FQC' 或后端识别的 TableName（如 FirstInspectionDocument/FinalInspectionDocument） */
  inspectionDocumentType: string
  /** 检验单据主键 */
  inspectionDocumentId: number
}

export interface DefectiveReworkOrderDraftByDefectiveReworkOrderInput {
  dbName?: string
  user: UserInfo
  /** 不合格返工单主键；与 scanForCode 二选一，优先级高于 scanForCode */
  defectiveReworkOrderDocumentId?: number
  /** 不合格返工单扫码码（DefectiveReworkOrderDocument.CodeForScan，如 FGD-*） */
  scanForCode?: string
  /** 可选检验员；有效时写入新返工单草稿 Employeeid */
  inspectorEmployeeid?: number
}

export interface SaveDefectiveReworkOrderWithFilesInput {
  dbName?: string
  user: UserInfo
  document: unknown
  details: unknown[]
  checkDetails?: unknown[]
  files?: unknown[]
}

export interface DefectiveReworkOrderDraftByDailyPlanScanCodeInput extends CreateDefectiveReworkOrderByDailyPlanScanCodeInput {}

export interface LatestDefectiveReworkOrderByDailyPlanScanCodeInput {
  dbName?: string
  user: UserInfo
  scanForCode: string
}

export type LatestDefectiveReworkOrderResponse = {
  Id?: number
  id?: number
}

export type DefectiveReworkOrderDraftResponse<TDoc = unknown, TDetail = unknown, TCheckDetail = unknown> = {
  Document?: TDoc | null
  document?: TDoc | null
  Details?: TDetail[]
  details?: TDetail[]
  CheckDetails?: TCheckDetail[]
  checkDetails?: TCheckDetail[]
  SourceDocumentId?: number
  sourceDocumentId?: number
  SourceDocumentType?: string
  sourceDocumentType?: string
  SourceFlowDetailId?: number
  sourceFlowDetailId?: number
  SourceFlowDetailType?: string
  sourceFlowDetailType?: string
  SourceInspectionId?: number
  sourceInspectionId?: number
  SourceInspectionType?: string
  sourceInspectionType?: string
}

async function lookupFirstIdByCodeForScan(
  dbName: string,
  table: string,
  codeForScan: string,
  orderBy?: string,
): Promise<number | null> {
  const scan = String(codeForScan ?? '').trim()
  if (!scan) return null
  const getter = await getItemsExSafe()
  const rows = await getter({ dbName, table, select: ['id'], orderBy, where: { DeletedTag: 0, CodeForScan: scan }, take: 1 } as any)
  const raw = (rows as any[])?.[0]?.id ?? (rows as any[])?.[0]?.Id ?? (rows as any[])?.[0]?.ID
  const id = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(id) && id > 0 ? id : null
}

function hasDocumentOrDetails(pack: unknown): boolean {
  if (!pack || typeof pack !== 'object') return false
  const root = pack as Record<string, unknown> & { data?: Record<string, unknown> }
  const data = (root.data ?? (root as any).Data ?? root) as Record<string, unknown>
  const document = (data?.Document ?? data?.document ?? null) as unknown
  const details = (Array.isArray(data?.Details) ? data?.Details : Array.isArray(data?.details) ? data?.details : []) as unknown[]
  return !!document || (Array.isArray(details) && details.length > 0)
}

/**
 *
 * 通过“不合格返工单”获取或生成末件检验草稿（单据头+明细）。
 * 对应 C#: [HttpPost] GetFinalInspectionDraftByDefectiveReworkOrder([FromBody] DefectiveReworkOrderFinalInspectionDraftRequest request)
 *
 */
export async function GetFinalInspectionDraftByDefectiveReworkOrder<TDoc = unknown, TDetail = unknown>(
  payload: DefectiveReworkOrderFinalInspectionDraftInput,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const dbName = payload.dbName ?? DEFAULT_DB_NAME
  const scanForCode = String(payload.scanForCode ?? '').trim()
  let defectiveReworkOrderDocumentId = Number(payload.defectiveReworkOrderDocumentId ?? 0) || 0
  if (defectiveReworkOrderDocumentId <= 0 && scanForCode && /^FGD/i.test(scanForCode)) {
    defectiveReworkOrderDocumentId = (await lookupFirstIdByCodeForScan(dbName, 'DefectiveReworkOrderDocument', scanForCode, 'id desc')) ?? 0
  }
  const body = {
    DbName: dbName,
    User: payload.user,
    DefectiveReworkOrderDocumentId: defectiveReworkOrderDocumentId,
    ScanForCode: scanForCode,
  }
  return _client.callActionRaw<InspectionDraft<TDoc, TDetail>>(
    'GetFinalInspectionDraftByDefectiveReworkOrder',
    { method: 'POST', body } as ActionCallOptions,
  )
}

/**
 *
 * 通过“不合格返工单”获取或生成首件检验草稿（单据头+明细）。
 * 对应 C#: [HttpPost] GetFirstInspectionDraftByDefectiveReworkOrder([FromBody] DefectiveReworkOrderFirstInspectionDraftRequest request)
 *
 */
export async function GetFirstInspectionDraftByDefectiveReworkOrder<TDoc = unknown, TDetail = unknown>(
  payload: DefectiveReworkOrderFirstInspectionDraftInput,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const dbName = payload.dbName ?? DEFAULT_DB_NAME
  const scanForCode = String(payload.scanForCode ?? '').trim()
  let defectiveReworkOrderDocumentId = Number(payload.defectiveReworkOrderDocumentId ?? 0) || 0
  if (defectiveReworkOrderDocumentId <= 0 && scanForCode && /^FGD/i.test(scanForCode)) {
    defectiveReworkOrderDocumentId = (await lookupFirstIdByCodeForScan(dbName, 'DefectiveReworkOrderDocument', scanForCode, 'id desc')) ?? 0
  }
  const body = {
    DbName: dbName,
    User: payload.user,
    DefectiveReworkOrderDocumentId: defectiveReworkOrderDocumentId,
    ScanForCode: scanForCode,
  }
  return _client.callActionRaw<InspectionDraft<TDoc, TDetail>>(
    'GetFirstInspectionDraftByDefectiveReworkOrder',
    { method: 'POST', body } as ActionCallOptions,
  )
}

/**
 *
 * 扫描日计划条码（DailyPlanDetail.CodeForScan）生成不合格返工单（NCR）。
 * 对应 C#: [HttpPost] CreateDefectiveReworkOrderByDailyPlanScanCode([FromBody] CreateDefectiveReworkOrderByDailyPlanScanCodeRequest request)
 *
 */
export async function CreateDefectiveReworkOrderByDailyPlanScanCode(
  payload: CreateDefectiveReworkOrderByDailyPlanScanCodeInput,
): Promise<ApiMessagePack<{ Id: number; SourceInspectionId?: number; SourceInspectionType?: string }>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    ScanForCode: payload.scanForCode ?? '',
    InspectorEmployeeid: payload.inspectorEmployeeid ?? 0,
    FlowDetailTableName: payload.flowDetailTableName ?? '',
    FlowDetailId: payload.flowDetailId ?? 0,
  }
  return _client.callActionRaw<ApiMessagePack<{ Id: number; SourceInspectionId?: number; SourceInspectionType?: string }>>(
    'CreateDefectiveReworkOrderByDailyPlanScanCode',
    { method: 'POST', body } as ActionCallOptions,
  )
}

export interface CreateDefectiveReworkOrderByFlowDetailInput {
  dbName?: string
  user: UserInfo
  inspectorEmployeeid?: number
  flowDetailTableName: string
  flowDetailId: number
}

export interface DefectiveReworkOrderDraftByFlowDetailInput extends CreateDefectiveReworkOrderByFlowDetailInput {}

/**
 *
 * 按流程卡工序明细生成不合格返工单（NCR）。
 * 对应 C#: [HttpPost] CreateDefectiveReworkOrderByFlowDetail([FromBody] CreateDefectiveReworkOrderByFlowDetailRequest request)
 *
 */
export async function CreateDefectiveReworkOrderByFlowDetail(
  payload: CreateDefectiveReworkOrderByFlowDetailInput,
): Promise<ApiMessagePack<{ Id: number; SourceInspectionId?: number; SourceInspectionType?: string }>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    InspectorEmployeeid: payload.inspectorEmployeeid ?? 0,
    FlowDetailTableName: payload.flowDetailTableName ?? '',
    FlowDetailId: payload.flowDetailId ?? 0,
  }
  return _client.callActionRaw<ApiMessagePack<{ Id: number; SourceInspectionId?: number; SourceInspectionType?: string }>>(
    'CreateDefectiveReworkOrderByFlowDetail',
    { method: 'POST', body } as ActionCallOptions,
  )
}

/**
 *
 * 扫描日计划条码（DailyPlanDetail.CodeForScan）生成不合格返工单草稿（不落库）。
 * 对应 C#: [HttpPost] GetDefectiveReworkOrderDraftByDailyPlanScanCode([FromBody] CreateDefectiveReworkOrderByDailyPlanScanCodeRequest request)
 *
 */
export async function GetDefectiveReworkOrderDraftByDailyPlanScanCode<
  TDoc = unknown,
  TDetail = unknown,
  TCheckDetail = unknown,
>(
  payload: DefectiveReworkOrderDraftByDailyPlanScanCodeInput,
): Promise<ApiMessagePack<DefectiveReworkOrderDraftResponse<TDoc, TDetail, TCheckDetail>>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    ScanForCode: payload.scanForCode ?? '',
    InspectorEmployeeid: payload.inspectorEmployeeid ?? 0,
    FlowDetailTableName: payload.flowDetailTableName ?? '',
    FlowDetailId: payload.flowDetailId ?? 0,
  }
  return _client.callActionRaw<ApiMessagePack<DefectiveReworkOrderDraftResponse<TDoc, TDetail, TCheckDetail>>>(
    'GetDefectiveReworkOrderDraftByDailyPlanScanCode',
    { method: 'POST', body } as ActionCallOptions,
  )
}

/**
 *
 * 扫描日计划条码查询默认来源上的不合格返工单。
 * 对应 C#: [HttpPost] GetLatestDefectiveReworkOrderIdByDailyPlanScanCode([FromBody] CreateDefectiveReworkOrderByDailyPlanScanCodeRequest request)
 *
 */
export async function GetLatestDefectiveReworkOrderIdByDailyPlanScanCode(
  payload: LatestDefectiveReworkOrderByDailyPlanScanCodeInput,
): Promise<ApiMessagePack<LatestDefectiveReworkOrderResponse>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    ScanForCode: payload.scanForCode ?? '',
  }
  return _client.callActionRaw<ApiMessagePack<LatestDefectiveReworkOrderResponse>>(
    'GetLatestDefectiveReworkOrderIdByDailyPlanScanCode',
    { method: 'POST', body } as ActionCallOptions,
  )
}

/**
 *
 * 按流程卡工序明细生成不合格返工单草稿（不落库）。
 * 对应 C#: [HttpPost] GetDefectiveReworkOrderDraftByFlowDetail([FromBody] CreateDefectiveReworkOrderByFlowDetailRequest request)
 *
 */
export async function GetDefectiveReworkOrderDraftByFlowDetail<
  TDoc = unknown,
  TDetail = unknown,
  TCheckDetail = unknown,
>(
  payload: DefectiveReworkOrderDraftByFlowDetailInput,
): Promise<ApiMessagePack<DefectiveReworkOrderDraftResponse<TDoc, TDetail, TCheckDetail>>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    InspectorEmployeeid: payload.inspectorEmployeeid ?? 0,
    FlowDetailTableName: payload.flowDetailTableName ?? '',
    FlowDetailId: payload.flowDetailId ?? 0,
  }
  return _client.callActionRaw<ApiMessagePack<DefectiveReworkOrderDraftResponse<TDoc, TDetail, TCheckDetail>>>(
    'GetDefectiveReworkOrderDraftByFlowDetail',
    { method: 'POST', body } as ActionCallOptions,
  )
}

/**
 *
 * 保存不合格返工单及其附件（图片），支持单次请求提交单据 + 明细 + 附件。
 * 对应 C#: [HttpPost] SaveDefectiveReworkOrderWithFiles([FromBody] SaveDefectiveReworkOrderWithFilesDto dto)
 *
 */
export async function SaveDefectiveReworkOrderWithFiles(
  payload: SaveDefectiveReworkOrderWithFilesInput,
): Promise<DbChangedPackResult> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    Document: payload.document,
    Details: payload.details ?? [],
    CheckDetails: payload.checkDetails ?? [],
    Files: payload.files ?? [],
  }
  return _client.callActionRaw<DbChangedPackResult>(
    'SaveDefectiveReworkOrderWithFiles',
    { method: 'POST', body } as ActionCallOptions,
  )
}

// **************** 日计划驱动的首/末件检验（直接使用 ProduceFlowApi） ****************

export interface DailyPlanInspectionInput {
  dbName?: string
  user: UserInfo
  dailyPlanDetailId: number
}

type InspectionDraft<TDoc, TDetail> = ApiMessagePack<{ Document?: TDoc | null; Details?: TDetail[] }>
type DefectiveReworkOrderDraft<TDoc, TDetail, TCheckDetail> =
  ApiMessagePack<DefectiveReworkOrderDraftResponse<TDoc, TDetail, TCheckDetail>>

/**
 *
 * 扫码（按日计划明细 CodeForScan）→ 组装流程卡末件检验草稿。
 * - 通过本地 /api/general/get-items-ex 先定位日计划明细 id，再调用后端 ProduceFlowApi 的日计划入口。
 *
 */
export async function GetAssemblyFlowWithFinalInspectionByDailyPlanScanCode<TDoc = unknown, TDetail = unknown>(
  dbName: string = DEFAULT_DB_NAME,
  codeForScan: string,
  user: UserInfo,
): Promise<InspectionDraft<TDoc, TDetail> | null> {
  const id = await lookupFirstIdByCodeForScan(dbName, 'DailyPlanDetail', codeForScan)
  if (!id) return null
  const [packAssembly, packProduce] = await Promise.all([
    CreateFinalInspectionByDailyPlanAssembly<TDoc, TDetail>({ dbName, user, dailyPlanDetailId: id }).catch(() => null),
    CreateFinalInspectionByDailyPlanProduce<TDoc, TDetail>({ dbName, user, dailyPlanDetailId: id }).catch(() => null),
  ])
  if (packAssembly && hasDocumentOrDetails(packAssembly)) return packAssembly
  if (packProduce && hasDocumentOrDetails(packProduce)) return packProduce
  return null
}

/**
 *
 * 扫码（按日计划明细 CodeForScan）→ 组装流程卡首件检验草稿。
 * - 通过本地 /api/general/get-items-ex 先定位日计划明细 id，再调用后端 ProduceFlowApi 的日计划入口。
 *
 */
export async function GetAssemblyFlowWithFirstInspectionByDailyPlanScanCode<TDoc = unknown, TDetail = unknown>(
  dbName: string = DEFAULT_DB_NAME,
  codeForScan: string,
  user: UserInfo,
): Promise<InspectionDraft<TDoc, TDetail> | null> {
  const id = await lookupFirstIdByCodeForScan(dbName, 'DailyPlanDetail', codeForScan)
  if (!id) return null
  const [packAssembly, packProduce] = await Promise.all([
    CreateFirstInspectionByDailyPlanAssembly<TDoc, TDetail>({ dbName, user, dailyPlanDetailId: id }).catch(() => null),
    CreateFirstInspectionByDailyPlanProduce<TDoc, TDetail>({ dbName, user, dailyPlanDetailId: id }).catch(() => null),
  ])
  if (packAssembly && hasDocumentOrDetails(packAssembly)) return packAssembly
  if (packProduce && hasDocumentOrDetails(packProduce)) return packProduce
  return null
}

/**
 *
 * 扫码（优先按生产流程卡明细 CodeForScan）→ 生产流程卡末件检验草稿。
 * - 当前仅做“明细条码 → 草稿”的直达；若条码不是流程卡明细条码则返回 null 交由调用方继续兜底。
 *
 */
export async function GetProduceFlowWithFinalInspectionByExtrusionPlanScanCode<TDoc = unknown, TDetail = unknown>(
  dbName: string = DEFAULT_DB_NAME,
  codeForScan: string,
  user: UserInfo,
): Promise<InspectionDraft<TDoc, TDetail> | null> {
  const detailId = await lookupFirstIdByCodeForScan(dbName, 'ProduceFlowDetail', codeForScan)
  if (!detailId) return null
  return CreateFinalInspectionByProduceFlowDetail<TDoc, TDetail>({ dbName, user, detailid: detailId })
}

/**
 *
 * 扫码（优先按生产流程卡明细 CodeForScan）→ 生产流程卡首件检验草稿。
 * - 当前仅做“明细条码 → 草稿”的直达；若条码不是流程卡明细条码则返回 null 交由调用方继续兜底。
 *
 */
export async function GetProduceFlowWithFirstInspectionByExtrusionPlanScanCode<TDoc = unknown, TDetail = unknown>(
  dbName: string = DEFAULT_DB_NAME,
  codeForScan: string,
  user: UserInfo,
): Promise<InspectionDraft<TDoc, TDetail> | null> {
  const detailId = await lookupFirstIdByCodeForScan(dbName, 'ProduceFlowDetail', codeForScan)
  if (!detailId) return null
  return CreateFirstInspectionByProduceFlowDetail<TDoc, TDetail>({ dbName, user, detailid: detailId })
}

/**
 *
 * 按末件检验单 id 查询下游“不合格返工单”id 列表。
 * - 现阶段通过通用联查从 DefectiveReworkOrderDocument 侧反查 CreateByDocumentid。
 *
 */
export async function GetDefectiveReworkOrderIdsByFinalInspection(
  dbName: string = DEFAULT_DB_NAME,
  finalInspectionDocumentId: number,
): Promise<ApiMessagePack<{ Ids: number[] }>> {
  const id = Number(finalInspectionDocumentId)
  if (!Number.isFinite(id) || id <= 0) return { success: true, data: { Ids: [] } }

  const getter = await getItemsExSafe()
  const base = { DeletedTag: 0, CreateByDocumentid: id }
  let rows = await getter({
    dbName,
    table: 'DefectiveReworkOrderDocument',
    select: ['id'],
    orderBy: 'id desc',
    where: { ...base, CreateByDocumentType: 'FinalInspectionDocument' },
    take: 50,
  } as any)
  if (!Array.isArray(rows) || rows.length === 0) {
    rows = await getter({ dbName, table: 'DefectiveReworkOrderDocument', select: ['id'], orderBy: 'id desc', where: base, take: 50 } as any)
  }

  const ids = Array.isArray(rows)
    ? rows
        .map((r) => Number((r as any)?.id ?? (r as any)?.Id ?? (r as any)?.ID))
        .filter((n) => Number.isFinite(n) && n > 0)
    : []
  return { success: true, data: { Ids: ids } }
}

/**
 *
 * 日计划 → 组装流程卡首件检验草稿。
 * 对应 C#: [HttpPost] CreateFirstInspectionByDailyPlanAssembly([FromBody] DailyPlanInspectionRequest request)
 *
 */
export async function CreateFirstInspectionByDailyPlanAssembly<TDoc = unknown, TDetail = unknown>(
  payload: DailyPlanInspectionInput,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    DailyPlanDetailId: payload.dailyPlanDetailId,
  }
  return _produceFlowClient.callActionRaw<InspectionDraft<TDoc, TDetail>>(
    'CreateFirstInspectionByDailyPlanAssembly',
    { method: 'POST', body } as ActionCallOptions,
  )
}

/**
 *
 * 日计划 → 生产流程卡首件检验草稿。
 * 对应 C#: [HttpPost] CreateFirstInspectionByDailyPlanProduce([FromBody] DailyPlanInspectionRequest request)
 *
 */
export async function CreateFirstInspectionByDailyPlanProduce<TDoc = unknown, TDetail = unknown>(
  payload: DailyPlanInspectionInput,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    DailyPlanDetailId: payload.dailyPlanDetailId,
  }
  return _produceFlowClient.callActionRaw<InspectionDraft<TDoc, TDetail>>(
    'CreateFirstInspectionByDailyPlanProduce',
    { method: 'POST', body } as ActionCallOptions,
  )
}

/**
 *
 * 日计划 → 组装流程卡末件检验草稿。
 * 对应 C#: [HttpPost] CreateFinalInspectionByDailyPlanAssembly([FromBody] DailyPlanInspectionRequest request)
 *
 */
export async function CreateFinalInspectionByDailyPlanAssembly<TDoc = unknown, TDetail = unknown>(
  payload: DailyPlanInspectionInput,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    DailyPlanDetailId: payload.dailyPlanDetailId,
  }
  return _produceFlowClient.callActionRaw<InspectionDraft<TDoc, TDetail>>(
    'CreateFinalInspectionByDailyPlanAssembly',
    { method: 'POST', body } as ActionCallOptions,
  )
}

/**
 *
 * 日计划 → 生产流程卡末件检验草稿。
 * 对应 C#: [HttpPost] CreateFinalInspectionByDailyPlanProduce([FromBody] DailyPlanInspectionRequest request)
 *
 */
export async function CreateFinalInspectionByDailyPlanProduce<TDoc = unknown, TDetail = unknown>(
  payload: DailyPlanInspectionInput,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    DailyPlanDetailId: payload.dailyPlanDetailId,
  }
  return _produceFlowClient.callActionRaw<InspectionDraft<TDoc, TDetail>>(
    'CreateFinalInspectionByDailyPlanProduce',
    { method: 'POST', body } as ActionCallOptions,
  )
}

/**
 *
 * 根据检验单生成“不合格返工单（NCR）”草稿（不落库）。
 * 对应 C#: [HttpPost] GetDefectiveReworkOrderDraftByInspection([FromBody] DefectiveReworkOrderDraftByInspectionRequest request)
 *
 */
export async function GetDefectiveReworkOrderDraftByInspection<
  TDoc = unknown,
  TDetail = unknown,
  TCheckDetail = unknown,
>(
  payload: DefectiveReworkOrderDraftByInspectionInput,
): Promise<DefectiveReworkOrderDraft<TDoc, TDetail, TCheckDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    InspectionDocumentType: payload.inspectionDocumentType ?? '',
    InspectionDocumentId: payload.inspectionDocumentId ?? 0,
  }
  return _client.callActionRaw<DefectiveReworkOrderDraft<TDoc, TDetail, TCheckDetail>>(
    'GetDefectiveReworkOrderDraftByInspection',
    { method: 'POST', body } as ActionCallOptions,
  )
}

/**
 *
 * 根据“不合格返工单”生成其下游新 NCR 草稿（不落库）。
 * 对应 C#: [HttpPost] GetDefectiveReworkOrderDraftByDefectiveReworkOrder([FromBody] DefectiveReworkOrderDraftByDefectiveReworkOrderRequest request)
 *
 */
export async function GetDefectiveReworkOrderDraftByDefectiveReworkOrder<
  TDoc = unknown,
  TDetail = unknown,
  TCheckDetail = unknown,
>(
  payload: DefectiveReworkOrderDraftByDefectiveReworkOrderInput,
): Promise<DefectiveReworkOrderDraft<TDoc, TDetail, TCheckDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    DefectiveReworkOrderDocumentId: payload.defectiveReworkOrderDocumentId ?? 0,
    ScanForCode: payload.scanForCode ?? '',
    InspectorEmployeeid: payload.inspectorEmployeeid ?? 0,
  }
  return _client.callActionRaw<DefectiveReworkOrderDraft<TDoc, TDetail, TCheckDetail>>(
    'GetDefectiveReworkOrderDraftByDefectiveReworkOrder',
    { method: 'POST', body } as ActionCallOptions,
  )
}

// 默认导出集合（保持方法名一致，便于替换调用方）
export const QualityApi = {
  GetFinalInspectionDraftByDefectiveReworkOrder,
  GetFirstInspectionDraftByDefectiveReworkOrder,
  GetDefectiveReworkOrderDraftByInspection,
  GetDefectiveReworkOrderDraftByDefectiveReworkOrder,
  GetLatestDefectiveReworkOrderIdByDailyPlanScanCode,
  GetDefectiveReworkOrderDraftByDailyPlanScanCode,
  GetDefectiveReworkOrderDraftByFlowDetail,
  CreateDefectiveReworkOrderByDailyPlanScanCode,
  CreateDefectiveReworkOrderByFlowDetail,
  SaveDefectiveReworkOrderWithFiles,
  GetAssemblyFlowWithFinalInspectionByDailyPlanScanCode,
  GetAssemblyFlowWithFirstInspectionByDailyPlanScanCode,
  GetProduceFlowWithFinalInspectionByExtrusionPlanScanCode,
  GetProduceFlowWithFirstInspectionByExtrusionPlanScanCode,
  GetDefectiveReworkOrderIdsByFinalInspection,
  CreateFirstInspectionByDailyPlanAssembly,
  CreateFirstInspectionByDailyPlanProduce,
  CreateFinalInspectionByDailyPlanAssembly,
  CreateFinalInspectionByDailyPlanProduce,
}

export default QualityApi
