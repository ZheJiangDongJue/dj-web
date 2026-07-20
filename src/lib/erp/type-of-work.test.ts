import { describe, expect, it, vi } from 'vitest'
import { fetchWorkTypes } from './type-of-work'
import { fetchLookup } from './lookup-core'

vi.mock('./lookup-core', () => ({
  fetchLookup: vi.fn(),
}))

describe('fetchWorkTypes', () => {
  it('查询 TypeofWork.Content 并作为 workTypeContent 返回', async () => {
    ;(fetchLookup as any).mockResolvedValueOnce([
      { id: 1, Name: '打磨', Code: 'DM', Content: '表面毛刺处理' },
      { id: 2, Name: '抛光', Code: 'PG', Content: '  ' },
    ])

    const options = await fetchWorkTypes()

    expect(fetchLookup).toHaveBeenCalledWith(
      'TypeofWork',
      ['id', 'Name', 'Code', 'Content'],
      'Name asc',
      { where: ['DeletedTag = 0', 'IsPause = 0'] },
      undefined,
    )
    expect(options).toEqual([
      {
        label: '打磨',
        value: 1,
        raw: { id: 1, Name: '打磨', Code: 'DM', Content: '表面毛刺处理' },
        workTypeContent: '表面毛刺处理',
      },
      {
        label: '抛光',
        value: 2,
        raw: { id: 2, Name: '抛光', Code: 'PG', Content: '  ' },
      },
    ])
  })
})
