'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { pushToast } from '@/app/components/ui/Toast'
import { useArchive } from '@/app/(main)/context/ArchiveContext'
import type { Cabinet, Folder, Warehouse } from '@/types/document'

interface SelectStorageLocationModalProps {
  open: boolean
  title?: string
  docTitle?: string
  docNumber?: string
  department?: string
  division?: string
  initialWarehouseId?: string
  initialCabinetId?: string
  initialFolderId?: string
  confirmLabel?: string
  onClose: () => void
  onConfirm: (data: { warehouseId?: string; cabinetId?: string; folderId?: string; note?: string }) => Promise<void>
}

export default function SelectStorageLocationModal({
  open,
  title = '🗄️ ເລືອກບ່ອນຈັດເກັບເອກະສານ',
  docTitle,
  docNumber,
  department,
  division,
  initialWarehouseId,
  initialCabinetId,
  initialFolderId,
  confirmLabel = 'ບັນທຶກບ່ອນຈັດເກັບ',
  onClose,
  onConfirm,
}: SelectStorageLocationModalProps) {
  const { warehouses, cabinets, folders } = useArchive()

  const [warehouseId, setWarehouseId] = useState<string>('')
  const [cabinetId, setCabinetId] = useState<string>('')
  const [folderId, setFolderId] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Reset and prefill selections when modal opens
  useEffect(() => {
    if (open) {
      setWarehouseId(initialWarehouseId || (warehouses[0]?.id ?? ''))
      setCabinetId(initialCabinetId || '')
      setFolderId(initialFolderId || '')
      setNote('')
    }
  }, [open, initialWarehouseId, initialCabinetId, initialFolderId, warehouses])

  // Filter cabinets based on selected warehouse AND department (if given)
  const availableCabinets = useMemo(() => {
    let list: Cabinet[] = cabinets
    if (warehouseId) {
      list = list.filter((c: Cabinet) => !c.warehouseId || c.warehouseId === warehouseId)
    }
    if (department) {
      const deptNormalized = department.trim().toLowerCase()
      const deptMatched = list.filter((c: Cabinet) => c.department && c.department.trim().toLowerCase() === deptNormalized)
      // If there are cabinets matching the department, prioritize them; otherwise show all
      if (deptMatched.length > 0) list = deptMatched
    }
    return list
  }, [cabinets, warehouseId, department])

  // Automatically select first cabinet if available and current selection is empty or not in list
  useEffect(() => {
    if (availableCabinets.length > 0 && (!cabinetId || !availableCabinets.some((c: Cabinet) => c.id === cabinetId))) {
      setCabinetId(availableCabinets[0].id)
    } else if (availableCabinets.length === 0) {
      setCabinetId('')
    }
  }, [availableCabinets, cabinetId])

  // Filter folders based on selected cabinet
  const availableFolders = useMemo(() => {
    if (!cabinetId) return []
    return folders.filter((f: Folder) => f.cabinetId === cabinetId)
  }, [folders, cabinetId])

  // Reset folder selection if cabinet changes
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
        warehouseId: warehouseId || undefined,
        cabinetId: cabinetId || undefined,
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
      scrollBody={true}
      footer={
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>ກຳລັງບັນທຶກ...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Document Info */}
        {(docTitle || docNumber || department) && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            {docTitle && <div className="text-base font-semibold text-gray-900">{docTitle}</div>}
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
              {docNumber && <span>ເລກທີ: <strong className="text-gray-800">{docNumber}</strong></span>}
              {division && <span>ຝ່າຍ: <strong className="text-gray-800">{division}</strong></span>}
              {department && <span>ພະແນກ: <strong className="text-gray-800">{department}</strong></span>}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          ກະລຸນາເລືອກ ຄັງເອກະສານ, ຕູ້ເອກະສານ ແລະ ຊັ້ນວາງ/ແຟ້ມ ທີ່ຕ້ອງການນຳເອກະສານເຂົ້າເກັບຮັກສາ:
        </div>

        {/* 1. Warehouse */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            🏛️ 1. ຄັງເອກະສານ (Warehouse)
          </label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">— ບໍ່ລະບຸຄັງເອກະສານ —</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} {wh.division ? `(${wh.division})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Cabinet */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            🗄️ 2. ຕູ້ເອກະສານ (Cabinet)
          </label>
          <select
            value={cabinetId}
            onChange={(e) => setCabinetId(e.target.value)}
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
              ຍັງບໍ່ພົບຕູ້ເອກະສານໃນຄັງນີ້ (ສາມາດສ້າງຕູ້ໃໝ່ໄດ້ທີ່ເມນູຄັງເອກະສານ)
            </p>
          )}
        </div>

        {/* 3. Folder/Shelf */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            📁 3. ຊັ້ນວາງ / ແຟ້ມເອກະສານ (Shelf / Folder)
          </label>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            disabled={!cabinetId || availableFolders.length === 0}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">— ບໍ່ລະບຸຊັ້ນວາງ/ແຟ້ມ —</option>
            {availableFolders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          {cabinetId && availableFolders.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">ຕູ້ນີ້ຍັງບໍ່ມີຊັ້ນວາງ/ແຟ້ມຍ່ອຍ</p>
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

