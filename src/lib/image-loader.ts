/**
 *
 * 图片加载统一封装。
 * 目标：
 * - 优先通过 Android WebView 本地能力（fetchImageBase64）获取图片 base64；
 * - 当本机无文件或本地读取失败时，自动降级到 ERP.WebApi 的 FileController.Download；
 * - 对业务调用方屏蔽来源差异，仅暴露统一的加载结果结构。
 *
 */

import { API_BASE } from '@/lib/config'
import authFetch from '@/lib/auth/interceptor'
import {
  fetchImageBase64,
  isAndroidBridgeAvailable,
  type AdvancedImageItemPayload,
} from '@/lib/android-bridge'

export type ImageSource = 'android-local' | 'server'

export interface ErpImageItem extends AdvancedImageItemPayload {
  /**
   *
   * ERP 账套名称，对应 FileController.Download 的 dbName 参数
   *
   */
  dbName?: string
  /**
   *
   * 云文件主键 ID，对应 FileController.Download 的 cloudFileId 参数
   *
   */
  cloudFileId?: number
  /**
   *
   * 建议文件名，可用于 Download 的 fileName 参数
   *
   */
  fileName?: string
  /**
   *
   * 是否仅存在于服务器端。
   * - true：当前终端没有本地物理文件，直接走 WebApi 降级；
   * - false / 未指定：优先尝试走本地 Android 读取，再根据结果决定是否降级。
   *
   */
  isRemoteOnly?: boolean
  /**
   *
   * 附件记录主键 ID（例如 FileRecordForNcr.id），用于删除/更新元数据。
   *
   */
  recordId?: number
  /**
   *
   * 所属单据主键 ID（例如 FileRecordForNcr.Billid）。
   *
   */
  billId?: number
}

export interface ImageLoadOptions {
  /**
   *
   * 预览图或原图，传递给 Android fetchImageBase64 的 type 字段
   *
   */
  type?: 'preview' | 'original'
  /**
   *
   * 可选取消信号，供调用方在组件卸载或切页时取消请求
   *
   */
  signal?: AbortSignal
  /**
   *
   * 最大边长（像素），会传递给 Android 侧的 maxDim，
   * 服务端降级路径目前仅透传完整文件。
   *
   */
  maxDim?: number
}

export interface ImageLoadResult {
  /**
   *
   * 是否成功获取 base64 数据
   *
   */
  success: boolean
  /**
   *
   * 图片 base64 字符串（不含 data: 前缀）
   *
   */
  base64?: string
  /**
   *
   * 图片 MIME 类型，例如 image/jpeg
   *
   */
  mime?: string
  /**
   *
   * 实际采用的来源：安卓本地或服务器
   *
   */
  source?: ImageSource
  /**
   *
   * 人类可读的错误信息
   *
   */
  message?: string
  /**
   *
   * 机器可读的错误码，便于上层做差异化处理
   *
   */
  errorCode?: string
}

/**
 *
 * 将 ArrayBuffer 转换为 base64 字符串。
 * 说明：
 * - 设计为在浏览器端调用，依赖全局 btoa；
 * - 若在非浏览器环境调用，将抛出明确错误，方便排查误用。
 *
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer)
  let binaryString = ''
  for (let index = 0; index < byteArray.byteLength; index += 1) {
    binaryString += String.fromCharCode(byteArray[index])
  }

  if (typeof window === 'undefined' || typeof window.btoa !== 'function') {
    throw new Error('arrayBufferToBase64 仅支持在浏览器环境调用')
  }

  return window.btoa(binaryString)
}

/**
 *
 * 构造 FileController.Download 的完整 URL。
 * @param dbName      账套名
 * @param cloudFileId 云文件主键 ID
 * @param fileName    建议文件名（可选）
 *
 */
