import { fetchLookup } from '@/lib/erp/lookup-core'

/**
 *
 * 下拉选项的标准结构（用于 GridSelect/Combobox）。
 *
 */
export type SelectOption = {
  label: string
  value: string
  /** 流程卡明细表名，仅返工工序候选需要，用于返工工序切换后刷新来源草稿。 */
  flowDetailTableName?: ReworkFlowDetailTableName
}

/**
 *
 * `fetchLookup` 的最小子集签名（便于测试注入与逻辑复用）。
 *
 */
export type FetchLookupFn = (
  table: string,
  select: string[],
  orderBy?: string,
  opts?: { where?: Record<string, unknown> | string[]; take?: number; skip?: number },
) => Promise<any[]>

export type ReworkFlowDetailTableName = 'ProcessAssemblyFlowDetail' | 'ProduceFlowDetail'

export interface UpstreamFlowCardRef {
  flowDetailTableName: ReworkFlowDetailTableName
  flowDocumentId: number
}

export interface DirectUpstreamFlowCardDetailState {
  /**
   *
   * 当前 NCR 的上游单据是否由流程卡明细直接生成。
   *
   */
  isDirectFlowCardProduct: boolean
  /**
   *
   * 命中的流程卡明细是否挂了特殊单据。
   * @remarks
   * - 当前 Web 红色提示不排除特殊单据工序；
   * - 保留该状态用于诊断首件/末件等特殊工序来源。
   *
   */
  isSpecialFlowCardDetail: boolean
}

const TABLE = {
  assemblyDetail: 'ProcessAssemblyFlowDetail',
  produceDetail: 'ProduceFlowDetail',
  assemblyDoc: 'ProcessAssemblyFlowDocument',
  produceDoc: 'ProduceFlowDocument',
} as const

/**
 *
 * 将“可能是 CLR 全限定名”的 typeName 归一为表名（取最后一段）。
 * @remarks
 * - ERPClient 端 `CreateBy*Type` 通常存的是表名，但为兼容后端/历史数据，这里允许出现全限定名。\\n
 *
 */
export function normalizeErpTableName(typeNameRaw: unknown): string {
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

function resolveWorkTypeNameFromOptions(options: SelectOption[], id?: number): string {
  const n = typeof id === 'number' ? id : Number(id)
  if (!Number.isFinite(n) || n <= 0) return ''
  const key = String(Math.floor(n))
  const hit = (options ?? []).find((o) => String(o.value) === key)
  return String(hit?.label ?? '').trim()
}

function getFetchLookupFn(fetchLookupFn?: FetchLookupFn): FetchLookupFn {
  return fetchLookupFn ?? ((table, select, orderBy, opts) => fetchLookup(table, select, orderBy, opts as any))
}

/**
 *
 * 判断表名是否为“流程卡明细”表。
 * @remarks
 * - 入参允许 CLR 全限定名，会先通过 normalizeErpTableName 归一化；
 * - 当前业务只识别组装流程卡明细与生产流程卡明细，避免误把其它明细链路当作流程卡。
 * @param typeNameRaw 待判断的表名或 CLR 全限定名。
 *
 */
export function isFlowCardDetailTableName(typeNameRaw: unknown): typeNameRaw is ReworkFlowDetailTableName {
  const typeName = normalizeErpTableName(typeNameRaw)
  return typeName === TABLE.assemblyDetail || typeName === TABLE.produceDetail
}

/**
 *
 * 查询流程卡明细是否为“特殊单据工序”。
 * @remarks
 * - 特殊单据工序通过 StepDocumentid + StepDocumentType 标识；
 * - 查询失败或明细不存在时返回 null，由调用方按“未命中流程卡”处理。
 * @param flowDetailTableName 流程卡明细表名（组装/生产）。
 * @param flowDetailId 流程卡明细主键。
 * @param fetcher 通用查询函数。
 *
 */
async function fetchSpecialFlowCardDetailFlag(
  flowDetailTableName: ReworkFlowDetailTableName,
  flowDetailId: number,
  fetcher: FetchLookupFn,
): Promise<boolean | null> {
  if (!flowDetailTableName || flowDetailId <= 0) return null

  try {
    const rows = await fetcher(
      flowDetailTableName,
      ['id', 'StepDocumentid', 'StepDocumentType'],
      undefined,
      { where: { DeletedTag: 0, id: flowDetailId }, take: 1 },
    )
    const row = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any) : null
    const id = normalizePositiveInt(row?.id ?? row?.Id ?? row?.ID)
    if (!id) return null

    const stepDocumentId = normalizePositiveInt(row?.StepDocumentid ?? row?.stepDocumentid)
    const stepDocumentType = String(row?.StepDocumentType ?? row?.stepDocumentType ?? '').trim()
    return Boolean(stepDocumentId && stepDocumentType)
  } catch {
    return null
  }
}

