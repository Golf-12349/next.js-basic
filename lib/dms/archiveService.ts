import apiClient from '@/config/axiosClient'
import type { ApiCabinet, ApiFolder, ApiShelf } from './types'

export interface CreateCabinetPayload {
  name: string
  color: string
  department: string
  description: string
  warehouseId?: string | null
  division?: string | null
}

export interface CreateShelfPayload {
  cabinetId: string
  name: string
  description?: string
}

export interface CreateFolderPayload {
  cabinetId: string
  shelfId?: string | null
  name: string
  description: string
}

export async function fetchCabinets(warehouseId?: string): Promise<ApiCabinet[]> {
  const res = await apiClient.get<ApiCabinet[]>('/cabinets', {
    params: warehouseId ? { warehouseId } : undefined,
  })
  return res.data
}

export async function fetchShelves(cabinetId?: string): Promise<ApiShelf[]> {
  const res = await apiClient.get<ApiShelf[]>('/shelves', {
    params: cabinetId ? { cabinetId } : undefined,
  })
  return res.data
}

export async function fetchFolders(params?: { cabinetId?: string; shelfId?: string }): Promise<ApiFolder[]> {
  const res = await apiClient.get<ApiFolder[]>('/folders', { params })
  return res.data
}

export async function createCabinet(data: CreateCabinetPayload): Promise<ApiCabinet> {
  const res = await apiClient.post<ApiCabinet>('/cabinets', data)
  return res.data
}

function isValidUuid(val?: string | null): boolean {
  if (!val) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
}

export async function createShelf(data: CreateShelfPayload): Promise<ApiShelf> {
  const payload: Record<string, unknown> = {
    cabinetId: data.cabinetId,
    name: data.name,
    description: data.description,
  }
  const res = await apiClient.post<ApiShelf>('/shelves', payload)
  return res.data
}

export async function createFolder(data: CreateFolderPayload): Promise<ApiFolder> {
  const payload: Record<string, unknown> = {
    cabinetId: data.cabinetId,
    name: data.name,
    description: data.description || 'ບໍ່ມີລາຍລະອຽດ',
  }
  if (isValidUuid(data.shelfId)) {
    payload.shelfId = data.shelfId
  }

  try {
    const res = await apiClient.post<ApiFolder>('/folders', payload)
    return res.data
  } catch (err: unknown) {
    // ຖ້າ backend ຍັງບໍ່ທັນມີ shelfId (older instance), ລອງສົ່ງອີກຄັ້ງໂດຍຕັດ shelfId ອອກ
    const axiosErr = err as { response?: { data?: { message?: string | string[] } } }
    if (payload.shelfId && axiosErr?.response?.data?.message) {
      const msg = Array.isArray(axiosErr.response.data.message)
        ? axiosErr.response.data.message.join(' ')
        : String(axiosErr.response.data.message)
      if (msg.includes('shelfId') || msg.includes('should not exist')) {
        delete payload.shelfId
        const retryRes = await apiClient.post<ApiFolder>('/folders', payload)
        return retryRes.data
      }
    }
    throw err
  }
}

export async function deleteCabinet(id: string): Promise<void> {
  await apiClient.delete(`/cabinets/${id}`)
}

export async function deleteShelf(id: string): Promise<void> {
  await apiClient.delete(`/shelves/${id}`)
}

export async function deleteFolder(id: string): Promise<void> {
  await apiClient.delete(`/folders/${id}`)
}