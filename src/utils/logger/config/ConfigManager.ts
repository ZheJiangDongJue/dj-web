/**
 *
 * ConfigManager
 * 多源配置（默认值 + 环境变量 + 文件 + 覆盖项）加载、合并与校验。
 * - 仅在需要时动态访问 Node 能力（fs），避免在浏览器端报错。
 *
 */

import type { AdapterType, LogConfig, LogFormat, LogLevel } from '../types'

const DEFAULT_CONFIG: LogConfig = {
  level: 3 as LogLevel, // INFO
  type: 'pretty' as LogFormat,
  adapter: 'tslog' as AdapterType,
  output: { console: true },
  formatting: { timestamp: true, colorize: true },
  mask: { enabled: false, patterns: [], replacement: '***' },
}

type PartialEnv = Record<string, string | undefined>

function isTruthy(v: string | undefined): boolean {
  if (!v) return false
  return ['1', 'true', 'yes', 'y', 'on'].includes(v.toLowerCase())
}

function parseIntSafe(v: string | undefined, fallback?: number): number | undefined {
  if (v == null) return fallback
  const n = Number.parseInt(v, 10)
  return Number.isNaN(n) ? fallback : n
}

function asLogLevel(v: string | undefined): LogLevel | undefined {
  if (!v) return undefined
  const upper = v.toUpperCase().trim()
  const map: Record<string, LogLevel> = {
    SILLY: 0,
    TRACE: 1,
    DEBUG: 2,
    INFO: 3,
    WARN: 4,
    ERROR: 5,
    FATAL: 6,
  }
  if (upper in map) return map[upper]
  const asNum = Number(upper)
  if (!Number.isNaN(asNum) && asNum >= 0 && asNum <= 6) return asNum as LogLevel
  return undefined
}

function asAdapter(v: string | undefined): AdapterType | undefined {
  if (!v) return undefined
  const lower = v.toLowerCase().trim()
  if (['tslog', 'winston', 'pino', 'console'].includes(lower)) return lower as AdapterType
  return undefined
}

function asFormat(v: string | undefined): LogFormat | undefined {
  if (!v) return undefined
  const lower = v.toLowerCase().trim()
  if (['pretty', 'json', 'hidden'].includes(lower)) return lower as LogFormat
  return undefined
}

