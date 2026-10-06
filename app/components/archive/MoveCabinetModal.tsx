"use client"

import { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import type { Cabinet, Warehouse } from '@/types/document'
import { useMasterData } from '@/app/(main)/context/MasterDataContext'
import { pushToast } from '@/app/components/ui/Toast'

interface MoveCabinetModalProps {
  open: boolean
  cabinet: Cabinet | null
  warehouses: Warehouse[]
  onClose: () => void
  onConfirm: (cabinetId: string, targetWarehouseId: string, division?: string, department?: string) => Promise<void>
}

export function MoveCabinetModal({
  open,
  cabinet,
  warehouses,
  onClose,
  onConfirm,
}: MoveCabinetModalProps) {
  const { divisions, getDepartments } = useMasterData()
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>('')
  const [targetDivision, setTargetDivision] = useState<string>('')
  const [targetDepartment, setTargetDepartment] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (cabinet) {
      setTargetWarehouseId(cabinet.warehouseId || warehouses[0]?.id || '')
      setTargetDivision(cabinet.division || '')
      setTargetDepartment(cabinet.department || '')
    }
  }, [cabinet, warehouses])

  const availableDepts = targetDivision ? getDepartments(targetDivision) : []

  if (!open || !cabinet) return null

  const currentWarehouse = warehouses.find((w) => w.id === cabinet.warehouseId)

  async function handleSave() {
    if (!cabinet || !targetWarehouseId) {
      pushToast({ title: 'ກະລຸນາເລືອກຄັງເອກະສານປາຍທາງ' })
      return
    }
    setLoading(true)
    try {
      await onConfirm(cabinet.id, targetWarehouseId, targetDivision || undefined, targetDepartment || undefined)
      pushToast({ title: 'ຍ້າຍຕູ້ເອກະສານສຳເລັດ' })
      onClose()
    } catch {
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການຍ້າຍຕູ້ເອກະສານ' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="ຍ້າຍຕູ້ເອກະສານ">
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <p className="text-xs text-gray-500">ຕູ້ເອກະສານ:</p>
          <p className="font-semibold text-gray-900 text-sm">🗄️ {cabinet.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            ບ່ອນເກັບປະຈຸບັນ: 🏛️ {currentWarehouse?.name || 'ຄັງທົ່ວໄປ'} {cabinet.division && `• ${cabinet.division}`} {cabinet.department && `• ${cabinet.department}`}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            🏛️ 1. ເລືອກຄັງເອກະສານປາຍທາງ <span className="text-rose-500">*</span>
          </label>
          <select
            value={targetWarehouseId}
            onChange={(e) => setTargetWarehouseId(e.target.value)}
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">-- ເລືອກຄັງເອກະສານ --</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                🏛️ {w.name} {w.division ? `(${w.division})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            🏢 2. ເລືອກຝ່າຍ (ທາງເລືອກ)
          </label>
          <select
            value={targetDivision}
            onChange={(e) => {
              setTargetDivision(e.target.value)
              setTargetDepartment('')
            }}
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">-- ທຸກຝ່າຍ / ບໍ່ປ່ຽນ --</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            👥 3. ເລືອກພະແນກ (ທາງເລືອກ)
          </label>
          <select
            value={targetDepartment}
            onChange={(e) => setTargetDepartment(e.target.value)}
            disabled={!targetDivision}
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-gray-100"
          >
            <option value="">-- ທຸກພະແນກ / ບໍ່ປ່ຽນ --</option>
            {availableDepts.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
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
            disabled={loading || !targetWarehouseId}
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'ກຳລັງຍ້າຍ...' : 'ບັນທຶກການຍ້າຍຕູ້'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
