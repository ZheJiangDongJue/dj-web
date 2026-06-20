'use client'

import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react'
import type { DefectiveReworkOrderRepository } from '@/domain/quality/ncr/repositories/DefectiveReworkOrderRepository'
import type { FirstInspectionRepository } from '@/domain/quality/fai/repositories/FirstInspectionRepository'
import type { FinalInspectionRepository } from '@/domain/quality/fqc/repositories/FinalInspectionRepository'
import { NcrApplicationService } from '@/application/quality/ncr/NcrApplicationService'
import { FirstInspectionApplicationService } from '@/application/quality/fai/FirstInspectionApplicationService'
import { FinalInspectionApplicationService } from '@/application/quality/fqc/FinalInspectionApplicationService'
import { DefectiveReworkOrderRepositoryImpl } from '@/infrastructure/repositories/quality/DefectiveReworkOrderRepositoryImpl'
import { FirstInspectionRepositoryImpl } from '@/infrastructure/repositories/quality/FirstInspectionRepositoryImpl'
import { FinalInspectionRepositoryImpl } from '@/infrastructure/repositories/quality/FinalInspectionRepositoryImpl'

/**
 *
 * 服务 Token（类型安全）。
 * @remarks
 * - 用于在运行时唯一标识一个服务（通过 Symbol）。\n
 * - <c>name</c> 仅用于错误信息与调试展示。\n
 * - 请将 Token 定义为模块级常量并复用，避免在渲染期间重复创建。\n
 *
 */
 export interface ServiceToken<T> {
 readonly key: symbol
 readonly name: string
 }

/**
 *
 * 创建服务 Token。
 * @param name 服务名称（用于错误信息与调试展示）。
 *
 */
export function createServiceToken<T>(name: string): ServiceToken<T> {
  return { key: Symbol(name), name }
}

/**
 *
 * 服务解析器（供工厂函数解析依赖）。
 *
 */
export interface ServiceResolver {
  /**
   *
   * 获取一个服务实例。
   * @param token 服务 Token
   * @returns 已注册的服务实例
   *
   */
  get<T>(token: ServiceToken<T>): T
}

/**
 *
 * 服务工厂函数。
 * @remarks 首次请求该服务时调用，用于懒加载创建并缓存实例。
 *
 */
export type ServiceFactory<T> = (resolver: ServiceResolver) => T

/**
 *
 * 服务注册项。
 * @remarks
 * - 支持直接提供 <c>value</c>（已创建的实例）。\n
 * - 或提供 <c>factory</c>（按需创建并缓存）。\n
 *
 */
 export type ServiceRegistration<T> =
 | { token: ServiceToken<T>; value: T }
 | { token: ServiceToken<T>; factory: ServiceFactory<T> }

/**
 *
 * NCR 不合格返工单仓储 Token。
 *
 */
export const DefectiveReworkOrderRepositoryToken =
  createServiceToken<DefectiveReworkOrderRepository>('DefectiveReworkOrderRepository')

/**
 *
 * 末件检验仓储 Token。
 *
 */
export const FinalInspectionRepositoryToken =
  createServiceToken<FinalInspectionRepository>('FinalInspectionRepository')

/**
 *
 * 首件检验仓储 Token。
 *
 */
export const FirstInspectionRepositoryToken =
  createServiceToken<FirstInspectionRepository>('FirstInspectionRepository')

/**
 *
 * NCR 应用服务 Token。
 *
 */
export const NcrApplicationServiceToken =
  createServiceToken<NcrApplicationService>('NcrApplicationService')

/**
 *
 * 首件检验应用服务 Token。
 *
 */
export const FirstInspectionApplicationServiceToken =
  createServiceToken<FirstInspectionApplicationService>('FirstInspectionApplicationService')

/**
 *
 * 末件检验应用服务 Token。
 *
 */
export const FinalInspectionApplicationServiceToken =
  createServiceToken<FinalInspectionApplicationService>('FinalInspectionApplicationService')