/**
 *
 * 解析 NCR 当前上游单据是否为“流程卡明细的直接产物”。
 * @remarks
 * - 优先识别 NCR 草稿/单据头自身的 CreateByDetail*，这是后端草稿接口直接回填的来源流程卡明细；
 * - 其次兼容 NCR.CreateByDocument* -> 上游单据 -> 上游单据.CreateByDetail*；
 * - 不沿祖先链继续追溯，避免把间接来源误判为当前直接来源。
 * @param doc NCR 单据头或兼容 DocumentBase 的对象。
 * @param fetchLookupFn 可选查询函数，测试中可注入。
 *
 */
export async function resolveDirectUpstreamFlowCardDetailState(
  doc: any,
  fetchLookupFn?: FetchLookupFn,
): Promise<DirectUpstreamFlowCardDetailState> {
  const fetcher = getFetchLookupFn(fetchLookupFn)
  const empty: DirectUpstreamFlowCardDetailState = {
    isDirectFlowCardProduct: false,
    isSpecialFlowCardDetail: false,
  }

  const directFlowDetailTableName = normalizeErpTableName(doc?.CreateByDetailType ?? doc?.createByDetailType)
  const directFlowDetailId = normalizePositiveInt(doc?.CreateByDetailid ?? doc?.createByDetailid)
  if (isFlowCardDetailTableName(directFlowDetailTableName) && directFlowDetailId) {
    const isSpecial = await fetchSpecialFlowCardDetailFlag(directFlowDetailTableName, directFlowDetailId, fetcher)
    return {
      isDirectFlowCardProduct: true,
      isSpecialFlowCardDetail: Boolean(isSpecial),
    }
  }

  const upstreamDocumentTableName = normalizeErpTableName(doc?.CreateByDocumentType ?? doc?.createByDocumentType)
  const upstreamDocumentId = normalizePositiveInt(doc?.CreateByDocumentid ?? doc?.createByDocumentid)
  if (!upstreamDocumentTableName || !upstreamDocumentId) return empty

  try {
    const rows = await fetcher(
      upstreamDocumentTableName,
      ['id', 'CreateByDetailType', 'CreateByDetailid'],
      undefined,
      { where: { DeletedTag: 0, id: upstreamDocumentId }, take: 1 },
    )
    const upstream = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any) : null
    const upstreamId = normalizePositiveInt(upstream?.id ?? upstream?.Id ?? upstream?.ID)
    if (!upstreamId) return empty

    const flowDetailTableName = normalizeErpTableName(upstream?.CreateByDetailType ?? upstream?.createByDetailType)
    const flowDetailId = normalizePositiveInt(upstream?.CreateByDetailid ?? upstream?.createByDetailid)
    if (!isFlowCardDetailTableName(flowDetailTableName) || !flowDetailId) return empty

    const isSpecial = await fetchSpecialFlowCardDetailFlag(flowDetailTableName, flowDetailId, fetcher)
    if (isSpecial == null) return empty

    return {
      isDirectFlowCardProduct: true,
      isSpecialFlowCardDetail: isSpecial,
    }
  } catch {
    return empty
  }
}

/**
 *
 * 判断“返工工序”标签是否应显示为红色提示。
 * @remarks
 * - 对齐当前 Web 需求：当前 NCR 单据直接关联流程卡明细时显示红色；
 * - 首件/末件等特殊单据工序也属于流程卡直接产物，不再按特殊单据排除；
 * - 若只需要展示“是否直接来自流程卡”，请使用 resolveDirectUpstreamFlowCardDetailState。
 * @param doc NCR 单据头或兼容 DocumentBase 的对象。
 * @param fetchLookupFn 可选查询函数，测试中可注入。
 *
 */
export async function shouldRequireReworkFlowDetailFromDirectUpstream(
  doc: any,
  fetchLookupFn?: FetchLookupFn,
): Promise<boolean> {
  const state = await resolveDirectUpstreamFlowCardDetailState(doc, fetchLookupFn)
  return state.isDirectFlowCardProduct
}

/**
 *
 * 解析“命中的上游祖先流程卡”（组装/生产）：
 * - 优先 CreateByDetail*（明细级：需回查 ParentTypeid）
 * - 其次 CreateByDocument*（单据级：直接拿 id 作为流程卡主键）
 * - 若当前单据未直连，则沿 CreateByDocument* 向上追溯，直到命中流程卡或达到深度上限。
 *
 */
