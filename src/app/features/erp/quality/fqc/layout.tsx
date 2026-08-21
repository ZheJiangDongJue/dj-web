import type { ReactNode } from 'react'
import { FqcLookupProvider } from './FqcLookupProvider'

/**
 * FQC 路由布局。
 * @remarks
 * FQC 页面与 NCR 中间页共享此布局，因此基础联查快照不会因页面切换被销毁。
 */
export default function FqcLayout({ children }: { children: ReactNode }) {
  return <FqcLookupProvider>{children}</FqcLookupProvider>
}
