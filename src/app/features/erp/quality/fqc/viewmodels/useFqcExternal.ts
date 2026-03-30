/* istanbul ignore file */
"use client"
import { useSyncExternalStore } from 'react'
import type { FqcViewModel } from './FqcViewModelClass'

/**
 *
 * 订阅 FqcViewModel（类）状态变更，并驱动组件刷新。
 * 注意：useSyncExternalStore 的比较逻辑基于快照的“引用相等”。
 * 由于 vm 是稳定实例（字段在内部被就地修改），直接返回 vm 将导致 React 误判“快照未变”而跳过渲染。
 * 因此快照改为返回 vm.revision（每次 emit 自增），纯用于触发刷新；真正消费的数据仍取自 vm 本体。
 *
 */
export function useFqcExternal(vm: FqcViewModel): FqcViewModel {
  useSyncExternalStore(
    (cb) => vm.subscribe(cb),
    () => vm.revision,
    () => vm.revision,
  )
  return vm
}
