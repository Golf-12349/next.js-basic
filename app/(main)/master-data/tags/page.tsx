'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useMasterData, type DocumentTag } from '../../context/MasterDataContext'
import { pushToast } from '@/app/components/ui/Toast'
import { Bookmark, RotateCcw } from 'lucide-react'
import Modal from '@/app/components/ui/Modal'
import {
  AddButton,
  ConfirmDeleteModal,
  DeleteButton,
  EditButton,
  MasterCard,
  MasterDataHeader,
  MasterTable,
  RowActions,
  Th,
} from '@/app/components/master-data/MasterDataUI'

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#db2777', // Pink
  '#dc2626', // Red
  '#4f46e5', // Indigo
  '#0891b2', // Cyan
  '#475569', // Slate
]

export default function MasterDataTagsPage() {
  const {
    tags,
    addTag,
    updateTag,
    deleteTag,
    resetTags,
  } = useMasterData()

  // Form states for adding
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2563eb')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit states
  const [editingItem, setEditingItem] = useState<DocumentTag | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#2563eb')
  const [editDescription, setEditDescription] = useState('')

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) {
      pushToast({ title: 'ກະລຸນາປ້ອນຊື່ແທັກ' })
      return
    }
    setIsSubmitting(true)
    const res = addTag({
      name: trimmed,
      color,
      description: description.trim(),
    })
    setIsSubmitting(false)
    if (res.success) {
      pushToast({ title: 'ເພີ່ມແທັກໃໝ່ສຳເລັດ' })
      setName('')
      setDescription('')
    } else {
      pushToast({ title: res.message || 'ບໍ່ສາມາດເພີ່ມໄດ້' })
    }
  }

  function handleOpenEdit(item: DocumentTag) {
    setEditingItem(item)
    setEditName(item.name)
    setEditColor(item.color || '#2563eb')
    setEditDescription(item.description || '')
  }

  function handleSaveEdit() {
    if (!editingItem) return
    const trimmed = editName.trim()
    if (!trimmed) {
      pushToast({ title: 'ກະລຸນາປ້ອນຊື່ແທັກ' })
      return
    }
    const res = updateTag(editingItem.id, {
      name: trimmed,
      color: editColor,
      description: editDescription.trim(),
    })
    if (res.success) {
      pushToast({ title: 'ແກ້ໄຂແທັກສຳເລັດ' })
      setEditingItem(null)
    } else {
      pushToast({ title: res.message || 'ແກ້ໄຂບໍ່ສຳເລັດ' })
    }
  }

  function handleConfirmDelete() {
    if (!deletingId) return
    deleteTag(deletingId)
    pushToast({ title: 'ລຶບແທັກສຳເລັດ' })
    setDeletingId(null)
  }

  return (
    <DashboardLayout title="ປ້າຍກຳກັບ / ແທັກ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <MasterDataHeader
          icon={<Bookmark className="h-6 w-6" />}
          title="ປ້າຍກຳກັບ / ແທັກ (Tags & Keywords)"
          subtitle={`ກຳນົດປ້າຍກຳກັບເອກະສານສຳລັບຈັດໝວດໝູ່ ແລະ ຄົ້ນຫາໄວ ທັງໝົດ ${tags.length} ແທັກ`}
          action={
            <button
              type="button"
              onClick={() => {
                if (confirm('ທ່ານຕ້ອງການຣີເຊັດແທັກກັບເປັນຄ່າເລີ່ມຕົ້ນແທ້ບໍ່?')) {
                  resetTags()
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
            <h3 className="text-sm font-bold text-slate-800">ເພີ່ມປ້າຍກຳກັບ / ແທັກໃໝ່</h3>
            <div className="grid gap-3 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  ຊື່ແທັກ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">#</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ສັນຍາ, ໃບສະເໜີ, ດ່ວນ..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-7 pr-3 text-sm outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  ສີປ້າຍກຳກັບ
                </label>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${
                        color === c ? 'scale-110 border-slate-900 ring-2 ring-indigo-200' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="sm:col-span-5">
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  ລາຍລະອຽດ / ຄຳອະທິບາຍ
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ຄຳອະທິບາຍສຳລັບແທັກນີ້..."
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
              <Th>ແທັກ / ປ້າຍກຳກັບ</Th>
              <Th>ຕົວຢ່າງປ້າຍ (Badge)</Th>
              <Th>ລາຍລະອຽດ</Th>
              <Th align="right">ຈັດການ</Th>
            </>
          }
        >
          {tags.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                ຍັງບໍ່ມີຂໍ້ມູນແທັກ
              </td>
            </tr>
          ) : (
            tags.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-5 py-3.5 font-semibold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span>#{t.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs"
                    style={{ backgroundColor: t.color }}
                  >
                    #{t.name}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-500">
                  {t.description || '—'}
                </td>
                <td className="px-5 py-3.5">
                  <RowActions>
                    <EditButton onClick={() => handleOpenEdit(t)} />
                    <DeleteButton onClick={() => setDeletingId(t.id)} />
                  </RowActions>
                </td>
              </tr>
            ))
          )}
        </MasterTable>

        {/* Edit Modal */}
        {editingItem && (
          <Modal open={true} onClose={() => setEditingItem(null)} title="ແກ້ໄຂປ້າຍກຳກັບ / ແທັກ">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ຊື່ແທັກ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  ເລືອກສີ
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        editColor === c ? 'scale-110 border-slate-900 ring-2 ring-indigo-200' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                    title="ເລືອກສີອື່ນໆ"
                  />
                </div>
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
          ທ່ານແນ່ໃຈແລ້ວບໍ່ວ່າຕ້ອງການລຶບປ້າຍກຳກັບນີ້?
        </ConfirmDeleteModal>
      </div>
    </DashboardLayout>
  )
}
