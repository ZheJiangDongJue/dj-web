"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addAndroidNotificationListener,
  bridgeCheck,
  addScanListener,
  getDeviceInfo,
  goBack,
  initAndroidBridge,
  isAndroidBridgeAvailable,
  pickImage,
  pickImagesAdvanced,
  fetchImageBase64,
  sendToAndroid,
  scanQRCode,
  setTitle,
  showToast,
  takePhoto,
  type AdvancedImageItemPayload,
  type AdvancedImagePickerResult,
  type PickImagesAdvancedOptions,
} from "@/lib/android-bridge";

type LogLevel = "info" | "warn" | "error";
type LensFacing = "front" | "back";

interface LogEntry {
  time: string;
  level: LogLevel;
  message: string;
  payload?: unknown;
}

type Base64Variant = "preview" | "original";

interface Base64CachePayload {
  base64: string;
  mime?: string;
  width?: number;
  height?: number;
}

type Base64CacheRecord = Record<string, { preview?: Base64CachePayload; original?: Base64CachePayload }>;
type Base64LoadingRecord = Record<string, { preview?: boolean; original?: boolean }>;

/**
 *
 * 获取当前时间的简短字符串表示（HH:mm:ss）。
 *
 */
function now(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 *
 * 将 JSON 字符串解析为对象；若失败返回 Error，便于界面展示错误信息。
 *
 */
function safeJsonParse(input: string): unknown | Error {
  try {
    if (!input.trim()) return {};
    return JSON.parse(input);
  } catch (e) {
    return e instanceof Error ? e : new Error(String(e));
  }
}

/**
 *
 * 开发者调试页面：Android 桥接
 * - 展示桥接可用性与握手自检
 * - 常用功能测试：Toast / 设备信息 / 相机 / 相册 / 返回 / 标题
 * - 自定义指令：action + JSON data + 超时
 * - 原生通知事件监听：android-notification
 *
 */
export default function AndroidBridgeDebugPage() {
  const [available, setAvailable] = useState(false);
  const [handshakeOk, setHandshakeOk] = useState<boolean | null>(null);
  // 撤回：不再区分 API/PROMPT 通道，仅基于 window.android 判断
  const [deviceInfo, setDeviceInfo] = useState<unknown>(null);
  const [result, setResult] = useState<unknown>(null);
  // 预览图片状态：分别记录“拍照”和“相册选择”的最新结果
  const [photoPreviewSrc, setPhotoPreviewSrc] = useState<string | null>(null);
  const [pickedPreviewSrc, setPickedPreviewSrc] = useState<string | null>(null);
  const [advancedTitle, setAdvancedTitle] = useState("选择素材");
  const [advancedMaxCount, setAdvancedMaxCount] = useState("9");
  const [advancedResult, setAdvancedResult] = useState<AdvancedImagePickerResult | null>(null);
  const [advancedSelectedItems, setAdvancedSelectedItems] = useState<AdvancedImageItemPayload[]>([]);
  const [advancedAllowMixedFolder, setAdvancedAllowMixedFolder] = useState(true);
  const advancedSelectedRef = useRef<AdvancedImageItemPayload[]>([]);
  const [advancedBase64Map, setAdvancedBase64Map] = useState<Base64CacheRecord>({});
  const [advancedBase64Loading, setAdvancedBase64Loading] = useState<Base64LoadingRecord>({});
  const [customAction, setCustomAction] = useState("bridgeCheck");
  const [customData, setCustomData] = useState("{}");
  const [customTimeout, setCustomTimeout] = useState(10000);
  const logsRef = useRef<LogEntry[]>([]);
  const [, force] = useState(0);
  const checkingRef = useRef(false);
  const hasCheckedRef = useRef(false);
  
  // —— 扫码监听相关 ——
  interface ScanEntry {
    time: string;
    barcode: string;
    raw?: unknown;
  }
  const scansRef = useRef<ScanEntry[]>([]);

  /**
   *
   * 从原生返回结果中提取可用于 <img> 的 src。
   * - 优先使用 result.uri；
   * - 其次尝试 result.path，若是本地绝对路径则补充 file:// 前缀；
   * - 其他情况返回 null。
   *
   */
  function extractImageSrc(result: unknown): string | null {
    try {
      if (!result || typeof result !== "object") return null;
      const r = result as Record<string, unknown>;
      const uri = typeof r["uri"] === "string" ? (r["uri"] as string) : undefined;
      const path = typeof r["path"] === "string" ? (r["path"] as string) : undefined;
      const b64 = typeof r["base64"] === "string" ? (r["base64"] as string) : undefined;
       const originalB64 =
         typeof r["originalBase64"] === "string" ? (r["originalBase64"] as string) : undefined;
      const mime = typeof r["mime"] === "string" ? (r["mime"] as string) : undefined;

      if (b64 && b64.length > 0) {
        const type = mime && mime.length > 0 ? mime : "image/*";
        // 若原生仅返回纯base64（不含前缀），补足 data URL 头
        const hasPrefix = b64.startsWith("data:");
        return hasPrefix ? b64 : `data:${type};base64,${b64}`;
      }
      if (originalB64 && originalB64.length > 0) {
        const type = mime && mime.length > 0 ? mime : "image/*";
        const hasPrefix = originalB64.startsWith("data:");
        return hasPrefix ? originalB64 : `data:${type};base64,${originalB64}`;
      }
      if (path && path.length > 0) {
        // 已带协议则直接返回，否则视为本地文件路径
        if (/^[a-zA-Z]+:\/\//.test(path)) return path;
        return `file://${path}`;
      }
      if (uri && uri.length > 0) return uri;
      return null;
    } catch {
      return null;
    }
  }

  function base64Size(b64?: string | null): string {
    if (!b64) return "0B";
    const pure = b64.startsWith("data:") ? b64.slice(b64.indexOf(",") + 1) : b64;
    if (!pure) return "0B";
    const padding = pure.endsWith("==") ? 2 : pure.endsWith("=") ? 1 : 0;
    const bytes = (pure.length * 3) / 4 - padding;
    if (!Number.isFinite(bytes) || bytes <= 0) return "0B";
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${Math.round(bytes)} B`;
  }

  function toDataUrl(b64: string, mime?: string) {
    if (!b64) return "";
    const type = mime && mime.length > 0 ? mime : "image/*";
    return b64.startsWith("data:") ? b64 : `data:${type};base64,${b64}`;
  }

  /**
   *
   * 根据允许 ID 列表过滤缓存，防止遗留无效的 base64 数据。
   *
   */
  function filterRecordByIds<T>(source: Record<string, T>, allowed: Set<string>): Record<string, T> {
    if (!source || Object.keys(source).length === 0) {
      return source;
    }
    const next: Record<string, T> = {};
    let changed = false;
    for (const key of Object.keys(source)) {
      if (allowed.has(key)) {
        next[key] = source[key];
      } else {
        changed = true;
      }
    }
    return changed ? next : source;
  }

  /**
   *
   * 同步高级选择器的 base64/加载缓存，确保仅保留仍存在的图片 ID。
   *
   */
  function syncAdvancedCaches(nextItems: AdvancedImageItemPayload[]) {
    const allowed = new Set(nextItems.map((item) => item.id));
    setAdvancedBase64Map((prev) => filterRecordByIds(prev, allowed));
    setAdvancedBase64Loading((prev) => filterRecordByIds(prev, allowed));
  }

  /**
   *
   * 追加日志并刷新 UI。
   *
   */
  const addLog = useCallback((level: LogLevel, message: string, payload?: unknown) => {
    logsRef.current = [{ time: now(), level, message, payload }, ...logsRef.current].slice(
      0,
      200
    );
    force((x) => x + 1);
  }, []);

  /**
   *
   * 触发一次 bridgeCheck，自带并发保护与日志。
   * @param trigger 触发来源标记，便于日志追踪
   *
   */
  const runBridgeCheck = useCallback((trigger: "initial" | "poll" | "event" | "manual") => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    bridgeCheck()
      .then((res) => {
        addLog("info", `bridgeCheck 成功(${trigger})`, res);
        setHandshakeOk(true);
      })
      .catch((err) => {
        addLog("warn", `bridgeCheck 失败(${trigger})`, String(err));
        setHandshakeOk(false);
      })
      .finally(() => {
        checkingRef.current = false;
      });
  }, [addLog]);

  /**
   *
   * 处理原生通知的扫码结果。
   * - 兼容多种数据结构：{ barcode }, { code }, { text } 或 直接字符串
   * - 记录到本地列表并刷新 UI
   *
   */
  const handleScanResult = useCallback((data: unknown) => {
    // 提取条码文本
    let barcode = "";
    if (typeof data === "string") {
      barcode = data;
    } else if (data && typeof data === "object") {
      const anyData = data as Record<string, unknown>;
      const cands = [
        anyData["barcode"],
        anyData["code"],
        anyData["text"],
        anyData["value"],
      ];
      const first = cands.find((v) => typeof v === "string");
      barcode = (first as string) || JSON.stringify(data);
    } else {
      barcode = String(data ?? "");
    }

    const entry: ScanEntry = { time: now(), barcode, raw: data };
    scansRef.current = [entry, ...scansRef.current].slice(0, 100);
    force((x) => x + 1);
  }, []);

  /**
   *
   * 初始化桥接与事件订阅，并在合适时机进行自检。
   *
   */
  useEffect(() => {
    // 初始化（确保 WebMethods 并尝试与原生握手）
    initAndroidBridge();

    // 检查可用性
    const apiOk = isAndroidBridgeAvailable();
    setAvailable(apiOk);
    addLog("info", `Android 桥接可用性: ${apiOk}`);

    // 订阅通知
    const off = addAndroidNotificationListener(({ type, data }) => {
      addLog("info", `通知: ${type}`, data);
      if (type === "bridgeReady") {
        // 原生回告桥接已就绪，触发自检
        runBridgeCheck("event");
      }
    });
    // 独立订阅扫码结果（使用公共 API）
    const offScan = addScanListener(handleScanResult);
    // 短时轮询，适配某些机型延迟注入 window.android 的情况
    let attempts = 0;
    const id = setInterval(() => {
      const ok = isAndroidBridgeAvailable();
      setAvailable(ok);
      if (ok) {
        addLog("info", "检测到 Android 桥接已可用");
        if (!hasCheckedRef.current) {
          hasCheckedRef.current = true;
          // 可用且尚未自检，触发一次自检
          runBridgeCheck("poll");
        }
        clearInterval(id);
      } else if (++attempts >= 20) {
        clearInterval(id);
      }
    }, 250);

    return () => {
      clearInterval(id);
      off();
      offScan();
    };
  }, [addLog, runBridgeCheck, handleScanResult]);
  

  /**
   *
   * 主动请求原生扫码（可指定前置/后置）。
   * - 结果仍通过 scanResult 通知返回
   *
   */
  async function requestScan(lensFacing: LensFacing) {
    try {
      const res = await scanQRCode({ lensFacing });
      const label = lensFacing === "front" ? "前置" : "后置";
      addLog("info", `请求${label}扫码指令已发送`, res);
    } catch (e) {
      addLog("error", `请求${lensFacing === "front" ? "前置" : "后置"}扫码失败`, String(e));
    }
  }

  /**
   *
   * 异步加载指定已选图片的 base64 数据，支持预览/原图两种模式。
   *
   */
  async function requestAdvancedBase64(item: AdvancedImageItemPayload, type: Base64Variant) {
    const key = item.id;
    setAdvancedBase64Loading((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? {}), [type]: true },
    }));
    try {
      const res = await fetchImageBase64({
        id: item.id,
        uri: item.uri,
        path: item.path,
        type,
        maxDim: type === "preview" ? 960 : undefined,
        width: item.width,
        height: item.height,
      });
      if (!res.success || !res.base64) {
        throw new Error(res.message || "Android 未返回 base64");
      }
      const payload: Base64CachePayload = {
        base64: res.base64,
        mime: res.mime,
        width: res.width,
        height: res.height,
      };
      setAdvancedBase64Map((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] ?? {}),
          [type]: payload,
        },
      }));
      addLog("info", `已获取${type === "preview" ? "预览" : "原图"} base64`, {
        id: item.id,
        type,
        size: base64Size(res.base64),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      addLog("error", `获取${type === "preview" ? "预览" : "原图"} base64 失败`, {
        id: item.id,
        type,
        error: message,
      });
    } finally {
      setAdvancedBase64Loading((prev) => {
        const entry = prev[key];
        if (!entry) {
          return prev;
        }
        const nextEntry = { ...entry };
        delete nextEntry[type];
        if (!nextEntry.preview && !nextEntry.original) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: nextEntry };
      });
    }
  }

  /**
   *
   * 调用高级多选图片选择器。
   *
   */
  async function openAdvancedPicker() {
    const parsedMax = parseInt(advancedMaxCount, 10);
    const options: PickImagesAdvancedOptions = {
      title: advancedTitle.trim() || undefined,
      allowMixedFolder: advancedAllowMixedFolder,
      selectedItems: advancedSelectedRef.current,
    };
    if (!Number.isNaN(parsedMax) && parsedMax > 0) {
      options.maxCount = parsedMax;
    }
    try {
      const res = await pickImagesAdvanced(options);
      setAdvancedResult(res);
      addLog("info", "高级图片选择器返回", res);
      if (res.success) {
        const normalized = res.selected ?? [];
        advancedSelectedRef.current = normalized;
        setAdvancedSelectedItems(normalized);
        syncAdvancedCaches(normalized);
      }
    } catch (e) {
      addLog("error", "高级图片选择器调用失败", String(e));
    }
  }

  function clearAdvancedSelectionMemory() {
    advancedSelectedRef.current = [];
    setAdvancedSelectedItems([]);
    setAdvancedResult(null);
    syncAdvancedCaches([]);
  }

  /**
   *
   * 复制文本到剪贴板（带降级）。
   *
   */
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      addLog("info", "已复制到剪贴板", text);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        addLog("info", "已复制到剪贴板(降级)", text);
      } catch (e) {
        addLog("error", "复制失败", String(e));
      }
    }
  }

  /**
   *
   * 触发获取设备信息。
   *
   */
  async function onGetDeviceInfo() {
    try {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
      addLog("info", "获取设备信息成功", info);
    } catch (e) {
      addLog("error", "获取设备信息失败", String(e));
    }
  }

  /**
   *
   * 提交自定义指令。
   *
   */
  async function onSubmitCustom() {
    const parsed = safeJsonParse(customData);
    if (parsed instanceof Error) {
      addLog("error", "JSON 解析失败", parsed.message);
      return;
    }
    try {
      const res = await sendToAndroid(customAction, parsed as Record<string, unknown>, customTimeout);
      setResult(res);
      addLog("info", `自定义指令成功: ${customAction}`, res);
    } catch (e) {
      addLog("error", `自定义指令失败: ${customAction}`, String(e));
    }
  }

  const statusText = useMemo(() => {
    const a = available ? "可用" : "不可用";
    const h = handshakeOk == null ? "未知" : handshakeOk ? "成功" : "失败";
    return `桥接: ${a} / 自检: ${h}`;
  }, [available, handshakeOk]);

  return (
    <main className="min-h-dvh p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Android 桥接调试</h1>

      {/* 状态区 */}
      <section className="rounded border p-4 space-y-2">
        <div className="font-medium">当前状态</div>
        <div className="text-sm text-gray-600">{statusText}</div>
        <div>
          <button
            className="mt-2 px-3 py-1.5 rounded border"
            onClick={() => runBridgeCheck("manual")}
          >
            手动自检
          </button>
        </div>
      </section>

      {/* 常用操作 */}
      <section className="rounded border p-4 space-y-3">
        <div className="font-medium">常用操作</div>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 rounded border" onClick={() => showToast("你好，东爵！")}>Toast</button>
          <button className="px-3 py-1.5 rounded border" onClick={onGetDeviceInfo}>设备信息</button>
          <button
            className="px-3 py-1.5 rounded border"
            onClick={async () => {
              try {
                const r = await takePhoto();
                addLog("info", "拍照返回", r);
                const src = extractImageSrc(r);
                if (src) setPhotoPreviewSrc(src);
              } catch (e) {
                addLog("error", "拍照失败", String(e));
              }
            }}
          >
            相机
          </button>
          <button
            className="px-3 py-1.5 rounded border"
            onClick={async () => {
              try {
                const r = await pickImage();
                addLog("info", "相册返回", r);
                const src = extractImageSrc(r);
                if (src) setPickedPreviewSrc(src);
              } catch (e) {
                addLog("error", "相册失败", String(e));
              }
            }}
          >
            相册
          </button>
          <button className="px-3 py-1.5 rounded border" onClick={() => goBack(false)}>返回</button>
          <button className="px-3 py-1.5 rounded border" onClick={() => setTitle("桥接调试页")}>设置标题</button>
        </div>

        {/* 图片预览 */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">拍照预览：</div>
            {photoPreviewSrc ? (
              <div className="border rounded p-2 bg-gray-50">
                {/*
                 * 注意：在 Android WebView 中，content:// 与 file:// 均可作为 img 的 src，
                 * 前提是应用具备相应读取权限（本应用内已申请）。
                 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreviewSrc}
                  alt="拍照结果"
                  className="max-h-64 w-auto object-contain mx-auto"
                />
                {/* <div className="mt-1 text-xs break-all text-gray-500">{photoPreviewSrc}</div> */}
              </div>
            ) : (
              <div className="text-xs text-gray-500">(无)</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">相册预览：</div>
            {pickedPreviewSrc ? (
              <div className="border rounded p-2 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pickedPreviewSrc}
                  alt="相册图片"
                  className="max-h-64 w-auto object-contain mx-auto"
                />
                {/* <div className="mt-1 text-xs break-all text-gray-500">{pickedPreviewSrc}</div> */}
              </div>
            ) : (
              <div className="text-xs text-gray-500">(无)</div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600">设备信息：</div>
        <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded border overflow-auto max-h-48">
          {deviceInfo ? JSON.stringify(deviceInfo, null, 2) : "(未获取)"}
        </pre>
      </section>

      {/* 高级图片选择器 */}
      <section className="rounded border p-4 space-y-3">
        <div className="font-medium">高级图片选择器</div>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex items-center gap-2">
            <span className="w-28 text-right text-sm text-gray-600">标题</span>
            <input
              className="flex-1 rounded border px-2 py-1"
              value={advancedTitle}
              onChange={(e) => setAdvancedTitle(e.target.value)}
              placeholder="默认：选择素材"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-28 text-right text-sm text-gray-600">最大数量</span>
            <input
              className="flex-1 rounded border px-2 py-1"
              value={advancedMaxCount}
              onChange={(e) => setAdvancedMaxCount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="留空表示不限"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={advancedAllowMixedFolder}
              onChange={(e) => setAdvancedAllowMixedFolder(e.target.checked)}
            />
            允许跨目录（allowMixedFolder）
          </label>
          <span className="text-xs text-gray-500">
            默认会记住上一次选择结果，便于验证“打开即勾选”的回显。
          </span>
        </div>
        <div className="text-xs text-gray-500">
          回调结果不包含任何 base64，可在下方卡片中按需点击“加载预览/原图”按钮，通过新桥方法异步获取。
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 rounded border" onClick={openAdvancedPicker}>
            调起高级选择器
          </button>
          <button
            className="px-3 py-1.5 rounded border text-red-600 border-red-200"
            onClick={clearAdvancedSelectionMemory}
          >
            清空记忆
          </button>
        </div>
        <div className="text-sm text-gray-600">最近一次返回：</div>
        <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded border overflow-auto max-h-60">
          {advancedResult ? JSON.stringify(advancedResult, null, 2) : "(暂无)"}
        </pre>
        <div className="text-sm text-gray-600">
          当前已选：{advancedSelectedItems.length} 张（diff 新增{" "}
          {advancedResult?.diff?.added?.length ?? 0}，移除{" "}
          {advancedResult?.diff?.removed?.length ?? 0}）
        </div>
        {advancedSelectedItems.length === 0 ? (
          <div className="text-xs text-gray-500">(无)</div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {advancedSelectedItems.map((item) => {
              const cacheEntry = advancedBase64Map[item.id] ?? {};
              const loadingEntry = advancedBase64Loading[item.id] ?? {};
              const previewEntry = cacheEntry.preview;
              const originalEntry = cacheEntry.original;
              const cachedSrc =
                previewEntry?.base64
                  ? toDataUrl(previewEntry.base64, previewEntry.mime || item.mime)
                  : originalEntry?.base64
                    ? toDataUrl(originalEntry.base64, originalEntry.mime || item.mime)
                    : null;
              const src = cachedSrc || extractImageSrc(item);
              const previewSize = base64Size(previewEntry?.base64);
              const originalSize = base64Size(originalEntry?.base64);
              return (
                <div key={item.id} className="border rounded p-3 space-y-2 bg-gray-50">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="truncate">{item.name || item.id}</span>
                    <span className="text-xs text-gray-500">{item.mime || "unknown"}</span>
                  </div>
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={item.name || item.id} className="w-full max-h-52 object-contain rounded bg-white" />
                  ) : (
                    <div className="text-xs text-gray-500">(无预览)</div>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-700">
                    <button
                      className="px-2 py-1 rounded border"
                      disabled={!!loadingEntry?.preview}
                      onClick={() => requestAdvancedBase64(item, "preview")}
                    >
                      {loadingEntry?.preview
                        ? "预览加载中..."
                        : previewEntry
                          ? "重新获取预览 base64"
                          : "加载预览 base64"}
                    </button>
                    <button
                      className="px-2 py-1 rounded border"
                      disabled={!!loadingEntry?.original}
                      onClick={() => requestAdvancedBase64(item, "original")}
                    >
                      {loadingEntry?.original
                        ? "原图加载中..."
                        : originalEntry
                          ? "重新获取原图 base64"
                          : "加载原图 base64"}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>path: {item.path || "(空)"}</div>
                    <div>
                      预览 base64: {previewEntry ? previewSize : "(未加载)"}{" "}
                      {previewEntry ? (
                        <>
                          <button
                            className="ml-2 underline"
                            onClick={() => copyToClipboard(previewEntry.base64)}
                          >
                            复制
                          </button>
                          {previewEntry.width && previewEntry.height ? (
                            <span className="ml-2 text-gray-400">
                              {previewEntry.width}×{previewEntry.height}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="ml-2 text-gray-400">(无)</span>
                      )}
                    </div>
                    <div>
                      原图 base64: {originalEntry ? originalSize : "(未加载)"}{" "}
                      {originalEntry ? (
                        <>
                          <button
                            className="ml-2 underline"
                            onClick={() => copyToClipboard(originalEntry.base64)}
                          >
                            复制
                          </button>
                          {originalEntry.width && originalEntry.height ? (
                            <span className="ml-2 text-gray-400">
                              {originalEntry.width}×{originalEntry.height}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="ml-2 text-gray-400">(无)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 自定义指令 */}
      <section className="rounded border p-4 space-y-3">
        <div className="font-medium">自定义指令</div>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex items-center gap-2">
            <span className="w-28 text-right">action</span>
            <input className="flex-1 rounded border px-2 py-1" value={customAction} onChange={(e) => setCustomAction(e.target.value)} placeholder="如：bridgeCheck / showToast / getDeviceInfo" />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-28 text-right">timeout(ms)</span>
            <input className="flex-1 rounded border px-2 py-1" type="number" value={customTimeout} onChange={(e) => setCustomTimeout(Number(e.target.value) || 0)} />
          </label>
        </div>
        <div className="grid gap-2">
          <span>data (JSON)</span>
          <textarea
            className="rounded border px-2 py-1 min-h-28 font-mono text-xs"
            value={customData}
            onChange={(e) => setCustomData(e.target.value)}
            placeholder="例如：输入 JSON 对象（如 message/duration 字段）"
          />
        </div>
        <div>
          <button className="px-3 py-1.5 rounded border" onClick={onSubmitCustom}>发送</button>
        </div>
        <div className="text-sm text-gray-600">结果：</div>
        <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded border overflow-auto max-h-48">
          {result ? JSON.stringify(result, null, 2) : "(无)"}
        </pre>
      </section>

      {/* 扫码监听 */}
      <section className="rounded border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">扫码监听</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">指定摄像头：</span>
            <button
              className="px-3 py-1.5 rounded border"
              onClick={() => requestScan("back")}
            >
              后置扫码
            </button>
            <button
              className="px-3 py-1.5 rounded border"
              onClick={() => requestScan("front")}
            >
              前置扫码
            </button>
            <button
              className="px-2 py-1 text-sm rounded border"
              onClick={() => {
                scansRef.current = [];
                force((x) => x + 1);
              }}
            >
              清空
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600">最近扫码结果：</div>
        <div className="space-y-2 max-h-[40vh] overflow-auto">
          {scansRef.current.length === 0 ? (
            <div className="text-xs text-gray-500">(暂无)</div>
          ) : (
            scansRef.current.map((s, idx) => (
              <div key={idx} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="opacity-60">[{s.time}]</span>
                  <code className="px-1.5 py-0.5 bg-gray-50 border rounded text-xs">
                    {s.barcode}
                  </code>
                  <button
                    className="px-2 py-0.5 text-xs rounded border"
                    onClick={() => copyToClipboard(s.barcode)}
                  >
                    复制
                  </button>
                </div>
                {s.raw !== undefined && (
                  <pre className="mt-1 ml-6 bg-gray-50 border rounded p-2 whitespace-pre-wrap overflow-auto text-xs">
                    {typeof s.raw === "string"
                      ? s.raw
                      : JSON.stringify(s.raw, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* 日志 */}
      <section className="rounded border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">日志</div>
          <button className="px-2 py-1 text-sm rounded border" onClick={() => { logsRef.current = []; force((x) => x + 1); }}>清空</button>
        </div>
        <div className="space-y-1 max-h-[40vh] overflow-auto">
          {logsRef.current.map((l, idx) => (
            <div key={idx} className="text-xs font-mono">
              <span className="opacity-60">[{l.time}]</span>
              <span className={
                l.level === "error" ? "text-red-600" : l.level === "warn" ? "text-yellow-700" : "text-gray-800"
              }>
                {" "}{l.level.toUpperCase()} {l.message}
              </span>
              {l.payload !== undefined && (
                <pre className="mt-1 ml-6 bg-gray-50 border rounded p-2 whitespace-pre-wrap overflow-auto">
                  {typeof l.payload === "string" ? l.payload : JSON.stringify(l.payload, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
