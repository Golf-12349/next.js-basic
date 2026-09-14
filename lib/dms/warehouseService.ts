import apiClient from '@/config/axiosClient';
import type { ApiWarehouse } from './types';

export async function fetchWarehouses(): Promise<ApiWarehouse[]> {
  const res = await apiClient.get<ApiWarehouse[]>('/warehouses');
  return res.data;
}

export async function createWarehouse(payload: {
  name: string;
  division?: string;
  description?: string;
  color?: string;
}): Promise<ApiWarehouse> {
  const res = await apiClient.post<ApiWarehouse>('/warehouses', payload);
  return res.data;
}

export async function updateWarehouse(
  id: string,
  payload: Partial<{ name: string; division?: string; description?: string; color?: string }>,
): Promise<ApiWarehouse> {
  const res = await apiClient.patch<ApiWarehouse>(`/warehouses/${id}`, payload);
  return res.data;
}

export async function deleteWarehouse(id: string): Promise<void> {
  await apiClient.delete(`/warehouses/${id}`);
}

