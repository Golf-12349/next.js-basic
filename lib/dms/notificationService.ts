import apiClient from '@/config/axiosClient'
import type { ApiNotification } from './types'

export async function fetchNotifications(): Promise<ApiNotification[]> {
  const res = await apiClient.get<ApiNotification[]>('/notifications')
  return res.data
}

export async function markNotificationRead(id: string): Promise<ApiNotification> {
  const res = await apiClient.patch<ApiNotification>(`/notifications/${id}/read`)
  return res.data
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all')
}
