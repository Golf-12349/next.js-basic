"use client"
import { useEffect, useRef, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import type { User, UserRole, UserStatus } from '@/types/user'
import { edlStructure, USER_POSITIONS } from '@/types/user'
import {
  Mail,
  Phone,
  Building2,
  Network,
  ShieldCheck,
  Calendar,
  Clock,
  Copy,
  KeyRound,
  Eye,
  EyeOff,
  Camera,
  Palette,
  Check,
  Trash2,
  Briefcase,
} from 'lucide-react'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const EMAIL_FORMAT_ERROR = 'ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ (ຕົວຢ່າງ: name@gmail.com)'

export const roleStyles: Record<UserRole, string> = {
  SuperAdmin: 'bg-violet-100 text-violet-700',
  DivisionAdmin: 'bg-blue-100 text-blue-700',
  DepartmentAdmin: 'bg-emerald-100 text-emerald-700',
}

export const roleLabels: Record<UserRole, string> = {
  SuperAdmin: 'ຜູ້ດູແລລະບົບສູງສຸດ',
  DivisionAdmin: 'Admin ຝ່າຍ',
  DepartmentAdmin: 'Admin ພະແນກ',
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
/* EDL 11-division helpers + shared avatar component            */
/* ---------------------------------------------------------- */

export const edlDivisions = Object.keys(edlStructure)

/** ສີທີ່ສາມາດເລືອກໄດ້ສຳລັບ avatar ແບບສີ */
export const avatarColors = [
  '#4F46E5', // indigo-600
  '#7C3AED', // violet-600
  '#0EA5E9', // sky-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#EC4899', // pink-500
  '#0891B2', // cyan-600
]

/** ບອກວ່າ avatarUrl ເປັນຮູບ (URL / data URL) ຫຼື ບໍ່ */
export function isAvatarImage(avatarUrl?: string): boolean {
  if (!avatarUrl) return false
  return /^(https?:|data:|blob:)/i.test(avatarUrl.trim())
}

/** ຊອກຫາຝ່າຍ/ຫ້ອງການ ທີ່ພະແນກ/ສູນ ນັ້ນຂຶ້ນກັບ (ໃຊ້ກັບຂໍ້ມູນເກົ່າທີ່ມີແຕ່ department) */
export function findDivisionForDepartment(department: string): string | null {
  if (!department) return null
  const dept = department.trim()
  for (const [division, departments] of Object.entries(edlStructure)) {
    if (departments.includes(dept)) return division
  }
  return null
}

/** Avatar ທີ່ຮອງຮັບທັງຮູບ ແລະ ສີ */
export function UserAvatar({
  name,
  avatarUrl,
  avatarClassName = '',
  textClassName = 'text-xs',
}: {
  name: string
  avatarUrl?: string
  avatarClassName?: string
  textClassName?: string
}) {
  if (isAvatarImage(avatarUrl)) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={avatarUrl} alt={name} className={`shrink-0 rounded-full object-cover ${avatarClassName}`} />
    )
  }
  const bgColor = avatarUrl && avatarUrl.trim().startsWith('#') ? avatarUrl.trim() : undefined
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white ${avatarClassName}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      <span className={textClassName}>{initialsOf(name)}</span>
    </div>
  )
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
            <UserAvatar
              name={user.name}
              avatarUrl={user.avatarUrl}
              avatarClassName="h-14 w-14"
              textClassName="text-lg"
            />
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
                <div className="text-xs uppercase tracking-wide text-gray-500">ຝ່າຍ / ຫ້ອງການ / ສະຖາບັນ</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{user.division || '-'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <Network size={16} className="mt-0.5 text-gray-400" />
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">ພະແນກ / ສູນ</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{user.department}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <Briefcase size={16} className="mt-0.5 text-gray-400" />
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">ຕຳແໜ່ງ</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{user.position || '-'}</div>
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
  division: string
  department: string
  position: string
  status: UserStatus
  avatarUrl: string
  password: string
}

const emptyForm: UserFormValues = {
  name: '',
  email: '',
  phone: '',
  role: 'DepartmentAdmin',
  division: '',
  department: '',
  position: '',
  status: 'active',
  avatarUrl: '',
  password: '',
}

