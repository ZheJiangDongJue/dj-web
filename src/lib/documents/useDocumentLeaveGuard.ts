"use client"

import { useEffect, useRef } from 'react'
import { registerDocumentLeaveGuard } from './document-leave-confirmation'

/**
 * 将 React 页面当前的单据状态注册到共享离开守卫。
 *
 * @param shouldConfirmLeave 当前是否存在需要保护的单据内容；未审批草稿或存在未保存修改时传 true。
 */
export function useDocumentLeaveGuard(shouldConfirmLeave: boolean): void {
  const shouldConfirmLeaveRef = useRef(shouldConfirmLeave)

  useEffect(() => {
    shouldConfirmLeaveRef.current = shouldConfirmLeave
  }, [shouldConfirmLeave])

  useEffect(() => {
    return registerDocumentLeaveGuard(() => shouldConfirmLeaveRef.current)
  }, [])
}
