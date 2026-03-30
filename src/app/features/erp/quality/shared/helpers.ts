/**
 *
 * 质量域通用工具函数（FQC/IPQC 等页面共享）。
 * - 本模块仅包含与视图/状态解析相关的纯函数与本地存储访问工具。
 * - 避免在各页面重复实现，降低维护成本与行为偏差风险。
 *
 */

import { DocumentStatus } from '@/types/erp-db.generated'
import type { UserInfo } from '@/lib/erp/bill-api'

/**
 *
 * 从本地存储读取 ERP 用户信息。
 * - 优先读取键 'erp:userInfo'，其次兼容 'userInfo'。
 * - 仅在浏览器环境访问 localStorage；SSR 或异常时返回空对象。
 * - 解析失败或无值时返回空对象，避免接口参数为 undefined。
 *
 */
export function getErpUserFromStorage(): UserInfo {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem('erp:userInfo') ?? window.localStorage.getItem('userInfo')
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as UserInfo) : {}
  } catch {
    return {}
  }
}

/**
 *
 * 写入最近一次 FQC 审批单据ID（localStorage）。
 * @param billId >0 的单据主键
 *
 */
export function setLastFqcBillIdToStorage(billId: number): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem('fqc:last-bill-id', String(billId)) } catch {}
}

/**
 *
 * 读取最近一次 FQC 审批单据ID（localStorage）。
 * - 不存在或非法时返回 0
 *
 */
export function getLastFqcBillIdFromStorage(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem('fqc:last-bill-id')
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

/**
 *
 * 清除最近一次 FQC 审批单据ID（localStorage）。
 *
 */
export function clearLastFqcBillIdInStorage(): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem('fqc:last-bill-id') } catch {}
}

/**
 *
 * 写入最近一次 FAI 审批单据ID（localStorage）。
 * @param billId >0 的单据主键
 *
 */
export function setLastFaiBillIdToStorage(billId: number): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem('fai:last-bill-id', String(billId)) } catch {}
}

/**
 *
 * 读取最近一次 FAI 审批单据ID（localStorage）。
 * - 不存在或非法时返回 0
 *
 */
export function getLastFaiBillIdFromStorage(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem('fai:last-bill-id')
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

/**
 *
 * 清除最近一次 FAI 审批单据ID（localStorage）。
 *
 */
export function clearLastFaiBillIdInStorage(): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem('fai:last-bill-id') } catch {}
}

/**
 *
 * 文档状态位检查：status 是否包含 flag。
 * - 兼容“等于某状态或按位包含该状态位”的判断
 *
 */
export function hasStatusFlag(status: number, flag: number): boolean {
  return status === flag || (status & flag) !== 0
}

/**
 *
 * 将后端或视图层的“状态输入”解析为数值型枚举值。
 * - 支持 number 直接返回
 * - 支持 '0' | '1' 这类数字字符串
 * - 支持中文状态名（未审批/已审批/...）
 *
 */
export function parseDocumentStatus(input: unknown): number {
  // 数字：0 视作“未审批”（后端若未填充状态时通常返回 0）
  if (typeof input === 'number' && Number.isFinite(input)) {
    return input === 0 ? DocumentStatus.未审批 : input
  }
  // 纯数字字符串：同样将 0 视作“未审批”
  if (typeof input === 'string' && /^-?\d+$/.test(input.trim())) {
    const n = Number(input.trim())
    if (Number.isFinite(n)) return n === 0 ? DocumentStatus.未审批 : n
  }
  if (typeof input === 'string') {
    const s = input.trim()
    const dict: Record<string, number> = {
      未审批: DocumentStatus.未审批,
      已审批: DocumentStatus.已审批,
      已冻结: DocumentStatus.已冻结,
      已结案: DocumentStatus.已结案,
      已作废: DocumentStatus.已作废,
      审批中: DocumentStatus.审批中,
      已中止: DocumentStatus.已中止,
      被驳回: DocumentStatus.被驳回,
      已确认: DocumentStatus.已确认,
      变更中: DocumentStatus.变更中,
    }
    if (s in dict) return dict[s]
  }
  // 其他情况默认未审批
  return DocumentStatus.未审批
}

/**
 *
 * 将状态值转换为中文文本（支持位标记拼接）。
 * - 若为“未审批”，直接返回该文本
 * - 其余状态收集命中的位标记并用 '/' 连接
 *
 */
export function documentStatusToText(status: number): string {
  const map: Record<number, string> = {
    [DocumentStatus.未审批]: '未审批',
    [DocumentStatus.已审批]: '已审批',
    [DocumentStatus.已冻结]: '已冻结',
    [DocumentStatus.已结案]: '已结案',
    [DocumentStatus.已作废]: '已作废',
    [DocumentStatus.审批中]: '审批中',
    [DocumentStatus.已中止]: '已中止',
    [DocumentStatus.被驳回]: '被驳回',
    [DocumentStatus.已确认]: '已确认',
    [DocumentStatus.变更中]: '变更中',
  }
  // 兼容后端返回 0 的场景：按“未审批”展示
  if (status === 0) return map[DocumentStatus.未审批]
  if (hasStatusFlag(status, DocumentStatus.未审批)) return map[DocumentStatus.未审批]
  const flags = [
    DocumentStatus.已审批,
    DocumentStatus.已冻结,
    DocumentStatus.已结案,
    DocumentStatus.已作废,
    DocumentStatus.审批中,
    DocumentStatus.已中止,
    DocumentStatus.被驳回,
    DocumentStatus.已确认,
    DocumentStatus.变更中,
  ]
  const parts: string[] = []
  for (const f of flags) if (hasStatusFlag(status, f)) parts.push(map[f])
  return parts.length ? parts.join('/') : `未知(${String(status)})`
}