export function UserFormModal({
  open,
  user,
  currentUserRole = 'SuperAdmin',
  onClose,
  onSubmit,
}: {
  open: boolean
  user: User | null // null = add mode, otherwise edit mode
  currentUserRole?: UserRole
  onClose: () => void
  onSubmit: (values: UserFormValues) => void
}) {
  const [form, setForm] = useState<UserFormValues>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const timeoutId = window.setTimeout(() => {
      setForm(
        user
          ? {
              name: user.name,
              email: user.email,
              phone: user.phone || '',
              role: user.role,
              division: user.division || findDivisionForDepartment(user.department) || '',
              department: user.department,
              position: user.position || '',
              status: user.status,
              avatarUrl: user.avatarUrl || '',
              password: '',
            }
          : { ...emptyForm, role: 'DepartmentAdmin' }
      )
      setShowPassword(false)
      setError(null)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [open, user, currentUserRole])

  function handleChange<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleDivisionChange(division: string) {
    setForm((prev) => {
      const available = division ? (edlStructure[division] ?? []) : []
      let department = available.includes(prev.department) ? prev.department : ''
      // ຖ້າເປັນ Admin ຝ່າຍ, ຕັ້ງຄ່າເລີ່ມຕົ້ນໃຫ້ອັດຕະໂນມັດເປັນພະແນກທຳອິດຂອງຝ່າຍນັ້ນ
      if (prev.role === 'DivisionAdmin' && available.length > 0) {
        department = available[0]
      }
      return { ...prev, division, department }
    })
  }

  function handleRoleChange(role: UserRole) {
    setForm((prev) => {
      let department = prev.department
      // ຖ້າປ່ຽນສິດເປັນ Admin ຝ່າຍ ແລະ ໄດ້ເລືອກຝ່າຍແລ້ວ, ຕັ້ງພະແນກເປັນຄ່າເລີ່ມຕົ້ນ
      if (role === 'DivisionAdmin' && prev.division) {
        const available = edlStructure[prev.division] ?? []
        if (available.length > 0 && (!department || !available.includes(department))) {
          department = available[0]
        }
      }
      return { ...prev, role, department }
    })
  }

  function handleAvatarFile(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleChange('avatarUrl', reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Determine available roles based on who is performing the action
  const availableRoles: UserRole[] =
    currentUserRole === 'DivisionAdmin'
      ? ['DepartmentAdmin']
      : ['SuperAdmin', 'DivisionAdmin', 'DepartmentAdmin']

  // If editing a SuperAdmin or DivisionAdmin and viewing user is not SuperAdmin, disallow role changes
  const isEditingSuperAdmin = user?.role === 'SuperAdmin'
  const isEditingDivisionAdmin = user?.role === 'DivisionAdmin'
  const isRoleDisabled =
    (isEditingSuperAdmin && currentUserRole !== 'SuperAdmin') ||
    (isEditingDivisionAdmin && currentUserRole !== 'SuperAdmin')

  function handleSubmit() {
    let finalDepartment = form.department.trim()
    if (form.role === 'DivisionAdmin' && !finalDepartment && form.division.trim()) {
      const available = edlStructure[form.division.trim()] ?? []
      if (available.length > 0) {
        finalDepartment = available[0]
      }
    }

    if (!form.name.trim() || !form.email.trim()) {
      setError('ກະລຸນາປ້ອນຊື່ ແລະ ອີເມວ')
      return
    }

    if (form.role !== 'SuperAdmin') {
      if (!form.division.trim()) {
        setError('ກະລຸນາເລືອກຝ່າຍ/ຫ້ອງການ')
        return
      }
      if (form.role === 'DepartmentAdmin' && !finalDepartment) {
        setError('ກະລຸນາເລືອກພະແນກ/ສູນ')
        return
      }
    }

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      setError(EMAIL_FORMAT_ERROR)
      return
    }

    if (!user && form.password.length < 6) {
      setError('ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ໂຕອັກສອນ')
      return
    }

    if (currentUserRole === 'DivisionAdmin' && (form.role === 'SuperAdmin' || form.role === 'DivisionAdmin')) {
      setError('Admin ຝ່າຍ ສາມາດກຳນົດສິດໄດ້ສະເພາະ Admin ພະແນກ ເທົ່ານັ້ນ')
      return
    }

    if (user?.role === 'SuperAdmin' && form.role !== 'SuperAdmin' && currentUserRole !== 'SuperAdmin') {
      setError('ສະເພາະ SuperAdmin ເທົ່ານັ້ນທີ່ສາມາດປ່ຽນສິດຂອງ SuperAdmin ໄດ້')
      return
    }

    onSubmit({ ...form, department: finalDepartment })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'ແກ້ໄຂຜູ້ໃຊ້ງານ' : 'ເພີ່ມຜູ້ໃຊ້ງານ'}
      footer={
        <div className="flex w-full justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            ຍົກເລີກ
          </button>
          <button onClick={handleSubmit} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            {user ? 'ບັນທຶກການແກ້ໄຂ' : 'ບັນທຶກ'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        )}

        {/* Avatar upload / picker */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-3">
          <UserAvatar
            name={form.name || '?'}
            avatarUrl={form.avatarUrl}
            avatarClassName="h-16 w-16 ring-2 ring-indigo-100"
            textClassName="text-xl"
          />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <Camera size={14} />
                ອັບໂຫຼດຮູບ
              </button>
              {form.avatarUrl && (
                <button
                  type="button"
                  onClick={() => handleChange('avatarUrl', '')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                >
                  <Trash2 size={14} />
                  ລຶບຮູບ
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-0.5 inline-flex items-center gap-1 text-xs text-gray-500">
                <Palette size={13} />
                ສີ:
              </span>
              {avatarColors.map((c) => {
                const selected = form.avatarUrl === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleChange('avatarUrl', c)}
                    aria-label={`ເລືອກສີ ${c}`}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                      selected ? 'border-gray-900 ring-2 ring-indigo-200' : 'border-gray-100'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {selected && <Check size={11} className="text-white" />}
                  </button>
                )
              })}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleAvatarFile(e.target.files?.[0])}
          />
        </div>

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
            <label className="mb-1 block text-sm font-medium text-gray-700">ຕຳແໜ່ງ</label>
            <select
              value={form.position}
              onChange={(e) => handleChange('position', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
            >
              <option value="">— ເລືອກຕຳແໜ່ງ —</option>
              {USER_POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">ຝ່າຍ / ຫ້ອງການ / ສະຖາບັນ</label>
            <select
              value={form.division}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
            >
              <option value="">— ເລືອກຝ່າຍ / ຫ້ອງການ —</option>
              {edlDivisions.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                ພະແນກ / ສູນ
              </label>
              {form.role === 'DivisionAdmin' && (
                <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  ກຳນົດຄ່າເລີ່ມຕົ້ນອັດຕະໂນມັດສຳລັບ Admin ຝ່າຍ
                </span>
              )}
            </div>
            <select
              value={form.department}
              disabled={!form.division || form.role === 'SuperAdmin'}
              onChange={(e) => handleChange('department', e.target.value)}
              className={`w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 ${
                !form.division || form.role === 'SuperAdmin' ? 'cursor-not-allowed bg-gray-100 opacity-70' : ''
              }`}
            >
              <option value="">{form.division ? '— ເລືອກພະແນກ / ສູນ —' : '— ເລືອກຝ່າຍກ່ອນ —'}</option>
              {(form.division ? (edlStructure[form.division] ?? []) : []).map((dept, idx) => (
                <option key={dept} value={dept}>
                  {dept} {idx === 0 && form.role === 'DivisionAdmin' ? '(ຄ່າເລີ່ມຕົ້ນ / Default)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ສິດນຳໃຊ້</label>
            <select
              value={form.role}
              disabled={isRoleDisabled}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className={`w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 ${
                isRoleDisabled ? 'cursor-not-allowed bg-gray-100 opacity-70' : ''
              }`}
            >
              {(availableRoles.includes('SuperAdmin') || isRoleDisabled) && (
                <option value="SuperAdmin">ຜູ້ດູແລລະບົບສູງສຸດ (SuperAdmin)</option>
              )}
              {availableRoles.includes('DivisionAdmin') && (
                <option value="DivisionAdmin">Admin ຝ່າຍ (DivisionAdmin)</option>
              )}
              {availableRoles.includes('DepartmentAdmin') && (
                <option value="DepartmentAdmin">Admin ພະແນກ (DepartmentAdmin)</option>
              )}
            </select>
            {isRoleDisabled && (
              <p className="mt-1 text-xs text-amber-600">
                ບໍ່ສາມາດປ່ຽນສິດຂອງ SuperAdmin / Admin ຝ່າຍ ໄດ້ (ສະເພາະ SuperAdmin ເທົ່ານັ້ນ)
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
          {!user && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">ລະຫັດຜ່ານ</label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="ຢ່າງໜ້ອຍ 6 ໂຕອັກສອນ"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pl-9 pr-10 text-sm text-gray-800 outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ໂຕອັກສອນ (ສະແດງຄັ້ງດຽວຕອນສ້າງຜູ້ໃຊ້ໃໝ່)</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export function AddUserModal({
  open,
  currentUserRole = 'SuperAdmin',
  onClose,
  onSubmit,
}: {
  open: boolean
  currentUserRole?: UserRole
  onClose: () => void
  onSubmit: (values: UserFormValues) => void
}) {
  return (
    <UserFormModal
      open={open}
      user={null}
      currentUserRole={currentUserRole}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}

export function EditUserModal({
  open,
  user,
  currentUserRole = 'SuperAdmin',
  onClose,
  onSubmit,
}: {
  open: boolean
  user: User | null
  currentUserRole?: UserRole
  onClose: () => void
  onSubmit: (values: UserFormValues) => void
}) {
  return (
    <UserFormModal
      open={open}
      user={user}
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
    if (!open) {
      const timeoutId = window.setTimeout(() => setCopied(false), 0)
      return () => window.clearTimeout(timeoutId)
    }
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

/* ---------------------------------------------------------- */
/* Reset password modal (SuperAdmin & DivisionAdmin ປ່ຽນໃຫ້)   */
/* ---------------------------------------------------------- */
export function ResetPasswordModal({
  user,
  open,
  onClose,
  onReset,
}: {
  user: User | null
  open: boolean
  onClose: () => void
  onReset: (userId: string, newPassword: string) => Promise<void>
}) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setNewPassword('')
      setConfirmPassword('')
      setError(null)
      setShowPassword(false)
      setLoading(false)
    }
  }, [open])

  function handleGeneratePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
    let pwd = ''
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(pwd)
    setConfirmPassword(pwd)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    if (!newPassword || newPassword.length < 6) {
      setError('ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 6 ໂຕອັກສອນ')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('ລະຫັດຜ່ານຢືນຢັນບໍ່ຕົງກັນ')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await onReset(user.id, newPassword)
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'ເກີດຂໍ້ຜິດພາດໃນການປ່ຽນລະຫັດຜ່ານ'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="ປ່ຽນລະຫັດຜ່ານຜູ້ໃຊ້ງານ">
      {user && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 flex items-center gap-3">
            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} avatarClassName="h-11 w-11 text-sm font-semibold rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 truncate text-sm">{user.name}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleStyles[user.role]}`}>
                  {roleLabels[user.role]}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">ລະຫັດຜ່ານໃໝ່</label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                ສຸ່ມລະຫັດຜ່ານ
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="ລະບຸລະຫັດຜ່ານໃໝ່ (ຢ່າງໜ້ອຍ 6 ໂຕອັກສອນ)"
                className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">ຢືນຢັນລະຫັດຜ່ານໃໝ່</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (error) setError(null)
              }}
              placeholder="ຢືນຢັນລະຫັດຜ່ານໃໝ່ອີກຄັ້ງ"
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <KeyRound size={15} />
              {loading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກລະຫັດຜ່ານ'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
