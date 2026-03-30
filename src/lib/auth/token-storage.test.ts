import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import TokenStorage, { MemoryTokenStorage } from './token-storage'

class FakeBroadcastChannel {
  onmessage: ((ev: MessageEvent) => void) | null = null
  messages: unknown[] = []
  constructor(public name: string) {}
  postMessage(msg: unknown) {
    this.messages.push(msg)
    if (this.onmessage) {
      this.onmessage({ data: msg } as MessageEvent)
    }
  }
}

class FakeStorage {
  store = new Map<string, string>()
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
}

let channel: FakeBroadcastChannel

beforeEach(() => {
  ;(globalThis as any).localStorage = new FakeStorage()
  ;(globalThis as any).sessionStorage = new FakeStorage()
  channel = new FakeBroadcastChannel('dj-auth-channel')
  ;(globalThis as any).BroadcastChannel = vi.fn(() => channel)
  ;(TokenStorage as any).channel = null
  TokenStorage.clear({ silent: true })
})

afterEach(() => {
  delete (globalThis as any).BroadcastChannel
  delete (globalThis as any).localStorage
  delete (globalThis as any).sessionStorage
})

describe('TokenStorage', () => {
  it('set/get/clear 维护 token 并广播事件', () => {
    const listener = vi.fn()
    TokenStorage.subscribe(listener)

    TokenStorage.set('abc')
    expect(TokenStorage.get()).toBe('abc')
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'login' }))
    expect(channel.messages.at(-1)).toMatchObject({ type: 'login' })

    TokenStorage.clear({ reason: 'manual' })
    expect(TokenStorage.get()).toBeNull()
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'logout', context: { reason: 'manual' } }))
    expect(channel.messages.at(-1)).toMatchObject({ type: 'logout' })
  })

  it('unsubscribe 停止接收事件', () => {
    const listener = vi.fn()
    const off = TokenStorage.subscribe(listener)

    TokenStorage.set('token')
    expect(listener).toHaveBeenCalledTimes(2) // emit + broadcast loopback
    off()
    TokenStorage.clear()

    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('缺少 BroadcastChannel 时仍可订阅', () => {
    delete (globalThis as any).BroadcastChannel
    ;(TokenStorage as any).channel = null
    const listener = vi.fn()

    TokenStorage.subscribe(listener)
    TokenStorage.set('t')

    expect(listener).toHaveBeenCalled()
  })

  it('remember=true 会写入 localStorage 并可恢复', () => {
    const storage = new MemoryTokenStorage()
    storage.set('persisted', { remember: true })
    expect((globalThis as any).localStorage.getItem('dj:auth-tokens')).toContain('persisted')

    const restored = new MemoryTokenStorage()
    expect(restored.get()).toBe('persisted')
  })

  it('getTokens 返回完整对象并覆盖 sessionStorage', () => {
    const storage = new MemoryTokenStorage()
    storage.set({ accessToken: 'a', refreshToken: 'r', expiresAt: 123 }, { remember: false })
    const tokens = storage.getTokens()
    expect(tokens).toMatchObject({ accessToken: 'a', refreshToken: 'r', expiresAt: 123 })
    expect((globalThis as any).sessionStorage.getItem('dj:auth-tokens')).toContain('"accessToken":"a"')
  })
})
