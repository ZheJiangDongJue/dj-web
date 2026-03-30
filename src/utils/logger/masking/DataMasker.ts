/**
 *
 * DataMasker
 * 通用敏感数据脱敏工具：支持对象/数组/字符串递归脱敏、循环引用防护、可配置规则。
 *
 */

import type { MaskConfig } from '../types'

export type CompiledMask = {
  patterns: RegExp[]
  replacement: string
}

/**
 *
 * 将字符串模式编译为不区分大小写的正则表达式列表。
 * - 允许直接传入正则文本（例如："password|token" 或 "(secret|api.?key)"）
 * - 对非法正则做保护，自动转义后按普通文本处理
 *
 */
export function compileMaskConfig(config: MaskConfig): CompiledMask {
  const compiled: RegExp[] = []
  for (const raw of config.patterns ?? []) {
    if (!raw || typeof raw !== 'string') continue
    try {
      compiled.push(new RegExp(raw, 'i'))
    } catch {
      // 回退：按普通文本匹配
      const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      compiled.push(new RegExp(escaped, 'i'))
    }
  }
  return { patterns: compiled, replacement: config.replacement ?? '***' }
}

function shouldMaskKey(key: string, rules: CompiledMask): boolean {
  return rules.patterns.some((re) => re.test(key))
}

function maskString(input: string, rules: CompiledMask): string {
  if (!rules.patterns.length) return input
  let out = input
  for (const re of rules.patterns) {
    out = out.replace(re, rules.replacement)
  }
  return out
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as object).constructor === Object
  )
}

function isError(value: unknown): value is Error {
  return value instanceof Error
}

export type MaskOptions = {
  /**
   *
   * 最大递归深度，防止极深嵌套造成性能问题（默认 8）
   *
   */
  maxDepth?: number
}

/**
 *
 * 将任意数据按规则脱敏，保持输入数据结构不变（深拷贝）。
 * - 对象：键与值均会参与处理，命中键名规则则整体值替换为 replacement
 * - 数组：逐项递归
 * - 字符串：命中规则的片段将被替换
 * - 其余原始类型：原样返回
 *
 */
export function maskData(
  input: unknown,
  compiled: CompiledMask,
  opts: MaskOptions = {},
): unknown {
  const maxDepth = opts.maxDepth ?? 8
  const seen = new WeakSet<object>()

  const walk = (value: unknown, depth: number): unknown => {
    if (depth > maxDepth) return value

    if (typeof value === 'string') return maskString(value, compiled)
    if (typeof value !== 'object' || value === null) return value

    if (seen.has(value as object)) return '[Circular]'
    seen.add(value as object)

    if (Array.isArray(value)) {
      return value.map((v) => walk(v, depth + 1))
    }

    if (isError(value)) {
      // 复制标准错误字段，避免破坏堆栈信息
      const err = value as Error
      const out: Record<string, unknown> = {
        name: err.name,
        message: maskString(String(err.message ?? ''), compiled),
        stack: typeof err.stack === 'string' ? maskString(err.stack, compiled) : err.stack,
      }
      // 附加自定义字段
      const extra: Record<string, unknown> = err as unknown as Record<string, unknown>
      for (const k of Object.keys(extra)) {
        if (k in out) continue
        const v = extra[k]
        out[k] = shouldMaskKey(k, compiled) ? compiled.replacement : walk(v, depth + 1)
      }
      return out
    }

    if (value instanceof Date) return new Date(value) // 拷贝
    if (value instanceof Map || value instanceof Set) return value // 保持引用（避免结构变形）

    if (isPlainObject(value)) {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value)) {
        if (shouldMaskKey(k, compiled)) {
          out[k] = compiled.replacement
        } else if (typeof v === 'string') {
          out[k] = maskString(v, compiled)
        } else {
          out[k] = walk(v, depth + 1)
        }
      }
      return out
    }

    // 其他对象类型（如自定义类实例）：尝试浅复制其可枚举属性
    const out: Record<string, unknown> = {}
    for (const k in value as Record<string, unknown>) {
      const v = (value as Record<string, unknown>)[k]
      out[k] = shouldMaskKey(k, compiled) ? compiled.replacement : walk(v, depth + 1)
    }
    return out
  }

  return walk(input, 0)
}

/**
 *
 * 面向配置的便捷脱敏器。
 *
 */
export class DataMasker {
  private readonly compiled: CompiledMask

  constructor(cfg: MaskConfig) {
    this.compiled = compileMaskConfig(cfg)
  }

  mask<T = unknown>(data: T, opts?: MaskOptions): T {
    return maskData(data, this.compiled, opts) as T
  }
}

export default DataMasker
