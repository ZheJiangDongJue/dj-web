// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, test, vi, type Mock } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { FqcLookupProvider, FqcLookupWarmupStrip, useFqcLookup } from './FqcLookupProvider'

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function chipHasStatusDot(label: string, className: string): boolean {
  const chip = screen.getByText(label, { exact: true }).closest('span')
  return chip?.querySelector(`.${className}`) !== null
}

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
      <FqcLookupWarmupStrip state={state} />
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
    expect(chipHasStatusDot('检验员', 'bg-emerald-500')).toBe(true)
    expect(chipHasStatusDot('物料', 'bg-emerald-500')).toBe(true)
    expect(chipHasStatusDot('工序', 'bg-emerald-500')).toBe(true)

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

  test('单类联查完成后立即点亮对应状态，未完成项继续保持加载态', async () => {
    const { fetchActiveEmployees } = await import('@/lib/erp/employee')
    const { fetchMaterials } = await import('@/lib/erp/material')
    const { fetchWorkTypes } = await import('@/lib/erp/type-of-work')
    const inspector = createDeferred<Array<{ id: number; Name: string }>>()
    const material = createDeferred<Array<{ value: number; label: string; raw: { code: string; name: string } }>>()
    const process = createDeferred<Array<{ value: number; label: string }>>()

    ;(fetchActiveEmployees as Mock).mockReturnValue(inspector.promise)
    ;(fetchMaterials as Mock).mockReturnValue(material.promise)
    ;(fetchWorkTypes as Mock).mockReturnValue(process.promise)

    render(
      <FqcLookupProvider>
        <LookupProbe />
      </FqcLookupProvider>,
    )

    expect(screen.getByTestId('phase').textContent).toBe('loading')
    expect(chipHasStatusDot('检验员', 'bg-emerald-500')).toBe(false)

    inspector.resolve([{ id: 1, Name: '张三' }])
    await waitFor(() => expect(chipHasStatusDot('检验员', 'bg-emerald-500')).toBe(true))
    expect(screen.getByTestId('phase').textContent).toBe('loading')
    expect(chipHasStatusDot('物料', 'bg-emerald-500')).toBe(false)

    material.resolve([{ value: 11, label: '物料A', raw: { code: 'MAT-001', name: '物料A' } }])
    process.resolve([{ value: 2, label: '工序B' }])
    await waitFor(() => expect(screen.getByTestId('phase').textContent).toBe('ready'))
    expect(chipHasStatusDot('物料', 'bg-emerald-500')).toBe(true)
    expect(chipHasStatusDot('工序', 'bg-emerald-500')).toBe(true)
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
    expect(screen.getByText('加载失败：检验员')).toBeTruthy()
  })
})
