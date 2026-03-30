/**
 *
 * ERP Bill API 入口（与后端 BillApiController 一致）
 * 说明：底层实现在 `./bill-api.client`，此文件提供与 C# 控制器中各 Action
 * 完全同名的调用函数，严格对齐 HTTP 方法、路由段与参数位置（query/body）。
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
 * 删除/审批等需要的单据主键
 *
 */
export type BillId = number

/**
 *
 * 将对象转换为 JSON 字符串字段：
 * - 若本身已是 string，则原样返回
 * - 若为对象/数组，则 JSON.stringify
 * - 其他类型转为字符串
 *
 */
function toJsonText(input: unknown): string {
  if (typeof input === 'string') return input
  try { return JSON.stringify(input) } catch { return String(input) }
}

/**
 *
 * 默认客户端（使用 API_BASE 与 '/api/BillApi' 路由段）
 *
 */
const _client = new BillApiClient()

// ========================= 与后端同名的方法 =========================

/**
 *
 * 参数绑定测试（示例）。
 * 对应 C#: [HttpPost] ParameterTest(string dbName, string tableName, string user)
 * - 路径：POST /api/BillApi/ParameterTest
 * - 位置：参数通过 query 传递（因为后端未标注 [FromBody]）
 *
 */
export function ParameterTest(dbName: string = DEFAULT_DB_NAME, tableName: string, user: UserInfo | string): Promise<number> {
  const userText = typeof user === 'string' ? user : toJsonText(user)
  return _client.callAction<number>('ParameterTest', {
    method: 'POST',
    query: { dbName, tableName, user: userText },
  })
}

/**
 *
 * 获取前一张单据的 id。
 * 对应 C#: [HttpGet] GetPreviousBillid(string dbName, string tableName, int billid)
 * - 路径：GET /api/BillApi/GetPreviousBillid?dbName=...&tableName=...&billid=...
 *
 */
export function GetPreviousBillid<T = unknown>(dbName: string = DEFAULT_DB_NAME, tableName: string, billid: number): Promise<T> {
  return _client.callAction<T>('GetPreviousBillid', { method: 'GET', query: { dbName, tableName, billid } })
}

/**
 *
 * 获取后一张单据的 id。
 * 对应 C#: [HttpGet] GetNextBillid(string dbName, string tableName, int billid)
 * - 路径：GET /api/BillApi/GetNextBillid?dbName=...&tableName=...&billid=...
 *
 */
export function GetNextBillid<T = unknown>(dbName: string = DEFAULT_DB_NAME, tableName: string, billid: number): Promise<T> {
  return _client.callAction<T>('GetNextBillid', { method: 'GET', query: { dbName, tableName, billid } })
}

/**
 *
 * 获取单据明细。
 * 对应 C#: [HttpGet] GetBillDetails(string dbName, string tableName, int billid)
 * - 路径：GET /api/BillApi/GetBillDetails?dbName=...&tableName=...&billid=...
 *
 */
export function GetBillDetails<T = unknown>(dbName: string = DEFAULT_DB_NAME, tableName: string, billid: number): Promise<T> {
  return _client.callAction<T>('GetBillDetails', { method: 'GET', query: { dbName, tableName, billid } })
}

// ===== Dto 输入（按函数入参约定，内部会映射为 PascalCase 字段） =====
export interface GeneralBillSaveInput {
  dbName?: string
  tableName: string
  user: UserInfo
  bill: unknown // 可为对象或 JSON 字符串
  details: unknown // 可为数组/对象或 JSON 字符串
}

export interface GeneralBillApprovalInput {
  dbName?: string
  tableName: string
  user: UserInfo
  billId: number
  isApprove: boolean
  /**
   *
   * 是否使用后端“新审批框架”。
   * - true 或未提供：走新框架（后端默认）
   * - false：走旧框架（兼容历史 RPC 逻辑）
   *
   */
  useNewFramework?: boolean
}

