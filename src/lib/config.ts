/**
 *
 * 全局配置（前端编译期静态映射）。
 * 注意：在客户端代码中避免动态访问 process.env，保持可树摇与可预测性。
 *
 */
const NEXT_PUBLIC_API_BASE_RAW = process.env.NEXT_PUBLIC_API_BASE as string | undefined;
const ERP_API_BASE_URL_RAW = process.env.ERP_API_BASE_URL as string | undefined;

function normalizeUrl(value: string | undefined): string | undefined {
  const v = typeof value === 'string' ? value.trim() : '';
  return v ? v : undefined;
}

function isAbsoluteHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

const NEXT_PUBLIC_API_BASE = normalizeUrl(NEXT_PUBLIC_API_BASE_RAW);
const ERP_API_BASE_URL = normalizeUrl(ERP_API_BASE_URL_RAW);

/**
 *
 * ERP.WebApi 基址。
 * - 浏览器端默认走同源代理：`/api/erp`（由 Next Route Handler 转发到 ERP_API_BASE_URL）
 * - 服务端（Route Handler/Server Component）优先读取 `ERP_API_BASE_URL` 直连后端
 * - 若你需要让浏览器直连后端，请设置 `NEXT_PUBLIC_API_BASE=http(s)://...`
 *
 */
export const API_BASE: string = (() => {
  // 服务端：必须为绝对地址，否则 Node fetch 会报 “Only absolute URLs are supported”
  if (typeof window === 'undefined') {
    if (NEXT_PUBLIC_API_BASE && isAbsoluteHttpUrl(NEXT_PUBLIC_API_BASE)) return NEXT_PUBLIC_API_BASE;
    if (ERP_API_BASE_URL && isAbsoluteHttpUrl(ERP_API_BASE_URL)) return ERP_API_BASE_URL;
    // 本地默认端口与 ERP.WebApi 文档保持一致（避免 5000 进入 Windows Excluded Port Range）
    return 'http://127.0.0.1:5000';
  }

  // 浏览器：默认通过同源代理避免 CORS
  return NEXT_PUBLIC_API_BASE ?? '/api/erp';
})();

export const DEFAULT_DB_NAME: string = (process.env.NEXT_PUBLIC_DB_NAME as string) ?? "ERP_Default";
/**
 *
 * HTTP 请求默认超时时间（毫秒）
 *
 */
export const HTTP_TIMEOUT_MS: number = 30_000;
