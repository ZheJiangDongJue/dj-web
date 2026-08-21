'use client'
import { useFeaturesPageTitle } from '@/app/features/_components'
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import GridSelect from '@/components/ui/grid-select'
import { NumberInput } from '@/components/ui/number-input'
import DocumentPageLayout from '@/app/features/common/documents/DocumentPageLayout'
import { DetailsCardList } from '@/components/molecules/DetailsCardList'
import { CloseIconButton } from '@/components/ui/close-icon-button'
import ApproveFooterBar from '@/app/features/common/documents/ApproveFooterBar'
import DocumentHeaderActions from '@/app/features/common/documents/DocumentHeaderActions'
import DebugFab from '@/components/molecules/DebugFab'
import { focusComboboxByAriaLabel } from '@/lib/dom/focusCombobox'
import { shouldUseDefaultMeasureFrequency } from '@/lib/documents/inspection'
import { useDocumentLeaveGuard } from '@/lib/documents/useDocumentLeaveGuard'
import {
  allowNextDocumentLeaveConfirmation,
  confirmDocumentLeave,
} from '@/lib/documents/document-leave-confirmation'
import { useFqcViewModelClass as useFqcVM } from './viewmodels/FqcViewModelClass'
import { DocumentStatus } from '@/types/erp-db.generated'
import { type RequiredFieldRegistration } from '@/lib/validation/requiredFieldManager'
import { hasStatusFlag, documentStatusToText } from '../shared/helpers'
import FlowDetailPickDialog from '../shared/FlowDetailPickDialog'
import { MeasureRecordInput } from '../shared/MeasureRecordInput'
import { MeasureRequiredRegistrar } from '../shared/MeasureRequiredRegistrar'
import { FqcLookupWarmupStrip, useFqcLookup } from './FqcLookupProvider'

/**
 *
 * 将任意值安全地转换为展示字符串。
 * - null/undefined -> ''
 * - 其他类型走 String()，但会过滤 'undefined'/'null' 文本
 *
 */
function toDisplayStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return s === 'undefined' || s === 'null' ? '' : s
}

/**
 *
 * 将值转换为数字或空串，供 NumberInput 使用。
 * - null/undefined/''/NaN -> ''
 * - 其余可解析为有限数字则返回数字
 *
 */
function toNumOrEmpty(v: unknown): number | '' {
  if (v === '' || v === null || v === undefined) return ''
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : ''
}

/**
 *
 * 将 URL 查询参数中的单据ID解析为正整数。
 * - 支持：'123' / 'id:123' / 'id：123'
 * - 非法或 <=0 返回 null
 *
 */
