/**
 *
 * 检验类单据的通用工具函数
 * - 可被 FQC/IPQC/PQC 等检验页面复用
 *
 */

/**
 *
 * 将输入解析为非负整数：空串/NaN/负数 → 0
 * @param n 原始输入
 *
 */
export function toNonNegInt(n: number | string | '' | null | undefined): number {
  const x = typeof n === 'number' ? n : Number(n as any)
  if (!Number.isFinite(x) || x <= 0) return 0
  return Math.floor(x)
}

/**
 *
 * 钳制到 [0, max] 区间；未提供上界时仅做下界保护
 * @param n 原始值
 * @param max 上界（可选）
 *
 */
export function clamp0ToMax(n: number, max?: number): number {
  const v = Math.max(0, Number.isFinite(n) ? n : 0)
  if (!Number.isFinite(max as any)) return v
  return Math.min(v, max as number)
}

/**
 *
 * 根据“判定”分支，回填三类数量：合格/不合格/让步
 * - 判定值规范：'1'=合格；'4'=不合格；'2'=让步接收；其它/空 → 三数置0
 * @param qtyInspect 检验数
 * @param judgeValue 判定值：'1' | '4' | '2' | ''
 *
 */
export function computeJudgeQuantitySplit(
  qtyInspect: number,
  judgeValue: string,
): { okQty: number; ngQty: number; allowQty: number } {
  const j = Math.max(0, Number.isFinite(qtyInspect) ? qtyInspect : 0)
  if (judgeValue === '1') return { okQty: j, ngQty: 0, allowQty: 0 }
  if (judgeValue === '4') return { okQty: 0, ngQty: j, allowQty: 0 }
  if (judgeValue === '2') return { okQty: 0, ngQty: 0, allowQty: j }
  return { okQty: 0, ngQty: 0, allowQty: 0 }
}

/**
 *
 * 解析“检验频率”启用的实测项个数
 * - 输入如 '1' | '2' | '3' | '5' 等，非法时返回 0
 *
 */
export function parseMeasureFrequency(text: string | null | undefined): number {
  const n = Number((text ?? '').toString().trim())
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(5, Math.floor(n)))
}
