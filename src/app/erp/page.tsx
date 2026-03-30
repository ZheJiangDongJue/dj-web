import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 *
 * ERP 根路由（服务端重定向守卫）
 * - 未登录（无 refreshToken）时跳转到登录页，并带上 next=/erp
 * - 已登录则跳转至功能页入口 /erp/features
 *
 */
/**
 *
 * ERP 根路由（服务端重定向守卫）
 * - 未登录（无 refreshToken）时跳转到登录页，并带上 next=/erp
 * - 已登录则跳转至功能页入口 /erp/features
 * - 注意：Next.js 15 起，必须以异步方式读取动态 API（如 cookies()）
 *
 */
export default async function ErpIndexRedirect() {
  // 异步获取 cookieStore，符合 Next.js 15 的动态 API 规范
  const cookieStore = await cookies();
  const rt = cookieStore.get("refreshToken")?.value;
  const debug = cookieStore.get('debug')?.value;
  const isDebug = Boolean(debug && /^(?:true|1|yes|on)$/i.test(debug));
  if (!rt) {
    if (isDebug) {
      console.info('[erp] no refreshToken, redirecting to /login', { next: '/erp' });
    }
    redirect("/login?app=erp&next=/erp");
  }
  if (isDebug) {
    console.info('[erp] has refreshToken, redirecting to /erp/features');
  }
  redirect("/erp/features");
}
