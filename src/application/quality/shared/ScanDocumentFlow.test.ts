import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScanDocumentFlow } from './ScanDocumentFlow'
import { FlowScanApi } from '@/lib/erp/flow-scan-api'

vi.mock('@/lib/config', () => ({ DEFAULT_DB_NAME: 'TEST_DB' }))

vi.mock('@/lib/erp/flow-scan-api', () => ({
  FlowScanApi: {
    CheckDocumentState: vi.fn(),
  },
  FlowScanSourceType: {
    DailyPlanDetail: 1,
    ExtrusionPlanDetail: 2,
    DefectiveReworkOrderDocument: 3,
  },
  FlowScanDocumentKind: {
    FirstInspection: 3,
    FinalInspection: 5,
    Ncr: 6,
  },
  FlowScanCheckState: {
    PrevCompletedCurrentUnfinished: 5,
  },
}))

vi.mock('@/lib/erp/lookup-core', () => ({
  fetchLookup: vi.fn(async (tableName: string, _fields: string[], _order: unknown, query: any) => {
    if (tableName === 'ProcessAssemblyFlowDetail' && query?.where?.id === 11) return [{ id: 11, TypeofWorkid: 101, LocationIndex: 2 }]
    if (tableName === 'ProcessAssemblyFlowDetail' && query?.where?.id === 22) return [{ id: 22, TypeofWorkid: 202, LocationIndex: 1 }]
    return []
  }),
}))

const user = { Employeeid: 1 } as any

describe('ScanDocumentFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('单条 flow detail 时返回 DRAFT_LOADED', async () => {
    ;(FlowScanApi.CheckDocumentState as any).mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: {
        Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }],
      },
    })

    const createDraft = vi.fn(async () => ({ success: true, message: 'draft-ok', data: { Document: { id: 1 }, Details: [] } }))
    const flow = new ScanDocumentFlow({
      documentKind: 3 as any,
      targetDocumentTableName: 'FirstInspectionDocument',
      getUser: () => user,
      createDraft,
      draftStrategy: { mode: 'document-and-details' },
    })

    await expect(
      flow.run({
        scanForCode: 'RJH-001',
        source: { sourceType: 1 as any, logTag: '[FAI]' },
      }),
    ).resolves.toEqual({
      type: 'DRAFT_LOADED',
      document: { id: 1 },
      details: [],
      message: 'draft-ok',
    })
  })

  it('多条 flow detail 且存在未审批单据时直接 OPEN_BY_ID', async () => {
    ;(FlowScanApi.CheckDocumentState as any).mockResolvedValueOnce({
      success: true,
      message: '',
      data: {
        Items: [
          {
            Matched: true,
            FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 },
            Documents: [{ TableName: 'FirstInspectionDocument', Id: 10, Status: 0 }],
          },
          {
            Matched: true,
            FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 22 },
            Documents: [{ TableName: 'FirstInspectionDocument', Id: 20, Status: 0 }],
          },
        ],
      },
    })

    const flow = new ScanDocumentFlow({
      documentKind: 3 as any,
      targetDocumentTableName: 'FirstInspectionDocument',
      getUser: () => user,
      createDraft: vi.fn(),
      draftStrategy: { mode: 'document-and-details' },
    })

    await expect(
      flow.run({
        scanForCode: 'RJH-MULTI',
        source: { sourceType: 1 as any, logTag: '[FAI]' },
      }),
    ).resolves.toEqual({ type: 'OPEN_BY_ID', id: 20 })
  })

  it('多条 flow detail 且无未审批单据时返回候选列表', async () => {
    ;(FlowScanApi.CheckDocumentState as any).mockResolvedValueOnce({
      success: true,
      message: '',
      data: {
        Items: [
          { Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } },
          { Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 22 } },
        ],
      },
    })

    const flow = new ScanDocumentFlow({
      documentKind: 3 as any,
      targetDocumentTableName: 'FirstInspectionDocument',
      getUser: () => user,
      createDraft: vi.fn(),
      draftStrategy: { mode: 'document-and-details' },
    })

    await expect(
      flow.run({
        scanForCode: 'RJH-MULTI',
        source: { sourceType: 1 as any, logTag: '[FAI]' },
      }),
    ).resolves.toMatchObject({
      type: 'NEED_PICK_FLOW_DETAIL',
      scanCode: 'RJH-MULTI',
      candidates: [
        { flowDetailTableName: 'ProcessAssemblyFlowDetail', flowDetailId: 22, typeofWorkId: 202, locationIndex: 1 },
        { flowDetailTableName: 'ProcessAssemblyFlowDetail', flowDetailId: 11, typeofWorkId: 101, locationIndex: 2 },
      ],
    })
  })

  it('pickedFlowDetail 存在时优先走创建流程', async () => {
    ;(FlowScanApi.CheckDocumentState as any).mockResolvedValueOnce({
      success: true,
      message: '',
      data: {
        Items: [
          {
            Matched: true,
            FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 },
            Documents: [{ TableName: 'FirstInspectionDocument', Id: 8, Status: 1 }],
          },
        ],
      },
    })

    const createDraft = vi.fn(async () => ({ success: true, message: 'ok', data: { Document: { id: 2 }, Details: [] } }))
    const flow = new ScanDocumentFlow({
      documentKind: 3 as any,
      targetDocumentTableName: 'FirstInspectionDocument',
      getUser: () => user,
      createDraft,
      draftStrategy: { mode: 'document-and-details' },
    })

    await expect(
      flow.run({
        scanForCode: 'RJH-001',
        source: { sourceType: 1 as any, logTag: '[FAI]' },
        pickedFlowDetail: { tableName: 'ProcessAssemblyFlowDetail', id: 11 },
      }),
    ).resolves.toEqual({ type: 'DRAFT_LOADED', document: { id: 2 }, details: [], message: 'ok' })
    expect(createDraft).toHaveBeenCalledWith(
      expect.objectContaining({ flowDetailTableName: 'ProcessAssemblyFlowDetail', flowDetailId: 11 }),
    )
  })

  it('created-id 策略返回 CREATED_BY_ID', async () => {
    ;(FlowScanApi.CheckDocumentState as any).mockResolvedValueOnce({
      success: true,
      message: 'm',
      data: { Items: [{ Matched: true, FlowDetail: { TableName: 'ProcessAssemblyFlowDetail', id: 11 } }] },
    })

    const flow = new ScanDocumentFlow({
      documentKind: 6 as any,
      targetDocumentTableName: 'DefectiveReworkOrderDocument',
      getUser: () => user,
      createDraft: vi.fn(async () => ({ success: true, message: 'm', data: { Id: 321 } })),
      draftStrategy: {
        mode: 'created-id',
        pickId: (pack) => Number((pack as any)?.data?.Id ?? (pack as any)?.data?.id ?? 0),
      },
    })

    await expect(
      flow.run({
        scanForCode: 'FGD-001',
        source: { sourceType: 3 as any, logTag: '[NCR]' },
      }),
    ).resolves.toEqual({ type: 'CREATED_BY_ID', id: 321, message: 'm' })
  })

  it('无效扫码返回 warning', async () => {
    const flow = new ScanDocumentFlow({
      documentKind: 3 as any,
      targetDocumentTableName: 'FirstInspectionDocument',
      getUser: () => user,
      createDraft: vi.fn(),
      draftStrategy: { mode: 'document-and-details' },
    })

    await expect(
      flow.run({
        scanForCode: '   ',
        source: { sourceType: 1 as any, logTag: '[FAI]' },
      }),
    ).resolves.toEqual({ type: 'ERROR', level: 'warning', message: '扫描内容为空' })
  })
})

