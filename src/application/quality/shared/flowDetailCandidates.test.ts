import { describe, expect, it } from 'vitest'

import {
  parseDocumentsFromCheckDocumentStateData,
  parseFlowDetailsFromCheckDocumentStateData,
  pickPreferredDocumentId,
} from './flowDetailCandidates'

describe('flowDetailCandidates', () => {
  it('parseFlowDetailsFromCheckDocumentStateData 仅返回 Matched=true 的 FlowDetail，并去重', () => {
    const data = {
      Items: [
        { Matched: false, FlowDetail: { TableName: 'A', Id: 1 } },
        { Matched: true, FlowDetail: { TableName: 'A', Id: 1 } }, // duplicate
        { Matched: true, FlowDetail: { TableName: 'B', Id: '2' } },
        { Matched: true, FlowDetail: null },
        { Matched: true, FlowDetail: { TableName: '', Id: 3 } }, // invalid table
        { Matched: true, FlowDetail: { TableName: 'C', Id: 0 } }, // invalid id
      ],
    }

    expect(parseFlowDetailsFromCheckDocumentStateData(data)).toEqual([
      { tableName: 'A', id: 1 },
      { tableName: 'B', id: 2 },
    ])
  })

  it('parseFlowDetailsFromCheckDocumentStateData 兼容 camelCase 字段名', () => {
    const data = {
      items: [{ matched: true, flowDetail: { tableName: 'T', id: 9 } }],
    }

    expect(parseFlowDetailsFromCheckDocumentStateData(data)).toEqual([{ tableName: 'T', id: 9 }])
  })

  it('parseDocumentsFromCheckDocumentStateData 返回指定 FlowDetail 的 Documents，并去重', () => {
    const data = {
      Items: [
        {
          Matched: true,
          FlowDetail: { TableName: 'A', Id: 1 },
          Documents: [
            { TableName: 'Doc', Id: 2, Status: 0 },
            { TableName: 'Doc', Id: 2, Status: 0 }, // duplicate
            { TableName: 'Doc', Id: '3', Status: 1 },
            { TableName: '', Id: 9, Status: 0 }, // invalid
          ],
        },
        {
          Matched: true,
          FlowDetail: { TableName: 'B', Id: 1 },
          Documents: [{ TableName: 'Doc', Id: 99, Status: 0 }],
        },
      ],
    }

    expect(parseDocumentsFromCheckDocumentStateData(data, 'A', 1)).toEqual([
      { tableName: 'Doc', id: 2, status: 0 },
      { tableName: 'Doc', id: 3, status: 1 },
    ])
    expect(parseDocumentsFromCheckDocumentStateData(data, 'B', 1)).toEqual([{ tableName: 'Doc', id: 99, status: 0 }])
    expect(parseDocumentsFromCheckDocumentStateData(data, 'C', 1)).toEqual([])
  })

  it('parseDocumentsFromCheckDocumentStateData 兼容 camelCase 字段名', () => {
    const data = {
      items: [
        {
          matched: true,
          flowDetail: { tableName: 'T', id: 9 },
          documents: [{ tableName: 'X', id: 1, status: 0 }],
        },
      ],
    }

    expect(parseDocumentsFromCheckDocumentStateData(data, 'T', 9)).toEqual([{ tableName: 'X', id: 1, status: 0 }])
  })

  it('pickPreferredDocumentId 优先选择未审批（status=0）单据', () => {
    const docs = [
      { tableName: 'Doc', id: 10, status: 1 }, // 已审批
      { tableName: 'Doc', id: 5, status: 0 }, // 未审批
      { tableName: 'Doc', id: 7, status: 0 }, // 未审批
    ]
    expect(pickPreferredDocumentId(docs)).toBe(7)
  })

  it('pickPreferredDocumentId 仅 status=0 视为未审批（0x40000000 不视为未审批）', () => {
    const docs = [
      { tableName: 'Doc', id: 10, status: 1 }, // 已审批
      { tableName: 'Doc', id: 5, status: 0x40000000 }, // 未审批（位标志）
    ]
    expect(pickPreferredDocumentId(docs)).toBe(10)
  })

  it('pickPreferredDocumentId 无未审批时回退到最大 id', () => {
    const docs = [
      { tableName: 'Doc', id: 2, status: 1 },
      { tableName: 'Doc', id: 9, status: 1 },
    ]
    expect(pickPreferredDocumentId(docs)).toBe(9)
  })

  it('pickPreferredDocumentId status 缺失时回退到最大 id', () => {
    const docs = [
      { tableName: 'Doc', id: 2 },
      { tableName: 'Doc', id: 9 },
    ]
    expect(pickPreferredDocumentId(docs)).toBe(9)
  })
})
