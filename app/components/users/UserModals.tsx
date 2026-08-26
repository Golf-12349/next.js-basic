"use client"
import { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import type { User, UserRole, UserStatus } from '@/types/user'
import { Mail, Phone, Building2, ShieldCheck, Calendar, Clock, Copy, KeyRound } from 'lucide-react'

export const roleStyles: Record<UserRole, string> = {
  SuperAdmin: 'bg-violet-100 text-violet-700',
  Admin: 'bg-indigo-100 text-indigo-700',
  User: 'bg-slate-100 text-slate-700',
}

export const roleLabels: Record<UserRole, string> = {
  SuperAdmin: 'ຜູ້ດູແລລະບົບສູງສຸດ',
  Admin: 'ຜູ້ດູແລລະບົບ',
  User: 'ຜູ້ໃຊ້ງານ',
}

export const statusStyles: Record<UserStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-200 text-gray-600',
}

export const statusLabels: Record<UserStatus, string> = {
  active: 'ໃຊ້ງານຢູ່',
  inactive: 'ບໍ່ໄດ້ໃຊ້ງານ',
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/* ---------------------------------------------------------- */
/* View details modal                                          */
/* ---------------------------------------------------------- */
export function UserDetailModal({
  user,
  open,
  onClose,
}: {
  user: User | null
  open: boolean
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="ລາຍລະອຽດຜູ້ໃຊ້ງານ">
      {user && (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
              {initialsOf(user.name)}
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-500">{user.id}</div>
            </div>
            <div className="ml-auto flex flex-col items-end gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleStyles[user.role]}`}>
                {roleLabels[user.role]}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[user.status]}`}>
                {statusLabels[user.status]}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <Mail size={16} className="mt-0.5 text-gray-400" />
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">ອີເມວ</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{user.email}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <Phone size={16} className="mt-0.5 text-gray-400" />
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">ເບີໂທ</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{user.phone || '-'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <Building2 size={16} className="mt-0.5 text-gray-400" />
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">ພະແນກ</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{user.department}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <ShieldCheck size={16} className="mt-0.5 text-gray-400" />
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">ສິດນຳໃຊ້</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{roleLabels[user.role]}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <Calendar size={16} className="mt-0.5 text-gray-400" />
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">ວັນທີເຂົ້າເຮັດວຽກ</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{user.joinDate}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <Clock size={16} className="mt-0.5 text-gray-400" />
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">ນຳໃຊ້ລ່າສຸດ</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{user.lastActive || '-'}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              ປິດ
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ---------------------------------------------------------- */
/* Add / Edit form modal                                        */
/* ---------------------------------------------------------- */
export type UserFormValues = {
  name: string
  email: string
  phone: string
  role: UserRole
  department: string
  status: UserStatus
}

const emptyForm: UserFormValues = {
  name: '',
  email: '',
  phone: '',
  role: 'User',
  department: '',
  status: 'active',
}

export function UserFormModal({
  open,
  user,
  departments,
  currentUserRole = 'SuperAdmin',
  onClose,
  onSubmit,
}: {
  open: boolean
  user: User | null // null = add mode, otherwise edit mode
  departments: string[]
  currentUserRole?: UserRole
  onClose: () => void
  onSubmit: (values: UserFormValues) => void
}) {
  const [form, setForm] = useState<UserFormValues>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        department: user.department,
        status: user.status,
      })
    } else {
      setForm({
        ...emptyForm,
        role: 'User',
      })
    }
    setError(null)
  }, [open, user, currentUserRole])

  function handleChange<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Determine available roles based on who is performing the action
  const availableRoles: UserRole[] =
    currentUserRole === 'Admin' ? ['Admin', 'User'] : ['SuperAdmin', 'Admin', 'User']

  // If editing a SuperAdmin and viewing user is not SuperAdmin, disallow role demotion / changes
  const isEditingSuperAdmin = user?.role === 'SuperAdmin'
  const isRoleDisabled = isEditingSuperAdmin && currentUserRole !== 'SuperAdmin'

  function handleSubmit() {
    if (!form.name.trim() || !form.email.trim() || !form.department.trim()) {
      setError('ກະລຸນາປ້ອນຊື່, ອີເມວ ແລະ ພະແນກໃຫ້ຄົບຖ້ວນ')
      return
    }

    if (currentUserRole === 'Admin' && form.role === 'SuperAdmin') {
      setError('Admin ບໍ່ມີສິດກຳນົດສິດເປັນ SuperAdmin')
      return
    }

    if (user?.role === 'SuperAdmin' && form.role !== 'SuperAdmin' && currentUserRole !== 'SuperAdmin') {
      setError('ສະເພາະ SuperAdmin ເທົ່ານັ້ນທີ່ສາມາດປ່ຽນສິດຂອງ SuperAdmin ໄດ້')
      return
    }

    onSubmit(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={user ? 'ແກ້ໄຂຜູ້ໃຊ້ງານ' : 'ເພີ່ມຜູ້ໃຊ້ງານ'}>
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ຊື່ ແລະ ນາມສະກຸນ</label>
            <input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="ຊື່ ນາມສະກຸນ"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ອີເມວ</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="name@dms.gov.la"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ເບີໂທ</label>
            <input
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="020 xxxx xxxx"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ພະແນກ</label>
            <input
              value={form.department}
              onChange={(e) => handleChange('department', e.target.value)}
              placeholder="ຝ່າຍ..."
              list="department-suggestions"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
            />
            <datalist id="department-suggestions">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ສິດນຳໃຊ້</label>
            <select
              value={form.role}
              disabled={isRoleDisabled}
              onChange={(e) => handleChange('role', e.target.value as UserRole)}
              className={`w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 ${
                isRoleDisabled ? 'cursor-not-allowed bg-gray-100 opacity-70' : ''
              }`}
            >
              {(availableRoles.includes('SuperAdmin') || isRoleDisabled) && (
                <option value="SuperAdmin">ຜູ້ດູແລລະບົບສູງສຸດ (SuperAdmin)</option>
              )}
              {availableRoles.includes('Admin') && (
                <option value="Admin">ຜູ້ດູແລລະບົບ (Admin)</option>
              )}
              {availableRoles.includes('User') && (
                <option value="User">ຜູ້ໃຊ້ງານ (User)</option>
              )}
            </select>
            {isRoleDisabled && (
              <p className="mt-1 text-xs text-amber-600">
                ບໍ່ສາມາດປ່ຽນສິດຂອງ SuperAdmin ໄດ້ (ສະເພາະ SuperAdmin ເທົ່ານັ້ນ)
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ສະຖານະ</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value as UserStatus)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
            >
              <option value="active">ໃຊ້ງານຢູ່</option>
              <option value="inactive">ບໍ່ໄດ້ໃຊ້ງານ</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            ຍົກເລີກ
          </button>
          <button onClick={handleSubmit} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            {user ? 'ບັນທຶກການແກ້ໄຂ' : 'ບັນທຶກ'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function AddUserModal({
  open,
  departments,
  currentUserRole = 'SuperAdmin',
  onClose,
  onSubmit,
}: {
  open: boolean
  departments: string[]
  currentUserRole?: UserRole
  onClose: () => void
  onSubmit: (values: UserFormValues) => void
}) {
  return (
    <UserFormModal
      open={open}
      user={null}
      departments={departments}
      currentUserRole={currentUserRole}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}

export function EditUserModal({
  open,
  user,
  departments,
  currentUserRole = 'SuperAdmin',
  onClose,
  onSubmit,
}: {
  open: boolean
  user: User | null
  departments: string[]
  currentUserRole?: UserRole
  onClose: () => void
  onSubmit: (values: UserFormValues) => void
}) {
  return (
    <UserFormModal
      open={open}
      user={user}
      departments={departments}
      currentUserRole={currentUserRole}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}

/* ---------------------------------------------------------- */
/* Delete confirmation modal                                    */
/* ---------------------------------------------------------- */
export function DeleteUserModal({
  user,
  open,
  onClose,
  onConfirm,
}: {
  user: User | null
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="ຢືນຢັນການລຶບຜູ້ໃຊ້ງານ">
      {user && (
        <div>
          <p className="mb-4 text-sm text-gray-600">
            ທ່ານຕ້ອງການລຶບຜູ້ໃຊ້ງານ <span className="font-semibold text-gray-900">{user.name}</span> ({user.email}) ແທ້ບໍ?
            ການດຳເນີນການນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              ຍົກເລີກ
            </button>
            <button onClick={onConfirm} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
              ຢືນຢັນລຶບ
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ---------------------------------------------------------- */
/* Temporary password modal (ສະແດງຄັ້ງດຽວຕອນສ້າງຜູ້ໃຊ້ໃໝ່)      */
/* ---------------------------------------------------------- */
export function TemporaryPasswordModal({
  user,
  open,
  onClose,
}: {
  user: { name: string; email: string; password: string } | null
  open: boolean
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  async function handleCopy() {
    if (!user) return
    try {
      await navigator.clipboard.writeText(user.password)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="ສ້າງຜູ້ໃຊ້ງານສຳເລັດ">
      {user && (
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            ລະຫັດຜ່ານນີ້ຈະສະແດງແຄ່ຄັ້ງດຽວ ກະລຸນາຄັດລອກ ແລະ ສົ່ງໃຫ້ <span className="font-semibold">{user.name}</span> ({user.email}) ດ້ວຍຕົນເອງ
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ລະຫັດຜ່ານຊົ່ວຄາວ</label>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <KeyRound size={16} className="text-gray-400" />
                <code className="text-sm font-mono text-gray-900">{user.password}</code>
              </div>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Copy size={14} />
                {copied ? 'ຄັດລອກແລ້ວ' : 'ຄັດລອກ'}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              ປິດ
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}