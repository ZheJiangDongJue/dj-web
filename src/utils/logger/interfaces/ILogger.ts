/**
 *
 * ILogger 接口定义
 * 提供统一、可扩展、类型安全的日志记录 API。
 *
 */

import type { LogContext, LoggerMethod, LogPayload } from '../types'

/**
 *
 * 通用日志接口。
 * 使用泛型 T 指定结构化日志数据的类型，默认为 Record<string, unknown>。
 *
 */
export interface ILogger<T extends LogPayload = LogPayload> {
  /**
   *
   * 最啰嗦级别日志（开发调试用）
   *
   */
  silly: LoggerMethod<T>

  /**
   *
   * 跟踪级日志（细粒度跟踪）
   *
   */
  trace: LoggerMethod<T>

  /**
   *
   * 调试级日志
   *
   */
  debug: LoggerMethod<T>

  /**
   *
   * 信息级日志
   *
   */
  info: LoggerMethod<T>

  /**
   *
   * 警告级日志
   *
   */
  warn: LoggerMethod<T>

  /**
   *
   * 错误级日志（可恢复）
   *
   */
  error: LoggerMethod<T>

  /**
   *
   * 致命级日志（不可恢复、需要关注）
   *
   */
  fatal: LoggerMethod<T>

  /**
   *
   * 创建子日志器。
   * 子日志器可继承父级配置与上下文，并可附加自身名称或上下文。
   * @param name    子日志器名称（可选）
   * @param context 额外上下文（可选）
   *
   */
  getChild(name?: string, context?: LogContext): ILogger<T>
}
