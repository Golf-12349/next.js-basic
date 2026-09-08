'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authService from '@/lib/dms/authService'
import type { CurrentUser } from '@/types/user'
import { normalizeCurrentUser } from '@/types/user'

const DATA_KEY = 'data'

export type ProfileUpdateResult = {
  ok: boolean
  user: CurrentUser | null
  error?: string
}

export interface CurrentUserContextValue {
  /** ຂໍ້ມູນຜູ້ໃຊ້ງານທີ່ເຂົ້າລະບົບ — Single Source of Truth ທີ່ Sidebar / Header / Settings ໃຊ້ຮ່ວມກັນ */
  user: CurrentUser | null
  /** ກຳລັງດຶງ /auth/me ຢູ່ */
  loading: boolean
  /** ຂໍ້ຜິດພາດຫຼ້າສຸດ (ຖ້າມີ) */
  error: string | null
  /** ດຶງຂໍ້ມູນໃໝ່ ຈາກ backend ແລ້ວ ອັບເດດ state + storage */
  refreshUser: () => Promise<void>
  /** ບັນທຶກໂປຣໄຟລ໌: ອັບເດດ backend + state + storage — Sidebar/Header ປ່ຽນທັນທີ ບໍ່ຕ່ອງ refresh */
  updateProfile: (patch: Partial<CurrentUser>) => Promise<ProfileUpdateResult>
  /** ຕັງ state ຈາກ login (persist ລົງ storage ອັດຕະໂນມັດ) */
  setCurrentUser: (user: CurrentUser | null) => void
  /** ເມື່ອ logout — ລຶບ state ແລ ະ storage */
  clearUser: () => void
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined)

function readStoredUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = sessionStorage.getItem(DATA_KEY) || localStorage.getItem(DATA_KEY)
    if (!stored) return null
    return normalizeCurrentUser(typeof stored === 'string' ? JSON.parse(stored) : stored)
  } catch {
    return null
  }
}

function persistUser(user: CurrentUser | null) {
  if (typeof window === 'undefined') return
  try {
    if (user) {
      const raw = JSON.stringify(user)
      sessionStorage.setItem(DATA_KEY, raw)
      localStorage.setItem(DATA_KEY, raw)
    } else {
      sessionStorage.removeItem(DATA_KEY)
      localStorage.removeItem(DATA_KEY)
    }
  } catch {
    // storage ບໍ່ສາມາດໃຊ້ງານ — ບໍ່ກັງວອນ
  }
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<CurrentUser | null>(() => readStoredUser())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setCurrentUser = useCallback((next: CurrentUser | null) => {
    setUserState(next)
    persistUser(next)
  }, [])

  const clearUser = useCallback(() => {
    setUserState(null)
    persistUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fresh = await authService.fetchMe()
      // ຖ້າ backend ບໍ່ມີ /auth/me ຫຼື /users/me — ຮັກ cache ເກ່່າໄວ້ (ບໍ່ລຶບ)
      if (fresh !== null) setCurrentUser(fresh)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ບໍ່ສາມາດດຶງຂໍ້ມູນໂປຣໄຟລ໌')
    } finally {
      setLoading(false)
    }
  }, [setCurrentUser])

  // ເມື່ອ mount — ດຶງ profile ທີ່ຖືກ ຈາກ backend ເພື່ອບໍ່ໃຊ້ data ເກົ່າ
  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('token') || localStorage.getItem('token')
        : null
    if (!token) return
    let cancelled = false
    const bootstrap = async () => {
      // defer past an await so setState is not synchronous within the effect
      await Promise.resolve()
      if (!cancelled) await refreshUser()
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [refreshUser])

  // ຊິນຄົບກັບ storage ເມື່ອເກີດການປ່ຽນແປງ (tab ອື່ນ / ກົງຕຸ ລະບົບ)
  useEffect(() => {
    function sync() {
      setUserState(readStoredUser())
    }
    const handleRemoteUserChange = (e: Event) => {
      const custom = e as CustomEvent<{ action?: string; userId?: string }>
      if (custom.detail?.userId && user?.id && custom.detail.userId === user.id) {
        void refreshUser()
      }
    }
    window.addEventListener('storage', sync)
    window.addEventListener('dms:user-profile-updated', sync)
    window.addEventListener('dms:users-changed', handleRemoteUserChange)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('dms:user-profile-updated', sync)
      window.removeEventListener('dms:users-changed', handleRemoteUserChange)
    }
  }, [user?.id, refreshUser])

  const updateProfile = useCallback(
    async (patch: Partial<CurrentUser>) => {
      const prev = user
      setError(null)
      // Optimistic — Sidebar/Header ອັບເດດ ທັນທ ີ ບໍ່ຕ້ອງລໍຖ່າ backend
      const optimistic = normalizeCurrentUser({ ...(prev ?? {}), ...patch })
      if (optimistic) setCurrentUser(optimistic)
      try {
        const result = await authService.updateMyProfile(patch, prev?.id)
        if (result.user) {
          setCurrentUser(result.user)
          return { ok: result.persisted, user: result.user, error: result.error }
        }
        if (result.persisted) {
          return { ok: true, user: optimistic, error: result.error }
        }
        return { ok: false, user: optimistic, error: result.error ?? 'ບັນທຶກບໍ່ສຳເລັດ' }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ບັນທຶກບໍ່ສຳເລັດ'
        setError(message)
        return { ok: false, user: optimistic, error: message }
      }
    },
    [user, setCurrentUser],
  )

  const value = useMemo<CurrentUserContextValue>(
    () => ({ user, loading, error, refreshUser, updateProfile, setCurrentUser, clearUser }),
    [user, loading, error, refreshUser, updateProfile, setCurrentUser, clearUser],
  )

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext)
  if (!ctx) throw new Error('useCurrentUser must be used within CurrentUserProvider')
  return ctx
}