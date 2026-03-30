/**
 *
 * PerformanceOptimizer
 * 为 ILogger 提供缓冲与异步写入、错误恢复与降级机制。
 * 用法：
 *   import LoggerFactory from '../LoggerFactory'
 *   import { wrapWithBuffer } from './optimization/PerformanceOptimizer'
 *   const base = LoggerFactory.create('app')
 *   const logger = wrapWithBuffer(base, { flushIntervalMs: 20, maxBufferSize: 500 })
 *
 */

import type { ILogger } from '../interfaces/ILogger'
import type { LogPayload } from '../types'

type Level = 'silly' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

// 可用级别：'silly' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export type BufferOverflowStrategy = 'drop-oldest' | 'drop-newest' | 'sync-flush'

export interface PerformanceOptimizerOptions {
  /**
   *
   * 定时批量刷写间隔（毫秒），默认 16ms（约 1 帧）
   *
   */
  flushIntervalMs?: number
  /**
   *
   * 最大缓冲条数，默认 200
   *
   */
  maxBufferSize?: number
  /**
   *
   * 溢出策略，默认 drop-oldest
   *
   */
  overflowStrategy?: BufferOverflowStrategy
  /**
   *
   * 发生错误时回调（可做监控上报）
   *
   */
  onError?: (err: unknown, record: LogRecord) => void
  /**
   *
   * 连续错误阈值，超过后降级到 console，默认 3
   *
   */
  errorThreshold?: number
  /**
   *
   * 是否允许降级到 console，默认 true
   *
   */
  fallbackToConsole?: boolean
}

type LogRecord = { level: Level; message: string; args: unknown[] }

function createConsoleLogger(): ILogger {
  const c = console
  const map: Record<Level, (...args: unknown[]) => void> = {
    silly: c.debug.bind(c),
    trace: c.trace.bind(c),
    debug: c.debug.bind(c),
    info: c.info.bind(c),
    warn: c.warn.bind(c),
    error: c.error.bind(c),
    fatal: c.error.bind(c),
  }
  return {
    silly: (m, ...a) => map.silly(m, ...a),
    trace: (m, ...a) => map.trace(m, ...a),
    debug: (m, ...a) => map.debug(m, ...a),
    info: (m, ...a) => map.info(m, ...a),
    warn: (m, ...a) => map.warn(m, ...a),
    error: (m, ...a) => map.error(m, ...a),
    fatal: (m, ...a) => map.fatal(m, ...a),
    getChild: () => createConsoleLogger(),
  }
}

function schedule(fn: () => void, ms: number) {
  if (ms <= 0) {
    // 微任务优先，尽量减少延迟
    if (typeof queueMicrotask === 'function') return queueMicrotask(fn)
    return Promise.resolve().then(fn).catch(() => {})
  }
  setTimeout(fn, ms)
}

export class BufferedLogger<T extends LogPayload = LogPayload> implements ILogger<T> {
  private target: ILogger<T>

  private opts: Required<PerformanceOptimizerOptions>

  private buf: LogRecord[] = []

  private scheduled = false

  private consecutiveErrors = 0

  private degraded = false

  private readonly fallback: ILogger<T> | null

  constructor(target: ILogger<T>, opts?: PerformanceOptimizerOptions) {
    this.target = target
    this.opts = {
      flushIntervalMs: opts?.flushIntervalMs ?? 16,
      maxBufferSize: opts?.maxBufferSize ?? 200,
      overflowStrategy: opts?.overflowStrategy ?? 'drop-oldest',
      onError: opts?.onError ?? (() => {}),
      errorThreshold: opts?.errorThreshold ?? 3,
      fallbackToConsole: opts?.fallbackToConsole ?? true,
    }
    this.fallback = this.opts.fallbackToConsole ? (createConsoleLogger() as ILogger<T>) : null
  }

  private enqueue(level: Level, message: string, args: unknown[]) {
    if (this.degraded && this.fallback) {
      this.fallback[level](message, ...args)
      return
    }

    // 溢出处理
    if (this.buf.length >= this.opts.maxBufferSize) {
      const strat = this.opts.overflowStrategy
      if (strat === 'drop-oldest') this.buf.shift()
      else if (strat === 'drop-newest') return
      else if (strat === 'sync-flush') this.flushInternal()
    }

    this.buf.push({ level, message, args })
    if (!this.scheduled) {
      this.scheduled = true
      schedule(() => this.flushInternal(), this.opts.flushIntervalMs)
    }
  }

  private flushInternal() {
    this.scheduled = false
    if (this.buf.length === 0) return
    const batch = this.buf
    this.buf = []
    for (const rec of batch) {
      try {
        // 直接调用目标日志器（通过索引访问方法）
        const method = (this.target as Record<Level, (m: string, ...a: unknown[]) => void>)[rec.level]
        method(rec.message, ...rec.args)
        this.consecutiveErrors = 0
      } catch (err) {
        this.opts.onError?.(err, rec)
        this.consecutiveErrors += 1
        // 到达阈值后进行降级
        if (this.consecutiveErrors >= this.opts.errorThreshold) {
          this.degraded = true
        }
        // 尝试向 fallback 输出，避免日志丢失
        if (this.fallback) {
          try {
            const fb = (this.fallback as Record<Level, (m: string, ...a: unknown[]) => void>)[rec.level]
            fb(`[fallback] ${rec.message}`, ...rec.args)
          } catch {
            // 控制台也出错则放弃
          }
        }
      }
    }
  }

  /**
   *
   * 允许手动触发一次刷写
   *
   */
  flush(): void {
    this.flushInternal()
  }

  getChild(name?: string, context?: Record<string, unknown>): ILogger<T> {
    try {
      const child = this.target.getChild(name, context)
      return new BufferedLogger<T>(child, this.opts)
    } catch {
      // getChild 失败时返回当前（或 fallback）
      return this.degraded && this.fallback ? this.fallback : this
    }
  }

  silly(message: string, ...args: unknown[]): void {
    this.enqueue('silly', message, args)
  }
  trace(message: string, ...args: unknown[]): void {
    this.enqueue('trace', message, args)
  }
  debug(message: string, ...args: unknown[]): void {
    this.enqueue('debug', message, args)
  }
  info(message: string, ...args: unknown[]): void {
    this.enqueue('info', message, args)
  }
  warn(message: string, ...args: unknown[]): void {
    this.enqueue('warn', message, args)
  }
  error(message: string, ...args: unknown[]): void {
    this.enqueue('error', message, args)
  }
  fatal(message: string, ...args: unknown[]): void {
    this.enqueue('fatal', message, args)
  }
}

/**
 *
 * 包装一个 ILogger，返回带缓冲/降级能力的日志器。
 *
 */
export function wrapWithBuffer<T extends LogPayload = LogPayload>(
  logger: ILogger<T>,
  opts?: PerformanceOptimizerOptions,
): ILogger<T> {
  return new BufferedLogger<T>(logger, opts)
}

export default BufferedLogger
