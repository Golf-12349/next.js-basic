import apiClient from '@/config/axiosClient'
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
  cabinetId?: string
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
  const res = await apiClient.post<ApiDocument>('/documents', payload)
  return res.data
}

export async function updateDocumentStatus(id: string, status: DocumentStatus): Promise<void> {
  await apiClient.patch(`/documents/${id}/status`, { status })
}

export async function patchDocument(id: string, patch: Record<string, unknown>): Promise<void> {
  await apiClient.patch(`/documents/${id}`, patch)
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