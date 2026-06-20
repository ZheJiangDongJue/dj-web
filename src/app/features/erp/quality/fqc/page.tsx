import ClientPage from './ClientPage'
import { Suspense } from 'react'
import { ERP_PAGE_NAME } from '@/lib/erp/page-names'

/**
 *
 * PageName：用于行为角色权限系统的页面标识。
 *
 */
export const pageName = ERP_PAGE_NAME.FQC

/**
 *
 * 末件检验页面（FQC）- 服务端组件
 * - 支持通过 URL 参数 scancode 自动打开末件检验草稿
 * - 保持服务端入口，便于后续扩展 SSR/数据拉取；当前仅将参数透传给客户端组件处理
 *
 */
export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (await searchParams) ?? {}
  const scanParam = sp.scancode
  const scanText = Array.isArray(scanParam) ? scanParam[0] : scanParam
  const initialScanCode = typeof scanText === 'string' ? scanText.trim() : null
  return (
    <Suspense fallback={null}>
      <ClientPage initialScanCode={initialScanCode} />
    </Suspense>
  )
}
