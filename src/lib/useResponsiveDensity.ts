"use client"
import { useEffect } from "react"

/**
 *
 * useResponsiveDensity
 * 在“超小宽度/横屏小高度”场景下自动压缩界面密度。
 * - 通过 `data-density-auto="compact"` 生效，不覆盖用户手动选择的 `data-density`
 * - 不改主题变量，仅影响尺寸/间距，由 `tokens.css` 驱动
 *
 */
export function useResponsiveDensity() {
  useEffect(() => {
    // 说明：逗号在 Media Query 中代表 OR
    const query = "(max-width: 360px), (orientation: landscape) and (max-height: 430px)"
    const mql = window.matchMedia(query)

    const apply = () => {
      const el = document.documentElement
      if (mql.matches) {
        el.setAttribute("data-density-auto", "compact")
      } else {
        el.removeAttribute("data-density-auto")
      }
    }

    apply()
    try {
      mql.addEventListener("change", apply)
      return () => mql.removeEventListener("change", apply)
    } catch {
      // 兼容旧版 WebView / Safari
      mql.addListener(apply)
      return () => mql.removeListener(apply)
    }
  }, [])
}
