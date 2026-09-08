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
    let retryDelay = 2000
    let isDisposed = false

    function connect() {
      if (isDisposed) return

      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/+$/, '')
        const sseUrl = `${apiBase}/events`

        eventSource = new EventSource(sseUrl)

        eventSource.onopen = () => {
          setIsConnected(true)
          retryDelay = 2000 // Reset backoff on successful connection
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
              default:
                break
            }
          } catch (err) {
            console.debug('Failed to parse SSE event data:', err)
          }
        }

        eventSource.onerror = () => {
          setIsConnected(false)
          if (eventSource) {
            eventSource.close()
            eventSource = null
          }
          if (!isDisposed) {
            // Exponential backoff reconnect: 2s, 4s, 8s, up to 30s
            reconnectTimeout = setTimeout(() => {
              retryDelay = Math.min(retryDelay * 1.5, 30000)
              connect()
            }, retryDelay)
          }
        }
      } catch (err) {
        console.warn('Error creating EventSource:', err)
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connect, 5000)
        }
      }
    }

    connect()

    return () => {
      isDisposed = true
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
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

