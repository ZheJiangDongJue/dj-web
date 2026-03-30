/**
 *
 * ProduceFlowApi（基于日计划的首/末件检验入口）
 * - 对应后端 ERP.WebApi.Controllers.Api.ProduceFlowApiController
 * - 仅封装日计划检验相关接口，保持 Action/HTTP 方法一致
 *
 */
import { BillApiClient, type ActionCallOptions } from './bill-api.client'
import { DEFAULT_DB_NAME } from '@/lib/config'
import type { UserInfo } from './bill-api'
import type { ApiMessagePack } from '@/types/api'

/**
 *
 * 日计划检验请求体
 *
 */
export interface DailyPlanInspectionRequest {
  dbName?: string
  user: UserInfo
  dailyPlanDetailId: number
}

/**
 *
 * 首/末检验草稿结构
 *
 */
export type InspectionDraft<TDoc, TDetail> = ApiMessagePack<{ Document?: TDoc | null; Details?: TDetail[] }>

/**
 *
 * 指向 /api/ProduceFlowApi 的客户端
 *
 */
const _client = new BillApiClient({ controllerPath: '/api/ProduceFlowApi' })

// =============== 日计划 → 首件检验 ===============

/**
 *
 * 日计划 → 组装流程卡首件检验草稿
 *
 */
export function CreateFirstInspectionByDailyPlanAssembly<TDoc = unknown, TDetail = unknown>(
  payload: DailyPlanInspectionRequest,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    DailyPlanDetailId: payload.dailyPlanDetailId,
  }
  return _client.callActionRaw<InspectionDraft<TDoc, TDetail>>('CreateFirstInspectionByDailyPlanAssembly', {
    method: 'POST',
    body,
  } as ActionCallOptions)
}

/**
 *
 * 日计划 → 生产流程卡首件检验草稿
 *
 */
export function CreateFirstInspectionByDailyPlanProduce<TDoc = unknown, TDetail = unknown>(
  payload: DailyPlanInspectionRequest,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    DailyPlanDetailId: payload.dailyPlanDetailId,
  }
  return _client.callActionRaw<InspectionDraft<TDoc, TDetail>>('CreateFirstInspectionByDailyPlanProduce', {
    method: 'POST',
    body,
  } as ActionCallOptions)
}

// =============== 日计划 → 末道检验 ===============

/**
 *
 * 日计划 → 组装流程卡末道检验草稿
 *
 */
export function CreateFinalInspectionByDailyPlanAssembly<TDoc = unknown, TDetail = unknown>(
  payload: DailyPlanInspectionRequest,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    DailyPlanDetailId: payload.dailyPlanDetailId,
  }
  return _client.callActionRaw<InspectionDraft<TDoc, TDetail>>('CreateFinalInspectionByDailyPlanAssembly', {
    method: 'POST',
    body,
  } as ActionCallOptions)
}

/**
 *
 * 日计划 → 生产流程卡末道检验草稿
 *
 */
export function CreateFinalInspectionByDailyPlanProduce<TDoc = unknown, TDetail = unknown>(
  payload: DailyPlanInspectionRequest,
): Promise<InspectionDraft<TDoc, TDetail>> {
  const body = {
    DbName: payload.dbName ?? DEFAULT_DB_NAME,
    User: payload.user,
    DailyPlanDetailId: payload.dailyPlanDetailId,
  }
  return _client.callActionRaw<InspectionDraft<TDoc, TDetail>>('CreateFinalInspectionByDailyPlanProduce', {
    method: 'POST',
    body,
  } as ActionCallOptions)
}

export const ProduceFlowApi = {
  CreateFirstInspectionByDailyPlanAssembly,
  CreateFirstInspectionByDailyPlanProduce,
  CreateFinalInspectionByDailyPlanAssembly,
  CreateFinalInspectionByDailyPlanProduce,
}

export default ProduceFlowApi
