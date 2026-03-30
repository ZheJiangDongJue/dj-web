/**
 *
 * 日志中间层 - 基础类型定义
 * 为 ILogger 及其周边组件提供类型安全支撑
 *
 */

/**
 *
 * 日志级别（数值越大严重性越高）
 *
 */
export enum LogLevel {
  SILLY = 0,
  TRACE = 1,
  DEBUG = 2,
  INFO = 3,
  WARN = 4,
  ERROR = 5,
  FATAL = 6,
}

/**
 *
 * 输出格式
 *
 */
export type LogFormat = 'pretty' | 'json' | 'hidden'

/**
 *
 * 适配器类型（可扩展）
 *
 */
export type AdapterType = 'tslog' | 'winston' | 'pino' | 'console'

/**
 *
 * 文件输出配置
 *
 */
export interface OutputFileConfig {
  /**
   *
   * 文件路径，如 logs/app.log
   *
   */
  path: string
  /**
   *
   * 单个文件最大尺寸，如 '10m'、'100k'
   *
   */
  maxSize: string
  /**
   *
   * 最大滚动文件数量
   *
   */
  maxFiles: number
}

/**
 *
 * 输出目标配置
 *
 */
export interface OutputConfig {
  /**
   *
   * 是否输出到控制台
   *
   */
  console: boolean
  /**
   *
   * 可选：输出到文件
   *
   */
  file?: OutputFileConfig
}

/**
 *
 * 文本格式化配置
 *
 */
export interface FormattingConfig {
  /**
   *
   * 是否包含时间戳
   *
   */
  timestamp: boolean
  /**
   *
   * 是否使用颜色
   *
   */
  colorize: boolean
  /**
   *
   * 自定义模板（可选）
   *
   */
  template?: string
}

/**
 *
 * 脱敏相关配置
 *
 */
export interface MaskConfig {
  /**
   *
   * 是否启用脱敏
   *
   */
  enabled: boolean
  /**
   *
   * 脱敏匹配模式（字符串或正则表达式文本）
   *
   */
  patterns: string[]
  /**
   *
   * 替换文本，如 '***'
   *
   */
  replacement: string
}

/**
 *
 * 日志上下文信息
 * 贯穿一次请求或业务动作的附加数据
 *
 */
export interface LogContext {
  requestId?: string
  userId?: string
  sessionId?: string
  module?: string
  action?: string
  /**
   *
   * 允许携带更多上下文键值
   *
   */
  [key: string]: unknown
}

/**
 *
 * 日志系统总配置
 *
 */
export interface LogConfig {
  /**
   *
   * 默认日志级别
   *
   */
  level: LogLevel
  /**
   *
   * 输出格式
   *
   */
  type: LogFormat
  /**
   *
   * 适配器类型
   *
   */
  adapter: AdapterType
  /**
   *
   * 输出目标
   *
   */
  output: OutputConfig
  /**
   *
   * 格式化设置
   *
   */
  formatting: FormattingConfig
  /**
   *
   * 脱敏设置
   *
   */
  mask: MaskConfig
}

/**
 *
 * 附加的元信息（通常由适配器或运行时收集）
 *
 */
export interface LogMetadata {
  timestamp: Date
  filePath?: string
  line?: number
  method?: string
  /**
   *
   * 任意扩展元信息
   *
   */
  [key: string]: unknown
}

/**
 *
 * 记录结构化日志时的负载对象类型
 *
 */
export type LogPayload = Record<string, unknown>

/**
 *
 * 标准化的日志记录对象
 *
 */
export interface LogRecord<T extends LogPayload = LogPayload> {
  level: LogLevel
  message: string
  context?: LogContext
  meta?: LogMetadata
  data?: T
}

/**
 *
 * 日志方法通用签名。
 * 具体接口定义在 interfaces/ILogger.ts 中实现。
 *
 */
export type LoggerMethod<T extends LogPayload = LogPayload> = (
  message: string,
  ...args: unknown[]
) => void

/**
 *
 * 创建子日志器的可选项
 *
 */
export interface ChildLoggerOptions {
  name?: string
  context?: LogContext
}

/**
 *
 * 便捷的日志级别名称映射
 *
 */
export const LOG_LEVEL_NAMES = {
  [LogLevel.SILLY]: 'SILLY',
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
} as const

/**
 *
 * 允许将字符串级别解析为枚举
 *
 */
export type LogLevelName = keyof typeof LOG_LEVEL_NAMES
