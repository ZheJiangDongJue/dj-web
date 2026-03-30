export type TokenEventType = 'login' | 'logout'

export interface TokenEvent {
  type: TokenEventType
  ts: number
  context?: {
    app?: string
    userId?: string | number
    reason?: string
  }
}

export interface StoredTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

type Listener = (ev: TokenEvent) => void

const CHANNEL_NAME = 'dj-auth-channel'
const STORAGE_KEY = 'dj:auth-tokens'

function createChannel(): BroadcastChannel | null {
  try {
    const g = globalThis as unknown as { BroadcastChannel?: new (name: string) => BroadcastChannel }
    if (typeof g !== 'undefined' && typeof g.BroadcastChannel !== 'undefined') {
      return new g.BroadcastChannel(CHANNEL_NAME)
    }
  } catch {
    // ignore
  }
  return null
}

function readFromStorage(): StoredTokens | null {
  try {
    const hasLocal = typeof localStorage !== 'undefined'
    const hasSession = typeof sessionStorage !== 'undefined'
    const raw =
      (hasLocal ? localStorage.getItem(STORAGE_KEY) : null) ??
      (hasSession ? sessionStorage.getItem(STORAGE_KEY) : null)
    if (!raw) return null
    return JSON.parse(raw) as StoredTokens
  } catch {
    return null
  }
}

function persistTokens(tokens: StoredTokens | null, remember?: boolean) {
  try {
    const hasLocal = typeof localStorage !== 'undefined'
    const hasSession = typeof sessionStorage !== 'undefined'
    if (hasLocal) localStorage.removeItem(STORAGE_KEY)
    if (hasSession) sessionStorage.removeItem(STORAGE_KEY)
    if (tokens) {
      const payload = JSON.stringify(tokens)
      if (remember && hasLocal) {
        localStorage.setItem(STORAGE_KEY, payload)
      } else if (hasSession) {
        sessionStorage.setItem(STORAGE_KEY, payload)
      }
    }
  } catch {
    // 忽略存储失败
  }
}

/**
 *
 * TokenStorage：以“内存 + 可选 local/sessionStorage”管理 accessToken，
 * 同时通过 BroadcastChannel 同步跨标签页的登录/登出事件。
 *
 */
export class MemoryTokenStorage {
  private tokens: StoredTokens | null = readFromStorage()
  private listeners = new Set<Listener>()
  private channel: BroadcastChannel | null = null

  private ensureChannel() {
    if (!this.channel) {
      this.channel = createChannel()
      if (this.channel) {
        this.channel.onmessage = (e: MessageEvent<TokenEvent>) => {
          const ev = e.data
          if (!ev || (ev.type !== 'login' && ev.type !== 'logout')) return
          if (ev.type === 'logout') {
            this.tokens = null
          }
          this.emit(ev)
        }
      }
    }
  }

  private emit(ev: TokenEvent) {
    for (const l of this.listeners) {
      try {
        l(ev)
      } catch {
        // 忽略监听器内部错误
      }
    }
  }

  private broadcast(ev: TokenEvent) {
    this.ensureChannel()
    try {
      this.channel?.postMessage(ev)
    } catch {
      // 忽略广播失败
    }
  }

  /**
   *
   * 设置 token；支持选择记住（localStorage）或会话（sessionStorage）
   *
   */
  set(token: string | StoredTokens, opts?: { remember?: boolean; context?: TokenEvent['context']; silent?: boolean }) {
    const value: StoredTokens = typeof token === 'string' ? { accessToken: token } : token
    this.tokens = value
    persistTokens(value, opts?.remember)
    const ev: TokenEvent = { type: 'login', ts: Date.now(), context: opts?.context }
    if (!opts?.silent) {
      this.emit(ev)
      this.broadcast(ev)
    }
  }

  /**
   *
   * 获取当前 accessToken（若不存在返回 null）
   *
   */
  get(): string | null {
    return this.tokens?.accessToken ?? null
  }

  /**
   *
   * 获取完整 token 对象（包括 refresh/过期时间）
   *
   */
  getTokens(): StoredTokens | null {
    return this.tokens ?? null
  }

  /**
   *
   * 清理 token 并广播登出事件
   *
   */
  clear(opts?: { reason?: string; context?: Omit<TokenEvent['context'], 'reason'>; silent?: boolean }) {
    this.tokens = null
    persistTokens(null)
    const ev: TokenEvent = {
      type: 'logout',
      ts: Date.now(),
      context: { ...(opts?.context ?? {}), reason: opts?.reason },
    }
    if (!opts?.silent) {
      this.emit(ev)
      this.broadcast(ev)
    }
  }

  /**
   *
   * 订阅 token 事件，返回取消订阅函数
   *
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    this.ensureChannel()
    return () => {
      this.listeners.delete(listener)
    }
  }
}

export const TokenStorage = new MemoryTokenStorage()
export default TokenStorage
