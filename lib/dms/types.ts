import type { Document } from '@/types/document'
import type { User } from '@/types/user'

export type ApiCategory = { id: string; name: string }

export type ApiUser = {
  id: string
  name: string
  email: string
  role: User['role']
  phone: string | null
  department: string | null
  status: User['status']
  division?: string | null
  position?: string | null
  avatarUrl?: string | null
  createdAt: string
  updatedAt: string
  /** Only present immediately after creating a user without a password. */
  temporaryPassword?: string
}

export type ApiWarehouse = {
  id: string
  name: string
  division?: string | null
  description?: string | null
  color?: string | null
  createdAt: string
  updatedAt?: string
  cabinets?: ApiCabinet[]
}

export type ApiCabinet = {
  id: string
  warehouseId?: string | null
  name: string
  color: string
  division?: string | null
  department: string
  description: string
  createdAt: string
  folders?: ApiFolder[]
}

export type ApiFolder = {
  id: string
  cabinetId: string
  name: string
  description: string
  createdAt: string
}

export type ApiDocument = {
  id: string
  title: string
  docNumber: string
  categoryId: string | null
  category: ApiCategory | null
  direction?: Document['direction']
  division?: string | null
  department?: string | null
  status: Document['status']
  fileType: Document['fileType']
  fileSize: string | null
  fileUrl: string | null
  fileName: string | null
  uploadedById: string | null
  uploadedBy: { id: string; name: string } | null
  uploadDate: string
  deleted: boolean
  warehouseId?: string | null
  warehouse?: ApiWarehouse | null
  cabinetId: string | null
  cabinet: ApiCabinet | null
  folderId: string | null
  folder: ApiFolder | null
  transfers?: Document['transfers']
}

export type ApiNotification = {
  id: string
  type: 'pending' | 'approved' | 'user' | 'alert' | 'transfer_pending' | 'transfer_approved' | 'transfer_rejected'
  title: string
  detail: string | null
  link: string | null
  read: boolean
  createdAt: string
}

export function toFrontendUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
    division: user.division ?? undefined,
    department: user.department ?? '',
    position: user.position ?? undefined,
    status: user.status,
    avatarUrl: user.avatarUrl ?? undefined,
    joinDate: user.createdAt.slice(0, 10),
    lastActive: user.updatedAt.slice(0, 10),
  }
}

export function toFrontendDocument(doc: ApiDocument): Document {
  return {
    id: doc.id,
    title: doc.title,
    docNumber: doc.docNumber,
    category: doc.category?.name ?? '',
    categoryId: doc.categoryId ?? undefined,
    direction: doc.direction,
    division: doc.division ?? undefined,
    department: doc.department ?? undefined,
    status: doc.status,
    fileType: doc.fileType,
    fileSize: doc.fileSize ?? '-',
    uploadDate: doc.uploadDate.slice(0, 10),
    uploadedBy: doc.uploadedBy?.name ?? '-',
    fileUrl: doc.fileUrl ?? '#',
    fileName: doc.fileName ?? undefined,
    deleted: doc.deleted,
    warehouseId: doc.warehouseId ?? undefined,
    warehouseName: doc.warehouse?.name,
    cabinetId: doc.cabinetId ?? undefined,
    cabinetName: doc.cabinet?.name,
    folderId: doc.folderId ?? undefined,
    folderName: doc.folder?.name,
    transfers: doc.transfers,
  }
}