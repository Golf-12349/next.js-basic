'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../../context/DocumentsContext'
import { useCurrentUser } from '../../context/CurrentUserContext'
import { useMasterData } from '../../context/MasterDataContext'
import type { Document, DocumentTransfer, TransferStatus } from '@/types/document'
import { useDebounce } from '@/hooks/useDebounce'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import Pagination from '@/app/components/ui/Pagination'
import { pushToast } from '@/app/components/ui/Toast'
import { cancelTransfer, fetchIncomingTransfers, fetchTransferHistory } from '@/lib/dms/documentService'
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FileText,
  Info,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from 'lucide-react'

type TransferDirection = 'ALL' | 'incoming' | 'outgoing'
type TransferStatusFilter = 'ALL' | TransferStatus

const PAGE_SIZE = 12

const statusBadgeStyles: Record<TransferStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 ring-rose-200',
  cancelled: 'bg-slate-100 text-slate-700 ring-slate-200',
}

const statusLabels: Record<TransferStatus, string> = {
  pending: 'ລໍຖ້າອະນຸມັດ',
  approved: 'ອະນຸມັດແລ້ວ',
  rejected: 'ປະຕິເສດ',
  cancelled: 'ຍົກເລີກແລ້ວ',
}

interface EnrichedTransfer extends DocumentTransfer {
  document?: Document
}

function formatStamp(rawDate?: string): { date: string; time: string } {
  if (!rawDate) return { date: '—', time: '' }
  const d = new Date(rawDate)
  if (isNaN(d.getTime())) return { date: rawDate, time: '' }
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return { date: `${dd}/${mm}/${yyyy}`, time: `${hh}:${mi}` }
}

