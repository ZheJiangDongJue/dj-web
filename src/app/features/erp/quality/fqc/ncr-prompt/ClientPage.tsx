'use client'
import { useFeaturesPageTitle } from '@/app/features/_components'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './ncr-prompt.module.css'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  buildQualityInspectionReturnTo,
  normalizeInternalReturnTo,
} from '@/lib/navigation/return-to'
import { formatActionErrorMessage } from '@/lib/errors/user-facing-error'
import { Spinner } from '@/components/ui/spinner'
import { useService } from '@/infrastructure/di/hooks'
import { FinalInspectionApplicationServiceToken } from '@/infrastructure/di/AppServicesProvider'

/**
 * 将中间页查询参数中的单据 ID 解析为正整数。
 * @param value URL 查询参数值。
 * @returns 合法的单据 ID；缺失、非整数或非正数返回 null。
 */
function parseBillId(value: string | undefined): number | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null

  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 *
 * 中间页：请填写不合格记录
 * - 显示“不合格”说明与下一步操作，引导用户进入 NCR 页面。
 * - 默认启用“静默倒计时”，倒计时结束自动选择“进入填写”。
 * 查询参数（全部可选，仅用于显示/跳转增强，不影响功能）：
 * - docNo:     当前末件检验单据编号
 * - material:  物料编码
 * - orderNo:   制令单号/工单号
 * - process:   检验工序
 * - ngQty:     不合格数量
 * - auto:      '0' 则关闭静默自动进入（默认开启）
 * - sec:       倒计时时长，默认 3 秒（1-30 的整数）
 *
 */
