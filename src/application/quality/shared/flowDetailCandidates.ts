import { fetchLookup } from '@/lib/erp/lookup-core'
import type { TableRecordLike } from '@/lib/erp/flow-scan-api'

/**
 *
 * 日计划扫码（RJH-*）在"多条当前工序明细"场景下的候选项结构。
 * @remarks
 * - NCR/首件检验/末件检验共享同一结构，便于复用 UI 与选择逻辑。
 *
 */
export type FlowDetailCandidate = {
  /** 工序明细表名（如 ProcessAssemblyFlowDetail / ProduceFlowDetail） */
  readonly flowDetailTableName: string
  /** 工序明细主键 */
  readonly flowDetailId: number
  /** 可选：工种 ID（用于 UI 侧展示标签） */
  readonly typeofWorkId?: number
  /** 可选：LocationIndex（用于 UI 排序/展示） */
  readonly locationIndex?: number
  /** 可选：计划数（BQty） */
  readonly bQty?: number
  /** 可选：工种内容（TypeofWork.Content） */
  readonly typeofWorkContent?: string
}

/**
 *
 * 将"可能是 CLR 全限定名"的表名归一为表名（取最后一段）。
 *
 */
function normalizeErpTableName(typeNameRaw: unknown): string {
  const raw = String(typeNameRaw ?? '').trim()
  if (!raw) return ''
  const idx = raw.lastIndexOf('.')
  return idx >= 0 ? raw.slice(idx + 1) : raw
}

function normalizePositiveInt(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.floor(n)
}

function normalizeNonNegativeInt(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.floor(n)
}

function normalizeDecimal(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return undefined
  return n
}

/**
 *
 * FlowScanApi.CheckDocumentState 返回的单据候选项结构（前端解析后）。
 *
 */
export type FlowScanDocumentCandidate = {
  readonly tableName: string
  readonly id: number
  /**
   *
   * @remarks
   * - 单据状态数值（数字）；未审批=0；
   * - 兼容 status 字段缺失的旧后端/缓存场景。
   *
   */
  readonly status?: number
}

function isUnapprovedDocumentStatus(status: number): boolean {
  return status === 0
}

/**
 *
 * 解析 TableRecord 列表为 {tableName,id} 数组。
 * - 兼容 PascalCase/camelCase 字段名
 *
 */
export function parseTableRecords(list: TableRecordLike[]): Array<{ tableName: string; id: number }> {
  const items = Array.isArray(list) ? list : []
  const result: Array<{ tableName: string; id: number }> = []
  for (const it of items) {
    const tableName = normalizeErpTableName((it as any)?.TableName ?? (it as any)?.tableName)
    const idRaw = (it as any)?.id ?? (it as any)?.Id ?? (it as any)?.ID
    const id = normalizePositiveInt(idRaw)
    if (!tableName || !id) continue
    result.push({ tableName, id })
  }
  return result
}

/**
 *
 * 从 FlowScanApi.CheckDocumentState 的响应 data 中提取"当前工序明细"列表。
 * @remarks
 * - 仅依赖 Items/items[*].FlowDetail/flowDetail，避免读取 CurrentFlowDetails。
 * - 仅返回 Matched/matched=true 的项（由调用方通过 documentKind/state 约束"可用工序"）。
 *
 */
export function parseFlowDetailsFromCheckDocumentStateData(
  data: unknown,
): Array<{ tableName: string; id: number }> {
  const rawItems = ((data as any)?.Items ?? (data as any)?.items ?? []) as any[]
  if (!Array.isArray(rawItems) || rawItems.length === 0) return []

  const flowDetails = rawItems
    .filter((it) => Boolean((it as any)?.Matched ?? (it as any)?.matched))
    .map((it) => (it as any)?.FlowDetail ?? (it as any)?.flowDetail)
    .filter(Boolean) as TableRecordLike[]

  const parsed = parseTableRecords(flowDetails)
  const seen = new Set<string>()
  const result: Array<{ tableName: string; id: number }> = []
  for (const it of parsed) {
    const key = it.tableName + ':' + it.id
    if (seen.has(key)) continue
    seen.add(key)
    result.push(it)
  }
  return result
}

