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

const WAREHOUSES_STORAGE_KEY = 'dms_warehouses'
const CABINETS_STORAGE_KEY = 'dms_cabinets'
const FOLDERS_STORAGE_KEY = 'dms_folders'

function saveToStorage<T>(key: string, data: T) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch {}
}

function loadFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export function ArchiveProvider({ children }: { children: React.ReactNode }) {
  const { setDocuments, updateDocument } = useDocuments()
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => loadFromStorage<Warehouse>(WAREHOUSES_STORAGE_KEY))
  const [cabinets, setCabinets] = useState<Cabinet[]>(() => loadFromStorage<Cabinet>(CABINETS_STORAGE_KEY))
  const [folders, setFolders] = useState<Folder[]>(() => loadFromStorage<Folder>(FOLDERS_STORAGE_KEY))

  const reloadArchive = useCallback(async () => {
    const token = typeof window !== 'undefined'
      ? sessionStorage.getItem('token') || localStorage.getItem('token')
      : null
    if (!token) return

    // Fetch endpoints independently using Promise.allSettled so a 404 on warehouses
    // (e.g. before backend PR is merged on Render) does not prevent cabinets & folders from loading
    const [whResult, cabResult, folderResult] = await Promise.allSettled([
      warehouseService.fetchWarehouses(),
      archiveService.fetchCabinets(),
      archiveService.fetchFolders(),
    ])

    if (whResult.status === 'fulfilled' && Array.isArray(whResult.value)) {
      setWarehouses(whResult.value)
      saveToStorage(WAREHOUSES_STORAGE_KEY, whResult.value)
    } else if (whResult.status === 'rejected') {
      console.warn('ໂຫຼດຄັງເອກະສານຈາກ server ບໍ່ສຳເລັດ (ໃຊ້ຂໍ້ມູນ cached):', whResult.reason)
    }

    if (cabResult.status === 'fulfilled' && Array.isArray(cabResult.value)) {
      setCabinets(cabResult.value)
      saveToStorage(CABINETS_STORAGE_KEY, cabResult.value)
    }

    if (folderResult.status === 'fulfilled' && Array.isArray(folderResult.value)) {
      setFolders(folderResult.value)
      saveToStorage(FOLDERS_STORAGE_KEY, folderResult.value)
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
    let created: Warehouse
    try {
      created = await warehouseService.createWarehouse(data)
    } catch (err) {
      console.warn('Server createWarehouse failed (using local fallback):', err)
      created = {
        id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: data.name,
        division: data.division,
        description: data.description,
        color: data.color || 'from-indigo-600 to-purple-600',
        createdAt: new Date().toISOString(),
      }
    }
    setWarehouses((prev) => {
      const updated = [created, ...prev.filter((w) => w.id !== created.id)]
      saveToStorage(WAREHOUSES_STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const updateWarehouse = useCallback(async (id: string, data: Partial<{ name: string; division?: string; description?: string; color?: string }>): Promise<void> => {
    try {
      const updated = await warehouseService.updateWarehouse(id, data)
      setWarehouses((prev) => {
        const next = prev.map((w) => (w.id === id ? { ...w, ...updated } : w))
        saveToStorage(WAREHOUSES_STORAGE_KEY, next)
        return next
      })
    } catch (err) {
      console.warn('Server updateWarehouse failed (using local update):', err)
      setWarehouses((prev) => {
        const next = prev.map((w) => (w.id === id ? { ...w, ...data } : w))
        saveToStorage(WAREHOUSES_STORAGE_KEY, next)
        return next
      })
    }
  }, [])

  const deleteWarehouse = useCallback(async (id: string): Promise<void> => {
    try {
      await warehouseService.deleteWarehouse(id)
    } catch (err) {
      console.warn('Server deleteWarehouse failed (removing locally):', err)
    }
    setWarehouses((prev) => {
      const updated = prev.filter((w) => w.id !== id)
      saveToStorage(WAREHOUSES_STORAGE_KEY, updated)
      return updated
    })
    setCabinets((prev) => {
      const updated = prev.filter((c) => c.warehouseId !== id)
      saveToStorage(CABINETS_STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const createCabinet = useCallback(async (data: archiveService.CreateCabinetPayload): Promise<void> => {
    let created: Cabinet
    try {
      created = await archiveService.createCabinet(data)
    } catch (err) {
      console.warn('Server createCabinet failed (using local fallback):', err)
      created = {
        id: `cab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: data.name,
        color: data.color,
        department: data.department,
        description: data.description,
        warehouseId: data.warehouseId || undefined,
        division: data.division || undefined,
        createdAt: new Date().toISOString(),
      }
    }
    setCabinets((prev) => {
      const updated = [created, ...prev.filter((c) => c.id !== created.id)]
      saveToStorage(CABINETS_STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const createFolder = useCallback(async (data: archiveService.CreateFolderPayload): Promise<void> => {
    let created: Folder
    try {
      created = await archiveService.createFolder(data)
    } catch (err) {
      console.warn('Server createFolder failed (using local fallback):', err)
      created = {
        id: `fol-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        cabinetId: data.cabinetId,
        name: data.name,
        description: data.description,
        createdAt: new Date().toISOString(),
      }
    }
    setFolders((prev) => {
      const updated = [created, ...prev.filter((f) => f.id !== created.id)]
      saveToStorage(FOLDERS_STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const deleteCabinet = useCallback(async (id: string): Promise<void> => {
    try {
      await archiveService.deleteCabinet(id)
    } catch (err) {
      console.warn('Server deleteCabinet failed (removing locally):', err)
    }
    setCabinets((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      saveToStorage(CABINETS_STORAGE_KEY, updated)
      return updated
    })
    setFolders((prev) => {
      const updated = prev.filter((f) => f.cabinetId !== id)
      saveToStorage(FOLDERS_STORAGE_KEY, updated)
      return updated
    })
    // Detach documents that lived in this cabinet (soft-unlinked, not deleted)
    setDocuments((prev) => prev.map((d) =>
      d.cabinetId === id
        ? { ...d, cabinetId: undefined, cabinetName: undefined, folderId: undefined, folderName: undefined }
        : d
    ))
  }, [setDocuments])

  const deleteFolder = useCallback(async (id: string): Promise<void> => {
    try {
      await archiveService.deleteFolder(id)
    } catch (err) {
      console.warn('Server deleteFolder failed (removing locally):', err)
    }
    setFolders((prev) => {
      const updated = prev.filter((f) => f.id !== id)
      saveToStorage(FOLDERS_STORAGE_KEY, updated)
      return updated
    })
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
      cabinets,
      folders,
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