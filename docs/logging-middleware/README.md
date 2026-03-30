# 日志通用中间层（Logging Middleware）

为东爵 Web 聚合项目提供统一、可扩展、类型安全的日志能力。采用适配器模式（默认集成 tslog），支持请求上下文传递、Next.js 中间件集成、配置集中化与敏感数据脱敏。

- 统一接口：`ILogger` 标准化日志 API
- 工厂管理：`LoggerFactory` 创建/管理日志实例与适配器
- 配置中心：`ConfigManager` 多源合并（默认值/环境变量/文件/覆盖项）
- 上下文传递：`ContextManager`（Node：AsyncLocalStorage；Web：React Context）
- Next.js 中间件：`loggerMiddleware` 注入/传播 `x-request-id`
- 脱敏工具：`DataMasker` 支持对象/数组/字符串递归脱敏

## 快速开始

- 可选依赖（建议）：
  - 使用 tslog 作为底层实现：`npm i tslog` 或 `pnpm add tslog` 或 `yarn add tslog`
  - 未安装时将自动降级到 `console` shim（仅控制台输出）

- 目录结构（关键文件）：
  - `src/utils/logger/types/index.ts` 类型定义（LogLevel/LogConfig/LogContext 等）
  - `src/utils/logger/interfaces/ILogger.ts` 日志接口
  - `src/utils/logger/adapters/TSLogAdapter.ts` tslog 适配器（动态加载，带降级）
  - `src/utils/logger/LoggerFactory.ts` 工厂（全局配置、适配器注册与实例创建）
  - `src/utils/logger/config/ConfigManager.ts` 配置解析与校验
  - `src/utils/logger/context/ContextManager.ts` 上下文（ALS + React）
  - `src/utils/logger/middleware/LoggerMiddleware.ts` Next.js 中间件
  - `src/utils/logger/masking/DataMasker.ts` 脱敏工具

## 配置（LogConfig）

示例：
```ts
interface LogConfig {
  level: LogLevel;                  // SILLY..FATAL
  type: 'pretty' | 'json' | 'hidden';
  adapter: 'tslog' | 'console' | 'winston' | 'pino';
  output: {
    console: boolean;
    file?: { path: string; maxSize: string; maxFiles: number };
  };
  formatting: { timestamp: boolean; colorize: boolean; template?: string };
  mask: { enabled: boolean; patterns: string[]; replacement: string };
}
```

环境变量（前缀 `LOG_`，由 `ConfigManager.fromEnv` 解析）：
- `LOG_LEVEL`（`SILLY|TRACE|DEBUG|INFO|WARN|ERROR|FATAL` 或 `0..6`）
- `LOG_TYPE`（`pretty|json|hidden`）
- `LOG_ADAPTER`（`tslog|console|winston|pino`）
- `LOG_OUTPUT_CONSOLE`（`true|false`）
- `LOG_OUTPUT_FILE_PATH`、`LOG_OUTPUT_FILE_MAX_SIZE`、`LOG_OUTPUT_FILE_MAX_FILES`
- `LOG_FORMATTING_TIMESTAMP`、`LOG_FORMATTING_COLORIZE`、`LOG_FORMATTING_TEMPLATE`
- `LOG_MASK_ENABLED`、`LOG_MASK_PATTERNS`（逗号分隔）、`LOG_MASK_REPLACEMENT`

从多源解析最终配置：
```ts
import ConfigManager from '@/utils/logger/config/ConfigManager'
import LoggerFactory from '@/utils/logger/LoggerFactory'

const cfg = ConfigManager.resolve({
  filePath: 'config/logging.json',
  overrides: { type: 'json' },
})
LoggerFactory.configure(cfg)
```

## 使用示例

### 创建与使用 Logger
```ts
import LoggerFactory from '@/utils/logger/LoggerFactory'

// 全局初始化（可选：结合 ConfigManager）
LoggerFactory.configure({ adapter: 'tslog', type: 'pretty' })

// 创建命名日志器，并附带初始上下文
const logger = LoggerFactory.create('auth', undefined, { module: 'auth' })

logger.info('user login', { user: 'alice' })
logger.error('invalid token', { code: 'E_TOKEN' })

// 子日志器：继承父配置与上下文，并叠加自身上下文
const child = logger.getChild('auth-session', { action: 'verify' })
child.debug('checking session')
```

### Next.js 中间件与请求上下文
- 在项目根新增 `middleware.ts`：
```ts
// middleware.ts
export { loggerMiddleware as default } from '@/utils/logger/middleware/LoggerMiddleware'
export const config = { matcher: ['/((?!_next|static).*)'] }
```
- 在 Route Handler 中提取并注入上下文：
```ts
// app/api/hello/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { extractRequestContext } from '@/utils/logger/middleware/LoggerMiddleware'
import ContextManager from '@/utils/logger/context/ContextManager'
import LoggerFactory from '@/utils/logger/LoggerFactory'

export async function GET(req: NextRequest) {
  const ctx = extractRequestContext(req)
  return ContextManager.runWith(ctx, () => {
    const logger = LoggerFactory.create('api')
    logger.info('handle GET', { path: '/api/hello' })
    return NextResponse.json({ ok: true })
  })
}
```

