"use client"
import { useRouter } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import Pagination from '@/app/components/ui/Pagination'
import { useUsers } from '../context/UsersContext'
import { useCurrentUser } from '../context/CurrentUserContext'
import { normalizeCurrentUser } from '@/types/user'
import { pushToast } from '@/app/components/ui/Toast'
import type { User, UserRole, UserStatus } from '@/types/user'
import { adminResetPassword } from '@/lib/dms/userService'
import {
  UserDetailModal,
  UserFormModal,
  DeleteUserModal,
  TemporaryPasswordModal,
  ResetPasswordModal,
  roleStyles,
  roleLabels,
  statusStyles,
  statusLabels,
  UserAvatar,
  type UserFormValues,
} from '@/app/components/users/UserModals'
import { Search, Users as UsersIcon, ShieldCheck, UserCheck, Eye, Pencil, Lock, Unlock, Trash2, KeyRound, ChevronDown } from 'lucide-react'

const ALL = 'ທັງໝົດ'

export default function UsersPage() {
  const { users, addUser, updateUser, removeUser, toggleUserStatus } = useUsers()
  const { user: currentUser, setCurrentUser } = useCurrentUser()
  const router = useRouter()

  const currentUserRole = currentUser?.role ?? 'DepartmentAdmin'
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const [filterRole, setFilterRole] = useState<'ທັງໝົດ' | UserRole>(ALL)
  const [filterDepartment, setFilterDepartment] = useState<string>(ALL)
  const [filterStatus, setFilterStatus] = useState<'ທັງໝົດ' | UserStatus>(ALL)

  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [temporaryPasswordUser, setTemporaryPasswordUser] = useState<{ name: string; email: string; password: string } | null>(null)
  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null)
  const [activeDropdownUserId, setActiveDropdownUserId] = useState<string | null>(null)

  const departments = useMemo(() => {
    const set = new Set(users.map((u) => u.department).filter(Boolean))
    return Array.from(set)
  }, [users])

  const stats = useMemo(() => {
    return {
      total: users.length,
      superAdmin: users.filter((u) => u.role === 'SuperAdmin').length,
      divisionAdmin: users.filter((u) => u.role === 'DivisionAdmin').length,
      departmentAdmin: users.filter((u) => u.role === 'DepartmentAdmin').length,
      active: users.filter((u) => u.status === 'active').length,
    }
  }, [users])

  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 30

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedQuery, filterRole, filterDepartment, filterStatus])

  const visible = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    return users.filter((u) => {
      if (
        q &&
        !(
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.position && u.position.toLowerCase().includes(q))
        )
      )
        return false
      if (filterRole !== ALL && u.role !== filterRole) return false
      if (filterDepartment !== ALL && u.department !== filterDepartment) return false
      if (filterStatus !== ALL && u.status !== filterStatus) return false
      return true
    })
  }, [users, debouncedQuery, filterRole, filterDepartment, filterStatus])

  const totalPages = Math.ceil(visible.length / PAGE_SIZE) || 1
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return visible.slice(start, start + PAGE_SIZE)
  }, [visible, currentPage])

  // ── RBAC: only SuperAdmin / DivisionAdmin may manage users ─────────────────────
  if (currentUserRole === 'DepartmentAdmin') {
    return (
      <DashboardLayout title="ຈັດການຜູ້ໃຊ້ງານ">
        <main className="flex flex-col items-center justify-center p-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900">ບໍ່ມີສິດເຂົ້າເຖິງ</h1>
          <p className="mt-2 max-w-md text-center text-sm text-gray-500">
            ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້. ພຽງ ຜູ້ດູແລລະບົບສູງສຸດ ຫຼື Admin ຝ່າຍ ສາມາດຈັດການຜູ້ໃຊ້ງານ.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            ກັບໄປໜ້າຫຼັກ
          </button>
        </main>
      </DashboardLayout>
    )
  }

  function openAddForm() {
    setEditingUser(null)
    setFormOpen(true)
  }

  function openEditForm(user: User) {
    if (currentUserRole !== 'SuperAdmin' && (user.role === 'SuperAdmin' || user.role === 'DivisionAdmin')) {
      pushToast({ title: 'ບໍ່ສາມາດແກ້ໄຂຂໍ້ມູນ SuperAdmin ຫຼື Admin ຝ່າຍ ໄດ້' })
      return
    }
    setEditingUser(user)
    setFormOpen(true)
  }

  async function handleFormSubmit(values: UserFormValues) {
    try {
      if (editingUser) {
        if (currentUserRole !== 'SuperAdmin' && (editingUser.role === 'SuperAdmin' || editingUser.role === 'DivisionAdmin')) {
          pushToast({ title: 'ບໍ່ມີສິດແກ້ໄຂ SuperAdmin ຫຼື Admin ຝ່າຍ' })
          return
        }
        await updateUser(editingUser.id, { ...values })
        // User ID check: sync global auth state ONLY when the edited record is the logged-in user
        if (currentUser && editingUser.id === currentUser.id) {
          const { password: _ignoredPassword, ...profileValues } = values
          void _ignoredPassword
          setCurrentUser(normalizeCurrentUser({ ...currentUser, ...profileValues }))
        }
        pushToast({ title: 'ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້ງານສຳເລັດ' })
      } else {
        if (currentUserRole !== 'SuperAdmin' && (values.role === 'SuperAdmin' || values.role === 'DivisionAdmin')) {
          pushToast({ title: 'ບໍ່ສາມາດສ້າງ SuperAdmin ຫຼື Admin ຝ່າຍ ໄດ້' })
          return
        }
        const created = await addUser(values)
        pushToast({ title: 'ເພີ່ມຜູ້ໃຊ້ງານສຳເລັດ' })
        if (created.temporaryPassword) {
          setTemporaryPasswordUser({
            name: created.name,
            email: created.email,
            password: created.temporaryPassword,
          })
        }
      }
      setFormOpen(false)
      setEditingUser(null)
    } catch (err) {
      console.error('User form submit failed:', err)
      pushToast({ title: 'ດຳເນີນການລົ້ມເຫຼວ, ກະລຸນາລອງໃໝ່' })
    }
  }

  async function handleToggleStatus(user: User) {
    if (currentUserRole !== 'SuperAdmin' && (user.role === 'SuperAdmin' || user.role === 'DivisionAdmin')) {
      pushToast({ title: 'ບໍ່ສາມາດປ່ຽນສະຖານະຂອງ SuperAdmin ຫຼື Admin ຝ່າຍ ໄດ້' })
      return
    }
    await toggleUserStatus(user.id)
    pushToast({
      title: user.status === 'active' ? `ປິດການໃຊ້ງານຂອງ ${user.name}` : `ເປີດການໃຊ້ງານຂອງ ${user.name}`,
    })
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    if (currentUserRole !== 'SuperAdmin' && (deleteTarget.role === 'SuperAdmin' || deleteTarget.role === 'DivisionAdmin')) {
      pushToast({ title: 'ບໍ່ສາມາດລຶບ SuperAdmin ຫຼື Admin ຝ່າຍ ໄດ້' })
      setDeleteTarget(null)
      return
    }
    await removeUser(deleteTarget.id)
    pushToast({ title: 'ລຶບຜູ້ໃຊ້ງານສຳເລັດ' })
    setDeleteTarget(null)
  }

  async function handleResetPassword(userId: string, newPassword: string) {
    try {
      await adminResetPassword(userId, newPassword)
      pushToast({
        title: 'ສຳເລັດ',
        description: 'ປ່ຽນລະຫັດຜ່ານຜູ້ໃຊ້ງານຮຽບຮ້ອຍແລ້ວ',
      })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'ບໍ່ສາມາດປ່ຽນລະຫັດຜ່ານໄດ້'
      pushToast({
        title: 'ເກີດຂໍ້ຜິດພາດ',
        description: msg,
      })
      throw err
    }
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              <div className="text-sm text-gray-500">Admin ຝ່າຍ</div>
              <ShieldCheck size={18} className="text-blue-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">{stats.divisionAdmin}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Admin ພະແນກ</div>
              <ShieldCheck size={18} className="text-emerald-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">{stats.departmentAdmin}</div>
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
                <option value="DivisionAdmin">Admin ຝ່າຍ</option>
                <option value="DepartmentAdmin">Admin ພະແນກ</option>
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
          <div className="overflow-x-auto min-h-[360px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">ຜູ້ໃຊ້ງານ</th>
                  <th className="px-4 py-3">ພະແນກ</th>
                  <th className="px-4 py-3">ສິດນຳໃຊ້</th>
                  <th className="px-4 py-3">ສະຖານະ</th>
                  <th className="px-4 py-3">ເຂົ້າສູ່ລະບົບລ່າສຸດ</th>
                  <th className="px-4 py-3 text-center">ຈັດການ</th>
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
                    paginatedUsers.map((u, idx) => {
                      const isPrivilegedRow = u.role === 'SuperAdmin' || u.role === 'DivisionAdmin'
                      const canManageUser = currentUserRole === 'SuperAdmin' || !isPrivilegedRow
                      const canResetPassword =
                        (currentUserRole === 'SuperAdmin' && u.id !== currentUser?.id) ||
                        (currentUserRole === 'DivisionAdmin' &&
                          u.role === 'DepartmentAdmin' &&
                          u.id !== currentUser?.id &&
                          (!currentUser?.division || !u.division || currentUser.division === u.division))

                      return (
                        <tr key={u.id} className="border-t border-gray-100 align-top">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                name={u.name}
                                avatarUrl={u.avatarUrl}
                                avatarClassName="h-9 w-9"
                                textClassName="text-xs"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-gray-900">{u.name}</span>
                                  {u.position && (
                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                                      {u.position}
                                    </span>
                                  )}
                                </div>
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
                          <td className="px-4 py-3 text-center">
                            <div className="relative inline-flex items-center justify-center">
                              {/* Dropdown Menu Trigger */}
                              <button
                                type="button"
                                onClick={() => setActiveDropdownUserId(activeDropdownUserId === u.id ? null : u.id)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                                  activeDropdownUserId === u.id
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                                title="ຈັດການຜູ້ໃຊ້ງານ"
                              >
                                <span>ຈັດການ</span>
                                <ChevronDown
                                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                    activeDropdownUserId === u.id ? 'rotate-180 text-indigo-600' : 'text-gray-400'
                                  }`}
                                />
                              </button>

                              {/* Dropdown Menu */}
                              {activeDropdownUserId === u.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setActiveDropdownUserId(null)}
                                  />
                                  <div
                                    className={`absolute right-0 ${
                                      idx >= paginatedUsers.length - 2 && paginatedUsers.length > 3
                                        ? 'bottom-full mb-1.5'
                                        : 'top-full mt-1.5'
                                    } z-40 w-48 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 text-left`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveDropdownUserId(null)
                                        setDetailUser(u)
                                      }}
                                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                                    >
                                      <Eye className="h-4 w-4 text-gray-400" />
                                      <span>ເບິ່ງລາຍລະອຽດ</span>
                                    </button>

                                    {canResetPassword && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveDropdownUserId(null)
                                          setResetPasswordTarget(u)
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-50 transition"
                                      >
                                        <KeyRound className="h-4 w-4 text-violet-500" />
                                        <span>ປ່ຽນລະຫັດຜ່ານ</span>
                                      </button>
                                    )}

                                    {canManageUser && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveDropdownUserId(null)
                                          openEditForm(u)
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition"
                                      >
                                        <Pencil className="h-4 w-4 text-indigo-500" />
                                        <span>ແກ້ໄຂຂໍ້ມູນ</span>
                                      </button>
                                    )}

                                    {canManageUser && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveDropdownUserId(null)
                                          handleToggleStatus(u)
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition"
                                      >
                                        {u.status === 'active' ? (
                                          <>
                                            <Lock className="h-4 w-4 text-amber-500" />
                                            <span>ປິດການໃຊ້ງານ</span>
                                          </>
                                        ) : (
                                          <>
                                            <Unlock className="h-4 w-4 text-emerald-500" />
                                            <span>ເປີດການໃຊ້ງານ</span>
                                          </>
                                        )}
                                      </button>
                                    )}

                                    {canManageUser && (
                                      <>
                                        <div className="my-1 border-t border-gray-100" />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveDropdownUserId(null)
                                            setDeleteTarget(u)
                                          }}
                                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                                        >
                                          <Trash2 className="h-4 w-4 text-rose-500" />
                                          <span>ລຶບຜູ້ໃຊ້ງານ</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={visible.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemLabel="ຜູ້ໃຊ້"
          />
        </div>

        <UserDetailModal user={detailUser} open={!!detailUser} onClose={() => setDetailUser(null)} />

        <UserFormModal
          open={formOpen}
          user={editingUser}
          currentUserRole={currentUserRole}
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

        <TemporaryPasswordModal
          user={temporaryPasswordUser}
          open={!!temporaryPasswordUser}
          onClose={() => setTemporaryPasswordUser(null)}
        />

        <ResetPasswordModal
          user={resetPasswordTarget}
          open={!!resetPasswordTarget}
          onClose={() => setResetPasswordTarget(null)}
          onReset={handleResetPassword}
        />
      </main>
    </DashboardLayout>
  )
}