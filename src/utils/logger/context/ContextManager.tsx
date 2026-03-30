/**
 *
 * ContextManager
 * 日志上下文管理器：支持 Node 侧 AsyncLocalStorage 与前端 React Context。
 * - 服务端（Node）：使用 AsyncLocalStorage 在一次请求的异步链路内传递上下文
 * - 客户端（Web）：提供 React Provider/Hook；同时有全局兜底（非 React 场景）
 *
 */

import type { LogContext } from '../types'

/**
 *
 * 是否运行在服务端（Node）
 *
 */
function isServer(): boolean {
  return typeof window === 'undefined'
}

// 延迟引入 async_hooks，避免在浏览器端打包报错
let AsyncLocalStorageCtor: any | undefined
if (typeof process !== 'undefined' && (process as any).versions?.node) {
  try {
    AsyncLocalStorageCtor = require('async_hooks').AsyncLocalStorage
  } catch {
    AsyncLocalStorageCtor = undefined
  }
}

/**
 *
 * Node 侧：基于 AsyncLocalStorage 的存储（按请求链路隔离）
 *
 */
const als: any | undefined = AsyncLocalStorageCtor
  ? (new AsyncLocalStorageCtor() as any)
  : undefined

/**
 *
 * 浏览器侧：提供一个全局兜底上下文（非 React 场景）
 *
 */
let globalBrowserContext: LogContext = {}

/**
 *
 * 深合并（浅层对象即可）
 *
 */
function mergeContext(base: LogContext, ext?: LogContext): LogContext {
  if (!ext) return base
  return { ...base, ...ext }
}

export class ContextManager {
  /**
   *
   * 检查是否服务端
   *
   */
  static isServer(): boolean {
    return isServer()
  }

  /**
   *
   * 获取当前上下文（按运行环境）
   *
   */
  static get(): LogContext {
    if (isServer()) {
      return (als?.getStore() as LogContext | undefined) ?? {}
    }
    return globalBrowserContext
  }

  /**
   *
   * 设置/合并上下文（作用于当前环境）
   *
   */
  static set(partial: LogContext): void {
    if (isServer()) {
      const current = (als?.getStore() as LogContext | undefined) ?? {}
      // 直接合并回当前 store（ALS 存的对象引用可变更）
      const merged = mergeContext(current, partial)
      if (als) {
        // 在没有 run 的上下文里无法 set，提供一次自建 run 包装
        if (!als.getStore()) {
          als.run(merged, () => {})
        } else {
          // 将合并内容写回（修改引用）
          Object.assign(current, merged)
        }
      }
      return
    }
    globalBrowserContext = mergeContext(globalBrowserContext, partial)
  }

  /**
   *
   * 在给定上下文下执行函数（Node 侧使用 ALS 保障异步链路一致性）
   *
   */
  static runWith<T>(context: LogContext, fn: () => T): T {
    if (isServer() && als) {
      return als.run(context, fn)
    }
    // 浏览器侧：暂存-执行-还原
    const prev = globalBrowserContext
    globalBrowserContext = mergeContext(prev, context)
    try {
      return fn()
    } finally {
      globalBrowserContext = prev
    }
  }

  /**
   *
   * 浏览器：设置全局上下文（非 React 场景）
   *
   */
  static setGlobalContext(ctx: LogContext): void {
    if (!isServer()) globalBrowserContext = { ...ctx }
  }

  /**
   *
   * 浏览器：获取全局上下文
   *
   */
  static getGlobalContext(): LogContext {
    return isServer() ? {} : globalBrowserContext
  }

  /**
   *
   * 浏览器：清空全局上下文
   *
   */
  static clearGlobalContext(): void {
    if (!isServer()) globalBrowserContext = {}
  }
}

// ----- React 集成（客户端可用） -----
// 直接引入 react（项目已依赖 React 19）
// 说明：SSR/RSC 编译环境下，文件可以被同时打包，但运行时仅在浏览器使用这些 API。
import React, { createContext, useContext, useMemo, useEffect } from 'react'

export const LogReactContext = createContext<LogContext | undefined>(undefined)

type ProviderProps = {
  value?: LogContext
  children?: React.ReactNode
}

/**
 *
 * React Provider：将传入的 value 合并到父级上下文，用于组件树内的上下文传递。
 * 同时在客户端更新 ContextManager 的全局兜底上下文，便于非 React 代码读取。
 *
 */
export function LogContextProvider({ value, children }: ProviderProps) {
  const parent = useContext(LogReactContext)
  const merged = useMemo(() => mergeContext(parent ?? {}, value), [parent, value])

  useEffect(() => {
    if (!isServer()) ContextManager.setGlobalContext(merged)
  }, [merged])

  return (
    <LogReactContext.Provider value={merged}>{children}</LogReactContext.Provider>
  )
}

/**
 *
 * Hook：获取当前 React 上下文（若无则返回空对象）
 *
 */
export function useLogContext(): LogContext {
  return useContext(LogReactContext) ?? {}
}

export default ContextManager
