'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@/types/user'
import * as userService from '@/lib/dms/userService'
import { toFrontendUser } from '@/lib/dms/types'

export interface UsersContextValue {
  users: User[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  addUser: (user: Omit<User, 'id' | 'joinDate' | 'lastActive'>) => Promise<User & { temporaryPassword?: string }>
  updateUser: (id: string, patch: Partial<User>) => Promise<void>
  removeUser: (id: string) => Promise<void>
  toggleUserStatus: (id: string) => Promise<void>
}

const UsersContext = createContext<UsersContextValue | undefined>(undefined)

const USERS_STORAGE_KEY = 'dms_users'

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY) || sessionStorage.getItem(USERS_STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return []
  })

  // Persist users across page refreshes
  useEffect(() => {
    try {
      if (users.length > 0) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
        sessionStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
      }
    } catch {}
  }, [users])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const token = typeof window !== 'undefined'
        ? sessionStorage.getItem('token') || localStorage.getItem('token')
        : null
      if (!token) return
      try {
        const serverUsers = await userService.fetchUsers()
        if (!cancelled && serverUsers.length > 0) {
          setUsers(serverUsers.map(toFrontendUser))
        }
      } catch (err) {
        console.warn('ໂຫຼດລາຍຊື່ຜູ້ໃຊ້ບໍ່ໄດ້ (ອາດຈະບໍ່ມີສິດ):', err)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const addUser = useCallback(
    async (user: Omit<User, 'id' | 'joinDate' | 'lastActive'>): Promise<User & { temporaryPassword?: string }> => {
      const payload: userService.CreateUserPayload = {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        status: user.status,
      }
      if (user.division) payload.division = user.division
      if (user.avatarUrl) payload.avatarUrl = user.avatarUrl
      if (user.password) payload.password = user.password

      let createdUser: User & { temporaryPassword?: string }

      try {
        const created = await userService.createUser(payload)
        const newUser = toFrontendUser(created)
        createdUser = {
          ...newUser,
          division: user.division || newUser.division,
          avatarUrl: user.avatarUrl || newUser.avatarUrl,
          temporaryPassword: created.temporaryPassword,
        }
      } catch (err) {
        console.warn('Backend createUser error, persisting locally:', err)
        const now = new Date().toISOString()
        const fallbackId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const tempPwd = user.password || `Edl#${Math.random().toString(36).slice(2, 8).toUpperCase()}`
        createdUser = {
          id: fallbackId,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          department: user.department,
          status: user.status,
          division: user.division,
          avatarUrl: user.avatarUrl,
          joinDate: now.slice(0, 10),
          lastActive: now.slice(0, 10),
          temporaryPassword: tempPwd,
        }
      }

      setUsers((prev) => [createdUser, ...prev])
      return createdUser
    },
    [],
  )

  const updateUser = useCallback(async (id: string, patch: Partial<User>): Promise<void> => {
    // ສົ່ງໄປ backend ສະເພາະ field ທີ່ PATCH /users/:id ຮັບຈິງ — email ບໍ່ມີ column ຢູ່ backend
    // ຈຶ່ງບໍ່ສົ່ງ (ສົ່ງໄປຈະໂດນ 400) ຄົງໄວ້ local ຢ່າງດຽວ, ສ່ວນ name/role/phone/department/division/avatarUrl/status ສົ່ງໄດ້ປົກກະຕິ
    const backendPatch: Record<string, unknown> = {}
    if (patch.name !== undefined) backendPatch.name = patch.name
    if (patch.role !== undefined) backendPatch.role = patch.role
    if (patch.phone !== undefined) backendPatch.phone = patch.phone
    if (patch.department !== undefined) backendPatch.department = patch.department
    if (patch.division !== undefined) backendPatch.division = patch.division
    if (patch.avatarUrl !== undefined) backendPatch.avatarUrl = patch.avatarUrl
    if (patch.status !== undefined) backendPatch.status = patch.status

    if (Object.keys(backendPatch).length > 0) {
      try {
        await userService.updateUser(id, backendPatch)
      } catch (err) {
        console.warn('Backend updateUser error, updating locally:', err)
      }
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))

    // ຖ້າແກ້ບັນຊີຕົນເອງຜ່ານໜ້າ "ຈັດການຜູ້ໃຊ້ງານ" (ບໍ່ແມ່ນຜ່ານໜ້າ Settings) ໃຫ້ sync
    // sessionStorage['data'] + ແຈ້ງ DashboardLayout ດ້ວຍ ບໍ່ຄືແບບເກົ່າທີ່ Sidebar/Header ບໍ່ອັບເດດຈົນກວ່າຈະ login ໃໝ່
    try {
      const stored = sessionStorage.getItem('data')
      if (stored) {
        const parsed = JSON.parse(stored) as { id?: string }
        if (parsed.id === id) {
          sessionStorage.setItem('data', JSON.stringify({ ...parsed, ...patch }))
          window.dispatchEvent(new Event('dms:user-profile-updated'))
        }
      }
    } catch {
      // sessionStorage unavailable — ignore
    }
  }, [])

  const removeUser = useCallback(async (id: string): Promise<void> => {
    try {
      await userService.deleteUser(id)
    } catch (err) {
      console.warn('Backend deleteUser error, updating locally:', err)
    }
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const toggleUserStatus = useCallback(async (id: string): Promise<void> => {
    const target = users.find((u) => u.id === id)
    if (!target) return
    const status = target.status === 'active' ? 'inactive' : 'active'
    try {
      await userService.setUserStatus(id, status)
    } catch (err) {
      console.warn('Backend setUserStatus error, updating locally:', err)
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
  }, [users])

  const value = useMemo<UsersContextValue>(
    () => ({ users, setUsers, addUser, updateUser, removeUser, toggleUserStatus }),
    [users, setUsers, addUser, updateUser, removeUser, toggleUserStatus],
  )

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
}

export function useUsers() {
  const ctx = useContext(UsersContext)
  if (!ctx) throw new Error('useUsers must be used within UsersProvider')
  return ctx
}