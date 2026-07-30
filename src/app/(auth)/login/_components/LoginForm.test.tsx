// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  LOGIN_CREDENTIAL_STORAGE_KEY,
  type SavedLoginCredentials,
} from '@/lib/auth/login-credential-storage'
import LoginForm from './LoginForm'

const navState = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}))

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
}))

const tokenStorageMocks = vi.hoisted(() => ({
  set: vi.fn(),
}))

const redirectMocks = vi.hoisted(() => ({
  resolveTarget: vi.fn((app: string) => `/${app}`),
  redirect: vi.fn(),
}))

const reactMockState = vi.hoisted(() => ({
  deferEffects: false,
  pendingEffects: [] as Array<() => void | (() => void)>,
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    default: {
      ...actual.default,
      useEffect: (effect: () => void | (() => void), deps?: React.DependencyList) => {
        if (reactMockState.deferEffects) {
          reactMockState.pendingEffects.push(effect)
          return undefined
        }
        return actual.default.useEffect(effect, deps)
      },
    },
    useEffect: (effect: () => void | (() => void), deps?: React.DependencyList) => {
      if (reactMockState.deferEffects) {
        reactMockState.pendingEffects.push(effect)
        return undefined
      }
      return actual.useEffect(effect, deps)
    },
  }
})

vi.mock('next/navigation', () => ({
  useSearchParams: () => navState.searchParams,
}))

vi.mock('@/lib/auth/service', () => ({
  AuthService: {
    login: authMocks.login,
  },
}))

vi.mock('@/lib/auth/token-storage', () => ({
  default: {
    set: tokenStorageMocks.set,
  },
}))

vi.mock('@/lib/auth/redirector', () => ({
  resolveTarget: redirectMocks.resolveTarget,
  redirect: redirectMocks.redirect,
}))

function mockLoginSuccess(): void {
  authMocks.login.mockResolvedValue({
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    expiresAt: '2099-01-01T00:00:00Z',
    user: { id: 7, name: '测试用户' },
  })
}

function saveRawCredentials(credentials: SavedLoginCredentials): void {
  window.localStorage.setItem(LOGIN_CREDENTIAL_STORAGE_KEY, JSON.stringify(credentials))
}

async function submitLogin(): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: '提交登录' }))
  await waitFor(() => {
    expect(authMocks.login).toHaveBeenCalledTimes(1)
  })
}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  navState.searchParams = new URLSearchParams()
  reactMockState.deferEffects = false
  reactMockState.pendingEffects = []
  vi.clearAllMocks()
})

