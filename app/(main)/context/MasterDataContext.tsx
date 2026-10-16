'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { edlStructure } from '@/types/user'
import * as orgService from '@/lib/dms/orgService'
import type { ApiDivision } from '@/lib/dms/orgService'

const STORAGE_KEY = 'dms_master_org_structure'
const POSITIONS_KEY = 'dms_master_positions'
const RETENTION_KEY = 'dms_master_retention'

export interface RetentionPeriod {
  id: string
  name: string
  durationMonths: number
  description?: string
}

export const DEFAULT_RETENTION_PERIODS: RetentionPeriod[] = [
  { id: 'ret-1', name: '6 ເດືອນ', durationMonths: 6, description: 'ເອກະສານຊົ່ວຄາວ, ບັນທຶກປະຈຳວັນ' },
  { id: 'ret-2', name: '1 ປີ', durationMonths: 12, description: 'ເອກະສານປະຈຳປີທົ່ວໄປ' },
  { id: 'ret-3', name: '3 ປີ', durationMonths: 36, description: 'ເອກະສານໂຄງການໄລຍະສັ້ນ' },
  { id: 'ret-4', name: '5 ປີ', durationMonths: 60, description: 'ເອກະສານບັນຊີການເງິນ, ບົດລາຍງານມາດຕະຖານ' },
  { id: 'ret-5', name: '10 ປີ', durationMonths: 120, description: 'ສັນຍາສຳຄັນ, ເອກະສານນິຕິກຳ ແລະ ອົງກອນ' },
  { id: 'ret-6', name: 'ເກັບຮັກສາຖາວອນ', durationMonths: 0, description: 'ເອກະສານປະຫວັດສາດ ແລະ ກົດໝາຍທີ່ບໍ່ມີກຳນົດທຳລາຍ' },
]

export const DEFAULT_POSITIONS: string[] = [
  'ຫົວໜ້າ',
  'ຮອງຫົວໜ້າ',
  'ວິຊາການ',
  'ເລຂາ',
  'ພະນັກງານບັນຊີ',
  'ພະນັກງານທົ່ວໄປ',
]

export interface MasterDataContextValue {
  divisions: string[]
  departmentsByDivision: Record<string, string[]>
  divisionObjects: ApiDivision[]
  addDivision: (name: string) => { success: boolean; message?: string }
  updateDivision: (oldName: string, newName: string) => { success: boolean; message?: string }
  deleteDivision: (name: string) => { success: boolean; message?: string }
  addDepartment: (division: string, name: string) => { success: boolean; message?: string }
  updateDepartment: (division: string, oldName: string, newName: string) => { success: boolean; message?: string }
  deleteDepartment: (division: string, name: string) => { success: boolean; message?: string }
  getDepartments: (division?: string) => string[]
  resetToDefaults: () => void
  reloadFromBackend: () => Promise<void>

  // ── ຕຳແໜ່ງງານ (Positions) ──
  positions: string[]
  addPosition: (name: string) => { success: boolean; message?: string }
  updatePosition: (oldName: string, newName: string) => { success: boolean; message?: string }
  deletePosition: (name: string) => { success: boolean; message?: string }
  resetPositions: () => void

  // ── ອາຍຸການເກັບຮັກສາ (Retention Periods) ──
  retentionPeriods: RetentionPeriod[]
  addRetentionPeriod: (item: Omit<RetentionPeriod, 'id'>) => { success: boolean; message?: string }
  updateRetentionPeriod: (id: string, item: Partial<Omit<RetentionPeriod, 'id'>>) => { success: boolean; message?: string }
  deleteRetentionPeriod: (id: string) => { success: boolean; message?: string }
  resetRetentionPeriods: () => void

}

const MasterDataContext = createContext<MasterDataContextValue | undefined>(undefined)

