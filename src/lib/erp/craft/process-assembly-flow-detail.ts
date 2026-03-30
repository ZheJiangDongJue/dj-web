import { DEFAULT_DB_NAME } from '@/lib/config'
import { GeneralApi, type QueryInput } from '@/lib/erp/general-api'
import { toOptions } from '../lookup-core'

/**
 *
 * 通过 JOIN 一次性获取指定单据（DefectiveReworkOrderDocument）相关的工种列表。
 * 连接关系：
 * - d: DefectiveReworkOrderDocument (d.id)
 * - p: ProcessAssemblyFlowDetail (p.CreateByDetailid = d.id AND p.CreateByDetailType = 'DefectiveReworkOrderDocument')
 * - t: TypeofWork (t.id = p.TypeofWorkid)
 * 选择字段：distinct t.id, t.Name, t.Code
 * 排序：t.Name asc
 * 注意：此函数严格使用 JOIN（由 GeneralApi.GetItemsEx 在服务端执行），
 *       避免前端多次往返和潜在的并发/一致性问题。
 * @param docId DefectiveReworkOrderDocument 的 id
 * @returns Array<{ label, value, raw }>
 *
 */
export async function fetchWorkTypesByJoin(docId: number | string) {
  const idNum = Number(docId)
  if (!Number.isFinite(idNum) || idNum <= 0) return []

  const onLeft = "p.CreateByDetailid = d.id AND p.CreateByDetailType = 'DefectiveReworkOrderDocument'"
  const onRight = 't.id = p.TypeofWorkid'

  const query: QueryInput = {
    tableName: 'DefectiveReworkOrderDocument',
    shortName: 'd',
    where: [
      `d.id = ${idNum}`,
      't.DeletedTag = 0',
      't.IsPause = 0',
    ],
    joinInfos: [
      { tableName: 'ProcessAssemblyFlowDetail', shortName: 'p', joinType: 'Inner', on: onLeft },
      { tableName: 'TypeofWork', shortName: 't', joinType: 'Inner', on: onRight },
    ],
    select: 'distinct t.id as id, t.Name as Name, t.Code as Code',
    order: 't.Name asc',
  }

  const res = await GeneralApi.GetItemsEx(DEFAULT_DB_NAME, query)
  const items = (res as any)?.data ?? (Array.isArray(res) ? res : [])
  return toOptions(items)
}

