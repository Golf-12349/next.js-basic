import apiClient from '@/config/axiosClient'

export interface DonutItem {
  label: string
  value: number
  color: string
  pct: number
}

export interface DonutGroup {
  items: DonutItem[]
  topVal: string
  topLabel: string
}

export interface DashboardAnalyticsResponse {
  overview: {
    totalDocuments: number
    internalDocuments: number
    externalDocuments: number
    approvedDocuments: number
    pendingDocuments: number
    draftDocuments: number
    archivedDocuments: number
    expiredDocuments: number
    expiringSoonDocuments: number
    monthlyInflow: number
    newThisWeek: number
    approvalRate: number
    averageApprovalDays: string
    warehouseUtilizationPct: string
    securityEncryptionRate: string
    topDepartment: string
  }
  donuts: {
    allocation: DonutGroup
    department: DonutGroup
    warehouse: DonutGroup
  }
  recentDocuments: Array<{
    id: string
    title: string
    docNumber: string
    status: string
    createdAt: string
    uploadedBy?: { id: string; name: string; avatarUrl?: string | null } | null
    category?: { id: string; name: string } | null
    warehouse?: { id: string; name: string } | null
  }>
  updatedAt: string
}

export async function fetchDashboardAnalytics(): Promise<DashboardAnalyticsResponse> {
  const res = await apiClient.get<DashboardAnalyticsResponse>('/dashboard/analytics')
  return res.data
}
