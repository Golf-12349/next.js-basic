'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { pushToast } from '@/app/components/ui/Toast'
import { useArchive } from '@/app/(main)/context/ArchiveContext'
import type { Cabinet, Folder, Shelf } from '@/types/document'

interface SelectStorageLocationModalProps {
  open: boolean
  title?: string
  docTitle?: string
  docNumber?: string
  department?: string
  division?: string
  initialWarehouseId?: string
  initialCabinetId?: string
  initialShelfId?: string
  initialFolderId?: string
  confirmLabel?: string
  onClose: () => void
  onConfirm: (data: { warehouseId?: string; cabinetId?: string; shelfId?: string; folderId?: string; note?: string }) => Promise<void>
}

export default function SelectStorageLocationModal({
  open,
  title = '🗄️ ເລືອກບ່ອນຈັດເກັບເອກະສານ',
  docTitle,
  docNumber,
  department,
  initialWarehouseId,
  initialCabinetId,
  initialShelfId,
  initialFolderId,
  confirmLabel = 'ບັນທຶກບ່ອນຈັດເກັບ',
  onClose,
  onConfirm,
}: SelectStorageLocationModalProps) {
  const { warehouses, cabinets, shelves, folders } = useArchive()

  const [cabinetId, setCabinetId] = useState<string>('')
  const [shelfId, setShelfId] = useState<string>('')
  const [folderId, setFolderId] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Reset and prefill selections when modal opens
  useEffect(() => {
    if (open) {
      setCabinetId(initialCabinetId || '')
      setShelfId(initialShelfId || '')
      setFolderId(initialFolderId || '')
      setNote('')
    }
  }, [open, initialCabinetId, initialShelfId, initialFolderId])

  // Filter cabinets based on department (if given)
  const availableCabinets = useMemo(() => {
    if (department) {
      const deptNormalized = department.trim().toLowerCase()
      const deptMatched = cabinets.filter(
        (c: Cabinet) => c.department && c.department.trim().toLowerCase() === deptNormalized,
      )
      if (deptMatched.length > 0) return deptMatched
    }
    return cabinets
  }, [cabinets, department])

  // Automatically select first cabinet if available and current selection is empty or not in list
  useEffect(() => {
    if (availableCabinets.length > 0 && (!cabinetId || !availableCabinets.some((c: Cabinet) => c.id === cabinetId))) {
      setCabinetId(availableCabinets[0].id)
    } else if (availableCabinets.length === 0) {
      setCabinetId('')
    }
  }, [availableCabinets, cabinetId])

  const selectedCabinet = useMemo(
    () => cabinets.find((c: Cabinet) => c.id === cabinetId),
    [cabinets, cabinetId],
  )
  const selectedWarehouse = useMemo(
    () =>
      selectedCabinet?.warehouseId
        ? warehouses.find((w) => w.id === selectedCabinet.warehouseId)
        : warehouses.find((w) => w.id === initialWarehouseId),
    [selectedCabinet, warehouses, initialWarehouseId],
  )

  // Filter shelves based on selected cabinet
  const availableShelves = useMemo(() => {
    if (!cabinetId) return []
    return shelves.filter((s: Shelf) => s.cabinetId === cabinetId)
  }, [shelves, cabinetId])

  // Reset shelf selection if cabinet changes
  useEffect(() => {
    if (availableShelves.length > 0 && shelfId && !availableShelves.some((s: Shelf) => s.id === shelfId)) {
      setShelfId('')
    }
  }, [availableShelves, shelfId])

  // Filter folders based on selected cabinet and optionally shelf
  const availableFolders = useMemo(() => {
    if (!cabinetId) return []
    if (shelfId) {
      return folders.filter((f) => f.cabinetId === cabinetId && f.shelfId === shelfId)
    }
    return folders.filter((f) => f.cabinetId === cabinetId)
  }, [folders, cabinetId, shelfId])

  // Reset folder selection if cabinet or shelf changes
  useEffect(() => {
    if (availableFolders.length > 0 && (!folderId || !availableFolders.some((f: Folder) => f.id === folderId))) {
      setFolderId(availableFolders[0].id)
    } else if (availableFolders.length === 0) {
      setFolderId('')
    }
  }, [availableFolders, folderId])

  if (!open) return null

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setSubmitting(true)
    try {
      await onConfirm({
        warehouseId: selectedWarehouse?.id || initialWarehouseId || undefined,
        cabinetId: cabinetId || undefined,
        shelfId: shelfId || undefined,
        folderId: folderId || undefined,
        note: note.trim() || undefined,
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກບ່ອນເກັບ'
      pushToast({
        title: 'ບັນທຶກບໍ່ສຳເລັດ',
        description: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || msg,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
          >
            {submitting ? 'ກຳລັງບັນທຶກ...' : confirmLabel}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Document Info Card */}
        {(docTitle || docNumber) && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-950">
            <div className="font-semibold text-indigo-900">{docTitle || 'ເອກະສານ'}</div>
            {docNumber && <div className="mt-0.5 font-mono text-indigo-700">{docNumber}</div>}
          </div>
        )}

        {/* 1. Cabinet */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              🗄️ 1. ຕູ້ເອກະສານ
            </label>
            {selectedWarehouse && (
              <span className="text-[11px] text-gray-500">
                🏛️ ຄັງ: <span className="font-medium text-gray-700">{selectedWarehouse.name}</span>
              </span>
            )}
          </div>
          <select
            value={cabinetId}
            onChange={(e) => {
              setCabinetId(e.target.value)
              setShelfId('')
              setFolderId('')
            }}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">— ບໍ່ລະບຸຕູ້ເອກະສານ —</option>
            {availableCabinets.map((cab) => (
              <option key={cab.id} value={cab.id}>
                {cab.name} {cab.department ? `[${cab.department}]` : ''}
              </option>
            ))}
          </select>
          {availableCabinets.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              ຍັງບໍ່ພົບຕູ້ເອກະສານ{department ? `ຂອງພະແນກ ${department}` : ''} (ສາມາດສ້າງຕູ້ໃໝ່ໄດ້ທີ່ເມນູຄັງເອກະສານ)
            </p>
          )}
        </div>

        {/* 2. Shelf (ຊັ້ນວາງເອກະສານ) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            🪜 2. ຊັ້ນວາງເອກະສານ (Shelf - ທາງເລືອກ)
          </label>
          <select
            value={shelfId}
            onChange={(e) => {
              setShelfId(e.target.value)
              setFolderId('')
            }}
            disabled={!cabinetId || availableShelves.length === 0}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">— ທຸກຊັ້ນວາງ / ບໍ່ລະບຸ —</option>
            {availableShelves.map((s) => (
              <option key={s.id} value={s.id}>
                🪜 {s.name}
              </option>
            ))}
          </select>
          {cabinetId && availableShelves.length === 0 && (
            <p className="mt-1 text-xs text-gray-400">ຕູ້ນີ້ຍັງບໍ່ມີຊັ້ນວາງຍ່ອຍ</p>
          )}
        </div>

        {/* 3. Folder (ແຟ້ມເກັບເອກະສານ) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            📁 3. ແຟ້ມເກັບເອກະສານ (Folder)
          </label>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            disabled={!cabinetId || availableFolders.length === 0}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">— ບໍ່ລະບຸແຟ້ມເອກະສານ —</option>
            {availableFolders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
          {cabinetId && availableFolders.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">ຍັງບໍ່ມີແຟ້ມໃນຕູ້/ຊັ້ນວາງນີ້</p>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            ໝາຍເຫດເພີ່ມເຕີມ
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ໝາຍເຫດການຈັດເກັບ..."
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </form>
    </Modal>
  )
}
