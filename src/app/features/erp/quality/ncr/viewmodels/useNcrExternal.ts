'use client'
import { useSyncExternalStore } from 'react'
import type { NcrViewModel } from './NcrViewModelClass'

/**
 *
 * 订阅 NcrViewModel（类）状态变更，并驱动组件刷新。
 * - 返回 vm 本体供消费；通过 revision 触发刷新。
 *
 */
export function useNcrExternal(vm: NcrViewModel): NcrViewModel {
  useSyncExternalStore(
    (cb) => vm.subscribe(cb),
    () => vm.revision,
    () => vm.revision,
  )
  return vm
}
