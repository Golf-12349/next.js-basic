'use client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import type { Document, DocumentStatus } from '@/types/document'
import { useEffect, useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocuments } from '../context/DocumentsContext'
import { useUploadModal } from '../context/UploadModalContext'
import { useArchive } from '../context/ArchiveContext'
import { useCurrentUser } from '../context/CurrentUserContext'
import { useMasterData } from '../context/MasterDataContext'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import { pushToast } from '@/app/components/ui/Toast'
import {
  Settings,
  Eye,
  Pencil,
  Download,
  RefreshCw,
  Archive,
  ArrowRightLeft,
  Trash2,
  ChevronDown,
} from 'lucide-react'
import ManageCategoryModal from '@/app/components/documents/ManageCategoryModal'
import CategoryBadge from '@/app/components/documents/CategoryBadge'
import TransferDocumentModal from '@/app/components/documents/TransferDocumentModal'
import SelectStorageLocationModal from '@/app/components/documents/SelectStorageLocationModal'
import RenewExpiryModal from '@/app/components/documents/RenewExpiryModal'
import EditDocumentModal from '@/app/components/documents/EditDocumentModal'
import { edlStructure } from '@/types/user'
import Pagination from '@/app/components/ui/Pagination'

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
  approved: 'ອະນຸມັດ',
  archived: 'ເກັບເຂົ້າຄັງ',
  expired: '🔴 ໝົດອາຍຸ',
}

