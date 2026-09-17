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
  warehouse?: ApiWarehouse | null
  shelves?: ApiShelf[]
  folders?: ApiFolder[]
}

export type ApiShelf = {
  id: string
  cabinetId: string
  name: string
  description?: string | null
  createdAt: string
  folders?: ApiFolder[]
}

export type ApiFolder = {
  id: string
  cabinetId: string
  shelfId?: string | null
  name: string
  description: string
  createdAt: string
  cabinet?: ApiCabinet | null
  shelf?: ApiShelf | null
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
  expiresAt: string | null
  deleted: boolean
  warehouseId?: string | null
  warehouse?: ApiWarehouse | null
  cabinetId: string | null
  cabinet: ApiCabinet | null
  shelfId?: string | null
  shelf?: ApiShelf | null
  folderId: string | null
  folder: ApiFolder | null
  transfers?: Document['transfers']
}

export type ApiNotification = {
  id: string
  type: 'pending' | 'approved' | 'user' | 'alert' | 'transfer_pending' | 'transfer_approved' | 'transfer_rejected' | 'expired'
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
    expiresAt: doc.expiresAt ? doc.expiresAt.slice(0, 10) : undefined,
    uploadedBy: doc.uploadedBy?.name ?? '-',
    fileUrl: doc.fileUrl ?? '#',
    fileName: doc.fileName ?? undefined,
    deleted: doc.deleted,
    warehouseId: doc.warehouseId ?? doc.cabinet?.warehouseId ?? doc.cabinet?.warehouse?.id ?? undefined,
    warehouseName: doc.warehouse?.name ?? doc.cabinet?.warehouse?.name,
    cabinetId: doc.cabinetId ?? doc.folder?.cabinetId ?? undefined,
    cabinetName: doc.cabinet?.name ?? doc.folder?.cabinet?.name,
    shelfId: doc.shelfId ?? doc.folder?.shelfId ?? undefined,
    shelfName: doc.shelf?.name ?? doc.folder?.shelf?.name,
    folderId: doc.folderId ?? undefined,
    folderName: doc.folder?.name,
    transfers: doc.transfers,
  }
}