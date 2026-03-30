/**
 *
 * TSLogAdapter
 * 基于 tslog 的 ILogger 适配器（带可降级的 console shim）。
 * 不在模块顶层直接引入 `tslog`，避免在未安装依赖或浏览器端打包时报错。
 *
 */

import type { ILogger } from '../interfaces/ILogger'
import type {
  LogConfig,
  LogContext,
  LogLevel,
  LogFormat,
  LogPayload,
} from '../types'

// 仅类型导入，其它实现使用运行时动态 require

const DEFAULT_CONFIG: LogConfig = {
  level: 3, // INFO
  type: 'pretty',
  adapter: 'tslog',
  output: { console: true },
  formatting: { timestamp: true, colorize: true },
  mask: { enabled: false, patterns: [], replacement: '***' },
}

type Init = {
  name?: string
  config?: Partial<LogConfig>
  context?: LogContext
}

type UnderlyingLogger = {
  silly: (...args: unknown[]) => void
  trace: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  fatal?: (...args: unknown[]) => void
  getSubLogger?: (opts?: { name?: string }) => UnderlyingLogger
  attachTransport?: (fn: (logObj: unknown) => void, minLevel?: number) => void
}

function mapMinLevel(level: LogLevel): number {
  // tslog 的 minLevel 使用 0..6 的数值映射，与我们枚举保持一致
  return level as unknown as number
}

function mergeConfig(base: LogConfig, ext?: Partial<LogConfig>): LogConfig {
  if (!ext) return base
  return {
    ...base,
    ...ext,
    output: { ...base.output, ...(ext.output ?? {}) },
    formatting: { ...base.formatting, ...(ext.formatting ?? {}) },
    mask: { ...base.mask, ...(ext.mask ?? {}) },
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as object).constructor === Object
  )
}

/**
 *
 * console 降级实现，保证在未安装 tslog 时仍可用。
 *
 */
function createConsoleShim(): UnderlyingLogger {
  return {
    silly: console.debug.bind(console),
    trace: console.trace.bind(console),
    debug: console.debug.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    fatal: console.error.bind(console),
    getSubLogger: (_opts?: { name?: string }) => createConsoleShim(),
  }
}

  /**
   *
   * 尝试基于 tslog 创建 UnderlyingLogger；失败则返回 console shim。
   *
   */
  function createTslogLogger(name: string | undefined, cfg: LogConfig): UnderlyingLogger {
  try {
    const { Logger } = require('tslog') as { Logger: new (settings?: unknown) => unknown }
    const logger = new Logger({
      name,
      minLevel: mapMinLevel(cfg.level),
      type: cfg.type as LogFormat,
    }) as UnderlyingLogger

    // 简单文件输出：如果 tslog 支持 attachTransport，则追加一份 JSON 行到文件
    if (cfg.output.file && typeof logger.attachTransport === 'function') {
      try {
        const fs = require('fs') as typeof import('fs')
        const filePath = cfg.output.file.path
        logger.attachTransport?.((logObj: unknown) => {
          try {
            fs.appendFileSync(filePath, `${JSON.stringify(logObj)}\n`, 'utf8')
          } catch {
            // 文件写入失败时静默降级为仅控制台
          }
        }, mapMinLevel(cfg.level))
      } catch {
        // fs 在浏览器不可用或权限不足时，忽略文件输出
      }
    }

    return logger
  } catch {
    return createConsoleShim()
  }
}

/**
 *
 * 将上下文合并进最后一个对象参数，或单独追加一个对象参数。
 *
 */
function withContextArgs(context: LogContext | undefined, args: unknown[]): unknown[] {
  if (!context || Object.keys(context).length === 0) return args
  if (args.length > 0) {
    const last = args[args.length - 1]
    if (isPlainObject(last)) {
      return [...args.slice(0, -1), { ...last, context }]
    }
  }
  return [...args, { context }]
}

export class TSLogAdapter<T extends LogPayload = LogPayload> implements ILogger<T> {
  private readonly cfg: LogConfig

  private readonly name?: string

  private readonly context?: LogContext

  private readonly logger: UnderlyingLogger

  constructor(init?: Init, injected?: UnderlyingLogger) {
    this.name = init?.name
    this.cfg = mergeConfig(DEFAULT_CONFIG, init?.config)
    this.context = init?.context
    this.logger = injected ?? createTslogLogger(this.name, this.cfg)
  }

  getChild(name?: string, context?: LogContext): ILogger<T> {
    const childUnderlying = this.logger.getSubLogger?.({ name }) ?? this.logger
    return new TSLogAdapter<T>(
      {
        name,
        config: this.cfg,
        context: { ...(this.context ?? {}), ...(context ?? {}) },
      },
      childUnderlying,
    )
  }

  silly(message: string, ...args: unknown[]): void {
    this.logger.silly(message, ...withContextArgs(this.context, args))
  }

  trace(message: string, ...args: unknown[]): void {
    this.logger.trace(message, ...withContextArgs(this.context, args))
  }

  debug(message: string, ...args: unknown[]): void {
    this.logger.debug(message, ...withContextArgs(this.context, args))
  }

  info(message: string, ...args: unknown[]): void {
    this.logger.info(message, ...withContextArgs(this.context, args))
  }

  warn(message: string, ...args: unknown[]): void {
    this.logger.warn(message, ...withContextArgs(this.context, args))
  }

  error(message: string, ...args: unknown[]): void {
    this.logger.error(message, ...withContextArgs(this.context, args))
  }

  fatal(message: string, ...args: unknown[]): void {
    const fn = this.logger.fatal ?? this.logger.error
    fn(message, ...withContextArgs(this.context, args))
  }
}

export default TSLogAdapter
