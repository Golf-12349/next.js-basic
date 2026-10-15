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

export interface PipelineStep {
  count: number
  pct: number
}

export interface FileBreakdownItem {
  label: string
  ext: string
  count: number
  color: string
  bg: string
  pct: number
}

export interface FlowBreakdownItem {
  label: string
  direction: string
  count: number
  pct: number
  color: string
  barBg: string
  desc: string
}

export interface TopDivisionItem {
  rank: number
  name: string
  count: number
  ratio: number
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
    totalDivisions?: number
  }
  pipeline?: {
    total: number
    draft: PipelineStep
    pending: PipelineStep
    approved: PipelineStep
    archived: PipelineStep
  }
  fileBreakdown?: {
    total: number
    items: FileBreakdownItem[]
  }
  flowBreakdown?: FlowBreakdownItem[]
  topDivisions?: TopDivisionItem[]
  donuts?: {
    allocation: DonutGroup
    department: DonutGroup
    warehouse: DonutGroup
  }
  recentDocuments?: Array<{
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
