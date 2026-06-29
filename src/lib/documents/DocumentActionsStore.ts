import type { DocumentActions, DocumentActionsState, SaveResult, UseDocumentActionsOptions } from './useDocumentActions'

/**
 *
 * 非 Hook 的 DocumentActions 实现：用于在不依赖 React 的场景下管理保存/审批等动作。
 * - 接口与 useDocumentActions 返回值保持一致，便于直接替换。
 * - 内部维护 id/loading 状态，并在状态变化时调用可选的 onStateChange 回调。
 *
 */
export function createDocumentActions(options: UseDocumentActionsOptions & { onStateChange?: (s: DocumentActionsState) => void } = {}): DocumentActions {
  const { callSave, callApprove, callUnapprove, callDelete, initialId = null, onStateChange } = options

  const state: DocumentActionsState = {
    id: initialId ?? null,
    loading: false,
  }

  const notify = () => {
    try { onStateChange?.({ id: state.id, loading: state.loading }) } catch {}
  }

  const setLoading = (v: boolean) => { state.loading = v; notify() }
  const setId = (id: string | number | null) => { state.id = id; notify() }

  const create = () => { setId(null) }

  const save = async (payload: any): Promise<SaveResult | null> => {
    if (!callSave) return null
    try {
      setLoading(true)
      const res = await callSave(payload)
      if (res?.id != null) setId(res.id as any)
      return res ?? null
    } finally {
      setLoading(false)
    }
  }

  const approve = async (overrideId?: string | number | null): Promise<{ success: boolean; message?: string }> => {
    const effectiveId = overrideId ?? state.id
    if (!callApprove || effectiveId == null) return { success: false }
    try {
      setLoading(true)
      const res = await callApprove(effectiveId)
      return { success: !!res?.success, message: res?.message }
    } finally {
      setLoading(false)
    }
  }

  const unapprove = async (overrideId?: string | number | null): Promise<{ success: boolean; message?: string }> => {
    const effectiveId = overrideId ?? state.id
    if (!callUnapprove || effectiveId == null) return { success: false }
    try {
      setLoading(true)
      const res = await callUnapprove(effectiveId)
      return { success: !!res?.success, message: res?.message }
    } finally {
      setLoading(false)
    }
  }

  const remove = async (overrideId?: string | number | null): Promise<{ success: boolean; message?: string }> => {
    const effectiveId = overrideId ?? state.id
    if (!callDelete || effectiveId == null) return { success: false }
    try {
      setLoading(true)
      const res = await callDelete(effectiveId)
      if (res?.success) setId(null)
      return { success: !!res?.success, message: res?.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    create,
    save,
    approve,
    unapprove,
    remove,
    state,
    setId,
    setLoading,
  }
}
