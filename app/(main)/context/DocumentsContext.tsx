'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Document } from '@/types/document'
import * as categoryService from '@/lib/dms/categoryService'
import * as documentService from '@/lib/dms/documentService'
import { DEFAULT_CATEGORIES } from '@/lib/dms/constants'
import { toFrontendDocument, type ApiCategory } from '@/lib/dms/types'

export interface DocumentsContextValue {
  documents: Document[]
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
  categories: string[]
  setCategories: React.Dispatch<React.SetStateAction<string[]>>
  loading: boolean
  uploadFile: (file: File) => Promise<documentService.UploadFileResult>
  addDocument: (doc: Omit<Document, 'id' | 'deleted'>) => Promise<Document>
  updateDocument: (id: string, patch: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  restoreDocument: (id: string) => Promise<void>
  permDeleteDocument: (id: string) => Promise<void>
  archiveDocument: (id: string) => Promise<void>
  /** ເພີ່ມໝວດໝູ່ — ຄືນ true ຖ້າສ້າງຝັ່ງ backend ສຳເລັດ */
  addCategory: (name: string) => Promise<boolean>
  /** ລຶບໝວດໝູ່ — ຄືນ true ຖ້າລຶບສຳເລັດ */
  removeCategory: (name: string) => Promise<boolean>
  reload: () => Promise<void>
}

const DocumentsContext = createContext<DocumentsContextValue | undefined>(undefined)

const DOCS_STORAGE_KEY = 'dms_documents'
const CATEGORIES_STORAGE_KEY = 'dms_categories'

// ກັນການ seed ຊ້ຳພ້ອມກັນ ເມື່ອ reload ຖືກເອີ້ນຫຼາຍຄັ້ງພ້ອມກັນ (mount + realtime events)
let seedingDefaultCategories = false

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(DOCS_STORAGE_KEY) || sessionStorage.getItem(DOCS_STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return []
  })
  const [categories, setCategories] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY) || sessionStorage.getItem(CATEGORIES_STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return []
  })
  const [categoryList, setCategoryList] = useState<ApiCategory[]>([])
  const [loading, setLoading] = useState(true)

  // Persist documents across page refreshes
  useEffect(() => {
    try {
      if (documents.length > 0) {
        localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(documents))
        sessionStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(documents))
      }
    } catch {}
  }, [documents])

  // Persist categories across page refreshes
  useEffect(() => {
    try {
      if (categories.length > 0) {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
        sessionStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
      }
    } catch {}
  }, [categories])

  const reload = useCallback(async () => {
    const token = typeof window !== 'undefined'
      ? sessionStorage.getItem('token') || localStorage.getItem('token')
      : null

    if (!token) {
      setLoading(false)
      return
    }
    try {
      const [fetchedCategories, activeDocs, deletedDocs] = await Promise.all([
        categoryService.fetchCategories(),
        documentService.fetchDocuments({ limit: 100 }),
        documentService.fetchDocuments({ limit: 100, deleted: 'true' }),
      ])
      let serverCategories = fetchedCategories
      // Auto-seed: ຖ້າ backend ຍັງບໍ່ມີໝວດໝູ່ເລີຍ (ຖານຂໍ້ມູນໃໝ່) ໃຫ້ສ້າງໝວດໝູ່ເລີ່ມຕົ້ນໃຫ້
      // ເພື່ອຮັບປະກັນວ່າເອກະສານທີ່ອັບໂຫຼດ ຈະມີ categoryId ຕິດເສີມສະເໝີ (ແກ້ບັນຫາຄອລັມໝວດໝູ່ວ່າງ)
      if (serverCategories.length === 0 && !seedingDefaultCategories) {
        seedingDefaultCategories = true
        try {
          const seeded = await Promise.all(
            DEFAULT_CATEGORIES.map((name) =>
              categoryService.createCategory(name).catch(() => null),
            ),
          )
          const created = seeded.filter((c): c is ApiCategory => c !== null)
          if (created.length > 0) serverCategories = created
        } catch (err) {
          console.warn('Auto-seed default categories failed:', err)
        } finally {
          seedingDefaultCategories = false
        }
      }
      setCategoryList(serverCategories)
      if (serverCategories.length > 0) {
        setCategories(serverCategories.map((c) => c.name))
      }
      const fetchedDocs = [
        ...activeDocs.map(toFrontendDocument),
        ...deletedDocs.map(toFrontendDocument),
      ]
      setDocuments(fetchedDocs)
      try {
        localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(fetchedDocs))
        sessionStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(fetchedDocs))
      } catch {}
    } catch (err) {
      console.error('ໂຫຼດຂໍ້ມູນ DMS ລົ້ມເຫຼວ:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  // Real-time synchronization: reload documents and categories whenever backend broadcasts a change
  useEffect(() => {
    const handleDocsChanged = () => {
      void reload()
    }
    const handleCatsChanged = () => {
      void reload()
    }
    window.addEventListener('dms:documents-changed', handleDocsChanged)
    window.addEventListener('dms:categories-changed', handleCatsChanged)
    return () => {
      window.removeEventListener('dms:documents-changed', handleDocsChanged)
      window.removeEventListener('dms:categories-changed', handleCatsChanged)
    }
  }, [reload])

  const uploadFile = useCallback(
    (file: File) => documentService.uploadFile(file),
    [],
  )

  /** ຊອກຫາໝວດໝູ່ຕາມຊື່ — ຖ້າຍັງບໍ່ມີຈະສ້າງໃຫ້ໃໝ່ບົນ backend ແລ້ວຄືນ object ທີ່ມີ id ຈິງ */
  const ensureCategory = useCallback(async (name: string): Promise<ApiCategory | undefined> => {
    const trimmed = name.trim()
    if (!trimmed) return undefined
    const existing = categoryList.find((c) => c.name === trimmed)
    if (existing) return existing
    try {
      const created = await categoryService.createCategory(trimmed)
      setCategoryList((prev) => [created, ...prev])
      setCategories((prev) => (prev.includes(created.name) ? prev : [created.name, ...prev]))
      return created
    } catch {
      // ອາດມີຜູ້ໃຊ້/ເຄື່ອງອື່ນສ້າງໄປກ່ອນ — ດຶງ list ໃໝ່ຈາກ backend ແລ້ວຄົ້ນຫາອີກຄັ້ງ
      try {
        const fresh = await categoryService.fetchCategories()
        setCategoryList(fresh)
        if (fresh.length > 0) setCategories(fresh.map((c) => c.name))
        return fresh.find((c) => c.name === trimmed)
      } catch {
        return undefined
      }
    }
  }, [categoryList])

  const addDocument = useCallback(async (doc: Omit<Document, 'id' | 'deleted'>): Promise<Document> => {
    // ຮັບປະກັນວ່າໝວດໝູ່ມີຢູ່ບົນ backend ກ່ອນສ້າງເອກະສານ — ບໍ່ສົ່ງ categoryId ວ່າງໆ
    // (ນີ້ຄືຮາກບັນຫາຄອລັມໝວດໝູ່ວ່າງ: ເມື່ອກ່ອນຊື່ໝວດໝູ່ບໍ່ພົບໃນ categoryList → categoryId undefined → backend ເກັບ null)
    let categoryId = categoryList.find((c) => c.name === doc.category)?.id
    if (!categoryId && doc.category.trim()) {
      const ensured = await ensureCategory(doc.category)
      categoryId = ensured?.id
    }
    let newDoc: Document
    try {
      const apiDoc = await documentService.createDocument({
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
      newDoc = toFrontendDocument(apiDoc)
    } catch (err) {
      console.warn('Backend createDocument error, persisting locally:', err)
      newDoc = {
        ...doc,
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        deleted: false,
      }
    }
    setDocuments((prev) => {
      const filtered = prev.filter((d) => d.id !== newDoc.id)
      return [newDoc, ...filtered]
    })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dms:documents-changed', { detail: { action: 'create', doc: newDoc } }))
    }
    void reload()
    return newDoc
  }, [categoryList, ensureCategory, reload])

  const updateDocument = useCallback(async (id: string, patch: Partial<Document>): Promise<void> => {
    try {
      if (patch.status) {
        await documentService.updateDocumentStatus(id, patch.status)
      }
      const { status: _status, category, cabinetName: _cabinetName, folderName: _folderName, ...rest } = patch
      void _status
      void _cabinetName
      void _folderName
      const categoryId = category ? categoryList.find((c) => c.name === category)?.id : undefined
      if (Object.keys(rest).length > 0 || categoryId) {
        await documentService.patchDocument(id, { ...rest, categoryId })
      }
    } catch (err) {
      console.warn('Backend updateDocument error, updating local state:', err)
    }
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }, [categoryList])

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    try {
      await documentService.softDeleteDocument(id)
    } catch (err) {
      console.warn('Backend softDeleteDocument error, updating local state:', err)
    }
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, deleted: true } : d)))
  }, [])

  const restoreDocument = useCallback(async (id: string): Promise<void> => {
    try {
      await documentService.restoreDocument(id)
    } catch (err) {
      console.warn('Backend restoreDocument error, updating local state:', err)
    }
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, deleted: false } : d)))
  }, [])

  const permDeleteDocument = useCallback(async (id: string): Promise<void> => {
    try {
      await documentService.permanentDeleteDocument(id)
    } catch (err) {
      console.warn('Backend permanentDeleteDocument error, updating local state:', err)
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const archiveDocument = useCallback(async (id: string): Promise<void> => {
    try {
      await documentService.archiveDocument(id)
    } catch (err) {
      console.warn('Backend archiveDocument error, updating local state:', err)
    }
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'archived' } : d)))
  }, [])

  const addCategory = useCallback(async (name: string): Promise<boolean> => {
    const trimmed = name.trim()
    if (!trimmed || categories.includes(trimmed)) return false
    try {
      const created = await categoryService.createCategory(trimmed)
      setCategoryList((prev) => [created, ...prev])
      setCategories((prev) => [created.name, ...prev])
      return true
    } catch {
      // ຢ່າເພີ່ມ local ແບບເງົາໆອີກຕໍ່ — ຊື່ທີ່ backend ບໍ່ຮູ້ຈັກ ຈະເຮັດໃຫ້ເອກະສານທີ່ໃຊ້ມັນບໍ່ມີ categoryId
      return false
    }
  }, [categories])

  const removeCategory = useCallback(async (name: string): Promise<boolean> => {
    const category = categoryList.find((c) => c.name === name)
    if (category) {
      try {
        await categoryService.deleteCategory(category.id)
      } catch {
        // backend ລຶບບໍ່ສຳເລັດ — ເກັບໝວດໝູ່ໄວ້ (ຢ່າລຶບ local ທິ້ງ backend)
        return false
      }
      setCategoryList((prev) => prev.filter((c) => c.id !== category.id))
    }
    setCategories((prev) => prev.filter((c) => c !== name))
    return true
  }, [categoryList])

  const value = useMemo<DocumentsContextValue>(
    () => ({
      documents,
      setDocuments,
      categories,
      setCategories,
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
      reload,
    }),
    [
      documents,
      setDocuments,
      categories,
      setCategories,
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
      reload,
    ],
  )

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext)
  if (!ctx) throw new Error('useDocuments must be used within DocumentsProvider')
  return ctx
}