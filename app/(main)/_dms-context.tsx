'use client'

// Backward-compatible entry point. All real state now lives in the focused providers:
//   app/(main)/context/DocumentsContext.tsx  -> useDocuments (documents + categories)
//   app/(main)/context/ArchiveContext.tsx   -> useArchive (cabinets + folders)
//   app/(main)/context/UsersContext.tsx      -> useUsers (users)

export { DMSProvider, useDMS } from './context'
export type { DMSContextType } from './context'
