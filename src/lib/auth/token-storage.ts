/**
 *
 * 兼容导出，转发到 infrastructure/http。
 *
 */
export {
  TokenStorage as default,
  TokenStorage,
  MemoryTokenStorage,
  type StoredTokens,
  type TokenEvent,
  type TokenEventType,
} from '@/infrastructure/http/token-storage'