/**
 *
 * 从 FlowScanApi.CheckDocumentState 的响应 data 中，提取指定工序明细对应的单据列表（Documents/documents）。
 * @remarks
 * - 兼容 PascalCase/camelCase 字段名；
 * - 若未找到对应的 item 或无单据，则返回空数组。
 *
 */
export function parseDocumentsFromCheckDocumentStateData(
  data: unknown,
  flowDetailTableName: string,
  flowDetailId: number,
): FlowScanDocumentCandidate[] {
  const tableName = normalizeErpTableName(flowDetailTableName)
  const id = normalizePositiveInt(flowDetailId)
  if (!tableName || !id) return []

  const rawItems = ((data as any)?.Items ?? (data as any)?.items ?? []) as any[]
  if (!Array.isArray(rawItems) || rawItems.length === 0) return []

  const key = tableName + ':' + id
  for (const it of rawItems) {
    const rawFlowDetail = (it as any)?.FlowDetail ?? (it as any)?.flowDetail
    if (!rawFlowDetail) continue

    const parsedFlowDetail = parseTableRecords([rawFlowDetail as TableRecordLike])
    if (parsedFlowDetail.length === 0) continue

    const only = parsedFlowDetail[0]
    if (only.tableName + ':' + only.id !== key) continue

    const rawDocs = ((it as any)?.Documents ?? (it as any)?.documents ?? []) as any[]
    if (!Array.isArray(rawDocs) || rawDocs.length === 0) return []

    const seen = new Set<string>()
    const result: FlowScanDocumentCandidate[] = []
    for (const rawDoc of rawDocs) {
      const docTableName = normalizeErpTableName((rawDoc as any)?.TableName ?? (rawDoc as any)?.tableName)
      const docIdRaw = (rawDoc as any)?.id ?? (rawDoc as any)?.Id ?? (rawDoc as any)?.ID
      const docId = normalizePositiveInt(docIdRaw)
      if (!docTableName || !docId) continue

      const statusRaw = (rawDoc as any)?.Status ?? (rawDoc as any)?.status
      const statusParsed = normalizeNonNegativeInt(statusRaw)

      const docKey = docTableName + ':' + docId
      if (seen.has(docKey)) continue
      seen.add(docKey)
      if (statusParsed === null) {
        result.push({ tableName: docTableName, id: docId })
      } else {
        result.push({ tableName: docTableName, id: docId, status: statusParsed })
      }
    }
    return result
  }

  return []
}

/**
 *
 * 从 documents 列表中选择"优先打开"的单据 id。
 * @remarks
 * - 若存在"未审批"（status===0）的单据，则优先选择（取 id 最大者）。
 * - 否则回退到"取 id 最大者"的旧逻辑。
 *
 */
export function pickPreferredDocumentId(documents: FlowScanDocumentCandidate[]): number {
  const docs = Array.isArray(documents) ? documents : []
  if (docs.length === 0) return 0

  const unapproved = docs.filter((t) => {
    if (typeof t.status !== 'number') return false
    return isUnapprovedDocumentStatus(t.status)
  })
  const target = unapproved.length > 0 ? unapproved : docs
  return target.reduce((acc, it) => (it.id > acc ? it.id : acc), 0)
}

/**
 *
 * 多条"当前工序明细"场景：在所有候选明细中扫描并选择"未审批"的目标单据。
 * @remarks
 * - 仅当 Documents 中存在 status（或 Status）字段时才可判定"未审批"；缺失时不会误判为未审批。
 * - 仅匹配目标单据类型（	ableName === targetDocumentTableName），避免打开其他业务单据。
 * - 当存在多张未审批目标单据时，取 id 最大者（视为"最新"）。
 *
 */
