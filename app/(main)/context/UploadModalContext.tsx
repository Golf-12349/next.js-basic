'use client'

import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import UploadDocumentModal from '@/app/components/documents/UploadDocumentModal'

export interface UploadInitialLocation {
  cabinetId?: string
  shelfId?: string
  folderId?: string
}

export interface UploadModalContextValue {
  /** ສະຖານະປະຈຸບັນຂອງ modal ອັບໂຫຼດ (ຖືກເປີດ ຫຼື ບໍ່) */
  uploadOpen: boolean
  /** ເປີດ modal ອັບໂຫຼດ — ເອີ້ນຈາກທຸກບ່ອນໃນລະບົບ (Sidebar, Dashboard, ເອກກະສານ, ຄັງເກັບ...) */
  openUpload: (initialLocation?: UploadInitialLocation | unknown) => void
  /** ປິດ modal ອັບໂຫຼດ */
  closeUpload: () => void
}

const UploadModalContext = createContext<UploadModalContextValue | undefined>(undefined)

/**
 * Global-ກັບ modal ອັບໂຫຼດເອກະສານດົ:
 * ຖືກ mount ຄັງຂັຕົ້ ຢູ່ທຸກ channel (ເບິ່ງ app/layout.tsx) ເພື່ອໃຫ້ modal ມີການເຂົ້າເຖິງ
 * ກັບ Documents/Archive/CurrentUser contexts. ທຸກ trigger ພຽງຕ້ອງເອີ້ນ `useUploadModal().openUpload()`.
 */
export function UploadModalProvider({ children }: { children: ReactNode }) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [initialLocation, setInitialLocation] = useState<UploadInitialLocation | undefined>(undefined)
  // ເພີ່ມທຸກໆເທື່ອ ທີເປີດ modal — ໃຊ້ເປັນ `key` ເພື່ອ remount modal ແລະ ຣີເຊັດສະຖານະຟໍຣົມອັດຕະໂນມັດ
  const [openCount, setOpenCount] = useState(0)

  const value = useMemo<UploadModalContextValue>(
    () => ({
      uploadOpen,
      openUpload: (initLoc?: unknown) => {
        if (initLoc && typeof initLoc === 'object' && ('nativeEvent' in initLoc || 'preventDefault' in initLoc)) {
          setInitialLocation(undefined)
        } else {
          setInitialLocation(initLoc as UploadInitialLocation | undefined)
        }
        setOpenCount((c) => c + 1)
        setUploadOpen(true)
      },
      closeUpload: () => {
        setUploadOpen(false)
        setInitialLocation(undefined)
      },
    }),
    [uploadOpen],
  )

  return (
    <UploadModalContext.Provider value={value}>
      {children}
      <UploadDocumentModal
        key={openCount}
        open={uploadOpen}
        onClose={value.closeUpload}
        initialCabinetId={initialLocation?.cabinetId}
        initialShelfId={initialLocation?.shelfId}
        initialFolderId={initialLocation?.folderId}
      />
    </UploadModalContext.Provider>
  )
}

export function useUploadModal() {
  const ctx = useContext(UploadModalContext)
  if (!ctx) throw new Error('useUploadModal must be used within UploadModalProvider')
  return ctx
}