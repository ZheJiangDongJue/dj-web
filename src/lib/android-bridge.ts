"use client";

/**
 *
 * Android WebView 桥接工具。
 * 目标：
 * - 类型安全地向原生发送动作（action/data），并通过 callbackId 拿回结果
 * - 定义并初始化 window.WebMethods，让原生可回调 Web（事件通知、数据刷新、页面信息）
 * - 提供事件订阅/退订工具，便于业务按需监听原生通知
 * - 在非 Android WebView 场景下保证降级与报错信息清晰
 *
 */

/**
 *
 * 本文件内部使用的最小类型声明，避免从 .d.ts 再导入
 *
 */
export interface AndroidBridgeResult {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface AdvancedImageItemPayload {
  id: string;
  uri: string;
  path?: string;
  name?: string;
  size?: number;
  width?: number;
  height?: number;
  bucketName?: string;
  mime?: string;
  selectedAt?: number;
  dateAdded?: number;
}

export interface AdvancedImagePickerResult extends AndroidBridgeResult {
  selected: AdvancedImageItemPayload[];
  diff: {
    added: AdvancedImageItemPayload[];
    removed: AdvancedImageItemPayload[];
  };
  extra?: {
    maxCountHit?: boolean;
    durationMs?: number;
    [key: string]: unknown;
  };
}

/**
 *
 * 调起相机拍照的返回值。
 * @remarks
 * - success=false：表示用户取消或拍照失败，仅保证 message 可用；\\n
 * - success=true：返回可用于 NCR “照片证据”与高级图片选择器回显的图片项结构。\\n
 *
 */
export type TakePhotoResult =
  | (AndroidBridgeResult & {
      success: false;
    })
  | (AndroidBridgeResult &
      AdvancedImageItemPayload & {
        success: true;
      });

export interface PickImagesAdvancedOptions {
  title?: string;
  maxCount?: number;
  selectedItems?: AdvancedImageItemPayload[];
  allowMixedFolder?: boolean;
  [key: string]: unknown;
}

export interface FetchImageBase64Options {
  id?: string;
  uri?: string;
  path?: string;
  type?: "preview" | "original";
  maxDim?: number;
  width?: number;
  height?: number;
}

export interface FetchImageBase64Result extends AndroidBridgeResult {
  id?: string;
  uri?: string;
  path?: string;
  base64?: string;
  mime?: string;
  width?: number;
  height?: number;
  type?: "preview" | "original";
}

export interface WebMethodsObject {
  handleNotification: (type: string, data?: unknown) => void;
  /**
   * 原生请求当前网页处理返回键。
   * @returns true 表示网页已经接管返回流程，false 表示应由原生兜底。
   */
  handleBack?: () => boolean;
  refreshData: (params?: unknown) => unknown;
  getPageInfo: () => {
    path: string;
    query: string;
    title: string;
    url: string;
  };
  logout?: () => void;
}

export type AndroidAppLifecycleStatus = "unknown" | "resumed" | "paused";

type AndroidAppLifecycleState = {
  status: AndroidAppLifecycleStatus;
  updatedAt: number;
  pendingAfterResumed: Array<() => void>;
};

const GLOBAL_ANDROID_APP_LIFECYCLE_KEY = "__dj_android_app_lifecycle__";

type AndroidBackHandler = () => void;

/** 当前已挂载页面的 Android 返回处理器。 */
let currentAndroidBackHandler: AndroidBackHandler | null = null;

/**
 * 注册当前页面的 Android 返回处理器。
 *
 * @param handler 页面返回逻辑；传入 null 表示清空当前处理器。
 * @returns 清理函数；仅当当前处理器仍是本次注册项时恢复之前的处理器。
 */
export function registerAndroidBackHandler(handler: AndroidBackHandler | null): () => void {
  const previousHandler = currentAndroidBackHandler;
  currentAndroidBackHandler = handler;

  return () => {
    if (currentAndroidBackHandler === handler) {
      currentAndroidBackHandler = previousHandler;
    }
  };
}

/**
 * 执行网页返回处理器。
 *
 * @returns true 表示网页已接管；没有页面处理器或处理器异常时返回 false，交给原生兜底。
 */
function handleAndroidBackRequest(): boolean {
  if (!currentAndroidBackHandler) return false;

  try {
    currentAndroidBackHandler();
    return true;
  } catch (error) {
    console.error("[AndroidBridge] 网页返回处理失败:", error);
    return false;
  }
}

function getAndroidAppLifecycleHost(): any {
  if (typeof window !== "undefined") return window as any;
  // 兼容旧 WebView：部分环境没有 globalThis
  if (typeof globalThis !== "undefined") return globalThis as any;
  return {} as any;
}

function safeDefer(fn: () => void): void {
  try {
    if (typeof window !== "undefined" && typeof window.setTimeout === "function") {
      window.setTimeout(fn, 0);
      return;
    }
  } catch {
    // ignore
  }
  try {
    fn();
  } catch {
    // ignore
  }
}

function getAndroidAppLifecycleState(): AndroidAppLifecycleState {
  const host = getAndroidAppLifecycleHost();
  const existing = host?.[GLOBAL_ANDROID_APP_LIFECYCLE_KEY] as AndroidAppLifecycleState | undefined;
  if (
    existing &&
    (existing.status === "unknown" || existing.status === "resumed" || existing.status === "paused") &&
    typeof existing.updatedAt === "number" &&
    Array.isArray(existing.pendingAfterResumed)
  ) {
    return existing;
  }
  const created: AndroidAppLifecycleState = {
    status: "unknown",
    updatedAt: 0,
    pendingAfterResumed: [],
  };
  try {
    host[GLOBAL_ANDROID_APP_LIFECYCLE_KEY] = created;
  } catch {
    // ignore
  }
  return created;
}

function updateAndroidAppLifecycleFromNotification(type: string): void {
  if (type !== "appPaused" && type !== "appResumed") return;
  const s = getAndroidAppLifecycleState();
  s.updatedAt = Date.now();
  if (type === "appPaused") {
    s.status = "paused";
    return;
  }
  s.status = "resumed";
  if (s.pendingAfterResumed.length > 0) {
    const pending = s.pendingAfterResumed.splice(0);
    for (const fn of pending) {
      safeDefer(fn);
    }
  }
}

export function getAndroidAppLifecycleStatus(): AndroidAppLifecycleStatus {
  return getAndroidAppLifecycleState().status;
}

export function isAndroidAppPaused(): boolean {
  return getAndroidAppLifecycleStatus() === "paused";
}

export function runAfterAndroidAppResumed(fn: () => void): void {
  if (typeof window === "undefined") {
    safeDefer(fn);
    return;
  }
  const s = getAndroidAppLifecycleState();
  if (s.status === "paused") {
    s.pendingAfterResumed.push(fn);
    return;
  }
  safeDefer(fn);
}

/**
 *
 * 生成唯一的回调 ID。
 * @returns 形如 `js_callback_时间戳_随机数` 的字符串
 *
 */
function genCallbackId(): string {
  return `js_callback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 *
 * 判断 Android 桥接是否可用。
 * @returns true 表示 window.android.receiveMessage 存在且可调用
 *
 */
export function isAndroidBridgeAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const android = (window as unknown as { android?: Record<string, unknown> }).android;
  if (!android) return false;
  const method = android["receiveMessage"];
  // 某些 ROM/系统可能将桥接方法暴露为不可枚举或特殊对象；
  // 只要存在该键即视为可用，具体调用错误会在 sendToAndroid 中捕获。
  return (
    typeof method === "function" ||
    typeof method === "object" ||
    typeof method !== "undefined"
  );
}

/**
 *
 * 判断是否可使用 prompt 作为桥接后备通道。
 * 说明：Android 宿主已在 WebChromeClient.onJsPrompt 中实现对 "AndroidBridge" 的拦截。
 *
 */
// 撤回：不使用 prompt 后备通道

/**
 *
 * 发送消息到 Android 原生并等待回调结果。
 * 注意：
 * - 原生侧（WebViewBridge）会通过 executeJs 调用 window[callbackId](result)
 * - 因此这里会在 window 上临时挂载同名函数，用后即焚
 * @param action 动作名（如：takePhoto、pickImage、getDeviceInfo 等）
 * @param data   数据对象（可选）
 * @param timeoutMs 超时时间（毫秒）。
 * - 传 undefined：按 action 使用默认值（交互类 action 默认不启用硬超时，其余默认 10000ms）
 * - 传 <= 0：禁用硬超时（适用于需要等待用户较长时间操作的场景，如选图/拍照/扫码）
 *
 */
export function sendToAndroid<T extends AndroidBridgeResult = AndroidBridgeResult>(
  action: string,
  data?: object,
  timeoutMs?: number
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const callbackId = genCallbackId();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const effectiveTimeoutMs =
      typeof timeoutMs === "number" && Number.isFinite(timeoutMs)
        ? timeoutMs
        : getDefaultActionTimeoutMs(action);

    /**
     *
     * 原生将调用 window[callbackId](result)。
     * 该回调会在收到结果后自动注销，避免污染全局。
     *
     */
    (window as unknown as Record<string, unknown>)[callbackId] = ((result: unknown) => {
      if (timer) clearTimeout(timer);
      try {
        // 原生传递的是对象字面量（JSONObject.toString()），无需再解析；
        // 如遇字符串则尝试 JSON 解析，保持健壮性。
        const normalized =
          typeof result === "string" ? (JSON.parse(result) as T) : (result as T);
        resolve(normalized);
      } catch (e) {
        reject(e);
      } finally {
        try {
          delete (window as unknown as Record<string, unknown>)[callbackId];
        } catch {
          // ignore
        }
      }
    }) as unknown;

    // 超时保护（可选）：若启用，则防止永不回调导致 Promise 永久 pending。
    if (effectiveTimeoutMs > 0 && typeof setTimeout === "function") {
      timer = setTimeout(() => {
        try {
          delete (window as unknown as Record<string, unknown>)[callbackId];
        } catch {
          // ignore
        }
        reject(new Error(`Android 调用超时：action=${action}`));
      }, effectiveTimeoutMs);
    }

    // 构造消息体并发送给原生。
    const payload = JSON.stringify({ action, data: data ?? {}, callbackId });
    try {
      if (!isAndroidBridgeAvailable()) {
        throw new Error("Android 桥接不可用：未检测到 window.android.receiveMessage");
      }
      // 运行时由原生注入
      window.android!.receiveMessage(payload);
    } catch (err) {
      if (timer) clearTimeout(timer);
      try { delete (window as unknown as Record<string, unknown>)[callbackId]; } catch { /* ignore */ }
      reject(err);
    }
  });
}

const DEFAULT_ANDROID_ACTION_TIMEOUT_MS = 10_000;

/**
 *
 * 针对不同 action 给出更贴合用户场景的默认超时策略。
 * 说明：
 * - “交互类 action”（选图/拍照/扫码）可能需要等待用户较长时间操作，默认不启用硬超时；
 * - “非交互类 action”（读取设备信息、显示 toast、fetch base64 等）仍保持默认超时兜底。
 *
 */
function getDefaultActionTimeoutMs(action: string): number {
  switch (action) {
    case "takePhoto":
    case "pickImage":
    case "pickImagesAdvanced":
    case "scanQRCode":
      return 0;
    default:
      return DEFAULT_ANDROID_ACTION_TIMEOUT_MS;
  }
}

/**
 *
 * 初始化 WebMethods，对齐原生 WebViewBridge 的期望：
 * - handleNotification：统一事件入口，并派发浏览器自定义事件 'android-notification'
 * - refreshData：业务可重写；默认仅记录日志
 * - getPageInfo：返回基本页面信息
 * 该方法可在应用启动时调用一次。
 *
 */
export function ensureWebMethods(): WebMethodsObject {
  if (typeof window === "undefined") {
    // SSR 环境直接返回一个空壳对象，避免报错
    return {
      handleNotification: () => void 0,
      handleBack: () => handleAndroidBackRequest(),
      refreshData: () => ({}),
      getPageInfo: () => ({ path: "", query: "", title: "", url: "" }),
    };
  }

  if (!window.WebMethods) {
    window.WebMethods = {
      /**
       *
       * 统一通知入口：派发 'android-notification' 事件供前端订阅。
       *
       */
      handleNotification: (type: string, data?: unknown) => {
        try {
          updateAndroidAppLifecycleFromNotification(type);
          const evt = new CustomEvent("android-notification", {
            detail: { type, data: data ?? {} },
          });
          window.dispatchEvent(evt);
        } catch (e) {
          console.error("[WebMethods] handleNotification error:", e);
        }
      },

      /**
       *
       * 默认实现：记录日志并返回成功对象。
       *
       */
      refreshData: (params?: unknown) => {
        console.log("[WebMethods] refreshData:", params);
        return { success: true };
      },

      /**
       *
       * 返回当前页面的基础信息，便于原生拉取。
       *
       */
      getPageInfo: () => {
        try {
          return {
            path: window.location.pathname,
            query: window.location.search,
            title: document.title,
            url: window.location.href,
          };
        } catch {
          return { path: "", query: "", title: "", url: "" };
        }
      },
      handleBack: () => handleAndroidBackRequest(),
    };
  } else if (typeof window.WebMethods.handleBack !== "function") {
    // 原生可能先创建了旧版 WebMethods，补齐返回协议而不覆盖其它已有方法。
    window.WebMethods.handleBack = () => handleAndroidBackRequest();
  }

  return window.WebMethods!;
}

/**
 *
 * 初始化 Android 桥接：
 * - 确保 WebMethods 已准备好
 * - 如原生提供 onBridgeReady，可主动回告原生（提升首次握手的确定性）
 *
 */
export function initAndroidBridge(): void {
  ensureWebMethods();
  if (typeof window !== "undefined" && window.android?.onBridgeReady) {
    try {
      window.android.onBridgeReady();
    } catch (e) {
      console.warn("[AndroidBridge] onBridgeReady 调用失败：", e);
    }
  }
}

/**
 *
 * 订阅原生通知事件。
 * @param handler 回调函数，收到 { type, data } 结构
 * @returns 取消订阅函数
 *
 */
export function addAndroidNotificationListener(
  handler: (payload: { type: string; data: unknown }) => void
): () => void {
  const listener = (evt: Event) => {
    const detail = (evt as CustomEvent).detail as { type: string; data: unknown };
    handler(detail);
  };
  if (typeof window !== "undefined") {
    window.addEventListener("android-notification", listener as EventListener);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("android-notification", listener as EventListener);
    }
  };
}

// —— 以下是若干便捷封装：对原生 action 的类型化调用 ——

/**
 *
 * 桥接自检（bridgeCheck）。
 *
 */
export function bridgeCheck() {
  return sendToAndroid("bridgeCheck");
}

/**
 *
 * 获取设备信息。
 *
 */
export async function getDeviceInfo() {
  const res = await sendToAndroid("getDeviceInfo");
  return res.deviceInfo as {
    model: string;
    brand: string;
    manufacturer: string;
    version: string;
    sdkVersion: number;
  };
}

/**
 *
 * 显示原生 Toast。
 * @param message 文本
 * @param duration 时长：'short' | 'long'
 *
 */
export function showToast(message: string, duration: "short" | "long" = "short") {
  return sendToAndroid("showToast", { message, duration });
}

/**
 *
 * 调起相机拍照。
 *
 */
export function takePhoto() {
  return sendToAndroid<TakePhotoResult>("takePhoto");
}

/**
 *
 * 选择图片（相册）。
 *
 */
export function pickImage() {
  return sendToAndroid("pickImage");
}

/**
 *
 * 调起高级图片选择器。
 *
 */
export function pickImagesAdvanced(options?: PickImagesAdvancedOptions) {
  return sendToAndroid<AdvancedImagePickerResult>("pickImagesAdvanced", options ?? {});
}

/**
 *
 * 按需获取预览或原图的 base64。
 *
 */
export function fetchImageBase64(options: FetchImageBase64Options) {
  return sendToAndroid<FetchImageBase64Result>("fetchImageBase64", options ?? {});
}

/**
 *
 * 返回或退出。
 * @param shouldExit 为 true 时直接退出宿主 Activity
 *
 */
export function goBack(shouldExit: boolean = false) {
  return sendToAndroid("goBack", { shouldExit });
}

/**
 *
 * 设置原生标题栏标题。
 *
 */
export function setTitle(title: string) {
  return sendToAndroid("setTitle", { title });
}

// —— 扫码封装 ——

/**
 *
 * 扫码结果数据结构（标准化）。
 * - barcode: 统一的扫码文本
 * - 其他字段：若原生附带额外信息（如 timestamp），将一并透传
 *
 */
export interface ScanResultPayload {
  barcode: string;
  [key: string]: unknown;
}

type ScanListenerDebugState = { seq: number };
const GLOBAL_SCAN_LISTENER_DEBUG_KEY = "__dj_scan_listener_debug__";

function getScanListenerDebugState(): ScanListenerDebugState {
  const g = globalThis as unknown as Record<string, unknown>;
  const existing = g[GLOBAL_SCAN_LISTENER_DEBUG_KEY] as ScanListenerDebugState | undefined;
  if (existing) return existing;
  const created: ScanListenerDebugState = { seq: 0 };
  g[GLOBAL_SCAN_LISTENER_DEBUG_KEY] = created;
  return created;
}

function nextScanListenerDebugId(): number {
  const s = getScanListenerDebugState();
  s.seq += 1;
  return s.seq;
}

function isDebugCookieEnabled(): boolean {
  // 1) debug cookie（全局调试开关）
  if (typeof document !== "undefined") {
    try {
      const raw = document.cookie ?? "";
      if (raw && /(?:^|;\s*)debug=(?:true|1|yes|on)(?:;|$)/i.test(raw)) return true;
    } catch {
      // ignore
    }
  }

  return false;
}

/**
 *
 * 添加扫码结果监听器。
 * 说明：
 * - 只拦截原生通知中 type === 'scanResult' 的事件
 * - 对不同字段名进行归一化（支持 barcode/code/text/value）
 * - 将其他属性原样透传，便于业务扩展（如 timestamp 等）
 * @param handler 回调函数，入参为标准化后的扫码结果
 * @returns 取消订阅函数
 *
 */
export function addScanListener(handler: (payload: ScanResultPayload) => void): () => void {
  const debugEnabled = isDebugCookieEnabled();
  const debugId = debugEnabled ? nextScanListenerDebugId() : 0;
  if (debugEnabled) {
    try {
      console.log(`[android-bridge] addScanListener#${debugId} 注册`);
    } catch {
      // ignore
    }
  }
  const off = addAndroidNotificationListener(({ type, data }) => {
    if (type !== "scanResult") return;
    const normalized = normalizeScanData(data);
    if (debugEnabled) {
      try {
        console.log(`[android-bridge] scanResult#${debugId}:`, normalized);
      } catch {
        // ignore
      }
    }
    handler(normalized);
  });
  return () => {
    if (debugEnabled) {
      try {
        console.log(`[android-bridge] addScanListener#${debugId} 取消`);
      } catch {
        // ignore
      }
    }
    off();
  };
}

/**
 *
 * 主动发起扫码请求（若宿主实现了对应能力）。
 * @param extra 可选的附加参数（由宿主决定是否使用）
 *
 */
export function scanQRCode(extra?: Record<string, unknown>) {
  return sendToAndroid("scanQRCode", extra ?? {});
}

/**
 *
 * 将原生传入的数据标准化为 ScanResultPayload。
 *
 */
function normalizeScanData(input: unknown): ScanResultPayload {
  if (typeof input === "string") {
    return { barcode: input };
  }
  if (input && typeof input === "object") {
    const obj = { ...(input as Record<string, unknown>) };
    const cand = [obj["barcode"], obj["code"], obj["text"], obj["value"]].find(
      (v) => typeof v === "string"
    ) as string | undefined;
    return { ...obj, barcode: cand ?? JSON.stringify(input) };
  }
  return { barcode: String(input ?? "") };
}