export default function DocumentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openUpload } = useUploadModal()
  const { documents, categories, addCategory, removeCategory, deleteDocument, reload } = useDocuments()

  useEffect(() => {
    void reload()
  }, [reload])

  // ການປ່ຽນສົ່ງຈາກໜ້າ upload ເກົ່າ: `/documents?upload=open` ເປີດ modal ອັດຕະໂນມັດ ແລະ ເຂືອງ URL
  useEffect(() => {
    if (searchParams.get('upload') !== 'open') return
    openUpload()
    const clean = new URLSearchParams(window.location.search)
    clean.delete('upload')
    const qs = clean.toString()
    router.replace(qs ? `/documents?${qs}` : '/documents')
  }, [searchParams, openUpload, router])
  const { user: currentUser } = useCurrentUser()
  const { warehouses, cabinets, assignDocument } = useArchive()
  const [transferDoc, setTransferDoc] = useState<Document | null>(null)
  const [storageDoc, setStorageDoc] = useState<Document | null>(null)
  const [renewDoc, setRenewDoc] = useState<Document | null>(null)
  const [editDoc, setEditDoc] = useState<Document | null>(null)
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)

  const visibleCabinets = useMemo(() => {
    if (currentUser?.role === 'DepartmentAdmin' && currentUser.department) {
      const userDept = currentUser.department.trim().toLowerCase();
      return cabinets.filter((c) => c.department?.trim().toLowerCase() === userDept);
    }
    if (currentUser?.role === 'DivisionAdmin' && currentUser.division) {
      return cabinets.filter((c) => !c.division || c.division === currentUser.division);
    }
    return cabinets;
  }, [cabinets, currentUser])

  const searchParam = searchParams.get('search') || ''
  const [prevParam, setPrevParam] = useState(searchParam)
  const [query, setQuery] = useState(searchParam)

  if (searchParam !== prevParam) {
    setPrevParam(searchParam)
    setQuery(searchParam)
  }

  const warehouseParam = searchParams.get('warehouse') || ''
  const [filterWarehouse, setFilterWarehouse] = useState(warehouseParam === 'unassigned' ? 'unassigned' : 'ທັງໝົດ')
  const [filterCategory, setFilterCategory] = useState('ທັງໝົດ')
  const [filterCabinet, setFilterCabinet] = useState('ທັງໝົດ')
  const [filterStatus, setFilterStatus] = useState('ທັງໝົດ')
  const [filterTag, setFilterTag] = useState('ທັງໝົດ')
  const [filterDivision, setFilterDivision] = useState('ທັງໝົດ')
  const [filterDepartment, setFilterDepartment] = useState('ທັງໝົດ')
  const { tags: masterTags } = useMasterData()
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [detailDoc, setDetailDoc] = useState<Document | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null)
  const [manageCategoryOpen, setManageCategoryOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 250)

  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 30

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination when filters change
    setCurrentPage(1)
  }, [debouncedQuery, filterWarehouse, filterCategory, filterCabinet, filterStatus, filterTag, filterDivision, filterDepartment])

  const visible = useMemo(() => {
    return documents.filter((d) => !d.deleted && d.status !== 'pending').filter((d) => {
      const q = debouncedQuery.trim().toLowerCase()
      if (q) {
        const matchesTitleOrNum = d.title.toLowerCase().includes(q) || d.docNumber.toLowerCase().includes(q)
        const matchesTag = Array.isArray(d.tags) && d.tags.some((t) => t.toLowerCase().includes(q))
        if (!matchesTitleOrNum && !matchesTag) return false
      }
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
        if (filterStatus === 'ອະນຸມັດ' && d.status !== 'approved') return false
        if (filterStatus === 'ເກັບເຂົ້າຄັງ' && d.status !== 'archived') return false
        if (filterStatus === 'ໝົດອາຍຸ') {
          const isExp = d.status === 'expired' || (Boolean(d.expiresAt) && (d.expiresAt ?? '') <= new Date().toISOString().slice(0, 10))
          if (!isExp) return false
        }
        if (filterStatus === 'ໃກ້ໝົດອາຍຸ (≤ 7 ວັນ)') {
          if (!d.expiresAt || d.status === 'expired') return false
          // eslint-disable-next-line react-hooks/purity -- expiry window derived from the current date for the filter
          const diff = Math.ceil((new Date(d.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          if (diff < 0 || diff > 7) return false
        }
      }
      if (filterDivision !== 'ທັງໝົດ' && d.division !== filterDivision) return false
      if (filterDepartment !== 'ທັງໝົດ' && d.department !== filterDepartment) return false
      return true
    })
  }, [documents, debouncedQuery, filterWarehouse, filterCategory, filterCabinet, filterStatus, filterTag, filterDivision, filterDepartment])

  const totalPages = Math.ceil(visible.length / PAGE_SIZE) || 1
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return visible.slice(start, start + PAGE_SIZE)
  }, [visible, currentPage])

  function handleDelete(doc: Document) {
    setConfirmDelete(doc)
  }

  async function confirmDeleteNow() {
    if (!confirmDelete) return
    await deleteDocument(confirmDelete.id)
    pushToast({ title: 'ເອກະສານຖືກນໍາໄປຍັງ Trash' })
    setConfirmDelete(null)
  }

  function handleDownload(doc: Document) {
    const url = doc.pdfUrl?.trim() || doc.fileUrl?.trim() || ''
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      pushToast({ title: 'ບໍ່ພົບລິ້ງໄຟລ໌ຂອງເອກະສານ' })
    }
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

  return (
    <DashboardLayout title="ເອກກະສານທັງໝົດ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ເອກກະສານທັງໝົດ</h1>
            <p className="text-sm text-gray-500 mt-1">ການຕິດຕາມແລະຈັດການເອກະສານໃນລະບົບ DMS</p>
          </div>

          <button
            type="button"
            onClick={openUpload}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            + ອັບໂຫຼດເອກກະສານ
          </button>
        </div>


        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ຄົ້ນຫາ</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ຊື່ເອກກະສານ / ເລກທີ"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400 focus:border-indigo-400"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">ໝວດໝູ່</label>
                <button
                  onClick={() => setManageCategoryOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  <Settings size={14} />
                  ຈັດການ
                </button>
              </div>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400">
                <option>ທັງໝົດ</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ຄັງເອກະສານ</label>
              <select value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400">
                <option value="ທັງໝົດ">ທັງໝົດ</option>
                {unassignedCount > 0 && (
                  <option value="unassigned">⚠️ ຍັງບໍ່ມີບ່ອນເກັບ ({unassignedCount})</option>
                )}
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>🏛️ {w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ຕູ້ເອກະສານ</label>
              <select value={filterCabinet} onChange={(e) => setFilterCabinet(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400">
                <option>ທັງໝົດ</option>
                {visibleCabinets.map((c) => (
                  <option key={c.id} value={c.id}>🗄️ {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ສະຖານະ</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400">
                <option>ທັງໝົດ</option>
                <option>ຮ່າງ</option>
                <option>ອະນຸມັດ</option>
                <option>ເກັບເຂົ້າຄັງ</option>
                <option>ໝົດອາຍຸ</option>
                <option>ໃກ້ໝົດອາຍຸ (≤ 7 ວັນ)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ຝ່າຍ</label>
              <select
                value={filterDivision}
                onChange={(e) => { setFilterDivision(e.target.value); setFilterDepartment('ທັງໝົດ') }}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
              >
                <option>ທັງໝົດ</option>
                {Object.keys(edlStructure).map((div) => (
                  <option key={div}>{div}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ພະແນກ / ສູນ</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                disabled={filterDivision === 'ທັງໝົດ'}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option>ທັງໝົດ</option>
                {(filterDivision !== 'ທັງໝົດ' ? (edlStructure[filterDivision] ?? []) : []).map((dep) => (
                  <option key={dep}>{dep}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ປ້າຍກຳກັບ / ແທັກ</label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
              >
                <option value="ທັງໝົດ">ທັງໝົດ ({masterTags.length} ແທັກ)</option>
                {masterTags.map((tag) => (
                  <option key={tag.id} value={tag.name}>
                    🏷️ {tag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto min-h-[360px]">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3.5 py-3 w-12 text-center text-gray-500 whitespace-nowrap">ລ/ດ</th>
                  <th className="px-3.5 py-3">ເອກະສານ</th>
                  <th className="px-3.5 py-3">ໝວດໝູ່</th>
                  <th className="px-3.5 py-3">ເລກທີ</th>
                  <th className="px-3.5 py-3">ຮູບແບບ</th>
                  <th className="px-3.5 py-3">ຂະໜາດ</th>
                  <th className="px-3.5 py-3">ວັນທີ</th>
                  <th className="px-3.5 py-3">ສະຖານະ</th>
                  <th className="px-3.5 py-3 text-center">ການກະທຳ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocs.map((doc, idx) => (
                  <tr key={doc.id} className="border-t border-gray-200 align-top hover:bg-gray-50/60 transition-colors">
                    <td className="px-3.5 py-3 text-center font-medium text-gray-400 tabular-nums whitespace-nowrap">
                      {(currentPage - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{doc.title}</span>
                        {!(doc.warehouseName || doc.cabinetName || doc.shelfName || doc.folderName) && (
                          <button
                            type="button"
                            onClick={() => setStorageDoc(doc)}
                            title="ກົດເພື່ອເລືອກບ່ອນຈັດເກັບໃນຄັງ"
                            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 transition hover:bg-amber-100"
                          >
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>ບໍ່ມີບ່ອນເກັບ</span>
                          </button>
                        )}
                      </div>
                      {doc.transfers && doc.transfers.length > 0 && doc.transfers[0].status === 'pending' && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            🔄 ກຳລັງໂອນຍ້າຍຫາ: {doc.transfers[0].toDepartment}{doc.transfers[0].keepCopy && ' (ເກັບສຳເນົາ)'}
                          </span>
                        </div>
                      )}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
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
                    </td>
                    <td className="px-3 py-2.5"><CategoryBadge category={doc.category} /></td>
                    <td className="px-3 py-2.5 text-sm text-gray-700">{doc.docNumber}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-700 uppercase">{doc.fileType}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-700">{doc.fileSize}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-700">
                      <div>{doc.uploadDate}</div>
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
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[doc.status]}`}>
                        {statusLabels[doc.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="relative inline-flex items-center justify-center gap-1.5">
                        {/* Quick View Button */}
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
                        >
                          ເບິ່ງ
                        </button>

                        {/* Dropdown Menu Trigger */}
                        <button
                          type="button"
                          onClick={() => setActiveDropdownId(activeDropdownId === doc.id ? null : doc.id)}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                            activeDropdownId === doc.id
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                          title="ຈັດການເອກະສານ"
                        >
                          <span>ຈັດການ</span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${
                              activeDropdownId === doc.id ? 'rotate-180 text-indigo-600' : 'text-gray-400'
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
                                  setDetailDoc(doc)
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
                                  setEditDoc(doc)
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition"
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
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
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
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50 transition"
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
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 transition"
                              >
                                <Archive className="h-4 w-4 text-blue-500" />
                                <span>ບ່ອນຈັດເກັບໃນຄັງ</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDropdownId(null)
                                  setTransferDoc(doc)
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition"
                              >
                                <ArrowRightLeft className="h-4 w-4 text-amber-500" />
                                <span>ສົ່ງຂ້າມພະແນກ</span>
                              </button>

                              <div className="my-1 border-t border-gray-100" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDropdownId(null)
                                  handleDelete(doc)
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
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={visible.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemLabel="ເອກະສານ"
          />
        </div>

        {/* Preview Modal: ສະແດງສະເພາະໄຟລ໌ ບໍ່ມີລາຍລະອຽດ */}
        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc ? `ເບິ່ງໄຟລ໌: ${previewDoc.title}` : undefined}
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
                  className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                >
                  ປິດ
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition"
                >
                  ດາວໂຫຼດໄຟລ໌
                </button>
              </div>
            )
          }
        >
          {previewDoc && (
            <div className="flex min-h-0 flex-1 flex-col">
              <DocumentPreview doc={previewDoc} heightClassName="min-h-0 flex-1" />
            </div>
          )}
        </Modal>

        {/* Detail Modal: ສະແດງສະເພາະລາຍລະອຽດຂໍ້ມູນ ບໍ່ສະແດງໄຟລ໌ */}
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition"
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>ແກ້ໄຂ</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailDoc(null)}
                    className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                  >
                    ປິດ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(detailDoc)}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition"
                  >
                    ດາວໂຫຼດໄຟລ໌
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>ບໍ່ມີບ່ອນເກັບ — ກົດເພື່ອລະບຸ</span>
                  </button>
                )}
              </div>

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

        <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="ຢືນຢັນການລົບ">
          <div>
            <p className="mb-4">ທ່ານຕ້ອງການລົບເອກະສານນີ້ແທ້ບໍ? ການລົບຈະເຮັດໃຫ້ເອກະສານເຂົ້າໄປຢູ່ Trash.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-2 rounded bg-gray-100">ຍົກເລີກ</button>
              <button onClick={confirmDeleteNow} className="px-3 py-2 rounded bg-rose-600 text-white">ຢືນຢັນລົບ</button>
            </div>
          </div>
        </Modal>

        <ManageCategoryModal
          open={manageCategoryOpen}
          onClose={() => setManageCategoryOpen(false)}
          categories={categories}
          onAdd={handleAddCategory}
          onRemove={handleRemoveCategory}
          countDocs={countDocsInCategory}
        />

        <TransferDocumentModal
          open={!!transferDoc}
          doc={transferDoc}
          currentUser={currentUser}
          onClose={() => setTransferDoc(null)}
          onSuccess={() => void reload()}
        />

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

        <RenewExpiryModal
          open={Boolean(renewDoc)}
          document={renewDoc}
          onClose={() => setRenewDoc(null)}
          onSuccess={() => void reload()}
        />

        <EditDocumentModal
          open={Boolean(editDoc)}
          doc={editDoc}
          onClose={() => setEditDoc(null)}
          onSuccess={() => void reload()}
        />

      </div>
    </DashboardLayout>
  )
}