'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Cabinet, Folder, Shelf, Warehouse } from '@/types/document'
import * as archiveService from '@/lib/dms/archiveService'
import * as warehouseService from '@/lib/dms/warehouseService'
import { useDocuments } from './DocumentsContext'

export interface ArchiveContextValue {
  warehouses: Warehouse[]
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>
  cabinets: Cabinet[]
  setCabinets: React.Dispatch<React.SetStateAction<Cabinet[]>>
  shelves: Shelf[]
  setShelves: React.Dispatch<React.SetStateAction<Shelf[]>>
  folders: Folder[]
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>
  createWarehouse: (data: { name: string; division?: string; description?: string; color?: string }) => Promise<void>
  updateWarehouse: (id: string, data: Partial<{ name: string; division?: string; description?: string; color?: string }>) => Promise<void>
  deleteWarehouse: (id: string) => Promise<void>
  createCabinet: (data: archiveService.CreateCabinetPayload) => Promise<void>
  createShelf: (data: archiveService.CreateShelfPayload) => Promise<void>
  createFolder: (data: archiveService.CreateFolderPayload) => Promise<void>
  deleteCabinet: (id: string) => Promise<void>
  deleteShelf: (id: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  assignDocument: (docId: string, cabinetId: string, folderId: string, warehouseId?: string, shelfId?: string) => Promise<void>
}

const ArchiveContext = createContext<ArchiveContextValue | undefined>(undefined)

const WAREHOUSES_STORAGE_KEY = 'dms_warehouses'
const CABINETS_STORAGE_KEY = 'dms_cabinets'
const SHELVES_STORAGE_KEY = 'dms_shelves'
const FOLDERS_STORAGE_KEY = 'dms_folders'

export const DEFAULT_WAREHOUSES: Warehouse[] = [
  {
    id: 'default-warehouse',
    name: 'ຄັງເອກະສານສູນກາງ',
    description: 'ຄັງເອກະສານລວມສຳລັບຕູ້ເອກະສານທົ່ວໄປ',
    color: 'from-indigo-600 to-purple-600',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

function saveToStorage<T>(key: string, data: T) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch {}
}

function loadFromStorage<T>(key: string, fallback: T[] = []): T[] {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return fallback
}

export function ArchiveProvider({ children }: { children: React.ReactNode }) {
  const { setDocuments, updateDocument } = useDocuments()
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => loadFromStorage<Warehouse>(WAREHOUSES_STORAGE_KEY, DEFAULT_WAREHOUSES))
  const [cabinets, setCabinets] = useState<Cabinet[]>(() => loadFromStorage<Cabinet>(CABINETS_STORAGE_KEY))
  const [shelves, setShelves] = useState<Shelf[]>(() => loadFromStorage<Shelf>(SHELVES_STORAGE_KEY))
  const [folders, setFolders] = useState<Folder[]>(() => loadFromStorage<Folder>(FOLDERS_STORAGE_KEY))

  const reloadArchive = useCallback(async () => {
    const token = typeof window !== 'undefined'
      ? sessionStorage.getItem('token') || localStorage.getItem('token')
      : null
    if (!token) return

    const [whResult, cabResult, shelfResult, folderResult] = await Promise.allSettled([
      warehouseService.fetchWarehouses(),
      archiveService.fetchCabinets(),
      archiveService.fetchShelves(),
      archiveService.fetchFolders(),
    ])

    if (whResult.status === 'fulfilled' && Array.isArray(whResult.value)) {
      setWarehouses(whResult.value)
      saveToStorage(WAREHOUSES_STORAGE_KEY, whResult.value)
    } else if (whResult.status === 'rejected') {
      console.warn('ໂຫຼດຄັງເອກະສານຈາກ server ບໍ່ສຳເລັດ (ໃຊ້ຂໍ້ມູນ cached):', whResult.reason)
    }

    if (cabResult.status === 'fulfilled' && Array.isArray(cabResult.value)) {
      setCabinets((prev) => {
        const serverIds = new Set(cabResult.value.map((c: Cabinet) => c.id))
        const localOnly = prev.filter((c) => !serverIds.has(c.id) && c.id.startsWith('cab-'))
        const merged = [...cabResult.value, ...localOnly]
        saveToStorage(CABINETS_STORAGE_KEY, merged)
        return merged
      })
    }

    if (shelfResult.status === 'fulfilled' && Array.isArray(shelfResult.value)) {
      setShelves((prev) => {
        const serverIds = new Set(shelfResult.value.map((s: Shelf) => s.id))
        const localOnly = prev.filter((s) => !serverIds.has(s.id) && s.id.startsWith('shelf-'))
        const merged = [...shelfResult.value, ...localOnly]
        saveToStorage(SHELVES_STORAGE_KEY, merged)
        return merged
      })
    }

    if (folderResult.status === 'fulfilled' && Array.isArray(folderResult.value)) {
      setFolders((prev) => {
        const serverIds = new Set(folderResult.value.map((f: Folder) => f.id))
        const localOnly = prev.filter((f) => !serverIds.has(f.id) && f.id.startsWith('fol-'))
        const merged = [...folderResult.value, ...localOnly]
        saveToStorage(FOLDERS_STORAGE_KEY, merged)
        return merged
      })
    }
  }, [])

  useEffect(() => {
    void reloadArchive()
  }, [reloadArchive])

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
        const next = prev.map((w) => (w.id === id ? updated : w))
        saveToStorage(WAREHOUSES_STORAGE_KEY, next)
        return next
      })
    } catch (err) {
      console.warn('Server updateWarehouse failed (updating locally):', err)
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
    setDocuments((prev) => prev.map((d) =>
      d.warehouseId === id
        ? { ...d, warehouseId: undefined, warehouseName: undefined }
        : d
    ))
  }, [setDocuments])

  const createCabinet = useCallback(async (data: archiveService.CreateCabinetPayload): Promise<void> => {
    let created: Cabinet
    try {
      created = await archiveService.createCabinet(data)
    } catch (err) {
      console.warn('Server createCabinet failed (using local fallback):', err)
      created = {
        id: `cab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        warehouseId: data.warehouseId || null,
        name: data.name,
        color: data.color,
        division: data.division,
        department: data.department,
        description: data.description,
        createdAt: new Date().toISOString(),
      }
    }
    setCabinets((prev) => {
      const updated = [created, ...prev.filter((c) => c.id !== created.id)]
      saveToStorage(CABINETS_STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const createShelf = useCallback(async (data: archiveService.CreateShelfPayload): Promise<void> => {
    let created: Shelf
    try {
      created = await archiveService.createShelf(data)
    } catch (err) {
      console.warn('Server createShelf failed (using local fallback):', err)
      created = {
        id: `shelf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        cabinetId: data.cabinetId,
        name: data.name,
        description: data.description,
        createdAt: new Date().toISOString(),
      }
    }
    setShelves((prev) => {
      const updated = [created, ...prev.filter((s) => s.id !== created.id)]
      saveToStorage(SHELVES_STORAGE_KEY, updated)
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
        shelfId: data.shelfId || null,
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
    setShelves((prev) => {
      const updated = prev.filter((s) => s.cabinetId !== id)
      saveToStorage(SHELVES_STORAGE_KEY, updated)
      return updated
    })
    setFolders((prev) => {
      const updated = prev.filter((f) => f.cabinetId !== id)
      saveToStorage(FOLDERS_STORAGE_KEY, updated)
      return updated
    })
    setDocuments((prev) => prev.map((d) =>
      d.cabinetId === id
        ? { ...d, cabinetId: undefined, cabinetName: undefined, shelfId: undefined, shelfName: undefined, folderId: undefined, folderName: undefined }
        : d
    ))
  }, [setDocuments])

  const deleteShelf = useCallback(async (id: string): Promise<void> => {
    try {
      await archiveService.deleteShelf(id)
    } catch (err) {
      console.warn('Server deleteShelf failed (removing locally):', err)
    }
    setShelves((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      saveToStorage(SHELVES_STORAGE_KEY, updated)
      return updated
    })
    setFolders((prev) => {
      const updated = prev.filter((f) => f.shelfId !== id)
      saveToStorage(FOLDERS_STORAGE_KEY, updated)
      return updated
    })
    setDocuments((prev) => prev.map((d) =>
      d.shelfId === id
        ? { ...d, shelfId: undefined, shelfName: undefined, folderId: undefined, folderName: undefined }
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

  const assignDocument = useCallback(async (docId: string, cabinetId: string, folderId: string, warehouseId?: string, shelfId?: string): Promise<void> => {
    const folder = folders.find((f) => f.id === folderId)
    const effectiveShelfId = shelfId || folder?.shelfId || undefined
    const shelf = effectiveShelfId ? shelves.find((s) => s.id === effectiveShelfId) : undefined
    const effectiveCabinetId = cabinetId || folder?.cabinetId || shelf?.cabinetId || ''
    const cabinet = cabinets.find((c) => c.id === effectiveCabinetId)
    const effectiveWarehouseId = warehouseId || cabinet?.warehouseId || undefined
    const warehouse = effectiveWarehouseId ? warehouses.find((w) => w.id === effectiveWarehouseId) : undefined

    await updateDocument(docId, {
      warehouseId: effectiveWarehouseId,
      warehouseName: warehouse?.name,
      cabinetId: effectiveCabinetId,
      cabinetName: cabinet?.name,
      shelfId: effectiveShelfId,
      shelfName: shelf?.name,
      folderId,
      folderName: folder?.name,
    })
  }, [cabinets, shelves, folders, warehouses, updateDocument])

  const value = useMemo<ArchiveContextValue>(
    () => ({
      warehouses,
      setWarehouses,
      cabinets,
      setCabinets,
      shelves,
      setShelves,
      folders,
      setFolders,
      createWarehouse,
      updateWarehouse,
      deleteWarehouse,
      createCabinet,
      createShelf,
      createFolder,
      deleteCabinet,
      deleteShelf,
      deleteFolder,
      assignDocument,
    }),
    [
      warehouses,
      cabinets,
      shelves,
      folders,
      createWarehouse,
      updateWarehouse,
      deleteWarehouse,
      createCabinet,
      createShelf,
      createFolder,
      deleteCabinet,
      deleteShelf,
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