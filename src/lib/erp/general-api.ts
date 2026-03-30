/**
 *
 * ERP General API 入口（与后端 GeneralApiController 一致）
 * 说明：底层使用 BillApiClient，并将 controllerPath 定位到 '/GeneralApi'。
 * 本文件提供与 C# 控制器中各 Action 完全同名的调用函数，
 * 严格对齐 HTTP 方法、路由段与参数位置（query/body）。
 *
 */

import { BillApiClient } from './bill-api.client'
import { DEFAULT_DB_NAME } from '@/lib/config'
import type { ApiMessagePack, DbChangedPackResult } from '@/types/api'

// ========================= 类型与工具 =========================

/**
 *
 * 用户信息（与后端 UserInfo 对齐的最小约束，保留扩展字段）
 *
 */
export interface UserInfo { [key: string]: unknown }



/**
 *
 * 将任意输入转换为 JSON 字符串：
 * - 若本身为 string，原样返回；
 * - 若为对象/数组，使用 JSON.stringify；
 * - 其他类型使用 String()。
 * @param input 任意输入
 *
 */
function toJsonText(input: unknown): string {
  if (typeof input === 'string') return input
  try { return JSON.stringify(input) } catch { return String(input) }
}

/**
 *
 * 归一化字段列表参数为后端所需的逗号分隔字符串。
 * @param fields 字段数组或逗号分隔字符串
 *
 */
function toCommaFields(fields?: string | string[]): string | undefined {
  if (!fields) return undefined
  return Array.isArray(fields) ? fields.join(',') : fields
}

// ========================= 查询结构类型 =========================

/**
 *
 * 连接类型（与后端 JoinType 一致）。
 *
 */
export type JoinType = 'Inner' | 'Left' | 'Right' | 'Full' | 'Cross'

/**
 *
 * 前端友好的 JoinInfo（camelCase）。
 *
 */
export interface JoinInfoInput {
  tableName?: string
  shortName?: string
  joinType?: JoinType
  on?: string
}

/**
 *
 * 发送给后端的 JoinInfoDto（PascalCase）。
 *
 */
export interface JoinInfoDto {
  TableName?: string
  ShortName?: string
  JoinType?: JoinType
  On?: string
}

/**
 *
 * 前端友好的 Query 输入（camelCase）。
 *
 */
export interface QueryInput {
  tableName?: string
  shortName?: string
  where?: string[]
  order?: string
  joinInfos?: JoinInfoInput[]
  groupBy?: string
  having?: string
  select?: string
  pageNumber?: number
  pageSize?: number
  selectMode?: string
}

/**
 *
 * 发送给后端的 QueryDto（PascalCase，与 C# 类一致）。
 *
 */
export interface QueryDto {
  TableName?: string
  ShortName?: string
  Where?: string[]
  Order?: string
  JoinInfos?: JoinInfoDto[]
  GroupBy?: string
  Having?: string
  Select?: string
  PageNumber?: number
  PageSize?: number
  SelectMode?: string
}

/**
 *
 * 判断是否已是后端 QueryDto（通过是否包含 PascalCase 关键字段粗略判断）。
 * @param q 任意对象
 *
 */
function isQueryDto(q: unknown): q is QueryDto {
  return !!q && typeof q === 'object' && (
    'TableName' in (q as Record<string, unknown>) ||
    'Where' in (q as Record<string, unknown>) ||
    'JoinInfos' in (q as Record<string, unknown>)
  )
}

/**
 *
 * 将前端友好的 QueryInput 转换为后端所需的 QueryDto。
 * 若传入已是 QueryDto，则直接返回原对象。
 * @param input QueryInput 或 QueryDto
 *
 */
function toServerQueryDto(input: QueryInput | QueryDto): QueryDto {
  if (isQueryDto(input)) return input
  const q = input as QueryInput
  return {
    TableName: q.tableName,
    ShortName: q.shortName,
    Where: q.where,
    Order: q.order,
    JoinInfos: q.joinInfos?.map(j => ({
      TableName: j.tableName,
      ShortName: j.shortName,
      JoinType: j.joinType,
      On: j.on,
    })),
    GroupBy: q.groupBy,
    Having: q.having,
    Select: q.select,
    PageNumber: q.pageNumber,
    PageSize: q.pageSize,
    SelectMode: q.selectMode,
  }
}

/**
 *
 * 默认客户端（使用 API_BASE 与 '/GeneralApi' 路由段）
 *
 */
