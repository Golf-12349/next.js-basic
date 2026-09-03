import apiClient from '@/config/axiosClient'
import type { UserRole, UserStatus } from '@/types/user'
import type { ApiUser } from './types'

export interface CreateUserPayload {
  name: string
  email: string
  role: UserRole
  phone?: string
  department?: string
  status?: UserStatus
  division?: string
  avatarUrl?: string
  password?: string
}

export async function fetchUsers(): Promise<ApiUser[]> {
  const res = await apiClient.get<ApiUser[]>('/users')
  return res.data
}

export async function createUser(payload: CreateUserPayload): Promise<ApiUser> {
  const res = await apiClient.post<ApiUser>('/users', payload)
  return res.data
}

export async function updateUser(id: string, patch: Record<string, unknown>): Promise<void> {
  await apiClient.patch(`/users/${id}`, patch)
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`)
}

export async function setUserStatus(id: string, status: UserStatus): Promise<void> {
  await apiClient.patch(`/users/${id}`, { status })
}