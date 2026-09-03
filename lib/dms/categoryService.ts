import apiClient from '@/config/axiosClient'
import type { ApiCategory } from './types'

export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await apiClient.get<ApiCategory[]>('/categories')
  return res.data
}

export async function createCategory(name: string): Promise<ApiCategory> {
  const res = await apiClient.post<ApiCategory>('/categories', { name })
  return res.data
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`)
}