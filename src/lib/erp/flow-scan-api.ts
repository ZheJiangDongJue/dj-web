/**
 *
 * FlowScanApi（流程扫码检查入口）
 * - 对应后端：ERP.WebApi.Controllers.Api.FlowScanApiController
 * - 路由：/api/FlowScanApi/[action]
 * - 用途：基于“日计划/挤出计划/不合格返工单”的扫码编码或主键ID，查询当前可用的流程卡工序明细，并检查下游单据状态
 *
 */
import { BillApiClient, type ActionCallOptions } from './bill-api.client'
import { DEFAULT_DB_NAME } from '@/lib/config'
import type { ApiMessagePack } from '@/types/api'
import type { UserInfo } from './bill-api'

/**
 *
 * 扫码入口类型（与后端 FlowScanSourceType 对齐）。
 *
 */
export enum FlowScanSourceType {
  /** 日计划明细（DailyPlanDetail）→ 组装流程卡链路 */
  DailyPlanDetail = 1,
  /** 挤出计划明细（ExtrusionPlanDetail）→ 生产流程卡链路 */
  ExtrusionPlanDetail = 2,
  /** 不合格返工单（DefectiveReworkOrderDocument）→ 组装/生产流程卡链路（按最新流程卡自动选择） */
  DefectiveReworkOrderDocument = 3,
}

/**
 *
 * 需要检查的单据类别（与后端 FlowScanDocumentKind 对齐）。
 *
 */
export enum FlowScanDocumentKind {
  FlowCard = 1,
  ProcessReceive = 2,
  FirstInspection = 3,
  ProcessCompletion = 4,
  FinalInspection = 5,
  Ncr = 6,
}

/**
 *
 * 单据状态检查档位（与后端 FlowScanCheckState 对齐）。
 *
 */
export enum FlowScanCheckState {
  NotCreated = 0,
  CreatedNotApproved = 1,
  CreatedApproved = 2,
  ApprovedReadyForNext = 3,
  /**
   * 未完成：排除 ApprovedReadyForNext 之后留存的其他明细。
   */
  Unfinished = 4,
  /**
   * 上一步已完成但是这一步未完成：按工序明细链路推断“下一步应操作的单据类别”。
   */
  PrevCompletedCurrentUnfinished = 5,
}

/**
 *
 * TableRecord（TableName + id）。
 * 说明：后端为 C# 类型；前端这里兼容 PascalCase/camelCase 字段名。
 *
 */
export type TableRecordLike = {
  TableName?: string
  tableName?: string
  id?: number
  Id?: number
  ID?: number
}

/**
 *
 * FlowScanApi.CheckDocumentState 返回的单据引用（TableName + id + status）。
 * - 兼容 PascalCase/camelCase 字段名；
 * - status 对应后端单据的 Status（数字；未审批=0；其余按后端位标志约定）。
 *
 */
export type FlowScanDocumentRecordLike = TableRecordLike & {
  Status?: number
  status?: number
}

export interface FlowScanCheckDocumentStateRequest {
  dbName?: string
  user: UserInfo
  sourceType: FlowScanSourceType
  scanForCode?: string
  sourceDetailId?: number
  documentKind: FlowScanDocumentKind
  state: FlowScanCheckState
  includeTableRecords?: boolean
}

export type FlowScanCheckDocumentStateItem = {
  FlowDocument?: TableRecordLike
  flowDocument?: TableRecordLike
  FlowDetail?: TableRecordLike
  flowDetail?: TableRecordLike
  Matched?: boolean
  matched?: boolean
  Documents?: FlowScanDocumentRecordLike[] | null
  documents?: FlowScanDocumentRecordLike[] | null
}

export type FlowScanCheckDocumentStateResponse = {
  SourceType?: number
  sourceType?: number
  SourceDetailId?: number
  sourceDetailId?: number
  ScanForCode?: string
  scanForCode?: string
  DocumentKind?: number
  documentKind?: number
  State?: number
  state?: number
  HasMultipleFlowDetails?: boolean
  hasMultipleFlowDetails?: boolean
  FlowDocuments?: TableRecordLike[]
  flowDocuments?: TableRecordLike[]
  CurrentFlowDetails?: TableRecordLike[]
  currentFlowDetails?: TableRecordLike[]
  Matched?: boolean
  matched?: boolean
  Items?: FlowScanCheckDocumentStateItem[]
  items?: FlowScanCheckDocumentStateItem[]
}

/**
 *
 * 指向 /api/FlowScanApi 的客户端
 *
 */
const _client = new BillApiClient({ controllerPath: '/api/FlowScanApi' })

/**
 *
 * 流程扫码：检查下游单据状态（通用）
 * 对应 C#: [HttpPost] FlowScanApiController.CheckDocumentState([FromBody] FlowScanCheckDocumentStateRequest request)
 *
 */
export async function CheckDocumentState(
  payload: FlowScanCheckDocumentStateRequest,
): Promise<ApiMessagePack<FlowScanCheckDocumentStateResponse>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    SourceType: payload.sourceType,
    ScanForCode: payload.scanForCode ?? '',
    SourceDetailId: payload.sourceDetailId ?? 0,
    DocumentKind: payload.documentKind,
    State: payload.state,
    IncludeTableRecords: payload.includeTableRecords ?? true,
  }

  return _client.callActionRaw<ApiMessagePack<FlowScanCheckDocumentStateResponse>>(
    'CheckDocumentState',
    { method: 'POST', body } as ActionCallOptions,
  )
}

export const FlowScanApi = {
  CheckDocumentState,
}

export default FlowScanApi
