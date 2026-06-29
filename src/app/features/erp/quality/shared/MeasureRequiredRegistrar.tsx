'use client'

import { useEffect, useRef } from 'react'
import type { RequiredFieldRegistration } from '@/lib/validation/requiredFieldManager'

/**
 *
 * 判断单个实测值是否为空。
 * @param value 当前实测值
 * @returns 为空时返回 true
 *
 */
function isMeasureValueEmpty(value: unknown): boolean {
  return value == null || (typeof value === 'string' ? value.trim() === '' : value === '')
}

/**
 *
 * “实测项必填注册器”属性。
 *
 */
export interface MeasureRequiredRegistrarProps {
  /**
   *
   * 当前明细行索引（从 0 开始）。
   *
   */
  rowIndex: number
  /**
   *
   * 当前行启用的实测项数量。
   * - 通常由频率解析得出，取值范围建议为 0~5。
   *
   */
  enabledCount: number
  /**
   *
   * 是否启用“至少填写一个实测值即可”的校验策略。
   * - 典型场景：频率为空，前端默认放开 1~5 供填写，但业务只要求本行至少填一项。
   * - 为 false 时，仍按“每个启用项都必填”执行。
   *
   */
  requireAtLeastOneMeasure: boolean
  /**
   *
   * 必填项注册函数。
   *
   */
  registerRequired: (key: string, registration: RequiredFieldRegistration<unknown>) => () => void
  /**
   *
   * 明细列表快照。
   * - 组件内部会使用 ref 持有最新值，避免注册后因闭包读到旧数据。
   *
   */
  details: Array<any>
}

/**
 *
 * 为单行“实测1~N”注册审批前必填规则。
 * @remarks
 * - 默认策略：每个启用的实测项都必填；
 * - 空频率策略：实测 1~5 全可用，但整行“至少填写一个”即可；
 * - 焦点永远回到当前行第一个实测输入，便于移动端快速补录。
 *
 */
export function MeasureRequiredRegistrar({
  rowIndex,
  enabledCount,
  requireAtLeastOneMeasure,
  registerRequired,
  details,
}: MeasureRequiredRegistrarProps) {
  const detailsRef = useRef(details)

  useEffect(() => {
    detailsRef.current = details
  }, [details])

  useEffect(() => {
    const unregs: Array<() => void> = []

    for (let i = 0; i < Math.max(0, enabledCount); i++) {
      const key = `detail:${rowIndex}:${i + 1}`
      const focus = () => {
        if (typeof window === 'undefined') return
        try {
          const selector = `[aria-label="明细第${rowIndex + 1}行-实测${i + 1}"]`
          const el = document.querySelector<HTMLElement>(selector)
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

      const getValue = () => {
        const list = detailsRef.current || []
        const it = Array.isArray(list)
          ? (list as Array<any>)[rowIndex]
          : undefined
        return it ? (it as any)[`MeasuredRecord${i + 1}`] : undefined
      }

      const isRowMeasureGroupEmpty = () => {
        const list = detailsRef.current || []
        const it = Array.isArray(list)
          ? (list as Array<any>)[rowIndex]
          : undefined
        if (!it) return true

        for (let measureIndex = 0; measureIndex < Math.max(0, enabledCount); measureIndex++) {
          const value = (it as any)[`MeasuredRecord${measureIndex + 1}`]
          if (!isMeasureValueEmpty(value)) return false
        }
        return true
      }

      unregs.push(
        registerRequired(key, {
          getValue,
          focus,
          isEmpty: requireAtLeastOneMeasure
            ? () => isRowMeasureGroupEmpty()
            : isMeasureValueEmpty,
        }),
      )
    }

    return () => {
      for (const unreg of unregs) {
        try {
          unreg()
        } catch {}
      }
    }
  }, [rowIndex, enabledCount, requireAtLeastOneMeasure, registerRequired])

  return null
}
