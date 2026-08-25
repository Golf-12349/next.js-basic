"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'
import apiClient from '@/config/axiosClient'
import { Document } from '@/types/document'
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
  documents: Document[]
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
  categories: string[]
  setCategories: React.Dispatch<React.SetStateAction<string[]>>
  users: User[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>

  loading: boolean

  addDocument: (doc: Omit<Document, 'id' | 'deleted'>) => Promise<Document>
  updateDocument: (id: string, patch: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  restoreDocument: (id: string) => Promise<void>
  permDeleteDocument: (id: string) => Promise<void>
  archiveDocument: (id: string) => Promise<void>

  addCategory: (name: string) => Promise<void>
  removeCategory: (name: string) => Promise<void>

  addUser: (user: Omit<User, 'id'>) => User
  removeUser: (id: string) => void
}

const DMSContext = createContext<DMSContextType | undefined>(undefined)

function toFrontendDocument(doc: ApiDocument): Document {
  return {
    id: doc.id,
    title: doc.title,
    docNumber: doc.docNumber,
    category: (doc.category?.name ?? '') as Document['category'],
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
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

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

  // ---------- Document helpers ----------
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
    const newDoc = toFrontendDocument({ ...res.data, category: categoryList.find((c) => c.id === categoryId) ?? null, uploadedBy: null })
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

  // ---------- Category helpers ----------
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

  // ---------- User helpers (ຍັງເປັນ local state, ບໍ່ໄດ້ຕໍ່ API ໃນຮອບນີ້) ----------
  function generateId(prefix: string) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`
  }

  function addUser(user: Omit<User, 'id'>): User {
    const newUser: User = { ...user, id: generateId('USR') }
    setUsers((prev) => [newUser, ...prev])
    return newUser
  }

  function removeUser(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id))
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
        removeUser,
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
