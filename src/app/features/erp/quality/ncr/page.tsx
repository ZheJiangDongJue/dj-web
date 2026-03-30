import ClientPage from './ClientPage'
import { Suspense } from 'react'

/**
 *
 * 不合格记录单页面（NCR）- 服务端组件
 * - 支持通过 URL 参数 id/scancode 自动打开单据或触发扫码逻辑
 * - 保持服务端入口，便于后续扩展 SSR/数据拉取；当前仅将参数透传给客户端组件处理
 *
 */
export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (await searchParams) ?? {}
  const idParam = sp.id
  const idText = Array.isArray(idParam) ? idParam[0] : idParam
  const idNum = idText != null ? Number(idText) : NaN
  const initialId = Number.isFinite(idNum) && idNum > 0 ? idNum : null

  const scanParam = sp.scancode
  const scanText = Array.isArray(scanParam) ? scanParam[0] : scanParam
  const initialScanCode = typeof scanText === 'string' ? scanText.trim() : null

  return (
    <Suspense fallback={null}>
      <ClientPage initialId={initialId} initialScanCode={initialScanCode} />
    </Suspense>
  )
}
