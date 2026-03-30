/**
 *
 * 通用联查核心工具。
 * - 约定统一通过 General API: getItemsEx(table, select, orderBy, where)
 * - 优先走 `GeneralApi.GetItemsEx`（通过 BillApiClient + API_BASE 统一转发/直连）
 * 注意：客户端函数必须异步，避免 Next.js 15 同步动态 API 限制。
 *
 */

import { DEFAULT_DB_NAME } from '@/lib/config'
import { GetItemsEx } from './general-api'

export interface GetItemsExInput {
  dbName?: string;
  table: string;
  select: string[];
  orderBy?: string;
  where?: Record<string, unknown>;
  take?: number;
  skip?: number;
}

export type GetItemsExFn = (
  input: GetItemsExInput,
  signal?: AbortSignal
) => Promise<any[]>;

let cachedGetItemsEx: GetItemsExFn | null = null;

/**
 *
 * 解析并返回可用的 getItemsEx 方法。
 * 优先动态导入项目内的通用实现；失败时回退到 /api/general/get-items-ex。
 *
 */
export async function getItemsExSafe(): Promise<GetItemsExFn> {
  if (cachedGetItemsEx) return cachedGetItemsEx;

  cachedGetItemsEx = async (input: GetItemsExInput, signal?: AbortSignal) => {
    void signal
    try {
      const dbNameRaw = (input as any)?.dbName
      const dbName = typeof dbNameRaw === 'string' && dbNameRaw.trim() ? dbNameRaw.trim() : DEFAULT_DB_NAME
      const tableName = input?.table ?? ''
      const select = Array.isArray(input?.select) ? input.select.join(',') : undefined
      const order = input?.orderBy

      // 构造 where 数组（字符串），支持简单等值与 IN 列表
      const whereInput = (input as any)?.where as Record<string, unknown> | string[] | undefined
      const where: string[] | undefined = Array.isArray(whereInput)
        ? (whereInput as string[])
        : whereInput && typeof whereInput === 'object'
        ? Object.entries(whereInput).map(([k, v]) => {
            const esc = (s: string) => s.replaceAll("'", "''")
            if (Array.isArray(v)) {
              const vals = v.map((x) => (typeof x === 'number' ? String(x) : `'${esc(String(x))}'`)).join(',')
              return `${k} IN (${vals})`
            }
            if (typeof v === 'boolean') return `${k} = ${v ? 1 : 0}`
            if (typeof v === 'number') return `${k} = ${v}`
            return `${k} = '${esc(String(v))}'`
          })
        : undefined

      // take/skip → pageNumber/pageSize（近似映射）
      const take = typeof input?.take === 'number' ? input.take : undefined
      const skip = typeof input?.skip === 'number' ? input.skip : 0
      const pageSize = take && take > 0 ? take : undefined
      const pageNumber = pageSize ? Math.floor((skip || 0) / pageSize) + 1 : undefined

      const pack = await GetItemsEx<any[]>(dbName, {
        tableName,
        select,
        order,
        where,
        pageNumber,
        pageSize,
      })
      const data = (pack as any)?.data
      return Array.isArray(data) ? data : []
    } catch {
      return [];
    }
  };

  return cachedGetItemsEx;
}

/**
 *
 * 通用联查：按表和字段获取数据列表。
 * @param table 表名，如 'Material'、'Department'
 * @param select 选取字段列表，如 ['id','Code','Name']
 * @param orderBy 排序表达式，如 'Name asc, Code asc'
 * @param signal 取消信号
 *
 */
export async function fetchLookup(
  table: string,
  select: string[],
  orderBy?: string,
  optsOrSignal?: { where?: Record<string, unknown> | string[]; take?: number; skip?: number } | AbortSignal,
  maybeSignal?: AbortSignal
): Promise<any[]> {
  const getter = await getItemsExSafe();
  let signal: AbortSignal | undefined;
  let opts: { where?: Record<string, unknown> | string[]; take?: number; skip?: number } | undefined;
  if (optsOrSignal && typeof optsOrSignal === 'object' && 'aborted' in (optsOrSignal as any)) {
    signal = optsOrSignal as AbortSignal;
  } else {
    opts = optsOrSignal as any;
    signal = maybeSignal;
  }
  return getter(
    {
      table,
      select,
      orderBy,
      where: opts?.where as any,
      take: opts?.take,
      skip: opts?.skip,
    },
    signal
  );
}

/**
 *
 * 将通用列表映射为下拉选项。
 * 自动识别 Name/Code 字段，优先 Name，其次 Code；
 * 当两者皆无时，尝试 Title/Label；均不存在则使用 id 的字符串形式。
 * @param items 原始记录数组
 *
 */
export function toOptions<T extends Record<string, any>>(
  items: T[]
): Array<{ label: string; value: string | number; raw: T }> {
  return (items ?? []).map((row) => {
    const id = (row?.id ?? row?.Id ?? row?.ID) as string | number | undefined;
    const name = row?.Name ?? row?.name ?? row?.Title ?? row?.Label;
    const code = row?.Code ?? row?.code;
    const label = (name ?? code ?? String(id ?? '')) as string;
    return { label, value: id ?? label, raw: row };
  });
}
