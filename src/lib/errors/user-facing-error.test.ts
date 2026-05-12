import { describe, expect, it } from 'vitest'

import {
  extractUserFacingErrorMessage,
  formatActionErrorMessage,
  resolveUserFacingErrorMessage,
} from './user-facing-error'

describe('user-facing-error', () => {
  it('可从嵌套 response.data 中提取后端 message', () => {
    const err = {
      response: {
        data: {
          success: false,
          message: '库存不足，无法保存',
        },
      },
    }

    expect(extractUserFacingErrorMessage(err)).toBe('库存不足，无法保存')
  })

  it('当仅有泛化错误时回退到 fallback', () => {
    const err = new Error('请求失败，请稍后重试')

    expect(resolveUserFacingErrorMessage(err, '请检查网络连接后重试')).toBe('请检查网络连接后重试')
  })

  it('formatActionErrorMessage 会拼接动作前缀', () => {
    const err = { message: '单据已被他人修改，请刷新后重试' }

    expect(formatActionErrorMessage('保存', err, '请稍后重试')).toBe('保存失败：单据已被他人修改，请刷新后重试')
  })

  it('支持 Error.cause 中的深层 message', () => {
    const err = new Error('请求失败') as Error & { cause?: unknown }
    err.cause = { errorMessage: '权限不足，请联系管理员开通' }

    expect(extractUserFacingErrorMessage(err)).toBe('权限不足，请联系管理员开通')
  })
})
