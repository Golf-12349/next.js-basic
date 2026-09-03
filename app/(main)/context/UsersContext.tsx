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

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('token')) return
      try {
        const serverUsers = await userService.fetchUsers()
        if (!cancelled) setUsers(serverUsers.map(toFrontendUser))
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
      const created = await userService.createUser(payload)
      const newUser = toFrontendUser(created)
      setUsers((prev) => [newUser, ...prev])
      return {
        ...newUser,
        division: user.division || newUser.division,
        avatarUrl: user.avatarUrl || newUser.avatarUrl,
        temporaryPassword: created.temporaryPassword,
      }
    },
    [],
  )

  const updateUser = useCallback(async (id: string, patch: Partial<User>): Promise<void> => {
    const { joinDate: _joinDate, lastActive: _lastActive, password: _password, ...rest } = patch
    void _joinDate
    void _lastActive
    void _password
    await userService.updateUser(id, rest)
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const removeUser = useCallback(async (id: string): Promise<void> => {
    await userService.deleteUser(id)
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const toggleUserStatus = useCallback(async (id: string): Promise<void> => {
    const target = users.find((u) => u.id === id)
    if (!target) return
    const status = target.status === 'active' ? 'inactive' : 'active'
    await userService.setUserStatus(id, status)
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