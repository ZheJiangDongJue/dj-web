import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BillApprovalService } from './BillApprovalService'
import { BillApi } from '@/lib/erp/bill-api'

vi.mock('@/lib/erp/bill-api', () => ({
  BillApi: {
    GeneralBillApproval: vi.fn(),
  },
}))

const fakeUser = { Employeeid: 1, EmployeeName: 'tester' } as any

describe('BillApprovalService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('approve 调用 GeneralBillApproval 并解析返回', async () => {
    ;(BillApi.GeneralBillApproval as any).mockResolvedValue({ issuccess: true, message: 'ok' })
    const service = new BillApprovalService({
      tableName: 'FirstInspectionDocument',
      getUser: () => fakeUser,
    })

    await expect(service.approve(123)).resolves.toEqual({ success: true, message: 'ok' })
    expect(BillApi.GeneralBillApproval).toHaveBeenCalledWith({
      tableName: 'FirstInspectionDocument',
      user: fakeUser,
      billId: 123,
      isApprove: true,
      useNewFramework: false,
    })
  })

  it('unapprove 透传 isApprove=false', async () => {
    ;(BillApi.GeneralBillApproval as any).mockResolvedValue({ issuccess: true, message: '' })
    const service = new BillApprovalService({
      tableName: 'FirstInspectionDocument',
      getUser: () => fakeUser,
    })

    await service.unapprove(456)
    expect(BillApi.GeneralBillApproval).toHaveBeenCalledWith(
      expect.objectContaining({ billId: 456, isApprove: false }),
    )
  })

  it('返回包 success=false 时回传 message', async () => {
    ;(BillApi.GeneralBillApproval as any).mockResolvedValue({ issuccess: false, ErrorMessage: '失败' })
    const service = new BillApprovalService({
      tableName: 'FirstInspectionDocument',
      getUser: () => fakeUser,
    })

    await expect(service.approve(1)).resolves.toEqual({ success: false, message: '失败' })
  })

  it('useNewFramework 允许自定义透传', async () => {
    ;(BillApi.GeneralBillApproval as any).mockResolvedValue({ issuccess: true })
    const service = new BillApprovalService({
      tableName: 'X',
      getUser: () => fakeUser,
      useNewFramework: true,
    })

    await service.approve(1)
    expect(BillApi.GeneralBillApproval).toHaveBeenCalledWith(
      expect.objectContaining({ useNewFramework: true }),
    )
  })
})

