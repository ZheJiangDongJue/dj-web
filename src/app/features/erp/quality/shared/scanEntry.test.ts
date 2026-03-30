import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { handleScanResultPayload, getScanCodeFromPayload } from './scanEntry'

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}))

describe('scanEntry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.restoreAllMocks()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('getScanCodeFromPayload 会 trim barcode', () => {
    expect(getScanCodeFromPayload({ barcode: '  RJH-001  ' } as any)).toBe('RJH-001')
  })

  test('handleScanResultPayload: 空内容走 onEmpty，不触发 toast.info', async () => {
    const onEmpty = vi.fn()
    const onCode = vi.fn()

    handleScanResultPayload({ barcode: '   ' } as any, { onEmpty, onCode })

    vi.runAllTimers()

    expect(onEmpty).toHaveBeenCalledTimes(1)
    expect(onCode).not.toHaveBeenCalled()
    const { toast } = (await import('sonner')) as any
    expect(toast.info).not.toHaveBeenCalled()
  })

  test('handleScanResultPayload: 非空内容会 toast.info 并调用 onCode(trim 后)', async () => {
    const onCode = vi.fn()

    handleScanResultPayload({ barcode: '  ZY-01  ' } as any, { onCode })

    const { toast } = (await import('sonner')) as any
    expect(toast.info).toHaveBeenCalledTimes(1)

    vi.runAllTimers()

    expect(onCode).toHaveBeenCalledWith('ZY-01')
  })

  test('handleScanResultPayload: onCode 同步抛错会 toast.error', async () => {
    const onCode = vi.fn(() => {
      throw new Error('boom')
    })

    handleScanResultPayload({ barcode: 'A' } as any, { onCode, logTag: '[test]' })

    vi.runAllTimers()

    const { toast } = (await import('sonner')) as any
    expect(toast.error).toHaveBeenCalledTimes(1)
  })

  test('handleScanResultPayload: onCode Promise reject 会 toast.error', async () => {
    const onCode = vi.fn(async () => {
      throw new Error('boom')
    })

    handleScanResultPayload({ barcode: 'A' } as any, { onCode, logTag: '[test]' })

    vi.runAllTimers()
    await Promise.resolve()

    const { toast } = (await import('sonner')) as any
    expect(toast.error).toHaveBeenCalledTimes(1)
  })

  test('handleScanResultPayload: debug 模式下超时后完成会提示超时与完成', async () => {
    let resolvePromise: (value: unknown) => void = () => {}
    const onCode = vi.fn(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve
        }),
    )

    handleScanResultPayload(
      { barcode: 'RJH-001' } as any,
      {
        logTag: '[test]',
        debugToast: true,
        debugTimeoutMs: 10,
        onCode,
      },
    )

    const { toast } = (await import('sonner')) as any

    // defer(0)
    vi.advanceTimersByTime(0)
    // timeout(10)
    vi.advanceTimersByTime(11)
    expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('扫码处理超时'))

    resolvePromise({ type: 'OPEN_BY_ID' })
    await Promise.resolve()

    expect(toast.info).toHaveBeenCalledWith(expect.stringContaining('扫码处理完成（超时后完成）'))
    expect(toast.info).toHaveBeenCalledWith(expect.stringContaining('OPEN_BY_ID'))
  })

  test('handleScanResultPayload: debug 模式下超时后失败会提示超时与异常', async () => {
    let rejectPromise: (err: unknown) => void = () => {}
    const onCode = vi.fn(
      () =>
        new Promise((_, reject) => {
          rejectPromise = reject
        }),
    )

    handleScanResultPayload(
      { barcode: 'RJH-001' } as any,
      {
        logTag: '[test]',
        debugToast: true,
        debugTimeoutMs: 10,
        onCode,
      },
    )

    const { toast } = (await import('sonner')) as any

    // defer(0)
    vi.advanceTimersByTime(0)
    // timeout(10)
    vi.advanceTimersByTime(11)
    expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('扫码处理超时'))

    rejectPromise(new Error('boom'))
    await Promise.resolve()
    await Promise.resolve()

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('扫码处理异常（超时后失败）'))
    expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('boom'))
  })
})