function parseBillIdFromQuery(v: string | null | undefined): number | null {
  const raw = String(v ?? '').trim()
  if (!raw) return null
  const match = raw.match(/^(?:id\s*[:：]\s*)?(\d+)$/i)
  const n = match ? Number(match[1]) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 *
 * 末件检验（客户端）View
 * - 仅负责渲染与绑定，所有流程/服务逻辑下沉至 ViewModel(useFqcViewModel)
 * @param initialScanCode 可选的 URL 透传参数：用于自动打开“日计划明细 → 末件检验草稿”
 *
 */
export default function ClientPage({ initialScanCode }: { initialScanCode?: string | null }) {
  useFeaturesPageTitle('末件检验')
  const ROW_GAP_PX = 2 as const
  return <FqcBody rowGap={ROW_GAP_PX} initialScanCode={initialScanCode} />
}

/**
 *
 * 页面主体：绑定 VM，渲染头/明细/底部操作条
 *
 */
import { useFqcExternal } from './viewmodels/useFqcExternal'

function FqcBody({ rowGap, initialScanCode }: { rowGap: number; initialScanCode?: string | null }) {
  const vmStore = useFqcVM()
  const vm = useFqcExternal(vmStore)
  useDocumentLeaveGuard(vm.shouldConfirmLeave)
  const router = useRouter()
  const lookup = useFqcLookup()
  const searchParams = useSearchParams()
  const queryId = searchParams.get('id')
  const queryScanCode = searchParams.get('scancode')
  const lastAutoOpenKeyRef = useRef<string | null>(null)
  const openRequestSeqRef = useRef(0)
  const [isOpeningById, setIsOpeningById] = useState(() => parseBillIdFromQuery(queryId) !== null)

  useEffect(() => {
    vm.applyLookupSnapshot(lookup)
  }, [lookup, vm])

  useEffect(() => {
    vm.setNcrPromptNavigation((href) => {
      void confirmDocumentLeave().then((allowed) => {
        if (!allowed) return
        allowNextDocumentLeaveConfirmation()
        router.replace(href)
      })
    })
    return () => vm.setNcrPromptNavigation(null)
  }, [router, vm])

  // 共享基础联查完成后仍需等待 ?id 对应的单据加载完成，避免用户在空白默认单据上误操作。
  const isPagePreparing = lookup.phase === 'idle' || lookup.phase === 'loading' || isOpeningById

  // 当前检验工序由单据字段 TypeofWorkid 控制，不再在 View 层推导选中项

  // 支持 URL 参数自动打开：
  // 1) ?id=Number：直接打开末件检验单据
  // 2) ?scancode=RJH-...：按日计划明细条码生成/打开末件检验草稿（避免与扫码入口重复逻辑）
  useEffect(() => {
    // 1) 优先处理单据ID：避免同时存在 id 与 scancode 时发生覆盖/竞态
    const rawId = String(queryId ?? '').trim()
    if (rawId) {
      const billId = parseBillIdFromQuery(rawId)
      if (billId) {
        const key = `id:${billId}`
        if (lastAutoOpenKeyRef.current !== key) {
          lastAutoOpenKeyRef.current = key
          const requestSeq = openRequestSeqRef.current + 1
          openRequestSeqRef.current = requestSeq
          setIsOpeningById(true)
          void (async () => {
            try {
              await vm.openById?.(billId)
            } finally {
              if (openRequestSeqRef.current === requestSeq) setIsOpeningById(false)
            }
          })()
        }
        return
      }
    }

    // 当前 URL 不再指向单据时，终止上一轮打开请求对页面准备态的影响。
    openRequestSeqRef.current += 1
    setIsOpeningById(false)

    // 2) 处理 scancode（优先使用客户端 searchParams，其次使用服务端透传的初始值）
    const rawScanCode = (queryScanCode ?? initialScanCode ?? '').trim()
    if (!rawScanCode) return
    const key = `scancode:${rawScanCode}`
    if (lastAutoOpenKeyRef.current === key) return
    lastAutoOpenKeyRef.current = key
    void vm.tryOpenFinalInspectionByDailyPlanDetailScanCode(rawScanCode)
  }, [queryId, queryScanCode, initialScanCode, vm])

  const workTypeLabelById = useCallback(
    (id?: number) => {
      const n = typeof id === 'number' ? id : Number(id)
      if (!Number.isFinite(n) || n <= 0) return ''
      const key = String(n)
      const hit = (vm.processOptions ?? []).find((o) => o.value === key)
      return String(hit?.label ?? '').trim()
    },
    [vm.processOptions],
  )

  const detailItemClassName = [
    't-card w-full p-2',
    vm.getDetailCardBorderClass(vm.status),
  ]
    .filter(Boolean)
    .join(' ')

  const handleRemoveDetailAt = useCallback(
    (detailKey: string) => vm.removeDetailByKey(detailKey),
    [vm],
  )

  const handleSetMeasureAtRow = useCallback(
    (detailKey: string, measureIndex: number, v: string) =>
      vm.setMeasureByDetailKey(detailKey, measureIndex, v),
    [vm],
  )

  return (
    <>
      <FlowDetailPickDialog
        open={!!vm.pendingDailyPlanFlowDetailPick}
        title="请选择工序明细"
        description="检测到多条“当前工序明细”，请选择要生成末件检验的工种"
        candidates={vm.pendingDailyPlanFlowDetailPick?.candidates ?? []}
        busy={vm.dailyPlanPickBusy}
        resolveWorkTypeLabel={workTypeLabelById}
        onPick={(c) => void vm.confirmDailyPlanFlowDetailPick?.(c as any)}
        onCancel={() => vm.cancelDailyPlanFlowDetailPick?.()}
      />

      <DocumentPageLayout
        className="w-full"
        readOnly={isPagePreparing || vm.disableDetailEdit}
        header={(
          <>
            <div className="mt-2">
              <DocumentHeaderActions
                onCreate={() => vm.createNewBill()}
                onDelete={() => void vm.handleDelete()}
                onRefresh={() => void vm.handleRefresh()}
                deleteBusy={vm.busyActionName === '删除'}
                refreshBusy={vm.busyActionName === '刷新'}
                globalBusy={vm.actionBusy && vm.busyActionName !== '删除' && vm.busyActionName !== '刷新'}
              />
            </div>
            <FqcLookupWarmupStrip state={lookup} className="mt-2" />
            <HeaderDocument
              rowGap={rowGap}
              registerRequired={vm.registerRequired}
              bill={vm.bill}
              status={vm.status}
              materialCode={vm.materialCode}
              processName={vm.processName}
              onSetBill={(key, value) => vm.setBill(key, value)}
              onJudgeChange={(v) => vm.handleJudgeChange(v)}
              onChangeInspect={(v) => vm.handleChangeInspect(v)}
              onChangePass={(v) => vm.handleChangePass(v)}
              onChangeNg={(v) => vm.handleChangeNg(v)}
              onChangeAllow={(v) => vm.handleChangeAllow(v)}
              inspectorOptions={vm.inspectorOptions}
              processOptions={vm.processOptions}
            />
          </>
        )}
        details={(
          <FqcDetailsSection
            details={vm.details}
            itemClassName={detailItemClassName}
            disableDetailEdit={vm.disableDetailEdit}
            disableRemoveDetail={vm.disableRemoveDetail}
            parseMeasureFrequency={vm.parseMeasureFrequency}
            registerRequired={vm.registerRequired}
            getDetailKey={(detail) => vm.getDetailKey(detail)}
            onRemoveDetailAt={handleRemoveDetailAt}
            onSetMeasureAtRow={handleSetMeasureAtRow}
          />
        )}
        footer={(
          <>
            <DebugFab visible={isPagePreparing ? false : undefined} menuItems={vm.debugMenu} />
            <ApproveFooterBar
              onApprove={() => void vm.handleApprove()}
              onUnapprove={() => void vm.handleUnapprove()}
              approveDisabled={isPagePreparing || vm.disableApprove}
              unapproveDisabled={isPagePreparing || vm.disableUnapprove}
              approveBusy={vm.busyActionName === '审批'}
              unapproveBusy={vm.busyActionName === '反审批'}
              globalBusy={vm.actionBusy && vm.busyActionName !== '审批' && vm.busyActionName !== '反审批'}
            />
          </>
        )}
      />
    </>
  )
}

/**
 *
 * 末件检验明细区（性能敏感）。
 * - 表头“边输边联动”会频繁触发 VM emit；此处通过 memo 避免明细列表在“仅表头变更”时重复渲染。
 * - 仅当 details 引用变化或可编辑状态变化时才重渲染。
 *
 */
const FqcDetailsSection = memo(function FqcDetailsSection({
  details,
  itemClassName,
  disableDetailEdit,
  disableRemoveDetail,
  parseMeasureFrequency,
  registerRequired,
  getDetailKey,
  onRemoveDetailAt,
  onSetMeasureAtRow,
}: {
  details: any[]
  itemClassName: string
  disableDetailEdit: boolean
  disableRemoveDetail: boolean
  parseMeasureFrequency: (freq: unknown) => number
  registerRequired: (key: string, registration: RequiredFieldRegistration<unknown>) => () => void
  getDetailKey: (detail: any) => string
  onRemoveDetailAt: (detailKey: string) => void
  onSetMeasureAtRow: (detailKey: string, measureIndex: number, v: string) => void
}) {
  return (
    <DetailsCardList
      items={details}
      getKey={(item) => getDetailKey(item)}
      itemClassName={itemClassName}
      renderItem={({ item, index }) => {
        const detailKey = getDetailKey(item)
        const enabledCount = parseMeasureFrequency((item as any).Frequency)
        const requireAtLeastOneMeasure = shouldUseDefaultMeasureFrequency((item as any).Frequency)
        return (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[14px] font-medium">{(item as any).ProjectName}</div>
              <CloseIconButton
                ariaLabel="删除明细"
                onClick={() => onRemoveDetailAt(detailKey)}
                disabled={disableRemoveDetail}
              />
            </div>

            <div className="grid grid-cols-[26px_1fr_26px_1fr] items-center gap-x-[6px] gap-y-[6px]">
              <Label className="text-[12px]">要求</Label>
              <Input
                value={toDisplayStr((item as any).Content)}
                readOnly
                disabled
                className="text-[13px]"
                style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
              />
              <Label className="text-[12px]">方法</Label>
              <Input
                value={toDisplayStr((item as any).Method)}
                readOnly
                disabled
                className="text-[13px]"
                style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
              />
            </div>

            <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-[6px] gap-y-[6px] sm:grid-cols-[26px_58px_26px_58px_26px_58px_26px_1fr]">
              <Label className="text-[12px]">频率</Label>
              <Input
                value={toDisplayStr((item as any).Frequency)}
                readOnly
                disabled
                className="text-[13px]"
                style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
              />
              <Label className="text-[12px]">上限</Label>
              <Input
                value={toDisplayStr((item as any).UpQValue)}
                readOnly
                disabled
                className="text-[13px]"
                style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
              />
              <Label className="text-[12px]">下限</Label>
              <Input
                value={toDisplayStr((item as any).DownQValue)}
                readOnly
                disabled
                className="text-[13px]"
                style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
              />
              <Label className="text-[12px]">对比</Label>
              <Input
                value={toDisplayStr((item as any).CmpQValue)}
                readOnly
                disabled
                className="text-[13px]"
                style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
              />
            </div>

            <div className="mt-2 grid grid-cols-[auto_repeat(5,minmax(0,1fr))] items-center gap-x-[6px] sm:grid-cols-[50px_repeat(5,58px)]">
              <Label className="text-[12px]">实测1~5</Label>
              {[
                (item as any).MeasuredRecord1,
                (item as any).MeasuredRecord2,
                (item as any).MeasuredRecord3,
                (item as any).MeasuredRecord4,
                (item as any).MeasuredRecord5,
              ].map((s, i) => (
                <MeasureRecordInput
                  key={i}
                  value={toDisplayStr(s)}
                  // 实测项仅在失焦提交：避免移动端每次按键都触发整页刷新导致输入卡顿
                  onChange={(nv) => onSetMeasureAtRow(detailKey, i, nv)}
                  disabled={i >= enabledCount || disableDetailEdit}
                  className="text-right"
                  style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
                  ariaLabel={`明细第${index + 1}行-实测${i + 1}`}
                />
              ))}
            </div>
            <MeasureRequiredRegistrar
              rowKey={detailKey}
              rowIndex={index}
              enabledCount={enabledCount}
              requireAtLeastOneMeasure={requireAtLeastOneMeasure}
              registerRequired={registerRequired}
              details={details}
            />
          </>
        )
      }}
    />
  )
})

/**
 *
 * 单据头区域
 * - 注册必填项（检验数/检验员/判定）
 * - 输入联动全部转发给 VM
 *
 */
function HeaderDocument({
  rowGap = 2,
  registerRequired,
  bill,
  status,
  materialCode,
  processName,
  onSetBill,
  onJudgeChange,
  onChangeInspect,
  onChangePass,
  onChangeNg,
  onChangeAllow,
  inspectorOptions,
  processOptions,
}: {
  rowGap?: number
  registerRequired: (key: string, registration: RequiredFieldRegistration<unknown>) => () => void
  bill: any
  status: number
  materialCode: string
  processName: string
  onSetBill: (key: string, value: any) => void
  onJudgeChange: (v: string) => void
  onChangeInspect: (v: number | '') => void
  onChangePass: (v: number | '') => void
  onChangeNg: (v: number | '') => void
  onChangeAllow: (v: number | '') => void
  inspectorOptions: { label: string; value: string }[]
  processOptions?: { label: string; value: string }[]
}) {
  const billView = bill as any
  const billRef = useRef(bill)
  const actions = { setBill: onSetBill } as any

  useEffect(() => {
    billRef.current = bill
  }, [bill])

  // 注册必填：检验数/检验员/判定
  useEffect(() => {
    const focusByAria = (label: string) => () => {
      if (typeof window === 'undefined') return
      try {
        const el = document.querySelector<HTMLElement>(`[aria-label="${label}"]`)
        if (el) {
          try {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' })
          } catch {}
          try {
            el.focus()
          } catch {}
        }
      } catch {}
    }

    const unregs = [
      registerRequired('ChkBQty', {
        getValue: () => (billRef.current as any)?.ChkBQty,
        focus: focusByAria('检验数'),
        isEmpty: (v) => !(typeof v === 'number' && Number.isFinite(v) && v > 0),
      }),
      registerRequired('Employeeid', {
        getValue: () => (billRef.current as any)?.Employeeid,
        focus: () => {
          void focusComboboxByAriaLabel('检验员')
        },
        isEmpty: (v) => !(typeof v === 'number') || !Number.isFinite(v) || v <= 0,
      }),
      registerRequired('CheckResult', {
        getValue: () => (billRef.current as any)?.CheckResult,
        focus: () => {
          void focusComboboxByAriaLabel('判定')
        },
        isEmpty: (v) => !(typeof v === 'number') || !Number.isFinite(v) || Number(v) === 0,
      }),
    ]

    return () => {
      for (const un of unregs) {
        try {
          un()
        } catch {}
      }
    }
  }, [registerRequired])

  // 状态文本颜色
  function getStatusTextClass(status: number): string {
    // 兼容后端返回 0：按“未审批”展示为错误色
    if (status === 0 || hasStatusFlag(status, DocumentStatus.未审批)) return 't-text-error'
    if (hasStatusFlag(status, DocumentStatus.已审批)) return 't-text-success'
    return 't-text-primary'
  }

  return (
    <div className="w-full">
      {/* 第一行：单据编号 审批状态 */}
      <div className="grid grid-cols-[56px_1fr_64px] items-center gap-x-[0.5px]">
        <GridLabel text="单据编号" className="sm:w-[56px]" />
        <GridInput
          value={(bill as any).Code ?? ''}
          disabled
          className="w-full"
          ariaLabel="单据编号"
          style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
        />
        <span
          className={`w-[64px] text-center whitespace-nowrap ${getStatusTextClass(status)}`}
          aria-label="审批状态"
        >
          {documentStatusToText(status)}
        </span>
      </div>

      {/* 第二行：制令单号 物料编码 */}
      <div
        className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-0.5 sm:grid-cols-[55px_103px_78px_127px] sm:gap-x-[0.5px]"
        style={{ marginTop: rowGap }}
      >
        <GridLabel text="制令单号" className="sm:w-[55px]" />
        <GridInput
          value={toDisplayStr(bill.InnerKey)}
          disabled
          className="sm:w-[103px]"
          ariaLabel="制令单号"
          style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
        />
        <GridLabel text="物料编码" className="sm:w-[53px]" />
        <GridInput
          value={materialCode ?? ''}
          disabled
          className="sm:w-[127px]"
          ariaLabel="物料编码"
          style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
        />
      </div>

      {/* 第三行：送检数 当前检验工序 */}
      <div
        className="grid grid-cols-[auto_46px_auto_minmax(0,1fr)] items-center gap-x-[0.5px]"
        style={{ marginTop: rowGap }}
      >
        <GridLabel text="送检数" className="sm:w-[40px] text-center" />
        <GridInput
          value={toDisplayStr(bill.PreCmpBQty)}
          disabled
          className="sm:w-[46px]"
          ariaLabel="送检数"
          style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
        />
        <GridLabel text="当前检验工序" className="sm:w-[78px]" />
        <GridSelect
          value={(bill as any)?.TypeofWorkid > 0 ? String((bill as any).TypeofWorkid) : ''}
          disabled
          className="w-full"
          ariaLabel="当前检验工序"
          options={
            (processOptions && processOptions.length > 0)
              ? processOptions
              : [{ label: processName || '—', value: (bill as any)?.TypeofWorkid > 0 ? String((bill as any).TypeofWorkid) : '' }]
          }
          style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
          onChange={(v) => actions.setBill('TypeofWorkid', v === '' ? 0 : Number(v))}
        />
      </div>

      {/* 第四行：检验数 检验员 判定 */}
      <div
        className="grid grid-cols-[auto_46px_auto_73px_auto_93px] items-center gap-x-[0.5px]"
        style={{ marginTop: rowGap }}
      >
        <GridLabel text="检验数" className="sm:w-[40px] t-text-error" />
        <NumberInput
          value={toNumOrEmpty(bill.ChkBQty)}
          onValueChange={onChangeInspect}
          onValueChangeThrottleMs={50}
          onChange={onChangeInspect}
          className="sm:w-[46px]"
          ariaLabel="检验数"
          style={{ height: '26px', minHeight: '26px', paddingInline: '4px' }}
        />

        <GridLabel text="检验员" className="sm:w-[40px] text-right t-text-error" />
        <GridSelect
          value={bill.Employeeid > 0 ? String(bill.Employeeid) : ''}
          onChange={(v) => actions.setBill('Employeeid', v === '' ? 0 : Number(v))}
          className="sm:w-[73px]"
          ariaLabel="检验员"
          options={inspectorOptions}
          style={{ height: '24px', minHeight: '24px', paddingInline: '4px' }}
        />

        <GridLabel text="判定" className="sm:w-[29px] text-center t-text-error" />
        <GridSelect
          value={billView.CheckResult === 0 ? '' : String(billView.CheckResult ?? '')}
          onChange={onJudgeChange}
          className="sm:w-[93px]"
          ariaLabel="判定"
          options={[
            { label: '合格', value: '1' },
            { label: '不合格', value: '4' },
            { label: '让步接收', value: '2' },
          ]}
          style={{ height: '25px', minHeight: '25px', paddingInline: '4px' }}
        />
      </div>

      {/* 第五行：合格数 不合格数 让步数 */}
      <div
        className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-[0.5px]"
        style={{ marginTop: rowGap }}
      >
        <GridLabel text="合格数" className="sm:w-[40px]" />
        <NumberInput
          value={toNumOrEmpty(bill.PassBQty)}
          onValueChange={onChangePass}
          onValueChangeThrottleMs={50}
          onChange={onChangePass}
          className="sm:w-[46px]"
          ariaLabel="合格数"
          style={{ height: '26px', minHeight: '26px', paddingInline: '4px' }}
        />

        <GridLabel text="不合格数" className="sm:w-[52px]" />
        <NumberInput
          value={toNumOrEmpty(bill.NotPassBQty)}
          onValueChange={onChangeNg}
          onValueChangeThrottleMs={50}
          onChange={onChangeNg}
          className="sm:w-[46px] text-right"
          ariaLabel="不合格数"
          style={{ height: '26px', minHeight: '26px', paddingInline: '4px' }}
        />

        <GridLabel text="让步数" className="sm:w-[41px]" />
        <NumberInput
          value={toNumOrEmpty(bill.RQty)}
          onValueChange={onChangeAllow}
          onValueChangeThrottleMs={50}
          onChange={onChangeAllow}
          className="sm:w-[46px]"
          ariaLabel="让步数"
          style={{ height: '26px', minHeight: '26px', paddingInline: '4px' }}
        />
      </div>
    </div>
  )
}

/**
 *
 * 网格标签：负责文本对齐与占位
 *
 */
function GridLabel({ text, className }: { text: string; className?: string }) {
  return (
    <Label className={`shrink-0 whitespace-nowrap text-[13px] leading-[25px] ${
      className ?? ''
    }`}
    >
      {text}
    </Label>
  )
}

/**
 *
 * 只读输入框：展示固定值
 *
 */
function GridInput({
  value,
  className,
  ariaLabel,
  disabled = false,
  style,
}: {
  value: string
  className?: string
  ariaLabel: string
  disabled?: boolean
  style?: CSSProperties
}) {
  const id = useId()
  return (
    <Input
      id={id}
      aria-label={ariaLabel}
      className={`shrink-0 text-[13px] ${className ?? ''}`}
      value={value}
      disabled={disabled}
      readOnly
      style={style}
    />
  )
}

