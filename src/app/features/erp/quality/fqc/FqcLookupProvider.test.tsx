// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, test, vi, type Mock } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { FqcLookupProvider, useFqcLookup } from './FqcLookupProvider'

vi.mock('@/lib/erp/employee', () => ({
  fetchActiveEmployees: vi.fn(),
}))

vi.mock('@/lib/erp/material', () => ({
  fetchMaterials: vi.fn(),
}))

vi.mock('@/lib/erp/type-of-work', () => ({
  fetchWorkTypes: vi.fn(),
}))

function LookupProbe() {
  const state = useFqcLookup()
  return (
    <div>
      <span data-testid="phase">{state.phase}</span>
      <span data-testid="inspector">{state.inspectorOptions[0]?.label ?? ''}</span>
      <span data-testid="material">{state.materialIndex['11']?.code ?? ''}</span>
      <span data-testid="process">{state.processOptions[0]?.label ?? ''}</span>
    </div>
  )
}

describe('FqcLookupProvider', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('首次挂载加载基础联查，后续 Provider 重渲染复用同一份快照', async () => {
    const { fetchActiveEmployees } = await import('@/lib/erp/employee')
    const { fetchMaterials } = await import('@/lib/erp/material')
    const { fetchWorkTypes } = await import('@/lib/erp/type-of-work')

    ;(fetchActiveEmployees as Mock).mockResolvedValue([{ id: 1, Name: '张三' }])
    ;(fetchMaterials as Mock).mockResolvedValue([
      { value: 11, label: '物料A', raw: { code: 'MAT-001', name: '物料A' } },
    ])
    ;(fetchWorkTypes as Mock).mockResolvedValue([{ value: 2, label: '工序B' }])

    const { rerender } = render(
      <FqcLookupProvider>
        <LookupProbe />
      </FqcLookupProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('phase').textContent).toBe('ready'))
    expect(screen.getByTestId('inspector').textContent).toBe('张三')
    expect(screen.getByTestId('material').textContent).toBe('MAT-001')
    expect(screen.getByTestId('process').textContent).toBe('工序B')

    rerender(
      <FqcLookupProvider>
        <LookupProbe />
      </FqcLookupProvider>,
    )

    expect(screen.getByTestId('phase').textContent).toBe('ready')
    expect(fetchActiveEmployees).toHaveBeenCalledOnce()
    expect(fetchMaterials).toHaveBeenCalledOnce()
    expect(fetchWorkTypes).toHaveBeenCalledOnce()
  })

  test('单类基础联查失败时保留其它结果并进入可交互的错误态', async () => {
    const { fetchActiveEmployees } = await import('@/lib/erp/employee')
    const { fetchMaterials } = await import('@/lib/erp/material')
    const { fetchWorkTypes } = await import('@/lib/erp/type-of-work')

    ;(fetchActiveEmployees as Mock).mockRejectedValue(new Error('员工服务不可用'))
    ;(fetchMaterials as Mock).mockResolvedValue([
      { value: 11, label: '物料A', raw: { code: 'MAT-001', name: '物料A' } },
    ])
    ;(fetchWorkTypes as Mock).mockResolvedValue([{ value: 2, label: '工序B' }])

    render(
      <FqcLookupProvider>
        <LookupProbe />
      </FqcLookupProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('phase').textContent).toBe('error'))
    expect(screen.getByTestId('material').textContent).toBe('MAT-001')
    expect(screen.getByTestId('process').textContent).toBe('工序B')
  })
})