export function pickUnapprovedDocumentIdAcrossFlowDetails(
  data: unknown,
  flowDetails: Array<{ tableName: string; id: number }>,
  targetDocumentTableName: string,
): number {
  const targetTable = normalizeErpTableName(targetDocumentTableName)
  if (!targetTable) return 0

  const list = Array.isArray(flowDetails) ? flowDetails : []
  let bestId = 0
  for (const flowDetail of list) {
    const docs = parseDocumentsFromCheckDocumentStateData(data, flowDetail.tableName, flowDetail.id)
    for (const doc of docs) {
      if (normalizeErpTableName(doc.tableName) !== targetTable) continue
      if (typeof doc.status !== 'number') continue
      if (!isUnapprovedDocumentStatus(doc.status)) continue
      if (doc.id > bestId) bestId = doc.id
    }
  }
  return bestId
}

/**
 *
 * 将 {tableName,id} 列表补齐为可展示的 FlowDetailCandidate。
 * - 读取工序明细表的 TypeofWorkid/LocationIndex/BQty 供 UI 展示
 * - 批量查询工种表的 Content 补充工种内容
 * - 按 LocationIndex -> id 排序，保证候选项顺序稳定
 *
 */
export async function enrichFlowDetailCandidates(
  list: Array<{ tableName: string; id: number }>,
): Promise<FlowDetailCandidate[]> {
  // 第一步：并发查询每条工序明细的基础信息
  const enriched = await Promise.all(
    list.map(async (it): Promise<FlowDetailCandidate> => {
      try {
        const rows = await fetchLookup(
          it.tableName,
          ['id', 'TypeofWorkid', 'LocationIndex', 'BQty'],
          undefined,
          { where: { DeletedTag: 0, id: it.id }, take: 1 },
        )
        const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
        const typeofWorkId = normalizePositiveInt((row as any)?.TypeofWorkid ?? (row as any)?.typeofWorkid)
        const locRaw = (row as any)?.LocationIndex ?? (row as any)?.locationIndex
        const locationIndex = Number.isFinite(Number(locRaw)) ? Number(locRaw) : undefined
        const bQty = normalizeDecimal((row as any)?.BQty ?? (row as any)?.bQty)
        return {
          flowDetailTableName: it.tableName,
          flowDetailId: it.id,
          typeofWorkId: typeofWorkId || undefined,
          locationIndex,
          bQty,
        }
      } catch {
        return { flowDetailTableName: it.tableName, flowDetailId: it.id }
      }
    }),
  )

  // 第二步：收集所有工种 ID，批量查询工种 Content
  const workTypeIds = Array.from(
    new Set(
      enriched
        .map((c) => c.typeofWorkId)
        .filter((id): id is number => typeof id === 'number' && id > 0),
    ),
  )

  let contentMap: Map<number, string> = new Map()
  if (workTypeIds.length > 0) {
    try {
      const workTypeRows = await fetchLookup(
        'TypeofWork',
        ['id', 'Content'],
        undefined,
        { where: { DeletedTag: 0, id: workTypeIds } },
      )
      if (Array.isArray(workTypeRows)) {
        for (const row of workTypeRows) {
          const id = normalizePositiveInt((row as any)?.id)
          const content = String((row as any)?.Content ?? (row as any)?.content ?? '').trim()
          if (id && content) {
            contentMap.set(id, content)
          }
        }
      }
    } catch {
      // 工种查询失败时降级为空
    }
  }

  // 第三步：合并工种内容到候选项
  const result = enriched.map((c) => {
    const typeofWorkContent = c.typeofWorkId ? contentMap.get(c.typeofWorkId) : undefined
    return { ...c, typeofWorkContent }
  })

  // 排序
  return result.sort((a, b) => {
    const aLoc = typeof a.locationIndex === 'number' ? a.locationIndex : Number.MAX_SAFE_INTEGER
    const bLoc = typeof b.locationIndex === 'number' ? b.locationIndex : Number.MAX_SAFE_INTEGER
    if (aLoc !== bLoc) return aLoc - bLoc
    return a.flowDetailId - b.flowDetailId
  })
}
