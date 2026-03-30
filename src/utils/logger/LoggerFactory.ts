/**
 *
 * LoggerFactory
 * 负责日志实例的创建与全局配置管理，支持多适配器与配置校验/合并。
 *
 */

import type { ILogger } from './interfaces/ILogger'
import TSLogAdapter from './adapters/TSLogAdapter'
import WinstonAdapter from './adapters/WinstonAdapter'
import type { AdapterType, LogConfig, LogContext, LogFormat, LogLevel } from './types'

type AdapterFactory = (args: {
  name?: string
  config?: Partial<LogConfig>
  context?: LogContext
}) => ILogger

const DEFAULT_CONFIG: LogConfig = {
  level: 3 as LogLevel, // INFO
  type: 'pretty' as LogFormat,
  adapter: 'tslog' as AdapterType,
  output: { console: true },
  formatting: { timestamp: true, colorize: true },
  mask: { enabled: false, patterns: [], replacement: '***' },
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

function ensureValidConfig(cfg: LogConfig): LogConfig {
  const out: LogConfig = { ...cfg }
  // 兜底字段
  out.output = out.output ?? { console: true }
  out.formatting = out.formatting ?? { timestamp: true, colorize: true }
  out.mask = out.mask ?? { enabled: false, patterns: [], replacement: '***' }

  // 规范化取值
  const allowedFormats: LogFormat[] = ['pretty', 'json', 'hidden']
  if (!allowedFormats.includes(out.type)) out.type = 'pretty'

  const dynamicAdapters = (() => {
    try {
      return Array.from(LoggerFactory.adapters.keys()) as AdapterType[]
    } catch {
      return ['tslog', 'console', 'winston', 'pino'] as AdapterType[]
    }
  })()
  if (!dynamicAdapters.includes(out.adapter)) out.adapter = 'tslog'

  return out
}

export class LoggerFactory {
  private static globalConfig: LogConfig = { ...DEFAULT_CONFIG }

  static readonly adapters: Map<AdapterType, AdapterFactory> = new Map([
    // tslog 适配器（默认）
    [
      'tslog',
      ({ name, config, context }): ILogger =>
        new TSLogAdapter({ name, config, context }),
    ],
    // console 适配（复用 TSLogAdapter，若未安装 tslog 将自动降级为 console shim）
    [
      'console',
      ({ name, config, context }): ILogger =>
        new TSLogAdapter({ name, config: { ...config, type: 'pretty' }, context }),
    ],
    // winston 适配器（扩展性验证）
    [
      'winston',
      ({ name, config, context }): ILogger =>
        new WinstonAdapter({ name, config, context }),
    ],
  ])

  /**
   *
   * 设置/合并全局配置（线程安全：替换为新对象）。
   *
   */
  static configure(config: Partial<LogConfig>): void {
    const merged = mergeConfig(LoggerFactory.globalConfig, config)
    LoggerFactory.globalConfig = ensureValidConfig(merged)
  }

  /**
   *
   * 获取当前全局配置（拷贝）。
   *
   */
  static getConfig(): LogConfig {
    return { ...LoggerFactory.globalConfig }
  }

  /**
   *
   * 注册自定义适配器。
   *
   */
  static registerAdapter(type: AdapterType, factory: AdapterFactory): void {
    LoggerFactory.adapters.set(type, factory)
  }

  /**
   *
   * 是否存在适配器。
   *
   */
  static hasAdapter(type: AdapterType): boolean {
    return LoggerFactory.adapters.has(type)
  }

  /**
   *
   * 创建一个 ILogger 实例。
   * - name: 日志器名称（可选）
   * - config: 局部配置（与全局配置合并）
   * - context: 初始上下文（可选）
   *
   */
  static create(
    name?: string,
    config?: Partial<LogConfig>,
    context?: LogContext,
  ): ILogger {
    const merged = ensureValidConfig(mergeConfig(LoggerFactory.globalConfig, config))
    const factory = LoggerFactory.adapters.get(merged.adapter)

    if (!factory) {
      // 若未注册目标适配器，回退到 tslog
      const fallback = LoggerFactory.adapters.get('tslog')!
      return fallback({ name, config: merged, context })
    }

    return factory({ name, config: merged, context })
  }
}

export default LoggerFactory