export async function resolveUpstreamFlowCardFromDocumentBase(
  doc: any,
  fetchLookupFn?: FetchLookupFn,
): Promise<UpstreamFlowCardRef | null> {
  const fetcher = getFetchLookupFn(fetchLookupFn)

  const tryResolveFlowCard = async (
    typeNameRaw: unknown,
    idRaw: unknown,
  ): Promise<UpstreamFlowCardRef | null> => {
    const typeName = normalizeErpTableName(typeNameRaw)
    const id = normalizePositiveInt(idRaw)
    if (!typeName || !id) return null

    if (typeName === TABLE.assemblyDetail || typeName === TABLE.produceDetail) {
      try {
        const detailTableName = typeName === TABLE.assemblyDetail ? TABLE.assemblyDetail : TABLE.produceDetail
        const rows = await fetcher(
          detailTableName,
          ['id', 'ParentTypeid'],
          undefined,
          { where: { DeletedTag: 0, id }, take: 1 },
        )
        const row = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any) : null
        const parentId = normalizePositiveInt(row?.ParentTypeid ?? row?.parentTypeid)
        if (!parentId) return null
        return { flowDetailTableName: detailTableName, flowDocumentId: parentId }
      } catch {
        return null
      }
    }

    if (typeName === TABLE.assemblyDoc) return { flowDetailTableName: TABLE.assemblyDetail, flowDocumentId: id }
    if (typeName === TABLE.produceDoc) return { flowDetailTableName: TABLE.produceDetail, flowDocumentId: id }
    return null
  }

  const tryResolveFromDoc = async (d: any): Promise<UpstreamFlowCardRef | null> => {
    const byDetail = await tryResolveFlowCard(d?.CreateByDetailType ?? d?.createByDetailType, d?.CreateByDetailid ?? d?.createByDetailid)
    if (byDetail) return byDetail
    return await tryResolveFlowCard(d?.CreateByDocumentType ?? d?.createByDocumentType, d?.CreateByDocumentid ?? d?.createByDocumentid)
  }

  const direct = await tryResolveFromDoc(doc)
  if (direct) return direct

  const visited = new Set<string>()
  let currentType = normalizeErpTableName(doc?.CreateByDocumentType ?? doc?.createByDocumentType)
  let currentId = normalizePositiveInt(doc?.CreateByDocumentid ?? doc?.createByDocumentid)
  let depth = 0

  while (depth++ < 12 && currentType && currentId) {
    const key = `${currentType}:${currentId}`
    if (visited.has(key)) break
    visited.add(key)

    try {
      const rows = await fetcher(
        currentType,
        ['id', 'CreateByDetailType', 'CreateByDetailid', 'CreateByDocumentType', 'CreateByDocumentid'],
        undefined,
        { where: { DeletedTag: 0, id: currentId }, take: 1 },
      )
      const upstream = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any) : null
      if (!upstream) break

      const hit = await tryResolveFromDoc(upstream)
      if (hit) return hit

      currentType = normalizeErpTableName(upstream?.CreateByDocumentType ?? upstream?.createByDocumentType)
      currentId = normalizePositiveInt(upstream?.CreateByDocumentid ?? upstream?.createByDocumentid)
    } catch {
      break
    }
  }

  return null
}

/**
 *
 * 从“上游祖先流程卡明细”中提取流程卡明细 id（用于 NCR 自动带入返工工序）。
 * @remarks
 * - 仅返回 `CreateByDetailType` 指向流程卡明细时的 id；不会返回流程卡单据 id。\\n
 *
 */
export async function resolveUpstreamFlowDetailIdFromDocumentBase(
  doc: any,
  fetchLookupFn?: FetchLookupFn,
): Promise<number | null> {
  const fetcher = getFetchLookupFn(fetchLookupFn)

  const tryGetFlowDetailId = (typeNameRaw: unknown, idRaw: unknown): number | null => {
    const typeName = normalizeErpTableName(typeNameRaw)
    const id = normalizePositiveInt(idRaw)
    if (!typeName || !id) return null
    if (typeName === TABLE.assemblyDetail || typeName === TABLE.produceDetail) return id
    return null
  }

  const direct = tryGetFlowDetailId(doc?.CreateByDetailType ?? doc?.createByDetailType, doc?.CreateByDetailid ?? doc?.createByDetailid)
  if (direct) return direct

  const visited = new Set<string>()
  let currentType = normalizeErpTableName(doc?.CreateByDocumentType ?? doc?.createByDocumentType)
  let currentId = normalizePositiveInt(doc?.CreateByDocumentid ?? doc?.createByDocumentid)
  let depth = 0

  while (depth++ < 12 && currentType && currentId) {
    const key = `${currentType}:${currentId}`
    if (visited.has(key)) break
    visited.add(key)

    try {
      const rows = await fetcher(
        currentType,
        ['id', 'CreateByDetailType', 'CreateByDetailid', 'CreateByDocumentType', 'CreateByDocumentid'],
        undefined,
        { where: { DeletedTag: 0, id: currentId }, take: 1 },
      )
      const upstream = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any) : null
      if (!upstream) break

      const hit = tryGetFlowDetailId(upstream?.CreateByDetailType ?? upstream?.createByDetailType, upstream?.CreateByDetailid ?? upstream?.createByDetailid)
      if (hit) return hit

      currentType = normalizeErpTableName(upstream?.CreateByDocumentType ?? upstream?.createByDocumentType)
      currentId = normalizePositiveInt(upstream?.CreateByDocumentid ?? upstream?.createByDocumentid)
    } catch {
      break
    }
  }

  return null
}

