'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../../context/DocumentsContext'
import { useCurrentUser } from '../../context/CurrentUserContext'
import { useUsers } from '../../context/UsersContext'
import type { Document, DocumentDirection, DocumentStatus } from '@/types/document'
import type { User } from '@/types/user'
import { edlStructure } from '@/types/user'
import { useDebounce } from '@/hooks/useDebounce'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import Pagination from '@/app/components/ui/Pagination'
import { pushToast } from '@/app/components/ui/Toast'
import DirectionBadge, { resolveDirection } from '@/app/components/documents/DirectionBadge'
import CategoryBadge from '@/app/components/documents/CategoryBadge'
import { UserAvatar, roleLabels, roleStyles } from '@/app/components/users/UserModals'
import { addDays, LAO_MONTHS, percentage, toDateKey } from '@/app/components/dashboard/dashboard-utils'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  History,
  Search,
  Upload,
} from 'lucide-react'

type Scope = 'mine' | 'all'
type DirectionFilter = 'ALL' | DocumentDirection
type StatusFilter = 'ALL' | DocumentStatus
type DateRangeFilter = 'all' | 'today' | 'last7' | 'month'

const PAGE_SIZE = 15

const statusStyles: Record<DocumentStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-gray-200 text-gray-700',
  expired: 'bg-rose-100 text-rose-700 font-semibold',
}

const statusLabels: Record<DocumentStatus, string> = {
  draft: 'ຮ່າງ',
  pending: 'ລໍຖ້າອະນຸມັດ',
  approved: 'ອະນຸມັດແລ້ວ',
  archived: 'ເກັບເຂົ້າຄັງ',
  expired: '🔴 ໝົດອາຍຸ',
}

const fileTypeLabels: Record<Document['fileType'], string> = {
  pdf: 'PDF',
  doc: 'DOC',
  image: 'IMAGE',
}

const fileTypeStyles: Record<Document['fileType'], string> = {
  pdf: 'bg-rose-50 text-rose-700 ring-rose-100',
  doc: 'bg-blue-50 text-blue-700 ring-blue-100',
  image: 'bg-violet-50 text-violet-700 ring-violet-100',
}

const DIRECTION_FILTERS: { value: DirectionFilter; label: string }[] = [
  { value: 'ALL', label: 'ທັງໝົດ' },
  { value: 'inbound', label: 'ຂາເຂົ້າ' },
  { value: 'outbound', label: 'ຂາອອກ' },
]

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'ທັງໝົດ' },
  { value: 'pending', label: 'ລໍຖ້າອະນຸມັດ' },
  { value: 'approved', label: 'ອະນຸມັດແລ້ວ' },
  { value: 'draft', label: 'ຮ່າງ' },
  { value: 'archived', label: 'ເກັບເຂົ້າຄັງ' },
  { value: 'expired', label: 'ໝົດອາຍຸ' },
]

const DATE_FILTERS: { value: DateRangeFilter; label: string }[] = [
  { value: 'all', label: 'ທັງໝົດ' },
  { value: 'today', label: 'ມື້ນີ້' },
  { value: 'last7', label: '7 ວັນຜ່ານມາ' },
  { value: 'month', label: 'ເດືອນນີ້' },
]

/**
 * ຈັດຮູບແບບ ວັນທີ + ເວລາ ຂອງການອັບໂຫຼດ ເປັນ `DD/MM/YYYY, HH:mm`
 * ຖ້າ backend ສົ່ງມາແຕ່ວັນທີ (ບໍ່ມີເວລາ) ຈະສະແດງແຕ່ວັນທີ — ບໍ່ເດົາເວລາເອງ
 */
