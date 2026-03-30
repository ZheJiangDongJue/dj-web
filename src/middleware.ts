import { NextResponse, type NextRequest } from 'next/server';

/**
 *
 * 认证判定依据：仅以 refreshToken 为准。
 * - 与服务端页面（如 /erp、/login）保持一致，避免出现“不同页面对登录态认知不一致”导致的重定向循环。
 * - 其它历史/备用 Cookie 名称（accessToken、sid 等）不再作为已登录依据。
 *
 */
const AUTH_COOKIE_KEY = 'refreshToken' as const;

/**
 *
 * 调试开关 Cookie（debug=true/1/yes/on）。
 * - 仅在显式开启时输出中间件重定向日志，避免污染生产日志。
 *
 */
const DEBUG_COOKIE_KEY = 'debug' as const;

/**
 *
 * 登录页路径（可按需调整为实际路径）
 *
 */
const LOGIN_PATH = '/login';

/**
 *
 * 登录后默认跳转的功能页（可按需调整为实际路径）
 *
 */
const DEFAULT_AFTER_LOGIN_PATH = '/erp';

/**
 *
 * 通过中间件在重定向到登录页时暂存目标地址的 Cookie 名称
 *
 */
const REDIRECT_TO_COOKIE = 'redirect_to';

/**
 *
 * 判断请求是否携带登录态（以 refreshToken 为唯一依据）。
 * @param req Next.js 中间件的请求对象
 * @returns 是否视为已登录
 *
 */
function isAuthenticated(req: NextRequest): boolean {
  const v = req.cookies.get(AUTH_COOKIE_KEY)?.value;
  return Boolean(v && v.trim().length > 0);
}

/**
 *
 * 判断当前请求路径是否为登录页（兼容末尾斜杠）。
 * @param req Next.js 中间件的请求对象
 *
 */
function isLoginPath(req: NextRequest): boolean {
  const p = req.nextUrl.pathname;
  return p === LOGIN_PATH || p === `${LOGIN_PATH}/`;
}

/**
 *
 * 判断是否开启调试日志（cookie: debug=true/1/yes/on）。
 * @param req Next.js 中间件的请求对象
 *
 */
function isDebugEnabled(req: NextRequest): boolean {
  const v = req.cookies.get(DEBUG_COOKIE_KEY)?.value;
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}

/**
 *
 * 判断是否强制进入登录页（例如 refresh 失败希望重新登录）。
 * - 通过 query: force=true/1/yes/on 开启；
 * - 用于绕过“已登录访问 /login 自动跳回”的逻辑，避免出现跳转循环。
 *
 */
function isForceLogin(req: NextRequest): boolean {
  const v = req.nextUrl.searchParams.get('force');
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}

/**
 *
 * 构造带回跳参数的登录页地址。
 * @param req Next.js 中间件的请求对象
 * @returns 指向登录页的 URL，包含 next 查询参数
 *
 */
function buildLoginUrl(req: NextRequest): URL {
  const url = req.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  // 仅存相对路径，避免开放重定向
  const targetPath = buildSafeRelativeTarget(req);
  url.searchParams.set('next', targetPath);
  return url;
}

/**
 *
 * 提取并校验目标地址，仅允许以单斜杠开头的站内相对路径。
 * @param req Next.js 中间件的请求对象
 * @returns 形如 "/xxx?query=..." 的相对路径
 *
 */
function buildSafeRelativeTarget(req: NextRequest): string {
  const p = req.nextUrl.pathname;
  const q = req.nextUrl.search || '';
  const combined = `${p}${q}`;
  // 允许 "/" 开头但不允许 "//"（防止协议相对 URL），不接受绝对 URL
  const safe = combined.startsWith('/') && !combined.startsWith('//') ? combined : '/';
  // 避免回跳目标指向登录页本身（会造成循环）
  if (safe === LOGIN_PATH || safe.startsWith(`${LOGIN_PATH}?`) || safe.startsWith(`${LOGIN_PATH}/`)) {
    return '/';
  }
  return safe;
}

