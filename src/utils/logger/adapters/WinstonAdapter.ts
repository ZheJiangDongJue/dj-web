/**
 *
 * WinstonAdapter
 * 基于 winston 的 ILogger 适配器（动态加载 + console 降级）。
 *
 */

import type { ILogger } from '../interfaces/ILogger'
import type { LogConfig, LogContext, LogFormat, LogLevel, LogPayload } from '../types'

type UnderlyingLogger = {
  silly: (...args: unknown[]) => void
  verbose?: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  child?: (meta?: Record<string, unknown>) => UnderlyingLogger
}

const DEFAULT_CONFIG: LogConfig = {
  level: 3 as LogLevel, // INFO
  type: 'pretty' as LogFormat,
  adapter: 'winston',
  output: { console: true },
  formatting: { timestamp: true, colorize: true },
  mask: { enabled: false, patterns: [], replacement: '***' },
}

type Init = { name?: string; config?: Partial<LogConfig>; context?: LogContext }

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

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Object.prototype.toString.call(v) === '[object Object]'
}

function withContextArgs(context: LogContext | undefined, args: unknown[]): unknown[] {
  if (!context || Object.keys(context).length === 0) return args
  if (args.length > 0) {
    const last = args[args.length - 1]
    if (isPlainObject(last)) return [...args.slice(0, -1), { ...last, context }]
  }
  return [...args, { context }]
}

function levelToWinston(level: LogLevel): string {
  switch (level) {
    case 0: // SILLY
      return 'silly'
    case 1: // TRACE
      return 'verbose'
    case 2: // DEBUG
      return 'debug'
    case 3: // INFO
      return 'info'
    case 4: // WARN
      return 'warn'
    case 5: // ERROR
    case 6: // FATAL
      return 'error'
    default:
      return 'info'
  }
}

function createConsoleShim(): UnderlyingLogger {
  return {
    silly: console.debug.bind(console),
    verbose: console.debug.bind(console),
    debug: console.debug.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    child: () => createConsoleShim(),
  }
}

function createWinstonLogger(name: string | undefined, cfg: LogConfig): UnderlyingLogger {
  try {
    const winston = require('winston') as any
    const { combine, timestamp, colorize, printf, json, simple } = winston.format

    const fmt = (() => {
      if (cfg.type === 'json') return json()
      if (cfg.type === 'hidden') return simple()
      // pretty：可读性输出
      return combine(
        cfg.formatting.colorize ? colorize() : winston.format.uncolorize(),
        cfg.formatting.timestamp ? timestamp() : simple(),
        printf(({ level, message, timestamp: ts, ...rest }: { level: string; message: string; timestamp?: string; [key: string]: unknown }) => {
          const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : ''
          return cfg.formatting.timestamp ? `${ts} ${level}: ${message}${meta}` : `${level}: ${message}${meta}`
        }),
      )
    })()

    const transports: unknown[] = []
    if (cfg.output.console) transports.push(new winston.transports.Console({ format: fmt }))
    if (cfg.output.file?.path) transports.push(new winston.transports.File({ filename: cfg.output.file.path }))

    const logger = winston.createLogger({
      level: levelToWinston(cfg.level),
      defaultMeta: name ? { logger: name } : undefined,
      transports,
    }) as UnderlyingLogger

    return logger
  } catch {
    return createConsoleShim()
  }
}

export class WinstonAdapter<T extends LogPayload = LogPayload> implements ILogger<T> {
  private readonly cfg: LogConfig
  private readonly name?: string
  private readonly context?: LogContext
  private readonly logger: UnderlyingLogger

  constructor(init?: Init, injected?: UnderlyingLogger) {
    this.name = init?.name
    this.cfg = mergeConfig(DEFAULT_CONFIG, init?.config)
    this.context = init?.context
    this.logger = injected ?? createWinstonLogger(this.name, this.cfg)
  }

  getChild(name?: string, context?: LogContext): ILogger<T> {
    const childUnderlying = this.logger.child?.({ logger: name, ...(context ?? {}) }) ?? this.logger
    return new WinstonAdapter<T>(
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
    // winston 没有 trace，用 verbose 映射
    ;(this.logger.verbose ?? this.logger.debug).call(
      this.logger,
      message,
      ...withContextArgs(this.context, args),
    )
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
    // 映射到 error，并带上标记
    this.logger.error(`[fatal] ${message}`, ...withContextArgs(this.context, args))
  }
}

export default WinstonAdapter
