'use client'
import { useFeaturesPageTitle } from '@/app/features/_components'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './ncr-prompt.module.css'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 *
 * 中间页：请填写不合格记录
 * - 显示“不合格”说明与下一步操作，引导用户进入 NCR 页面。
 * - 可选支持倒计时自动跳转（通过查询参数启用），并提供取消自动跳转的能力。
 * 查询参数（全部可选，仅用于显示/跳转增强，不影响功能）：
 * - docNo:     当前首件检验单据编号
 * - material:  物料编码
 * - orderNo:   制令单号/工单号
 * - process:   检验工序
 * - ngQty:     不合格数量
 * - auto:      '1' 则启用倒计时自动跳转（默认关闭）
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

  // 开关：是否启用倒计时自动跳转（局部变量，可快速关闭）
  // - 为不影响线上行为，默认开启；如需关闭，改为 false 即可。
  const enableCountdownRedirect: boolean = false

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
  const enableAuto = enableCountdownRedirect && getParam('auto') === '1'
  const secRaw = Math.max(1, Math.min(30, Number(getParam('sec') || 3)))
  const [seconds, setSeconds] = useState<number>(enableAuto ? secRaw : 0)
  const timerRef = useRef<number | null>(null)

  /**
   *
   * 开始倒计时。
   *
   */
  const startTimer = useCallback(() => {
    if (!enableAuto) return
    if (timerRef.current) return
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => {
        const n = s - 1
        if (n <= 0) {
          window.clearInterval(timerRef.current!)
          timerRef.current = null
          // 自动进入 NCR 填写页面
          try {
            router.push('/features/erp/quality/ncr')
          } catch {}
          return 0
        }
        return n
      })
    }, 1000)
  }, [enableAuto, router])

  /**
   *
   * 取消自动跳转：清除计时器并将剩余秒数清零。
   *
   */
  const cancelAuto = useCallback(() => {
    if (timerRef.current) {
      try {
        window.clearInterval(timerRef.current)
      } catch {}
      timerRef.current = null
    }
    setSeconds(0)
  }, [])

  useEffect(() => {
    if (!enableAuto) return
    startTimer()
    return () => {
      if (timerRef.current) {
        try {
          window.clearInterval(timerRef.current)
        } catch {}
        timerRef.current = null
      }
    }
  }, [enableAuto, startTimer])

  /**
   *
   * 进入 NCR 填写页面。
   *
   */
  const goNcr = useCallback(() => {
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
    } catch {}
  }, [router, getParam])

  /**
   *
   * 返回首件检验页面并携带反审批动作（action=unapprove）与单据ID（billId）。
   * - 优先从当前URL读取 billId 并透传，避免依赖 localStorage 可能失效的问题。
   *
   */
  const goBackFai = useCallback(() => {
    try {
      const billId = getParam('billId')
      const qs = new URLSearchParams({ action: 'unapprove' })
      if (billId && String(billId).trim() !== '') qs.set('billId', String(billId))
      router.push(`/features/erp/quality/fai?${qs.toString()}`)
    } catch {}
  }, [router, getParam])

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

          {/* 自动跳转提示 */}
          {enableAuto && seconds > 0 && (
            <div className="mt-3 text-xs text-neutral-500">
              将在 <span className="tabular-nums">{seconds}</span> 秒后自动进入填写
              <button
                type="button"
                aria-label="取消自动跳转"
                onClick={cancelAuto}
                className="ml-2 underline decoration-dotted underline-offset-2 hover:text-neutral-700"
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
