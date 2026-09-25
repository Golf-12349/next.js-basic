'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { edlStructure } from '@/types/user'

const STORAGE_KEY = 'dms_master_org_structure'

export interface MasterDataContextValue {
  divisions: string[]
  departmentsByDivision: Record<string, string[]>
  addDivision: (name: string) => { success: boolean; message?: string }
  updateDivision: (oldName: string, newName: string) => { success: boolean; message?: string }
  deleteDivision: (name: string) => { success: boolean; message?: string }
  addDepartment: (division: string, name: string) => { success: boolean; message?: string }
  updateDepartment: (division: string, oldName: string, newName: string) => { success: boolean; message?: string }
  deleteDepartment: (division: string, name: string) => { success: boolean; message?: string }
  getDepartments: (division?: string) => string[]
  resetToDefaults: () => void
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

  // Persist to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(departmentsByDivision))
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(departmentsByDivision))
    } catch {}
  }, [departmentsByDivision])

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
    return { success: true }
  }, [departmentsByDivision])

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
    return { success: true }
  }, [departmentsByDivision])

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
    return { success: true }
  }, [departmentsByDivision])

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
    return { success: true }
  }, [departmentsByDivision])

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
    return { success: true }
  }, [departmentsByDivision])

  const deleteDepartment = useCallback((division: string, name: string) => {
    const trimmedDiv = division.trim()
    const trimmedDept = name.trim()
    if (!trimmedDiv || !trimmedDept) return { success: false, message: 'ຂໍ້ມູນບໍ່ຖືກຕ້ອງ' }

    setDepartmentsByDivision((prev) => ({
      ...prev,
      [trimmedDiv]: (prev[trimmedDiv] || []).filter((d) => d !== trimmedDept),
    }))
    return { success: true }
  }, [])

  const resetToDefaults = useCallback(() => {
    setDepartmentsByDivision(edlStructure)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(edlStructure))
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(edlStructure))
    } catch {}
  }, [])

  const value = useMemo(
    () => ({
      divisions,
      departmentsByDivision,
      addDivision,
      updateDivision,
      deleteDivision,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      getDepartments,
      resetToDefaults,
    }),
    [
      divisions,
      departmentsByDivision,
      addDivision,
      updateDivision,
      deleteDivision,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      getDepartments,
      resetToDefaults,
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
