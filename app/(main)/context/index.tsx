'use client'

import React, { useMemo, type ReactNode } from 'react'
import {
  ArchiveProvider,
  useArchive,
  type ArchiveContextValue,
} from './ArchiveContext'
import {
  DocumentsProvider,
  useDocuments,
  type DocumentsContextValue,
} from './DocumentsContext'
import {
  UsersProvider,
  useUsers,
  type UsersContextValue,
} from './UsersContext'
import {
  NotificationsProvider,
  useNotifications,
  type NotificationsContextValue,
} from './NotificationsContext'
import {
  RealtimeProvider,
  useRealtime,
  type RealtimeContextValue,
} from './RealtimeContext'
import {
  MasterDataProvider,
  useMasterData,
  type MasterDataContextValue,
} from './MasterDataContext'

export type DMSContextType = DocumentsContextValue &
  UsersContextValue &
  ArchiveContextValue &
  NotificationsContextValue &
  RealtimeContextValue &
  MasterDataContextValue

/**
 * Combines the focused providers (documents/categories, archive, users, notifications, realtime, master-data):
 *   RealtimeProvider > MasterDataProvider > DocumentsProvider > ArchiveProvider > UsersProvider > NotificationsProvider
 *
 * Granular hooks (`useDocuments`, `useArchive`, `useUsers`, `useRealtime`, `useMasterData`) are preferred for new code
 * — they re-render only when their own slice of state changes.
 *
 * `useDMS` is kept as a backward-compatible convenience for consumers that need multiple slices.
 */
export function DMSProvider({ children }: { children: ReactNode }) {
  return (
    <RealtimeProvider>
      <MasterDataProvider>
        <DocumentsProvider>
          <ArchiveProvider>
            <UsersProvider>
              <NotificationsProvider>{children}</NotificationsProvider>
            </UsersProvider>
          </ArchiveProvider>
        </DocumentsProvider>
      </MasterDataProvider>
    </RealtimeProvider>
  )
}

export function useDMS(): DMSContextType {
  const documents = useDocuments()
  const archive = useArchive()
  const users = useUsers()
  const notifications = useNotifications()
  const realtime = useRealtime()
  const masterData = useMasterData()

  return useMemo(
    () => ({ ...documents, ...archive, ...users, ...notifications, ...realtime, ...masterData }) as DMSContextType,
    [documents, archive, users, notifications, realtime, masterData],
  )
}

export { useNotifications, useRealtime, RealtimeProvider }
export type { RealtimeContextValue }

export { MasterDataProvider, useMasterData }
export type { MasterDataContextValue }

export { UploadModalProvider, useUploadModal } from './UploadModalContext'

export type { UploadModalContextValue } from './UploadModalContext'