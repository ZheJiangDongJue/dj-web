import { DEFAULT_DB_NAME } from '@/lib/config'
import type { IFile } from '@/types/erp-db.generated'
import type { ErpImageItem } from '@/lib/image-loader'

/**
 *
 * 根据文件后缀推断图片 MIME 类型。
 * @param suffix 文件后缀（不含点或含点均可）
 * @returns 对应的 MIME 类型，无法识别时返回 image/jpeg 兜底。
 *
 */
function inferMimeFromSuffix(suffix: string | null | undefined): string {
  if (!suffix) return 'image/jpeg'
  const lower = suffix.trim().toLowerCase().replace(/^\./, '')
  switch (lower) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'bmp':
      return 'image/bmp'
    default:
      return 'image/jpeg'
  }
}

/**
 *
 * 将单个 ERP 附件（IFile 形状）映射为 ErpImageItem。
 * 约定：
 * - 映射结果标记为 isRemoteOnly = true，表示当前终端没有本地物理文件；
 * - 后续由 image-loader/loadImageBase64 负责基于 dbName + cloudFileId 调用 WebApi 下载并转 base64。
 * @param file   ERP 附件对象（至少需包含 CloudFileid/FileName/Suffix）
 * @param dbName 对应账套名，默认使用 DEFAULT_DB_NAME
 *
 */
export function mapFileToErpImageItem(
  file: Pick<IFile, 'CloudFileid' | 'FileName' | 'Suffix'> & { id?: number; Billid?: number },
  dbName: string = DEFAULT_DB_NAME,
): ErpImageItem {
  const cloudFileIdRaw = file.CloudFileid
  const cloudFileId = Number(cloudFileIdRaw)
  const safeCloudId = Number.isFinite(cloudFileId) && cloudFileId > 0 ? cloudFileId : 0

  const recordIdRaw = (file as { id?: number }).id
  const billIdRaw = (file as { Billid?: number }).Billid
  const recordId = typeof recordIdRaw === 'number' ? recordIdRaw : Number(recordIdRaw)
  const billId = typeof billIdRaw === 'number' ? billIdRaw : Number(billIdRaw)

  const stableId =
    Number.isFinite(recordId) && recordId > 0
      ? `ncr-file-${recordId}`
      : safeCloudId
        ? `cloud-${safeCloudId}`
        : `file-${file.FileName || 'unknown'}`

  return {
    // Android 侧本地信息全部留空，仅使用服务器字段
    id: stableId,
    uri: '',
    path: undefined,
    name: file.FileName,
    mime: inferMimeFromSuffix(file.Suffix),
    // 服务器访问所需字段
    dbName,
    cloudFileId: safeCloudId,
    fileName: file.FileName,
    isRemoteOnly: true,
    recordId: Number.isFinite(recordId) && recordId > 0 ? recordId : undefined,
    billId: Number.isFinite(billId) && billId > 0 ? billId : undefined,
  }
}

/**
 *
 * 批量将 ERP 附件列表映射为 ErpImageItem 数组。
 * @param files  ERP 附件列表
 * @param dbName 账套名，默认为 DEFAULT_DB_NAME
 *
 */
export function mapFilesToErpImageItems(
  files: Array<Pick<IFile, 'CloudFileid' | 'FileName' | 'Suffix'> & { id?: number; Billid?: number }> | null | undefined,
  dbName: string = DEFAULT_DB_NAME,
): ErpImageItem[] {
  if (!files || files.length === 0) return []
  return files.map((f) => mapFileToErpImageItem(f, dbName))
}
