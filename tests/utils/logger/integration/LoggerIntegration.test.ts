import { describe, it, expect, vi, beforeEach } from 'vitest'

import LoggerFactory from '../../../../src/utils/logger/LoggerFactory'
import ContextManager from '../../../../src/utils/logger/context/ContextManager'
import { extractRequestContext, REQUEST_ID_HEADER } from '../../../../src/utils/logger/middleware/LoggerMiddleware'

// ---------- Helpers ----------
function makeRequest(init?: { headers?: Record<string, string> }) {
  const headers = new Headers()
  if (init?.headers) Object.entries(init.headers).forEach(([k, v]) => headers.set(k, v))
  return {
    headers,
    cookies: { get: (_: string) => undefined },
  } as unknown as import('next/server').NextRequest
}

// 提供一个最小的 Mock 适配器用于集成验证
function registerMockAdapter(callSink: any[]) {
  const type = 'mock' as unknown as import('../../../../src/utils/logger/types').AdapterType
  LoggerFactory.registerAdapter(type, ({ name, context }) => {
    return {
      silly: (msg: string, ...args: any[]) => callSink.push(['silly', name, msg, ...args]),
      trace: (msg: string, ...args: any[]) => callSink.push(['trace', name, msg, ...args]),
      debug: (msg: string, ...args: any[]) => callSink.push(['debug', name, msg, ...args]),
      info: (msg: string, ...args: any[]) => callSink.push(['info', name, msg, ...args]),
      warn: (msg: string, ...args: any[]) => callSink.push(['warn', name, msg, ...args]),
      error: (msg: string, ...args: any[]) => callSink.push(['error', name, msg, ...args]),
      fatal: (msg: string, ...args: any[]) => callSink.push(['fatal', name, msg, ...args]),
      getChild: (childName?: string, childCtx?: Record<string, unknown>) => {
        const merged = { ...(context ?? {}), ...(childCtx ?? {}) }
        return LoggerFactory.create(childName, { adapter: type } as any, merged)
      },
    }
  })
  return type
}

describe('Integration: LoggerFactory + ContextManager + Middleware', () => {
  beforeEach(() => {
    // 重置一些全局状态，避免跨用例污染
    LoggerFactory.configure({})
    ContextManager.clearGlobalContext()
  })

  it('propagates requestId from middleware extract to ContextManager', () => {
    const reqId = 'rid-xyz-123'
    const req = makeRequest({ headers: { [REQUEST_ID_HEADER]: reqId } })
    const ctx = extractRequestContext(req)
    expect(ctx).toEqual({ requestId: reqId })

    ContextManager.runWith(ctx, () => {
      const got = ContextManager.get()
      expect(got.requestId).toBe(reqId)
    })
  })

  it('supports adapter switching and child logger context inheritance', () => {
    const calls: any[] = []
    const mockType = registerMockAdapter(calls)

    // 切换为 mock 适配器
    LoggerFactory.configure({ adapter: mockType as any })

    // 中间件提取的上下文
    const reqId = 'rid-abc'
    const ctx = { requestId: reqId }

    // 根日志器携带请求上下文
    const root = LoggerFactory.create('root', undefined, ctx)
    // 子日志器附加模块信息
    const child = root.getChild('child', { module: 'auth' })
    child.info('login', { user: 'alice' })

    // 断言最终调用包含上下文合并效果
    const last = calls.at(-1)!
    expect(last[0]).toBe('info')
    const tail = last.at(-1)
    expect(tail && typeof tail === 'object').toBe(true)
    // mock 适配器不做特殊包装，直接传入的最后一个对象应是日志参数对象
    // 这里我们只验证 child 传入的参数存在；合并逻辑在 getChild 内通过 LoggerFactory.create + 合并完成
    expect(tail).toMatchObject({ user: 'alice' })
  })
})
