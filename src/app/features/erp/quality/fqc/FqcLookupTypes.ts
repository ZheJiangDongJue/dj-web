/**
 * FQC 基础联查下拉选项。
 */
export type FqcLookupOption = {
  label: string
  value: string
}

/**
 * FQC 物料索引：物料主键 -> 展示所需的物料信息。
 */
export type FqcMaterialIndex = Record<string, { code?: string; name?: string }>

/**
 * 单类基础联查的加载状态。
 */
export type FqcLookupEntryStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * FQC 共享基础联查快照。
 * @remarks
 * - 该快照由 FQC 路由布局持有，FQC 页面切换到 NCR 中间页时仍然存活；
 * - 单据与明细不属于此快照，必须由 ViewModel 按单据 ID 重新读取。
 */
export type FqcLookupSnapshot = {
  phase: 'idle' | 'loading' | 'ready' | 'error'
  /**
   * 完成态提示条是否仍处于短暂展示窗口内。
   * @remarks Provider 在联查全部完成后按原逻辑延迟隐藏；错误态不会自动隐藏。
   */
  visible?: boolean
  inspectorStatus: FqcLookupEntryStatus
  materialStatus: FqcLookupEntryStatus
  processStatus: FqcLookupEntryStatus
  inspectorOptions: FqcLookupOption[]
  materialIndex: FqcMaterialIndex
  processOptions: FqcLookupOption[]
  errors: Partial<Record<'inspector' | 'material' | 'process', string>>
}
