# dj-web（东爵 Web 聚合项目）

基于 Next.js 15.5.4 + React 19 的 ERP 前端，采用 DDD 架构。使用 Tailwind CSS 4 与 Turbopack，后端为 ERP.WebApi（SQL Server 2008 R2）。

## 技术栈
- **框架**: Next.js 15.5.4 + React 19.1.0
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4 + CSS Modules
- **构建**: Turbopack
- **测试**: Vitest + Testing Library
- **架构**: DDD（领域驱动设计）四层架构

## 快速开始
```bash
npm install          # 安装依赖
npm run dev          # 本地开发 (http://localhost:3000)
npm test             # 运行测试
npm run lint         # 代码检查
```

## 环境变量
- 复制 `dj-web/.env.example` 为 `dj-web/.env.local`，至少设置 `ERP_API_BASE_URL`（例如 `http://127.0.0.1:5000`）。  
- （可选）若需要浏览器直连后端（跳过同源代理 `/api/erp`），可设置 `NEXT_PUBLIC_API_BASE=http(s)://...`（需后端允许 CORS）。  

**注意**: 环境变量通过静态映射暴露到客户端，禁止在浏览器端动态读取 `process.env[...]`。

## 架构设计

### DDD 四层架构
```
src/
├── domain/              # 领域层：业务规则与领域模型
│   └── quality/
│       ├── ncr/        # 不合格品返工单
│       └── fqc/        # 成品检验
├── application/         # 应用层：用例编排与事务管理
│   └── quality/
├── infrastructure/      # 基础设施层：技术实现
│   ├── http/           # HTTP 客户端与认证
│   └── repositories/   # 数据访问实现
└── app/                # 表现层：Next.js 页面与路由
```

### HTTP 基础设施
- **统一客户端**: `src/infrastructure/http/http-client.ts`（超时控制、默认头、可选认证）
- **认证拦截**: `src/infrastructure/http/auth-fetch.ts`（单飞刷新、401/403 自动重试）
- **Token 存储**: `src/infrastructure/http/token-storage.ts`（内存存储 + BroadcastChannel 同步）
- **旧拦截器**: `src/lib/auth/interceptor.ts` 与 `src/lib/api/interceptors.ts` 已标记 `@deprecated`，仅作向后兼容

### 目录说明
- `src/domain/`: 领域实体、值对象、领域服务、仓储接口
- `src/application/`: 应用服务、用例编排、DTO 转换
- `src/infrastructure/`: HTTP 客户端、仓储实现、外部服务适配
- `src/app/`: Next.js App Router 页面、路由、服务端组件
- `src/lib/`: 工具函数、配置、遗留代码（逐步迁移中）
- `docs/`: 架构文档、DDD 改造方案、开发规范

## 开发规范
- **测试覆盖率**: branches/functions/lines/statements 均 ≥90%
- **样式隔离**: 优先使用 CSS Modules，布局与主题分离
- **响应式设计**: Mobile-First，支持 Mobile/Tablet/PC
- **类型安全**: 严格 TypeScript，避免 `any`
- **提交规范**: Conventional Commits

## 质量检查
```bash
# 完整检查（测试 + 覆盖率 + Lint）
npm test -- --coverage --coverageThreshold='{"global":{"branches":90,"functions":90,"lines":90,"statements":90}}' && npm run lint
```

## 相关文档
- [DDD 改造方案](./dj-web-ddd-改造方案.md)
- [页面编写规范](./docs/页面编写规范.md)
- [组件编写规范](./docs/组件编写规范.md)