export default function TransferHistoryPage() {
  const { documents, reload } = useDocuments()
  const { user: currentUser } = useCurrentUser()
  const { divisions, getDepartments } = useMasterData()

  const [incomingTransfers, setIncomingTransfers] = useState<DocumentTransfer[]>([])
  const [loadingTransfers, setLoadingTransfers] = useState(false)
  const [query, setQuery] = useState('')
  const [directionFilter, setDirectionFilter] = useState<TransferDirection>('ALL')
  const [statusFilter, setStatusFilter] = useState<TransferStatusFilter>('ALL')
  const [filterDivision, setFilterDivision] = useState<string>('ທັງໝົດ')
  const [filterDepartment, setFilterDepartment] = useState<string>('ທັງໝົດ')
  const [currentPage, setCurrentPage] = useState(1)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [detailTransfer, setDetailTransfer] = useState<EnrichedTransfer | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 250)

  const [historyTransfers, setHistoryTransfers] = useState<DocumentTransfer[]>([])

  // Load incoming and history transfers
  const loadIncoming = async () => {
    setLoadingTransfers(true)
    try {
      const [incRes, histRes] = await Promise.allSettled([
        fetchIncomingTransfers(),
        fetchTransferHistory(),
      ])
      if (incRes.status === 'fulfilled' && Array.isArray(incRes.value)) {
        setIncomingTransfers(incRes.value)
      }
      if (histRes.status === 'fulfilled' && Array.isArray(histRes.value)) {
        setHistoryTransfers(histRes.value)
      }
    } catch {
      // silent
    } finally {
      setLoadingTransfers(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load transfer history on mount
    void loadIncoming()
  }, [reload])

  // Aggregate all transfers from documents, incomingTransfers, and historyTransfers
  const allTransfers = useMemo(() => {
    const map = new Map<string, EnrichedTransfer>()
    const docMap = new Map<string, Document>()
    documents.forEach((d) => docMap.set(d.id, d))

    // Transfers attached to documents
    for (const doc of documents) {
      if (Array.isArray(doc.transfers)) {
        for (const t of doc.transfers) {
          map.set(t.id, { ...t, document: doc })
        }
      }
    }

    // Additional incoming transfers
    for (const t of incomingTransfers) {
      const matchedDoc = docMap.get(t.documentId)
      const existing = map.get(t.id)
      map.set(t.id, {
        ...existing,
        ...t,
        document: t.document || matchedDoc || existing?.document,
      })
    }

    // Direct transfer history from backend
    for (const t of historyTransfers) {
      const matchedDoc = docMap.get(t.documentId)
      const existing = map.get(t.id)
      map.set(t.id, {
        ...existing,
        ...t,
        document: t.document || matchedDoc || existing?.document,
      })
    }

    return Array.from(map.values())
  }, [documents, incomingTransfers, historyTransfers])

  // Current user's department & division
  const userDept = currentUser?.department?.trim().toLowerCase()
  const userDiv = currentUser?.division?.trim().toLowerCase()

  // Filtered transfers
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    return allTransfers
      .filter((item) => {
        const title = item.document?.title?.toLowerCase() || ''
        const docNum = item.document?.docNumber?.toLowerCase() || ''
        const sender = (item.sender?.name || '').toLowerCase()
        const note = (item.note || '').toLowerCase()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings
        const toDept = (typeof item.toDepartment === 'object' && item.toDepartment !== null ? (item.toDepartment as any).name : item.toDepartment || '').toLowerCase()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings
        const fromDept = (typeof item.fromDepartment === 'object' && item.fromDepartment !== null ? (item.fromDepartment as any).name : item.fromDepartment || '').toLowerCase()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings
        const toDiv = (typeof item.toDivision === 'object' && item.toDivision !== null ? (item.toDivision as any).name : item.toDivision || '').toLowerCase()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings
        const fromDiv = (typeof item.fromDivision === 'object' && item.fromDivision !== null ? (item.fromDivision as any).name : item.fromDivision || '').toLowerCase()

        // Text query
        if (q && !(title.includes(q) || docNum.includes(q) || sender.includes(q) || note.includes(q) || toDept.includes(q) || fromDept.includes(q))) {
          return false
        }

        // Direction filter
        if (directionFilter === 'incoming') {
          // Sent to current user's department/division
          if (userDept && !toDept.includes(userDept)) return false
          if (!userDept && userDiv && !toDiv.includes(userDiv)) return false
        } else if (directionFilter === 'outgoing') {
          // Sent by current user or from user's department/division
          if (userDept && !fromDept.includes(userDept) && item.senderId !== currentUser?.id) return false
          if (!userDept && userDiv && !fromDiv.includes(userDiv) && item.senderId !== currentUser?.id) return false
        }

        // Status filter
        if (statusFilter !== 'ALL' && item.status !== statusFilter) {
          return false
        }

        // Division filter
        if (filterDivision !== 'ທັງໝົດ') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings
          const divTo = typeof item.toDivision === 'object' && item.toDivision !== null ? (item.toDivision as any).name : item.toDivision || ''
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings
          const divFrom = typeof item.fromDivision === 'object' && item.fromDivision !== null ? (item.fromDivision as any).name : item.fromDivision || ''
          if (divTo !== filterDivision && divFrom !== filterDivision) {
            return false
          }
        }

        // Department filter
        if (filterDepartment !== 'ທັງໝົດ') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings
          const depTo = typeof item.toDepartment === 'object' && item.toDepartment !== null ? (item.toDepartment as any).name : item.toDepartment || ''
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings
          const depFrom = typeof item.fromDepartment === 'object' && item.fromDepartment !== null ? (item.fromDepartment as any).name : item.fromDepartment || ''
          if (depTo !== filterDepartment && depFrom !== filterDepartment) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  }, [allTransfers, debouncedQuery, directionFilter, statusFilter, filterDivision, filterDepartment, userDept])

  // Summary Metrics
  const stats = useMemo(() => {
    const total = allTransfers.length
    const pending = allTransfers.filter((t) => t.status === 'pending').length
    const approved = allTransfers.filter((t) => t.status === 'approved').length
    const rejectedOrCancelled = allTransfers.filter((t) => t.status === 'rejected' || t.status === 'cancelled').length
    return { total, pending, approved, rejectedOrCancelled }
  }, [allTransfers])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

  const handleCancelTransfer = async (transferId: string) => {
    if (!confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຍົກເລີກການສົ່ງຕໍ່ເອກະສານນີ້?')) return
    setCancellingId(transferId)
    try {
      await cancelTransfer(transferId)
      pushToast({ title: 'ຍົກເລີກການສົ່ງຂ້າມສຳເລັດແລ້ວ' })
      void reload()
      void loadIncoming()
    } catch {
      pushToast({ title: 'ບໍ່ສາມາດຍົກເລີກໄດ້' })
    } finally {
      setCancellingId(null)
    }
  }

  const availableDepartments = useMemo(() => {
    return getDepartments(filterDivision)
  }, [getDepartments, filterDivision])

  return (
    <DashboardLayout title="ປະຫວັດການສົ່ງຂ້າມເອກະສານ">
      <div className="w-full min-w-0 space-y-4 p-3 sm:p-4 lg:p-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <ArrowRightLeft className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                ປະຫວັດການສົ່ງຂ້າມເອກະສານ
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                ຕິດຕາມ ແລະ ກວດສອບປະຫວັດການສົ່ງຕໍ່ເອກະສານຂ້າມຝ່າຍ ແລະ ພະແນກທັງໝົດ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              void reload()
              void loadIncoming()
              pushToast({ title: 'ໂຫຼດຂໍ້ມູນຄືນໃໝ່ແລ້ວ' })
            }}
            disabled={loadingTransfers}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loadingTransfers ? 'animate-spin' : ''}`} />
            <span>ໂຫຼດຂໍ້ມູນຄືນໃໝ່</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">ການສົ່ງຂ້າມທັງໝົດ</span>
              <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <Send className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
              <span className="text-xs text-slate-400">ຄັ້ງ</span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-800">ລໍຖ້າອະນຸມັດ</span>
              <span className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-900">{stats.pending}</span>
              <span className="text-xs text-amber-600">ລາຍການ</span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-800">ອະນຸມັດແລ້ວ</span>
              <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-900">{stats.approved}</span>
              <span className="text-xs text-emerald-600">ສຳເລັດ</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">ປະຕິເສດ / ຍົກເລີກ</span>
              <span className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
                <XCircle className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{stats.rejectedOrCancelled}</span>
              <span className="text-xs text-slate-400">ລາຍການ</span>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {/* Search */}
            <div className="sm:col-span-2 md:col-span-3 xl:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                ຄົ້ນຫາ
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="ຊື່ເອກະສານ, ເລກທີ, ຜູ້ສົ່ງ, ໝາຍເຫດ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Direction */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                ທິດທາງ
              </label>
              <select
                value={directionFilter}
                onChange={(e) => {
                  setDirectionFilter(e.target.value as TransferDirection)
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">ທັງໝົດ</option>
                <option value="incoming">ຂາເຂົ້າ (ຮັບໂອນ)</option>
                <option value="outgoing">ຂາອອກ (ສົ່ງຕໍ່)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                ສະຖານະ
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as TransferStatusFilter)
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">ທັງໝົດ</option>
                <option value="pending">ລໍຖ້າອະນຸມັດ</option>
                <option value="approved">ອະນຸມັດແລ້ວ</option>
                <option value="rejected">ປະຕິເສດ</option>
                <option value="cancelled">ຍົກເລີກແລ້ວ</option>
              </select>
            </div>

            {/* Division */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                ຝ່າຍ
              </label>
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
                {divisions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                ພະແນກ
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => {
                  setFilterDepartment(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ທັງໝົດ">ພະແນກທັງໝົດ</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600">ພົບ {filtered.length} ລາຍການ</span>
            {(query || directionFilter !== 'ALL' || statusFilter !== 'ALL' || filterDivision !== 'ທັງໝົດ' || filterDepartment !== 'ທັງໝົດ') && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setDirectionFilter('ALL')
                  setStatusFilter('ALL')
                  setFilterDivision('ທັງໝົດ')
                  setFilterDepartment('ທັງໝົດ')
                  setCurrentPage(1)
                }}
                className="font-medium text-indigo-600 transition hover:text-indigo-800"
              >
                ລ້າງຕົວກອງ
              </button>
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3.5 py-3 w-12 text-center text-slate-500 whitespace-nowrap">ລ/ດ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ວັນທີສົ່ງ</th>
                  <th className="px-3.5 py-3 min-w-[200px]">ເອກະສານ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ຕົ້ນທາງ (From)</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ປາຍທາງ (To)</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ຜູ້ສົ່ງ & ໝາຍເຫດ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ຮູບແບບ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ສະຖານະ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap text-right">ການກະທຳ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.map((item, idx) => {
                  const stamp = formatStamp(item.createdAt)
                  const senderName = item.sender?.name || '—'
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings
                  const toDept = typeof item.toDepartment === 'object' && item.toDepartment !== null ? (item.toDepartment as any).name : item.toDepartment || '—'
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings
                  const toDiv = typeof item.toDivision === 'object' && item.toDivision !== null ? (item.toDivision as any).name : item.toDivision || ''
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings
                  const fromDept = typeof item.fromDepartment === 'object' && item.fromDepartment !== null ? (item.fromDepartment as any).name : item.fromDepartment || '—'
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings
                  const fromDiv = typeof item.fromDivision === 'object' && item.fromDivision !== null ? (item.fromDivision as any).name : item.fromDivision || ''

                  const canCancel = item.status === 'pending'

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50/60">
                      {/* Sequence Number */}
                      <td className="whitespace-nowrap px-3.5 py-3 text-center font-medium text-slate-400 tabular-nums align-top">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-3.5 py-3 align-top">
                        <div className="font-medium text-slate-900">{stamp.date}</div>
                        {stamp.time && <div className="text-xs text-slate-400">{stamp.time}</div>}
                      </td>

                      {/* Document */}
                      <td className="px-3 py-2.5 align-top min-w-[200px]">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                            <FileText className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 break-words line-clamp-1">
                              {item.document?.title || `ເອກະສານ #${item.documentId?.slice(0, 8)}`}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.document?.docNumber || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* From */}
                      <td className="px-3 py-2.5 align-top whitespace-nowrap">
                        <div className="text-xs">
                          <p className="font-medium text-slate-800">🏬 {fromDept}</p>
                          {fromDiv && <p className="mt-0.5 text-[11px] text-slate-400">🏢 {fromDiv}</p>}
                        </div>
                      </td>

                      {/* To */}
                      <td className="px-3 py-2.5 align-top whitespace-nowrap">
                        <div className="text-xs">
                          <p className="font-medium text-indigo-700">🏬 {toDept}</p>
                          {toDiv && <p className="mt-0.5 text-[11px] text-indigo-500/80">🏢 {toDiv}</p>}
                        </div>
                      </td>

                      {/* Sender & Note */}
                      <td className="px-3 py-2.5 align-top whitespace-nowrap">
                        <div className="text-xs">
                          <p className="font-medium text-slate-900">{senderName}</p>
                          {item.note && (
                            <p className="mt-0.5 max-w-[160px] truncate text-[11px] text-slate-500" title={item.note}>
                              {item.note}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Keep Copy Badge */}
                      <td className="px-3 py-2.5 align-top whitespace-nowrap">
                        {item.keepCopy ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200">
                            <Copy className="h-3 w-3" />
                            ເກັບສຳເນົາ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            ຍ້າຍຕົ້ນສະບັບ
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeStyles[item.status]}`}
                        >
                          {statusLabels[item.status]}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 align-top whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailTransfer(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            title="ເບິ່ງລາຍລະອຽດ"
                          >
                            <Info className="h-3.5 w-3.5 text-slate-500" />
                            ລາຍລະອຽດ
                          </button>
                          {item.document && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(item.document || null)}
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                              title="ເບິ່ງເອກະສານ"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              ເບິ່ງໄຟລ໌
                            </button>
                          )}
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => handleCancelTransfer(item.id)}
                              disabled={cancellingId === item.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              ຍົກເລີກ
                            </button>
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
                <ArrowRightLeft className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-600">ບໍ່ພົບປະຫວັດການສົ່ງຂ້າມ</p>
              <p className="mt-1 text-xs text-slate-400">
                ຍັງບໍ່ມີລາຍການສົ່ງຕໍ່ເອກະສານ ຫຼື ບໍ່ກົງກັບເງື່ອນໄຂທີ່ເລືອກ
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />

        {/* Detail Modal */}
        <Modal
          open={!!detailTransfer}
          onClose={() => setDetailTransfer(null)}
          title="ລາຍລະອຽດການສົ່ງຕໍ່ເອກະສານ"
        >
          {detailTransfer && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">ສະຖານະການສົ່ງຂ້າມ</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeStyles[detailTransfer.status]}`}
                  >
                    {statusLabels[detailTransfer.status]}
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="font-semibold text-slate-900">
                    {detailTransfer.document?.title || `ເອກະສານ #${detailTransfer.documentId}`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ເລກທີ: {detailTransfer.document?.docNumber || '—'}
                  </p>
                </div>
              </div>

              {/* Transfer Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <span className="text-xs font-semibold uppercase text-slate-400">ຕົ້ນທາງ (From)</span>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings */}
                    🏬 {typeof detailTransfer.fromDepartment === 'object' && detailTransfer.fromDepartment !== null ? (detailTransfer.fromDepartment as any).name : detailTransfer.fromDepartment || '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings */}
                    🏢 {typeof detailTransfer.fromDivision === 'object' && detailTransfer.fromDivision !== null ? (detailTransfer.fromDivision as any).name : detailTransfer.fromDivision || '—'}
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                  <span className="text-xs font-semibold uppercase text-indigo-500">ປາຍທາງ (To)</span>
                  <p className="mt-1 text-sm font-semibold text-indigo-900">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings */}
                    🏬 {typeof detailTransfer.toDepartment === 'object' && detailTransfer.toDepartment !== null ? (detailTransfer.toDepartment as any).name : detailTransfer.toDepartment || '—'}
                  </p>
                  <p className="text-xs text-indigo-700">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects instead of strings */}
                    🏢 {typeof detailTransfer.toDivision === 'object' && detailTransfer.toDivision !== null ? (detailTransfer.toDivision as any).name : detailTransfer.toDivision || '—'}
                  </p>
                </div>
              </div>

              {/* Information List */}
              <div className="space-y-2 rounded-xl border border-slate-100 p-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">ຜູ້ສົ່ງຕໍ່:</span>
                  <span className="font-medium text-slate-900">
                    {detailTransfer.sender?.name || '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">ວັນທີ & ເວລາສົ່ງ:</span>
                  <span className="font-medium text-slate-900">{formatStamp(detailTransfer.createdAt).date} {formatStamp(detailTransfer.createdAt).time}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">ຮູບແບບການໂອນ:</span>
                  <span className="font-medium text-slate-900">
                    {detailTransfer.keepCopy ? 'ເກັບສຳເນົາຕົ້ນສະບັບໄວ້' : 'ຍ້າຍຕົ້ນສະບັບໄປປາຍທາງ'}
                  </span>
                </div>
                {detailTransfer.note && (
                  <div className="py-1">
                    <span className="text-slate-500">ໝາຍເຫດ:</span>
                    <p className="mt-1 rounded-lg bg-slate-50 p-2 text-slate-700">{detailTransfer.note}</p>
                  </div>
                )}
                {detailTransfer.rejectionReason && (
                  <div className="py-1">
                    <span className="text-rose-600 font-semibold">ເຫດຜົນການປະຕິເສດ:</span>
                    <p className="mt-1 rounded-lg bg-rose-50 p-2 text-rose-800">{detailTransfer.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDetailTransfer(null)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  ປິດ
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Document Preview Modal */}
        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.title}
          scrollBody={false}
        >
          {previewDoc && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-4">
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
              </div>
              <DocumentPreview doc={previewDoc} heightClassName="min-h-0 flex-1" />
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}
