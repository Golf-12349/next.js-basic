"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'
import secureLocalStorage from 'react-secure-storage'
import apiClient from '@/config/axiosClient'
import { Cabinet, Document, Folder } from '@/types/document'
import { User } from '@/types/user'

type ApiCategory = { id: string; name: string }
type ApiUser = {
  id: string
  name: string
  email: string
  role: User['role']
  phone: string | null
  department: string | null
  status: User['status']
  createdAt: string
  updatedAt: string
  // ມີແຕ່ຄັ້ງດຽວຕອນສ້າງ user ໃໝ່ໂດຍບໍ່ໄດ້ໃສ່ password ມາເອງ — backend ສຸ່ມໃຫ້ແລ້ວສົ່ງກັບມາຄັ້ງດຽວ
  temporaryPassword?: string
}
type ApiCabinet = { id: string; name: string; color: string; department: string; description: string; createdAt: string }
type ApiFolder = { id: string; cabinetId: string; name: string; description: string; createdAt: string }
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
  cabinetId: string | null
  cabinet: ApiCabinet | null
  folderId: string | null
  folder: ApiFolder | null
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
  uploadFile: (file: File) => Promise<{ fileUrl: string; fileName: string; fileSize: string }>
  addDocument: (doc: Omit<Document, 'id' | 'deleted'>) => Promise<Document>
  updateDocument: (id: string, patch: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void> // soft delete -> ไป Trash
  restoreDocument: (id: string) => Promise<void> // กู้คืนจาก Trash
  permDeleteDocument: (id: string) => Promise<void> // ลบถาวร
  archiveDocument: (id: string) => Promise<void> // เปลี่ยน status เป็น archived

  addCategory: (name: string) => Promise<void>
  removeCategory: (name: string) => Promise<void>

  // User helpers (ตໍ່ API ຈິງ)
  addUser: (user: Omit<User, 'id' | 'joinDate' | 'lastActive'>) => Promise<User & { temporaryPassword?: string }>
  updateUser: (id: string, patch: Partial<User>) => Promise<void>
  removeUser: (id: string) => Promise<void>
  toggleUserStatus: (id: string) => Promise<void>

  // 3-Level Archive (cabinets -> folders -> documents) helpers (ตໍ່ API ຈິງ)
  cabinets: Cabinet[]
  setCabinets: React.Dispatch<React.SetStateAction<Cabinet[]>>
  folders: Folder[]
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>
  createCabinet: (data: { name: string; color: string; department: string; description: string }) => Promise<void>
  createFolder: (data: { cabinetId: string; name: string; description: string }) => Promise<void>
  deleteCabinet: (id: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  assignDocument: (docId: string, cabinetId: string, folderId: string) => Promise<void>
}

const DMSContext = createContext<DMSContextType | undefined>(undefined)

function toFrontendUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
    department: user.department ?? '',
    status: user.status,
    joinDate: user.createdAt.slice(0, 10),
    lastActive: user.updatedAt.slice(0, 10),
  }
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
    cabinetId: doc.cabinetId ?? undefined,
    cabinetName: doc.cabinet?.name,
    folderId: doc.folderId ?? undefined,
    folderName: doc.folder?.name,
  }
}