const _client = new BillApiClient({ controllerPath: '/api/GeneralApi' })

// ========================= 与后端同名的方法 =========================

/**
 *
 * 获取新的 Uid。
 * 对应 C#: [HttpGet] GetNewUid()
 * - 路径：GET /GeneralApi/GetNewUid
 *
 */
export function GetNewUid(): Promise<number> {
  return _client.callAction<number>('GetNewUid', { method: 'GET' })
}

/**
 *
 * 通过 Uid 和表名获取 id。
 * 对应 C#: [HttpGet] GetIdByUid(string dbName, string tableName, long uid)
 * - 路径：GET /GeneralApi/GetIdByUid?dbName=...&tableName=...&uid=...
 * @param dbName 账套名，默认使用全局 DEFAULT_DB_NAME
 * @param tableName 表名（系统表名称）
 * @param uid 唯一编号（long）
 *
 */
export function GetIdByUid(dbName: string = DEFAULT_DB_NAME, tableName: string, uid: number): Promise<number> {
  return _client.callAction<number>('GetIdByUid', { method: 'GET', query: { dbName, tableName, uid } })
}

/**
 *
 * 获取指定表的空对象（序列化字符串）。
 * 对应 C#: [HttpGet] GetEmptyData(string tableName)
 * - 路径：GET /GeneralApi/GetEmptyData?tableName=...
 * @param tableName 表名（系统表名称）
 *
 */
export function GetEmptyData(tableName: string): Promise<string> {
  return _client.callAction<string>('GetEmptyData', { method: 'GET', query: { tableName } })
}

/**
 *
 * 按 Query（JSON）读取数据。
 * 对应 C#: [HttpGet] GetDataEx(string dbName, string query)
 * - 路径：GET /GeneralApi/GetDataEx?dbName=...&query=...
 * @param dbName 账套名，默认使用全局 DEFAULT_DB_NAME
 * @param query 查询条件对象或 JSON 字符串（内部自动 JSON.stringify 并进行 URL 编码）
 *
 */
export function GetDataEx<T = unknown>(dbName: string = DEFAULT_DB_NAME, query: QueryInput | QueryDto | string): Promise<ApiMessagePack<T>> {
  const qPayload = typeof query === 'string' ? query : toServerQueryDto(query)
  return _client.callAction<ApiMessagePack<T>>('GetDataEx', {
    method: 'GET',
    query: { dbName, query: toJsonText(qPayload) },
  })
}

/**
 *
 * 按 Query（JSON）读取数据（DTO 投影版）。
 * 对应 C#: [HttpGet] GetItemsEx(string dbName, string query)
 * - 路径：GET /GeneralApi/GetItemsEx?dbName=...&query=...
 * @param dbName 账套名，默认使用全局 DEFAULT_DB_NAME
 * @param query 查询条件对象或 JSON 字符串（内部自动 JSON.stringify 并进行 URL 编码）
 *
 */
export function GetItemsEx<T = unknown>(dbName: string = DEFAULT_DB_NAME, query: QueryInput | QueryDto | string): Promise<ApiMessagePack<T>> {
  const qPayload = typeof query === 'string' ? query : toServerQueryDto(query)
  return _client.callActionRaw<ApiMessagePack<T>>('GetItemsEx', {
    method: 'GET',
    query: { dbName, query: toJsonText(qPayload) },
  })
}

/**
 *
 * 分页读取数据。
 * 对应 C#: [HttpGet] GetDataPage(string dbName, string tableName, int pageSize, int pageNumber)
 * - 路径：GET /GeneralApi/GetDataPage?dbName=...&tableName=...&pageSize=...&pageNumber=...
 *
 */
export function GetDataPage<T = unknown>(
  dbName: string = DEFAULT_DB_NAME,
  tableName: string,
  pageSize: number,
  pageNumber: number,
): Promise<ApiMessagePack<T>> {
  return _client.callAction<ApiMessagePack<T>>('GetDataPage', {
    method: 'GET',
    query: { dbName, tableName, pageSize, pageNumber },
  })
}

/**
 *
 * 分页读取数据（指定字段）。
 * 对应 C#: [HttpGet] GetDataPageWithFields(string dbName, string tableName, int pageSize, int pageNumber, string fields)
 * - 路径：GET /GeneralApi/GetDataPageWithFields?dbName=...&tableName=...&pageSize=...&pageNumber=...&fields=a,b
 * @param fields 选择的字段列表，传入数组将自动拼接为逗号分隔
 *
 */
