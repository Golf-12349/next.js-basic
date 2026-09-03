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

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [categoryList, setCategoryList] = useState<ApiCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('token')) {
        setLoading(false)
        return
      }
      try {
        const [serverCategories, activeDocs, deletedDocs] = await Promise.all([
          categoryService.fetchCategories(),
          documentService.fetchDocuments({ limit: 100 }),
          documentService.fetchDocuments({ limit: 100, deleted: 'true' }),
        ])
        if (cancelled) return
        setCategoryList(serverCategories)
        setCategories(serverCategories.map((c) => c.name))
        setDocuments([
          ...activeDocs.map(toFrontendDocument),
          ...deletedDocs.map(toFrontendDocument),
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

  const uploadFile = useCallback(
    (file: File) => documentService.uploadFile(file),
    [],
  )

  const addDocument = useCallback(async (doc: Omit<Document, 'id' | 'deleted'>): Promise<Document> => {
    const categoryId = categoryList.find((c) => c.name === doc.category)?.id
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
    const newDoc = toFrontendDocument(apiDoc)
    setDocuments((prev) => [newDoc, ...prev])
    return newDoc
  }, [categoryList])

  const updateDocument = useCallback(async (id: string, patch: Partial<Document>): Promise<void> => {
    if (patch.status) {
      await documentService.updateDocumentStatus(id, patch.status)
    }
    // cabinetName/folderName are derived by the backend from cabinetId/folderId — not PATCH-able fields.



    const { status: _status, category, cabinetName: _cabinetName, folderName: _folderName, ...rest } = patch
    void _status
    void _cabinetName
    void _folderName
    const categoryId = category ? categoryList.find((c) => c.name === category)?.id : undefined
    if (Object.keys(rest).length > 0 || categoryId) {
      await documentService.patchDocument(id, { ...rest, categoryId })
    }
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }, [categoryList])

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    await documentService.softDeleteDocument(id)
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, deleted: true } : d)))
  }, [])

  const restoreDocument = useCallback(async (id: string): Promise<void> => {
    await documentService.restoreDocument(id)
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, deleted: false } : d)))
  }, [])

  const permDeleteDocument = useCallback(async (id: string): Promise<void> => {
    await documentService.permanentDeleteDocument(id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const archiveDocument = useCallback(async (id: string): Promise<void> => {
    await documentService.archiveDocument(id)
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'archived' } : d)))
  }, [])

  const addCategory = useCallback(async (name: string): Promise<void> => {
    const trimmed = name.trim()
    if (!trimmed || categories.includes(trimmed)) return
    const created = await categoryService.createCategory(trimmed)
    setCategoryList((prev) => [created, ...prev])
    setCategories((prev) => [created.name, ...prev])
  }, [categories])

  const removeCategory = useCallback(async (name: string): Promise<void> => {
    const category = categoryList.find((c) => c.name === name)
    if (!category) return
    await categoryService.deleteCategory(category.id)
    setCategoryList((prev) => prev.filter((c) => c.id !== category.id))
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