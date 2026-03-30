"use client"
import { useEffect } from "react"

/**
 *
 * 横屏小高度时压缩全局密度（data-density="compact"）。
 * - 不改主题变量，仅影响尺寸/间距，由 tokens.css 驱动
 *
 */
export function useResponsiveDensity() {
  useEffect(() => {
    const query = "(orientation: landscape) and (max-height: 430px)"
    const mql = window.matchMedia(query)

    const apply = () => {
      if (mql.matches) {
        document.documentElement.setAttribute("data-density", "compact")
      } else {
        document.documentElement.removeAttribute("data-density")
      }
    }

    apply()
    mql.addEventListener("change", apply)
    return () => mql.removeEventListener("change", apply)
  }, [])
}