export function GetDataPageWithFields<T = unknown>(
  dbName: string = DEFAULT_DB_NAME,
  tableName: string,
  pageSize: number,
  pageNumber: number,
  fields: string | string[],
): Promise<ApiMessagePack<T>> {
  return _client.callAction<ApiMessagePack<T>>('GetDataPageWithFields', {
    method: 'GET',
    query: { dbName, tableName, pageSize, pageNumber, fields: toCommaFields(fields) },
  })
}

/**
 *
 * 按字段匹配读取数据。
 * 对应 C#: [HttpGet] GetDataUseField(string dbName, string tableName, string fieldName, string values)
 * - 路径：GET /GeneralApi/GetDataUseField?dbName=...&tableName=...&fieldName=...&values=[...]
 * @param values 值集合（JSON 数组字符串将被直接使用，数组将自动 JSON.stringify）
 *
 */
export function GetDataUseField<T = unknown>(
  dbName: string = DEFAULT_DB_NAME,
  tableName: string,
  fieldName: string,
  values: Array<string | number> | string,
): Promise<ApiMessagePack<T>> {
  return _client.callAction<ApiMessagePack<T>>('GetDataUseField', {
    method: 'GET',
    query: { dbName, tableName, fieldName, values: toJsonText(values) },
  })
}

/**
 *
 * 按 id 读取单条数据。
 * 对应 C#: [HttpGet] GetDataUseId(string dbName, string tableName, string id)
 * - 路径：GET /GeneralApi/GetDataUseId?dbName=...&tableName=...&id=...
 *
 */
export function GetDataUseId<T = unknown>(dbName: string = DEFAULT_DB_NAME, tableName: string, id: string): Promise<ApiMessagePack<T>> {
  return _client.callAction<ApiMessagePack<T>>('GetDataUseId', { method: 'GET', query: { dbName, tableName, id } })
}

/**
 *
 * 按多个 id 读取数据。
 * 对应 C#: [HttpGet] GetDataUseIds(string dbName, string tableName, string ids)
 * - 路径：GET /GeneralApi/GetDataUseIds?dbName=...&tableName=...&ids=[...]
 * @param ids id 集合，支持数组或 JSON 字符串
 *
 */
export function GetDataUseIds<T = unknown>(dbName: string = DEFAULT_DB_NAME, tableName: string, ids: string[] | string): Promise<ApiMessagePack<T>> {
  return _client.callAction<ApiMessagePack<T>>('GetDataUseIds', {
    method: 'GET',
    query: { dbName, tableName, ids: toJsonText(ids) },
  })
}

/**
 *
 * 按数据视图读取数据。
 * 对应 C#: [HttpGet] GetDataUseDataView(string dbName, long dataViewUid, string dataGetterPack)
 * - 路径：GET /GeneralApi/GetDataUseDataView?dbName=...&dataViewUid=...&dataGetterPack=...
 * @param dataGetterPack 取数配置对象或 JSON 字符串
 *
 */
export function GetDataUseDataView<T = unknown>(
  dbName: string = DEFAULT_DB_NAME,
  dataViewUid: number,
  dataGetterPack: unknown,
): Promise<ApiMessagePack<T>> {
  return _client.callAction<ApiMessagePack<T>>('GetDataUseDataView', {
    method: 'GET',
    query: { dbName, dataViewUid, dataGetterPack: toJsonText(dataGetterPack) },
  })
}

// ===== Dto 输入（按函数入参约定，内部会映射为 PascalCase 字段） =====

export interface GeneralSaveRangeInput {
  dbName?: string
  tableName?: string
  user: UserInfo
  objs?: unknown // 对象数组或 JSON 字符串
}

export interface GeneralDeleteRangeInput {
  dbName?: string
  tableName?: string
  user: UserInfo
  idsStr?: string // 服务器期望的字符串（可由 ids 数组 JSON 化后传入）
}

export interface GeneralEnableRangeInput {
  dbName?: string
  tableName?: string
  user: UserInfo
  objs?: unknown // 对象数组或 JSON 字符串
  b: boolean // 启用/禁用
}

export interface ExecProcedureInput {
  dbName?: string
  procedureName?: string
  procedureParameters?: unknown // 对象或 JSON 字符串
}

