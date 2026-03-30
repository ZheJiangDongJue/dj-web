'use client'
import { createContext, useContext, useMemo, useReducer, type PropsWithChildren } from 'react'

/**
 *
 * 通用：单据 + 明细 的上下文与动作集合
 * - 通过范型约束 B(表头)、D(明细项)、S(总状态) 实现跨业务复用。
 * - 任何拥有 bill + details 结构的业务模块均可采用该上下文。
 *
 */

/**
 *
 * 基本状态结构：要求至少含有 bill 与 details 两个字段。
 *
 */
export type BillDetailsState<B extends object, D extends object> = {
  bill: B
  details: D[]
}

/**
 *
 * 通用动作接口：对 bill 与 details 的类型安全操作。
 *
 */
export interface BillDetailsActions<B extends object, D extends object, S extends BillDetailsState<B, D>> {
  /**
   *
   * 设置单据（表头）某个字段的值（类型安全）。
   * @param key 字段名
   * @param value 字段值（自动推导类型）
   *
   */
  setBill<K extends keyof B>(key: K, value: B[K]): void

  /**
   *
   * 替换全部明细项。
   *
   */
  setDetails(items: D[]): void

  /**
   *
   * 更新某条明细（增量补丁）。
   * @param id 明细标识（由 getDetailId 决定）
   * @param patch 待更新字段集合
   *
   */
  updateDetail(id: string, patch: Partial<D>): void

  /**
   *
   * 删除某条明细。
   *
   */
  removeDetail(id: string): void

  /**
   *
   * 新增一条明细。
   *
   */
  addDetail(item: D): void

  /**
   *
   * 若存在则更新，否则新增（按 getDetailId(detail) 匹配）。
   *
   */
  upsertDetail(item: D): void

  /**
   *
   * 清空所有明细。
   *
   */
  clearDetails(): void

  /**
   *
   * 新建单据：恢复为默认初始状态。
   * - 语义化别名，等价于 reset(undefined)。
   *
   */
  createNewBill(): void

  /**
   *
   * 重置为默认或指定状态。
   * @param state 可选，提供则替换为此状态
   *
   */
  reset(state?: S): void

  /**
   *
   * 完全替换当前状态（谨慎使用）。
   * @param state 新状态
   *
   */
  replaceState(state: S): void
}

/**
 *
 * 上下文值：状态 + 动作。
 *
 */
export interface BillDetailsContextValue<B extends object, D extends object, S extends BillDetailsState<B, D>> {
  state: S
  actions: BillDetailsActions<B, D, S>
}

/**
 *
 * 工厂：创建“单据+明细”上下文。
 * - 传入默认初始状态构造器，以便 SSR/CSR 共用。
 * - 返回 Provider 与三种 hooks（整合/状态/动作）。
 *
 */
