"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'
import apiClient from '@/config/axiosClient'
import { Cabinet, Document, Folder } from '@/types/document'
import { User } from '@/types/user'

type ApiCategory = { id: string; name: string }
type ApiDocument = {
  id: string
  title: string
  docNumber: string
  categoryId: string | null
  category: ApiCategory | null
  status: Document['status']
  fileType: Document['fileType']
  fileSize: string | null
  fileUrl: string | null
  fileName: string | null
  uploadedById: string | null
  uploadedBy: { id: string; name: string } | null
  uploadDate: string
  deleted: boolean
}

type DMSContextType = {
  // Raw state (ยังเก็บไว้ให้ backward-compatible กับ code เก่าที่ใช้ setDocuments โดยตรง)
  documents: Document[]
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
  categories: string[]
  setCategories: React.Dispatch<React.SetStateAction<string[]>>
  users: User[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>

  loading: boolean

  // Document helpers (ตໍ່ API ຈິງ)
  addDocument: (doc: Omit<Document, 'id' | 'deleted'>) => Promise<Document>
  updateDocument: (id: string, patch: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void> // soft delete -> ไป Trash
  restoreDocument: (id: string) => Promise<void> // กู้คืนจาก Trash
  permDeleteDocument: (id: string) => Promise<void> // ลบถาวร
  archiveDocument: (id: string) => Promise<void> // เปลี่ยน status เป็น archived

  addCategory: (name: string) => Promise<void>
  removeCategory: (name: string) => Promise<void>

  // User helpers (ยังเป็น local mock, ยังไม่ต่อ API ในรอบนี้)
  addUser: (user: Omit<User, 'id'>) => User
  updateUser: (id: string, patch: Partial<User>) => void
  removeUser: (id: string) => void
  toggleUserStatus: (id: string) => void

  // 3-Level Archive (cabinets -> folders -> documents) helpers — ยังเป็น local mock
  cabinets: Cabinet[]
  setCabinets: React.Dispatch<React.SetStateAction<Cabinet[]>>
  folders: Folder[]
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>
  createCabinet: (data: { name: string; color: string; department: string; description: string }) => void
  createFolder: (data: { cabinetId: string; name: string; description: string }) => void
  deleteCabinet: (id: string) => void
  deleteFolder: (id: string) => void
  assignDocument: (docId: string, cabinetId: string, folderId: string) => void
}

const DMSContext = createContext<DMSContextType | undefined>(undefined)

// ฟังก์ชันช่วยสร้าง ID แบบไม่ซ้ำกัน, ใช้ prefix ได้ (เช่น 'USR', 'CAB', 'FLDR')
function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`
}

function toFrontendDocument(doc: ApiDocument): Document {
  return {
    id: doc.id,
    title: doc.title,
    docNumber: doc.docNumber,
    category: doc.category?.name ?? '',
    status: doc.status,
    fileType: doc.fileType,
    fileSize: doc.fileSize ?? '-',
    uploadDate: doc.uploadDate.slice(0, 10),
    uploadedBy: doc.uploadedBy?.name ?? '-',
    fileUrl: doc.fileUrl ?? '#',
    fileName: doc.fileName ?? undefined,
    deleted: doc.deleted,
  }
}

export function DMSProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [categoryList, setCategoryList] = useState<ApiCategory[]>([])
  const [loading, setLoading] = useState(true)

  const [users, setUsers] = useState<User[]>([
    {
      id: 'USR-001',
      name: 'ສົມສັກ ວົງສະຫວັນ',
      email: 'somsack.v@dms.gov.la',
      phone: '020 5551 0011',
      role: 'SuperAdmin',
      department: 'ຝ່າຍບໍລິຫານລະບົບ',
      status: 'active',
      joinDate: '2024-01-15',
      lastActive: '2026-08-23',
    },
    {
      id: 'USR-002',
      name: 'ນາງ ທຳມະເພກ ພົມມະວົງ',
      email: 'thammapheak.p@dms.gov.la',
      phone: '020 5552 0022',
      role: 'Admin',
      department: 'ຝ່າຍທຸລະການ',
      status: 'active',
      joinDate: '2024-03-02',
      lastActive: '2026-08-22',
    },
    {
      id: 'USR-003',
      name: 'ທ້າວ ອາລີ ໄຊຍະລາດ',
      email: 'ali.s@dms.gov.la',
      phone: '020 5553 0033',
      role: 'Admin',
      department: 'ຝ່າຍແຜນການ',
      status: 'active',
      joinDate: '2024-05-20',
      lastActive: '2026-08-20',
    },
    {
      id: 'USR-004',
      name: 'ນາງ ຄຳນາ ສີວິໄລ',
      email: 'khamna.s@dms.gov.la',
      phone: '020 5554 0044',
      role: 'User',
      department: 'ຝ່າຍການເງິນ',
      status: 'active',
      joinDate: '2024-07-11',
      lastActive: '2026-08-23',
    },
    {
      id: 'USR-005',
      name: 'ທ້າວ ລະມາ ບຸນມີ',
      email: 'lama.b@dms.gov.la',
      phone: '020 5555 0055',
      role: 'User',
      department: 'ຝ່າຍຊັບພະຍາກອນມະນຸດ',
      status: 'inactive',
      joinDate: '2024-09-09',
      lastActive: '2026-07-30',
    },
    {
      id: 'USR-006',
      name: 'ທ້າວ ຊົມບູລີ ແກ້ວມະນີ',
      email: 'sombouly.k@dms.gov.la',
      phone: '020 5556 0066',
      role: 'User',
      department: 'ຝ່າຍເຕັກໂນໂລຊີ',
      status: 'active',
      joinDate: '2025-01-18',
      lastActive: '2026-08-21',
    },
  ])

  // ── 3-Level Archive state: Cabinets & Folders (local mock ยังไม่ต่อ API) ──
  const [cabinets, setCabinets] = useState<Cabinet[]>([
    {
      id: 'CAB-001',
      name: 'ການເງິນ',
      color: 'from-emerald-500 to-teal-600',
      department: 'ຝ່າຍການເງິນ & ບັນຊີ',
      description: 'ເກັບເອກະສານການເງິນ ແລະ ບັນຊີທັງໝົດ',
      createdAt: '2026-01-10',
    },
    {
      id: 'CAB-002',
      name: 'ປະກາດ',
      color: 'from-indigo-500 to-blue-600',
      department: 'ຝ່າຍປະກາດ & ສື່ມວນຊົນ',
      description: 'ປະກາດ ແຈ້ງການ ຕ່າງໆ ຂອງອົງກອນ',
      createdAt: '2026-01-12',
    },
    {
      id: 'CAB-003',
      name: 'ສັນຍາ',
      color: 'from-amber-500 to-orange-600',
      department: 'ຝ່າຍສັນຍາ & ກົດໝາຍ',
      description: 'ສັນຍາ ຂໍ້ຕົກລົງ ແລະ ເອກະສານທາງກົດໝາຍ',
      createdAt: '2026-01-15',
    },
  ])

  const [folders, setFolders] = useState<Folder[]>([
    { id: 'FLDR-001', cabinetId: 'CAB-001', name: 'ໄບສັ່ງຊື້', description: 'ໃບສັ່ງຊື້ສິນຄ້າ ແລະ ບໍລິການ', createdAt: '2026-02-01' },
    { id: 'FLDR-002', cabinetId: 'CAB-001', name: 'ໄບຮັບເງິນ', description: 'ໃບຮັບເງິນ ແລະ ໃບເສຍພາສີ', createdAt: '2026-02-02' },
    { id: 'FLDR-003', cabinetId: 'CAB-001', name: 'ລາຍງານການເງິນ', description: 'ລາຍງານປະຈຳເດືອນ / ປີ', createdAt: '2026-02-05' },
    { id: 'FLDR-004', cabinetId: 'CAB-002', name: 'ແຈ້ງການພາຍໃນ', description: 'ແຈ້ງການພາຍໃນອົງກອນ', createdAt: '2026-02-03' },
    { id: 'FLDR-005', cabinetId: 'CAB-002', name: 'ປະກາດສາທາລະນະ', description: 'ປະກາດທີ່ເຜີຍແຜ່ສາທາລະນະ', createdAt: '2026-02-07' },
    { id: 'FLDR-006', cabinetId: 'CAB-003', name: 'ສັນຍາພະນັກງານ', description: 'ສັນຍາຈ້າງງານພະນັກງານ', createdAt: '2026-02-04' },
    { id: 'FLDR-007', cabinetId: 'CAB-003', name: 'ສັນຍາຜູ້ສະໜອງ', description: 'ສັນຍາກັບຜູ້ສະໜອງສິນຄ້າ/ບໍລິການ', createdAt: '2026-02-08' },
  ])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [categoriesRes, activeDocsRes, deletedDocsRes] = await Promise.all([
          apiClient.get<ApiCategory[]>('/categories'),
          apiClient.get<{ data: ApiDocument[] }>('/documents', { params: { limit: 100 } }),
          apiClient.get<{ data: ApiDocument[] }>('/documents', { params: { limit: 100, deleted: 'true' } }),
        ])
        if (cancelled) return

        setCategoryList(categoriesRes.data)
        setCategories(categoriesRes.data.map((c) => c.name))
        setDocuments([
          ...activeDocsRes.data.data.map(toFrontendDocument),
          ...deletedDocsRes.data.data.map(toFrontendDocument),
        ])
      } catch (err) {
        console.error('ໂຫຼດຂໍ້ມູນ DMS ລົ້ມເຫຼວ:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // ---------- Document helpers (ตໍ່ API ຈິງ) ----------
  async function addDocument(doc: Omit<Document, 'id' | 'deleted'>): Promise<Document> {
    const categoryId = categoryList.find((c) => c.name === doc.category)?.id
    const res = await apiClient.post<ApiDocument>('/documents', {
      title: doc.title,
      docNumber: doc.docNumber,
      categoryId,
      fileType: doc.fileType,
      status: doc.status,
      fileSize: doc.fileSize,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      uploadDate: doc.uploadDate,
    })
    const newDoc = toFrontendDocument({
      ...res.data,
      category: categoryList.find((c) => c.id === categoryId) ?? null,
      uploadedBy: null,
    })
    setDocuments((prev) => [newDoc, ...prev])
    return newDoc
  }

  async function updateDocument(id: string, patch: Partial<Document>) {
    if (patch.status) {
      await apiClient.patch(`/documents/${id}/status`, { status: patch.status })
    }
    const { status: _status, category, ...rest } = patch
    void _status
    const categoryId = category ? categoryList.find((c) => c.name === category)?.id : undefined
    if (Object.keys(rest).length > 0 || categoryId) {
      await apiClient.patch(`/documents/${id}`, { ...rest, categoryId })
    }
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  async function deleteDocument(id: string) {
    await apiClient.delete(`/documents/${id}`)
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, deleted: true } : d)))
  }

  async function restoreDocument(id: string) {
    await apiClient.patch(`/documents/${id}/restore`)
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, deleted: false } : d)))
  }

  async function permDeleteDocument(id: string) {
    await apiClient.delete(`/documents/${id}/permanent`)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  async function archiveDocument(id: string) {
    await apiClient.patch(`/documents/${id}/archive`)
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'archived' } : d)))
  }

  // ---------- Category helpers (ตໍ່ API ຈິງ) ----------
  async function addCategory(name: string) {
    const trimmed = name.trim()
    if (!trimmed || categories.includes(trimmed)) return
    const res = await apiClient.post<ApiCategory>('/categories', { name: trimmed })
    setCategoryList((prev) => [res.data, ...prev])
    setCategories((prev) => [res.data.name, ...prev])
  }

  async function removeCategory(name: string) {
    const category = categoryList.find((c) => c.name === name)
    if (!category) return
    await apiClient.delete(`/categories/${category.id}`)
    setCategoryList((prev) => prev.filter((c) => c.id !== category.id))
    setCategories((prev) => prev.filter((c) => c !== name))
  }

  // ---------- User helpers (ยังเป็น local state, ยังไม่ต่อ API ในรอบนี้) ----------
  function addUser(user: Omit<User, 'id'>): User {
    const newUser: User = { ...user, id: generateId('USR') }
    setUsers((prev) => [newUser, ...prev])
    return newUser
  }

  function updateUser(id: string, patch: Partial<User>) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  function removeUser(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  function toggleUserStatus(id: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u))
    )
  }

  // ---------- 3-Level Archive helpers (local mock) ----------
  function createCabinet(data: { name: string; color: string; department: string; description: string }) {
    const newCabinet: Cabinet = {
      id: generateId('CAB'),
      name: data.name,
      color: data.color,
      department: data.department,
      description: data.description,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setCabinets((prev) => [newCabinet, ...prev])
  }

  function createFolder(data: { cabinetId: string; name: string; description: string }) {
    const newFolder: Folder = {
      id: generateId('FLDR'),
      cabinetId: data.cabinetId,
      name: data.name,
      description: data.description,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setFolders((prev) => [newFolder, ...prev])
  }

  function deleteCabinet(id: string) {
    // ลบตู้ และ folders ในตู้นั้น พร้อมถอนเอกสารออกจากการจัดระเบียบ
    setCabinets((prev) => prev.filter((c) => c.id !== id))
    setFolders((prev) => prev.filter((f) => f.cabinetId !== id))
    setDocuments((prev) =>
      prev.map((d) =>
        d.cabinetId === id
          ? { ...d, cabinetId: undefined, cabinetName: undefined, folderId: undefined, folderName: undefined }
          : d
      )
    )
  }

  function deleteFolder(id: string) {
    setFolders((prev) => prev.filter((f) => f.id !== id))
    setDocuments((prev) =>
      prev.map((d) => (d.folderId === id ? { ...d, folderId: undefined, folderName: undefined } : d))
    )
  }

  function assignDocument(docId: string, cabinetId: string, folderId: string) {
    const cabinet = cabinets.find((c) => c.id === cabinetId)
    const folder = folders.find((f) => f.id === folderId)
    updateDocument(docId, {
      cabinetId,
      cabinetName: cabinet?.name,
      folderId,
      folderName: folder?.name,
    })
  }

  return (
    <DMSContext.Provider
      value={{
        documents,
        setDocuments,
        categories,
        setCategories,
        users,
        setUsers,
        loading,
        addDocument,
        updateDocument,
        deleteDocument,
        restoreDocument,
        permDeleteDocument,
        archiveDocument,
        addCategory,
        removeCategory,
        addUser,
        updateUser,
        removeUser,
        toggleUserStatus,
        cabinets,
        setCabinets,
        folders,
        setFolders,
        createCabinet,
        createFolder,
        deleteCabinet,
        deleteFolder,
        assignDocument,
      }}
    >
      {children}
    </DMSContext.Provider>
  )
}

export function useDMS() {
  const ctx = useContext(DMSContext)
  if (!ctx) throw new Error('useDMS must be used within DMSProvider')
  return ctx
}

export default DMSContext
