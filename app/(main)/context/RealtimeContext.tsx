'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export interface RealtimeContextValue {
  isConnected: boolean
  lastEventTimestamp: string | null
}

const RealtimeContext = createContext<RealtimeContextValue>({
  isConnected: false,
  lastEventTimestamp: null,
})

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEventTimestamp, setLastEventTimestamp] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let eventSource: EventSource | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    let retryDelay = 3000
    let isDisposed = false

    function hasAuthToken(): boolean {
      try {
        return !!(sessionStorage.getItem('token') || localStorage.getItem('token'))
      } catch {
        return false
      }
    }

    function cleanupCurrentConnection() {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    }

    function scheduleReconnect() {
      if (isDisposed || reconnectTimeout) return
      // If the tab is hidden (user on another tab), do not spam reconnect attempts
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return
      }

      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null
        retryDelay = Math.min(retryDelay * 1.5, 30000)
        connect()
      }, retryDelay)
    }

    function connect() {
      if (isDisposed) return
      if (!hasAuthToken()) return // Do not connect if not authenticated

      cleanupCurrentConnection()

      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/+$/, '')
        const sseUrl = `${apiBase}/events`

        eventSource = new EventSource(sseUrl)

        eventSource.onopen = () => {
          setIsConnected(true)
          retryDelay = 3000 // Reset backoff on successful connection
        }

        eventSource.onmessage = (event) => {
          try {
            if (!event.data) return
            const payload = JSON.parse(event.data)
            if (payload.type === 'PING') return

            setLastEventTimestamp(payload.timestamp ?? new Date().toISOString())

            // Global realtime broadcast
            window.dispatchEvent(new CustomEvent('dms:realtime-event', { detail: payload }))

            // Topic-specific custom events
            switch (payload.type) {
              case 'DOCUMENTS_CHANGED':
                window.dispatchEvent(new CustomEvent('dms:documents-changed', { detail: payload.payload }))
                break
              case 'NOTIFICATIONS_CHANGED':
                window.dispatchEvent(new CustomEvent('dms:notifications-changed', { detail: payload.payload }))
                break
              case 'CATEGORIES_CHANGED':
                window.dispatchEvent(new CustomEvent('dms:categories-changed', { detail: payload.payload }))
                break
              case 'USERS_CHANGED':
                window.dispatchEvent(new CustomEvent('dms:users-changed', { detail: payload.payload }))
                break
              case 'ARCHIVE_CHANGED':
                window.dispatchEvent(new CustomEvent('dms:archive-changed', { detail: payload.payload }))
                break
              case 'DIVISIONS_CHANGED':
                window.dispatchEvent(new CustomEvent('dms:divisions-changed', { detail: payload.payload }))
                break
              case 'SETTINGS_CHANGED':
                window.dispatchEvent(new CustomEvent('dms:settings-changed', { detail: payload.payload }))
                break
              default:
                break
            }
          } catch (err) {
            console.debug('Failed to parse SSE event data:', err)
          }
        }

        eventSource.onerror = () => {
          setIsConnected(false)
          cleanupCurrentConnection()
          scheduleReconnect()
        }
      } catch (err) {
        console.warn('Error creating EventSource:', err)
        cleanupCurrentConnection()
        scheduleReconnect()
      }
    }

    connect()

    // Handle user switching tabs: reconnect cleanly when returning if disconnected
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
          retryDelay = 3000
          connect()
        }
      }
    }

    const handleOnline = () => {
      retryDelay = 3000
      connect()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)

    return () => {
      isDisposed = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      cleanupCurrentConnection()
    }
  }, [])

  const value = useMemo(
    () => ({ isConnected, lastEventTimestamp }),
    [isConnected, lastEventTimestamp],
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  return useContext(RealtimeContext)
}

