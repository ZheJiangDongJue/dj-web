/**
 *
 * 用户可见错误文案工具。
 * 目标：
 * - 从各种异常对象结构中尽可能提取后端返回的可读 message；
 * - 在缺失具体错误信息时，统一回退到调用方给定的兜底文案；
 * - 避免界面频繁出现“请稍后重试”这类无信息量提示。
 *
 */

const MESSAGE_KEYS = [
  'message',
  'Message',
  'errorMessage',
  'ErrorMessage',
  'msg',
  'Msg',
  'detail',
  'Detail',
  'error',
  'Error',
  'reason',
  'Reason',
] as const

const NESTED_KEYS = [
  'data',
  'Data',
  'response',
  'Response',
  'body',
  'Body',
  'result',
  'Result',
  'cause',
  'Cause',
  'innerError',
  'InnerError',
] as const

const GENERIC_MESSAGES = new Set([
  '发生错误，请稍后重试',
  '网络异常，请稍后重试',
  '请求失败，请稍后重试',
  '请求失败',
  '发生错误',
  '网络异常',
  'unknown error',
  'network error',
  'request failed',
  'failed to fetch',
])

/**
 *
 * 判断字符串是否可作为用户可见错误文案。
 * @param raw 候选字符串。
 * @returns 可用返回 true；否则 false。
 *
 */
function isMeaningfulMessage(raw: unknown): raw is string {
  if (typeof raw !== 'string') return false
  const text = raw.trim()
  if (!text) return false
  if (text === '[object Object]') return false
  return true
}

/**
 *
 * 判断错误文案是否过于泛化。
 * @param message 错误文案。
 * @returns 泛化文案返回 true。
 *
 */
function isGenericMessage(message: string): boolean {
  const text = message.trim().toLowerCase()
  if (!text) return true
  if (GENERIC_MESSAGES.has(text)) return true
  if (/^.*请稍后重试[。！!]?$/.test(text) && text.length <= 14) return true
  return false
}

/**
 *
 * 归一化消息文本。
 * @param raw 原始文本。
 * @returns 归一化后的文本。
 *
 */
function normalizeMessage(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim()
}

/**
 *
 * 深度提取错误消息候选项。
 * @param input 任意异常对象。
 * @param visited 循环引用保护集合。
 * @param depth 递归深度。
 * @returns 候选文案列表（保序）。
 *
 */
function collectCandidates(input: unknown, visited: WeakSet<object>, depth: number): string[] {
  if (depth > 4 || input == null) return []

  if (isMeaningfulMessage(input)) {
    return [normalizeMessage(input)]
  }

  if (typeof input !== 'object') {
    return []
  }

  const obj = input as Record<string, unknown>
  if (visited.has(obj)) return []
  visited.add(obj)

  const candidates: string[] = []

  for (const key of MESSAGE_KEYS) {
    const raw = obj[key]
    if (isMeaningfulMessage(raw)) {
      candidates.push(normalizeMessage(raw))
    }
  }

  // 兼容 Error 实例
  if (input instanceof Error) {
    if (isMeaningfulMessage(input.message)) {
      candidates.push(normalizeMessage(input.message))
    }
    const cause = (input as Error & { cause?: unknown }).cause
    if (cause !== undefined) {
      candidates.push(...collectCandidates(cause, visited, depth + 1))
    }
  }

  for (const key of NESTED_KEYS) {
    const nested = obj[key]
    if (nested !== undefined) {
      candidates.push(...collectCandidates(nested, visited, depth + 1))
    }
  }

  return candidates
}

/**
 *
 * 从异常对象中提取最可用的错误文案。
 * @param error 异常对象。
 * @returns 提取到的文案；无法提取返回 null。
 *
 */
export function extractUserFacingErrorMessage(error: unknown): string | null {
  const candidates = collectCandidates(error, new WeakSet<object>(), 0)
  if (candidates.length === 0) return null

  const firstSpecific = candidates.find((m) => !isGenericMessage(m))
  if (firstSpecific) return firstSpecific

  return candidates[0] ?? null
}

/**
 *
 * 解析最终要展示给用户的错误文案。
 * @param error 异常对象。
 * @param fallback 未提取到可用文案时的回退提示。
 * @returns 最终可显示的错误文案。
 *
 */
export function resolveUserFacingErrorMessage(error: unknown, fallback: string): string {
  const extracted = extractUserFacingErrorMessage(error)
  const normalizedFallback = normalizeMessage(String(fallback ?? ''))
  if (extracted && !isGenericMessage(extracted)) return extracted
  if (normalizedFallback) return normalizedFallback

  return extracted && extracted.trim() ? extracted : '操作失败'
}

/**
 *
 * 构建“动作 + 原因”的统一提示。
 * @param actionLabel 动作名称（如：保存、审批、扫码处理）。
 * @param error 异常对象。
 * @param fallbackReason 缺失具体原因时的回退原因。
 * @returns 形如“保存失败：xxx”的用户可读提示。
 *
 */
export function formatActionErrorMessage(
  actionLabel: string,
  error: unknown,
  fallbackReason: string,
): string {
  const action = String(actionLabel ?? '').trim() || '操作'
  const reason = resolveUserFacingErrorMessage(error, fallbackReason)

  if (reason.startsWith(`${action}失败`)) return reason
  if (/^[^：:]{1,20}失败[:：]/.test(reason)) return reason

  return `${action}失败：${reason}`
}
