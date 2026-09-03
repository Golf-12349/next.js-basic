'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Cabinet, Folder } from '@/types/document'
import * as archiveService from '@/lib/dms/archiveService'
import { useDocuments } from './DocumentsContext'

export interface ArchiveContextValue {
  cabinets: Cabinet[]
  setCabinets: React.Dispatch<React.SetStateAction<Cabinet[]>>
  folders: Folder[]
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>
  createCabinet: (data: archiveService.CreateCabinetPayload) => Promise<void>
  createFolder: (data: archiveService.CreateFolderPayload) => Promise<void>
  deleteCabinet: (id: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  assignDocument: (docId: string, cabinetId: string, folderId: string) => Promise<void>
}

const ArchiveContext = createContext<ArchiveContextValue | undefined>(undefined)

export function ArchiveProvider({ children }: { children: React.ReactNode }) {
  const { setDocuments, updateDocument } = useDocuments()
  const [cabinets, setCabinets] = useState<Cabinet[]>([])
  const [folders, setFolders] = useState<Folder[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('token')) return
      try {
        const [cabinetGroup, folderGroup] = await Promise.all([
          archiveService.fetchCabinets(),
          archiveService.fetchFolders(),
        ])
        if (cancelled) return
        setCabinets(cabinetGroup)
        setFolders(folderGroup)
      } catch (err) {
        console.error('ໂຫຼດຕູ້/ແຟ້ມເອກະສານລົ້ມເຫຼວ:', err)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const createCabinet = useCallback(async (data: archiveService.CreateCabinetPayload): Promise<void> => {
    const created = await archiveService.createCabinet(data)
    setCabinets((prev) => [created, ...prev])
  }, [])

  const createFolder = useCallback(async (data: archiveService.CreateFolderPayload): Promise<void> => {
    const created = await archiveService.createFolder(data)
    setFolders((prev) => [created, ...prev])
  }, [])

  const deleteCabinet = useCallback(async (id: string): Promise<void> => {
    await archiveService.deleteCabinet(id)
    setCabinets((prev) => prev.filter((c) => c.id !== id))
    setFolders((prev) => prev.filter((f) => f.cabinetId !== id))
    // Detach documents that lived in this cabinet (soft-unlinked, not deleted.


    setDocuments((prev) => prev.map((d) =>
      d.cabinetId === id
        ? { ...d, cabinetId: undefined, cabinetName: undefined, folderId: undefined, folderName: undefined }
        : d
    ))
  }, [setDocuments])

  const deleteFolder = useCallback(async (id: string): Promise<void> => {
    await archiveService.deleteFolder(id)
    setFolders((prev) => prev.filter((f) => f.id !== id))
    setDocuments((prev) => prev.map((d) =>
      d.folderId === id ? { ...d, folderId: undefined, folderName: undefined } : d
    ))
  }, [setDocuments])

  const assignDocument = useCallback(async (docId: string, cabinetId: string, folderId: string): Promise<void> => {
    const cabinet = cabinets.find((c) => c.id === cabinetId)
    const folder = folders.find((f) => f.id === folderId)
    await updateDocument(docId, {
      cabinetId,
      cabinetName: cabinet?.name,
      folderId,
      folderName: folder?.name,
    })
  }, [cabinets, folders, updateDocument])

  const value = useMemo<ArchiveContextValue>(
    () => ({
      cabinets,
      setCabinets,
      folders,
      setFolders,
      createCabinet,
      createFolder,
      deleteCabinet,
      deleteFolder,
      assignDocument,
    }),
    [
      cabinets,
      setCabinets,
      folders,
      setFolders,
      createCabinet,
      createFolder,
      deleteCabinet,
      deleteFolder,
      assignDocument,
    ],
  )

  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>
}

export function useArchive() {
  const ctx = useContext(ArchiveContext)
  if (!ctx) throw new Error('useArchive must be used within ArchiveProvider')
  return ctx
}