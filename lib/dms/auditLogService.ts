import apiClient from '@/config/axiosClient'

export interface AuditLogItem {
  id: string
  userId?: string | null
  actorEmail?: string | null
  actorRole?: string | null
  action: string
  entity: string
  entityId?: string | null
  details?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
    role: string
    avatarUrl?: string | null
  } | null
}

export interface AuditLogsQuery {
  page?: number
  limit?: number
  action?: string
  entity?: string
  actorEmail?: string
  search?: string
  startDate?: string
  endDate?: string
}

export interface AuditLogsResponse {
  data: AuditLogItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export async function fetchAuditLogs(query?: AuditLogsQuery): Promise<AuditLogsResponse> {
  const res = await apiClient.get<AuditLogsResponse>('/audit-logs', { params: query })
  return res.data
}