export function MasterDataProvider({ children }: { children: React.ReactNode }) {
  const [departmentsByDivision, setDepartmentsByDivision] = useState<Record<string, string[]>>(() => {
    if (typeof window === 'undefined') return edlStructure
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0) {
          return parsed
        }
      }
    } catch {}
    return edlStructure
  })

  const [divisionObjects, setDivisionObjects] = useState<ApiDivision[]>([])

  // Persist to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(departmentsByDivision))
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(departmentsByDivision))
    } catch {}
  }, [departmentsByDivision])

  // Sync from backend
  const reloadFromBackend = useCallback(async () => {
    try {
      const data = await orgService.fetchOrgStructure()
      if (data && data.departmentsByDivision && Object.keys(data.departmentsByDivision).length > 0) {
        setDepartmentsByDivision(data.departmentsByDivision)
        setDivisionObjects(data.divisionObjects || [])
      }
    } catch (err) {
      console.warn('Failed to fetch org structure from server, using local fallback:', err)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    orgService
      .fetchOrgStructure()
      .then((data) => {
        if (!cancelled && data && data.departmentsByDivision && Object.keys(data.departmentsByDivision).length > 0) {
          setDepartmentsByDivision(data.departmentsByDivision)
          setDivisionObjects(data.divisionObjects || [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('Failed to fetch org structure from server, using local fallback:', err)
        }
      })

    const onDivisionsChanged = () => {
      void reloadFromBackend()
    }
    window.addEventListener('dms:divisions-changed', onDivisionsChanged)
    return () => {
      cancelled = true
      window.removeEventListener('dms:divisions-changed', onDivisionsChanged)
    }
  }, [reloadFromBackend])

  const divisions = useMemo(() => Object.keys(departmentsByDivision), [departmentsByDivision])

  const getDepartments = useCallback(
    (division?: string): string[] => {
      if (!division || division === 'ທັງໝົດ') {
        const allDepts = new Set<string>()
        Object.values(departmentsByDivision).forEach((list) => {
          list.forEach((d) => allDepts.add(d))
        })
        return Array.from(allDepts)
      }
      return departmentsByDivision[division] || []
    },
    [departmentsByDivision]
  )

  const addDivision = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return { success: false, message: 'ກະລຸນາລະບຸຊື່ຝ່າຍ' }
    if (departmentsByDivision[trimmed]) {
      return { success: false, message: 'ຊື່ຝ່າຍນີ້ມີຢູ່ແລ້ວໃນລະບົບ' }
    }
    setDepartmentsByDivision((prev) => ({
      ...prev,
      [trimmed]: [],
    }))
    void orgService.createDivision(trimmed).then(reloadFromBackend).catch((err) => {
      console.error('Server createDivision failed:', err)
    })
    return { success: true }
  }, [departmentsByDivision, reloadFromBackend])

  const updateDivision = useCallback((oldName: string, newName: string) => {
    const trimmedOld = oldName.trim()
    const trimmedNew = newName.trim()
    if (!trimmedNew) return { success: false, message: 'ກະລຸນາລະບຸຊື່ຝ່າຍໃໝ່' }
    if (trimmedOld !== trimmedNew && departmentsByDivision[trimmedNew]) {
      return { success: false, message: 'ຊື່ຝ່າຍໃໝ່ນີ້ມີຢູ່ແລ້ວໃນລະບົບ' }
    }

    setDepartmentsByDivision((prev) => {
      const copy: Record<string, string[]> = {}
      for (const [key, val] of Object.entries(prev)) {
        if (key === trimmedOld) {
          copy[trimmedNew] = val
        } else {
          copy[key] = val
        }
      }
      return copy
    })

    const targetObj = divisionObjects.find((d) => d.name === trimmedOld)
    if (targetObj) {
      void orgService.updateDivision(targetObj.id, trimmedNew).then(reloadFromBackend).catch((err) => {
        console.error('Server updateDivision failed:', err)
      })
    }
    return { success: true }
  }, [departmentsByDivision, divisionObjects, reloadFromBackend])

  const deleteDivision = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!departmentsByDivision[trimmed]) {
      return { success: false, message: 'ບໍ່ພົບຝ່າຍນີ້' }
    }
    setDepartmentsByDivision((prev) => {
      const copy = { ...prev }
      delete copy[trimmed]
      return copy
    })

    const targetObj = divisionObjects.find((d) => d.name === trimmed)
    if (targetObj) {
      void orgService.deleteDivision(targetObj.id).then(reloadFromBackend).catch((err) => {
        console.error('Server deleteDivision failed:', err)
      })
    }
    return { success: true }
  }, [departmentsByDivision, divisionObjects, reloadFromBackend])

  const addDepartment = useCallback((division: string, name: string) => {
    const trimmedDiv = division.trim()
    const trimmedDept = name.trim()
    if (!trimmedDiv) return { success: false, message: 'ກະລຸນາເລືອກຝ່າຍ' }
    if (!trimmedDept) return { success: false, message: 'ກະລຸນາລະບຸຊື່ພະແນກ' }

    const existing = departmentsByDivision[trimmedDiv] || []
    if (existing.includes(trimmedDept)) {
      return { success: false, message: 'ພະແນກນີ້ມີຢູ່ແລ້ວພາຍໃຕ້ຝ່າຍນີ້' }
    }

    setDepartmentsByDivision((prev) => ({
      ...prev,
      [trimmedDiv]: [...(prev[trimmedDiv] || []), trimmedDept],
    }))

    const divObj = divisionObjects.find((d) => d.name === trimmedDiv)
    if (divObj) {
      void orgService.createDepartment(divObj.id, trimmedDept).then(reloadFromBackend).catch((err) => {
        console.error('Server createDepartment failed:', err)
      })
    }
    return { success: true }
  }, [departmentsByDivision, divisionObjects, reloadFromBackend])

  const updateDepartment = useCallback((division: string, oldName: string, newName: string) => {
    const trimmedDiv = division.trim()
    const trimmedOld = oldName.trim()
    const trimmedNew = newName.trim()
    if (!trimmedDiv || !trimmedNew) return { success: false, message: 'ຂໍ້ມູນບໍ່ຖືກຕ້ອງ' }

    const list = departmentsByDivision[trimmedDiv] || []
    if (trimmedOld !== trimmedNew && list.includes(trimmedNew)) {
      return { success: false, message: 'ພະແນກນີ້ມີຢູ່ແລ້ວໃນຝ່າຍດຽວກັນ' }
    }

    setDepartmentsByDivision((prev) => ({
      ...prev,
      [trimmedDiv]: (prev[trimmedDiv] || []).map((d) => (d === trimmedOld ? trimmedNew : d)),
    }))

    const divObj = divisionObjects.find((d) => d.name === trimmedDiv)
    const deptObj = divObj?.departments.find((d) => d.name === trimmedOld)
    if (deptObj) {
      void orgService.updateDepartment(deptObj.id, trimmedNew, divObj?.id).then(reloadFromBackend).catch((err) => {
        console.error('Server updateDepartment failed:', err)
      })
    }
    return { success: true }
  }, [departmentsByDivision, divisionObjects, reloadFromBackend])

  const deleteDepartment = useCallback((division: string, name: string) => {
    const trimmedDiv = division.trim()
    const trimmedDept = name.trim()
    if (!trimmedDiv || !trimmedDept) return { success: false, message: 'ຂໍ້ມູນບໍ່ຖືກຕ້ອງ' }

    setDepartmentsByDivision((prev) => ({
      ...prev,
      [trimmedDiv]: (prev[trimmedDiv] || []).filter((d) => d !== trimmedDept),
    }))

    const divObj = divisionObjects.find((d) => d.name === trimmedDiv)
    const deptObj = divObj?.departments.find((d) => d.name === trimmedDept)
    if (deptObj) {
      void orgService.deleteDepartment(deptObj.id).then(reloadFromBackend).catch((err) => {
        console.error('Server deleteDepartment failed:', err)
      })
    }
    return { success: true }
  }, [divisionObjects, reloadFromBackend])

  const resetToDefaults = useCallback(() => {
    setDepartmentsByDivision(edlStructure)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(edlStructure))
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(edlStructure))
    } catch {}
  }, [])

  // ── ຕຳແໜ່ງງານ (Positions) State & Actions ─────────────────────────
  const [positions, setPositions] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_POSITIONS
    try {
      const stored = localStorage.getItem(POSITIONS_KEY) || sessionStorage.getItem(POSITIONS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return DEFAULT_POSITIONS
  })

  useEffect(() => {
    try {
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions))
      sessionStorage.setItem(POSITIONS_KEY, JSON.stringify(positions))
    } catch {}
  }, [positions])

  const addPosition = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return { success: false, message: 'ກະລຸນາປ້ອນຊື່ຕຳແໜ່ງ' }
    if (positions.includes(trimmed)) return { success: false, message: 'ຕຳແໜ່ງນີ້ມີຢູ່ແລ້ວ' }
    setPositions((prev) => [...prev, trimmed])
    return { success: true }
  }, [positions])

  const updatePosition = useCallback((oldName: string, newName: string) => {
    const trimmedOld = oldName.trim()
    const trimmedNew = newName.trim()
    if (!trimmedNew) return { success: false, message: 'ກະລຸນາປ້ອນຊື່ຕຳແໜ່ງໃໝ່' }
    if (trimmedOld !== trimmedNew && positions.includes(trimmedNew)) {
      return { success: false, message: 'ຊື່ຕຳແໜ່ງນີ້ມີຢູ່ແລ້ວ' }
    }
    setPositions((prev) => prev.map((p) => (p === trimmedOld ? trimmedNew : p)))
    return { success: true }
  }, [positions])

  const deletePosition = useCallback((name: string) => {
    setPositions((prev) => prev.filter((p) => p !== name.trim()))
    return { success: true }
  }, [])

  const resetPositions = useCallback(() => {
    setPositions(DEFAULT_POSITIONS)
  }, [])

  // ── ອາຍຸການເກັບຮັກສາ (Retention Periods) State & Actions ─────────
  const [retentionPeriods, setRetentionPeriods] = useState<RetentionPeriod[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_RETENTION_PERIODS
    try {
      const stored = localStorage.getItem(RETENTION_KEY) || sessionStorage.getItem(RETENTION_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return DEFAULT_RETENTION_PERIODS
  })

  useEffect(() => {
    try {
      localStorage.setItem(RETENTION_KEY, JSON.stringify(retentionPeriods))
      sessionStorage.setItem(RETENTION_KEY, JSON.stringify(retentionPeriods))
    } catch {}
  }, [retentionPeriods])

  const addRetentionPeriod = useCallback((item: Omit<RetentionPeriod, 'id'>) => {
    const trimmed = item.name.trim()
    if (!trimmed) return { success: false, message: 'ກະລຸນາປ້ອນຊື່ໄລຍະເວລາ' }
    const newItem: RetentionPeriod = {
      id: `ret-${Date.now()}`,
      name: trimmed,
      durationMonths: Number(item.durationMonths) || 0,
      description: item.description?.trim(),
    }
    setRetentionPeriods((prev) => [...prev, newItem])
    return { success: true }
  }, [])

  const updateRetentionPeriod = useCallback((id: string, patch: Partial<Omit<RetentionPeriod, 'id'>>) => {
    setRetentionPeriods((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        return {
          ...r,
          ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
          ...(patch.durationMonths !== undefined ? { durationMonths: Number(patch.durationMonths) } : {}),
          ...(patch.description !== undefined ? { description: patch.description.trim() } : {}),
        }
      })
    )
    return { success: true }
  }, [])

  const deleteRetentionPeriod = useCallback((id: string) => {
    setRetentionPeriods((prev) => prev.filter((r) => r.id !== id))
    return { success: true }
  }, [])

  const resetRetentionPeriods = useCallback(() => {
    setRetentionPeriods(DEFAULT_RETENTION_PERIODS)
  }, [])

  const value = useMemo(
    () => ({
      divisions,
      departmentsByDivision,
      divisionObjects,
      addDivision,
      updateDivision,
      deleteDivision,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      getDepartments,
      resetToDefaults,
      reloadFromBackend,

      // Positions
      positions,
      addPosition,
      updatePosition,
      deletePosition,
      resetPositions,

      // Retention Periods
      retentionPeriods,
      addRetentionPeriod,
      updateRetentionPeriod,
      deleteRetentionPeriod,
      resetRetentionPeriods,
    }),
    [
      divisions,
      departmentsByDivision,
      divisionObjects,
      addDivision,
      updateDivision,
      deleteDivision,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      getDepartments,
      resetToDefaults,
      reloadFromBackend,
      positions,
      addPosition,
      updatePosition,
      deletePosition,
      resetPositions,
      retentionPeriods,
      addRetentionPeriod,
      updateRetentionPeriod,
      deleteRetentionPeriod,
      resetRetentionPeriods,
    ]
  )

  return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>
}

export function useMasterData(): MasterDataContextValue {
  const ctx = useContext(MasterDataContext)
  if (!ctx) {
    throw new Error('useMasterData must be used within a MasterDataProvider')
  }
  return ctx
}
