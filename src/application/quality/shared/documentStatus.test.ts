import { describe, expect, it } from 'vitest'
import { DocumentStatus } from '@/types/erp-db.generated'
import { detectLockingStatus, hasStatusFlag, validateApproveStatus, validateUnapproveStatus } from './documentStatus'

describe('documentStatus', () => {
  it('hasStatusFlag 支持相等与位标志', () => {
    expect(hasStatusFlag(DocumentStatus.已审批, DocumentStatus.已审批)).toBe(true)
    const combined = DocumentStatus.已审批 | DocumentStatus.已冻结
    expect(hasStatusFlag(combined, DocumentStatus.已审批)).toBe(true)
    expect(hasStatusFlag(combined, DocumentStatus.已冻结)).toBe(true)
    expect(hasStatusFlag(DocumentStatus.已审批, DocumentStatus.已结案)).toBe(false)
  })

  it('detectLockingStatus 返回锁定状态标记', () => {
    expect(detectLockingStatus(DocumentStatus.已冻结)).toBe('已冻结')
    expect(detectLockingStatus(DocumentStatus.已结案)).toBe('已结案')
    expect(detectLockingStatus(DocumentStatus.已作废)).toBe('已作废')
    expect(detectLockingStatus(0)).toBeNull()
  })

  it('validateApproveStatus 校验状态锁、重复审批与未保存', () => {
    expect(validateApproveStatus(DocumentStatus.已冻结, 1)).toMatchObject({ ok: false })
    expect(validateApproveStatus(DocumentStatus.已审批, 1)).toMatchObject({ ok: false })
    expect(validateApproveStatus(0, null)).toMatchObject({ ok: false })
    expect(validateApproveStatus(0, 1)).toMatchObject({ ok: true })
  })

  it('validateUnapproveStatus 校验锁定与已审批', () => {
    expect(validateUnapproveStatus(DocumentStatus.已冻结)).toMatchObject({ ok: false })
    expect(validateUnapproveStatus(0)).toMatchObject({ ok: false })
    expect(validateUnapproveStatus(DocumentStatus.已审批)).toMatchObject({ ok: true })
  })
})