export default function ClientPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  useFeaturesPageTitle('请填写不合格记录')
  const router = useRouter()
  const finalInspectionService = useService(FinalInspectionApplicationServiceToken)

  // 开关：是否启用“静默倒计时自动进入”（局部变量，可快速关闭）
  // - 如需紧急关闭静默自动进入，将该值改为 false。
  const enableCountdownRedirect: boolean = true

  // 统一读取查询参数（服务端/客户端两处来源，客户端优先，以便动态修改）
  const sp = useSearchParams()
  const getParam = useCallback(
    (key: string): string | undefined => {
      // 先取客户端 searchParams，再回退到服务端 props
      const v = sp?.get(key)
      if (v != null) return v
      const raw = searchParams?.[key]
      return Array.isArray(raw) ? raw[0] : raw || undefined
    },
    [sp, searchParams],
  )

  // 展示信息（仅展示，不做强依赖）
  const docNo = getParam('docNo')
  const material = getParam('material')
  const orderNo = getParam('orderNo')
  const process = getParam('process')
  const ngQty = getParam('ngQty')
  const billId = getParam('billId')
  const returnTo = useMemo(() => {
    const explicitReturnTo = normalizeInternalReturnTo(getParam('returnTo'))
    if (explicitReturnTo) return explicitReturnTo
    return buildQualityInspectionReturnTo('fqc', billId)
  }, [getParam, billId])

  // 自动跳转控制
  const enableAuto = enableCountdownRedirect && getParam('auto') !== '0'
  const countdownSeconds = useMemo(() => {
    const raw = Number(getParam('sec') || 3)
    const sec = Number.isFinite(raw) ? Math.floor(raw) : 3
    return Math.max(1, Math.min(30, sec))
  }, [getParam])

  const hasNavigatedRef = useRef<boolean>(false)
  const hasAttemptedUnapproveRef = useRef(false)
  const isMountedRef = useRef(true)
  const timerRef = useRef<number | null>(null)
  const [isUnapproving, setIsUnapproving] = useState(false)
  const [unapproveError, setUnapproveError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  /**
   *
   * 清除“静默倒计时”计时器。
   * @remarks
   * - 避免用户手动点击后仍触发自动进入，导致二次跳转。
   *
   */
  const clearAutoTimer = useCallback(() => {
    if (timerRef.current == null) return
    try {
      window.clearTimeout(timerRef.current)
    } catch {}
    timerRef.current = null
  }, [])

  /**
   *
   * 进入 NCR 填写页面。
   *
   */
  const goNcr = useCallback(() => {
    if (hasNavigatedRef.current || isUnapproving) return
    clearAutoTimer()
    hasNavigatedRef.current = true
    try {
      const type = getParam('type')
      const from = getParam('from')
      const qs = new URLSearchParams()
      if (from && String(from).trim() !== '') qs.set('from', String(from))
      if (returnTo) qs.set('returnTo', returnTo)
      if (type && String(type).trim() !== '') qs.set('type', String(type))
      if (billId && String(billId).trim() !== '') qs.set('billId', String(billId))
      const suffix = qs.toString()
      router.replace(`/features/erp/quality/ncr${suffix ? `?${suffix}` : ''}`)
    } catch {
      hasNavigatedRef.current = false
    }
  }, [router, getParam, clearAutoTimer, billId, returnTo, isUnapproving])

  /**
   *
   * 在中间页完成反审批后返回末件检验页面。
   * - 反审批请求完成前保持当前页面，避免用户看到旧单据状态。
   * - 成功后只通过 id 回到 FQC，由 FQC 重新读取数据库最新单据。
   * - 失败时保留在当前页面并允许用户重试。
   *
   */
  const goBackFqc = useCallback(async () => {
    if (hasNavigatedRef.current || isUnapproving) return
    clearAutoTimer()
    // 用户已经明确选择反审批后，即使请求失败也不再自动跳转到 NCR，等待用户重试或处理错误。
    hasAttemptedUnapproveRef.current = true

    const normalizedBillId = parseBillId(billId)
    if (!normalizedBillId) {
      const message = '反审批失败：未获取到有效单据ID'
      setUnapproveError(message)
      try { toast.error(message) } catch {}
      return
    }

    hasNavigatedRef.current = true
    setUnapproveError(null)
    setIsUnapproving(true)

    try {
      const result = await finalInspectionService.unapprove(normalizedBillId)
      if (!isMountedRef.current) return

      if (!result?.success) {
        const reason = String(result?.message ?? '').trim()
        const message = reason
          ? formatActionErrorMessage('反审批', { message: reason }, '请稍后重试')
          : '反审批失败'
        setUnapproveError(message)
        try { toast.error(message) } catch {}
        hasNavigatedRef.current = false
        return
      }

      const href = buildQualityInspectionReturnTo('fqc', normalizedBillId)
      if (!href) {
        const message = '反审批已完成，但无法返回末件检验页面'
        setUnapproveError(message)
        try { toast.error(message) } catch {}
        return
      }

      try {
        router.replace(href)
      } catch {
        // 路由器异常时使用浏览器导航兜底；反审批已经成功，不能重置提交锁，避免重复调用接口。
        try {
          if (typeof window !== 'undefined') {
            window.location.replace(href)
            return
          }
        } catch {}

        if (!isMountedRef.current) return
        const message = '反审批已完成，但返回末件检验页面失败，请刷新页面确认最新状态'
        setUnapproveError(message)
        try { toast.error(message) } catch {}
      }
    } catch (error) {
      if (!isMountedRef.current) return
      const message = formatActionErrorMessage('反审批', error, '请稍后重试')
      setUnapproveError(message)
      try { toast.error(message) } catch {}
      hasNavigatedRef.current = false
    } finally {
      if (isMountedRef.current) setIsUnapproving(false)
    }
  }, [router, clearAutoTimer, billId, finalInspectionService, isUnapproving])

  /**
   *
   * 静默倒计时：倒计时结束自动选择“进入填写”。
   *
   */
  const startSilentCountdown = useCallback(() => {
    if (!enableAuto) return
    if (hasAttemptedUnapproveRef.current) return
    if (hasNavigatedRef.current) return
    if (timerRef.current != null) return
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      if (hasNavigatedRef.current) return
      goNcr()
    }, countdownSeconds * 1000)
  }, [enableAuto, countdownSeconds, goNcr])

  useEffect(() => {
    if (!enableAuto) {
      clearAutoTimer()
      return
    }
    startSilentCountdown()
    return () => {
      clearAutoTimer()
    }
  }, [enableAuto, startSilentCountdown, clearAutoTimer])

  return (
    <section
      className={`mx-auto w-full max-w-[414px] ${styles.frame}`}
      aria-busy={isUnapproving}
    >
      {/* 居中卡片区 */}
      <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 py-8">
        <div className="t-card w-full rounded-[var(--radius-lg)] p-4 text-center">
          <h2 className="mb-1 text-lg font-semibold text-neutral-900 dark:text-white">
            请填写不合格记录
          </h2>
          <p className="mb-3 text-sm text-neutral-500" aria-live="polite">
            {isUnapproving
              ? '正在反审批，请稍候；完成后将自动打开最新的末件检验单据。'
              : '判定为不合格且存在不合格数量，需要填写详细记录'}
          </p>

          {unapproveError && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
              {unapproveError}
            </p>
          )}

          {/* 关键信息（可选显示） */}
          <div className="mx-auto mb-4 w-fit text-left text-[13px] leading-6 text-neutral-700/85 dark:text-neutral-300/90">
            {docNo && (
              <div>
                <span className="opacity-70">单据：</span>
                <span className="tabular-nums">{docNo}</span>
              </div>
            )}
            {material && (
              <div>
                <span className="opacity-70">物料：</span>
                <span>{material}</span>
              </div>
            )}
            {orderNo && (
              <div>
                <span className="opacity-70">制令：</span>
                <span className="tabular-nums">{orderNo}</span>
              </div>
            )}
            {process && (
              <div>
                <span className="opacity-70">工序：</span>
                <span>{process}</span>
              </div>
            )}
            {ngQty && (
              <div>
                <span className="opacity-70">不合格数：</span>
                <span className="tabular-nums text-red-600 dark:text-red-400">{ngQty}</span>
              </div>
            )}
          </div>

          {/* 操作区 */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              aria-label="进入填写不合格记录"
              onClick={goNcr}
              disabled={isUnapproving}
              className={`t-accent ${styles.btnSize} rounded-[var(--radius-md)] text-sm`}
            >
              进入填写
            </button>
            <button
              type="button"
              aria-label="返回末件检验（反审批）"
              onClick={goBackFqc}
              disabled={isUnapproving}
              aria-busy={isUnapproving}
              className={`${styles.btnSize} rounded-[var(--radius-md)] border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:active:bg-neutral-800`}
            >
              {isUnapproving ? (
                <span className="inline-flex items-center gap-1.5">
                  <Spinner className="size-4" />
                  反审批中…
                </span>
              ) : '反审批'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
