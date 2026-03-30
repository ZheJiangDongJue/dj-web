import { describe, it, expect } from 'vitest'
import { NcrViewModel } from '@/app/features/erp/quality/ncr/viewmodels/NcrViewModelClass'

describe('NCR（不合格记录单）明细规则', () => {
  it('createNewBill 后默认至少 1 行明细', () => {
    const vm = new NcrViewModel({} as any)
    vm.createNewBill()

    expect(vm.details.length).toBe(1)
    expect(vm.disableRemoveDetail).toBe(true)
  })

  it('禁止删除最后一行明细', () => {
    const vm = new NcrViewModel({} as any)
    vm.createNewBill()

    const key = vm.getDetailKey(vm.details[0]!)
    vm.removeDetail(key)

    expect(vm.details.length).toBe(1)
  })

  it('允许从多行中删除到只剩 1 行', () => {
    const vm = new NcrViewModel({} as any)
    vm.createNewBill()
    vm.addDetail()

    const key = vm.getDetailKey(vm.details[0]!)
    vm.removeDetail(key)

    expect(vm.details.length).toBe(1)
    expect(vm.disableRemoveDetail).toBe(true)
  })

  it('审批前校验：明细至少 1 行', async () => {
    const vm = new NcrViewModel({} as any)
    vm.createNewBill()
    vm.updateBill({ Employeeid: 1 as any, TypeofWorkid: 1 as any } as any)
    vm.details = []

    await expect(vm.handleApprove()).resolves.toBe(false)
  })

  it('审批前校验：每行记录必填', async () => {
    const vm = new NcrViewModel({} as any)
    vm.createNewBill()
    vm.updateBill({ Employeeid: 1 as any, TypeofWorkid: 1 as any } as any)

    // 默认首行记录为空，应阻断审批
    await expect(vm.handleApprove()).resolves.toBe(false)
  })

  it('审批前校验：照片证据必填', async () => {
    const vm = new NcrViewModel({} as any)
    vm.createNewBill()
    vm.updateBill({ Employeeid: 1 as any, TypeofWorkid: 1 as any } as any)

    // 先补齐明细记录必填项，再验证“照片证据”门闩
    const key = vm.getDetailKey(vm.details[0]!)
    vm.changeDetailReason(key, 'ok')
    vm.serverPhotoEvidence = []
    vm.localPhotoEvidence = []

    await expect(vm.handleApprove()).resolves.toBe(false)
  })

  it('审批前校验：存在照片证据时可进入审批流程', async () => {
    const appService = {
      save: async () => ({ id: 1, code: 'NCR-TEST', clearLocalPhotoEvidence: false }),
      approve: async () => ({ success: true }),
      unapprove: async () => ({ success: true }),
      delete: async () => ({ success: true }),
      fetchById: async () => ({ document: null, details: null }),
    } as any

    const vm = new NcrViewModel(appService)
    vm.createNewBill()
    vm.updateBill({ Employeeid: 1 as any, TypeofWorkid: 1 as any } as any)

    const key = vm.getDetailKey(vm.details[0]!)
    vm.changeDetailReason(key, 'ok')
    vm.localPhotoEvidence = [{ id: 'local', uri: 'file:///tmp/a.jpg' } as any]

    await expect(vm.handleApprove()).resolves.toBe(true)
  })
})
