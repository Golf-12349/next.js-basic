import apiClient from '@/config/axiosClient'

export interface ApiSystemSettings {
  id: string
  orgName: string
  systemTitle: string
  contactEmail: string
  docPrefix: string
  maxUploadSizeMB: number
  updatedAt?: string
}

export async function fetchSystemSettings(): Promise<ApiSystemSettings> {
  const res = await apiClient.get<ApiSystemSettings>('/settings')
  return res.data
}

export async function updateSystemSettings(data: Partial<ApiSystemSettings>): Promise<ApiSystemSettings> {
  const res = await apiClient.patch<ApiSystemSettings>('/settings', data)
  return res.data
}

