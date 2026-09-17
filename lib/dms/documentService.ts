import apiClient from '@/config/axiosClient'
import { isAxiosError } from 'axios'
import type { DocumentDirection, DocumentFileType, DocumentStatus } from '@/types/document'
import type { ApiDocument } from './types'

export interface UploadFileResult {
  fileUrl: string
  fileName: string
  fileSize: string
}

export interface CreateDocumentPayload {
  title: string
  docNumber: string
  categoryId?: string
  direction?: DocumentDirection
  division?: string
  department?: string
  fileType: DocumentFileType
  status: DocumentStatus
  fileSize?: string
  fileUrl?: string
  fileName?: string
  uploadDate: string
  expiresAt?: string
  warehouseId?: string
  cabinetId?: string
  shelfId?: string
  folderId?: string
}

export async function uploadFile(file: File): Promise<UploadFileResult> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiClient.post<UploadFileResult>('/documents/upload-file', formData)
  return res.data
}

export async function fetchDocuments(params?: { limit?: number; deleted?: string }): Promise<ApiDocument[]> {
  const res = await apiClient.get<{ data: ApiDocument[] }>('/documents', { params })
  return res.data.data
}

export async function createDocument(payload: CreateDocumentPayload): Promise<ApiDocument> {
  const cleaned: Record<string, unknown> = { ...payload }
  if (!cleaned.warehouseId) delete cleaned.warehouseId
  if (!cleaned.cabinetId) delete cleaned.cabinetId
  if (!cleaned.shelfId) delete cleaned.shelfId
  if (!cleaned.folderId) delete cleaned.folderId
  if (!cleaned.categoryId) delete cleaned.categoryId
  if (!cleaned.expiresAt) delete cleaned.expiresAt

  try {
    const res = await apiClient.post<ApiDocument>('/documents', cleaned)
    return res.data
  } catch (err: unknown) {
    if (isAxiosError<{ message?: string | string[] }>(err) && err.response?.data?.message) {
      const msg = err.response.data.message
      const messages = Array.isArray(msg) ? msg : [msg]
      const forbiddenProps = messages
        .map((m: string) => (typeof m === 'string' ? m.match(/property (\w+) should not exist/)?.[1] : null))
        .filter((p): p is string => Boolean(p))

      if (forbiddenProps.length > 0) {
        for (const prop of forbiddenProps) {
          delete cleaned[prop]
        }
        const retryRes = await apiClient.post<ApiDocument>('/documents', cleaned)
        return retryRes.data
      }
    }
    throw err
  }
}

export async function updateDocumentStatus(id: string, status: DocumentStatus): Promise<void> {
  await apiClient.patch(`/documents/${id}/status`, { status })
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function patchDocument(id: string, patch: Record<string, unknown>): Promise<void> {
  const allowedKeys = new Set([
    'title',
    'docNumber',
    'categoryId',
    'fileType',
    'status',
    'fileSize',
    'fileUrl',
    'fileName',
    'uploadDate',
    'division',
    'department',
    'warehouseId',
    'cabinetId',
    'shelfId',
    'folderId',
    'expiresAt',
    'direction',
  ])

  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if (!allowedKeys.has(key)) continue
    if (['categoryId', 'cabinetId', 'shelfId', 'folderId'].includes(key)) {
      if (typeof value === 'string' && UUID_REGEX.test(value)) {
        cleaned[key] = value
      } else if (value === null) {
        cleaned[key] = null
      }
    } else if (key === 'warehouseId') {
      if (typeof value === 'string' && UUID_REGEX.test(value)) {
        cleaned[key] = value
      } else if (value === null) {
        cleaned[key] = null
      }
    } else if (value !== undefined) {
      cleaned[key] = value
    }
  }

  try {
    await apiClient.patch(`/documents/${id}`, cleaned)
  } catch (err: unknown) {
    if (isAxiosError<{ message?: string | string[] }>(err) && err.response?.data?.message) {
      const msg = err.response.data.message
      const messages = Array.isArray(msg) ? msg : [msg]
      const forbiddenProps = messages
        .map((m: string) => (typeof m === 'string' ? m.match(/property (\w+) should not exist/)?.[1] : null))
        .filter((p): p is string => Boolean(p))

      const uuidErrors = messages
        .map((m: string) => (typeof m === 'string' ? m.match(/(\w+) must be a UUID/)?.[1] : null))
        .filter((p): p is string => Boolean(p))

      const toRemove = [...forbiddenProps, ...uuidErrors]
      if (toRemove.length > 0) {
        for (const prop of toRemove) {
          delete cleaned[prop]
        }
        await apiClient.patch(`/documents/${id}`, cleaned)
        return
      }
    }
    throw err
  }
}

export async function softDeleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}`)
}

export async function restoreDocument(id: string): Promise<void> {
  await apiClient.patch(`/documents/${id}/restore`)
}

export async function permanentDeleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}/permanent`)
}

export async function archiveDocument(id: string): Promise<void> {
  await apiClient.patch(`/documents/${id}/archive`)
}

export async function transferDocument(
  id: string,
  payload: { toDivision: string; toDepartment: string; note?: string; keepCopy?: boolean },
): Promise<import('@/types/document').DocumentTransfer> {
  const res = await apiClient.post<import('@/types/document').DocumentTransfer>(`/documents/${id}/transfer`, payload)
  return res.data
}

export async function fetchIncomingTransfers(): Promise<import('@/types/document').DocumentTransfer[]> {
  const res = await apiClient.get<import('@/types/document').DocumentTransfer[]>('/documents/transfers/incoming')
  return res.data
}

export async function approveTransfer(
  transferId: string,
  payload: { warehouseId?: string; cabinetId?: string; shelfId?: string; folderId?: string; note?: string },
): Promise<{ transfer: import('@/types/document').DocumentTransfer; document: import('@/types/document').Document }> {
  const res = await apiClient.post<{ transfer: import('@/types/document').DocumentTransfer; document: import('@/types/document').Document }>(
    `/documents/transfers/${transferId}/approve`,
    payload,
  )
  return res.data
}

export async function rejectTransfer(
  transferId: string,
  reason?: string,
): Promise<import('@/types/document').DocumentTransfer> {
  const res = await apiClient.post<import('@/types/document').DocumentTransfer>(`/documents/transfers/${transferId}/reject`, { reason })
  return res.data
}

export async function cancelTransfer(
  transferId: string,
): Promise<import('@/types/document').DocumentTransfer> {
  const res = await apiClient.post<import('@/types/document').DocumentTransfer>(`/documents/transfers/${transferId}/cancel`)
  return res.data
}

export async function fetchDocumentTransfers(
  documentId: string,
): Promise<import('@/types/document').DocumentTransfer[]> {
  const res = await apiClient.get<import('@/types/document').DocumentTransfer[]>(`/documents/${documentId}/transfers`)
  return res.data
}

export async function renewDocumentExpiry(
  id: string,
  payload: { expiresAt: string; note?: string },
): Promise<ApiDocument> {
  const res = await apiClient.post<ApiDocument>(`/documents/${id}/renew-expiry`, payload)
  return res.data
}

export async function fetchExpiredSummary(): Promise<{
  expiredCount: number
  expiring7DaysCount: number
  expiring30DaysCount: number
}> {
  const res = await apiClient.get<{
    expiredCount: number
    expiring7DaysCount: number
    expiring30DaysCount: number
  }>('/documents/expired/summary')
  return res.data
}