export function createBillDetailsContext<B extends object, D extends object, S extends BillDetailsState<B, D>>({
  createInitialState,
  contextName = 'BillDetails',
  getDetailId,
}: {
  /**
   *
   * 创建默认初始状态（用于新建/重置）。
   *
   */
  createInitialState: () => S
  /**
   *
   * 仅用于错误信息中的上下文名称。
   *
   */
  contextName?: string
  /**
   *
   * 获取明细项的稳定标识（用于更新/删除等操作）。
   * - 要求在明细数组生命周期内保持唯一且稳定。
   *
   */
  getDetailId: (detail: D) => string
}) {
  type Action =
    | { type: 'SET_BILL_FIELD'; key: keyof B; value: B[keyof B] }
    | { type: 'SET_DETAILS'; items: D[] }
    | { type: 'UPDATE_DETAIL'; id: string; patch: Partial<D> }
    | { type: 'REMOVE_DETAIL'; id: string }
    | { type: 'ADD_DETAIL'; item: D }
    | { type: 'UPSERT_DETAIL'; item: D }
    | { type: 'CLEAR_DETAILS' }
    | { type: 'RESET'; state?: S }
    | { type: 'REPLACE_STATE'; state: S }

  /**
   *
   * 纯函数：根据动作更新通用状态。
   * - 仅对 bill 与 details 做不可变更新；其余字段保持不变。
   *
   */
  function reducer(state: S, action: Action): S {
    switch (action.type) {
      case 'SET_BILL_FIELD':
        return { ...(state as any), bill: { ...(state.bill as any), [action.key]: action.value } }
      case 'SET_DETAILS':
        return { ...(state as any), details: action.items }
      case 'UPDATE_DETAIL':
        return {
          ...(state as any),
          details: state.details.map((x) =>
            getDetailId(x) === action.id ? { ...(x as any), ...(action.patch as any) } : x,
          ),
        }
      case 'REMOVE_DETAIL':
        return { ...(state as any), details: state.details.filter((x) => getDetailId(x) !== action.id) }
      case 'ADD_DETAIL':
        return { ...(state as any), details: [...state.details, action.item] }
      case 'UPSERT_DETAIL': {
        const key = getDetailId(action.item)
        const i = state.details.findIndex((d) => getDetailId(d) === key)
        if (i === -1) return { ...(state as any), details: [...state.details, action.item] }
        const next = [...state.details]
        next[i] = { ...(next[i] as any), ...(action.item as any) }
        return { ...(state as any), details: next }
      }
      case 'CLEAR_DETAILS':
        return { ...(state as any), details: [] }
      case 'RESET':
        return (action.state ?? createInitialState()) as S
      case 'REPLACE_STATE':
        return action.state
      default:
        return state
    }
  }

  const Ctx = createContext<BillDetailsContextValue<B, D, S> | null>(null)

  /**
   *
   * Provider 组件：在页面/布局中包裹后，子组件即可通过 hooks 访问状态与动作。
   *
   */
  function Provider({ initialState, children }: PropsWithChildren<{ initialState?: S }>) {
    const [state, dispatch] = useReducer(reducer, undefined as unknown as S, () => initialState ?? createInitialState())

    // 将 dispatch 封装为易用的动作集合，保持引用稳定
    const actions: BillDetailsActions<B, D, S> = useMemo(() => {
      return {
        setBill: (key, value) => dispatch({ type: 'SET_BILL_FIELD', key, value } as Action),
        setDetails: (items) => dispatch({ type: 'SET_DETAILS', items } as Action),
        updateDetail: (id, patch) => dispatch({ type: 'UPDATE_DETAIL', id, patch } as Action),
        removeDetail: (id) => dispatch({ type: 'REMOVE_DETAIL', id } as Action),
        addDetail: (item) => dispatch({ type: 'ADD_DETAIL', item } as Action),
        upsertDetail: (item) => dispatch({ type: 'UPSERT_DETAIL', item } as Action),
        clearDetails: () => dispatch({ type: 'CLEAR_DETAILS' } as Action),
        createNewBill: () => dispatch({ type: 'RESET' } as Action),
        reset: (state) => dispatch({ type: 'RESET', state } as Action),
        replaceState: (state) => dispatch({ type: 'REPLACE_STATE', state } as Action),
      }
    }, [])

    const value = useMemo<BillDetailsContextValue<B, D, S>>(() => ({ state, actions }), [state, actions])

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
  }

  /**
   *
   * 安全获取上下文（状态 + 动作）。
   * - 未被 Provider 包裹时抛出明确错误，便于定位问题。
   *
   */
  function useBillDetails(): BillDetailsContextValue<B, D, S> {
    const ctx = useContext(Ctx)
    if (!ctx) throw new Error(`use${contextName} 只能在 <${contextName}Provider> 内使用`)
    return ctx
  }

  /**
   *
   * 仅获取状态。
   *
   */
  function useBillDetailsState(): S {
    return useBillDetails().state
  }

  /**
   *
   * 仅获取动作。
   *
   */
  function useBillDetailsActions(): BillDetailsActions<B, D, S> {
    return useBillDetails().actions
  }

  return { Provider, useBillDetails, useBillDetailsState, useBillDetailsActions }
}
