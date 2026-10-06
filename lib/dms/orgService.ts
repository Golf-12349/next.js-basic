import apiClient from '@/config/axiosClient'

export interface ApiDepartment {
  id: string
  divisionId: string
  name: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ApiDivision {
  id: string
  name: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
  departments: ApiDepartment[]
}

export interface ApiOrgStructure {
  divisions: string[]
  departmentsByDivision: Record<string, string[]>
  divisionObjects: ApiDivision[]
}

export async function fetchOrgStructure(): Promise<ApiOrgStructure> {
  const res = await apiClient.get<ApiOrgStructure>('/divisions/structure')
  return res.data
}

export async function fetchDivisions(): Promise<ApiDivision[]> {
  const res = await apiClient.get<ApiDivision[]>('/divisions')
  return res.data
}

export async function createDivision(name: string, description?: string): Promise<ApiDivision> {
  const res = await apiClient.post<ApiDivision>('/divisions', { name, description })
  return res.data
}

export async function updateDivision(id: string, name: string, description?: string): Promise<ApiDivision> {
  const res = await apiClient.patch<ApiDivision>(`/divisions/${id}`, { name, description })
  return res.data
}

export async function deleteDivision(id: string): Promise<void> {
  await apiClient.delete(`/divisions/${id}`)
}

export async function createDepartment(divisionId: string, name: string, description?: string): Promise<ApiDepartment> {
  const res = await apiClient.post<ApiDepartment>('/departments', { divisionId, name, description })
  return res.data
}

export async function updateDepartment(id: string, name: string, divisionId?: string, description?: string): Promise<ApiDepartment> {
  const res = await apiClient.patch<ApiDepartment>(`/departments/${id}`, { name, divisionId, description })
  return res.data
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiClient.delete(`/departments/${id}`)
}
