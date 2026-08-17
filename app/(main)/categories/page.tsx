"use client"
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDMS } from '../_dms-context'
import { useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { pushToast } from '@/app/components/ui/Toast'
import { Tag, Trash2, FolderOpen } from 'lucide-react'

export default function CategoriesPage() {
  const { categories, documents, addCategory, removeCategory } = useDMS()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  // ນັບຈຳນວນເອກະສານທີ່ໃຊ້ Category ນີ້ (ບໍ່ນັບອັນທີ່ຢູ່ Trash)
  function countDocsInCategory(category: string) {
    return documents.filter((d) => d.category === category && !d.deleted).length
  }

  function handleAdd() {
    if (!name.trim()) return
    addCategory(name)
    setName('')
    setOpen(false)
    pushToast({ title: 'ເພີ່ມໝວດໝູ່ສຳເລັດ' })
  }

  function handleRemove(c: string) {
    const count = countDocsInCategory(c)
    if (count > 0) {
      pushToast({ title: `ບໍ່ສາມາດລຶບໄດ້ ຍັງມີ ${count} ເອກະສານໃຊ້ໝວດໝູ່ນີ້ຢູ່` })
      return
    }
    removeCategory(c)
    pushToast({ title: 'ລຶບໝວດໝູ່ສຳເລັດ' })
  }

  return (
    <DashboardLayout title="ໝວດໝູ່">
      <main className="p-6">
        {/* ຫົວຂໍ້ + ຄຳອະທິບາຍ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ໝວດໝູ່ເອກະສານ</h1>
            <p className="mt-1 text-sm text-gray-500">
              ຈັດການລາຍຊື່ໝວດໝູ່ທີ່ໃຊ້ຈັດແບ່ງເອກະສານ (ໃຊ້ຄັດກອງຢູ່ໜ້າ "ເອກະສານທັງໝົດ")
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 whitespace-nowrap"
          >
            <Tag size={16} />
            ເພີ່ມໝວດໝູ່ໃໝ່
          </button>
        </div>

        {/* Card Grid */}
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
            <FolderOpen className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-gray-400">ຍັງບໍ່ມີໝວດໝູ່, ກົດ "ເພີ່ມໝວດໝູ່ໃໝ່" ເພື່ອເລີ່ມຕົ້ນ</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((c) => {
              const count = countDocsInCategory(c)
              return (
                <div
                  key={c}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                      <Tag size={18} />
                    </div>
                    <button
                      onClick={() => handleRemove(c)}
                      title="ລຶບໝວດໝູ່"
                      className="rounded-lg p-1.5 text-gray-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-4 text-base font-semibold text-gray-900">{c}</div>
                  <div className="mt-1 text-sm text-gray-500">{count} ເອກະສານ</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal ເພີ່ມໝວດໝູ່ */}
        <Modal open={open} onClose={() => setOpen(false)} title="ເພີ່ມໝວດໝູ່ໃໝ່">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ຊື່ໝວດໝູ່</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ເຊັ່ນ: ໃບເກັບເງິນ, ໃບສະເໜີ"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                ຍົກເລີກ
              </button>
              <button onClick={handleAdd} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                ບັນທຶກ
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </DashboardLayout>
  )
}