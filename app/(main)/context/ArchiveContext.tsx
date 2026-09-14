'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Cabinet, Folder, Warehouse } from '@/types/document'
import * as archiveService from '@/lib/dms/archiveService'
import * as warehouseService from '@/lib/dms/warehouseService'
import { useDocuments } from './DocumentsContext'

export interface ArchiveContextValue {
  warehouses: Warehouse[]
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>
  cabinets: Cabinet[]
  setCabinets: React.Dispatch<React.SetStateAction<Cabinet[]>>
  folders: Folder[]
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>
  createWarehouse: (data: { name: string; division?: string; description?: string; color?: string }) => Promise<void>
  updateWarehouse: (id: string, data: Partial<{ name: string; division?: string; description?: string; color?: string }>) => Promise<void>
  deleteWarehouse: (id: string) => Promise<void>
  createCabinet: (data: archiveService.CreateCabinetPayload) => Promise<void>
  createFolder: (data: archiveService.CreateFolderPayload) => Promise<void>
  deleteCabinet: (id: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  assignDocument: (docId: string, cabinetId: string, folderId: string, warehouseId?: string) => Promise<void>
}

const ArchiveContext = createContext<ArchiveContextValue | undefined>(undefined)

export function ArchiveProvider({ children }: { children: React.ReactNode }) {
  const { setDocuments, updateDocument } = useDocuments()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [cabinets, setCabinets] = useState<Cabinet[]>([])
  const [folders, setFolders] = useState<Folder[]>([])

  const reloadArchive = useCallback(async () => {
    const token = typeof window !== 'undefined'
      ? sessionStorage.getItem('token') || localStorage.getItem('token')
      : null
    if (!token) return
    try {
      const [warehouseGroup, cabinetGroup, folderGroup] = await Promise.all([
        warehouseService.fetchWarehouses(),
        archiveService.fetchCabinets(),
        archiveService.fetchFolders(),
      ])
      setWarehouses(warehouseGroup)
      setCabinets(cabinetGroup)
      setFolders(folderGroup)
    } catch (err) {
      console.warn('ໂຫຼດຄັງ/ຕູ້/ແຟ້ມເອກະສານລົ້ມເຫຼວ:', err)
    }
  }, [])

  useEffect(() => {
    void reloadArchive()
  }, [reloadArchive])

  // Real-time synchronization: reload cabinets and folders whenever backend broadcasts a change
  useEffect(() => {
    const handleArchiveChanged = () => {
      void reloadArchive()
    }
    window.addEventListener('dms:archive-changed', handleArchiveChanged)
    return () => {
      window.removeEventListener('dms:archive-changed', handleArchiveChanged)
    }
  }, [reloadArchive])

  const createWarehouse = useCallback(async (data: { name: string; division?: string; description?: string; color?: string }): Promise<void> => {
    const created = await warehouseService.createWarehouse(data)
    setWarehouses((prev) => [created, ...prev])
  }, [])

  const updateWarehouse = useCallback(async (id: string, data: Partial<{ name: string; division?: string; description?: string; color?: string }>): Promise<void> => {
    const updated = await warehouseService.updateWarehouse(id, data)
    setWarehouses((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)))
  }, [])

  const deleteWarehouse = useCallback(async (id: string): Promise<void> => {
    await warehouseService.deleteWarehouse(id)
    setWarehouses((prev) => prev.filter((w) => w.id !== id))
    setCabinets((prev) => prev.filter((c) => c.warehouseId !== id))
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
    // Detach documents that lived in this cabinet (soft-unlinked, not deleted)
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

  const assignDocument = useCallback(async (docId: string, cabinetId: string, folderId: string, warehouseId?: string): Promise<void> => {
    const cabinet = cabinets.find((c) => c.id === cabinetId)
    const folder = folders.find((f) => f.id === folderId)
    const warehouse = warehouseId ? warehouses.find((w) => w.id === warehouseId) : undefined
    await updateDocument(docId, {
      warehouseId,
      warehouseName: warehouse?.name,
      cabinetId,
      cabinetName: cabinet?.name,
      folderId,
      folderName: folder?.name,
    })
  }, [cabinets, folders, warehouses, updateDocument])

  const value = useMemo<ArchiveContextValue>(
    () => ({
      warehouses,
      setWarehouses,
      cabinets,
      setCabinets,
      folders,
      setFolders,
      createWarehouse,
      updateWarehouse,
      deleteWarehouse,
      createCabinet,
      createFolder,
      deleteCabinet,
      deleteFolder,
      assignDocument,
    }),
    [
      warehouses,
      setWarehouses,
      cabinets,
      setCabinets,
      folders,
      setFolders,
      createWarehouse,
      updateWarehouse,
      deleteWarehouse,
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