export interface GeneralBillDeleteInput {
  dbName?: string
  tableName: string
  user: UserInfo
  billId: number
}

export interface GeneralBillFetchInput {
  dbName?: string
  tableName: string
  billId: number
}

// ===== 返回结果最小结构（统一改用公共类型） =====

/**
 *
 * 单据通用保存。
 * 对应 C#: [HttpPost] GeneralBillSave([FromBody] GeneralBillSaveDto)
 * - 路径：POST /api/BillApi/GeneralBillSave
 * - 位置：请求体（JSON），字段名使用 PascalCase
 *
 */
export function GeneralBillSave(payload: GeneralBillSaveInput): Promise<DbChangedPackResult> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    TableName: payload.tableName,
    User: payload.user,
    Bill: toJsonText(payload.bill),
    Details: toJsonText(payload.details),
  }
  return _client.callAction<DbChangedPackResult>('GeneralBillSave', { method: 'POST', body })
}

/**
 *
 * 单据通用审批。
 * 对应 C#: [HttpPost] GeneralBillApproval([FromBody] GeneralBillApprovalDto)
 * - 路径：POST /api/BillApi/GeneralBillApproval
 *
 */
export function GeneralBillApproval(payload: GeneralBillApprovalInput): Promise<ApiMessagePack> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    TableName: payload.tableName,
    User: payload.user,
    BillId: payload.billId,
    IsApprove: payload.isApprove,
    // 未提供时 JSON.stringify 会忽略 undefined，后端采用默认 true
    UseNewFramework: payload.useNewFramework,
  }
  return _client.callAction<ApiMessagePack>('GeneralBillApproval', { method: 'POST', body })
}

/**
 *
 * 单据通用删除。
 * 对应 C#: [HttpPost] GeneralBillDelete([FromBody] GeneralBillDeleteDto)
 * - 路径：POST /api/BillApi/GeneralBillDelete
 *
 */
export function GeneralBillDelete(payload: GeneralBillDeleteInput): Promise<DbChangedPackResult> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    TableName: payload.tableName,
    User: payload.user,
    BillId: payload.billId,
  }
  return _client.callAction<DbChangedPackResult>('GeneralBillDelete', { method: 'POST', body })
}

/**
 *
 * 通过请求体获取指定单据及其明细列表。
 * 对应 C#: [HttpPost] GetBillWithDetails([FromBody] GeneralBillFetchDto)
 * - 路径：POST /api/BillApi/GetBillWithDetails
 *
 */
export function GetBillWithDetails<T = unknown>(payload: GeneralBillFetchInput): Promise<ApiMessagePack<T>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    TableName: payload.tableName,
    BillId: payload.billId,
  }
  return _client.callAction<ApiMessagePack<T>>('GetBillWithDetails', { method: 'POST', body })
}

/**
 *
 * 默认导出：同名方法集合（与 C# Action 完全一致）
 *
 */
/**
 *
 * 导出同名方法集合。
 * 说明：此处仅在集合层做“异步函数集合”的宽松约束，
 * 为避免 TS 参数逆变规则导致具名函数（带精确参数类型）
 * 无法赋值给 `(...args: unknown[]) => Promise<unknown>`，
 * 这里使用 `any[]` 作为集合的统一参数形态。
 * 各函数自身的签名仍然严格、完整，不受影响。
 *
 */
export const BillApi = {
  ParameterTest,
  GetPreviousBillid,
  GetNextBillid,
  GetBillDetails,
  GeneralBillSave,
  GeneralBillApproval,
  GeneralBillDelete,
  GetBillWithDetails,
} satisfies Record<string, (...args: any[]) => Promise<unknown>>

export default BillApi

// 类型与实现转出口
export type { HttpMethod, BillApiClientOptions, ActionCallOptions, BillApiActionCaller, BillApiActions } from './bill-api.client'
export { BillApiClient } from './bill-api.client'
// 兼容历史：转出口通用类型，便于现有 import 路径不变
export type { ApiMessagePack, DbChangedPackResult } from '@/types/api'
