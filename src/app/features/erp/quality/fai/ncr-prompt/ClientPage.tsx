'use client'
import { useFeaturesPageTitle } from '@/app/features/_components'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import styles from './ncr-prompt.module.css'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 *
 * 中间页：请填写不合格记录
 * - 显示“不合格”说明与下一步操作，引导用户进入 NCR 页面。
 * - 默认启用“静默倒计时”，倒计时结束自动选择“进入填写”。
 * 查询参数（全部可选，仅用于显示/跳转增强，不影响功能）：
 * - docNo:     当前首件检验单据编号
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

  // 自动跳转控制
  const enableAuto = enableCountdownRedirect && getParam('auto') !== '0'
  const countdownSeconds = useMemo(() => {
    const raw = Number(getParam('sec') || 3)
    const sec = Number.isFinite(raw) ? Math.floor(raw) : 3
    return Math.max(1, Math.min(30, sec))
  }, [getParam])

  const hasNavigatedRef = useRef<boolean>(false)
  const timerRef = useRef<number | null>(null)

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
    if (hasNavigatedRef.current) return
    clearAutoTimer()
    hasNavigatedRef.current = true
    try {
      const billId = getParam('billId')
      const type = getParam('type')
      const from = getParam('from')
      const qs = new URLSearchParams()
      if (from && String(from).trim() !== '') qs.set('from', String(from))
      if (type && String(type).trim() !== '') qs.set('type', String(type))
      if (billId && String(billId).trim() !== '') qs.set('billId', String(billId))
      const suffix = qs.toString()
      router.push(`/features/erp/quality/ncr${suffix ? `?${suffix}` : ''}`)
    } catch {
      hasNavigatedRef.current = false
    }
  }, [router, getParam, clearAutoTimer])

  /**
   *
   * 返回首件检验页面并携带反审批动作（action=unapprove）与单据ID（billId）。
   * - 优先从当前URL读取 billId 并透传，避免依赖 localStorage 可能失效的问题。
   *
   */
  const goBackFai = useCallback(() => {
    if (hasNavigatedRef.current) return
    clearAutoTimer()
    hasNavigatedRef.current = true
    try {
      const billId = getParam('billId')
      const qs = new URLSearchParams({ action: 'unapprove' })
      if (billId && String(billId).trim() !== '') qs.set('billId', String(billId))
      router.push(`/features/erp/quality/fai?${qs.toString()}`)
    } catch {
      hasNavigatedRef.current = false
    }
  }, [router, getParam, clearAutoTimer])

  /**
   *
   * 静默倒计时：倒计时结束自动选择“进入填写”。
   *
   */
  const startSilentCountdown = useCallback(() => {
    if (!enableAuto) return
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
    <section className={`mx-auto w-full max-w-[414px] ${styles.frame}`}>
      {/* 居中卡片区 */}
      <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 py-8">
        <div className="t-card w-full rounded-[var(--radius-lg)] p-4 text-center">
          <h2 className="mb-1 text-lg font-semibold text-neutral-900 dark:text-white">
            请填写不合格记录
          </h2>
          <p className="mb-3 text-sm text-neutral-500">
            判定为不合格且存在不合格数量，需要填写详细记录
          </p>

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
              className={`t-accent ${styles.btnSize} rounded-[var(--radius-md)] text-sm`}
            >
              进入填写
            </button>
            <button
              type="button"
              aria-label="返回首件检验（反审批）"
              onClick={goBackFai}
              className={`${styles.btnSize} rounded-[var(--radius-md)] border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:active:bg-neutral-800`}
            >
              反审批
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
