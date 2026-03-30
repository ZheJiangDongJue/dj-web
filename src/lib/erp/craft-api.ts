/**
 *
 * Craft API（流程卡首/末件检验按明细入口）
 * - 对应后端 ERP.WebApi.Controllers.Api.CraftApiController
 * - 仅封装检验相关接口，保持与后端 Action 名称/HTTP 方法一致
 *
 */
import { BillApiClient, type ActionCallOptions } from './bill-api.client'
import { DEFAULT_DB_NAME } from '@/lib/config'
import type { UserInfo } from './bill-api'
import type { ApiMessagePack } from '@/types/api'

/**
 *
 * 首末检验允许性校验返回结构
 *
 */
type AllowPack = ApiMessagePack<{ Allow: boolean; Reason?: string | null }>

/**
 *
 * 首/末检验草稿结构
 *
 */
type InspectionDraft<TDoc, TDetail> = ApiMessagePack<{ Document?: TDoc | null; Details?: TDetail[] }>

export interface ProcessAssemblyFlowRequest {
  dbName?: string
  user: UserInfo
  detailid: number
}

export interface ProduceFlowRequest {
  dbName?: string
  user: UserInfo
  detailid: number
}

/**
 *
 * 指向 /api/CraftApi 的客户端
 *
 */
const _client = new BillApiClient({ controllerPath: '/api/CraftApi' })

// =============== 允许性校验（GET） ===============

/**
 *
 * 组装流程卡：是否允许生成首件检验
 *
 */
export function CheckAssemblyFlowAllowCreateFirstInspection(
  dbName: string = DEFAULT_DB_NAME,
  assemblyFlowDetailId: number,
): Promise<AllowPack> {
  const query = { dbName, assemblyFlowDetailId }
  return _client.callActionRaw<AllowPack>('CheckAssemblyFlowAllowCreateFirstInspection', {
    method: 'GET',
    query,
  } as ActionCallOptions)
}

/**
 *
 * 生产流程卡：是否允许生成首件检验
 *
 */
export function CheckProduceFlowAllowCreateFirstInspection(
  dbName: string = DEFAULT_DB_NAME,
  produceFlowDetailId: number,
): Promise<AllowPack> {
  const query = { dbName, produceFlowDetailId }
  return _client.callActionRaw<AllowPack>('CheckProduceFlowAllowCreateFirstInspection', {
    method: 'GET',
    query,
  } as ActionCallOptions)
}

/**
 *
 * 组装流程卡：是否允许生成末件检验
 *
 */
export function CheckAssemblyFlowAllowCreateFinalInspection(
  dbName: string = DEFAULT_DB_NAME,
  assemblyFlowDetailId: number,
): Promise<AllowPack> {
  const query = { dbName, assemblyFlowDetailId }
  return _client.callActionRaw<AllowPack>('CheckAssemblyFlowAllowCreateFinalInspection', {
    method: 'GET',
    query,
  } as ActionCallOptions)
}

/**
 *
 * 生产流程卡：是否允许生成末件检验
 *
 */
export function CheckProduceFlowAllowCreateFinalInspection(
  dbName: string = DEFAULT_DB_NAME,
  produceFlowDetailId: number,
): Promise<AllowPack> {
  const query = { dbName, produceFlowDetailId }
  return _client.callActionRaw<AllowPack>('CheckProduceFlowAllowCreateFinalInspection', {
    method: 'GET',
    query,
  } as ActionCallOptions)
}

// =============== 按明细生成检验草稿（POST） ===============

/**
 *
 * 组装流程卡：生成首件检验草稿
 *
 */
export function CreateFirstInspectionByAssemblyFlowDetail<TDoc = unknown, TDetail = unknown>(
  payload: ProcessAssemblyFlowRequest,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    Detailid: payload.detailid,
  }
  return _client.callActionRaw<InspectionDraft<TDoc, TDetail>>('CreateFirstInspectionByAssemblyFlowDetail', {
    method: 'POST',
    body,
  } as ActionCallOptions)
}

/**
 *
 * 生产流程卡：生成首件检验草稿
 *
 */
export function CreateFirstInspectionByProduceFlowDetail<TDoc = unknown, TDetail = unknown>(
  payload: ProduceFlowRequest,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    Detailid: payload.detailid,
  }
  return _client.callActionRaw<InspectionDraft<TDoc, TDetail>>('CreateFirstInspectionByProduceFlowDetail', {
    method: 'POST',
    body,
  } as ActionCallOptions)
}

/**
 *
 * 组装流程卡：生成末道检验草稿
 *
 */
export function CreateFinalInspectionByAssemblyFlowDetail<TDoc = unknown, TDetail = unknown>(
  payload: ProcessAssemblyFlowRequest,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    Detailid: payload.detailid,
  }
  return _client.callActionRaw<InspectionDraft<TDoc, TDetail>>('CreateFinalInspectionByAssemblyFlowDetail', {
    method: 'POST',
    body,
  } as ActionCallOptions)
}

/**
 *
 * 生产流程卡：生成末道检验草稿
 *
 */
export function CreateFinalInspectionByProduceFlowDetail<TDoc = unknown, TDetail = unknown>(
  payload: ProduceFlowRequest,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    Detailid: payload.detailid,
  }
  return _client.callActionRaw<InspectionDraft<TDoc, TDetail>>('CreateFinalInspectionByProduceFlowDetail', {
    method: 'POST',
    body,
  } as ActionCallOptions)
}

export const CraftApi = {
  CheckAssemblyFlowAllowCreateFirstInspection,
  CheckProduceFlowAllowCreateFirstInspection,
  CheckAssemblyFlowAllowCreateFinalInspection,
  CheckProduceFlowAllowCreateFinalInspection,
  CreateFirstInspectionByAssemblyFlowDetail,
  CreateFirstInspectionByProduceFlowDetail,
  CreateFinalInspectionByAssemblyFlowDetail,
  CreateFinalInspectionByProduceFlowDetail,
}

export default CraftApi
