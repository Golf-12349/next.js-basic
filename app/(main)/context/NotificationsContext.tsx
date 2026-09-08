'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as notificationService from '@/lib/dms/notificationService'
import type { ApiNotification } from '@/lib/dms/types'

export interface NotificationsContextValue {
  notifications: ApiNotification[]
  unreadCount: number
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<ApiNotification[]>([])

  const reloadNotifications = useCallback(async () => {
    const token = typeof window !== 'undefined'
      ? sessionStorage.getItem('token') || localStorage.getItem('token')
      : null
    if (!token) return
    try {
      const serverNotifications = await notificationService.fetchNotifications()
      setNotifications(serverNotifications)
    } catch (err) {
      console.warn('ໂຫຼດການແຈ້ງເຕືອນບໍ່ໄດ້:', err)
    }
  }, [])

  useEffect(() => {
    void reloadNotifications()
  }, [reloadNotifications])

  // Real-time synchronization: reload notifications whenever backend broadcasts a change
  useEffect(() => {
    const handleNotifsChanged = () => {
      void reloadNotifications()
    }
    window.addEventListener('dms:notifications-changed', handleNotifsChanged)
    return () => {
      window.removeEventListener('dms:notifications-changed', handleNotifsChanged)
    }
  }, [reloadNotifications])

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    try {
      await notificationService.markNotificationRead(id)
    } catch (err) {
      console.warn('ບໍ່ສາມາດອັບເດດການແຈ້ງເຕືອນວ່າອ່ານແລ້ວ:', err)
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await notificationService.markAllNotificationsRead()
    } catch (err) {
      console.warn('ບໍ່ສາມາດອັບເດດການແຈ້ງເຕືອນທັງໝົດວ່າອ່ານແລ້ວ:', err)
    }
  }, [])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const value = useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead }),
    [notifications, unreadCount, markRead, markAllRead],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
