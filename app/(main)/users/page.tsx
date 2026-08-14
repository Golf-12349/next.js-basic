"use client"
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { pushToast } from '@/app/components/ui/Toast'

type User = { id: string; name: string; role: 'Admin' | 'Staff' }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([
    { id: 'u1', name: 'ຈອນໂດ', role: 'Admin' },
    { id: 'u2', name: 'ສະໄໝ ສະໄໝ', role: 'Staff' },
  ])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState<User['role']>('Staff')

  function addUser() {
    if (!name.trim()) return
    setUsers([{ id: Math.random().toString(36).slice(2,6), name: name.trim(), role }, ...users])
    setName('')
    setOpen(false)
    pushToast({ title: 'ເພີ່ມຜູ້ໃຊ້ງານສຳເລັດ' })
  }

  return (
    <DashboardLayout title="ຈັດການຜູ້ໃຊ້">
      <main className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">ຈັດການຜູ້ໃຊ້</h1>
            <p className="text-sm text-gray-500">ສ້າງ ແກ້ໄຂ ແລະ ຈັດສິດການເຂົ້າເວັບ</p>
          </div>
          <button onClick={() => setOpen(true)} className="px-4 py-2 rounded bg-indigo-600 text-white">+ ເພີ່ມຜູ້ໃຊ້ງານ</button>
        </div>

        <div className="rounded bg-white border p-4">
          {users.map((u) => (
            <div key={u.id} className="py-2 border-b last:border-b-0 flex items-center justify-between">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-gray-500">{u.role}</div>
              </div>
              <div className="text-sm text-gray-500">ID: {u.id}</div>
            </div>
          ))}
        </div>

        <Modal open={open} onClose={() => setOpen(false)} title="ເພີ່ມຜູ້ໃຊ້ງານ">
          <div>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border px-3 py-2 mb-3" placeholder="ຊື່" />
            <select value={role} onChange={(e) => setRole(e.target.value as User['role'])} className="w-full rounded border px-3 py-2 mb-3">
              <option>Admin</option>
              <option>Staff</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-2 rounded bg-gray-100">ຍົກເລີກ</button>
              <button onClick={addUser} className="px-3 py-2 rounded bg-indigo-600 text-white">ບັນທຶກ</button>
            </div>
          </div>
        </Modal>
      </main>
    </DashboardLayout>
  )
}