function splitList(v: string | undefined): string[] | undefined {
  if (!v) return undefined
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function deepMerge<T extends object>(base: T, ext?: Partial<T>): T {
  if (!ext) return base
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  Object.entries(ext as Record<string, unknown>).forEach(([k, v]) => {
    if (v == null) return
    if (Array.isArray(v)) out[k] = [...v]
    else if (typeof v === 'object') {
      const prev = (out[k] as Record<string, unknown>) ?? {}
      out[k] = deepMerge(prev, v as Record<string, unknown>)
    } else out[k] = v
  })
  return out as T
}

function ensureValidConfig(cfg: LogConfig): LogConfig {
  const out = deepMerge(DEFAULT_CONFIG, cfg)

  // 规范化字段
  const allowedFormats: LogFormat[] = ['pretty', 'json', 'hidden']
  if (!allowedFormats.includes(out.type)) out.type = 'pretty'

  const allowedAdapters: AdapterType[] = ['tslog', 'console', 'winston', 'pino']
  if (!allowedAdapters.includes(out.adapter)) out.adapter = 'tslog'

  // 数值边界
  if (out.output.file?.maxFiles != null) {
    out.output.file.maxFiles = Math.max(1, Math.floor(out.output.file.maxFiles))
  }

  // fallback
  if (!out.output) out.output = { console: true }
  if (!out.formatting) out.formatting = { timestamp: true, colorize: true }
  if (!out.mask) out.mask = { enabled: false, patterns: [], replacement: '***' }

  return out
}

export type ResolveOptions = {
  /**
   *
   * 指定的 env 源（默认 process.env）
   *
   */
  env?: PartialEnv
  /**
   *
   * 配置文件路径（JSON），不可用时忽略
   *
   */
  filePath?: string
  /**
   *
   * 最高优先级覆盖项
   *
   */
  overrides?: Partial<LogConfig>
}

export class ConfigManager {
  /**
   *
   * 获取框架默认配置副本
   *
   */
  static getDefault(): LogConfig {
    return deepMerge(DEFAULT_CONFIG, {})
  }

  /**
   *
   * 从环境变量解析（约定前缀 LOG_）
   *
   */
  static fromEnv(env?: PartialEnv): Partial<LogConfig> {
    const e = env ?? (typeof process !== 'undefined' ? (process.env as PartialEnv) : {})

    const level = asLogLevel(e.LOG_LEVEL)
    const type = asFormat(e.LOG_TYPE)
    const adapter = asAdapter(e.LOG_ADAPTER)

    const outputConsole = e.LOG_OUTPUT_CONSOLE ? isTruthy(e.LOG_OUTPUT_CONSOLE) : undefined
    const filePath = e.LOG_OUTPUT_FILE_PATH
    const fileMaxSize = e.LOG_OUTPUT_FILE_MAX_SIZE // 保持字符串格式，如 "10m"
    const fileMaxFiles = parseIntSafe(e.LOG_OUTPUT_FILE_MAX_FILES)

    const fmtTimestamp = e.LOG_FORMATTING_TIMESTAMP ? isTruthy(e.LOG_FORMATTING_TIMESTAMP) : undefined
    const fmtColorize = e.LOG_FORMATTING_COLORIZE ? isTruthy(e.LOG_FORMATTING_COLORIZE) : undefined
    const fmtTemplate = e.LOG_FORMATTING_TEMPLATE

    const maskEnabled = e.LOG_MASK_ENABLED ? isTruthy(e.LOG_MASK_ENABLED) : undefined
    const maskPatterns = splitList(e.LOG_MASK_PATTERNS)
    const maskReplacement = e.LOG_MASK_REPLACEMENT

    const partial: Partial<LogConfig> = {}
    if (level != null) partial.level = level
    if (type) partial.type = type
    if (adapter) partial.adapter = adapter

    partial.output = partial.output ?? ({} as any)
    if (outputConsole != null) partial.output!.console = outputConsole
    if (filePath || fileMaxSize || fileMaxFiles != null) {
      partial.output!.file = {
        ...(partial.output!.file ?? {}),
        ...(filePath ? { path: filePath } : {}),
        ...(fileMaxSize ? { maxSize: fileMaxSize } : {}),
        ...(fileMaxFiles != null ? { maxFiles: fileMaxFiles } : {}),
      } as any
    }

    partial.formatting = partial.formatting ?? ({} as any)
    if (fmtTimestamp != null) partial.formatting!.timestamp = fmtTimestamp
    if (fmtColorize != null) partial.formatting!.colorize = fmtColorize
    if (fmtTemplate) partial.formatting!.template = fmtTemplate

    partial.mask = partial.mask ?? ({} as any)
    if (maskEnabled != null) partial.mask!.enabled = maskEnabled
    if (maskPatterns) partial.mask!.patterns = maskPatterns
    if (maskReplacement) partial.mask!.replacement = maskReplacement

    return partial
  }

  /**
   *
   * 从 JSON 文件加载配置；不可用则返回空对象
   *
   */
  static fromFile(filePath?: string): Partial<LogConfig> {
    if (!filePath) return {}
    try {
      const fs = require('fs') as typeof import('fs')
      if (!fs.existsSync(filePath)) return {}
      const raw = fs.readFileSync(filePath, 'utf8')
      const data = JSON.parse(raw)
      return data as Partial<LogConfig>
    } catch {
      // 读取或解析失败时静默忽略
      return {}
    }
  }

  /**
   *
   * 深合并多个配置片段（后者覆盖前者）
   *
   */
  static merge(...configs: Partial<LogConfig>[]): LogConfig {
    return configs.reduce<LogConfig>((acc, cur) => ensureValidConfig(deepMerge(acc, cur)), DEFAULT_CONFIG)
  }

  /**
   *
   * 归一化 + 校验
   *
   */
  static validate(cfg: LogConfig): LogConfig {
    return ensureValidConfig(cfg)
  }

  /**
   *
   * 解析完整配置：默认 → 环境变量 → 文件 → 覆盖项（优先级从低到高）
   *
   */
  static resolve(options?: ResolveOptions): LogConfig {
    const envCfg = ConfigManager.fromEnv(options?.env)
    const fileCfg = ConfigManager.fromFile(options?.filePath)
    const overrides = options?.overrides ?? {}
    const merged = deepMerge(deepMerge(deepMerge(DEFAULT_CONFIG, envCfg), fileCfg), overrides)
    return ensureValidConfig(merged)
  }
}

export default ConfigManager
