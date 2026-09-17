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

export function toFrontendDocument(doc: any): Document {
  return {
    id: doc.id,
    title: doc.title,
    docNumber: doc.docNumber,
    category:
      typeof doc.category === 'string'
        ? doc.category
        : (doc.category?.name ?? ''),
    categoryId:
      doc.categoryId ??
      (typeof doc.category === 'object' && doc.category !== null ? doc.category.id : undefined),
    direction: doc.direction,
    division:
      typeof doc.division === 'object' && doc.division !== null
        ? (doc.division.name ?? '')
        : (doc.division ?? undefined),
    department:
      typeof doc.department === 'object' && doc.department !== null
        ? (doc.department.name ?? '')
        : (doc.department ?? undefined),
    status: doc.status,
    fileType: doc.fileType,
    fileSize: doc.fileSize ?? '-',
    uploadDate: doc.uploadDate ? String(doc.uploadDate).slice(0, 10) : '',
    expiresAt: doc.expiresAt ? String(doc.expiresAt).slice(0, 10) : undefined,
    uploadedBy:
      typeof doc.uploadedBy === 'object' && doc.uploadedBy !== null
        ? (doc.uploadedBy.name ?? '-')
        : (typeof doc.uploadedBy === 'string' ? doc.uploadedBy : '-'),
    fileUrl: doc.fileUrl ?? '#',
    fileName: doc.fileName ?? undefined,
    deleted: Boolean(doc.deleted),
    warehouseId: doc.warehouseId ?? doc.cabinet?.warehouseId ?? doc.cabinet?.warehouse?.id ?? undefined,
    warehouseName: typeof doc.warehouseName === 'string' ? doc.warehouseName : (doc.warehouse?.name ?? doc.cabinet?.warehouse?.name),
    cabinetId: doc.cabinetId ?? doc.folder?.cabinetId ?? undefined,
    cabinetName: typeof doc.cabinetName === 'string' ? doc.cabinetName : (doc.cabinet?.name ?? doc.folder?.cabinet?.name),
    shelfId: doc.shelfId ?? doc.folder?.shelfId ?? undefined,
    shelfName: typeof doc.shelfName === 'string' ? doc.shelfName : (doc.shelf?.name ?? doc.folder?.shelf?.name),
    folderId: doc.folderId ?? undefined,
    folderName: typeof doc.folderName === 'string' ? doc.folderName : doc.folder?.name,
    transfers: doc.transfers,
  }
}