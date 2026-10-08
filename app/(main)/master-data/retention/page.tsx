'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useMasterData, type RetentionPeriod } from '../../context/MasterDataContext'
import { pushToast } from '@/app/components/ui/Toast'
import { Clock, RotateCcw } from 'lucide-react'
import Modal from '@/app/components/ui/Modal'
import {
  AddButton,
  ConfirmDeleteModal,
  DeleteButton,
  EditButton,
  IndigoPill,
  MasterCard,
  MasterDataHeader,
  MasterTable,
  RowActions,
  Th,
} from '@/app/components/master-data/MasterDataUI'

export default function MasterDataRetentionPage() {
  const {
    retentionPeriods,
    addRetentionPeriod,
    updateRetentionPeriod,
    deleteRetentionPeriod,
    resetRetentionPeriods,
  } = useMasterData()

  // Form states for adding
  const [name, setName] = useState('')
  const [months, setMonths] = useState<number | ''>(12)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit states
  const [editingItem, setEditingItem] = useState<RetentionPeriod | null>(null)
  const [editName, setEditName] = useState('')
  const [editMonths, setEditMonths] = useState<number | ''>(12)
  const [editDescription, setEditDescription] = useState('')

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleAdd() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      pushToast({ title: 'ກະລຸນາປ້ອນຊື່ໄລຍະເວລາ' })
      return
    }
    setIsSubmitting(true)
    const res = addRetentionPeriod({
      name: trimmedName,
      durationMonths: typeof months === 'number' ? months : 0,
      description: description.trim(),
    })
    setIsSubmitting(false)
    if (res.success) {
      pushToast({ title: 'ເພີ່ມໄລຍະເວລາເກັບຮັກສາສຳເລັດ' })
      setName('')
      setMonths(12)
      setDescription('')
    } else {
      pushToast({ title: res.message || 'ບໍ່ສາມາດເພີ່ມໄດ້' })
    }
  }

  function handleOpenEdit(item: RetentionPeriod) {
    setEditingItem(item)
    setEditName(item.name)
    setEditMonths(item.durationMonths)
    setEditDescription(item.description || '')
  }

  function handleSaveEdit() {
    if (!editingItem) return
    const trimmed = editName.trim()
    if (!trimmed) {
      pushToast({ title: 'ກະລຸນາປ້ອນຊື່ໄລຍະເວລາ' })
      return
    }
    const res = updateRetentionPeriod(editingItem.id, {
      name: trimmed,
      durationMonths: typeof editMonths === 'number' ? editMonths : 0,
      description: editDescription.trim(),
    })
    if (res.success) {
      pushToast({ title: 'ແກ້ໄຂໄລຍະເວລາສຳເລັດ' })
      setEditingItem(null)
    } else {
      pushToast({ title: res.message || 'ແກ້ໄຂບໍ່ສຳເລັດ' })
    }
  }

  function handleConfirmDelete() {
    if (!deletingId) return
    deleteRetentionPeriod(deletingId)
    pushToast({ title: 'ລຶບໄລຍະເວລາສຳເລັດ' })
    setDeletingId(null)
  }

  return (
    <DashboardLayout title="ອາຍຸການເກັບຮັກສາ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <MasterDataHeader
          icon={<Clock className="h-6 w-6" />}
          title="ອາຍຸການເກັບຮັກສາ (Retention Periods)"
          subtitle={`ກຳນົດນະໂຍບາຍອາຍຸການເກັບຮັກສາເອກະສານທັງໝົດ ${retentionPeriods.length} ຮູບແບບ`}
          action={
            <button
              type="button"
              onClick={() => {
                if (confirm('ທ່ານຕ້ອງການຣີເຊັດອາຍຸການເກັບຮັກສາກັບເປັນຄ່າເລີ່ມຕົ້ນແທ້ບໍ່?')) {
                  resetRetentionPeriods()
                  pushToast({ title: 'ຣີເຊັດກັບເປັນຄ່າເລີ່ມຕົ້ນແລ້ວ' })
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>ຣີເຊັດເປັນຄ່າເລີ່ມຕົ້ນ</span>
            </button>
          }
        />

        {/* ຟອມເພີ່ມໃໝ່ */}
        <MasterCard>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">ເພີ່ມອາຍຸການເກັບຮັກສາໃໝ່</h3>
            <div className="grid gap-3 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  ຊື່ໄລຍະເວລາ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ເຊັ່ນ: 6 ເດືອນ, 1 ປີ, 5 ປີ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  ຈຳນວນເດືອນ (0 = ຖາວອນ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={months}
                  onChange={(e) => setMonths(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="12"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  ລາຍລະອຽດ / ເຫດຜົນການໃຊ້
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ເອກະສານທົ່ວໄປ, ບັນຊີ, ສັນຍາ..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white"
                  />
                  <AddButton
                    label="ເພີ່ມ"
                    onClick={handleAdd}
                    disabled={!name.trim()}
                    busy={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>
        </MasterCard>

        {/* ຕາຕະລາງລາຍການ */}
        <MasterTable
          head={
            <>
              <Th>ຊື່ໄລຍະເວລາ</Th>
              <Th>ຈຳນວນເດືອນ</Th>
              <Th>ລາຍລະອຽດ</Th>
              <Th align="right">ຈັດການ</Th>
            </>
          }
        >
          {retentionPeriods.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                ຍັງບໍ່ມີຂໍ້ມູນອາຍຸການເກັບຮັກສາ
              </td>
            </tr>
          ) : (
            retentionPeriods.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-5 py-3.5 font-semibold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                      ⏳
                    </span>
                    <span>{r.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <IndigoPill>
                    {r.durationMonths === 0 ? 'ຕະຫຼອດໄປ (ຖາວອນ)' : `${r.durationMonths} ເດືອນ (${(r.durationMonths / 12).toFixed(1).replace('.0', '')} ປີ)`}
                  </IndigoPill>
                </td>
                <td className="px-5 py-3.5 text-slate-500">
                  {r.description || '—'}
                </td>
                <td className="px-5 py-3.5">
                  <RowActions>
                    <EditButton onClick={() => handleOpenEdit(r)} />
                    <DeleteButton onClick={() => setDeletingId(r.id)} />
                  </RowActions>
                </td>
              </tr>
            ))
          )}
        </MasterTable>

        {/* Edit Modal */}
        {editingItem && (
          <Modal open={true} onClose={() => setEditingItem(null)} title="ແກ້ໄຂອາຍຸການເກັບຮັກສາ">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ຊື່ໄລຍະເວລາ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ຈຳນວນເດືອນ (0 = ຖາວອນ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editMonths}
                  onChange={(e) => setEditMonths(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ລາຍລະອຽດ
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  ບັນທຶກ
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation */}
        <ConfirmDeleteModal
          open={!!deletingId}
          title="ຢືນຢັນການລຶບ"
          onClose={() => setDeletingId(null)}
          onConfirm={handleConfirmDelete}
        >
          ທ່ານແນ່ໃຈແລ້ວບໍ່ວ່າຕ້ອງການລຶບໄລຍະເວລາເກັບຮັກສານີ້?
        </ConfirmDeleteModal>
      </div>
    </DashboardLayout>
  )
}
