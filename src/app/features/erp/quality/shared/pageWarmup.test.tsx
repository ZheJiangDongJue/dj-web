// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, act } from '@testing-library/react'
import { useEffect } from 'react'
import { useQualityPageWarmup, QualityPageWarmupStrip } from './pageWarmup'

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

function flushMicrotasks(): Promise<void> {
  return act(async () => {
    await Promise.resolve()
  })
}

afterEach(() => {
  cleanup()
})

describe('useQualityPageWarmup', () => {
  it('会在任务推进时更新进度，并在完成后进入 done 状态', async () => {
    const inspector = createDeferred<void>()
    const material = createDeferred<void>()
    const taskDefs = [
      { key: 'inspector', label: '检验员', run: () => inspector.promise },
      { key: 'material', label: '物料', run: () => material.promise },
    ]

    let latestState: ReturnType<typeof useQualityPageWarmup> | null = null
    function Probe() {
      const state = useQualityPageWarmup({ tasks: taskDefs, successHoldMs: 0 })
      useEffect(() => {
        latestState = state
      }, [state])
      return <QualityPageWarmupStrip state={state} />
    }

    const { container } = render(<Probe />)

    expect(latestState?.phase).toBe('running')
    expect(latestState?.interactive).toBe(false)
    expect(latestState?.summary).toContain('基础数据加载中')
    expect(container.textContent).toContain('检验员')
    expect(container.textContent).toContain('物料')

    await act(async () => {
      inspector.resolve()
      await inspector.promise
    })
    await flushMicrotasks()

    expect(latestState?.doneCount).toBe(1)
    expect(latestState?.runningCount).toBe(1)
    expect(latestState?.summary).toContain('1/2')

    await act(async () => {
      material.resolve()
      await material.promise
    })
    await flushMicrotasks()

    expect(latestState?.phase).toBe('done')
    expect(latestState?.interactive).toBe(true)
    expect(latestState?.doneCount).toBe(2)
    expect(latestState?.summary).toContain('基础数据已补齐')
  })

  it('当任务失败时会进入 error 状态并标记失败项', async () => {
    const okTask = createDeferred<void>()
    const failTask = createDeferred<void>()

    let latestState: ReturnType<typeof useQualityPageWarmup> | null = null
    function Probe() {
      const state = useQualityPageWarmup({
        tasks: [
          { key: 'ok', label: '检验员', run: () => okTask.promise },
          { key: 'fail', label: '工序', run: () => failTask.promise },
        ],
        successHoldMs: 0,
      })
      useEffect(() => {
        latestState = state
      }, [state])
      return <QualityPageWarmupStrip state={state} />
    }

    render(<Probe />)

    await act(async () => {
      okTask.resolve()
      await okTask.promise
    })
    await flushMicrotasks()

    await act(async () => {
      failTask.reject(new Error('boom'))
      await failTask.promise.catch(() => {})
    })
    await flushMicrotasks()

    expect(latestState?.phase).toBe('error')
    expect(latestState?.interactive).toBe(true)
    expect(latestState?.errorCount).toBe(1)
    expect(latestState?.entries.find((it) => it.key === 'fail')?.status).toBe('error')
    expect(latestState?.summary).toContain('部分加载失败')
  })
})
