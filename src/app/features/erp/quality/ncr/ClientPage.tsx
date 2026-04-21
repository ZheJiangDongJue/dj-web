"use client"
import { useFeaturesPageTitle } from "@/app/features/_components"
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent } from "react"
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import styles from './ncr.module.css'
import DocumentPageLayout from '@/app/features/common/documents/DocumentPageLayout'
import ApproveFooterBar from '@/app/features/common/documents/ApproveFooterBar'
import { DetailsCardList } from '@/components/molecules/DetailsCardList'
import { ImageOverlayViewer, type ImageOverlayViewerToolbarProps } from '@/components/molecules/ImageOverlayViewer'
import { CloseIconButton } from '@/components/ui/close-icon-button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import GridSelect from '@/components/ui/grid-select'
import { NumberInput } from '@/components/ui/number-input'
import { Trash2Icon } from 'lucide-react'
import DebugFab, { type DebugMenuItem } from "@/components/molecules/DebugFab"
import { DocumentStatus, type DefectiveReworkOrderDocument } from "@/types/erp-db.generated"
import { documentStatusToText, hasStatusFlag, getErpUserFromStorage } from "../shared/helpers"
import FlowDetailPickDialog from '../shared/FlowDetailPickDialog'
import { useNcrViewModelClass as useNcrVM, type LocalErpImageItem } from "./viewmodels/NcrViewModelClass"
import { useNcrExternal } from "./viewmodels/useNcrExternal"
import { isAndroidBridgeAvailable, pickImagesAdvanced, takePhoto } from "@/lib/android-bridge"
import { loadImageBase64, type ErpImageItem } from "@/lib/image-loader"
import { API_BASE, DEFAULT_DB_NAME } from '@/lib/config'
import authFetch from '@/lib/auth/interceptor'
import type { DbChangedPackResult } from '@/types/api'

type DeleteRemotePhotoResult = 'success' | 'not_found' | 'error' | 'skip'

/**
 *
 * 删除 NCR 远程附件（云端照片）。
 * - 对应后端 FileController.DeleteNcr 接口；
 * - 仅在提供 cloudFileId 时才会尝试调用；
 * - 若 recordId 缺失，则视为无法准确定位记录，直接跳过远程删除（返回 'skip'）。
 * @param photo 待删除的远程照片项
 *
 */
async function deleteNcrRemotePhoto(photo: LocalErpImageItem): Promise<DeleteRemotePhotoResult> {
  const cloudFileId = photo.cloudFileId
  if (!cloudFileId || cloudFileId <= 0) {
    return 'skip'
  }

  const recordId = photo.recordId
  if (!recordId || recordId <= 0) {
    // 当前无法从前端拿到附件记录主键，仅能跳过远程删除，交由调用方决定是否继续移除 UI。
    return 'skip'
  }

  const dbName = photo.dbName || DEFAULT_DB_NAME
  const user = getErpUserFromStorage()

  const body = {
    DbName: dbName,
    User: user,
    NcrFile: {
      id: recordId,
      Billid: photo.billId ?? 0,
      CloudFileid: cloudFileId,
      FileName: photo.fileName ?? photo.name ?? '',
      Suffix: '',
      FileDescription: '',
    },
  }

  const urlBase = API_BASE.replace(/\/$/, '')
  const url = `${urlBase}/api/File/DeleteNcr`

  try {
    const response = await authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      if (response.status === 404) {
        return 'not_found'
      }
      return 'error'
    }

    const pack = await response.json().catch(() => ({})) as DbChangedPackResult & Record<string, unknown>

    // —— 按后端 DbChangedPackResult 结构解析 —— //
    const successFromFlag =
      typeof pack.isSuccess === 'boolean'
        ? pack.isSuccess
        : typeof (pack as any).success === 'boolean'
          ? (pack as any).success
          : false

    if (successFromFlag) {
      return 'success'
    }

    const msgFromError =
      typeof pack.errorMessage === 'string' && pack.errorMessage
        ? pack.errorMessage
        : undefined

    const msgFromMessage =
      typeof (pack as any).message === 'string' && (pack as any).message
        ? String((pack as any).message)
        : typeof (pack as any).Message === 'string' && (pack as any).Message
          ? String((pack as any).Message)
          : undefined

    const msg: string = msgFromError ?? msgFromMessage ?? ''

    if (msg && msg.includes('不存在')) {
      return 'not_found'
    }

    return 'error'
  } catch (error) {
    console.error('[NCR] 删除云端照片失败:', error)
    return 'error'
  }
}

/**
 *
 * 页面顶层：不合格记录单（NCR）
 * - 使用 MVVM 风格：当前组件仅负责视图渲染与绑定 ViewModel。
 *
 */