export function DMSProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [categoryList, setCategoryList] = useState<ApiCategory[]>([])
  const [loading, setLoading] = useState(true)

  const [users, setUsers] = useState<User[]>([])

  // ── 3-Level Archive state: Cabinets & Folders (ตໍ່ API ຈິງ) ──
  const [cabinets, setCabinets] = useState<Cabinet[]>([])
  const [folders, setFolders] = useState<Folder[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      // ຍັງບໍ່ login (ບໍ່ມີ token) — ຂ້າມການໂຫຼດ ບໍ່ຕ້ອງຍິງ request ໄປໃຫ້ໂດນ 401
      if (!secureLocalStorage.getItem('token')) {
        setLoading(false)
        return
      }
      try {
        const [categoriesRes, activeDocsRes, deletedDocsRes, cabinetsRes, foldersRes] = await Promise.all([
          apiClient.get<ApiCategory[]>('/categories'),
          apiClient.get<{ data: ApiDocument[] }>('/documents', { params: { limit: 100 } }),
          apiClient.get<{ data: ApiDocument[] }>('/documents', { params: { limit: 100, deleted: 'true' } }),
          apiClient.get<ApiCabinet[]>('/cabinets'),
          apiClient.get<ApiFolder[]>('/folders'),
        ])
        if (cancelled) return

        setCategoryList(categoriesRes.data)
        setCategories(categoriesRes.data.map((c) => c.name))
        setDocuments([
          ...activeDocsRes.data.data.map(toFrontendDocument),
          ...deletedDocsRes.data.data.map(toFrontendDocument),
        ])
        setCabinets(cabinetsRes.data)
        setFolders(foldersRes.data)

        // /users ต้องมีสิทธิ์ SuperAdmin/Admin — user ทั่วไปจะโดน 403 ซึ่งไม่ควรทำให้ข้อมูลส่วนอื่นโหลดไม่ได้
        try {
          const usersRes = await apiClient.get<ApiUser[]>('/users')
          if (!cancelled) setUsers(usersRes.data.map(toFrontendUser))
        } catch (err) {
          console.warn('ໂຫຼດລາຍຊື່ຜູ້ໃຊ້ບໍ່ໄດ້ (ອາດຈະບໍ່ມີສິດ):', err)
        }
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
  async function uploadFile(file: File): Promise<{ fileUrl: string; fileName: string; fileSize: string }> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post<{ fileUrl: string; fileName: string; fileSize: string }>(
      '/documents/upload-file',
      formData,
    )
    return res.data
  }

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
      cabinetId: doc.cabinetId,
      folderId: doc.folderId,
    })
    const newDoc = toFrontendDocument(res.data)
    setDocuments((prev) => [newDoc, ...prev])
    return newDoc
  }

  async function updateDocument(id: string, patch: Partial<Document>) {
    if (patch.status) {
      await apiClient.patch(`/documents/${id}/status`, { status: patch.status })
    }
    // cabinetName/folderName เป็นค่าที่ backend derive ให้เองจาก cabinetId/folderId — ไม่ใช่ field ที่ backend รับ
    const { status: _status, category, cabinetName: _cabinetName, folderName: _folderName, ...rest } = patch
    void _status
    void _cabinetName
    void _folderName
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

  // ---------- User helpers (ตໍ່ API ຈິງ) ----------
  async function addUser(
    user: Omit<User, 'id' | 'joinDate' | 'lastActive'>,
  ): Promise<User & { temporaryPassword?: string }> {
    const res = await apiClient.post<ApiUser>('/users', {
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      department: user.department,
      status: user.status,
    })
    const newUser = toFrontendUser(res.data)
    setUsers((prev) => [newUser, ...prev])
    return { ...newUser, temporaryPassword: res.data.temporaryPassword }
  }

  async function updateUser(id: string, patch: Partial<User>) {
    const { joinDate: _joinDate, lastActive: _lastActive, ...rest } = patch
    void _joinDate
    void _lastActive
    await apiClient.patch(`/users/${id}`, rest)
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  async function removeUser(id: string) {
    await apiClient.delete(`/users/${id}`)
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  async function toggleUserStatus(id: string) {
    const target = users.find((u) => u.id === id)
    if (!target) return
    const status = target.status === 'active' ? 'inactive' : 'active'
    await apiClient.patch(`/users/${id}`, { status })
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
  }

  // ---------- 3-Level Archive helpers (ตໍ່ API ຈິງ) ----------
  async function createCabinet(data: { name: string; color: string; department: string; description: string }) {
    const res = await apiClient.post<ApiCabinet>('/cabinets', data)
    setCabinets((prev) => [res.data, ...prev])
  }

  async function createFolder(data: { cabinetId: string; name: string; description: string }) {
    const res = await apiClient.post<ApiFolder>('/folders', data)
    setFolders((prev) => [res.data, ...prev])
  }

  async function deleteCabinet(id: string) {
    // ลบตู้ + folders ในตู้นั้น (backend cascade), เอกสารที่เคยอยู่ในตู้นี้จะแค่ถอนออก (ไม่ถูกลบ)
    await apiClient.delete(`/cabinets/${id}`)
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

  async function deleteFolder(id: string) {
    await apiClient.delete(`/folders/${id}`)
    setFolders((prev) => prev.filter((f) => f.id !== id))
    setDocuments((prev) =>
      prev.map((d) => (d.folderId === id ? { ...d, folderId: undefined, folderName: undefined } : d))
    )
  }

  async function assignDocument(docId: string, cabinetId: string, folderId: string) {
    const cabinet = cabinets.find((c) => c.id === cabinetId)
    const folder = folders.find((f) => f.id === folderId)
    await updateDocument(docId, {
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
        uploadFile,
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