describe('LoginForm', () => {
  beforeEach(() => {
    mockLoginSuccess()
  })

  it('进入登录页时自动回填已保存的用户名和密码', async () => {
    saveRawCredentials({
      app: 'oa',
      username: 'saved-user',
      password: 'saved-password',
      rememberPassword: true,
      savedAt: '2026-01-01T00:00:00.000Z',
    })

    render(<LoginForm />)

    const username = screen.getByLabelText('用户名') as HTMLInputElement
    const password = screen.getByLabelText('密码') as HTMLInputElement

    await waitFor(() => {
      expect(username.value).toBe('saved-user')
      expect(password.value).toBe('saved-password')
      expect((screen.getByLabelText('记住密码') as HTMLInputElement).checked).toBe(true)
    })

    await submitLogin()
    expect(authMocks.login).toHaveBeenCalledWith(
      expect.objectContaining({
        app: 'oa',
        username: 'saved-user',
        password: 'saved-password',
      })
    )
  })

  it('挂载后再次读取本地凭据，确保退出返回登录页时密码也能回填', async () => {
    reactMockState.deferEffects = true

    render(<LoginForm />)

    saveRawCredentials({
      app: 'erp',
      username: 'after-mount-user',
      password: 'after-mount-password',
      rememberPassword: true,
      savedAt: '2026-01-01T00:00:00.000Z',
    })

    for (const effect of reactMockState.pendingEffects) {
      effect()
    }

    const username = screen.getByLabelText('用户名') as HTMLInputElement
    const password = screen.getByLabelText('密码') as HTMLInputElement

    await waitFor(() => {
      expect(username.value).toBe('after-mount-user')
      expect(password.value).toBe('after-mount-password')
      expect((screen.getByLabelText('记住密码') as HTMLInputElement).checked).toBe(true)
    })
  })

  it('仅保存账号的记录回填用户名但不回填密码或勾选记住密码', async () => {
    saveRawCredentials({
      app: 'erp',
      username: 'account-only-user',
      password: '',
      rememberPassword: false,
      savedAt: '2026-01-01T00:00:00.000Z',
    })

    render(<LoginForm />)

    await waitFor(() => {
      expect((screen.getByLabelText('用户名') as HTMLInputElement).value).toBe('account-only-user')
      expect((screen.getByLabelText('密码') as HTMLInputElement).value).toBe('')
      expect((screen.getByLabelText('记住密码') as HTMLInputElement).checked).toBe(false)
    })
  })

  it('URL 指定目标应用时不被已保存的目标应用覆盖', async () => {
    navState.searchParams = new URLSearchParams('app=bi')
    saveRawCredentials({
      app: 'oa',
      username: 'saved-user',
      password: 'saved-password',
      rememberPassword: true,
      savedAt: '2026-01-01T00:00:00.000Z',
    })

    render(<LoginForm />)

    await waitFor(() => {
      expect((screen.getByLabelText('用户名') as HTMLInputElement).value).toBe('saved-user')
    })

    await submitLogin()
    expect(authMocks.login).toHaveBeenCalledWith(
      expect.objectContaining({
        app: 'bi',
      })
    )
  })

  it('props 指定目标应用时不被已保存的目标应用覆盖', async () => {
    saveRawCredentials({
      app: 'oa',
      username: 'saved-user',
      password: 'saved-password',
      rememberPassword: true,
      savedAt: '2026-01-01T00:00:00.000Z',
    })

    render(<LoginForm app="erp" />)

    await waitFor(() => {
      expect((screen.getByLabelText('用户名') as HTMLInputElement).value).toBe('saved-user')
    })

    await submitLogin()
    expect(authMocks.login).toHaveBeenCalledWith(
      expect.objectContaining({
        app: 'erp',
      })
    )
  })

  it('登录页不再展示目标应用下拉选择', () => {
    render(<LoginForm />)

    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByLabelText('目标应用')).toBeNull()
  })

  it('勾选记住密码后保存最新用户名、密码和目标应用', async () => {
    render(<LoginForm app="erp" />)

    fireEvent.change(screen.getByLabelText('用户名'), {
      target: { value: 'fresh-user' },
    })
    fireEvent.change(screen.getByLabelText('密码'), {
      target: { value: 'fresh-password' },
    })
    fireEvent.click(screen.getByLabelText('记住密码'))

    await submitLogin()

    const raw = window.localStorage.getItem(LOGIN_CREDENTIAL_STORAGE_KEY)
    expect(raw).not.toBeNull()
    const saved = JSON.parse(raw ?? '{}') as SavedLoginCredentials
    expect(saved).toMatchObject({
      app: 'erp',
      username: 'fresh-user',
      password: 'fresh-password',
      rememberPassword: true,
    })
    expect(typeof saved.savedAt).toBe('string')
  })

  it('未勾选记住密码登录时仅保留最新用户名', async () => {
    saveRawCredentials({
      app: 'erp',
      username: 'saved-user',
      password: 'saved-password',
      rememberPassword: true,
      savedAt: '2026-01-01T00:00:00.000Z',
    })
    render(<LoginForm app="erp" />)

    fireEvent.click(screen.getByLabelText('记住密码'))

    await submitLogin()

    const raw = window.localStorage.getItem(LOGIN_CREDENTIAL_STORAGE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw ?? '{}')).toMatchObject({
      app: 'erp',
      username: 'saved-user',
      password: '',
      rememberPassword: false,
    })
  })
})