function formatUploadStamp(uploadedAt?: string, uploadDate?: string): { date: string; time: string | null } {
  const raw = (uploadedAt || uploadDate || '').trim()
  if (!raw) return { date: '—', time: null }
  const hasTime = raw.length > 10 || /\d{2}:\d{2}/.test(raw)
  const parsed = new Date(hasTime ? raw : `${raw}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return { date: raw, time: null }
  const dd = String(parsed.getDate()).padStart(2, '0')
  const mm = String(parsed.getMonth() + 1).padStart(2, '0')
  const yyyy = parsed.getFullYear()
  const hh = String(parsed.getHours()).padStart(2, '0')
  const mi = String(parsed.getMinutes()).padStart(2, '0')
  return { date: `${dd}/${mm}/${yyyy}`, time: hasTime ? `${hh}:${mi}` : null }
}

/** ລຳດັບສະຖານທີ່ເກັບ (ຄັງ › ຕູ້ › ຊັ້ນວາງ › ແຟ້ມ) ສຳລັບ breadcrumb */
function locationParts(doc: Document): string[] {
  return [doc.warehouseName, doc.cabinetName, doc.shelfName, doc.folderName]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
}

/** ຄີສຳລັບຈັດລຳດັບ (ໃໝ່ສຸດກ່ອນ) ໂດຍໃຊ້ timestamp ຖ້າມີ ບໍ່ັ້ນໃຊ້ວັນທີ */
function sortKey(doc: Document): string {
  return (doc.uploadedAt || doc.uploadDate || '').replace('T', ' ').slice(0, 16)
}

export default function UploadHistoryPage() {
  const { documents, reload } = useDocuments()
  const { user: currentUser } = useCurrentUser()
  const { users } = useUsers()

  useEffect(() => {
    void reload()
  }, [reload])

  const [scope, setScope] = useState<Scope>('mine')

  // ສິດເບິ່ງປະຫວັດຂອງທຸກຜູ້ໃຊ້ — SuperAdmin (ທັງໝົດ) ແລະ DivisionAdmin (ລະດັບຝ່າຍ)
  const canViewAll = currentUser?.role === 'SuperAdmin' || currentUser?.role === 'DivisionAdmin'
  const effectiveScope: Scope = canViewAll ? scope : 'mine'

  const [query, setQuery] = useState('')
  const [filterDirection, setFilterDirection] = useState<DirectionFilter>('ALL')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL')
  const [filterDivision, setFilterDivision] = useState<string>('ທັງໝົດ')
  const [filterDepartment, setFilterDepartment] = useState<string>('ທັງໝົດ')
  const [range, setRange] = useState<DateRangeFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const debouncedQuery = useDebounce(query, 250)

  // ຝ່າຍ ແລະ ພະແນກ ທີ່ມີໃນລະບົບ
  const divisions = useMemo(() => Object.keys(edlStructure), [])
  const departments = useMemo(() => {
    if (filterDivision === 'ທັງໝົດ') {
      const set = new Set<string>()
      Object.values(edlStructure).forEach((list) => list.forEach((d) => set.add(d)))
      return Array.from(set)
    }
    return edlStructure[filterDivision] || []
  }, [filterDivision])

  // ສະສົມຜູ້ໃຊ້ເພື່ອສະແດງ ອີເມວ + ບົດບາດ ຄຽງກັບຊື່ຜູ້ອັບໂຫຼດ
  const usersById = useMemo(() => {
    const map = new Map<string, User>()
    users.forEach((u) => map.set(u.id, u))
    return map
  }, [users])

  const usersByName = useMemo(() => {
    const map = new Map<string, User>()
    users.forEach((u) => {
      if (u.name) map.set(u.name.trim().toLowerCase(), u)
      if (u.email) map.set(u.email.trim().toLowerCase(), u)
    })
    return map
  }, [users])

  function resolveUploader(doc: Document): User | undefined {
    if (doc.uploadedById) {
      const byId = usersById.get(doc.uploadedById)
      if (byId) return byId
    }
    const key = typeof doc.uploadedBy === 'string' ? doc.uploadedBy.trim().toLowerCase() : ''
    return key ? usersByName.get(key) : undefined
  }

  // ເອກະສານຂອງຂ້ອຍ — ຈັບຄູ່ດ້ວຍ id ກ່ອນ ແລ້ວຈຶ່ງ fallback ດ້ວຍ ຊື່/ອີເມວ (ຮອງຮັບເອກະສານເກົ່າ)
  const myDocuments = useMemo(() => {
    if (!currentUser) return []
    const name = currentUser.name?.trim().toLowerCase()
    const email = currentUser.email?.trim().toLowerCase()
    return documents.filter((d) => {
      if (d.deleted) return false
      if (d.uploadedById && d.uploadedById === currentUser.id) return true
      const uploadedBy = typeof d.uploadedBy === 'string' ? d.uploadedBy.trim().toLowerCase() : ''
      return Boolean(uploadedBy && (uploadedBy === name || uploadedBy === email))
    })
  }, [documents, currentUser])

  const scopedDocuments = useMemo(
    () => (effectiveScope === 'mine' ? myDocuments : documents.filter((d) => !d.deleted)),
    [documents, myDocuments, effectiveScope],
  )

  const stats = useMemo(() => {
    const now = new Date()
    const monthPrefix = toDateKey(now).slice(0, 7)
    const total = scopedDocuments.length
    const monthly = scopedDocuments.filter((d) => d.uploadDate.slice(0, 7) === monthPrefix).length
    const approved = scopedDocuments.filter((d) => d.status === 'approved').length
    return {
      total,
      monthly,
      approved,
      approvedPct: percentage(approved, total),
      monthlyPct: percentage(monthly, total),
      monthLabel: LAO_MONTHS[now.getMonth()],
    }
  }, [scopedDocuments])

  const filtered = useMemo(() => {
    const today = toDateKey(new Date())
    const weekStart = toDateKey(addDays(new Date(), -6))
    const monthPrefix = today.slice(0, 7)
    const q = debouncedQuery.trim().toLowerCase()
    return scopedDocuments
      .filter((d) => {
        if (q && !(d.title.toLowerCase().includes(q) || d.docNumber.toLowerCase().includes(q))) return false
        if (filterDirection !== 'ALL' && resolveDirection(d) !== filterDirection) return false
        if (filterStatus !== 'ALL' && d.status !== filterStatus) return false
        if (filterDivision !== 'ທັງໝົດ' && d.division !== filterDivision) return false
        if (filterDepartment !== 'ທັງໝົດ' && d.department !== filterDepartment) return false
        if (range === 'today' && d.uploadDate !== today) return false
        if (range === 'last7' && (d.uploadDate < weekStart || d.uploadDate > today)) return false
        if (range === 'month' && d.uploadDate.slice(0, 7) !== monthPrefix) return false
        return true
      })
      .sort((a, b) => sortKey(b).localeCompare(sortKey(a)))
  }, [scopedDocuments, debouncedQuery, filterDirection, filterStatus, filterDivision, filterDepartment, range])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )

  function handleDownload(doc: Document) {
    const url = doc.pdfUrl?.trim() || doc.fileUrl?.trim() || ''
    if (!url || url === '#') {
      pushToast({ title: 'ບໍ່ພົບລິ້ງໄຟລ໌ຂອງເອກະສານ' })
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
    pushToast({ title: 'ກຳລັງດາວໂຫຼດເອກະສານ' })
  }

  const previewStamp = formatUploadStamp(previewDoc?.uploadedAt, previewDoc?.uploadDate)

  return (
    <DashboardLayout title="ປະຫວັດການອັບໂຫຼດເອກະສານ">
      <div className="w-full min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
        {/* ── Header + scope tabs ─────────────────────────────── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <History className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">ປະຫວັດການອັບໂຫຼດເອກະສານ</h1>
              <p className="mt-1 text-sm text-slate-500">
                ຕິດຕາມ ແລະ ກວດສອບລາຍການເອກະສານທີ່ມີການອັບໂຫຼດເຂົ້າສູ່ລະບົບ
              </p>
            </div>
          </div>

          {/* Scope toggle: ເອກະສານຂອງຂ້ອຍ / ປະຫວັດທັງໝົດ */}
          <div className="inline-flex w-fit items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => {
                setScope('mine')
                setCurrentPage(1)
              }}
              aria-pressed={effectiveScope === 'mine'}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
                effectiveScope === 'mine'
                  ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ເອກະສານຂອງຂ້ອຍ
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {myDocuments.length}
              </span>
            </button>
            {canViewAll && (
              <button
                type="button"
                onClick={() => {
                  setScope('all')
                  setCurrentPage(1)
                }}
                aria-pressed={effectiveScope === 'all'}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  effectiveScope === 'all'
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ປະຫວັດທັງໝົດ
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {documents.filter((d) => !d.deleted).length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ── Metric cards ────────────────────────────────────── */}
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {/* Card 1 — ອັບໂຫຼດທັງໝົດ */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 p-6 text-white shadow-lg shadow-indigo-200/50">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-white/10 blur-xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-100">ອັບໂຫຼດທັງໝົດ</p>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight">{stats.total}</span>
                  <span className="text-sm font-medium text-indigo-200">ເອກະສານ</span>
                </div>
              </div>
              <span className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
                <Upload className="h-5 w-5" />
              </span>
            </div>
            <div className="relative mt-3 text-xs font-medium text-indigo-100">
              {effectiveScope === 'mine'
                ? 'ນັບສະເພາະເອກະສານທີ່ທ່ານອັບໂຫຼດ'
                : 'ນັບທຸກເອກະສານຈາກທຸກຜູ້ໃຊ້ໃນລະບົບ'}
            </div>
          </div>

          {/* Card 2 — ອັບໂຫຼດໃນເດືອນນີ້ */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">ອັບໂຫຼດໃນເດືອນນີ້</p>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">{stats.monthly}</span>
                  <span className="text-sm font-medium text-slate-400">ເອກະສານ</span>
                </div>
              </div>
              <span className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 ring-1 ring-indigo-100">
                <CalendarDays className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 text-xs font-medium text-slate-500">
              {stats.monthLabel} · ກວມ {stats.monthlyPct}% ຂອງທັງໝົດ
            </div>
            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                style={{ width: `${stats.monthlyPct}%` }}
              />
            </div>
          </div>

          {/* Card 3 — ອະນຸມັດແລ້ວ */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">ອະນຸມັດແລ້ວ</p>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">{stats.approved}</span>
                  <span className="text-sm font-medium text-emerald-600">{stats.approvedPct}%</span>
                </div>
              </div>
              <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 text-xs font-medium text-slate-500">
              {stats.approved} ຈາກ {stats.total} ເອກະສານ ຖືກອະນຸມັດແລ້ວ
            </div>
            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${stats.approvedPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Filters bar ─────────────────────────────────────── */}
        <div className="w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {/* Search by title / doc number */}
            <div className="sm:col-span-2 md:col-span-3 xl:col-span-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ຄົ້ນຫາ</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="ຊື່ ຫຼື ເລກທີເອກະສານ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Direction filter */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ທິດທາງ</label>
              <select
                value={filterDirection}
                onChange={(e) => {
                  setFilterDirection(e.target.value as DirectionFilter)
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                {DIRECTION_FILTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ສະຖານະ</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as StatusFilter)
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                {STATUS_FILTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Division filter (ຝ່າຍ) */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ຝ່າຍ</label>
              <select
                value={filterDivision}
                onChange={(e) => {
                  setFilterDivision(e.target.value)
                  setFilterDepartment('ທັງໝົດ')
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ທັງໝົດ">ຝ່າຍທັງໝົດ</option>
                {divisions.map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            {/* Department filter (ພະແນກ) */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ພະແນກ</label>
              <select
                value={filterDepartment}
                onChange={(e) => {
                  setFilterDepartment(e.target.value)
                  setCurrentPage(1)
                }}
                disabled={filterDivision === 'ທັງໝົດ' && departments.length === 0}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="ທັງໝົດ">ພະແນກທັງໝົດ</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Date range filter */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ຊ່ວງວັນທີ</label>
              <select
                value={range}
                onChange={(e) => {
                  setRange(e.target.value as DateRangeFilter)
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                {DATE_FILTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-600">ພົບ {filtered.length} ລາຍການ</span>
              <span className="text-slate-300">·</span>
              <span>
                {effectiveScope === 'mine' ? 'ຂອບເຂດ: ເອກະສານຂອງຂ້ອຍ' : 'ຂອບເຂດ: ທຸກຜູ້ໃຊ້'}
              </span>
            </div>
            {(query || filterDirection !== 'ALL' || filterStatus !== 'ALL' || filterDivision !== 'ທັງໝົດ' || filterDepartment !== 'ທັງໝົດ' || range !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setFilterDirection('ALL')
                  setFilterStatus('ALL')
                  setFilterDivision('ທັງໝົດ')
                  setFilterDepartment('ທັງໝົດ')
                  setRange('all')
                  setCurrentPage(1)
                }}
                className="font-medium text-indigo-600 transition hover:text-indigo-800"
              >
                ລ້າງຕົວກອງ
              </button>
            )}
          </div>
        </div>

        {/* ── History table ───────────────────────────────────── */}
        <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 whitespace-nowrap">ວັນທີ & ເວລາອັບໂຫຼດ</th>
                  <th className="px-4 py-3 min-w-[220px]">ເອກະສານ</th>
                  <th className="px-4 py-3 whitespace-nowrap">ທິດທາງ & ໝວດໝູ່</th>
                  <th className="px-4 py-3 whitespace-nowrap">ຝ່າຍ</th>
                  <th className="px-4 py-3 whitespace-nowrap">ພະແນກ</th>
                  <th className="px-4 py-3 whitespace-nowrap">ຜູ້ອັບໂຫຼດ</th>
                  <th className="px-4 py-3 whitespace-nowrap">ສະຖານະ</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">ການກະທຳ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.map((doc) => {
                  const stamp = formatUploadStamp(doc.uploadedAt, doc.uploadDate)
                  const place = locationParts(doc)
                  const uploader = resolveUploader(doc)
                  return (
                    <tr key={doc.id} className="transition-colors hover:bg-slate-50/60">
                      {/* 1 — ວັນທີ & ເວລາອັບໂຫຼດ */}
                      <td className="whitespace-nowrap px-4 py-3 align-top">
                        <div className="font-medium text-slate-900">
                          {stamp.date}
                          {stamp.time ? <span className="text-slate-500">, {stamp.time}</span> : null}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {stamp.time ? 'ເວລາອັບໂຫຼດ' : 'ບໍ່ມີຂໍ້ມູນເວລາ'}
                        </div>
                      </td>

                      {/* 2 — ເອກະສານ */}
                      <td className="px-4 py-3 align-top min-w-[220px]">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                            <FileText className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900 break-words">{doc.title}</span>
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 whitespace-nowrap ${fileTypeStyles[doc.fileType]}`}
                              >
                                {fileTypeLabels[doc.fileType]}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span className="font-medium text-slate-600">{doc.docNumber || '—'}</span>
                              <span>{doc.fileSize && doc.fileSize !== '-' ? doc.fileSize : '—'}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {place.length > 0 ? place.join(' › ') : 'ຍັງບໍ່ໄດ້ຈັດເກັບ'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3 — ທິດທາງ & ໝວດໝູ່ */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <DirectionBadge direction={doc.direction} category={doc.category} />
                          <CategoryBadge category={doc.category} />
                        </div>
                      </td>

                      {/* 4 — ຝ່າຍ */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {doc.division ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            🏢 {doc.division}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* 5 — ພະແນກ */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {doc.department ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/80 px-2.5 py-1 text-xs font-medium text-indigo-700">
                            🏬 {doc.department}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* 6 — ຜູ້ອັບໂຫຼດ */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            name={doc.uploadedBy || '—'}
                            avatarUrl={uploader?.avatarUrl}
                            avatarClassName="h-9 w-9 bg-indigo-100 text-indigo-700"
                            textClassName="text-xs font-bold"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900">
                              {doc.uploadedBy || '—'}
                            </div>
                            <div className="truncate text-xs text-slate-500">{uploader?.email || '—'}</div>
                            {uploader ? (
                              <span
                                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleStyles[uploader.role]}`}
                              >
                                {roleLabels[uploader.role]}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* 7 — ສະຖານະ */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[doc.status]}`}
                        >
                          {statusLabels[doc.status]}
                        </span>
                      </td>

                      {/* 8 — ການກະທຳ */}
                      <td className="px-4 py-3 align-top whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            ເບິ່ງ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <Download className="h-3.5 w-3.5" />
                            ດາວໂຫຼດ
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="border-t border-slate-100 px-6 py-14 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <History className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-600">ຍັງບໍ່ມີປະຫວັດການອັບໂຫຼດ</p>
              <p className="mt-1 text-xs text-slate-400">
                {effectiveScope === 'mine'
                  ? 'ເມື່ອທ່ານອັບໂຫຼດເອກະສານ ລາຍການຈະປາກົດຢູ່ນີ້'
                  : 'ບໍ່ພົບລາຍການຕາມຕົວກອງທີ່ເລືອກ'}
              </p>
            </div>
          )}
        </div>

        {/* ── Pagination ──────────────────────────────────────── */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />

        {/* ── Document preview modal ──────────────────── */}
        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.title}
          scrollBody={false}
          footer={
            previewDoc && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  ປິດ
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  ດາວໂຫຼດ
                </button>
              </div>
            )
          }
        >
          {previewDoc && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <div>
                  <div className="text-xs text-gray-500">ເລກທີ</div>
                  <div className="text-sm font-semibold">{previewDoc.docNumber || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ໝວດໝູ່</div>
                  <div className="text-sm font-semibold">{previewDoc.category || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ຝ່າຍ</div>
                  <div className="text-sm font-semibold">{previewDoc.division || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ພະແນກ</div>
                  <div className="text-sm font-semibold">{previewDoc.department || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ວັນທີ & ເວລາອັບໂຫຼດ</div>
                  <div className="text-sm font-semibold">
                    {previewStamp.date}
                    {previewStamp.time ? `, ${previewStamp.time}` : ''}
                  </div>
                </div>
              </div>
              <DocumentPreview doc={previewDoc} heightClassName="min-h-0 flex-1" />
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}