/**
 *
 * 通用保存（批量）。
 * 对应 C#: [HttpPost] GeneralSaveRange([FromBody] GeneralSaveRangeDto)
 * - 路径：POST /GeneralApi/GeneralSaveRange
 * - 位置：请求体（JSON），字段名使用 PascalCase
 *
 */
export function GeneralSaveRange(payload: GeneralSaveRangeInput): Promise<DbChangedPackResult> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    TableName: payload.tableName,
    User: payload.user,
    Objs: payload.objs !== undefined ? toJsonText(payload.objs) : undefined,
  }
  return _client.callAction<DbChangedPackResult>('GeneralSaveRange', { method: 'POST', body })
}

/**
 *
 * 通用删除（批量）。
 * 对应 C#: [HttpPost] GeneralDeleteRange([FromBody] GeneralDeleteRangeDto)
 * - 路径：POST /GeneralApi/GeneralDeleteRange
 *
 */
export function GeneralDeleteRange(payload: GeneralDeleteRangeInput): Promise<DbChangedPackResult> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    TableName: payload.tableName,
    User: payload.user,
    IdsStr: payload.idsStr,
  }
  return _client.callAction<DbChangedPackResult>('GeneralDeleteRange', { method: 'POST', body })
}

/**
 *
 * 检测是否能删除（批量）。
 * 对应 C#: [HttpPost] CheckCanRemove([FromBody] CheckCanRemoveDto)
 * - 路径：POST /GeneralApi/CheckCanRemove
 *
 */
export function CheckCanRemove(payload: { dbName?: string; tableName?: string; idsStr?: string }): Promise<DbChangedPackResult> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    TableName: payload.tableName,
    IdsStr: payload.idsStr,
  }
  return _client.callAction<DbChangedPackResult>('CheckCanRemove', { method: 'POST', body })
}

/**
 *
 * 通用启用/禁用（批量）。
 * 对应 C#: [HttpPost] GeneralEnableRange([FromBody] GeneralEnableRangeDto)
 * - 路径：POST /GeneralApi/GeneralEnableRange
 *
 */
export function GeneralEnableRange(payload: GeneralEnableRangeInput): Promise<DbChangedPackResult> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    TableName: payload.tableName,
    User: payload.user,
    Objs: payload.objs !== undefined ? toJsonText(payload.objs) : undefined,
    B: payload.b,
  }
  return _client.callAction<DbChangedPackResult>('GeneralEnableRange', { method: 'POST', body })
}

/**
 *
 * 执行存储过程。
 * 对应 C#: [HttpPost] ExecProcedure([FromBody] ExecProcedureDto)
 * - 路径：POST /GeneralApi/ExecProcedure
 *
 */
export function ExecProcedure<T = unknown>(payload: ExecProcedureInput): Promise<ApiMessagePack<T>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    ProcedureName: payload.procedureName,
    ProcedureParameters: payload.procedureParameters !== undefined ? toJsonText(payload.procedureParameters) : undefined,
  }
  return _client.callAction<ApiMessagePack<T>>('ExecProcedure', { method: 'POST', body })
}

/**
 *
 * 导出同名方法集合（与 C# Action 完全一致）。
 * 说明：此处仅在集合层做“异步函数集合”的宽松约束，
 * 为避免 TS 参数逆变规则导致具名函数（带精确参数类型）
 * 无法赋值给 `(...args: unknown[]) => Promise<unknown>`，
 * 这里使用 `any[]` 作为集合的统一参数形态。
 * 各函数自身的签名仍然严格、完整，不受影响。
 *
 */
export const GeneralApi = {
  GetNewUid,
  GetIdByUid,
  GetEmptyData,
  GetDataEx,
  GetItemsEx,
  GetDataPage,
  GetDataPageWithFields,
  GetDataUseField,
  GetDataUseId,
  GetDataUseIds,
  GetDataUseDataView,
  GeneralSaveRange,
  GeneralDeleteRange,
  CheckCanRemove,
  GeneralEnableRange,
  ExecProcedure,
} satisfies Record<string, (...args: any[]) => Promise<unknown>>

export default GeneralApi

// 类型与实现转出口（沿用 bill-api.client 的 Http 基础类型）
export type { HttpMethod, BillApiClientOptions, ActionCallOptions, BillApiActionCaller, BillApiActions } from './bill-api.client'
export { BillApiClient } from './bill-api.client'
// 兼容历史：转出口通用类型，便于现有 import 路径不变
export type { ApiMessagePack, DbChangedPackResult } from '@/types/api'
