import { describe, expect, test, vi } from 'vitest'
import {
  resolveDirectUpstreamFlowCardDetailState,
  shouldRequireReworkFlowDetailFromDirectUpstream,
  type FetchLookupFn,
} from './reworkFlowDetailOptions'

/**
 *
 * 创建可按表名返回固定数据的 fetchLookup 测试替身。
 * @param rowsByTable 表名到返回行列表的映射。
 *
 */
function createFetchLookupStub(rowsByTable: Record<string, any[]>): FetchLookupFn {
  return vi.fn(async (table: string) => rowsByTable[table] ?? [])
}

describe('reworkFlowDetailOptions', () => {
  test('shouldRequireReworkFlowDetailFromDirectUpstream: 草稿单据头直接带流程卡明细时返回 true', async () => {
    const fetcher = createFetchLookupStub({
      ProcessAssemblyFlowDetail: [
        { id: 11, StepDocumentid: null, StepDocumentType: '' },
      ],
    })

    const required = await shouldRequireReworkFlowDetailFromDirectUpstream({
      CreateByDocumentType: 'AssemblyProcessReceiveDocument',
      CreateByDocumentid: 9,
      CreateByDetailType: 'ProcessAssemblyFlowDetail',
      CreateByDetailid: 11,
    }, fetcher)

    expect(required).toBe(true)
  })

  test('shouldRequireReworkFlowDetailFromDirectUpstream: 上游单据直接来自普通流程卡明细时返回 true', async () => {
    const fetcher = createFetchLookupStub({
      FirstInspectionDocument: [
        { id: 9, CreateByDetailType: 'ProcessAssemblyFlowDetail', CreateByDetailid: 11 },
      ],
      ProcessAssemblyFlowDetail: [
        { id: 11, StepDocumentid: null, StepDocumentType: '' },
      ],
    })

    const required = await shouldRequireReworkFlowDetailFromDirectUpstream({
      CreateByDocumentType: 'FirstInspectionDocument',
      CreateByDocumentid: 9,
    }, fetcher)

    expect(required).toBe(true)
  })

  test('resolveDirectUpstreamFlowCardDetailState: 特殊单据工序也保留红色提示条件', async () => {
    const fetcher = createFetchLookupStub({
      FinalInspectionDocument: [
        { id: 19, CreateByDetailType: 'ProduceFlowDetail', CreateByDetailid: 21 },
      ],
      ProduceFlowDetail: [
        { id: 21, StepDocumentid: 5, StepDocumentType: 'FinalInspectionDocument' },
      ],
    })

    const state = await resolveDirectUpstreamFlowCardDetailState({
      CreateByDocumentType: 'FinalInspectionDocument',
      CreateByDocumentid: 19,
    }, fetcher)

    expect(state).toEqual({
      isDirectFlowCardProduct: true,
      isSpecialFlowCardDetail: true,
    })

    await expect(shouldRequireReworkFlowDetailFromDirectUpstream({
      CreateByDocumentType: 'FinalInspectionDocument',
      CreateByDocumentid: 19,
    }, fetcher)).resolves.toBe(true)
  })

  test('shouldRequireReworkFlowDetailFromDirectUpstream: 上游单据不是流程卡直接产物时返回 false', async () => {
    const fetcher = createFetchLookupStub({
      CheckCompleteDocument: [
        { id: 29, CreateByDetailType: 'DailyPlanDetail', CreateByDetailid: 31 },
      ],
    })

    const required = await shouldRequireReworkFlowDetailFromDirectUpstream({
      CreateByDocumentType: 'CheckCompleteDocument',
      CreateByDocumentid: 29,
    }, fetcher)

    expect(required).toBe(false)
  })

  test('shouldRequireReworkFlowDetailFromDirectUpstream: 兼容 CLR 全限定名表名', async () => {
    const fetcher = createFetchLookupStub({
      FirstInspectionDocument: [
        {
          id: 39,
          CreateByDetailType: 'ERP.Db.EntityFrameworkCore.ERPServer.Craft.ProcessAssemblyFlowDetail',
          CreateByDetailid: 41,
        },
      ],
      ProcessAssemblyFlowDetail: [
        { id: 41, StepDocumentid: 0, StepDocumentType: '' },
      ],
    })

    const required = await shouldRequireReworkFlowDetailFromDirectUpstream({
      CreateByDocumentType: 'ERP.Db.EntityFrameworkCore.ERPServer.Check.FirstInspectionDocument',
      CreateByDocumentid: 39,
    }, fetcher)

    expect(required).toBe(true)
  })
})
