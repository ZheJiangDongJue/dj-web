// 类型与常量
export * from './types'

// 接口
export type { ILogger } from './interfaces/ILogger'

// 适配器
export { default as TSLogAdapter } from './adapters/TSLogAdapter'
export { default as WinstonAdapter } from './adapters/WinstonAdapter'

// 工厂
export { default as LoggerFactory } from './LoggerFactory'
export { LoggerFactory as _LoggerFactoryClass } from './LoggerFactory'

// 配置
export { default as ConfigManager } from './config/ConfigManager'
export { ConfigManager as _ConfigManagerClass } from './config/ConfigManager'

// 上下文（Node ALS + React）
export { default as ContextManager } from './context/ContextManager'
export {
  LogReactContext,
  LogContextProvider,
  useLogContext,
} from './context/ContextManager'

// 中间件（Next.js）
export {
  loggerMiddleware,
  extractRequestContext,
  REQUEST_ID_HEADER,
  REQUEST_START_HEADER,
} from './middleware/LoggerMiddleware'

// 脱敏工具
export { default as DataMasker } from './masking/DataMasker'
export { compileMaskConfig, maskData } from './masking/DataMasker'

// 性能优化包装
export { default as BufferedLogger } from './optimization/PerformanceOptimizer'
export { wrapWithBuffer } from './optimization/PerformanceOptimizer'

