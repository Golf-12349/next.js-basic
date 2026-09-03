import apiClient from '@/config/axiosClient'
import type { ApiCabinet, ApiFolder } from './types'

export interface CreateCabinetPayload {
  name: string
  color: string
  department: string
  description: string
}

export interface CreateFolderPayload {
  cabinetId: string
  name: string
  description: string
}

export async function fetchCabinets(): Promise<ApiCabinet[]> {
  const res = await apiClient.get<ApiCabinet[]>('/cabinets')
  return res.data
}

export async function fetchFolders(): Promise<ApiFolder[]> {
  const res = await apiClient.get<ApiFolder[]>('/folders')
  return res.data
}

export async function createCabinet(data: CreateCabinetPayload): Promise<ApiCabinet> {
  const res = await apiClient.post<ApiCabinet>('/cabinets', data)
  return res.data
}

export async function createFolder(data: CreateFolderPayload): Promise<ApiFolder> {
  const res = await apiClient.post<ApiFolder>('/folders', data)
  return res.data
}

export async function deleteCabinet(id: string): Promise<void> {
  await apiClient.delete(`/cabinets/${id}`)
}

export async function deleteFolder(id: string): Promise<void> {
  await apiClient.delete(`/folders/${id}`)
}