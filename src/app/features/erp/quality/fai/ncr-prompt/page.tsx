import ClientPage from './ClientPage'

/**
 *
 * 请填写不合格记录 - 中间页（服务端组件入口）
 * - 该页面用于在首件检验判定为“不合格”且审批成功后，引导用户前往填写 NCR。
 * - 通过 searchParams 透传来自上游页面的关键信息（如单号、物料、不合格数等）。
 *
 */
export default function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  return <ClientPage searchParams={searchParams} />
}

