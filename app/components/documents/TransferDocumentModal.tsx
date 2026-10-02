'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Phone,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import Modal from '@/app/components/ui/Modal'
import { pushToast } from '@/app/components/ui/Toast'
import { useUsers } from '@/app/(main)/context/UsersContext'
import { edlStructure, roleLabel, type CurrentUser, type User } from '@/types/user'
import type { Document } from '@/types/document'
import { transferDocument } from '@/lib/dms/documentService'

interface TransferDocumentModalProps {
  open: boolean
  doc: Document | null
  currentUser: CurrentUser | null
  onClose: () => void
  onSuccess?: () => void
}

const norm = (value?: string | null) => (value ?? '').trim().toLowerCase()
const deptKey = (division: string, department: string) => `${norm(division)}||${norm(department)}`

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function TransferDocumentModal({
  open,
  doc,
  currentUser,
  onClose,
  onSuccess,
}: TransferDocumentModalProps) {
  const isDeptAdmin = currentUser?.role === 'DepartmentAdmin'
  const { users } = useUsers()

  const [toDivision, setToDivision] = useState<string>('')
  const [toDepartment, setToDepartment] = useState<string>('')
  const [query, setQuery] = useState<string>('')
  const [showResults, setShowResults] = useState<boolean>(false)
  const [membersOpen, setMembersOpen] = useState<boolean>(false)
  const [note, setNote] = useState<string>('')
  const [keepCopy, setKeepCopy] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const searchBoxRef = useRef<HTMLDivElement>(null)

  // Initialize or reset form when modal opens or doc changes
  useEffect(() => {
    if (doc && open) {
      const defaultDiv = isDeptAdmin
        ? currentUser?.division || doc.division || Object.keys(edlStructure)[0]
        : doc.division || currentUser?.division || Object.keys(edlStructure)[0]
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the transfer form when the modal opens
      setToDivision(defaultDiv)
      setToDepartment('')
      setQuery('')
      setShowResults(false)
      setMembersOpen(false)
      setNote('')
      setKeepCopy(false)
    }
  }, [doc, open, isDeptAdmin, currentUser])

  // Available departments in the chosen division
  const availableDepartments = toDivision ? (edlStructure[toDivision] ?? []) : []

  // Check if cross-division
  const isCrossDivision = Boolean(
    doc?.division && toDivision && norm(doc.division) !== norm(toDivision),
  )

  // ---------- ໄອເດຍ C: ຊ່ອງຄົ້ນຫາດຽວ + ໂຊວ໌ຄົນຮັບປາຍທາງ ----------
  // ປິດລາຍການຜົນຄົ້ນຫາເມື່ອຄລິກນອກກ່ອງຄົ້ນຫາ
  useEffect(() => {
    if (!showResults) return
    const onPointerDown = (e: PointerEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [showResults])
  // ---------- ຂໍ້ມູນຜູ້ໃຊ້: ຈັດກຸ່ມສະມາຊິກຕາມ ຝ່າຍ+ພະແນກ ----------
  // ແຜນທີ່ສະມາຊິກ (active ເທົ່ານັ້ນ) ຈັດກຸ່ມຕາມ ຝ່າຍ+ພະແນກ, Admin ຝ່າຍແຍກຕ່າງຫາກ
  const usersLoaded = users.length > 0
  const membersByDept = useMemo(() => {
    const map = new Map<string, User[]>()
    for (const u of users) {
      if (u.status !== 'active') continue
      if (!u.division || !u.department) continue
      const key = deptKey(u.division, u.department)
      const list = map.get(key)
      if (list) list.push(u)
      else map.set(key, [u])
    }
    return map
  }, [users])
  const divisionAdmins = useMemo(() => {
    const map = new Map<string, User[]>()
    for (const u of users) {
      if (u.status !== 'active') continue
      if (u.role !== 'DivisionAdmin' || !u.division) continue
      const key = norm(u.division)
      const list = map.get(key)
      if (list) list.push(u)
      else map.set(key, [u])
    }
    return map
  }, [users])

  const deptMembers = (division: string, department: string): User[] =>
    membersByDept.get(deptKey(division, department)) ?? []

  // ຜູ້ອະນຸມັດປາຍທາງ: Admin ພະແນກ (ເນັ້ນຫົວໜ້າກ່ອນ) → Admin ຝ່າຍ → ບໍ່ມີໃຜ
  const deptApprover = (
    division: string,
    department: string,
  ): { user: User | null; scope: 'department' | 'division' | 'none' } => {
    const members = deptMembers(division, department)
    const deptAdmins = members.filter((m) => m.role === 'DepartmentAdmin')
    if (deptAdmins.length > 0) {
      const head = deptAdmins.find((m) => (m.position ?? '').trim() === 'ຫົວໜ້າ')
      return { user: head ?? deptAdmins[0], scope: 'department' }
    }
    const divAdmins = divisionAdmins.get(norm(division)) ?? []
    if (divAdmins.length > 0) return { user: divAdmins[0], scope: 'division' }
    return { user: null, scope: 'none' }
  }

  // ປາຍທາງທັງໝົດ (ທຸກຝ່າຍ × ທຸກພະແນກໃນຝ່າຍນັ້ນ)
  const allDestinations = useMemo(
    () =>
      Object.entries(edlStructure).flatMap(([division, departments]) =>
        departments.map((department) => ({ division, department })),
      ),
    [],
  )

  const searchText = query.trim().toLowerCase()
  // ກັ່ນຕອງຕາມຊື່ພະແນກ / ຝ່າຍ
  const matchedDestinations = useMemo(() => {
    if (!searchText) return allDestinations.slice(0, 8)
    return allDestinations
      .filter(
        (d) => norm(d.department).includes(searchText) || norm(d.division).includes(searchText),
      )
      .slice(0, 8)
  }, [searchText, allDestinations])
  // ກັ່ນຕອງຕາມຊື່ຄົນ — ເລືອກຄົນແລ້ວໂມດູນຈະເລືອກພະແນກຂອງຄົນນັ້ນໃຫ້ເອງ
  const matchedPeople = useMemo((): (User & { division: string })[] => {
    if (!searchText) return []
    return users
      .filter(
        (u): u is User & { division: string } =>
          u.status === 'active' && Boolean(u.division) && norm(u.name).includes(searchText),
      )
      .slice(0, 5)
  }, [searchText, users])

  const pickDestination = (division: string, department: string) => {
    setToDivision(division)
    setToDepartment(department)
    setQuery('')
    setShowResults(false)
    setMembersOpen(false)
  }

  const selectedMembers =
    toDivision && toDepartment ? deptMembers(toDivision, toDepartment) : []
  const selectedApprover =
    toDivision && toDepartment
      ? deptApprover(toDivision, toDepartment)
      : { user: null as User | null, scope: 'none' as const }
  // ມີ Admin ຮັບຫຼືບໍ່ — ຖ້າໂຫຼດຂໍ້ມູນຜູ້ໃຊ້ແລ້ວ ແລະ ຍັງບໍ່ມີຜູ້ຮັບ → ບລັອກປຸ່ມສົ່ງ
  const approverMissing = usersLoaded && Boolean(toDepartment) && !selectedApprover.user
  const canSubmit = Boolean(toDepartment) && !approverMissing && !submitting

  if (!open || !doc) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!doc) return

    if (!toDivision.trim()) {
      pushToast({ title: 'ກະລຸນາເລືອກຝ່າຍປາຍທາງ' })
      return
    }

    if (!toDepartment.trim()) {
      pushToast({ title: 'ກະລຸນາເລືອກພະແນກປາຍທາງ' })
      return
    }

    if (
      doc.department &&
      toDepartment.trim().toLowerCase() === doc.department.trim().toLowerCase() &&
      doc.division &&
      toDivision.trim().toLowerCase() === doc.division.trim().toLowerCase()
    ) {
      pushToast({ title: 'ບໍ່ສາມາດສົ່ງໄປຫາພະແນກ ແລະ ຝ່າຍເດີມໄດ້' })
      return
    }

    // RBAC validation: Dept admin cannot send cross-division
    if (isDeptAdmin && isCrossDivision) {
      pushToast({
        title: 'ບໍ່ມີສິດສົ່ງຂ້າມຝ່າຍ',
        description: 'ສະເພາະ Admin ຝ່າຍ ຈຶ່ງສາມາດສົ່ງເອກະສານຂ້າມຝ່າຍໄດ້',
      })
      return
    }

    // ບລັອກການສົ່ງໄປຫາພະແນກທີ່ບໍ່ມີຜູ້ຮັບ (ເມື່ອໂຫຼດຂໍ້ມູນຜູ້ໃຊ້ແລ້ວ)
    if (usersLoaded && !selectedApprover.user) {
      pushToast({
        title: 'ພະແນກປາຍທາງຍັງບໍ່ມີຜູ້ຮັບ',
        description: `${toDepartment} ບໍ່ມີສະມາຊິກ active — ກະລຸນາເລືອກພະແນກອື່ນ`,
      })
      return
    }

    setSubmitting(true)
    try {
      await transferDocument(doc.id, {
        toDivision,
        toDepartment,
        note: note.trim() || undefined,
        keepCopy,
      })

      pushToast({
        title: 'ສົ່ງເອກະສານສຳເລັດ',
        description: keepCopy
          ? `ສົ່ງເອກະສານແລ້ວ (ພ້ອມເກັບສຳເນົາໄວ້ກັບພະແນກເຮົາ) ແລະ ກຳລັງລໍຖ້າການອະນຸມັດຈາກ ${isCrossDivision ? 'Admin ຝ່າຍ ' + toDivision : 'Admin ພະແນກ ' + toDepartment}`
          : `ເອກະສານກຳລັງລໍຖ້າການອະນຸມັດຈາກ ${isCrossDivision ? 'Admin ຝ່າຍ ' + toDivision : 'Admin ພະແນກ ' + toDepartment}`,
      })
      onClose()
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ເກີດຂໍ້ຜິດພາດໃນການສົ່ງເອກະສານ'
      pushToast({
        title: 'ບໍ່ສາມາດສົ່ງເອກະສານໄດ້',
        description: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || msg,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🔄 ສົ່ງເອກະສານຂ້າມພະແນກ"
      scrollBody={true}
      footer={
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>ກຳລັງສົ່ງ...</span>
              </>
            ) : (
              <span>{keepCopy ? 'ຢືນຢັນການສົ່ງ (ເກັບສຳເນົາໄວ້)' : 'ຢືນຢັນການສົ່ງ'}</span>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document summary box */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-500">ເອກະສານທີ່ຕ້ອງການສົ່ງ</div>
          <div className="mt-1 text-base font-semibold text-gray-900">{doc.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
            <span>ເລກທີ: <strong className="text-gray-800">{doc.docNumber}</strong></span>
            <span>ຝ່າຍປະຈຸບັນ: <strong className="text-gray-800">{doc.division || 'ບໍ່ລະບຸ'}</strong></span>
            <span>ພະແນກປະຈຸບັນ: <strong className="text-gray-800">{doc.department || 'ບໍ່ລະບຸ'}</strong></span>
          </div>
        </div>

        {/* Notice for DeptAdmin */}
        {isDeptAdmin && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            ℹ️ <strong>ໝາຍເຫດສຳລັບ Admin ພະແນກ:</strong> ທ່ານສາມາດສົ່ງເອກະສານໄດ້ສະເພາະພະແນກພາຍໃນຝ່າຍດຽວກັນ ({currentUser?.division || doc.division || 'ຝ່າຍຂອງທ່ານ'}). ຫາກຕ້ອງການສົ່ງຂ້າມຝ່າຍ ກະລຸນາແຈ້ງ Admin ຝ່າຍ ເປັນຜູ້ດຳເນີນການ.
          </div>
        )}

        {/* Workflow indicator badge */}
        {toDepartment && (
          <div className={`rounded-lg border p-3 text-xs ${
            isCrossDivision
              ? 'border-purple-200 bg-purple-50 text-purple-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}>
            {isCrossDivision ? (
              <div>
                🌐 <strong>ການສົ່ງຂ້າມຝ່າຍ:</strong> ເອກະສານຈະຖືກສົ່ງໄປຫາ <strong>Admin ຝ່າຍ ({toDivision})</strong> ເພື່ອລໍຖ້າການກວດສອບ ແລະ ອະນຸມັດຮັບເຂົ້າ.
              </div>
            ) : (
              <div>
                🏢 <strong>ການສົ່ງພາຍໃນຝ່າຍ:</strong> ເອກະສານຈະຖືກສົ່ງໄປຫາ <strong>Admin ພະແນກ ({toDepartment})</strong> ເພື່ອລໍຖ້າການອະນຸມັດຮັບເຂົ້າ.
              </div>
            )}
          </div>
        )}

        {/* ---------- ໄອເດຍ C: ຊ່ອງຄົ້ນຫາດຽວ ຄົ້ນຊື່ພະແນກ/ຝ່າຍ ---------- */}
        <div ref={searchBoxRef} className="relative">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            🔍 ຄົ້ນຫາພະແນກປາຍທາງ
          </label>
          <div className="relative mt-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowResults(true)
                setMembersOpen(false)
              }}
              onFocus={() => setShowResults(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matchedDestinations[0]) {
                  pickDestination(matchedDestinations[0].division, matchedDestinations[0].department)
                }
                if (e.key === 'Escape') setShowResults(false)
              }}
              placeholder="ພິມຊື່ພະແນກ, ຊື່ຝ່າຍ, ຫຼື ຊື່ຄົນ ເພື່ອຄົ້ນຫາປາຍທາງ..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {(query || toDepartment) && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setShowResults(false)
                  setMembersOpen(false)
                }}
                aria-label="ລ້າງການຄົ້ນຫາ"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* ຜົນຄົ້ນຫາ */}
          {showResults && searchText && (
            <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              {matchedPeople.length === 0 && matchedDestinations.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">
                  ບໍ່ພົບພະແນກ/ຝ່າຍ/ຄົນທີ່ກົງກັບ “{query.trim()}” — ລອງພິມຄຳອື່ນ
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {matchedPeople.length > 0 && (
                    <div>
                      <p className="sticky top-0 bg-gray-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        👤 ຄົນ ({matchedPeople.length})
                      </p>
                      <ul className="divide-y divide-gray-100">
                        {matchedPeople.map((person) => {
                          const isCurrent =
                            doc?.department &&
                            norm(person.department) === norm(doc.department) &&
                            norm(person.division) === norm(doc?.division)
                          return (
                            <li key={person.id}>
                              <button
                                type="button"
                                disabled={Boolean(isCurrent)}
                                onClick={() => pickDestination(person.division, person.department)}
                                className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition ${
                                  isCurrent ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                                  {initialsOf(person.name)}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-gray-900">
                                    {person.name}
                                  </span>
                                  <span className="block truncate text-xs text-gray-500">
                                    {roleLabel(person.role)} · {person.department} ({person.division})
                                  </span>
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                  {matchedDestinations.length > 0 && (
                    <div>
                      <p className="sticky top-0 bg-gray-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        🏢 ພະແນກ / ຝ່າຍ ({matchedDestinations.length})
                      </p>
                      <ul className="divide-y divide-gray-100">
                        {matchedDestinations.map(({ division, department }) => {
                          const { user } = deptApprover(division, department)
                          const count = deptMembers(division, department).length
                          const isCurrent =
                            doc?.department &&
                            norm(department) === norm(doc.department) &&
                            norm(division) === norm(doc?.division)
                          const isSelected =
                            toDepartment === department && norm(toDivision) === norm(division)
                          return (
                            <li key={`${division}||${department}`}>
                              <button
                                type="button"
                                disabled={Boolean(isCurrent)}
                                onClick={() => pickDestination(division, department)}
                                className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition ${
                                  isCurrent
                                    ? 'cursor-not-allowed opacity-50'
                                    : isSelected
                                      ? 'bg-indigo-50'
                                      : 'hover:bg-gray-50'
                                }`}
                              >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                  {initialsOf(department)}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                                    <span className="truncate">{department}</span>
                                    {isSelected && <Check size={14} className="shrink-0 text-indigo-600" />}
                                  </span>
                                  <span className="block truncate text-xs text-gray-500">
                                    {division}
                                    {user
                                      ? ` · ຜູ້ຮັບ: ${user.name}`
                                      : usersLoaded
                                        ? ' · ⚠️ ຍັງບໍ່ມີຜູ້ຮັບ'
                                        : ''}
                                    {count > 0 && ` · ${count} ຄົນ`}
                                    {isCurrent ? ' · (ພະແນກປະຈຸບັນ)' : ''}
                                  </span>
                                </span>
                                <ChevronDown size={15} className="-rotate-90 shrink-0 text-gray-300" />
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <p className="mt-1 text-[11px] text-gray-500">
            ເລືອກຈາກລາຍການ → ລະບົບຈະຕື່ມຝ່າຍ/ພະແນກຂ້າງລຸ່ມໃຫ້ເອງ
          </p>
        </div>

        {/* Destination Division */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            ຝ່າຍ / ຫ້ອງການ ປາຍທາງ <span className="text-rose-500">*</span>
          </label>
          {isDeptAdmin ? (
            <input
              type="text"
              readOnly
              disabled
              value={toDivision}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 cursor-not-allowed"
            />
          ) : (
            <select
              value={toDivision}
              onChange={(e) => {
                setToDivision(e.target.value)
                setToDepartment('')
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">— ເລືອກຝ່າຍປາຍທາງ —</option>
              {Object.keys(edlStructure).map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Destination Department */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            ພະແນກ / ສູນ ປາຍທາງ <span className="text-rose-500">*</span>
          </label>
          <select
            value={toDepartment}
            onChange={(e) => setToDepartment(e.target.value)}
            disabled={!toDivision}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">— ເລືອກພະແນກປາຍທາງ —</option>
            {availableDepartments.map((dept) => {
              const isCurrent = Boolean(
                doc.department &&
                dept.trim().toLowerCase() === doc.department.trim().toLowerCase() &&
                !isCrossDivision
              )
              return (
                <option key={dept} value={dept} disabled={isCurrent}>
                  {dept} {isCurrent ? '(ພະແນກປະຈຸບັນ)' : ''}
                </option>
              )
            })}
          </select>
        </div>
        {/* ---------- ໄອເດຍ C: ກາດສະຫຼຸບຜູ້ຮັບປາຍທາງ ---------- */}
        {toDepartment ? (
          <div
            className={`rounded-xl border p-3.5 ${
              !usersLoaded
                ? 'border-gray-200 bg-gray-50/60'
                : selectedApprover.user
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : 'border-rose-200 bg-rose-50/70'
            }`}
          >
            {!usersLoaded ? (
              <p className="text-xs text-gray-500">ກຳລັງໂຫຼດຂໍ້ມູນຜູ້ຮັບປາຍທາງ...</p>
            ) : selectedApprover.user ? (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    👤 ຜູ້ຮັບປາຍທາງ
                  </p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    ມີຜູ້ຮັບ
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    {initialsOf(selectedApprover.user.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{selectedApprover.user.name}</p>
                    <p className="truncate text-xs text-gray-600">
                      {roleLabel(selectedApprover.user.role)} · {toDepartment}
                    </p>
                  </div>
                  <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
                </div>
                {selectedApprover.user.phone && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                    <Phone size={12} className="shrink-0" />
                    <span className="truncate">{selectedApprover.user.phone}</span>
                  </p>
                )}
                {isCrossDivision && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-800">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>ສົ່ງຂ້າມຝ່າຍ — ຕ້ອງລໍຖ້າ Admin ຝ່າຍປາຍທາງອະນຸມັດ (ອາດໃຊ້ເວລາດົນກວ່າປົກກະຕິ)</span>
                  </p>
                )}
                {selectedMembers.length > 1 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setMembersOpen((v) => !v)}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <Users size={13} />+{selectedMembers.length - 1} ຄົນໃນພະແນກນີ້
                      <ChevronDown
                        size={13}
                        className={`transition-transform ${membersOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {membersOpen && (
                      <ul className="mt-2 max-h-32 space-y-1.5 overflow-y-auto rounded-lg bg-white/70 p-2">
                        {selectedMembers
                          .filter((m: User) => m.id !== selectedApprover.user?.id)
                          .slice(0, 8)
                          .map((m: User) => (
                            <li key={m.id} className="flex items-center gap-2 text-xs">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-700">
                                {initialsOf(m.name)}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-medium text-gray-800">
                                {m.name}
                              </span>
                              <span className="shrink-0 text-[10px] text-gray-500">
                                {roleLabel(m.role)}
                              </span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-rose-600" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                    ⚠️ ພະແນກນີ້ຍັງບໍ່ມີຜູ້ຮັບ
                  </p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-rose-700">
                  {toDepartment} ({toDivision}) ບໍ່ມີສະມາຊິກ active — ເອກະສານທີ່ສົ່ງໄປຈະບໍ່ມີຄົນກົດອະນຸມັດ.
                  ກະລຸນາເລືອກພະແນກອື່ນ.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 px-3.5 py-3">
            <p className="text-xs text-gray-500">
              👆 ຄົ້ນຫາ ຫຼື ເລືອກພະແນກປາຍທາງ — ລະບົບຈະສະແດງວ່າໃຜເປັນຄົນຮັບເອກະສານໃຫ້ເຫັນກ່ອນກົດຢືນຢັນ
            </p>
          </div>
        )}

        {/* Transfer Note */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            ໝາຍເຫດ / ເຫດຜົນການສົ່ງ
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ລະບຸລາຍລະອຽດ ຫຼື ຈຸດປະສົງການສົ່ງຕໍ່ເອກະສານ..."
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Keep copy option */}
        <div className={`rounded-xl border p-3.5 transition ${
          keepCopy
            ? 'border-indigo-300 bg-indigo-50/70 shadow-sm'
            : 'border-gray-200 bg-gray-50/60 hover:bg-gray-50'
        }`}>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepCopy}
              onChange={(e) => setKeepCopy(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="text-xs">
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                <span>📑 ເກັບສຳເນົາເອກະສານໄວ້ກັບເຮົາ (Keep a copy)</span>
                {keepCopy && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                    ເປີດໃຊ້ງານ
                  </span>
                )}
              </div>
              <p className="mt-1 text-gray-600 leading-relaxed">
                ຫາກເລືອກຕົວເລືອກນີ້, ເມື່ອປາຍທາງອະນຸມັດຮັບເອກະສານ, ລະບົບຈະຮັກສາສຳເນົາເອກະສານຊຸດນີ້ໄວ້ໃນພະແນກ ແລະ ຕູ້ເດີມຂອງທ່ານ (ເອກະສານຈະບໍ່ຫາຍໄປຈາກພະແນກ).
              </p>
            </div>
          </label>
        </div>
      </form>
    </Modal>
  )
}

