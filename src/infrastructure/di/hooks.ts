'use client'

import { useContext } from 'react'
import { AppServicesContext, type ServiceToken } from './AppServicesProvider'

/**
 *
 * 从 DI 容器中获取服务实例。
 * @remarks
 * - 若未被 <c>&lt;AppServicesProvider&gt;</c> 包裹，会抛出明确错误。\n
 * - 若服务未注册，会抛出包含“已注册服务列表”的错误，便于定位问题。\n
 * @param token 服务 Token
 *
 */
export function useService<T>(token: ServiceToken<T>): T {
  const container = useContext(AppServicesContext)
  if (!container) {
    throw new Error('useService 只能在 <AppServicesProvider> 内使用')
  }
  return container.get(token)
}

