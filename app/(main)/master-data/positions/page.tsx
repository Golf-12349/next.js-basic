'use client'

import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useMasterData } from '../../context/MasterDataContext'
import { useUsers } from '../../context/UsersContext'
import { pushToast } from '@/app/components/ui/Toast'
import { Briefcase, RotateCcw } from 'lucide-react'
import Modal from '@/app/components/ui/Modal'
import {
  AddButton,
  AddInput,
  ConfirmDeleteModal,
  CountPill,
  DeleteButton,
  EditButton,
  MasterCard,
  MasterDataHeader,
  MasterTable,
  RowActions,
  Th,
} from '@/app/components/master-data/MasterDataUI'

export default function MasterDataPositionsPage() {
  const {
    positions,
    addPosition,
    updatePosition,
    deletePosition,
    resetPositions,
  } = useMasterData()
  const { users } = useUsers()

  const [newPositionName, setNewPositionName] = useState('')
  const [editingPosition, setEditingPosition] = useState<string | null>(null)
  const [editPosName, setEditPosName] = useState('')
  const [deletingPosition, setDeletingPosition] = useState<string | null>(null)

  // ນັບຈຳນວນຜູ້ໃຊ້ງານທີ່ຖືແຕ່ລະຕຳແໜ່ງ
  const positionUserCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const u of users) {
      if (u.position) {
        counts.set(u.position, (counts.get(u.position) || 0) + 1)
      }
    }
    return counts
  }, [users])

  function handleAdd() {
    const trimmed = newPositionName.trim()
    if (!trimmed) {
      pushToast({ title: 'ກະລຸນາປ້ອນຊື່ຕຳແໜ່ງ' })
      return
    }
    const res = addPosition(trimmed)
    if (res.success) {
      pushToast({ title: 'ເພີ່ມຕຳແໜ່ງໃໝ່ສຳເລັດ' })
      setNewPositionName('')
    } else {
      pushToast({ title: res.message || 'ບໍ່ສາມາດເພີ່ມຕຳແໜ່ງໄດ້' })
    }
  }

  function handleOpenEdit(pos: string) {
    setEditingPosition(pos)
    setEditPosName(pos)
  }

  function handleSaveEdit() {
    if (!editingPosition) return
    const trimmed = editPosName.trim()
    if (!trimmed) {
      pushToast({ title: 'ກະລຸນາປ້ອນຊື່ຕຳແໜ່ງ' })
      return
    }
    const res = updatePosition(editingPosition, trimmed)
    if (res.success) {
      pushToast({ title: 'ແກ້ໄຂຊື່ຕຳແໜ່ງສຳເລັດ' })
      setEditingPosition(null)
    } else {
      pushToast({ title: res.message || 'ແກ້ໄຂບໍ່ສຳເລັດ' })
    }
  }

  function handleConfirmDelete() {
    if (!deletingPosition) return
    const userCount = positionUserCounts.get(deletingPosition) || 0
    if (userCount > 0) {
      pushToast({
        title: 'ບໍ່ສາມາດລຶບຕຳແໜ່ງນີ້ໄດ້',
        description: `ຍັງມີ ${userCount} ຜູ້ໃຊ້ງານກຳລັງຖືຕຳແໜ່ງນີ້ຢູ່`,
      })
      setDeletingPosition(null)
      return
    }
    deletePosition(deletingPosition)
    pushToast({ title: 'ລຶບຕຳແໜ່ງສຳເລັດ' })
    setDeletingPosition(null)
  }

  return (
    <DashboardLayout title="ຈັດການຕຳແໜ່ງງານ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <MasterDataHeader
          icon={<Briefcase className="h-6 w-6" />}
          title="ຈັດການຕຳແໜ່ງງານ (Positions & Job Titles)"
          subtitle={`ກຳນົດລາຍການຕຳແໜ່ງງານມາດຕະຖານໃນອົງກອນ ທັງໝົດ ${positions.length} ຕຳແໜ່ງ`}
          action={
            <button
              type="button"
              onClick={() => {
                if (confirm('ທ່ານຕ້ອງການຣີເຊັດລາຍການຕຳແໜ່ງງານກັບເປັນຄ່າເລີ່ມຕົ້ນແທ້ບໍ່?')) {
                  resetPositions()
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <AddInput
              icon={<Briefcase className="h-4 w-4" />}
              value={newPositionName}
              onChange={setNewPositionName}
              onSubmit={handleAdd}
              placeholder="ປ້ອນຊື່ຕຳແໜ່ງງານໃໝ່ (ເຊັ່ນ: ຫົວໜ້າ, ຮອງຫົວໜ້າ, ວິຊາການ, ເລຂາ...)"
            />
            <AddButton
              label="ເພີ່ມຕຳແໜ່ງ"
              onClick={handleAdd}
              disabled={!newPositionName.trim()}
            />
          </div>
        </MasterCard>

        {/* ຕາຕະລາງລາຍການ */}
        <MasterTable
          head={
            <>
              <Th>ຊື່ຕຳແໜ່ງງານ</Th>
              <Th>ຈຳນວນຜູ້ໃຊ້ງານ</Th>
              <Th>ສະຖານະ</Th>
              <Th align="right">ຈັດການ</Th>
            </>
          }
        >
          {positions.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                ຍັງບໍ່ມີຂໍ້ມູນຕຳແໜ່ງງານ
              </td>
            </tr>
          ) : (
            positions.map((pos) => {
              const userCount = positionUserCounts.get(pos) || 0
              return (
                <tr key={pos} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-semibold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                        💼
                      </span>
                      <span>{pos}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <CountPill>{userCount} ຄົນ</CountPill>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      ພ້ອມໃຊ້ງານ
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <RowActions>
                      <EditButton onClick={() => handleOpenEdit(pos)} />
                      <DeleteButton onClick={() => setDeletingPosition(pos)} />
                    </RowActions>
                  </td>
                </tr>
              )
            })
          )}
        </MasterTable>

        {/* Edit Modal */}
        {editingPosition && (
          <Modal open={true} onClose={() => setEditingPosition(null)} title="ແກ້ໄຂຊື່ຕຳແໜ່ງງານ">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ຊື່ຕຳແໜ່ງງານ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editPosName}
                  onChange={(e) => setEditPosName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPosition(null)}
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
          open={!!deletingPosition}
          title="ຢືນຢັນການລຶບ"
          onClose={() => setDeletingPosition(null)}
          onConfirm={handleConfirmDelete}
        >
          {deletingPosition && (positionUserCounts.get(deletingPosition) || 0) > 0 ? (
            <span className="text-rose-600 font-medium">
              ບໍ່ສາມາດລຶບໄດ້ ເນື່ອງຈາກຍັງມີ {positionUserCounts.get(deletingPosition)} ຜູ້ໃຊ້ງານກຳລັງຖືຕຳແໜ່ງນີ້ຢູ່!
            </span>
          ) : (
            `ທ່ານແນ່ໃຈແລ້ວບໍ່ວ່າຕ້ອງການລຶບຕຳແໜ່ງ "${deletingPosition}"?`
          )}
        </ConfirmDeleteModal>
      </div>
    </DashboardLayout>
  )
}
