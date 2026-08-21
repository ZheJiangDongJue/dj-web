// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const navigationMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams('billId=42&auto=0'),
  replace: vi.fn(),
}))

const serviceMocks = vi.hoisted(() => ({
  unapprove: vi.fn(),
}))

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigationMocks.replace }),
  useSearchParams: () => navigationMocks.searchParams,
}))

vi.mock('sonner', () => ({
  toast: toastMocks,
}))

vi.mock('@/app/features/_components', () => ({
  useFeaturesPageTitle: vi.fn(),
}))

vi.mock('@/infrastructure/di/hooks', () => ({
  useService: () => serviceMocks,
}))

vi.mock('@/infrastructure/di/AppServicesProvider', () => ({
  FinalInspectionApplicationServiceToken: Symbol('FinalInspectionApplicationService'),
}))

import ClientPage from './ClientPage'

afterEach(() => {
  cleanup()
  navigationMocks.searchParams = new URLSearchParams('billId=42&auto=0')
  vi.clearAllMocks()
})

describe('FQC 不合格中间页反审批', () => {
  it('反审批完成前保持等待，成功后只按 id 返回 FQC', async () => {
    let resolveUnapprove!: (value: { success: boolean; message: string }) => void
    serviceMocks.unapprove.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUnapprove = resolve
      }),
    )

    render(<ClientPage searchParams={{ billId: '42', auto: '0' }} />)

    fireEvent.click(screen.getByRole('button', { name: '返回末件检验（反审批）' }))

    expect(serviceMocks.unapprove).toHaveBeenCalledWith(42)
    expect(screen.getByText('正在反审批，请稍候；完成后将自动打开最新的末件检验单据。')).toBeTruthy()
    expect((screen.getByRole('button', { name: '返回末件检验（反审批）' }) as HTMLButtonElement).disabled).toBe(true)
    expect(navigationMocks.replace).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '进入填写不合格记录' }))
    expect(navigationMocks.replace).not.toHaveBeenCalled()

    resolveUnapprove({ success: true, message: '' })

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith('/features/erp/quality/fqc?id=42')
    })
  })

  it('反审批失败时留在中间页并允许重试', async () => {
    serviceMocks.unapprove
      .mockResolvedValueOnce({ success: false, message: '当前单据已锁定' })
      .mockResolvedValueOnce({ success: true, message: '' })

    render(<ClientPage searchParams={{ billId: '42', auto: '0' }} />)

    const button = screen.getByRole('button', { name: '返回末件检验（反审批）' })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('反审批失败：当前单据已锁定')
    })
    expect(navigationMocks.replace).not.toHaveBeenCalled()
    expect((button as HTMLButtonElement).disabled).toBe(false)
    expect(toastMocks.error).toHaveBeenCalledWith('反审批失败：当前单据已锁定')

    fireEvent.click(button)

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith('/features/erp/quality/fqc?id=42')
    })
    expect(serviceMocks.unapprove).toHaveBeenCalledTimes(2)
  })

  it('反审批请求进行中忽略重复点击', async () => {
    let resolveUnapprove!: (value: { success: boolean; message: string }) => void
    serviceMocks.unapprove.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUnapprove = resolve
      }),
    )

    render(<ClientPage searchParams={{ billId: '42', auto: '0' }} />)

    const button = screen.getByRole('button', { name: '返回末件检验（反审批）' })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(serviceMocks.unapprove).toHaveBeenCalledTimes(1)

    resolveUnapprove({ success: true, message: '' })
    await waitFor(() => expect(navigationMocks.replace).toHaveBeenCalledTimes(1))
  })

  it('缺少单据 ID 时不调用反审批服务也不导航', async () => {
    navigationMocks.searchParams = new URLSearchParams('auto=0')
    serviceMocks.unapprove.mockResolvedValue({ success: true, message: '' })

    render(<ClientPage searchParams={{ auto: '0' }} />)
    fireEvent.click(screen.getByRole('button', { name: '返回末件检验（反审批）' }))

    expect(serviceMocks.unapprove).not.toHaveBeenCalled()
    expect(navigationMocks.replace).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toContain('反审批失败：未获取到有效单据ID')
  })

  it('反审批抛出异常时留在中间页并展示可读错误', async () => {
    serviceMocks.unapprove.mockRejectedValueOnce(new Error('网络连接失败'))

    render(<ClientPage searchParams={{ billId: '42', auto: '0' }} />)
    fireEvent.click(screen.getByRole('button', { name: '返回末件检验（反审批）' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('反审批失败：网络连接失败')
    })
    expect(navigationMocks.replace).not.toHaveBeenCalled()
    expect((screen.getByRole('button', { name: '返回末件检验（反审批）' }) as HTMLButtonElement).disabled).toBe(false)
    expect(toastMocks.error).toHaveBeenCalledWith('反审批失败：网络连接失败')
  })

  it('中间页卸载后反审批完成，不再更新状态或导航', async () => {
    let resolveUnapprove!: (value: { success: boolean; message: string }) => void
    serviceMocks.unapprove.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUnapprove = resolve
      }),
    )

    const view = render(<ClientPage searchParams={{ billId: '42', auto: '0' }} />)
    fireEvent.click(screen.getByRole('button', { name: '返回末件检验（反审批）' }))
    view.unmount()

    resolveUnapprove({ success: true, message: '' })
    await Promise.resolve()

    expect(navigationMocks.replace).not.toHaveBeenCalled()
  })
})
