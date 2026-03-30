/**
 *
 * ThemeInitScript
 * 使用原生 <script> 内联同步执行，在浏览器首次绘制前读取本地存储（localStorage）
 * 的 `theme-choice` 与 `ui-density`，并立即设置到 `document.documentElement`
 * 的 `data-theme` 与 `data-density`，避免页面刷新时出现“先白再深色”的闪烁。
 * 注意：
 * - 仅使用本地存储（localStorage），不写入 Cookie；
 * - 当未设置或选择为 `system` 时，依据 `prefers-color-scheme` 推断为 `light` 或 `dark`；
 * - 同步为 html/body 设置兜底背景色（深色系 #0b0f17 / 浅色 #ffffff），消除边缘白边；
 * - 代码尽可能小且同步执行，避免时序导致的 FOUC；
 *
 */
export default function ThemeInitScript() {
  const inlineJs = `(() => {
    try {
      var choice = localStorage.getItem('theme-choice');
      var density = localStorage.getItem('ui-density');
      var isDark = false;
      try { isDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); } catch {}
      var theme = 'light';
      if (choice === 'dark' || choice === 'light' || choice === 'ocean' || choice === 'forest' || choice === 'rose') {
        theme = choice;
      } else {
        theme = isDark ? 'dark' : 'light';
      }
      var el = document.documentElement;
      if (el.getAttribute('data-theme') !== theme) el.setAttribute('data-theme', theme);
      if (density === 'compact' || density === 'cozy') {
        if (el.getAttribute('data-density') !== density) el.setAttribute('data-density', density);
      }
      // 同步设置 html/body 背景兜底，防止边缘短暂露白
      var darkLike = (theme === 'dark' || theme === 'ocean' || theme === 'forest' || theme === 'rose');
      var solidBg = darkLike ? '#0b0f17' : '#ffffff';
      try { el.style.backgroundColor = solidBg; } catch {}
      try { if (document.body) document.body.style.backgroundColor = solidBg; } catch {}
    } catch (e) {}
  })();`;

  // 直接返回原生 <script>，确保同步执行优先级
  return <script id="theme-init" dangerouslySetInnerHTML={{ __html: inlineJs }} />
}
