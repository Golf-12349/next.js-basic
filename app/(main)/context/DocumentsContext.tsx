'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Document } from '@/types/document'
import * as categoryService from '@/lib/dms/categoryService'
import * as documentService from '@/lib/dms/documentService'
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
  addCategory: (name: string) => Promise<void>
  removeCategory: (name: string) => Promise<void>
}

const DocumentsContext = createContext<DocumentsContextValue | undefined>(undefined)

const DOCS_STORAGE_KEY = 'dms_documents'
const CATEGORIES_STORAGE_KEY = 'dms_categories'

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
      const [serverCategories, activeDocs, deletedDocs] = await Promise.all([
        categoryService.fetchCategories(),
        documentService.fetchDocuments({ limit: 100 }),
        documentService.fetchDocuments({ limit: 100, deleted: 'true' }),
      ])
      setCategoryList(serverCategories)
      if (serverCategories.length > 0) {
        setCategories(serverCategories.map((c) => c.name))
      }
      const fetchedDocs = [
        ...activeDocs.map(toFrontendDocument),
        ...deletedDocs.map(toFrontendDocument),
      ]
      if (fetchedDocs.length > 0) {
        setDocuments(fetchedDocs)
      }
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

  const addDocument = useCallback(async (doc: Omit<Document, 'id' | 'deleted'>): Promise<Document> => {
    const categoryId = categoryList.find((c) => c.name === doc.category)?.id
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
    setDocuments((prev) => [newDoc, ...prev])
    return newDoc
  }, [categoryList])

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

  const addCategory = useCallback(async (name: string): Promise<void> => {
    const trimmed = name.trim()
    if (!trimmed || categories.includes(trimmed)) return
    try {
      const created = await categoryService.createCategory(trimmed)
      setCategoryList((prev) => [created, ...prev])
      setCategories((prev) => [created.name, ...prev])
    } catch {
      setCategories((prev) => [trimmed, ...prev])
    }
  }, [categories])

  const removeCategory = useCallback(async (name: string): Promise<void> => {
    const category = categoryList.find((c) => c.name === name)
    try {
      if (category) await categoryService.deleteCategory(category.id)
    } catch {}
    if (category) {
      setCategoryList((prev) => prev.filter((c) => c.id !== category.id))
    }
    setCategories((prev) => prev.filter((c) => c !== name))
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
    ],
  )

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext)
  if (!ctx) throw new Error('useDocuments must be used within DocumentsProvider')
  return ctx
}