/**
 *
 * 从查询参数或 Cookie 中读取回跳地址，并做安全校验。
 * @param req Next.js 中间件的请求对象
 * @returns 安全的相对路径，若不存在则返回 null
 *
 */
function readReturnTo(req: NextRequest): string | null {
  const fromQuery = req.nextUrl.searchParams.get('next');
  const fromCookie = req.cookies.get(REDIRECT_TO_COOKIE)?.value;
  const candidate = fromQuery || fromCookie || '';
  if (
    candidate.startsWith('/') &&
    !candidate.startsWith('//') &&
    candidate !== LOGIN_PATH &&
    !candidate.startsWith(`${LOGIN_PATH}?`) &&
    !candidate.startsWith(`${LOGIN_PATH}/`)
  ) {
    return candidate;
  }
  return null;
}

/**
 *
 * 创建到登录页的重定向响应，并设置回跳 Cookie。
 * @param req Next.js 中间件的请求对象
 *
 */
function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = buildLoginUrl(req);
  const res = NextResponse.redirect(loginUrl);
  res.cookies.set({
    name: REDIRECT_TO_COOKIE,
    value: buildSafeRelativeTarget(req),
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  });
  return res;
}

/**
 *
 * 若已登录且访问登录页：
 * - 若存在回跳地址（next 参数或 redirect_to Cookie），优先跳回原地址
 * - 否则跳转到默认功能页
 * 若未登录且访问非登录页：
 * - 跳转到登录页，并附带 next 参数与临时 Cookie，以便登录成功后回跳
 *
 */
export function middleware(req: NextRequest) {
  const authed = isAuthenticated(req);
  const onLogin = isLoginPath(req);
  const forceLogin = isForceLogin(req);

  // 放行浏览器/开发工具的探测与约定路径，例如 /.well-known/*
  if (req.nextUrl.pathname.startsWith('/.well-known')) {
    return NextResponse.next();
  }

  // 已登录访问 /login：常规情况下跳回原地址或默认功能页；
  // 但如果带有 from=logout（主动退出后进入登录页），则放行到登录页。
  const from = req.nextUrl.searchParams.get('from');
  const isFromLogout = from === 'logout';
  if (authed && onLogin && !isFromLogout && !forceLogin) {
    const returnTo = readReturnTo(req) || DEFAULT_AFTER_LOGIN_PATH;
    const target = new URL(returnTo, req.nextUrl.origin);
    if (isDebugEnabled(req)) {
      console.info('[middleware] authed user hit /login, redirecting', {
        from,
        forceLogin,
        returnTo,
      });
    }
    const res = NextResponse.redirect(target);
    // 登录成功后清理临时 Cookie，避免后续干扰
    res.cookies.delete(REDIRECT_TO_COOKIE);
    return res;
  }

  // 未登录访问非 /login => 引导到登录页（附带回跳信息）
  if (!authed && !onLogin) {
    if (isDebugEnabled(req)) {
      console.info('[middleware] unauth user hit protected page, redirecting to /login', {
        pathname: req.nextUrl.pathname,
        search: req.nextUrl.search,
      });
    }
    return redirectToLogin(req);
  }

  if (authed && onLogin && (isFromLogout || forceLogin)) {
    if (isDebugEnabled(req)) {
      console.info('[middleware] allow /login (override)', { from, forceLogin });
    }
  }

  // 其他情况放行
  return NextResponse.next();
}

/**
 *
 * 中间件匹配范围配置：
 * - 排除静态资源、Next 内部资源、API 路由
 * - 其余路径均进入本中间件
 *
 */
export const config = {
  matcher: [
    // 参考：使用负向前瞻排除若干前缀/扩展名
    '/((?!api|_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp|css|js|map)$).*)',
  ],
};
