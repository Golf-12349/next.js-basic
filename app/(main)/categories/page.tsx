"use client"
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDMS } from '../_dms-context'
import { useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { pushToast } from '@/app/components/ui/Toast'

export default function CategoriesPage() {
  const { categories, setCategories } = useDMS()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  function addCategory() {
    if (!name.trim()) return
    setCategories((s) => [name.trim(), ...s])
    setName('')
    setOpen(false)
    pushToast({ title: 'ເພີ່ມໝວດໝູ່ສຳເລັດ' })
  }

  return (
    <DashboardLayout title="ໝວດໝູ່">
      <main className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">ໝວດໝູ່</h1>
            <p className="text-sm text-gray-500">ຈັດການໝວດໝູ່ເອກະສານ</p>
          </div>
          <button onClick={() => setOpen(true)} className="px-4 py-2 rounded bg-indigo-600 text-white">+ ເພີ່ມໝວດໝູ່</button>
        </div>

        <div className="rounded bg-white border p-4">
          {categories.map((c) => (
            <div key={c} className="py-2 border-b last:border-b-0">{c}</div>
          ))}
        </div>

        <Modal open={open} onClose={() => setOpen(false)} title="ເພີ່ມໝວດໝູ່">
          <div>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border px-3 py-2 mb-3" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-2 rounded bg-gray-100">ຍົກເລີກ</button>
              <button onClick={addCategory} className="px-3 py-2 rounded bg-indigo-600 text-white">ບັນທຶກ</button>
            </div>
          </div>
        </Modal>
      </main>
    </DashboardLayout>
  )
}