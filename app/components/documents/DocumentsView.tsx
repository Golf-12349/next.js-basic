'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import type { Document, DocumentDirection, DocumentStatus } from '@/types/document'
import type { User } from '@/types/user'
import { edlStructure } from '@/types/user'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocuments } from '@/app/(main)/context/DocumentsContext'
import { useUploadModal } from '@/app/(main)/context/UploadModalContext'
import { useArchive } from '@/app/(main)/context/ArchiveContext'
import { useCurrentUser } from '@/app/(main)/context/CurrentUserContext'
import { useMasterData } from '@/app/(main)/context/MasterDataContext'
import { useUsers } from '@/app/(main)/context/UsersContext'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import Pagination from '@/app/components/ui/Pagination'
import { pushToast } from '@/app/components/ui/Toast'
import DirectionBadge, { resolveDirection } from '@/app/components/documents/DirectionBadge'
import CategoryBadge from '@/app/components/documents/CategoryBadge'
import { UserAvatar, roleLabels, roleStyles } from '@/app/components/users/UserModals'
import DocumentJourneyModal from '@/app/components/documents/DocumentJourneyModal'
import ManageCategoryModal from '@/app/components/documents/ManageCategoryModal'
import SelectStorageLocationModal from '@/app/components/documents/SelectStorageLocationModal'
import RenewExpiryModal from '@/app/components/documents/RenewExpiryModal'
import EditDocumentModal from '@/app/components/documents/EditDocumentModal'
import { addDays, LAO_MONTHS, percentage, toDateKey } from '@/app/components/dashboard/dashboard-utils'
import {
  Archive,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  History,
  Layers,
  Pencil,
  RefreshCw,
  Route,
  Search,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react'

export type Scope = 'mine' | 'all'
export type DirectionFilter = 'ALL' | DocumentDirection
export type DateRangeFilter = 'all' | 'today' | 'last7' | 'month'

const PAGE_SIZE = 25

const statusStyles: Record<DocumentStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80',
  pending: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200/80',
  approved: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80',
  archived: 'bg-gray-200 text-gray-700 ring-1 ring-gray-300',
  expired: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200/80 font-semibold',
}

const statusLabels: Record<DocumentStatus, string> = {
  draft: 'ຮ່າງ',
  pending: 'ລໍຖ້າອະນຸມັດ',
  approved: 'ອະນຸມັດ',
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
  { value: 'ALL', label: 'ທິດທາງທັງໝົດ' },
  { value: 'inbound', label: 'ຂາເຂົ້າ' },
  { value: 'outbound', label: 'ຂາອອກ' },
]

const DATE_FILTERS: { value: DateRangeFilter; label: string }[] = [
  { value: 'all', label: 'ວັນທີທັງໝົດ' },
  { value: 'today', label: 'ມື້ນີ້' },
  { value: 'last7', label: '7 ວັນຜ່ານມາ' },
  { value: 'month', label: 'ເດືອນນີ້' },
]

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

function locationParts(doc: Document): string[] {
  return [doc.warehouseName, doc.cabinetName, doc.shelfName, doc.folderName]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
}

function sortKey(doc: Document): string {
  return (doc.uploadedAt || doc.uploadDate || '').replace('T', ' ').slice(0, 16)
}

export interface DocumentsViewProps {
  initialScope?: Scope
  pageTitle?: string
  pageDescription?: string
}

