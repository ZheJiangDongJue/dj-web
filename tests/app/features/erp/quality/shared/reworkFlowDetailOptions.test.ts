import { describe, it, expect } from 'vitest'
import {
  fetchReworkFlowDetailOptionsFromUpstreamFlowCard,
  normalizeErpTableName,
  resolveUpstreamFlowCardFromDocumentBase,
  resolveUpstreamFlowDetailIdFromDocumentBase,
  type FetchLookupFn,
} from '@/app/features/erp/quality/shared/reworkFlowDetailOptions'

describe('NCR 返工工序候选（对齐 ERPClient）', () => {
  it('normalizeErpTableName：全限定名归一为表名', () => {
    expect(normalizeErpTableName('ERPServer.Craft.ProcessAssemblyFlowDetail')).toBe('ProcessAssemblyFlowDetail')
    expect(normalizeErpTableName('ProcessAssemblyFlowDetail')).toBe('ProcessAssemblyFlowDetail')
    expect(normalizeErpTableName('')).toBe('')
    expect(normalizeErpTableName(null)).toBe('')
  })

  it('resolveUpstreamFlowCardFromDocumentBase：CreateByDetailType 为全限定名时仍可命中', async () => {
    const calls: Array<{ table: string; opts?: any }> = []
    const fetcher: FetchLookupFn = async (table, _select, _orderBy, opts) => {
      calls.push({ table, opts })
      if (table === 'ProcessAssemblyFlowDetail' && (opts as any)?.where?.id === 123) return [{ ParentTypeid: 456 }]
      return []
    }

    const ref = await resolveUpstreamFlowCardFromDocumentBase(
      { CreateByDetailType: 'ERPServer.Craft.ProcessAssemblyFlowDetail', CreateByDetailid: 123 },
      fetcher,
    )

    expect(ref).toEqual({ flowDetailTableName: 'ProcessAssemblyFlowDetail', flowDocumentId: 456 })
    expect(calls[0]?.table).toBe('ProcessAssemblyFlowDetail')
  })

  it('resolveUpstreamFlowCardFromDocumentBase：沿 CreateByDocumentType 追溯并归一表名', async () => {
    const calls: Array<{ table: string; opts?: any }> = []
    const fetcher: FetchLookupFn = async (table, _select, _orderBy, opts) => {
      calls.push({ table, opts })

      if (table === 'CheckCompleteDocument' && (opts as any)?.where?.id === 99) {
        return [{ CreateByDetailType: 'ERPServer.Craft.ProcessAssemblyFlowDetail', CreateByDetailid: 1001 }]
      }
      if (table === 'ProcessAssemblyFlowDetail' && (opts as any)?.where?.id === 1001) {
        return [{ ParentTypeid: 5000 }]
      }
      return []
    }

    const ref = await resolveUpstreamFlowCardFromDocumentBase(
      { CreateByDocumentType: 'ERPServer.Check.CheckCompleteDocument', CreateByDocumentid: 99 },
      fetcher,
    )

    expect(ref).toEqual({ flowDetailTableName: 'ProcessAssemblyFlowDetail', flowDocumentId: 5000 })
    expect(calls.some((c) => c.table === 'CheckCompleteDocument')).toBe(true)
  })

  it('fetchReworkFlowDetailOptionsFromUpstreamFlowCard：候选来自上游流程卡全部明细，且能回显已选但缺失的明细', async () => {
    const fetcher: FetchLookupFn = async (table, _select, _orderBy, opts) => {
      if (table === 'ProcessAssemblyFlowDetail' && (opts as any)?.where?.ParentTypeid === 10) {
        return [
          { id: 1, TypeofWorkid: 10, LocationIndex: 1, Content: '打磨返修' },
          { id: 2, TypeofWorkid: 20, LocationIndex: 2, Content: '  ' },
        ]
      }
      if (table === 'ProcessAssemblyFlowDetail' && (opts as any)?.where?.id === 999) return []
      if (table === 'ProduceFlowDetail' && (opts as any)?.where?.id === 999) {
        return [{ id: 999, TypeofWorkid: 30, LocationIndex: 0.5, Content: '生产返修说明' }]
      }
      return []
    }

    const options = await fetchReworkFlowDetailOptionsFromUpstreamFlowCard(
      {
        documentBase: { CreateByDocumentType: 'ProcessAssemblyFlowDocument', CreateByDocumentid: 10 },
        workTypeOptions: [
          { label: '工序A', value: '10' },
          { label: '工序B', value: '20' },
        ],
        selectedFlowDetailIds: [999],
      },
      fetcher,
    )

    expect(options.map((o) => o.value)).toEqual(['999', '1', '2'])
    expect(options[0]?.label).toBe('工序ID=30 : 生产返修说明')
    expect(options[1]?.label).toBe('工序A : 打磨返修')
    expect(options[1]?.flowDetailContent).toBe('打磨返修')
    expect(options[2]?.label).toBe('工序B')
  })

  it('fetchReworkFlowDetailOptionsFromUpstreamFlowCard：未命中上游流程卡时仍可按已选明细回显', async () => {
    const fetcher: FetchLookupFn = async (table, _select, _orderBy, opts) => {
      if (table === 'ProcessAssemblyFlowDetail' && (opts as any)?.where?.id === 123) {
        return [{ id: 123, TypeofWorkid: 10, LocationIndex: 1, Content: '已选返工内容' }]
      }
      return []
    }

    const options = await fetchReworkFlowDetailOptionsFromUpstreamFlowCard(
      {
        documentBase: {},
        workTypeOptions: [{ label: '工序A', value: '10' }],
        selectedFlowDetailIds: [123],
      },
      fetcher,
    )

    expect(options).toEqual([
      {
        label: '工序A : 已选返工内容',
        value: '123',
        workTypeLabel: '工序A',
        flowDetailTableName: 'ProcessAssemblyFlowDetail',
        flowDetailContent: '已选返工内容',
      },
    ])
  })

  it('resolveUpstreamFlowDetailIdFromDocumentBase：优先使用 CreateByDetailType', async () => {
    const id = await resolveUpstreamFlowDetailIdFromDocumentBase({
      CreateByDetailType: 'ERPServer.Craft.ProcessAssemblyFlowDetail',
      CreateByDetailid: 2,
    })

    expect(id).toBe(2)
  })
})
