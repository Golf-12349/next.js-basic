"use client"

import { useEffect, useMemo, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import type { Cabinet, Folder, Shelf } from '@/types/document'
import { pushToast } from '@/app/components/ui/Toast'

interface MoveFolderModalProps {
  open: boolean
  folder: Folder | null
  cabinets: Cabinet[]
  shelves: Shelf[]
  onClose: () => void
  onConfirm: (folderId: string, targetCabinetId: string, targetShelfId?: string | null) => Promise<void>
}

export function MoveFolderModal({
  open,
  folder,
  cabinets,
  shelves,
  onClose,
  onConfirm,
}: MoveFolderModalProps) {
  const [targetCabinetId, setTargetCabinetId] = useState<string>('')
  const [targetShelfId, setTargetShelfId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (folder) {
      setTargetCabinetId(folder.cabinetId || cabinets[0]?.id || '')
      setTargetShelfId(folder.shelfId || '')
    }
  }, [folder, cabinets])

  const availableShelves = useMemo(() => {
    if (!targetCabinetId) return []
    return shelves.filter((s) => s.cabinetId === targetCabinetId)
  }, [shelves, targetCabinetId])

  if (!open || !folder) return null

  const currentCabinet = cabinets.find((c) => c.id === folder.cabinetId)
  const currentShelf = shelves.find((s) => s.id === folder.shelfId)

  async function handleSave() {
    if (!folder || !targetCabinetId) {
      pushToast({ title: 'ກະລຸນາເລືອກຕູ້ເອກະສານປາຍທາງ' })
      return
    }
    setLoading(true)
    try {
      await onConfirm(folder.id, targetCabinetId, targetShelfId || null)
      pushToast({ title: 'ຍ້າຍແຟ້ມເອກະສານສຳເລັດ' })
      onClose()
    } catch {
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການຍ້າຍແຟ້ມເອກະສານ' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="ຍ້າຍແຟ້ມເອກະສານ">
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <p className="text-xs text-gray-500">ແຟ້ມເກັບເອກະສານ:</p>
          <p className="font-semibold text-gray-900 text-sm">📁 {folder.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            ບ່ອນເກັບປະຈຸບັນ: 🗄️ {currentCabinet?.name || 'ບໍ່ມີຕູ້'} {currentShelf ? `› 🪜 ${currentShelf.name}` : ''}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            🗄️ 1. ເລືອກຕູ້ເອກະສານປາຍທາງ <span className="text-rose-500">*</span>
          </label>
          <select
            value={targetCabinetId}
            onChange={(e) => {
              setTargetCabinetId(e.target.value)
              setTargetShelfId('')
            }}
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">-- ເລືອກຕູ້ເອກະສານ --</option>
            {cabinets.map((c) => (
              <option key={c.id} value={c.id}>
                🗄️ {c.name} {c.department ? `(${c.department})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            🪜 2. ເລືອກຊັ້ນວາງປາຍທາງ (ທາງເລືອກ)
          </label>
          <select
            value={targetShelfId}
            onChange={(e) => setTargetShelfId(e.target.value)}
            disabled={!targetCabinetId}
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-gray-100"
          >
            <option value="">-- ຕັ້ງໃນຕູ້ໂດຍກົງ / ບໍ່ລະບຸຊັ້ນວາງ --</option>
            {availableShelves.map((s) => (
              <option key={s.id} value={s.id}>
                🪜 {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            disabled={loading || !targetCabinetId}
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'ກຳລັງຍ້າຍ...' : 'ບັນທຶກການຍ້າຍແຟ້ມ'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