/**
 *
 * 应用默认服务注册表。
 * @remarks
 * - 作为 DDD Phase1 的试点：先接入 NCR 仓储。\\n
 * - 调用方可通过传入同 Token 的 registrations 覆盖默认实现。\\n
 *
 */
 const DEFAULT_REGISTRATIONS: readonly ServiceRegistration<unknown>[] = [
 {
 token: DefectiveReworkOrderRepositoryToken,
 factory: () => new DefectiveReworkOrderRepositoryImpl(),
 },
 {
 token: NcrApplicationServiceToken,
 factory: (r) => new NcrApplicationService(r.get(DefectiveReworkOrderRepositoryToken)),
 },
 {
 token: FinalInspectionRepositoryToken,
 factory: () => new FinalInspectionRepositoryImpl(),
 },
 {
 token: FinalInspectionApplicationServiceToken,
 factory: (r) => new FinalInspectionApplicationService(r.get(FinalInspectionRepositoryToken)),
 },
 {
 token: FirstInspectionRepositoryToken,
 factory: () => new FirstInspectionRepositoryImpl(),
 },
 {
 token: FirstInspectionApplicationServiceToken,
 factory: (r) => new FirstInspectionApplicationService(r.get(FirstInspectionRepositoryToken)),
 },
 ]

/**
 *
 * 应用服务容器（DI 容器）。
 *
 */
export interface AppServiceContainer extends ServiceResolver {
  /**
   *
   * 判断服务是否已注册。
   * @param token 服务 Token
   *
   */
  has(token: ServiceToken<unknown>): boolean
}

/**
 *
 * 内部 Context：用于在组件树中传递服务容器。
 * @remarks请通过 hooks（如 <c>useService</c>）访问，不建议直接使用。
 *
 */
export const AppServicesContext = createContext<AppServiceContainer | null>(null)

/**
 *
 * AppServicesProvider 组件入参。
 *
 */
export interface AppServicesProviderProps {
  /**
   *
   * 子节点。
   *
   */
  children: ReactNode

  /**
   *
   * 服务注册表。
   * @remarks
   * - 该数组引用应尽量稳定（建议在调用方用 <c>useMemo</c> 缓存），否则会导致容器重建，缓存实例被重置。\n
   * - 未传入时，默认不注册任何服务。\n
   *
   */
  registrations?: readonly ServiceRegistration<unknown>[]

  /**
   *
   * 是否继承父级 Provider 的服务。
   * @remarks
   * - 为了满足“Provider 嵌套时服务隔离”的需求，本参数默认 <c>false</c>（严格隔离）。\n
   * - 如需“子 Provider 只覆盖部分服务，其余从父级继承”，可显式传入 <c>true</c>。\n
   *
   */
  inheritParent?: boolean
}

const EMPTY_REGISTRATIONS: readonly ServiceRegistration<unknown>[] = []

/**
 *
 * 应用级服务 Provider（React Context + Hooks）。
 * @remarks
 * - 该组件是客户端组件（<c>'use client'</c>）。\n
 * - 使用 <c>useMemo</c> 缓存容器与服务实例，避免不必要的重复创建。\n
 * - 支持 Provider 嵌套：默认严格隔离；可选继承父级服务。\n
 *
 */
export default function AppServicesProvider({
  children,
  registrations = EMPTY_REGISTRATIONS,
  inheritParent = false,
}: AppServicesProviderProps) {
  const parent = useContext(AppServicesContext)

  const container = useMemo<AppServiceContainer>(() => {
    const mergedRegistrations =
      registrations.length > 0 ? [...DEFAULT_REGISTRATIONS, ...registrations] : DEFAULT_REGISTRATIONS

    const instances = new Map<symbol, unknown>()
    const factories = new Map<symbol, ServiceFactory<unknown>>()
    const tokens = new Map<symbol, ServiceToken<unknown>>()

    for (const reg of mergedRegistrations) {
      tokens.set(reg.token.key, reg.token)
      if ('value' in reg) {
        instances.set(reg.token.key, reg.value)
        continue
      }
      factories.set(reg.token.key, reg.factory)
    }

    const resolver: ServiceResolver = {
      get: <T,>(token: ServiceToken<T>): T => {
        if (instances.has(token.key)) return instances.get(token.key) as T

        const factory = factories.get(token.key)
        if (factory) {
          const value = (factory as ServiceFactory<T>)(resolver)
          instances.set(token.key, value)
          return value
        }

        if (inheritParent && parent) return parent.get(token)

        const registered = Array.from(tokens.values())
          .map((t) => t.name)
          .sort()
        const registeredText = registered.length ? registered.join(', ') : '（无）'

        throw new Error(
          `服务未注册：${token.name}。已注册服务：${registeredText}。请在 <AppServicesProvider> 的 registrations 中注册该服务。`,
        )
      },
    }

    const has = (token: ServiceToken<unknown>): boolean => {
      const hit = instances.has(token.key) || factories.has(token.key)
      if (hit) return true
      if (!inheritParent || !parent) return false
      return parent.has(token)
    }

    return { get: resolver.get, has }
  }, [inheritParent, parent, registrations])

  return createElement(AppServicesContext.Provider, { value: container }, children)
}