async function fetchFlowDetailRowById(
  flowDetailId: number,
  fetcher: FetchLookupFn,
): Promise<{ row: any; flowDetailTableName: ReworkFlowDetailTableName } | null> {
  if (flowDetailId <= 0) return null

  try {
    const assemblyRows = await fetcher(
      TABLE.assemblyDetail,
      ['id', 'TypeofWorkid', 'LocationIndex', 'ParentTypeid'],
      undefined,
      { where: { DeletedTag: 0, id: flowDetailId }, take: 1 },
    )
    const assembly = Array.isArray(assemblyRows) && assemblyRows.length > 0 ? (assemblyRows[0] as any) : null
    if (assembly) return { row: assembly, flowDetailTableName: TABLE.assemblyDetail }
  } catch { }

  try {
    const produceRows = await fetcher(
      TABLE.produceDetail,
      ['id', 'TypeofWorkid', 'LocationIndex', 'ParentTypeid'],
      undefined,
      { where: { DeletedTag: 0, id: flowDetailId }, take: 1 },
    )
    const produce = Array.isArray(produceRows) && produceRows.length > 0 ? (produceRows[0] as any) : null
    if (produce) return { row: produce, flowDetailTableName: TABLE.produceDetail }
  } catch { }

  return null
}

function toReworkOption(
  row: any,
  workTypeOptions: SelectOption[],
  flowDetailTableName: ReworkFlowDetailTableName,
): SelectOption | null {
  const id = normalizePositiveInt(row?.id ?? row?.Id ?? row?.ID)
  if (!id) return null

  const typeofWorkId = normalizePositiveInt(row?.TypeofWorkid ?? row?.typeofWorkid) ?? undefined

  const nameFromWorkType = resolveWorkTypeNameFromOptions(workTypeOptions, typeofWorkId)
  const name = nameFromWorkType || (typeofWorkId ? `工序ID=${typeofWorkId}` : '未设置工序')
  return { label: name, value: String(id), flowDetailTableName }
}

/**
 *
 * 获取 NCR “返工工序/返工工序2” 下拉候选列表（对齐 ERPClient）。\n
 * @remarks
 * - 候选范围：命中的“上游祖先流程卡”的全部明细工序（按 LocationIndex、id 排序）。\\n
 * - 兼容回显：若当前单据已选的明细 id 不在候选中，会尝试按 id 回查并插入到列表顶部。\\n
 *
 */
export async function fetchReworkFlowDetailOptionsFromUpstreamFlowCard(
  input: {
    documentBase: any
    workTypeOptions: SelectOption[]
    selectedFlowDetailIds?: Array<number | null | undefined>
  },
  fetchLookupFn?: FetchLookupFn,
): Promise<SelectOption[]> {
  const fetcher = getFetchLookupFn(fetchLookupFn)
  const selectedIds = Array.isArray(input?.selectedFlowDetailIds) ? input.selectedFlowDetailIds : []

  let options: SelectOption[] = []

  const resolved = await resolveUpstreamFlowCardFromDocumentBase(input?.documentBase, fetcher)
  if (resolved) {
    const rows = await fetcher(
      resolved.flowDetailTableName,
      ['id', 'TypeofWorkid', 'LocationIndex', 'ParentTypeid'],
      'LocationIndex asc, id asc',
      { where: { DeletedTag: 0, ParentTypeid: resolved.flowDocumentId } },
    )
    const mapped = (Array.isArray(rows) ? rows : [])
      .map((r) => toReworkOption(r, input.workTypeOptions, resolved.flowDetailTableName))
      .filter(Boolean) as SelectOption[]
    options = mapped
  }

  // 与 ERPClient 对齐：已选值不在候选时，也要能回显（插到最上面）。
  const existing = new Set((options ?? []).map((o) => String(o.value)))
  for (const idRaw of selectedIds) {
    const id = normalizePositiveInt(idRaw)
    if (!id) continue
    const key = String(id)
    if (existing.has(key)) continue

    const hit = await fetchFlowDetailRowById(id, fetcher)
    const opt = hit ? toReworkOption(hit.row, input.workTypeOptions, hit.flowDetailTableName) : null
    if (!opt) continue
    options = [opt, ...options]
    existing.add(key)
  }

  return options
}