export function DocumentsView({
  initialScope = 'all',
  pageTitle = 'ເອກະສານທັງໝົດ',
  pageDescription = 'ລະບົບບໍລິຫານ, ຕິດຕາມ ແລະ ຈັດການເອກະສານທັງໝົດໃນລະບົບ DMS',
}: DocumentsViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { openUpload } = useUploadModal()
  const { documents, categories, addCategory, removeCategory, deleteDocument, reload } = useDocuments()
  const { user: currentUser } = useCurrentUser()
  const { warehouses, cabinets, assignDocument } = useArchive()
  const { tags: masterTags } = useMasterData()
  const { users } = useUsers()

  useEffect(() => {
    void reload()
  }, [reload])

  // ຮອງຮັບການສົ່ງຕໍ່ຈາກ /documents?upload=open
  useEffect(() => {
    if (searchParams.get('upload') !== 'open') return
    openUpload()
    const clean = new URLSearchParams(window.location.search)
    clean.delete('upload')
    const qs = clean.toString()
    router.replace(qs ? `${window.location.pathname}?${qs}` : window.location.pathname)
  }, [searchParams, openUpload, router])

  // Scope: ເອກະສານຂອງຂ້ອຍ / ເອກະສານທັງໝົດ
  const scopeFromUrl = searchParams.get('scope') as Scope | null
  const [scope, setScope] = useState<Scope>(scopeFromUrl || initialScope)
  const [prevScopeUrl, setPrevScopeUrl] = useState(scopeFromUrl)

  if (scopeFromUrl !== prevScopeUrl) {
    setPrevScopeUrl(scopeFromUrl)
    if (scopeFromUrl === 'mine' || scopeFromUrl === 'all') {
      setScope(scopeFromUrl)
    }
  }

  const canViewAll = currentUser?.role === 'SuperAdmin' || currentUser?.role === 'DivisionAdmin'
  const effectiveScope: Scope = canViewAll ? scope : (scope === 'mine' ? 'mine' : 'all')

  // Search parameter sync
  const searchParam = searchParams.get('search') || ''
  const [prevSearchParam, setPrevSearchParam] = useState(searchParam)
  const [query, setQuery] = useState(searchParam)

  if (searchParam !== prevSearchParam) {
    setPrevSearchParam(searchParam)
    setQuery(searchParam)
  }

  const warehouseParam = searchParams.get('warehouse') || ''
  const [filterWarehouse, setFilterWarehouse] = useState(warehouseParam === 'unassigned' ? 'unassigned' : 'ທັງໝົດ')
  const [filterDirection, setFilterDirection] = useState<DirectionFilter>('ALL')
  const [filterCategory, setFilterCategory] = useState('ທັງໝົດ')
  const [filterCabinet, setFilterCabinet] = useState('ທັງໝົດ')
  const [filterStatus, setFilterStatus] = useState('ທັງໝົດ')
  const [filterDivision, setFilterDivision] = useState('ທັງໝົດ')
  const [filterDepartment, setFilterDepartment] = useState('ທັງໝົດ')
  const [filterTag, setFilterTag] = useState('ທັງໝົດ')
  const [filterDateRange, setFilterDateRange] = useState<DateRangeFilter>('all')

  const [currentPage, setCurrentPage] = useState(1)
  const debouncedQuery = useDebounce(query, 250)

  // Modals state
  const [storageDoc, setStorageDoc] = useState<Document | null>(null)
  const [renewDoc, setRenewDoc] = useState<Document | null>(null)
  const [editDoc, setEditDoc] = useState<Document | null>(null)
  const [journeyDoc, setJourneyDoc] = useState<Document | null>(null)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [detailDoc, setDetailDoc] = useState<Document | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null)
  const [manageCategoryOpen, setManageCategoryOpen] = useState(false)
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)

  // ຜູ້ໃຊ້ສຳລັບສະແດງ Avatar + ບົດບາດ ໃນຕາຕະລາງ
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

  // ຕູ້ເອກະສານຕາມສິດ
  const visibleCabinets = useMemo(() => {
    if (currentUser?.role === 'DepartmentAdmin' && currentUser.department) {
      const userDept = currentUser.department.trim().toLowerCase()
      return cabinets.filter((c) => c.department?.trim().toLowerCase() === userDept)
    }
    if (currentUser?.role === 'DivisionAdmin' && currentUser.division) {
      return cabinets.filter((c) => !c.division || c.division === currentUser.division)
    }
    return cabinets
  }, [cabinets, currentUser])

  // ຝ່າຍ ແລະ ພະແນກ
  const divisions = useMemo(() => Object.keys(edlStructure), [])
  const departments = useMemo(() => {
    if (filterDivision === 'ທັງໝົດ') {
      const set = new Set<string>()
      Object.values(edlStructure).forEach((list) => list.forEach((d) => set.add(d)))
      return Array.from(set)
    }
    return edlStructure[filterDivision] || []
  }, [filterDivision])

  // ເອກະສານຂອງຂ້ອຍ
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

  const unassignedCount = useMemo(() => {
    return documents.filter(
      (d) =>
        !d.deleted &&
        d.status !== 'pending' &&
        !(
          d.warehouseId ||
          d.cabinetId ||
          d.shelfId ||
          d.folderId ||
          d.warehouseName ||
          d.cabinetName ||
          d.shelfName ||
          d.folderName
        ),
    ).length
  }, [documents])

  const stats = useMemo(() => {
    const now = new Date()
    const monthPrefix = toDateKey(now).slice(0, 7)
    const total = scopedDocuments.length
    const monthly = scopedDocuments.filter((d) => (d.uploadDate || '').slice(0, 7) === monthPrefix).length
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

  // Filtered documents
  const filtered = useMemo(() => {
    const today = toDateKey(new Date())
    const weekStart = toDateKey(addDays(new Date(), -6))
    const monthPrefix = today.slice(0, 7)
    const q = debouncedQuery.trim().toLowerCase()

    return scopedDocuments
      .filter((d) => {
        if (q) {
          const matchesTitleOrNum = d.title.toLowerCase().includes(q) || d.docNumber.toLowerCase().includes(q)
          const matchesTag = Array.isArray(d.tags) && d.tags.some((t) => t.toLowerCase().includes(q))
          if (!matchesTitleOrNum && !matchesTag) return false
        }
        if (filterDirection !== 'ALL' && resolveDirection(d) !== filterDirection) return false
        if (filterWarehouse !== 'ທັງໝົດ') {
          if (filterWarehouse === 'unassigned') {
            const hasLocation = Boolean(
              d.warehouseId ||
              d.cabinetId ||
              d.shelfId ||
              d.folderId ||
              d.warehouseName ||
              d.cabinetName ||
              d.shelfName ||
              d.folderName
            )
            if (hasLocation) return false
          } else if (d.warehouseId !== filterWarehouse) {
            return false
          }
        }
        if (filterCategory !== 'ທັງໝົດ' && d.category !== filterCategory) return false
        if (filterCabinet !== 'ທັງໝົດ' && d.cabinetId !== filterCabinet) return false
        if (filterTag !== 'ທັງໝົດ') {
          if (!Array.isArray(d.tags) || !d.tags.includes(filterTag)) return false
        }
        if (filterStatus !== 'ທັງໝົດ') {
          if (filterStatus === 'ຮ່າງ' && d.status !== 'draft') return false
          if (filterStatus === 'ລໍຖ້າອະນຸມັດ' && d.status !== 'pending') return false
          if (filterStatus === 'ອະນຸມັດ' && d.status !== 'approved') return false
          if (filterStatus === 'ເກັບເຂົ້າຄັງ' && d.status !== 'archived') return false
          if (filterStatus === 'ໝົດອາຍຸ') {
            const isExp = d.status === 'expired' || (Boolean(d.expiresAt) && (d.expiresAt ?? '') <= today)
            if (!isExp) return false
          }
          if (filterStatus === 'ໃກ້ໝົດອາຍຸ (≤ 7 ວັນ)') {
            if (!d.expiresAt || d.status === 'expired') return false
            const diff = Math.ceil((new Date(d.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            if (diff < 0 || diff > 7) return false
          }
        }
        if (filterDivision !== 'ທັງໝົດ' && d.division !== filterDivision) return false
        if (filterDepartment !== 'ທັງໝົດ' && d.department !== filterDepartment) return false
        if (filterDateRange === 'today' && d.uploadDate !== today) return false
        if (filterDateRange === 'last7' && (d.uploadDate < weekStart || d.uploadDate > today)) return false
        if (filterDateRange === 'month' && (d.uploadDate || '').slice(0, 7) !== monthPrefix) return false
        return true
      })
      .sort((a, b) => sortKey(b).localeCompare(sortKey(a)))
  }, [
    scopedDocuments,
    debouncedQuery,
    filterDirection,
    filterWarehouse,
    filterCategory,
    filterCabinet,
    filterTag,
    filterStatus,
    filterDivision,
    filterDepartment,
    filterDateRange,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const paginatedDocs = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )

  const hasActiveFilters = Boolean(
    query ||
    filterDirection !== 'ALL' ||
    filterCategory !== 'ທັງໝົດ' ||
    filterWarehouse !== 'ທັງໝົດ' ||
    filterCabinet !== 'ທັງໝົດ' ||
    filterStatus !== 'ທັງໝົດ' ||
    filterDivision !== 'ທັງໝົດ' ||
    filterDepartment !== 'ທັງໝົດ' ||
    filterTag !== 'ທັງໝົດ' ||
    filterDateRange !== 'all'
  )

  function clearAllFilters() {
    setQuery('')
    setFilterDirection('ALL')
    setFilterCategory('ທັງໝົດ')
    setFilterWarehouse('ທັງໝົດ')
    setFilterCabinet('ທັງໝົດ')
    setFilterStatus('ທັງໝົດ')
    setFilterDivision('ທັງໝົດ')
    setFilterDepartment('ທັງໝົດ')
    setFilterTag('ທັງໝົດ')
    setFilterDateRange('all')
    setCurrentPage(1)
  }

  function handleDownload(doc: Document) {
    const url = doc.pdfUrl?.trim() || doc.fileUrl?.trim() || ''
    if (!url || url === '#') {
      pushToast({ title: 'ບໍ່ພົບລິ້ງໄຟລ໌ຂອງເອກະສານ' })
      return
    }
    const a = document.createElement('a')
    a.href = url
    a.download = doc.title ? `${doc.title}.${doc.fileType || 'pdf'}` : 'document'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    pushToast({ title: 'ກຳລັງດາວໂຫຼດເອກະສານ' })
  }

  function handleDelete(doc: Document) {
    setConfirmDelete(doc)
  }

  async function confirmDeleteNow() {
    if (!confirmDelete) return
    await deleteDocument(confirmDelete.id)
    pushToast({ title: 'ເອກະສານຖືກນໍາໄປຍັງ Trash' })
    setConfirmDelete(null)
  }

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of documents) {
      if (!d.deleted) counts.set(d.category, (counts.get(d.category ?? '') ?? 0) + 1)
    }
    return counts
  }, [documents])

  function countDocsInCategory(category: string) {
    return categoryCounts.get(category) ?? 0
  }

  async function handleAddCategory(name: string): Promise<boolean> {
    const ok = await addCategory(name)
    pushToast(
      ok
        ? { title: 'ເພີ່ມໝວດໝູ່ສຳເລັດ' }
        : { title: 'ບໍ່ສາມາດເພີ່ມໝວດໝູ່ໄດ້', description: 'ອາດມີຊື່ນີ້ຢູ່ແລ້ວ ຫຼື ການເຊື່ອມຕໍ່ກັບ server ມີປັນຫາ' },
    )
    return ok
  }

  async function handleRemoveCategory(c: string): Promise<boolean> {
    const count = countDocsInCategory(c)
    if (count > 0) {
      pushToast({ title: `ບໍ່ສາມາດລຶບໄດ້ ຍັງມີ ${count} ເອກະສານໃຊ້ໝວດໝູ່ນີ້ຢູ່` })
      return false
    }
    const ok = await removeCategory(c)
    if (ok) {
      if (filterCategory === c) {
        setFilterCategory('ທັງໝົດ')
      }
    } else {
      pushToast({ title: 'ບໍ່ສາມາດລຶບໝວດໝູ່ໄດ້', description: 'ການລຶບຝັ່ງ server ບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່' })
    }
    return ok
  }

  const previewStamp = formatUploadStamp(previewDoc?.uploadedAt, previewDoc?.uploadDate)

  return (
    <DashboardLayout title={pageTitle}>
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ── Header + Scope Toggle + Upload Button ────────────── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 shadow-xs">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {pageTitle}
              </h1>
              <p className="mt-1 text-sm sm:text-base text-slate-500">
                {pageDescription}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Scope toggle: ເອກະສານທັງໝົດ / ເອກະສານຂອງຂ້ອຍ */}
            <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setScope('all')
                  setCurrentPage(1)
                }}
                aria-pressed={effectiveScope === 'all'}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                  effectiveScope === 'all'
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100 font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>ເອກະສານທັງໝົດ</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {documents.filter((d) => !d.deleted).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScope('mine')
                  setCurrentPage(1)
                }}
                aria-pressed={effectiveScope === 'mine'}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                  effectiveScope === 'mine'
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100 font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>ເອກະສານຂອງຂ້ອຍ</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {myDocuments.length}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={openUpload}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>+ ອັບໂຫຼດເອກະສານ</span>
            </button>
          </div>
        </div>

        {/* ── Metric cards ────────────────────────────────────── */}
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {/* Card 1 — ເອກະສານທັງໝົດໃນຂອບເຂດ */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 p-4 text-white shadow-lg shadow-indigo-200/50">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-white/10 blur-xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-100">
                  {effectiveScope === 'mine' ? 'ເອກະສານຂອງຂ້ອຍ' : 'ເອກະສານທັງໝົດ'}
                </p>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold">{stats.total}</span>
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
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">ອັບໂຫຼດໃນເດືອນນີ້</p>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-900">{stats.monthly}</span>
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
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">ອະນຸມັດແລ້ວ</p>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-900">{stats.approved}</span>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {/* Search */}
            <div className="sm:col-span-2 md:col-span-1 lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ຄົ້ນຫາ</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="ຊື່, ເລກທີ ຫຼື ແທັກເອກະສານ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Direction Filter */}
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

            {/* Category Filter + Manage Button */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">ໝວດໝູ່</label>
                <button
                  type="button"
                  onClick={() => setManageCategoryOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <Settings className="h-3 w-3" />
                  <span>ຈັດການ</span>
                </button>
              </div>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ທັງໝົດ">ໝວດໝູ່ທັງໝົດ</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Warehouse Filter */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ຄັງເອກະສານ</label>
              <select
                value={filterWarehouse}
                onChange={(e) => {
                  setFilterWarehouse(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ທັງໝົດ">ຄັງທັງໝົດ</option>
                {unassignedCount > 0 && (
                  <option value="unassigned">⚠️ ຍັງບໍ່ມີບ່ອນເກັບ ({unassignedCount})</option>
                )}
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>🏛️ {w.name}</option>
                ))}
              </select>
            </div>

            {/* Cabinet Filter */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ຕູ້ເອກະສານ</label>
              <select
                value={filterCabinet}
                onChange={(e) => {
                  setFilterCabinet(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ທັງໝົດ">ຕູ້ທັງໝົດ</option>
                {visibleCabinets.map((c) => (
                  <option key={c.id} value={c.id}>🗄️ {c.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ສະຖານະ</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ທັງໝົດ">ສະຖານະທັງໝົດ</option>
                <option value="ຮ່າງ">ຮ່າງ</option>
                <option value="ລໍຖ້າອະນຸມັດ">ລໍຖ້າອະນຸມັດ</option>
                <option value="ອະນຸມັດ">ອະນຸມັດແລ້ວ</option>
                <option value="ເກັບເຂົ້າຄັງ">ເກັບເຂົ້າຄັງ</option>
                <option value="ໝົດອາຍຸ">ໝົດອາຍຸ</option>
                <option value="ໃກ້ໝົດອາຍຸ (≤ 7 ວັນ)">ໃກ້ໝົດອາຍຸ (≤ 7 ວັນ)</option>
              </select>
            </div>

            {/* Division Filter */}
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

            {/* Department Filter */}
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

            {/* Tag Filter */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ແທັກ</label>
              <select
                value={filterTag}
                onChange={(e) => {
                  setFilterTag(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ທັງໝົດ">ແທັກທັງໝົດ ({masterTags.length})</option>
                {masterTags.map((t) => (
                  <option key={t.id} value={t.name}>🏷️ {t.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ຊ່ວງວັນທີ</label>
              <select
                value={filterDateRange}
                onChange={(e) => {
                  setFilterDateRange(e.target.value as DateRangeFilter)
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

          {/* Sub-bar with count & clear filters button */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-600">ພົບ {filtered.length} ລາຍການ</span>
              <span className="text-slate-300">·</span>
              <span>
                {effectiveScope === 'mine' ? 'ຂອບເຂດ: ເອກະສານຂອງຂ້ອຍ' : 'ຂອບເຂດ: ເອກະສານທັງໝົດ'}
              </span>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                ລ້າງຕົວກອງທັງໝົດ
              </button>
            )}
          </div>
        </div>

        {/* ── Beautiful Unified Documents Table ─────────────────── */}
        <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="w-full overflow-x-auto min-h-[380px]">
            <table className="w-full min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3.5 py-3 w-12 min-w-[48px] text-center text-slate-500 whitespace-nowrap">ລ/ດ</th>
                  <th className="px-3.5 py-3 w-[150px] min-w-[140px] whitespace-nowrap">ວັນທີ & ເວລາອັບໂຫຼດ</th>
                  <th className="px-3.5 py-3 min-w-[260px] max-w-[340px]">ເອກະສານ</th>
                  <th className="px-3.5 py-3 w-[140px] min-w-[130px] whitespace-nowrap">ໝວດໝູ່ & ທິດທາງ</th>
                  <th className="px-3.5 py-3 w-[170px] min-w-[150px] max-w-[180px] whitespace-nowrap">ຝ່າຍ</th>
                  <th className="px-3.5 py-3 w-[170px] min-w-[150px] max-w-[180px] whitespace-nowrap">ພະແນກ</th>
                  <th className="px-3.5 py-3 w-[190px] min-w-[180px] max-w-[210px] whitespace-nowrap">ຜູ້ອັບໂຫຼດ</th>
                  <th className="px-3.5 py-3 w-[110px] min-w-[100px] text-center whitespace-nowrap">ສະຖານະ</th>
                  <th className="px-3.5 py-3 w-[140px] min-w-[130px] whitespace-nowrap text-right">ການກະທຳ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDocs.map((doc, idx) => {
                  const stamp = formatUploadStamp(doc.uploadedAt, doc.uploadDate)
                  const place = locationParts(doc)
                  const uploader = resolveUploader(doc)

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-slate-50/60 transition-colors group ${
                        activeDropdownId === doc.id ? 'relative z-50' : 'relative z-0'
                      }`}
                    >
                      {/* Seq No */}
                      <td className="whitespace-nowrap px-3.5 py-3 w-12 min-w-[48px] text-center font-medium text-slate-400 tabular-nums align-middle">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>

                      {/* 1 — ວັນທີ & ເວລາອັບໂຫຼດ */}
                      <td className="whitespace-nowrap px-3.5 py-3 w-[150px] min-w-[140px] align-middle">
                        <div className="font-medium text-slate-900">
                          {stamp.date}
                          {stamp.time ? <span className="text-slate-500">, {stamp.time}</span> : null}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {stamp.time ? 'ເວລາອັບໂຫຼດ' : 'ບໍ່ມີຂໍ້ມູນເວລາ'}
                        </div>
                        {doc.expiresAt && (
                          <div className="mt-1">
                            {doc.status === 'expired' || doc.expiresAt <= new Date().toISOString().slice(0, 10) ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 whitespace-nowrap">
                                ໝົດ: {doc.expiresAt}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 whitespace-nowrap">
                                ໝົດ: {doc.expiresAt}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 2 — ເອກະສານ */}
                      <td className="px-3.5 py-3 align-middle min-w-[260px] max-w-[340px]">
                        <div className="flex items-start gap-2.5 max-w-[320px]">
                          <span
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
                              doc.fileType === 'pdf'
                                ? 'bg-rose-50 text-rose-600 ring-rose-100'
                                : doc.fileType === 'image'
                                ? 'bg-violet-50 text-violet-600 ring-violet-100'
                                : 'bg-blue-50 text-blue-600 ring-blue-100'
                            }`}
                          >
                            {doc.fileType === 'pdf' ? (
                              <FileText className="h-4 w-4" />
                            ) : doc.fileType === 'image' ? (
                              <FileImage className="h-4 w-4" />
                            ) : (
                              <File className="h-4 w-4" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <span
                                className="font-semibold text-slate-900 line-clamp-2 break-words group-hover:text-indigo-600 transition-colors"
                                title={doc.title}
                              >
                                {doc.title}
                              </span>
                              <span
                                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 whitespace-nowrap ${
                                  fileTypeStyles[doc.fileType] || 'bg-slate-50 text-slate-700 ring-slate-200'
                                }`}
                              >
                                {fileTypeLabels[doc.fileType] || doc.fileType.toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span className="font-mono font-medium text-slate-600">{doc.docNumber || '—'}</span>
                              <span>{doc.fileSize && doc.fileSize !== '-' ? doc.fileSize : '—'}</span>
                            </div>

                            {/* Storage location or pulsing prompt */}
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
                              <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              {place.length > 0 ? (
                                <span className="truncate max-w-[220px] text-slate-600" title={place.join(' › ')}>
                                  {place.join(' › ')}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setStorageDoc(doc)}
                                  title="ກົດເພື່ອເລືອກບ່ອນຈັດເກັບໃນຄັງ"
                                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 transition hover:bg-amber-100 cursor-pointer"
                                >
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  <span>ບໍ່ມີບ່ອນເກັບ — ກົດເພື່ອລະບຸ</span>
                                </button>
                              )}
                            </div>

                            {/* Tags */}
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {doc.tags.map((tagName, i) => {
                                  const tagObj = masterTags.find((t) => t.name === tagName)
                                  return (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                                    >
                                      <span
                                        className="h-1.5 w-1.5 rounded-full shrink-0"
                                        style={{ backgroundColor: tagObj?.color || '#6366f1' }}
                                      />
                                      <span>{tagName}</span>
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3 — ໝວດໝູ່ & ທິດທາງ */}
                      <td className="px-3.5 py-3 align-middle w-[140px] min-w-[130px] whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <CategoryBadge category={doc.category} />
                          {doc.direction ? (
                            <DirectionBadge direction={doc.direction} category={doc.category} />
                          ) : null}
                        </div>
                      </td>

                      {/* 4 — ຝ່າຍ */}
                      <td className="px-3.5 py-3 align-middle w-[170px] min-w-[150px] max-w-[180px] whitespace-nowrap">
                        {doc.division ? (
                          <span
                            className="inline-flex max-w-[160px] items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                            title={doc.division}
                          >
                            <span className="shrink-0">🏢</span>
                            <span className="truncate">{doc.division}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* 5 — ພະແນກ */}
                      <td className="px-3.5 py-3 align-middle w-[170px] min-w-[150px] max-w-[180px] whitespace-nowrap">
                        {doc.department ? (
                          <span
                            className="inline-flex max-w-[160px] items-center gap-1.5 rounded-lg bg-indigo-50/80 px-2.5 py-1 text-xs font-medium text-indigo-700"
                            title={doc.department}
                          >
                            <span className="shrink-0">🏬</span>
                            <span className="truncate">{doc.department}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* 6 — ຜູ້ອັບໂຫຼດ */}
                      <td className="px-3.5 py-3 align-middle w-[190px] min-w-[180px] max-w-[210px] whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            name={doc.uploadedBy || '—'}
                            avatarUrl={uploader?.avatarUrl}
                            avatarClassName="h-9 w-9 bg-indigo-100 text-indigo-700 shrink-0"
                            textClassName="text-xs font-bold"
                          />
                          <div className="min-w-0 max-w-[130px]">
                            <div className="truncate text-sm font-medium text-slate-900" title={doc.uploadedBy || '—'}>
                              {doc.uploadedBy || '—'}
                            </div>
                            <div className="truncate text-xs text-slate-500" title={uploader?.email || '—'}>
                              {uploader?.email || '—'}
                            </div>
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
                      <td className="px-3.5 py-3 align-middle w-[110px] min-w-[100px] text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[doc.status]}`}
                        >
                          {statusLabels[doc.status]}
                        </span>
                      </td>

                      {/* 8 — ການກະທຳ */}
                      <td className="px-3.5 py-3 align-middle w-[140px] min-w-[130px] whitespace-nowrap text-right">
                        <div className={`inline-flex items-center justify-end gap-1.5 ${
                          activeDropdownId === doc.id ? 'relative z-50' : 'relative z-0'
                        }`}>
                          {/* Quick View Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            <span>ເບິ່ງ</span>
                          </button>

                          {/* Manage Dropdown Button */}
                          <button
                            type="button"
                            onClick={() => setActiveDropdownId(activeDropdownId === doc.id ? null : doc.id)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition cursor-pointer ${
                              activeDropdownId === doc.id
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                            title="ຈັດການເອກະສານ"
                          >
                            <span>ຈັດການ</span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                activeDropdownId === doc.id ? 'rotate-180 text-indigo-600' : 'text-slate-400'
                              }`}
                            />
                          </button>

                          {/* Dropdown Menu */}
                          {activeDropdownId === doc.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActiveDropdownId(null)}
                              />
                              <div
                                className={`absolute right-0 ${
                                  idx >= paginatedDocs.length - 2 && paginatedDocs.length > 3
                                    ? 'bottom-full mb-1.5'
                                    : 'top-full mt-1.5'
                                } z-50 w-52 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 text-left`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null)
                                    setDetailDoc(doc)
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition cursor-pointer"
                                >
                                  <Eye className="h-4 w-4 text-gray-400" />
                                  <span>ເບິ່ງລາຍລະອຽດ</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null)
                                    setEditDoc(doc)
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition cursor-pointer"
                                >
                                  <Pencil className="h-4 w-4 text-indigo-500" />
                                  <span>ແກ້ໄຂເອກະສານ</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null)
                                    handleDownload(doc)
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition cursor-pointer"
                                >
                                  <Download className="h-4 w-4 text-gray-400" />
                                  <span>ດາວໂຫຼດໄຟລ໌</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null)
                                    setRenewDoc(doc)
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50 transition cursor-pointer"
                                >
                                  <RefreshCw className="h-4 w-4 text-purple-500" />
                                  <span>ຕໍ່ອາຍຸເອກະສານ</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null)
                                    setStorageDoc(doc)
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                                >
                                  <Archive className="h-4 w-4 text-blue-500" />
                                  <span>ບ່ອນຈັດເກັບໃນຄັງ</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null)
                                    setJourneyDoc(doc)
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                                >
                                  <Route className="h-4 w-4 text-emerald-500" />
                                  <span>ເສັ້ນທາງເອກະສານ</span>
                                </button>

                                <div className="my-1 border-t border-gray-100" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null)
                                    handleDelete(doc)
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 text-rose-500" />
                                  <span>ລົບເອກະສານ</span>
                                </button>
                              </div>
                            </>
                          )}
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
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <History className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-600">ຍັງບໍ່ມີເອກະສານ</p>
              <p className="mt-1 text-xs text-slate-400">
                {effectiveScope === 'mine'
                  ? 'ເມື່ອທ່ານອັບໂຫຼດເອກະສານ ລາຍການຈະປາກົດຢູ່ນີ້'
                  : 'ບໍ່ພົບລາຍການຕາມຕົວກອງທີ່ເລືອກ'}
              </p>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemLabel="ເອກະສານ"
          />
        </div>

        {/* ── Preview Modal ────────────────────────────────────── */}
        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc ? `ເບິ່ງເອກະສານ: ${previewDoc.title}` : undefined}
          scrollBody={false}
          footer={
            previewDoc && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                >
                  ປິດ
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>ດາວໂຫຼດໄຟລ໌</span>
                </button>
              </div>
            )
          }
        >
          {previewDoc && (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
                <div>
                  <span className="text-slate-400">ເລກທີ:</span>
                  <div className="font-semibold text-slate-800">{previewDoc.docNumber || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-400">ໝວດໝູ່:</span>
                  <div className="font-semibold text-slate-800">{previewDoc.category || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-400">ວັນທີອັບໂຫຼດ:</span>
                  <div className="font-semibold text-slate-800">
                    {previewStamp.date}
                    {previewStamp.time ? ` (${previewStamp.time})` : ''}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">ຜູ້ອັບໂຫຼດ:</span>
                  <div className="font-semibold text-slate-800">{previewDoc.uploadedBy || '—'}</div>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <DocumentPreview doc={previewDoc} heightClassName="h-full min-h-[420px]" />
              </div>
            </div>
          )}
        </Modal>

        {/* ── Detail Modal ─────────────────────────────────────── */}
        <Modal
          open={!!detailDoc}
          onClose={() => setDetailDoc(null)}
          title={detailDoc ? `ລາຍລະອຽດເອກະສານ: ${detailDoc.title}` : undefined}
          footer={
            detailDoc && (
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailDoc
                      setDetailDoc(null)
                      setPreviewDoc(target)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    <span>ເປີດເບິ່ງໄຟລ໌</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailDoc
                      setDetailDoc(null)
                      setEditDoc(target)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>ແກ້ໄຂ</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailDoc(null)}
                    className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                  >
                    ປິດ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(detailDoc)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>ດາວໂຫຼດໄຟລ໌</span>
                  </button>
                </div>
              </div>
            )
          }
        >
          {detailDoc && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <div>
                  <div className="text-xs text-gray-500">ເລກທີເອກະສານ</div>
                  <div className="mt-0.5 font-semibold text-gray-900">{detailDoc.docNumber || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ໝວດໝູ່</div>
                  <div className="mt-0.5 font-semibold text-gray-900">
                    {typeof detailDoc.category === 'object' && detailDoc.category !== null
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy category field may arrive as an object
                      ? ((detailDoc.category as any).name || '—')
                      : (detailDoc.category || '—')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ສະຖານະ</div>
                  <div className="mt-0.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[detailDoc.status]}`}>
                      {statusLabels[detailDoc.status]}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ທິດທາງ</div>
                  <div className="mt-0.5">
                    <DirectionBadge direction={detailDoc.direction} category={detailDoc.category} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ຝ່າຍ</div>
                  <div className="mt-0.5 font-semibold text-gray-900">{detailDoc.division || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ພະແນກ</div>
                  <div className="mt-0.5 font-semibold text-gray-900">{detailDoc.department || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ຜູ້ອັບໂຫຼດ</div>
                  <div className="mt-0.5 font-semibold text-gray-900">{detailDoc.uploadedBy || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ວັນທີອັບໂຫຼດ</div>
                  <div className="mt-0.5 font-semibold text-gray-900">{detailDoc.uploadDate || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ຮູບແບບໄຟລ໌</div>
                  <div className="mt-0.5 font-semibold uppercase text-gray-900">{detailDoc.fileType || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ຂະໜາດໄຟລ໌</div>
                  <div className="mt-0.5 font-semibold text-gray-900">{detailDoc.fileSize || '—'}</div>
                </div>
                {detailDoc.expiresAt && (
                  <div>
                    <div className="text-xs text-gray-500">ວັນໝົດອາຍຸ</div>
                    <div className="mt-0.5 font-semibold text-amber-700">{detailDoc.expiresAt}</div>
                  </div>
                )}
              </div>

              {/* ບ່ອນຈັດເກັບໃນຄັງ */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">ບ່ອນຈັດເກັບໃນຄັງ</div>
                {detailDoc.warehouseName || detailDoc.cabinetName || detailDoc.shelfName || detailDoc.folderName ? (
                  <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-gray-800">
                    {[
                      detailDoc.warehouseName && { icon: '🏛️', label: detailDoc.warehouseName },
                      detailDoc.cabinetName && { icon: '🗄️', label: detailDoc.cabinetName },
                      detailDoc.shelfName && { icon: '🪜', label: detailDoc.shelfName },
                      detailDoc.folderName && { icon: '📁', label: detailDoc.folderName },
                    ]
                      .filter(Boolean)
                      .map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5">
                          {i > 0 && <span className="text-gray-300">›</span>}
                          <span className="inline-flex items-center gap-1">
                            {(p as { icon: string; label: string }).icon}{' '}
                            {(p as { icon: string; label: string }).label}
                          </span>
                        </span>
                      ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailDoc
                      setDetailDoc(null)
                      setStorageDoc(target)
                    }}
                    title="ກົດເພື່ອເລືອກບ່ອນຈັດເກັບໃນຄັງ"
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 cursor-pointer"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>ບໍ່ມີບ່ອນເກັບ — ກົດເພື່ອລະບຸ</span>
                  </button>
                )}
              </div>

              {/* Tags */}
              {detailDoc.tags && detailDoc.tags.length > 0 && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    ປ້າຍກຳກັບ / ແທັກ (Tags)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detailDoc.tags.map((tagName, i) => {
                      const tagObj = masterTags.find((t) => t.name === tagName)
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold bg-white border border-gray-200 text-gray-800 shadow-2xs"
                        >
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: tagObj?.color || '#6366f1' }}
                          />
                          <span>{tagName}</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* ── Confirm Delete Modal ─────────────────────────────── */}
        <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="ຢືນຢັນການລົບ">
          <div>
            <p className="mb-4 text-sm text-slate-600">
              ທ່ານຕ້ອງການລົບເອກະສານ <span className="font-semibold text-slate-900">&quot;{confirmDelete?.title}&quot;</span> ນີ້ແທ້ບໍ? ການລົບຈະເຮັດໃຫ້ເອກະສານເຂົ້າໄປຢູ່ Trash.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={confirmDeleteNow}
                className="px-3 py-2 rounded-lg bg-rose-600 text-sm font-medium text-white hover:bg-rose-700 transition cursor-pointer"
              >
                ຢືນຢັນລົບ
              </button>
            </div>
          </div>
        </Modal>

        {/* ── Category Management Modal ────────────────────────── */}
        <ManageCategoryModal
          open={manageCategoryOpen}
          onClose={() => setManageCategoryOpen(false)}
          categories={categories}
          onAdd={handleAddCategory}
          onRemove={handleRemoveCategory}
          countDocs={countDocsInCategory}
        />

        {/* ── Select Storage Location Modal ────────────────────── */}
        <SelectStorageLocationModal
          open={!!storageDoc}
          docTitle={storageDoc?.title}
          docNumber={storageDoc?.docNumber}
          department={storageDoc?.department}
          division={storageDoc?.division}
          initialWarehouseId={storageDoc?.warehouseId}
          initialCabinetId={storageDoc?.cabinetId}
          initialShelfId={storageDoc?.shelfId}
          initialFolderId={storageDoc?.folderId}
          confirmLabel="ບັນທຶກບ່ອນຈັດເກັບ"
          onClose={() => setStorageDoc(null)}
          onConfirm={async (data) => {
            if (!storageDoc) return
            await assignDocument(storageDoc.id, data.cabinetId || '', data.folderId || '', data.warehouseId, data.shelfId)
            pushToast({ title: 'ອັບເດດບ່ອນຈັດເກັບສຳເລັດ', description: storageDoc.title })
            setStorageDoc(null)
            await reload()
          }}
        />

        {/* ── Renew Expiry Modal ───────────────────────────────── */}
        <RenewExpiryModal
          open={Boolean(renewDoc)}
          document={renewDoc}
          onClose={() => setRenewDoc(null)}
          onSuccess={() => void reload()}
        />

        {/* ── Edit Document Modal ──────────────────────────────── */}
        <EditDocumentModal
          open={Boolean(editDoc)}
          doc={editDoc}
          onClose={() => setEditDoc(null)}
          onSuccess={() => void reload()}
        />

        {/* ── Document Journey Modal ───────────────────────────── */}
        {journeyDoc && (
          <DocumentJourneyModal
            open={Boolean(journeyDoc)}
            onClose={() => setJourneyDoc(null)}
            documentId={journeyDoc.id}
            document={journeyDoc}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
