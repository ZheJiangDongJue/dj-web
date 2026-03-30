/* eslint-env node */
import { test, expect } from '@playwright/test'

// 测试说明：
// - 使用路由拦截模拟后端 /api/auth/* 接口，避免依赖真实服务
// - 仅验证前端交互与跳转/错误提示行为
// - 如需在 CI 运行，请在项目中安装 @playwright/test 并配置 Playwright
//
// 约定：Next App 路由中登录页路径为 /login

const OK = (data: unknown) => ({ success: true, code: 'OK', message: '', data })
const FAIL = (code: string, message?: string) => ({ success: false, code, message: message ?? code })

async function mockLoginSuccess(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/authenticate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        OK({
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          expiresAt: '2099-01-01T00:00:00Z',
          user: { id: 'u-1', name: 'Mock User' },
        }),
      ),
    })
  })
}

async function mockLoginFailInvalidCredential(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/authenticate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAIL('AUTH_INVALID_CREDENTIALS')),
    })
  })
}

async function mockLoginNetworkError(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/authenticate', async (route) => {
    await route.abort('failed')
  })
}

// 可选：模拟 refresh 成功
async function mockRefreshSuccess(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        OK({
          accessToken: 'mock-token-2',
          refreshToken: 'mock-refresh-2',
          expiresAt: '2099-01-01T00:00:00Z',
        }),
      ),
    })
  })
}

// 基础可见性（移动/桌面断点）
;
;[{ width: 375, height: 800 }, { width: 1280, height: 800 }].forEach((viewport) => {
  test.describe(`登录页可见性-${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport })

    test('页面结构可达', async ({ page }) => {
      await page.goto('/login')
      await expect(page.getByRole('heading', { name: '账号登录' })).toBeVisible()
      await expect(page.getByLabel('用户名')).toBeVisible()
      await expect(page.getByLabel('密码')).toBeVisible()
    })
  })
})

// 登录成功 → 跳转到 ERP 主页（默认 / 或来自 NEXT_PUBLIC_APP_ERP_BASE_URL）
// 若配置为其他域/路径，请在 CI 环境设置对应环境变量并调整断言。
test('登录成功后跳转主页', async ({ page }) => {
  await mockLoginSuccess(page)
  await page.goto('/login')
  await page.getByLabel('用户名').fill('demo')
  await page.getByLabel('密码').fill('123456')

  const navPromise = page.waitForNavigation()
  await page.getByRole('button', { name: '提交登录' }).click()
  await navPromise

  await expect(page).toHaveURL(/\/$/)
})

// 无效凭证 → 显示安全映射文案（用户名或密码错误）
test('无效凭证显示映射文案', async ({ page }) => {
  await mockLoginFailInvalidCredential(page)
  await page.goto('/login')
  await page.getByLabel('用户名').fill('demo')
  await page.getByLabel('密码').fill('wrong')
  await page.getByRole('button', { name: '提交登录' }).click()

  await expect(page.getByText('用户名或密码错误')).toBeVisible()
})

// 网络失败 → 显示网络异常提示
// 由于 fetch 异常经过统一映射，应显示“网络异常，请稍后重试”
test('网络失败显示网络异常提示', async ({ page }) => {
  await mockLoginNetworkError(page)
  await page.goto('/login')
  await page.getByLabel('用户名').fill('demo')
  await page.getByLabel('密码').fill('any')
  await page.getByRole('button', { name: '提交登录' }).click()

  await expect(page.getByText('网络异常，请稍后重试')).toBeVisible()
})

// 刷新流程（401/403 → refresh → 重放）
// 说明：当前页面未在登录后主动发起受保护接口请求，无法自然触发 authFetch。
// 提供占位用例以在未来接入受保护接口后完善。
test.skip('401/403 触发刷新并成功重放请求', async ({ page }) => {
  await mockLoginSuccess(page)
  await mockRefreshSuccess(page)
  await page.goto('/login')
  await page.getByLabel('用户名').fill('demo')
  await page.getByLabel('密码').fill('123456')
  await page.getByRole('button', { name: '提交登录' }).click()

  // TODO: 登录后导航到需要权限的页面并触发受保护请求；
  // 初次返回 401，然后调用 /api/auth/refresh 返回新 token，
  // 最终重放请求成功。断言 UI 数据或 200 成功状态。
  await expect(page).toHaveURL(/\/$/)
})
