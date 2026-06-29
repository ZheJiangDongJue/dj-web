import { useCallback, useMemo, useState } from 'react';

export interface SaveResult {
  id?: string | number | null;
  code?: string | null;
  message?: string | null;
}

export interface DocumentActionResult {
  success: boolean;
  message?: string;
}

export interface DocumentApi {
  /**
   *
   * 调用后端：保存表头+明细。
   * @param payload 任意对象（建议包含 document 与 details 两部分）
   *
   */
  callSave?: (payload: any) => Promise<SaveResult>;
  /**
   *
   * 调用后端：审批当前单据
   *
   */
  callApprove?: (id: string | number) => Promise<DocumentActionResult>;
  /**
   *
   * 调用后端：反审批当前单据
   *
   */
  callUnapprove?: (id: string | number) => Promise<DocumentActionResult>;
  /**
   *
   * 调用后端：删除当前单据
   *
   */
  callDelete?: (id: string | number) => Promise<DocumentActionResult>;
}

export interface UseDocumentActionsOptions extends DocumentApi {
  /**
   *
   * 初始主键
   *
   */
  initialId?: string | number | null;
}

export interface DocumentActionsState {
  id: string | number | null;
  loading: boolean;
}

export interface DocumentActions {
  /**
   *
   * 新建（清空 id）
   *
   */
  create: () => void;
  /**
   *
   * 保存当前 UI 数据
   * @param payload 与后端对接的任意包体
   *
   */
  save: (payload: any) => Promise<SaveResult | null>;
  /**
   *
   * 审批文档；可显式传入 id 以避免闭包中旧状态导致的空值问题
   * @param id 可选；当不传时使用内部 state.id
   *
   */
  approve: (id?: string | number | null) => Promise<DocumentActionResult>;
  /**
   *
   * 反审批文档；可显式传入 id 以避免闭包中旧状态导致的空值问题
   * @param id 可选；当不传时使用内部 state.id
   *
   */
  unapprove: (id?: string | number | null) => Promise<DocumentActionResult>;
  /**
   *
   * 删除文档；可显式传入 id，默认读取内部 state.id
   * @param id 可选；当不传时使用内部 state.id
   *
   */
  remove: (id?: string | number | null) => Promise<DocumentActionResult>;
  /**
   *
   * 当前状态
   *
   */
  state: DocumentActionsState;
  /**
   *
   * 同步外部 id（用于重新拉取后回填）
   *
   */
  setId: (id: string | number | null) => void;
  /**
   *
   * 强制同步加载态。
   * @remarks
   * - 主要供外层动作壳在请求超时或异常卡住时释放按钮门闩；
   * - 常规保存/审批/反审批/删除流程仍由各动作自身的 finally 自动复位。
   *
   */
  setLoading: (loading: boolean) => void;
}

/**
 *
 * 通用单据动作 Hook：新增/删除/保存/审批/反审批
 * - 通过可选的 `callSave/callApprove/callUnapprove/callDelete` 注入实际 API
 * - 内部管理 `id/loading` 状态
 *
 */
export function useDocumentActions(options: UseDocumentActionsOptions = {}): DocumentActions {
  const { callSave, callApprove, callUnapprove, callDelete, initialId = null } = options;

  const [id, setId] = useState<string | number | null>(initialId);
  const [loading, setLoading] = useState(false);

  // 新建：清空 id
  const create = useCallback(() => {
    setId(null);
  }, []);

  // 保存：调用外部保存并同步返回的 id
  const save = useCallback(async (payload: any) => {
    if (!callSave) return null;
    try {
      setLoading(true);
      const res = await callSave(payload);
      if (res?.id != null) setId(res.id);
      return res ?? null;
    } finally {
      setLoading(false);
    }
  }, [callSave]);

  // 审批：优先使用显式传入的 id，避免闭包读取到旧的 state.id
  const approve = useCallback(async (overrideId?: string | number | null): Promise<DocumentActionResult> => {
    const effectiveId = overrideId ?? id;
    if (!callApprove || effectiveId == null) return { success: false };
    try {
      setLoading(true);
      const res = await callApprove(effectiveId);
      return { success: !!res?.success, message: res?.message };
    } finally {
      setLoading(false);
    }
  }, [callApprove, id]);

  // 反审批：同上，支持显式 id
  const unapprove = useCallback(async (overrideId?: string | number | null): Promise<DocumentActionResult> => {
    const effectiveId = overrideId ?? id;
    if (!callUnapprove || effectiveId == null) return { success: false };
    try {
      setLoading(true);
      const res = await callUnapprove(effectiveId);
      return { success: !!res?.success, message: res?.message };
    } finally {
      setLoading(false);
    }
  }, [callUnapprove, id]);

  // 删除：支持显式 id
  const remove = useCallback(async (overrideId?: string | number | null): Promise<DocumentActionResult> => {
    const effectiveId = overrideId ?? id;
    if (!callDelete || effectiveId == null) return { success: false };
    try {
      setLoading(true);
      const res = await callDelete(effectiveId);
      if (res?.success) setId(null);
      return { success: !!res?.success, message: res?.message };
    } finally {
      setLoading(false);
    }
  }, [callDelete, id]);

  const state = useMemo<DocumentActionsState>(() => ({ id, loading }), [id, loading]);

  // 提供显式设置 id 的能力，便于外部数据流同步
  const syncId = useCallback((nextId: string | number | null) => {
    setId(nextId);
  }, []);

  const syncLoading = useCallback((nextLoading: boolean) => {
    setLoading(!!nextLoading);
  }, []);

  return { create, save, approve, unapprove, remove, state, setId: syncId, setLoading: syncLoading };
}
