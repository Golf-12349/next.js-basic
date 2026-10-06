"use client"

import { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import type { Cabinet, Shelf } from '@/types/document'
import { pushToast } from '@/app/components/ui/Toast'

interface MoveShelfModalProps {
  open: boolean
  shelf: Shelf | null
  cabinets: Cabinet[]
  onClose: () => void
  onConfirm: (shelfId: string, targetCabinetId: string) => Promise<void>
}

export function MoveShelfModal({
  open,
  shelf,
  cabinets,
  onClose,
  onConfirm,
}: MoveShelfModalProps) {
  const [targetCabinetId, setTargetCabinetId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (shelf) {
      setTargetCabinetId(shelf.cabinetId || cabinets[0]?.id || '')
    }
  }, [shelf, cabinets])

  if (!open || !shelf) return null

  const currentCabinet = cabinets.find((c) => c.id === shelf.cabinetId)

  async function handleSave() {
    if (!shelf || !targetCabinetId) {
      pushToast({ title: 'ກະລຸນາເລືອກຕູ້ເອກະສານປາຍທາງ' })
      return
    }
    setLoading(true)
    try {
      await onConfirm(shelf.id, targetCabinetId)
      pushToast({ title: 'ຍ້າຍຊັ້ນວາງສຳເລັດ' })
      onClose()
    } catch {
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການຍ້າຍຊັ້ນວາງ' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="ຍ້າຍຊັ້ນວາງ">
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <p className="text-xs text-gray-500">ຊັ້ນວາງ:</p>
          <p className="font-semibold text-gray-900 text-sm">🪜 {shelf.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            ຕູ້ປະຈຸບັນ: 🗄️ {currentCabinet?.name || 'ບໍ່ມີຕູ້'} {currentCabinet?.department && `(${currentCabinet.department})`}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            🗄️ ເລືອກຕູ້ເອກະສານປາຍທາງ <span className="text-rose-500">*</span>
          </label>
          <select
            value={targetCabinetId}
            onChange={(e) => setTargetCabinetId(e.target.value)}
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
            {loading ? 'ກຳລັງຍ້າຍ...' : 'ບັນທຶກການຍ້າຍຊັ້ນວາງ'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