function buildDownloadUrl(dbName: string, cloudFileId: number, fileName?: string): string {
  const base = API_BASE.replace(/\/$/, '')
  const qs = new URLSearchParams()
  qs.set('dbName', dbName)
  qs.set('cloudFileId', String(cloudFileId))
  if (fileName) qs.set('fileName', fileName)

  // 注意：API_BASE 在浏览器端默认是相对路径（例如 '/api/erp'），
  // 此时不能直接用 `new URL(..., API_BASE)` 构造，否则会抛出 “Invalid URL”。
  // 这里统一按“前缀 + 路由”拼接，兼容：
  // - 绝对地址：'http://127.0.0.1:5000' → 'http://127.0.0.1:5000/api/File/Download?...'
  // - 同源代理：'/api/erp' → '/api/erp/api/File/Download?...'
  return `${base}/api/File/Download?${qs.toString()}`
}

/**
 *
 * 统一加载单张图片的 base64：
 * - 优先尝试通过 Android WebView 本地能力（fetchImageBase64）读取；
 * - 若本地不可用、失败或标记为远程文件，则降级到 WebApi 的 FileController.Download；
 * - 返回统一的 ImageLoadResult 结构供业务使用。
 * @param item    图片项，包含本地与服务器端的标识信息
 * @param options 加载选项（预览/原图、取消信号等）
 *
 */
export async function loadImageBase64(
  item: ErpImageItem,
  options?: ImageLoadOptions,
): Promise<ImageLoadResult> {
  if (!item) {
    return {
      success: false,
      message: '图片项为空，无法加载',
      errorCode: 'EMPTY_ITEM',
    }
  }

  const preferType: 'preview' | 'original' = options?.type ?? 'preview'
  const maxDim = options?.maxDim ?? 512

  const hasLocalKey = Boolean(item.id || item.uri || item.path)
  const canUseAndroid = isAndroidBridgeAvailable()

  // —— 路径一：尝试从 Android 本机读取 —— //
  if (!item.isRemoteOnly && hasLocalKey && canUseAndroid) {
    try {
      const androidResult = await fetchImageBase64({
        id: item.id,
        uri: item.uri,
        path: item.path,
        type: preferType,
        maxDim,
        width: item.width,
        height: item.height,
      })

      if (androidResult?.success && androidResult.base64) {
        return {
          success: true,
          base64: androidResult.base64,
          mime: androidResult.mime ?? item.mime ?? 'image/jpeg',
          source: 'android-local',
        }
      }
    } catch (error) {
      // 本机读取失败不直接返回错误，尝试进入 WebApi 降级路径。
      console.warn('[image-loader] Android local fetch failed, fallback to server:', error)
    }
  }

  // —— 路径二：WebApi 降级 —— //
  if (!item.dbName || !item.cloudFileId || item.cloudFileId <= 0) {
    return {
      success: false,
      message: '缺少 dbName 或 cloudFileId，无法从服务器加载附件',
      errorCode: 'MISSING_SERVER_KEYS',
    }
  }

  const downloadUrl = buildDownloadUrl(item.dbName, item.cloudFileId, item.fileName)

  try {
    const response = await authFetch(downloadUrl, {
      method: 'GET',
      signal: options?.signal,
    })

    if (!response.ok) {
      return {
        success: false,
        message: `服务器返回错误：${response.status}`,
        errorCode: `SERVER_${response.status}`,
      }
    }

    const arrayBuffer = await response.arrayBuffer()
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return {
        success: false,
        message: '服务器返回空文件内容',
        errorCode: 'EMPTY_RESPONSE_BODY',
      }
    }

    const base64 = arrayBufferToBase64(arrayBuffer)
    const mime =
      item.mime ??
      response.headers.get('Content-Type') ??
      'application/octet-stream'

    return {
      success: true,
      base64,
      mime,
      source: 'server',
    }
  } catch (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message ?? '')
        : String(error ?? '未知错误')

    return {
      success: false,
      message: errorMessage || '从服务器加载图片失败',
      errorCode: 'SERVER_FETCH_ERROR',
    }
  }
}