export default function ClientPage({
  initialId,
  initialScanCode,
}: {
  initialId?: number | string | null
  initialScanCode?: string | null
} = {}) {
  useFeaturesPageTitle('不合格记录单')

  // 避免解构 ViewModel，保持响应和可维护性；统一以 vm.* 引用（类实例 + 外部订阅）
  const vmStore = useNcrVM()
  const vm = useNcrExternal(vmStore)
  const searchParams = useSearchParams()
  const queryId = searchParams.get('id')
  const queryScanCode = searchParams.get('scancode')
  const queryInspectionType = searchParams.get('type')
  const queryInspectionBillId = searchParams.get('billId')
  const initialIdParam = initialId != null ? String(initialId) : null
  const targetIdParam = queryId ?? initialIdParam
  const lastAutoOpenKeyRef = useRef<string | null>(null)

  /**
   *
   * PC 环境下用于唤起本地文件选择的隐藏 input。
   *
   */
  const pcFileInputRef = useRef<HTMLInputElement | null>(null)

  /**
   *
   * 处理 PC 环境下通过 input[type=file] 选择图片的结果。
   * - 为每个文件生成本地预览 URL，并追加到 photoItems 中。
   *
   */
  const handlePcFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target
    if (!files || files.length === 0) return

    const timestamp = Date.now()
    const nextItems: LocalErpImageItem[] = Array.from(files).map((file, index) => {
      const localObjectUrl = URL.createObjectURL(file)
      return {
        id: `pc_${timestamp}_${index}_${file.name}`,
        uri: localObjectUrl,
        name: file.name,
        size: file.size,
        localFile: file,
        localObjectUrl,
      }
    })

    vm.appendLocalPhotoEvidence(nextItems)

    // 清空选择值，允许选择同一文件多次
    event.target.value = ''
  }

  /**
   *
   * Android 环境下：点击“+”新增照片时的底部菜单状态。
   * - 仅在 isAndroidBridgeAvailable() 为 true 时才会被打开。
   *
   */
  const [addPhotoMenuOpen, setAddPhotoMenuOpen] = useState(false)
  const [addPhotoMenuBusy, setAddPhotoMenuBusy] = useState<null | 'camera' | 'album'>(null)

  // 首次进入：新建空白单据 + 载入下拉选项
  useEffect(() => {
    try { vm.createNewBill() } catch {}
    void (async () => {
      try { await Promise.all([vm.loadInspectorOptions?.(), vm.loadProcessOptions?.()]) } catch {}
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 支持 URL 参数自动打开：
  // 1) ?id=Number：直接打开 NCR 单据
  // 2) ?scancode=...：按扫码逻辑查找并打开关联的 NCR 单据
  // 3) ?type=FAI|FQC&billId=...：基于检验单生成 NCR 草稿并带入返工工序
  useEffect(() => {
    // 1) 优先处理单据ID：避免同时存在 id 与 scancode 时发生覆盖/竞态
    const rawId = targetIdParam?.trim()
    if (rawId) {
      const match = rawId.match(/^(?:id\s*[:：]\s*)?(\d+)$/i)
      const billId = match ? Number(match[1]) : NaN
      if (Number.isFinite(billId) && billId > 0) {
        const key = `id:${billId}`
        if (lastAutoOpenKeyRef.current !== key) {
          lastAutoOpenKeyRef.current = key
          void vm.openById?.(billId)
        }
        return
      }
    }

    // 2) 处理 scancode（优先使用客户端 searchParams，其次使用服务端透传的初始值）
    const rawScanCode = (queryScanCode ?? initialScanCode ?? '').trim()
    if (rawScanCode) {
      const key = `scancode:${rawScanCode}`
      if (lastAutoOpenKeyRef.current === key) return
      lastAutoOpenKeyRef.current = key
      void vm.handleScan?.(rawScanCode)
      return
    }

    // 3) 处理“由检验单引导生成 NCR 草稿”
    const rawType = (queryInspectionType ?? '').trim()
    const rawInspectionId = (queryInspectionBillId ?? '').trim()
    if (!rawType || !rawInspectionId) return
    const inspectionId = Number(rawInspectionId)
    if (!Number.isFinite(inspectionId) || inspectionId <= 0) return

    const key = `draft:${rawType}:${inspectionId}`
    if (lastAutoOpenKeyRef.current === key) return
    lastAutoOpenKeyRef.current = key
    void vm.createDraftByInspection?.(rawType, inspectionId)
  }, [targetIdParam, queryScanCode, initialScanCode, queryInspectionType, queryInspectionBillId, vm])

  const debugMenuItems = useMemo<DebugMenuItem[]>(
    () => [
      {
        id: 'scan',
        label: '扫码/输入条码',
        onClick: () => { void vm.handleScanOrInput?.() },
      },
      {
        id: 'moni',
        label: '模拟扫码',
        onClick: vm.handleMockScan,
      },
    ],
    [vm],
  )

  /**
   *
   * 点击“照片证据”区域的「+」按钮：
   * - 在 Android WebView 中：调起高级图片选择器（pickImagesAdvanced），并回显已选项；
   * - 在 PC 浏览器中：唤起隐藏的 input[type=file] 选择本地图片。
   *
   */
  const handleAddPhoto = useCallback(async () => {
    if (vm.disableDetailEdit) {
      try {
        toast.warning('当前状态不允许修改照片证据')
      } catch {}
      return
    }

    const openPcFilePicker = (): void => {
      const input = pcFileInputRef.current
      if (!input) return
      // 部分环境（尤其 WebView）对 input.click 有限制，优先尝试 showPicker
      if (typeof (input as unknown as { showPicker?: () => void }).showPicker === 'function') {
        try {
          ;(input as unknown as { showPicker: () => void }).showPicker()
          return
        } catch {}
      }
      try {
        input.click()
      } catch {}
    }

    const isAndroidEnv = typeof window !== 'undefined' && isAndroidBridgeAvailable()
    if (!isAndroidEnv) {
      openPcFilePicker()
      return
    }

    setAddPhotoMenuOpen(true)
  }, [vm])

  /**
   *
   * Android：从相册选择（沿用现有高级图片选择器逻辑）。
   *
   */
  const handlePickFromAlbum = useCallback(async () => {
    if (vm.disableDetailEdit) {
      try {
        toast.warning('当前状态不允许修改照片证据')
      } catch {}
      return
    }

    // 先关闭菜单，避免覆盖层与原生界面叠加造成“点不动”的错觉
    setAddPhotoMenuOpen(false)
    setAddPhotoMenuBusy('album')

    try {
      const result = await pickImagesAdvanced({
        title: '选择照片证据',
        selectedItems: vm.localPhotoEvidence ?? [],
        allowMixedFolder: true,
      })
      if (!result?.success) {
        toast.error(result?.message ?? '调用图片选择器失败')
        return
      }
      const next: LocalErpImageItem[] = (result.selected ?? []).map((it) => ({ ...it }))
      vm.setLocalPhotoEvidence(next)
    } catch (error) {
      toast.error(`调用图片选择器异常：${String(error)}`)
    } finally {
      setAddPhotoMenuBusy(null)
    }
  }, [vm])

  /**
   *
   * Android：拍照并自动追加到照片证据里。
   * @remarks
   * - 由原生侧负责：拍照后写入系统相册（MediaStore），并返回可用于高级图片选择器回显的图片项。\\n
   *
   */
  const handleTakePhoto = useCallback(async () => {
    if (vm.disableDetailEdit) {
      try {
        toast.warning('当前状态不允许修改照片证据')
      } catch {}
      return
    }

    setAddPhotoMenuOpen(false)
    setAddPhotoMenuBusy('camera')

    try {
      const result = await takePhoto()
      if (!result?.success) {
        toast.error(result?.message ?? '拍照失败')
        return
      }

      const now = Date.now()
      const nextItem: LocalErpImageItem = {
        id: result.id,
        uri: result.uri,
        path: typeof result.path === 'string' && result.path ? result.path : undefined,
        name: typeof result.name === 'string' && result.name ? result.name : '拍照照片',
        size: typeof result.size === 'number' ? result.size : undefined,
        width: typeof result.width === 'number' ? result.width : undefined,
        height: typeof result.height === 'number' ? result.height : undefined,
        bucketName: typeof result.bucketName === 'string' && result.bucketName ? result.bucketName : undefined,
        mime: typeof result.mime === 'string' && result.mime ? result.mime : undefined,
        dateAdded: typeof result.dateAdded === 'number' && Number.isFinite(result.dateAdded) ? result.dateAdded : now,
        selectedAt: typeof result.selectedAt === 'number' && Number.isFinite(result.selectedAt) ? result.selectedAt : now,
      }

      vm.appendLocalPhotoEvidence([nextItem])
    } catch (error) {
      toast.error(`拍照异常：${String(error)}`)
    } finally {
      setAddPhotoMenuBusy(null)
    }
  }, [vm])

  /**
   *
   * 从“照片证据”列表中移除指定照片。
   * - 对于当前会话内新增的本地图片：仅更新前端状态，不触发后端删除；
   * - 对于服务器返回的远程图片：优先调用 FileController.DeleteNcr 删除云端记录，
   *   删除成功 / 记录不存在 / 无法定位记录时，再更新 UI 隐藏该图片。
   * @param target 要移除的照片项
   *
   */
  const handleRemovePhoto = useCallback(async (target: LocalErpImageItem) => {
    const isLocalPhoto = Boolean(target.localObjectUrl || target.localFile) || !target.isRemoteOnly

    if (!isLocalPhoto && target.cloudFileId && target.cloudFileId > 0) {
      // 远程附件：先尝试删除云端记录
      const deleteResult = await deleteNcrRemotePhoto(target)

      if (deleteResult === 'error') {
        try {
          toast.error('删除云端照片失败，请稍后重试')
        } catch {
          // 忽略 toast 报错，避免影响主流程
        }
        // 删除失败时，不从界面移除，避免前后端状态不一致
        return
      }
      // deleteResult === 'success' | 'not_found' | 'skip' 时，均可安全移除界面上的照片
    }

    // 移除本地临时图片（若存在）
    if (isLocalPhoto) {
      vm.removeLocalPhotoEvidence(target)
      return
    }

    // 远程照片：从 ViewModel 的 serverPhotoEvidence 中移除，避免 UI 层再维护额外 hidden 集合导致“双状态”。
    vm.removeServerPhotoEvidence(target)
  }, [vm])

  /**
   *
   * 合并远程附件与本地临时选择的照片。
   * - vm.serverPhotoEvidence：从 ERP 附件映射而来的远程图片（仅服务器存在）；
   * - vm.localPhotoEvidence：当前会话内通过 Android 相册/拍照 或 PC 选择的本地图片。
   *
   */
  const mergedPhotos: LocalErpImageItem[] = useMemo(
    () =>
      [...(vm.serverPhotoEvidence ?? []), ...(vm.localPhotoEvidence ?? [])],
    [vm.serverPhotoEvidence, vm.localPhotoEvidence],
  )

  const workTypeLabelById = useCallback(
    (id?: number) => {
      const n = typeof id === 'number' ? id : Number(id)
      if (!Number.isFinite(n) || n <= 0) return ''
      const key = String(n)
      const hit =
        (vm.badProcessOptions ?? []).find((o) => o.value === key) ??
        (vm.processOptions ?? []).find((o) => o.value === key)
      return String(hit?.label ?? '').trim()
    },
    [vm.badProcessOptions, vm.processOptions],
  )

  return (
    <>
      <FlowDetailPickDialog
        open={!!vm.pendingDailyPlanFlowDetailPick}
        title="请选择工序明细"
        description="检测到多条“当前工序明细”，请选择要生成不合格返工单的工种"
        candidates={vm.pendingDailyPlanFlowDetailPick?.candidates ?? []}
        busy={vm.dailyPlanPickBusy}
        resolveWorkTypeLabel={workTypeLabelById}
        onPick={(c) => void vm.confirmDailyPlanFlowDetailPick?.(c as any)}
        onCancel={() => vm.cancelDailyPlanFlowDetailPick?.()}
      />

      <Dialog
        open={addPhotoMenuOpen}
        onOpenChange={(next) => {
          // 正在调起原生能力时，避免重复关闭/打开导致状态闪烁
          if (addPhotoMenuBusy) return
          setAddPhotoMenuOpen(next)
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="inset-x-0 bottom-0 top-auto left-0 translate-x-0 translate-y-0 w-full max-w-none rounded-t-xl rounded-b-none p-0 border-x-0 border-b-0"
        >
          {/* Radix Dialog 无障碍约束：必须提供 DialogTitle/Description。这里以 sr-only 方式满足要求，避免干扰现有 UI。 */}
          <DialogTitle className="sr-only">添加照片证据</DialogTitle>
          <DialogDescription className="sr-only">请选择拍照或相册来添加照片证据</DialogDescription>
          <div className="t-card">
            <div className="px-4 py-3 text-sm font-medium border-b border-[var(--color-border)]">
              添加照片证据
            </div>
            <div className="p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
              <div className="grid gap-2">
                <button
                  type="button"
                  className="h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] active:opacity-80 disabled:opacity-60 disabled:pointer-events-none"
                  onClick={handleTakePhoto}
                  disabled={addPhotoMenuBusy != null}
                >
                  拍照
                </button>
                <button
                  type="button"
                  className="h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] active:opacity-80 disabled:opacity-60 disabled:pointer-events-none"
                  onClick={handlePickFromAlbum}
                  disabled={addPhotoMenuBusy != null}
                >
                  相册
                </button>
                <button
                  type="button"
                  className="h-11 w-full rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-fg-muted)] active:opacity-80 disabled:opacity-60 disabled:pointer-events-none"
                  onClick={() => setAddPhotoMenuOpen(false)}
                  disabled={addPhotoMenuBusy != null}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DocumentPageLayout
      className="w-full"
      sectionClassName={styles.frame}
      headerWrapperClassName={`${styles.top} pt-2 pb-1`}
      detailsWrapperClassName={`mt-0 ${styles.middle} pt-1 pb-2`}
      readOnly={vm.disableDetailEdit}
      header={
        <>
          {/* 顶部操作按钮：新增 / 删除 / 刷新 */}
          <div className="mt-2">
            <HeaderActions
              onCreate={() => vm.createNewBill()}
              onDelete={() => void vm.handleDeleteBill()}
              onRefresh={() => void vm.handleRefresh()}
            />
          </div>
          <HeaderSection
            entity={vm.bill}
            materialCode={vm.materialCode}
            onChange={vm.updateBill}
            processOptions={vm.processOptions}
            badProcessOptions={vm.badProcessOptions}
            inspectorOptions={vm.inspectorOptions}
            judgeOptions={vm.judgeOptions}
            toNonNegInt={vm.toNonNegInt}
            readOnly={vm.disableDetailEdit}
          />
        </>
      }
      details={
        <div className="grid h-full grid-rows-2 gap-2 overflow-hidden">
          {/* 上半部分：记录行列表（占用上半区） */}
          <section className="flex flex-col min-h-0 overflow-hidden">
            {/* 顶部操作行：左侧“+”，行中央标签 */}
            <div className="mb-2 relative flex items-center shrink-0">
              <button
                type="button"
                aria-label="新增明细"
                onClick={vm.disableDetailEdit ? undefined : vm.addDetail}
                disabled={vm.disableDetailEdit}
                className="t-accent size-[26px] !min-h-[26px] !h-[26px] !px-0 rounded-[var(--radius-md)] text-sm flex items-center justify-center"
                title="新增"
              >
                +
              </button>
              <Label className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[12px] leading-[26px] opacity-70">
                不合格记录
              </Label>
            </div>
            <DetailsCardList
              items={vm.details}
              getKey={(it) => vm.getDetailKey(it)}
              className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden min-h-0"
              itemClassName="t-card w-full p-2"
              renderItem={({ item, index }) => (
                <div className="grid grid-cols-[max-content_1fr_28px] items-center gap-2">
                  <Label className="text-[13px]">{`记录${index + 1}`}</Label>
                  <Input
                    value={item.Adversesituation ?? ''} // 兜底空串，避免受控/非受控切换告警
                    onChange={(e) => vm.changeDetailReason(vm.getDetailKey(item), e.target.value)}
                    disabled={vm.disableDetailEdit}
                    readOnly={vm.disableDetailEdit}
                    className="text-[13px]"
                    style={shortInputStyle}
                    aria-label={`第${index + 1}行-记录`}
                  />
                  <CloseIconButton
                    ariaLabel="删除明细"
                    onClick={vm.disableRemoveDetail ? undefined : () => vm.removeDetail(vm.getDetailKey(item))}
                    title="删除"
                    disabled={vm.disableRemoveDetail as any}
                  />
                </div>
              )} 
            />
          </section>

          {/* 下半部分：PhotoGrid（占用下半区） */}
          <section className="flex flex-col min-h-0 overflow-hidden">
            <Label className="text-[12px] opacity-70 mb-1 shrink-0">照片证据</Label>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <PhotoGrid
                photos={mergedPhotos}
                onAdd={handleAddPhoto}
                readOnly={vm.disableDetailEdit}
                onRemovePhoto={handleRemovePhoto}
              />
            </div>
            {/* PC 环境下的本地文件选择 input（对用户隐藏，只由按钮事件触发） */}
            <input
              ref={pcFileInputRef}
              type="file"
              accept="image/*"
              multiple
              tabIndex={-1}
              className="sr-only"
              onChange={handlePcFileChange}
            />
          </section>
        </div>
      }
      footer={
        <>
          {/* 调试功能悬浮按钮：提供“模拟扫码” */}
          <DebugFab menuItems={debugMenuItems} />
          {/* 底部审批操作条：左“审批”/右“反审批” */}
          <ApproveFooterBar
            approveDisabled={vm.approveDisabled}
            unapproveDisabled={vm.unapproveDisabled}
            onApprove={() => {
              void vm.handleApprove()
            }}
            onUnapprove={() => {
              void vm.handleUnapprove()
            }}
          />
        </>
      }
      />
    </>
  )
}

/**
 *
 * 短输入框统一内联样式（高度与内边距）。
 *
 */
const shortInputStyle: CSSProperties = {
  height: '26px',
  minHeight: '26px',
  paddingInline: '4px',
}

// GridSelect 现为跨页面可复用组件：见 '@/components/ui/grid-select'

/**
 *
 * 单据头部组件。
 * - 采用“标签 + 控件”紧凑网格，保证移动端易读与对齐。
 *
 */
function HeaderSection({
  entity,
  materialCode,
  onChange,
  processOptions,
  badProcessOptions,
  inspectorOptions,
  judgeOptions,
  toNonNegInt,
  readOnly,
}: {
  entity: DefectiveReworkOrderDocument
  materialCode: string
  onChange: (patch: Partial<DefectiveReworkOrderDocument>) => void
  processOptions: { label: string; value: string }[]
  badProcessOptions: { label: string; value: string }[]
  inspectorOptions: { label: string; value: string }[]
  judgeOptions: { label: string; value: string }[]
  toNonNegInt: (v: number | '' | undefined) => number
  readOnly: boolean
}) {
  const view = entity as unknown as {
    Code?: string
    MaterialCode?: string
    OrderNo?: string
    InnerKey?: string
    TypeofWorkid?: number
    ReworkTypeofWorkid?: number
    ReworkTypeofWork2id?: number
    Employeeid?: number
    CheckResult?: number
    PreCmpBQty?: number
    NotPassBQty?: number
    status?: number
  }

  const toText = (v: unknown): string => (v == null ? '' : String(v))
  const materialCodeText = toText((view as any)?.MaterialCode ?? (view as any)?.materialCode ?? materialCode)
  const orderNoText = toText((view as any)?.InnerKey ?? (view as any)?.innerKey ?? (view as any)?.OrderNo ?? (view as any)?.orderNo)

  /**
   *
   * 处理“不合格数”输入变更。
   * - 统一做非负保护，避免出现 NaN/负数。
   *
   */
  const onNgQtyChange = useCallback(
    (v: number | '') =>
      onChange({ NotPassBQty: toNonNegInt(v) } as Partial<DefectiveReworkOrderDocument>),
    [onChange, toNonNegInt],
  )

  return (
    <div className="w-full space-y-1.5">
      {/* 第一行：单据编号、物料编码、状态（状态此处仅示例文本，可扩展为主题色） */}
      <div className="grid grid-cols-[60px_1fr_60px_1fr_60px] items-center gap-x-2">
        <Label className="text-[13px]">单据编号</Label>
        <Input
          value={view.Code ?? ''}
          disabled
          readOnly
          className="text-[13px]"
          style={shortInputStyle}
          aria-label="单据编号"
        />
        <Label className="text-[13px]">物料编码</Label>
        <Input
          value={materialCodeText}
          disabled
          readOnly
          className="text-[13px]"
          style={shortInputStyle}
          aria-label="物料编码"
        />
        <span
          className={`text-center text-[13px] ${getStatusTextClass(
            (view.status ?? DocumentStatus.未审批) as number,
          )}`}
          aria-label="单据状态"
        >
          {documentStatusToText(
            (view.status ?? DocumentStatus.未审批) as DocumentStatus | number,
          )}
        </span>
      </div>

      {/* 第二行：制令单号、工种 */}
      <div className="grid grid-cols-[60px_1fr_48px_1fr] items-center gap-x-2">
        <Label className="text-[13px]">制令单号</Label>
        <Input
          value={orderNoText}
          disabled
          readOnly
          className="text-[13px]"
          style={shortInputStyle}
          aria-label="制令单号"
        />
        <Label className="text-[13px]">工种</Label>
        <GridSelect
          value={view.TypeofWorkid != null ? String(view.TypeofWorkid) : ''}
          onChange={(v) =>
            onChange({
              TypeofWorkid: v ? Number(v) : 0,
            } as Partial<DefectiveReworkOrderDocument>)
          }
          options={processOptions}
          ariaLabel="工种"
          style={shortInputStyle}
          disabled={readOnly}
        />
      </div>

      {/* 第三行：送检数、检验员、判定 */}
      <div className="grid grid-cols-[48px_72px_48px_1fr_36px_1fr] items-center gap-x-2">
        <Label className="text-center text-[13px]">送检数</Label>
        <Input
          value={String(view.PreCmpBQty ?? 0)}
          disabled
          readOnly
          className="text-[13px]"
          style={shortInputStyle}
          aria-label="送检数"
        />
        <Label className="text-right text-[13px] t-text-error">检验员</Label>
        <GridSelect
          value={view.Employeeid != null ? String(view.Employeeid) : ''}
          onChange={(v) =>
            onChange({
              Employeeid: v ? Number(v) : 0,
            } as Partial<DefectiveReworkOrderDocument>)
          }
          options={inspectorOptions}
          ariaLabel="检验员"
          style={shortInputStyle}
          disabled={readOnly}
        />
        <Label className="text-center text-[13px] t-text-error">判定</Label>
        <GridSelect
          value={view.CheckResult != null ? String(view.CheckResult) : ''}
          onChange={(v) =>
            onChange({
              CheckResult: v ? Number(v) : 0,
            } as Partial<DefectiveReworkOrderDocument>)
          }
          options={judgeOptions}
          ariaLabel="判定"
          style={shortInputStyle}
          disabled={readOnly}
        />
      </div>

      {/* 第四行：返工工序、返工工序2 */}      
      <div className="grid grid-cols-[72px_1fr_84px_1fr] items-center gap-x-2">
        <Label className="text-[13px]">返工工序</Label>
        <GridSelect
          value={view.ReworkTypeofWorkid != null ? String(view.ReworkTypeofWorkid) : ''}
          onChange={(v) =>
            onChange({
              ReworkTypeofWorkid: v ? Number(v) : 0,
            } as Partial<DefectiveReworkOrderDocument>)
          }
          options={badProcessOptions}
          ariaLabel="返工工序"
          style={shortInputStyle}
          disabled={readOnly}
        />
        <Label className="text-[13px]">返工工序2</Label>
        <GridSelect
          value={view.ReworkTypeofWork2id != null ? String(view.ReworkTypeofWork2id) : ''}
          onChange={(v) =>
            onChange({
              ReworkTypeofWork2id: v ? Number(v) : 0,
            } as Partial<DefectiveReworkOrderDocument>)
          }
          options={badProcessOptions}
          ariaLabel="返工工序2"
          style={shortInputStyle}
          disabled={readOnly}
        />
      </div>

      {/* 第五行：不合格数 */}      
      <div className="grid grid-cols-[72px_1fr] items-center gap-x-2">
        <Label className="text-[13px]">不合格数</Label>
        <NumberInput
          value={view.NotPassBQty ?? 0}
          onValueChange={onNgQtyChange}
          onChange={onNgQtyChange}
          className="text-[13px]"
          ariaLabel="不合格数"
          style={shortInputStyle}
          disabled={readOnly}
        />
      </div>
    </div>
  )
}

/**
 *
 * 根据单据状态返回主题文本颜色类名。
 * - 未审批：红色（t-text-error）
 * - 已审批：绿色（t-text-success）
 * - 其它：默认主文本色（t-text-primary）
 *
 */
function getStatusTextClass(status: number): string {
  if (hasStatusFlag(status, DocumentStatus.未审批)) return 't-text-error'
  if (hasStatusFlag(status, DocumentStatus.已审批)) return 't-text-success'
  return 't-text-primary'
}

/**
 *
 * 顶部操作按钮区：提供“新增/删除/刷新”。
 * - 与 FQC 页面保持一致的视觉与行为。
 *
 */
function HeaderActions({
  onCreate,
  onDelete,
  onRefresh,
}: {
  onCreate: () => void | Promise<void>
  onDelete: () => void | Promise<void>
  onRefresh: () => void | Promise<void>
}) {
  return (
    <div
      className="grid grid-cols-3 gap-0 w-full border border-[#797979]"
      style={{ height: '24px', minHeight: '24px' }}
    >
      <button
        type="button"
        aria-label="新增"
        className="w-full h-full leading-[24px] px-0 py-0 text-[12px] rounded-none bg-[#0079FE] text-white"
        onClick={() => void onCreate()}
      >
        新增
      </button>
      <button
        type="button"
        aria-label="删除"
        className="w-full h-full leading-[24px] px-0 py-0 text-[12px] rounded-none border-l border-[#797979]"
        onClick={() => void onDelete()}
      >
        删除
      </button>
      <button
        type="button"
        aria-label="刷新"
        className="w-full h-full leading-[24px] px-0 py-0 text-[12px] rounded-none border-l border-[#797979]"
        onClick={() => void onRefresh()}
      >
        刷新
      </button>
    </div>
  )
}

interface PhotoPreviewMeta {
  /**
   *
   * 缩略图/预览图的 data URL。
   *
   */
  src?: string
  /**
   *
   * 原图（大图）data URL，用于覆盖层查看。
   *
   */
  fullSrc?: string
  /**
   *
   * 预览图加载中的标记。
   *
   */
  loading?: boolean
  /**
   *
   * 原图加载中的标记。
   *
   */
  fullLoading?: boolean
  /**
   *
   * 预览图加载错误信息。
   *
   */
  error?: string
  /**
   *
   * 原图加载错误信息。
   *
   */
  fullError?: string
}

interface PhotoViewerState {
  /**
   *
   * 当前正在查看的照片项，用于从列表中执行删除等操作。
   *
   */
  photo: LocalErpImageItem
  /**
   *
   * 用于覆盖层查看的当前图片地址（优先原图）。
   *
   */
  src: string
  /**
   *
   * 图片的描述文本，回传给覆盖层的 alt/title。
   *
   */
  alt?: string
}

/**
 *
 * 为图片生成稳定的 key。
 * - 优先使用 id，其次 uri/path，避免列表渲染时 key 变化。
 *
 */
function getPhotoKey(item: ErpImageItem): string {
  if (item.id) return item.id
  if (item.uri) return item.uri
  if (item.path) return item.path
  return JSON.stringify(item)
}

/**
 *
 * 照片网格组件
 * - 展示照片缩略图，并在末尾显示新增按钮。
 * - 内部通过 loadImageBase64 统一拉取 preview base64：
 *   - 优先尝试 Android 本机图片；
 *   - 若本机无文件或读取失败，则降级到 ERP.WebApi FileController 下载。
 *
 */
function PhotoGrid({
  photos,
  onAdd,
  readOnly,
  onRemovePhoto,
}: {
  photos: LocalErpImageItem[]
  onAdd: () => void | Promise<void>
  readOnly?: boolean
  onRemovePhoto?: (photo: LocalErpImageItem) => void | Promise<void>
}) {
  const [previewState, setPreviewState] = useState<Record<string, PhotoPreviewMeta>>({})
  const previewStateRef = useRef<Record<string, PhotoPreviewMeta>>({})

  /**
   *
   * 当前正在覆盖层中查看的照片信息。
   * - 仅在有有效 src（base64 预览）时才会被设置。
   *
   */
  const [viewerState, setViewerState] = useState<PhotoViewerState | null>(null)

  /**
   *
   * 从覆盖层中删除当前正在查看的照片：
   * - 调用 onRemovePhoto 通知上层更新列表；
   * - 删除成功后自动关闭覆盖层。
   *
   */
  const handleRemoveCurrentPhoto = useCallback(async () => {
    if (!viewerState || !onRemovePhoto || readOnly) return
    try {
      await onRemovePhoto(viewerState.photo)
    } finally {
      setViewerState(null)
    }
  }, [viewerState, onRemovePhoto, readOnly])

  /**
   *
   * 打开覆盖层查看指定照片：
   * - 若已缓存原图，则直接使用原图；
   * - 否则先用预览图占位，再异步拉取原图并替换。
   * @param photo   照片项
   * @param preview 当前已加载的预览元数据
   *
   */
  const openInViewer = useCallback(
    async (photo: LocalErpImageItem, preview?: PhotoPreviewMeta) => {
      const key = getPhotoKey(photo)
      const existing = previewStateRef.current[key]
      const altText = photo.name || '照片证据'
      const previewSrc = existing?.src ?? preview?.src

      // PC 本地文件：直接使用本地 URL 作为原图。
      if (photo.localObjectUrl) {
        const localSrc = photo.localObjectUrl
        setPreviewState((prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] ?? {}),
            src: prev[key]?.src ?? previewSrc ?? localSrc,
            fullSrc: localSrc,
            loading: false,
            fullLoading: false,
            error: undefined,
            fullError: undefined,
          },
        }))
        setViewerState({ photo, src: localSrc, alt: altText })
        return
      }

      // 已有原图缓存：直接使用。
      if (existing?.fullSrc) {
        setViewerState({ photo, src: existing.fullSrc, alt: altText })
        return
      }

      // 原图正在加载中：如果有预览则先展示预览。
      if (existing?.fullLoading) {
        if (previewSrc) {
          setViewerState({ photo, src: previewSrc, alt: altText })
        }
        return
      }

      // 先标记原图加载中，并在有预览图时展示预览。
      setPreviewState((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] ?? {}),
          fullLoading: true,
          fullError: undefined,
        },
      }))

      if (previewSrc) {
        setViewerState({ photo, src: previewSrc, alt: altText })
      }

      try {
        const loadResult = await loadImageBase64(photo as ErpImageItem, {
          type: 'original',
          maxDim: 2048,
        })

        if (!loadResult.success || !loadResult.base64) {
          setPreviewState((prev) => ({
            ...prev,
            [key]: {
              ...(prev[key] ?? {}),
              fullLoading: false,
              fullError: loadResult.message ?? '加载原图失败',
            },
          }))
          return
        }

        const mime = loadResult.mime || 'image/jpeg'
        const fullSrc = `data:${mime};base64,${loadResult.base64}`

        setPreviewState((prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] ?? {}),
            fullSrc,
            fullLoading: false,
            fullError: undefined,
          },
        }))

        setViewerState({ photo, src: fullSrc, alt: altText })
      } catch (error) {
        setPreviewState((prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] ?? {}),
            fullLoading: false,
            fullError: String(error),
          },
        }))
      }
    },
    [],
  )

  // 同步 ref，供异步加载逻辑读取最新状态。
  useEffect(() => {
    previewStateRef.current = previewState
  }, [previewState])

  /**
   *
   * 根据当前 photos 列表，按需拉取图片的预览 base64。
   * - 仅对尚未有 src 且未在加载中的项触发请求。
   * - 使用取消标记避免组件卸载后继续 setState。
   *
   */
  useEffect(() => {
    if (!photos.length) return

    let canceled = false

    const loadPreviews = async () => {
      await Promise.all(
        photos.map(async (photo) => {
          const key = getPhotoKey(photo)
          const existing = previewStateRef.current[key]

          // PC 本地文件：直接使用本地预览 URL，避免走 Android/服务器加载逻辑。
          if (photo.localObjectUrl) {
            const localSrc = photo.localObjectUrl
            setPreviewState((prev) => {
              if (canceled) return prev
              const current = prev[key]
              if (current?.src === localSrc) return prev
              return {
                ...prev,
                [key]: {
                  ...(current ?? {}),
                  src: localSrc,
                  loading: false,
                  error: undefined,
                },
              }
            })
            return
          }

          if (existing?.src || existing?.loading) return
          if (canceled) return

          setPreviewState((prev) => {
            if (canceled) return prev
            const current = prev[key]
            if (current?.src || current?.loading) return prev
            return {
              ...prev,
              [key]: {
                ...current,
                loading: true,
                error: undefined,
              },
            }
          })

          try {
            const loadResult = await loadImageBase64(photo as ErpImageItem, {
              type: 'preview',
              maxDim: 512,
            })
            if (canceled) return
            if (!loadResult.success || !loadResult.base64) {
              setPreviewState((prev) => {
                if (canceled) return prev
                return {
                  ...prev,
                  [key]: {
                    ...(prev[key] ?? {}),
                    loading: false,
                    error: loadResult.message ?? '获取预览失败',
                  },
                }
              })
              return
            }

            const mime = loadResult.mime || 'image/jpeg'
            const src = `data:${mime};base64,${loadResult.base64}`

            setPreviewState((prev) => {
              if (canceled) return prev
              return {
                ...prev,
                [key]: {
                  ...(prev[key] ?? {}),
                  loading: false,
                  error: undefined,
                  src,
                },
              }
            })
          } catch (error) {
            if (canceled) return
            setPreviewState((prev) => {
              if (canceled) return prev
              return {
                ...prev,
                [key]: {
                  ...(prev[key] ?? {}),
                  loading: false,
                  error: String(error),
                },
              }
            })
          }
        }),
      )
    }

    void loadPreviews()

    return () => {
      canceled = true
    }
  }, [photos])

  // 默认显示一行 4 个格子。
  return (
    <>
      <div className="grid grid-cols-4 gap-2 p-1">
        {photos.map((photo) => {
          const key = getPhotoKey(photo)
          const meta = previewState[key]
          const hasImage = Boolean(meta?.src)
          const isLoading = meta?.loading && !meta?.src
          const hasError = Boolean(meta?.error && !meta?.src)

          const handleCellClick = () => {
            void openInViewer(photo, meta)
          }

          return (
            <div
              key={key}
              className="relative aspect-square bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md overflow-hidden"
              onClick={hasImage ? handleCellClick : undefined}
            >
              {hasImage ? (
                <img
                  src={meta!.src}
                  alt={photo.name || '照片证据'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[12px] text-[var(--color-fg-muted)]">
                  {isLoading && '加载中...'}
                  {hasError && !isLoading && '加载失败'}
                  {!isLoading && !hasError && '等待加载'}
                </div>
              )}
            </div>
          )
        })}
        {!readOnly && (
          <button
            type="button"
            onClick={onAdd}
            className="aspect-square flex items-center justify-center border border-dashed border-[var(--color-border)] rounded-md text-[var(--color-fg)] hover:bg-[var(--color-surface)] transition-colors"
            title="添加照片"
          >
            <span className="text-2xl opacity-50">+</span>
          </button>
        )}
      </div>

      {viewerState && (
        <ImageOverlayViewer
          open={Boolean(viewerState)}
          src={viewerState.src}
          alt={viewerState.alt}
          title={viewerState.alt}
          description="双指捏合缩放，拖动平移查看照片细节"
          onOpenChange={(next) => {
            if (!next) setViewerState(null)
          }}
          toolbar={(toolbarProps: ImageOverlayViewerToolbarProps) => (
            <div className="pointer-events-auto flex w-full max-w-[280px] items-center justify-between gap-3 px-3 py-2 t-card t-glass">
              <div className="text-[11px] text-[var(--color-fg-muted)]">
                缩放：{Math.round(toolbarProps.scale * 100)}%
              </div>
              {!readOnly && onRemovePhoto && (
                <button
                  type="button"
                  aria-label="删除照片"
                  title="删除照片"
                  className="flex h-8 w-8 items-center justify-center rounded-full border bg-[var(--color-error-bg)] text-[var(--color-error-fg)] border-[var(--color-error-fg)] shadow-sm disabled:opacity-60 disabled:pointer-events-none"
                  onClick={handleRemoveCurrentPhoto}
                  disabled={readOnly}
                >
                  <Trash2Icon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        />
      )}
    </>
  )
}
