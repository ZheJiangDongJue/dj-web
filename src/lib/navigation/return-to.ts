/**
 *
 * 站内返回地址工具。
 * @remarks
 * - `returnTo` 表示精确返回路径，只允许同源站内路径，避免开放重定向。
 * - `from` 表示业务来源，用白名单映射为兜底返回地址。
 *
 */

const INTERNAL_URL_BASE = 'https://dj-web.local'

export type QualityInspectionSource = 'fai' | 'fqc'

/**
 *
 * 规范化业务来源。
 * @param value URL 中的 from 参数或内部传入的来源值
 * @returns 受支持的质量检验来源；不支持时返回 null
 *
 */
export function normalizeQualityInspectionSource(
  value: string | null | undefined,
): QualityInspectionSource | null {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'fai') return 'fai'
  if (normalized === 'fqc') return 'fqc'
  return null
}

/**
 *
 * 将输入解析为正整数。
 * @param value 可能来自 URL 查询参数、表单或单据主键的值
 * @returns 大于 0 的整数；非法值返回 null
 *
 */
function parsePositiveInteger(value: string | number | null | undefined): number | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.floor(n)
}

/**
 *
 * 构建质量检验页面的精确返回地址。
 * @param source 质量检验来源（FAI/FQC）
 * @param billId 可选单据主键；存在时以 id 参数恢复原单据
 * @returns 对应的站内路径；来源不受支持时返回 null
 *
 */
export function buildQualityInspectionReturnTo(
  source: string | null | undefined,
  billId?: string | number | null,
): string | null {
  const normalizedSource = normalizeQualityInspectionSource(source)
  if (!normalizedSource) return null

  const pathname = `/features/erp/quality/${normalizedSource}`
  const id = parsePositiveInteger(billId)
  if (!id) return pathname

  const params = new URLSearchParams({ id: String(id) })
  return `${pathname}?${params.toString()}`
}

/**
 *
 * 构建质量检验页面动作回跳地址。
 * @param source 质量检验来源（FAI/FQC）
 * @param action 回跳后要执行的动作，例如 unapprove
 * @param billId 可选单据主键；存在时以 billId 参数传递给动作处理逻辑
 * @returns 对应的站内路径；来源或动作无效时返回 null
 *
 */
export function buildQualityInspectionActionHref(
  source: string | null | undefined,
  action: string,
  billId?: string | number | null,
): string | null {
  const normalizedSource = normalizeQualityInspectionSource(source)
  const normalizedAction = String(action ?? '').trim()
  if (!normalizedSource || !normalizedAction) return null

  const params = new URLSearchParams({ action: normalizedAction })
  const id = parsePositiveInteger(billId)
  if (id) params.set('billId', String(id))
  return `/features/erp/quality/${normalizedSource}?${params.toString()}`
}

/**
 *
 * 规范化 returnTo 查询参数。
 * @param value URL 中的 returnTo 参数
 * @param currentHref 当前页面路径；若 returnTo 指向自身则丢弃，避免返回死循环
 * @returns 安全的站内路径；非法、跨域或指向自身时返回 null
 *
 */
export function normalizeInternalReturnTo(
  value: string | null | undefined,
  currentHref?: string | null,
): string | null {
  const raw = String(value ?? '').trim()
  if (!raw || raw.startsWith('//') || raw.includes('\\')) return null

  let url: URL
  try {
    url = new URL(raw, INTERNAL_URL_BASE)
  } catch {
    return null
  }

  if (url.origin !== INTERNAL_URL_BASE) return null

  const href = `${url.pathname}${url.search}${url.hash}`
  if (!href.startsWith('/') || href.startsWith('//')) return null

  const current = String(currentHref ?? '').trim()
  if (current && stripHash(href) === stripHash(current)) return null

  return href
}

/**
 *
 * 读取当前浏览器地址并转换为可放入 returnTo 的站内路径。
 * @returns 当前 pathname + search + hash；非浏览器或地址异常时返回 null
 *
 */
export function getCurrentInternalHref(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const { pathname, search, hash } = window.location
    return normalizeInternalReturnTo(`${pathname}${search}${hash}`)
  } catch {
    return null
  }
}

/**
 *
 * 移除 hash 片段后比较路径，避免同页锚点被误认为可返回目标。
 *
 */
function stripHash(href: string): string {
  const index = href.indexOf('#')
  return index >= 0 ? href.slice(0, index) : href
}
