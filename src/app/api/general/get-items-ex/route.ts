
import { NextRequest, NextResponse } from 'next/server'
import { GetItemsEx } from '@/lib/erp/general-api'
import { DEFAULT_DB_NAME } from '@/lib/config'

/**
 *
 * 代理：GeneralApi.GetItemsEx
 * - 目的：避免浏览器直连后端引发 CORS，统一经由本地路由转发
 * - 输入：{ table: string, select: string[], orderBy?: string }
 * - 输出：数组数据（若失败返回空数组）
 *
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      dbName?: string
      table: string
      select?: string[]
      orderBy?: string
      where?: unknown
      take?: number
      skip?: number
    }
    const dbNameRaw = body?.dbName
    const dbName = typeof dbNameRaw === 'string' && dbNameRaw.trim() ? dbNameRaw.trim() : DEFAULT_DB_NAME
    const tableName = body?.table ?? ''
    const select = Array.isArray(body?.select) ? body.select.join(',') : undefined
    const order = body?.orderBy

    // 构造 where 数组（字符串），支持简单等值与 IN 列表
    const whereInput = body?.where as Record<string, unknown> | string[] | undefined
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
    const take = typeof body?.take === 'number' ? body.take : undefined
    const skip = typeof body?.skip === 'number' ? body.skip : 0
    const pageSize = take && take > 0 ? take : undefined
    const pageNumber = pageSize ? Math.floor((skip || 0) / pageSize) + 1 : undefined

    const pack = await GetItemsEx(dbName, {
      tableName,
      select,
      order,
      where,
      pageNumber,
      pageSize,
    })
    const data = (pack as any)?.data
    return NextResponse.json(Array.isArray(data) ? data : [], { status: 200 })
  } catch (err) {
    // 不泄露后端细节，返回空数组即可
    return NextResponse.json([], { status: 200 })
  }
}
