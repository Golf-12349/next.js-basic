'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDocuments } from '@/app/(main)/context/DocumentsContext'
import { useArchive } from '@/app/(main)/context/ArchiveContext'
import { useMasterData } from '@/app/(main)/context/MasterDataContext'
import { pushToast } from '@/app/components/ui/Toast'
import type { Document, DocumentDirection, DocumentFileType, DocumentStatus } from '@/types/document'
import { edlStructure } from '@/types/user'
import { DEFAULT_CATEGORIES } from '@/lib/dms/constants'
import {
  Pencil,
  X,
  Save,
  FileText,
  Calendar,
  Building2,
  Archive,
  Upload,
  AlertTriangle,
  Loader2,
  Trash2,
  RotateCcw,
} from 'lucide-react'

interface EditDocumentModalProps {
  open: boolean
  doc: Document | null
  onClose: () => void
  onSuccess?: (updatedDoc: Document) => void
}

function resolveFileType(fileName: string): DocumentFileType {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return 'image'
  return 'doc'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function addMonthsFromNow(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function addYearsFromNow(years: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().slice(0, 10)
}

export default function EditDocumentModal({
  open,
  doc,
  onClose,
  onSuccess,
}: EditDocumentModalProps) {
  const { updateDocument, uploadFile, categories } = useDocuments()
  const { warehouses, cabinets, shelves, folders } = useArchive()
  const { tags: masterTags } = useMasterData()

  // Form states
  const [title, setTitle] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0])
  const [direction, setDirection] = useState<DocumentDirection | ''>('')
  const [division, setDivision] = useState('')
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState<DocumentStatus>('draft')
  const [expiresAt, setExpiresAt] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Storage states
  const [warehouseId, setWarehouseId] = useState('')
  const [cabinetId, setCabinetId] = useState('')
  const [shelfId, setShelfId] = useState('')
  const [folderId, setFolderId] = useState('')

  // File replacement state
  const [replaceFile, setReplaceFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Populate form on document change
  useEffect(() => {
    if (!doc || !open) return

    setTitle(doc.title || '')
    setDocNumber(doc.docNumber || '')
    setCategory(doc.category || DEFAULT_CATEGORIES[0])
    setDirection(
      (doc.direction as DocumentDirection) ||
        (doc.category === 'ຂາເຂົ້າ' ? 'inbound' : doc.category === 'ຂາອອກ' ? 'outbound' : ''),
    )
    setDivision(doc.division || '')
    setDepartment(
      typeof doc.department === 'string'
        ? doc.department
        : typeof doc.department === 'object' && doc.department !== null
          ? (doc.department as { name?: string }).name || ''
          : '',
    )
    setStatus(doc.status || 'draft')
    setExpiresAt(doc.expiresAt ? doc.expiresAt.slice(0, 10) : '')
    setSelectedTags(Array.isArray(doc.tags) ? doc.tags : [])

    setWarehouseId(doc.warehouseId || '')
    setCabinetId(doc.cabinetId || '')
    setShelfId(doc.shelfId || '')
    setFolderId(doc.folderId || '')

    setReplaceFile(false)
    setSelectedFile(null)
    setUploadProgress(0)
    setError(null)
  }, [doc, open])

  // Category choices
  const categoryOptions = useMemo(
    () =>
      Array.from(new Set([...DEFAULT_CATEGORIES, ...categories])).filter(
        (c) => c !== 'ຂາເຂົ້າ' && c !== 'ຂາອອກ',
      ),
    [categories],
  )

  // Department choices based on selected division
  const availableDepartments = useMemo(() => {
    if (division && edlStructure[division]) {
      return edlStructure[division]
    }
    // Flatten all departments if no division selected
    return Object.values(edlStructure).flat()
  }, [division])

  // Filter cabinets based on selected warehouse
  const filteredCabinets = useMemo(() => {
    if (!warehouseId) return cabinets
    return cabinets.filter((c) => c.warehouseId === warehouseId)
  }, [cabinets, warehouseId])

  // Filter shelves based on selected cabinet
  const filteredShelves = useMemo(() => {
    if (!cabinetId) return []
    return shelves.filter((s) => s.cabinetId === cabinetId)
  }, [shelves, cabinetId])

  // Filter folders based on cabinet and shelf
  const filteredFolders = useMemo(() => {
    if (!cabinetId) return []
    if (shelfId) {
      return folders.filter((f) => f.cabinetId === cabinetId && f.shelfId === shelfId)
    }
    return folders.filter((f) => f.cabinetId === cabinetId)
  }, [folders, cabinetId, shelfId])

  // Auto-sync storage selections
  function handleWarehouseChange(whId: string) {
    setWarehouseId(whId)
    if (cabinetId) {
      const cab = cabinets.find((c) => c.id === cabinetId)
      if (whId && cab && cab.warehouseId !== whId) {
        setCabinetId('')
        setShelfId('')
        setFolderId('')
      }
    }
  }

  function handleCabinetChange(cabId: string) {
    setCabinetId(cabId)
    setShelfId('')
    setFolderId('')
    if (cabId) {
      const cab = cabinets.find((c) => c.id === cabId)
      if (cab?.warehouseId) {
        setWarehouseId(cab.warehouseId)
      }
    }
  }

  function handleShelfChange(shId: string) {
    setShelfId(shId)
    setFolderId('')
  }

  function handleClearStorage() {
    setWarehouseId('')
    setCabinetId('')
    setShelfId('')
    setFolderId('')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
    }
    e.target.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!doc) return

    if (!title.trim()) {
      setError('ກະລຸນາປ້ອນຊື່ເອກະສານ')
      return
    }
    if (!docNumber.trim()) {
      setError('ກະລຸນາປ້ອນເລກທີເອກະສານ')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      let fileMeta: Partial<Document> = {}

      // If user provided a replacement file
      if (replaceFile && selectedFile) {
        const uploadRes = await uploadFile(selectedFile, (progress) => {
          setUploadProgress(progress)
        })

        fileMeta = {
          fileUrl: uploadRes.fileUrl,
          fileName: uploadRes.fileName,
          fileSize: uploadRes.fileSize || formatBytes(selectedFile.size),
          fileType: resolveFileType(selectedFile.name),
        }
      }

      // Lookup location names
      const selWarehouse = warehouseId ? warehouses.find((w) => w.id === warehouseId) : undefined
      const selCabinet = cabinetId ? cabinets.find((c) => c.id === cabinetId) : undefined
      const selShelf = shelfId ? shelves.find((s) => s.id === shelfId) : undefined
      const selFolder = folderId ? folders.find((f) => f.id === folderId) : undefined

      const patch: Partial<Document> = {
        title: title.trim(),
        docNumber: docNumber.trim(),
        category: category.trim(),
        direction: direction || undefined,
        division: division.trim() || undefined,
        department: department.trim() || undefined,
        status,
        expiresAt: expiresAt ? expiresAt : '',
        warehouseId: warehouseId || '',
        warehouseName: selWarehouse?.name || '',
        cabinetId: cabinetId || '',
        cabinetName: selCabinet?.name || '',
        shelfId: shelfId || '',
        shelfName: selShelf?.name || '',
        folderId: folderId || '',
        folderName: selFolder?.name || '',
        tags: selectedTags,
        ...fileMeta,
      }

      await updateDocument(doc.id, patch)

      pushToast({
        title: 'ແກ້ໄຂເອກະສານສຳເລັດ',
        description: `ອັບເດດຂໍ້ມູນ ${title} ຮຽບຮ້ອຍແລ້ວ`,
      })

      const updatedDoc: Document = {
        ...doc,
        ...patch,
      }

      onSuccess?.(updatedDoc)
      onClose()
    } catch (err) {
      console.error('Update document error:', err)
      setError('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກເອກະສານ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open || !doc) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl my-auto rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Pencil className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  ແກ້ໄຂເອກະສານ
                </h3>
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 font-mono">
                  {doc.docNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                ປັບປຸງຂໍ້ມູນເອກະສານ, ບ່ອນຈັດເກັບ, ແລະ ໄຟລ໌ແນບ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            title="ປິດ"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Basic Document Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <FileText className="h-3.5 w-3.5 text-indigo-600" />
                <span>ຂໍ້ມູນພື້ນຖານເອກະສານ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ຊື່ເອກະສານ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="ປ້ອນຊື່ເອກະສານ..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                  />
                </div>

                {/* Doc Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ເລກທີເອກະສານ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    required
                    placeholder="DOC-2026-XXXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ໝວດໝູ່ເອກະສານ (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Direction */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ທິດທາງເອກະສານ (Flow)
                  </label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as DocumentDirection | '')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                  >
                    <option value="">-- ບໍ່ກຳນົດ --</option>
                    <option value="inbound">ຂາເຂົ້າ (Inbound)</option>
                    <option value="outbound">ຂາອອກ (Outbound)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ສະຖານະເອກະສານ
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                  >
                    <option value="draft">ຮ່າງ (Draft)</option>
                    <option value="pending">ລໍຖ້າອະນຸມັດ (Pending)</option>
                    <option value="approved">ອະນຸມັດ (Approved)</option>
                    <option value="expired">ໝົດອາຍຸ (Expired)</option>
                    <option value="archived">ເກັບເຂົ້າຄັງ (Archived)</option>
                  </select>
                </div>

                {/* ປ້າຍກຳກັບ / ແທັກ (Tags) */}
                <div className="sm:col-span-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      ປ້າຍກຳກັບ / ແທັກ (Tags) <span className="text-xs text-slate-400 font-normal">(ເລືອກໄດ້ຫຼາຍອັນ)</span>
                    </label>
                    {selectedTags.length > 0 && (
                      <span className="text-[11px] text-indigo-600 font-medium">
                        ເລືອກແລ້ວ {selectedTags.length} ແທັກ
                      </span>
                    )}
                  </div>
                  {masterTags && masterTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
                      {masterTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.name)
                        return (
                          <button
                            type="button"
                            key={tag.id}
                            onClick={() => {
                              setSelectedTags((prev) =>
                                prev.includes(tag.name)
                                  ? prev.filter((t) => t !== tag.name)
                                  : [...prev, tag.name],
                              )
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: tag.color || '#6366f1' }}
                            />
                            <span>{tag.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">ບໍ່ມີແທັກໃນລະບົບ (ສາມາດເພີ່ມໄດ້ທີ່ ຂໍ້ມູນພື້ນຖານ &gt; ແທັກ)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Division & Department */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                <span>ຝ່າຍ & ພະແນກທີ່ຮັບຜິດຊອບ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Division */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ຝ່າຍ / ສຳນັກງານ (Division)
                  </label>
                  <select
                    value={division}
                    onChange={(e) => {
                      setDivision(e.target.value)
                      setDepartment('')
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                  >
                    <option value="">-- ເລືອກຝ່າຍ --</option>
                    {Object.keys(edlStructure).map((divName) => (
                      <option key={divName} value={divName}>
                        {divName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ພະແນກ / ສູນ (Department)
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                  >
                    <option value="">-- ເລືອກພະແນກ --</option>
                    {availableDepartments.map((deptName) => (
                      <option key={deptName} value={deptName}>
                        {deptName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Expiry Date */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                  <span>ອາຍຸເອກະສານ & ວັນທີໝົດອາຍຸ</span>
                </div>
                {expiresAt && (
                  <button
                    type="button"
                    onClick={() => setExpiresAt('')}
                    className="text-[11px] font-medium text-rose-600 hover:underline"
                  >
                    ລ້າງວັນທີ (ບໍ່ມີກຳນົດ)
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] text-slate-400 mr-1">ກຳນົດໄວ:</span>
                  <button
                    type="button"
                    onClick={() => setExpiresAt(addMonthsFromNow(6))}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  >
                    +6 ເດືອນ
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiresAt(addYearsFromNow(1))}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  >
                    +1 ປີ
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiresAt(addYearsFromNow(3))}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  >
                    +3 ປີ
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiresAt(addYearsFromNow(5))}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  >
                    +5 ປີ
                  </button>
                </div>
              </div>
            </div>

            {/* Section 4: Physical Storage Location */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Archive className="h-3.5 w-3.5 text-indigo-600" />
                  <span>ບ່ອນຈັດເກັບໃນຄັງ (Physical Storage)</span>
                </div>
                {(warehouseId || cabinetId || shelfId || folderId) && (
                  <button
                    type="button"
                    onClick={handleClearStorage}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>ຍົກເລີກບ່ອນຈັດເກັບ (ເກັບເປັນຍັງບໍ່ມີບ່ອນເກັບ)</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Warehouse */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    🏛️ ຄັງເອກະສານ
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => handleWarehouseChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                  >
                    <option value="">-- ບໍ່ກຳນົດຄັງ --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cabinet */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    🗄️ ຕູ້ເອກະສານ
                  </label>
                  <select
                    value={cabinetId}
                    onChange={(e) => handleCabinetChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                  >
                    <option value="">-- ບໍ່ກຳນົດຕູ້ --</option>
                    {filteredCabinets.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shelf */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    🪜 ຊັ້ນວາງ
                  </label>
                  <select
                    value={shelfId}
                    onChange={(e) => handleShelfChange(e.target.value)}
                    disabled={!cabinetId}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition disabled:opacity-50"
                  >
                    <option value="">-- ບໍ່ກຳນົດຊັ້ນ --</option>
                    {filteredShelves.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Folder */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    📁 ແຟ້ມເອກະສານ
                  </label>
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    disabled={!cabinetId}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition disabled:opacity-50"
                  >
                    <option value="">-- ບໍ່ກຳນົດແຟ້ມ --</option>
                    {filteredFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 5: Attached File */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Upload className="h-3.5 w-3.5 text-indigo-600" />
                  <span>ໄຟລ໌ເອກະສານ (Attached File)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReplaceFile(!replaceFile)
                    setSelectedFile(null)
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  {replaceFile ? '← ໃຊ້ໄຟລ໌ເດີມ' : '🔄 ປ່ຽນໄຟລ໌ໃໝ່'}
                </button>
              </div>

              {/* Current File Display */}
              {!replaceFile ? (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-indigo-600 shadow-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-slate-800 truncate">
                        {doc.fileName || doc.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="uppercase font-semibold text-slate-600">{doc.fileType}</span>
                        <span>•</span>
                        <span>{doc.fileSize || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition shrink-0"
                    >
                      <span>ເປີດເບິ່ງ</span>
                    </a>
                  )}
                </div>
              ) : (
                /* Upload Replacement File */
                <div className="space-y-3">
                  <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/20 p-4 sm:p-6 text-center hover:bg-indigo-50/40 transition">
                    <input
                      type="file"
                      id="edit-doc-file-input"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    />
                    <label
                      htmlFor="edit-doc-file-input"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div className="text-xs font-semibold text-indigo-600">
                        ກົດເພື່ອເລືອກໄຟລ໌ໃໝ່ທີ່ຕ້ອງການປ່ຽນແທນ
                      </div>
                      <p className="text-[11px] text-slate-400">
                        ຮອງຮັບໄຟລ໌ PDF, Word (.doc, .docx), ຫຼື ຮູບພາບ (PNG, JPG) ສູງສຸດ 20MB
                      </p>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span className="text-xs font-medium text-slate-800 truncate">
                          {selectedFile.name} ({formatBytes(selectedFile.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-slate-400 hover:text-rose-500 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>ກຳລັງອັບໂຫຼດໄຟລ໌...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
            >
              ຍົກເລີກ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>ກຳລັງບັນທຶກ...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>ບັນທຶກການແກ້ໄຂ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
