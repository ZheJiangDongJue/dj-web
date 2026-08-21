// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  allowNextDocumentLeavePopState,
  confirmDocumentLeave,
  consumeAllowedDocumentLeavePopState,
  hasDocumentLeaveGuard,
  registerDocumentLeaveConfirmationHandler,
  registerDocumentLeaveGuard,
} from './document-leave-confirmation'

afterEach(() => {
  registerDocumentLeaveGuard(null)
  registerDocumentLeaveConfirmationHandler(null)
  while (consumeAllowedDocumentLeavePopState()) {
    // 清理跨测试的单次 popstate 放行标记。
  }
  vi.restoreAllMocks()
})

describe('document-leave-confirmation', () => {
  it('新建空白态不需要确认离开', async () => {
    registerDocumentLeaveGuard(() => false)

    await expect(confirmDocumentLeave()).resolves.toBe(true)
    expect(hasDocumentLeaveGuard()).toBe(false)
  })

  it('有草稿数据时使用页面确认处理器，并保留用户选择', async () => {
    registerDocumentLeaveGuard(() => true)
    const handler = vi.fn(async () => false)
    registerDocumentLeaveConfirmationHandler(handler)

    await expect(confirmDocumentLeave()).resolves.toBe(false)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('没有页面处理器时回退到浏览器 confirm', async () => {
    registerDocumentLeaveGuard(() => true)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    await expect(confirmDocumentLeave()).resolves.toBe(true)
    expect(window.confirm).toHaveBeenCalledOnce()
  })

  it('已确认的下一次 popstate 只允许消费一次', () => {
    expect(consumeAllowedDocumentLeavePopState()).toBe(false)

    allowNextDocumentLeavePopState()
    expect(consumeAllowedDocumentLeavePopState()).toBe(true)
    expect(consumeAllowedDocumentLeavePopState()).toBe(false)
  })
})

