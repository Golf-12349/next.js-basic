'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../../context/DocumentsContext'
import { useArchive } from '../../context/ArchiveContext'
import { useCurrentUser } from '../../context/CurrentUserContext'
import { useDebounce } from '@/hooks/useDebounce'
import type { Document } from '@/types/document'
import { edlStructure } from '@/types/user'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import CategoryBadge from '@/app/components/documents/CategoryBadge'
import DirectionBadge from '@/app/components/documents/DirectionBadge'
import RenewExpiryModal from '@/app/components/documents/RenewExpiryModal'
import SelectStorageLocationModal from '@/app/components/documents/SelectStorageLocationModal'
import Pagination from '@/app/components/ui/Pagination'
import { pushToast } from '@/app/components/ui/Toast'
import {
  CalendarX,
  RefreshCw,
  AlertTriangle,
  Clock,
  Search,
  Eye,
  Download,
  Archive,
  Trash2,
  ChevronDown,
  Calendar,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  Building2,
  Sparkles,
} from 'lucide-react'

type TabType = 'all' | 'expired' | '7days' | '30days'

function getDayDifference(dateStr?: string): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  if (isNaN(target.getTime())) return null
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function ExpiredDocumentsPage() {
  const router = useRouter()
  const { documents, reload, deleteDocument, archiveDocument } = useDocuments()
  const { warehouses, cabinets, assignDocument } = useArchive()
  const { user: currentUser } = useCurrentUser()

  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const [filterCategory, setFilterCategory] = useState('ທັງໝົດ')
  const [filterDivision, setFilterDivision] = useState('ທັງໝົດ')
  const [filterDepartment, setFilterDepartment] = useState('ທັງໝົດ')

  const [renewDoc, setRenewDoc] = useState<Document | null>(null)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null)
  const [storageDoc, setStorageDoc] = useState<Document | null>(null)
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 20

  useEffect(() => {
    void reload()
  }, [reload])

  // Get all active (non-deleted) documents that have an expiration date OR are already marked expired
  const expiryTrackedDocs = useMemo(() => {
    return documents.filter((d) => !d.deleted && (d.expiresAt || d.status === 'expired'))
  }, [documents])

  // Count summaries
  const stats = useMemo(() => {
    let expiredCount = 0
    let expiring7Days = 0
    let expiring30Days = 0

    for (const doc of expiryTrackedDocs) {
      const diff = getDayDifference(doc.expiresAt)
      if (doc.status === 'expired' || (diff !== null && diff <= 0)) {
        expiredCount++
      } else if (diff !== null && diff > 0 && diff <= 7) {
        expiring7Days++
      } else if (diff !== null && diff > 7 && diff <= 30) {
        expiring30Days++
      }
    }

    return {
      expiredCount,
      expiring7Days,
      expiring30Days,
      totalTracked: expiryTrackedDocs.length,
    }
  }, [expiryTrackedDocs])

  // Filter documents based on active tab, search, and dropdown filters
  const filteredDocs = useMemo(() => {
    return expiryTrackedDocs.filter((doc) => {
      const diff = getDayDifference(doc.expiresAt)
      const isExpired = doc.status === 'expired' || (diff !== null && diff <= 0)
      const isExpiring7 = diff !== null && diff > 0 && diff <= 7 && doc.status !== 'expired'
      const isExpiring30 = diff !== null && diff > 0 && diff <= 30 && doc.status !== 'expired'

      // Tab filter
      if (activeTab === 'expired' && !isExpired) return false
      if (activeTab === '7days' && !isExpiring7) return false
      if (activeTab === '30days' && !isExpiring30) return false
      if (activeTab === 'all' && !(isExpired || isExpiring30)) return false

      // Category filter
      if (filterCategory !== 'ທັງໝົດ' && doc.category !== filterCategory) return false

      // Division filter
      if (filterDivision !== 'ທັງໝົດ' && doc.division !== filterDivision) return false

      // Department filter
      if (filterDepartment !== 'ທັງໝົດ' && doc.department !== filterDepartment) return false

      // Search query
      if (debouncedQuery.trim()) {
        const q = debouncedQuery.toLowerCase()
        const titleMatch = doc.title.toLowerCase().includes(q)
        const numMatch = doc.docNumber?.toLowerCase().includes(q)
        const idMatch = doc.id.toLowerCase().includes(q)
        const uploaderMatch = doc.uploadedBy?.toLowerCase().includes(q)
        if (!titleMatch && !numMatch && !idMatch && !uploaderMatch) return false
      }

      return true
    })
  }, [expiryTrackedDocs, activeTab, filterCategory, filterDivision, filterDepartment, debouncedQuery])

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, debouncedQuery, filterCategory, filterDivision, filterDepartment])

  const totalPages = Math.ceil(filteredDocs.length / PAGE_SIZE) || 1
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredDocs.slice(start, start + PAGE_SIZE)
  }, [filteredDocs, currentPage])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const d of expiryTrackedDocs) {
      if (d.category) set.add(d.category)
    }
    return Array.from(set)
  }, [expiryTrackedDocs])

  const divisions = useMemo(() => {
    return Object.keys(edlStructure)
  }, [])

  const departments = useMemo(() => {
    if (filterDivision === 'ທັງໝົດ') {
      const allDepts = new Set<string>()
      Object.values(edlStructure).forEach((depts) => depts.forEach((dept) => allDepts.add(dept)))
      return Array.from(allDepts)
    }
    return edlStructure[filterDivision] || []
  }, [filterDivision])

  function handleDownload(doc: Document) {
    const url = doc.pdfUrl?.trim() || doc.fileUrl?.trim() || ''
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      pushToast({ title: 'ບໍ່ພົບລິ້ງໄຟລ໌ຂອງເອກະສານ' })
    }
  }

  async function confirmDeleteNow() {
    if (!confirmDelete) return
    await deleteDocument(confirmDelete.id)
    pushToast({ title: 'ເອກະສານຖືກນໍາໄປຍັງ Trash' })
    setConfirmDelete(null)
    void reload()
  }

  async function handleArchiveDirect(doc: Document) {
    try {
      await archiveDocument(doc.id)
      pushToast({ title: 'ເກັບເອກະສານເຂົ້າຄັງສຳເລັດ' })
      void reload()
    } catch {
      pushToast({ title: 'ບໍ່ສາມາດເກັບເຂົ້າຄັງໄດ້' })
    }
  }

  return (
    <DashboardLayout title="ເອກະສານໝົດອາຍຸ">
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header Title & Subtitle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm ring-1 ring-rose-200">
              <CalendarX className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                ເອກະສານໝົດອາຍຸ & ໃກ້ໝົດອາຍຸ
              </h1>
              <p className="text-sm text-gray-500">
                ສູນກາງຕິດຕາມ, ຕໍ່ອາຍຸ, ແລະ ຈັດການເອກະສານທີ່ໝົດກຳນົດອາຍຸການນຳໃຊ້
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
            <span>ໂຫຼດຂໍ້ມູນຄືນໃໝ່</span>
          </button>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Expired */}
          <div
            onClick={() => setActiveTab('expired')}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${
              activeTab === 'expired'
                ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-400/20'
                : 'border-rose-100 bg-white hover:border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700">ໝົດອາຍຸແລ້ວ</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-700">{stats.expiredCount}</span>
              <span className="text-xs text-rose-600/80">ສະບັບ</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">ຕ້ອງໄດ້ຮັບການຕໍ່ອາຍຸ ຫຼື ຈັດການທັນທີ</p>
          </div>

          {/* Card 2: Expiring within 7 Days */}
          <div
            onClick={() => setActiveTab('7days')}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${
              activeTab === '7days'
                ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/20'
                : 'border-amber-100 bg-white hover:border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">ໃກ້ໝົດອາຍຸ (≤ 7 ວັນ)</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{stats.expiring7Days}</span>
              <span className="text-xs text-amber-600/80">ສະບັບ</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">ໃກ້ຮອດກຳນົດພາຍໃນອາທິດນີ້</p>
          </div>

          {/* Card 3: Expiring within 30 Days */}
          <div
            onClick={() => setActiveTab('30days')}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${
              activeTab === '30days'
                ? 'border-blue-400 bg-blue-50/60 ring-2 ring-blue-400/20'
                : 'border-blue-100 bg-white hover:border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">ໃກ້ໝົດອາຍຸ (≤ 30 ວັນ)</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700">{stats.expiring30Days}</span>
              <span className="text-xs text-blue-600/80">ສະບັບ</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">ຄວນວາງແຜນຕໍ່ອາຍຸລ່ວງໜ້າ</p>
          </div>

          {/* Card 4: Total Monitored */}
          <div
            onClick={() => setActiveTab('all')}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${
              activeTab === 'all'
                ? 'border-indigo-400 bg-indigo-50/60 ring-2 ring-indigo-400/20'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">ເອກະສານທີ່ຕິດຕາມ</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">{stats.totalTracked}</span>
              <span className="text-xs text-slate-500">ສະບັບ</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">ເອກະສານທັງໝົດທີ່ມີກຳນົດອາຍຸ</p>
          </div>
        </div>

        {/* Filter Tabs & Search Bar Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
          {/* Tab Selection */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>ທັງໝົດທີ່ຕ້ອງຕິດຕາມ</span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                {stats.expiredCount + stats.expiring30Days + stats.expiring7Days}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('expired')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === 'expired'
                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/20'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span>🔴 ໝົດອາຍຸແລ້ວ</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === 'expired' ? 'bg-white/25' : 'bg-rose-200/70'}`}>
                {stats.expiredCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('7days')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === '7days'
                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <span>🟡 ໃກ້ໝົດອາຍຸ (≤ 7 ວັນ)</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === '7days' ? 'bg-white/25' : 'bg-amber-200/70'}`}>
                {stats.expiring7Days}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('30days')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === '30days'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <span>🔵 ໃກ້ໝົດອາຍຸ (≤ 30 ວັນ)</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === '30days' ? 'bg-white/25' : 'bg-blue-200/70'}`}>
                {stats.expiring30Days}
              </span>
            </button>
          </div>

          {/* Search and Secondary Filter Controls */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ຄົ້ນຫາຊື່, ເລກທີເອກະສານ..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs text-gray-800 placeholder-gray-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="ທັງໝົດ">ໝວດໝູ່ທັງໝົດ</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Division Filter */}
            <select
              value={filterDivision}
              onChange={(e) => {
                setFilterDivision(e.target.value)
                setFilterDepartment('ທັງໝົດ')
              }}
              className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="ທັງໝົດ">ຝ່າຍທັງໝົດ</option>
              {divisions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="ທັງໝົດ">ພະແນກທັງໝົດ</option>
              {departments.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto min-h-[380px]">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3.5">ເອກະສານ</th>
                  <th className="px-4 py-3.5">ໝວດໝູ່</th>
                  <th className="px-4 py-3.5">ທິດທາງ</th>
                  <th className="px-4 py-3.5">ເລກທີ</th>
                  <th className="px-4 py-3.5">ວັນທີໝົດອາຍຸ</th>
                  <th className="px-4 py-3.5">ຜູ້ອັບໂຫຼດ</th>
                  <th className="px-4 py-3.5">ສະຖານະ</th>
                  <th className="px-4 py-3.5 text-center">ການກະທຳ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {paginatedDocs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <p className="mt-3 text-base font-bold text-gray-800">
                        ບໍ່ພົບເອກະສານໝົດອາຍຸໃນລາຍການນີ້
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        ເອກະສານທັງໝົດຢູ່ໃນສະຖານະໃຊ້ງານປົກກະຕິ ຫຼື ບໍ່ກົງກັບເງື່ອນໄຂຄົ້ນຫາ
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedDocs.map((doc, idx) => {
                    const diff = getDayDifference(doc.expiresAt)
                    const isExpired = doc.status === 'expired' || (diff !== null && diff <= 0)
                    const isUrgent = diff !== null && diff > 0 && diff <= 7

                    return (
                      <tr
                        key={doc.id}
                        className={`align-top transition-colors hover:bg-gray-50/80 ${
                          isExpired ? 'bg-rose-50/20' : isUrgent ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* Title & Organization info */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-gray-900">{doc.title}</div>
                          {(doc.department || doc.division) && (
                            <div
                              className="mt-0.5 max-w-xs truncate text-xs text-gray-500"
                              title={[doc.division, doc.department].filter(Boolean).join(' • ')}
                            >
                              🏢 {doc.department || doc.division}
                            </div>
                          )}
                          {(doc.warehouseName || doc.cabinetName || doc.shelfName || doc.folderName) && (
                            <span className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {[
                                doc.warehouseName && `🏛️ ${doc.warehouseName}`,
                                doc.cabinetName && `🗄️ ${doc.cabinetName}`,
                                doc.shelfName && `🪜 ${doc.shelfName}`,
                                doc.folderName && `📁 ${doc.folderName}`,
                              ].filter(Boolean).join(' > ')}
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5">
                          <CategoryBadge category={doc.category} />
                        </td>

                        {/* Direction */}
                        <td className="px-4 py-3.5">
                          <DirectionBadge direction={doc.direction} category={doc.category} />
                        </td>

                        {/* Doc Number */}
                        <td className="px-4 py-3.5 text-xs text-gray-700">{doc.docNumber}</td>

                        {/* Expiration Date with Status Countdown Pill */}
                        <td className="px-4 py-3.5">
                          {doc.expiresAt ? (
                            <div className="space-y-1">
                              <div className="text-xs font-mono font-medium text-gray-800">
                                {doc.expiresAt}
                              </div>
                              {isExpired ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                                  🔴 ໝົດອາຍຸແລ້ວ {diff !== null && diff < 0 ? `${Math.abs(diff)} ວັນ` : 'ມື້ນີ້'}
                                </span>
                              ) : isUrgent ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                  🟡 ເຫຼືອອີກ {diff} ວັນ
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                  🔵 ເຫຼືອອີກ {diff} ວັນ
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">ບໍ່ກຳນົດ</span>
                          )}
                        </td>

                        {/* Uploaded By */}
                        <td className="px-4 py-3.5 text-xs text-gray-600">{doc.uploadedBy}</td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {isExpired ? (
                            <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                              🔴 ໝົດອາຍຸ
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              ອະນຸມັດ
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="relative inline-flex items-center justify-center gap-1.5">
                            {/* Prominent Quick Renew Button */}
                            <button
                              type="button"
                              onClick={() => setRenewDoc(doc)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm transition hover:bg-purple-100 active:scale-95"
                              title="ຕໍ່ອາຍຸເອກະສານນີ້ທັນທີ"
                            >
                              <RefreshCw className="h-3.5 w-3.5 text-purple-600" />
                              <span>ຕໍ່ອາຍຸ</span>
                            </button>

                            {/* Dropdown Menu Trigger */}
                            <button
                              type="button"
                              onClick={() =>
                                setActiveDropdownId(activeDropdownId === doc.id ? null : doc.id)
                              }
                              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold shadow-sm transition ${
                                activeDropdownId === doc.id
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                              title="ຕົວເລືອກເພີ່ມເຕີມ"
                            >
                              <span>ຈັດການ</span>
                              <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                  activeDropdownId === doc.id
                                    ? 'rotate-180 text-indigo-600'
                                    : 'text-gray-400'
                                }`}
                              />
                            </button>

                            {/* Dropdown Menu */}
                            {activeDropdownId === doc.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setActiveDropdownId(null)}
                                />
                                <div
                                  className={`absolute right-0 ${
                                    idx >= paginatedDocs.length - 2 && paginatedDocs.length > 3
                                      ? 'bottom-full mb-1.5'
                                      : 'top-full mt-1.5'
                                  } z-40 w-52 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 text-left`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownId(null)
                                      setPreviewDoc(doc)
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                                  >
                                    <Eye className="h-4 w-4 text-gray-400" />
                                    <span>ເບິ່ງລາຍລະອຽດ</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownId(null)
                                      handleDownload(doc)
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                                  >
                                    <Download className="h-4 w-4 text-gray-400" />
                                    <span>ດາວໂຫຼດໄຟລ໌</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownId(null)
                                      void handleArchiveDirect(doc)
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 transition"
                                  >
                                    <Archive className="h-4 w-4 text-blue-500" />
                                    <span>ເກັບເຂົ້າຄັງ</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownId(null)
                                      setStorageDoc(doc)
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                                  >
                                    <Layers className="h-4 w-4 text-slate-500" />
                                    <span>ເລືອກບ່ອນຈັດເກັບໃນຄັງ</span>
                                  </button>

                                  <div className="my-1 border-t border-gray-100" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownId(null)
                                      setConfirmDelete(doc)
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
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
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDocs.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemLabel="ເອກະສານ"
          />
        </div>

        {/* Renew Expiry Modal */}
        <RenewExpiryModal
          document={renewDoc}
          open={!!renewDoc}
          onClose={() => setRenewDoc(null)}
          onSuccess={() => {
            setRenewDoc(null)
            void reload()
          }}
        />

        {/* Select Storage Location Modal */}
        <SelectStorageLocationModal
          open={!!storageDoc}
          docTitle={storageDoc?.title}
          docNumber={storageDoc?.docNumber}
          department={storageDoc?.department}
          division={storageDoc?.division}
          initialWarehouseId={storageDoc?.warehouseId}
          initialCabinetId={storageDoc?.cabinetId}
          initialFolderId={storageDoc?.folderId}
          confirmLabel="ບັນທຶກບ່ອນຈັດເກັບ"
          onClose={() => setStorageDoc(null)}
          onConfirm={async (data) => {
            if (!storageDoc) return
            await assignDocument(storageDoc.id, data.cabinetId || '', data.folderId || '', data.warehouseId)
            await assignDocument(storageDoc.id, data.cabinetId || '', data.folderId || '', data.warehouseId, data.shelfId)
            pushToast({ title: 'ອັບເດດບ່ອນຈັດເກັບສຳເລັດ' })
            setStorageDoc(null)
            void reload()
          }}
        />

        {/* Preview Document Modal */}
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
                  onClick={() => {
                    setPreviewDoc(null)
                    pushToast({ title: 'ປິດການເບິ່ງ' })
                  }}
                  className="px-3 py-2 rounded-lg bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
                >
                  ປິດ
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                >
                  ດາວໂຫຼດ
                </button>
              </div>
            )
          }
        >
          {previewDoc && <DocumentPreview doc={previewDoc} />}
        </Modal>

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">ຢືນຢັນການລົບເອກະສານ</h3>
              </div>
              <p className="text-xs text-gray-600">
                ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຍ້າຍເອກະສານ{' '}
                <span className="font-semibold text-gray-900">"{confirmDelete.title}"</span>{' '}
                ໄປຍັງຖັງຂີ້ເຫຍື້ອ (Trash)?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDeleteNow()}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
                >
                  ລົບເອກະສານ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
