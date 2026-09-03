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

export type DMSContextType = DocumentsContextValue & UsersContextValue & ArchiveContextValue

/**
 * Combines the three focused providers (documents/categories, archive,cabinet/folder,,,, users):
 *   DocumentsProvider > ArchiveProvider > UsersProvider
 *
 * Granular hooks (`useDocuments`, `useArchive`, `useUsers`) are preferred for new code
 * — they re-render only when their own slice of state changes.

 * `useDMS` is kept as a backward-compatible convenience for consumers that need multiple slices.

 */
export function DMSProvider({ children }: { children: ReactNode }) {
  return (
    <DocumentsProvider>
      <ArchiveProvider>
        <UsersProvider>{children}</UsersProvider>
      </ArchiveProvider>
    </DocumentsProvider>
  )
}

export function useDMS(): DMSContextType {
  const documents = useDocuments()
  const archive = useArchive()
  const users = useUsers()

  return useMemo(
    () => ({ ...documents, ...archive, ...users }) as DMSContextType,
    [documents, archive, users],
  )
}