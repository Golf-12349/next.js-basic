"use client"
import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDMS } from '../_dms-context'
import { pushToast } from '@/app/components/ui/Toast'
import type { User, UserRole, UserStatus } from '@/types/user'
import {
  UserDetailModal,
  UserFormModal,
  DeleteUserModal,
  roleStyles,
  roleLabels,
  statusStyles,
  statusLabels,
  initialsOf,
  type UserFormValues,
} from '@/app/components/users/UserModals'
import { Search, Users as UsersIcon, ShieldCheck, UserCheck, Eye, Pencil, Lock, Unlock, Trash2 } from 'lucide-react'

const ALL = 'ທັງໝົດ'

export default function UsersPage() {
  const { users, addUser, updateUser, removeUser, toggleUserStatus } = useDMS()

  const [query, setQuery] = useState('')
  const [filterRole, setFilterRole] = useState<'ທັງໝົດ' | UserRole>(ALL)
  const [filterDepartment, setFilterDepartment] = useState<string>(ALL)
  const [filterStatus, setFilterStatus] = useState<'ທັງໝົດ' | UserStatus>(ALL)

  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const departments = useMemo(() => {
    const set = new Set(users.map((u) => u.department).filter(Boolean))
    return Array.from(set)
  }, [users])

  const stats = useMemo(() => {
    return {
      total: users.length,
      superAdmin: users.filter((u) => u.role === 'SuperAdmin').length,
      admin: users.filter((u) => u.role === 'Admin').length,
      active: users.filter((u) => u.status === 'active').length,
    }
  }, [users])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (q && !(u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) return false
      if (filterRole !== ALL && u.role !== filterRole) return false
      if (filterDepartment !== ALL && u.department !== filterDepartment) return false
      if (filterStatus !== ALL && u.status !== filterStatus) return false
      return true
    })
  }, [users, query, filterRole, filterDepartment, filterStatus])

  function openAddForm() {
    setEditingUser(null)
    setFormOpen(true)
  }

  function openEditForm(user: User) {
    setEditingUser(user)
    setFormOpen(true)
  }

  async function handleFormSubmit(values: UserFormValues) {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, { ...values })
        pushToast({ title: 'ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້ງານສຳເລັດ' })
      } else {
        await addUser(values)
        pushToast({ title: 'ເພີ່ມຜູ້ໃຊ້ງານສຳເລັດ' })
      }
      setFormOpen(false)
      setEditingUser(null)
    } catch (err) {
      console.error('User form submit failed:', err)
      pushToast({ title: 'ດຳເນີນການລົ້ມເຫຼວ, ກະລຸນາລອງໃໝ່' })
    }
  }

  async function handleToggleStatus(user: User) {
    await toggleUserStatus(user.id)
    pushToast({
      title: user.status === 'active' ? `ປິດການໃຊ້ງານຂອງ ${user.name}` : `ເປີດການໃຊ້ງານຂອງ ${user.name}`,
    })
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    await removeUser(deleteTarget.id)
    pushToast({ title: 'ລຶບຜູ້ໃຊ້ງານສຳເລັດ' })
    setDeleteTarget(null)
  }

  return (
    <DashboardLayout title="ຈັດການຜູ້ໃຊ້ງານ">
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ຈັດການຜູ້ໃຊ້ງານ</h1>
            <p className="mt-1 text-sm text-gray-500">ສ້າງ ແກ້ໄຂ ແລະ ຈັດສິດການເຂົ້າໃຊ້ລະບົບ DMS</p>
          </div>
          <button
            onClick={openAddForm}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            + ເພີ່ມຜູ້ໃຊ້ງານ
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">ຜູ້ໃຊ້ງານທັງໝົດ</div>
              <UsersIcon size={18} className="text-indigo-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">SuperAdmin</div>
              <ShieldCheck size={18} className="text-violet-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">{stats.superAdmin}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Admin</div>
              <ShieldCheck size={18} className="text-blue-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">{stats.admin}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">ໃຊ້ງານຢູ່</div>
              <UserCheck size={18} className="text-emerald-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">{stats.active}</div>
          </div>
        </div>

        {/* Search & filter bar */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">ຄົ້ນຫາ</label>
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ຊື່ ຫຼື ອີເມວ"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ສິດນຳໃຊ້</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as 'ທັງໝົດ' | UserRole)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
              >
                <option value={ALL}>ທັງໝົດ</option>
                <option value="SuperAdmin">SuperAdmin</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ພະແນກ</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
              >
                <option value={ALL}>ທັງໝົດ</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ສະຖານະ</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'ທັງໝົດ' | UserStatus)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
              >
                <option value={ALL}>ທັງໝົດ</option>
                <option value="active">ໃຊ້ງານຢູ່</option>
                <option value="inactive">ບໍ່ໄດ້ໃຊ້ງານ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">ຜູ້ໃຊ້ງານ</th>
                  <th className="px-4 py-3">ພະແນກ</th>
                  <th className="px-4 py-3">ສິດນຳໃຊ້</th>
                  <th className="px-4 py-3">ສະຖານະ</th>
                  <th className="px-4 py-3">ນຳໃຊ້ລ່າສຸດ</th>
                  <th className="px-4 py-3 text-center">ການກະທຳ</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                      ບໍ່ພົບຜູ້ໃຊ້ງານທີ່ຕົງກັບການຄົ້ນຫາ
                    </td>
                  </tr>
                ) : (
                  visible.map((u) => (
                    <tr key={u.id} className="border-t border-gray-100 align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                            {initialsOf(u.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{u.department}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleStyles[u.role]}`}>
                          {roleLabels[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[u.status]}`}>
                          {statusLabels[u.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{u.lastActive || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDetailUser(u)}
                            title="ເບິ່ງລາຍລະອຽດ"
                            className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => openEditForm(u)}
                            title="ແກ້ໄຂ"
                            className="rounded-md border border-indigo-200 bg-indigo-50 p-1.5 text-indigo-700 hover:bg-indigo-100"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'active' ? 'ປິດການໃຊ້ງານ' : 'ເປີດການໃຊ້ງານ'}
                            className="rounded-md border border-amber-200 bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100"
                          >
                            {u.status === 'active' ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            title="ລຶບ"
                            className="rounded-md border border-rose-200 bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <UserDetailModal user={detailUser} open={!!detailUser} onClose={() => setDetailUser(null)} />

        <UserFormModal
          open={formOpen}
          user={editingUser}
          departments={departments}
          onClose={() => {
            setFormOpen(false)
            setEditingUser(null)
          }}
          onSubmit={handleFormSubmit}
        />

        <DeleteUserModal
          user={deleteTarget}
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      </main>
    </DashboardLayout>
  )
}