### React 端上下文（客户端）
```tsx
import { LogContextProvider, useLogContext } from '@/utils/logger/context/ContextManager'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LogContextProvider value={{ module: 'shop' }}>
      {children}
    </LogContextProvider>
  )
}

export function Component() {
  const ctx = useLogContext() // { module: 'shop', ... }
  return <div>ctx: {JSON.stringify(ctx)}</div>
}
```

### 敏感数据脱敏（可选）
当前适配层未强制内置脱敏（避免无感性能开销）。可在写入前对参数进行显式脱敏：
```ts
import DataMasker from '@/utils/logger/masking/DataMasker'
import LoggerFactory from '@/utils/logger/LoggerFactory'

const logger = LoggerFactory.create('secure')
const masker = new DataMasker({ enabled: true, patterns: ['password', 'token'], replacement: '***' })

const payload = { username: 'alice', password: 'secret' }
logger.info('register', masker.mask(payload))
```
（若需自动化脱敏，可在自定义适配器中统一处理，或扩展 TSLogAdapter。）

### 适配器扩展与切换
注册自定义适配器，并通过 `LoggerFactory.configure` 切换：
```ts
import LoggerFactory from '@/utils/logger/LoggerFactory'
import type { ILogger } from '@/utils/logger/interfaces/ILogger'

LoggerFactory.registerAdapter('winston' as any, ({ name, context }) => {
  // 返回一个符合 ILogger 的对象
  const impl: ILogger = {
    silly: () => {}, trace: () => {}, debug: () => {}, info: () => {},
    warn: () => {}, error: () => {}, fatal: () => {},
    getChild: (child, childCtx) => LoggerFactory.create(child, { adapter: 'winston' } as any, { ...(context ?? {}), ...(childCtx ?? {}) }),
  }
  return impl
})

LoggerFactory.configure({ adapter: 'winston' as any })
```

## 常见问题（FAQ）
- 未安装 `tslog`？
  - 适配器会自动降级为 `console` shim，仅输出到控制台。
- `output.file` 写文件无效？
  - 文件输出依赖 Node 的 `fs`，在 Edge/浏览器运行时会被跳过。
- 如何在所有日志中带上 `requestId`？
  - 使用 `loggerMiddleware` 注入 `x-request-id`，并在服务端处理时用 `ContextManager.runWith(extractRequestContext(req), ...)` 建立上下文。之后通过 `LoggerFactory.create` 创建的日志器即可读取并带上下文。

## API 索引
- `ILogger`（`src/utils/logger/interfaces/ILogger.ts`）
  - `silly|trace|debug|info|warn|error|fatal(message: string, ...args: any[]): void`
  - `getChild(name?: string, context?: LogContext): ILogger`
- `LoggerFactory`（`src/utils/logger/LoggerFactory.ts`）
  - `configure(config: Partial<LogConfig>): void`
  - `getConfig(): LogConfig`
  - `registerAdapter(type, factory): void`
  - `hasAdapter(type): boolean`
  - `create(name?: string, config?: Partial<LogConfig>, context?: LogContext): ILogger`
- `ConfigManager`（`src/utils/logger/config/ConfigManager.ts`）
  - `getDefault()` / `fromEnv(env?)` / `fromFile(filePath?)`
  - `merge(...configs)` / `validate(cfg)` / `resolve(options)`
- `ContextManager`（`src/utils/logger/context/ContextManager.ts`）
  - `isServer()` / `get()` / `set(partial)` / `runWith(ctx, fn)`
  - 客户端：`setGlobalContext/getGlobalContext/clearGlobalContext`
  - React：`LogContextProvider` / `useLogContext`
- 中间件（`src/utils/logger/middleware/LoggerMiddleware.ts`）
  - `loggerMiddleware(request)` / `extractRequestContext(request)`
  - 常量：`REQUEST_ID_HEADER` / `REQUEST_START_HEADER`
- 脱敏（`src/utils/logger/masking/DataMasker.ts`）
  - `compileMaskConfig(config)` / `maskData(input, compiled, opts)`
  - `new DataMasker(config).mask(data)`

## 兼容性
- Node.js：推荐 >= 18（项目当前 Node 版本：v22 也兼容）
- Next.js：15.x（Edge/Node 运行时均可使用其中部分能力）

---
如需更多示例或扩展适配器（如 Winston/Pino），可在 `LoggerFactory.registerAdapter` 中注册并通过 `configure` 切换。
