'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDocuments } from '@/app/(main)/context/DocumentsContext'
import { useArchive } from '@/app/(main)/context/ArchiveContext'
import { useCurrentUser } from '@/app/(main)/context/CurrentUserContext'
import { pushToast } from '@/app/components/ui/Toast'
import type { DocumentDirection, DocumentFileType, DocumentStatus } from '@/types/document'
import { CheckCircle2, FileText, Loader2, Lock, RefreshCw, Trash2, Upload, X } from 'lucide-react'
import { DEFAULT_CATEGORIES } from '@/lib/dms/constants'

// ສ້າງເລກທີເອກະສານອັດຕະໂນມັດ ເຊັ່ນ DOC-2026-4819
function generateDocNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `DOC-${year}-${rand}`
}

// ກຳນົດ fileType ຈາກນາມສະກຸນໄຟລ໌ທີ່ຜູ້ໃຊ້ເລືອກ
function resolveFileType(fileName: string): DocumentFileType {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return 'image'
  return 'doc'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function addMonths(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function addYears(years: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().slice(0, 10)
}

interface UploadDocumentModalProps {
  open: boolean
  onClose: () => void
  initialCabinetId?: string
  initialShelfId?: string
  initialFolderId?: string
}

export default function UploadDocumentModal({
  open,
  onClose,
  initialCabinetId,
  initialShelfId,
  initialFolderId,
}: UploadDocumentModalProps) {
  const { user: currentUser } = useCurrentUser()
  const { addDocument, uploadFile, categories, loading, reload } = useDocuments()
  const { warehouses, cabinets, shelves, folders } = useArchive()

  // ດຶງຄ່າ cabinet ແລະ shelf ອັດຕະໂນມັດ ຖ້າມີການສົ່ງ folderId ເຂົ້າມາ
  const resolvedCabinetId = useMemo(() => {
    if (initialCabinetId) return initialCabinetId
    if (initialFolderId) {
      const f = folders.find((item) => item.id === initialFolderId)
      if (f?.cabinetId) return f.cabinetId
    }
    if (initialShelfId) {
      const s = shelves.find((item) => item.id === initialShelfId)
      if (s?.cabinetId) return s.cabinetId
    }
    return ''
  }, [initialCabinetId, initialFolderId, initialShelfId, folders, shelves])

  const resolvedShelfId = useMemo(() => {
    if (initialShelfId) return initialShelfId
    if (initialFolderId) {
      const f = folders.find((item) => item.id === initialFolderId)
      if (f?.shelfId) return f.shelfId
    }
    return ''
  }, [initialShelfId, initialFolderId, folders])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'saving'>('idle')
  const [title, setTitle] = useState('')
  const [docNumber, setDocNumber] = useState(generateDocNumber)
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0])
  const [uploadDate, setUploadDate] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('')
  const [pdfLoading, setPdfLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cabinetId, setCabinetId] = useState(resolvedCabinetId)
  const [shelfId, setShelfId] = useState(resolvedShelfId)
  const [folderId, setFolderId] = useState(initialFolderId || '')
  const [dragActive, setDragActive] = useState(false)

  // ໝວດໝູ່ ເລືອກໄດ້ — ຕັດ ຂາເຂົ້າ/ຂາອອກ (ທິດທາງ) ອອກຈາກປະເພດເອກະສານ
  const categoryOptions = useMemo(
    () =>
      Array.from(new Set([...DEFAULT_CATEGORIES, ...categories])).filter(
        (c) => c !== 'ຂາເຂົ້າ' && c !== 'ຂາອອກ',
      ),
    [categories],
  )

  const visibleCabinets = useMemo(() => {
    if (currentUser?.role === 'DepartmentAdmin' && currentUser.department) {
      const userDept = currentUser.department.trim().toLowerCase();
      return cabinets.filter((c) => c.department?.trim().toLowerCase() === userDept);
    }
    if (currentUser?.role === 'DivisionAdmin' && currentUser.division) {
      return cabinets.filter((c) => !c.division || c.division === currentUser.division);
    }
    return cabinets;
  }, [cabinets, currentUser]);

  // Shelf ຂອງຕູ້ທີເລືອກ
  const visibleShelves = useMemo(() => {
    return cabinetId ? shelves.filter((s) => s.cabinetId === cabinetId) : []
  }, [cabinetId, shelves])

  // Folder ຂອງຕູ້/ຊັ້ນທີເລືອກ
  const visibleFolders = useMemo(() => {
    if (!cabinetId) return []
    if (shelfId) {
      return folders.filter((f) => f.cabinetId === cabinetId && f.shelfId === shelfId)
    }
    return folders.filter((f) => f.cabinetId === cabinetId)
  }, [cabinetId, shelfId, folders])

  // ໝາຍເຫດ: ສະຖານະຟໍຣົມທັງໝົດ ຖືກຣີເຊັດອັດຕະໂນມັດ ເມື່ອ remount (key ປ່ຽນທຸກໆເປີດ) —
  // ບໍ່ຕ້ອງ useEffect + setState ເພື່ອບໍ່ລົ່ວ lint rule `react-hooks/set-state-in-effect`

  // ລຶບ object URL ເມື່ອປ່ຽນໄຟລ໌ ຫຼື ອອກໜ້າການ ເພື່ອປ້ອງກັນການຮົ່ວໄຫຼ
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    }
  }, [filePreviewUrl])

  function applyFile(file: File) {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setSelectedFile(file)
    setFilePreviewUrl(URL.createObjectURL(file))
    setPdfLoading(true)
    setError(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) applyFile(file)
    // ຣີເຊັດຄ່າ input ເພື່ອໃຫ້ສາມາດເລືອກໄຟລ໌ເດີມ ໄດ້ອີກຄັ້ງ
    e.target.value = ''
  }

  function handleRemoveFile() {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setSelectedFile(null)
    setFilePreviewUrl('')
    setError(null)
  }

  function handleCabinetChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setCabinetId(value)
    setShelfId('')
    setFolderId('')
  }

  function handleShelfChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setShelfId(value)
    setFolderId('')
  }

  function validateForm(): boolean {
    if (!title.trim()) {
      setError('ກະລຸນາປ້ອນຊື່ເອກະສານ')
      return false
    }
    if (!docNumber.trim()) {
      setError('ກະລຸນາປ້ອນເລກທີເອກະສານ')
      return false
    }
    if (!selectedFile) {
      setError('ກະລຸນາເລືອກໄຟລ໌')
      return false
    }
    setError(null)
    return true
  }

  async function handleSubmit(status: DocumentStatus) {
    if (!validateForm() || !selectedFile) return

    const selectedCabinet = cabinets.find((c) => c.id === cabinetId)
    const selectedShelf = shelves.find((s) => s.id === shelfId)
    const selectedFolder = folders.find((f) => f.id === folderId)
    const selectedWarehouse = selectedCabinet?.warehouseId
      ? warehouses.find((w) => w.id === selectedCabinet.warehouseId)
      : undefined

    const effectiveDivision = currentUser?.division || selectedCabinet?.division || undefined
    const effectiveDepartment = currentUser?.department || selectedCabinet?.department || undefined

    setIsSubmitting(true)
    setUploadStep('uploading')
    try {
      // 1. ອັບໂຫຼດໄຟລ໌ຈິງຂຶ້ນ Supabase Storage ກ່ອນ
      const uploaded = await uploadFile(selectedFile)

      // 2. ບັນທຶກຂໍ້ມູນເອກະສານລົງຖານຂໍ້ມູນ
      setUploadStep('saving')
      await addDocument({
        title: title.trim(),
        docNumber: docNumber.trim(),
        category,
        division: effectiveDivision,
        department: effectiveDepartment,
        status,
        fileType: resolveFileType(selectedFile.name),
        fileSize: uploaded.fileSize,
        uploadDate: uploadDate || new Date().toISOString().slice(0, 10),
        expiresAt: expiresAt || undefined,
        uploadedBy: currentUser?.name || 'ຜູ້ໃຊ້ງານ',
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        // 5-Level archive: save warehouse + cabinet + shelf + folder
        warehouseId: selectedWarehouse?.id || undefined,
        warehouseName: selectedWarehouse?.name,
        cabinetId: cabinetId || undefined,
        cabinetName: selectedCabinet?.name,
        shelfId: shelfId || undefined,
        shelfName: selectedShelf?.name,
        folderId: folderId || undefined,
        folderName: selectedFolder?.name,
      })

      // ແຈ້ງ toast ແລະ ປິດ modal ທັນທີ (ບໍ່ຕ້ອງລໍຖ້າ reload ທັງໝົດໃຫ້ໜ່ວງ)
      pushToast({
        title: status === 'draft' ? 'ບັນທຶກເປັນສະບັບຮ່າງສຳເລັດ' : 'ອັບໂຫຼດເອກະສານສຳເລັດ',
      })
      onClose()

      // Sync ຂໍ້ມູນໃນພື້ນຫຼັງ (Background)
      void reload()
    } catch (err: unknown) {
      console.error('Upload failed:', err)
      let msg = 'ອັບໂຫຼດເອກະສານລົ້ມເຫຼວ, ກະລຸນາລອງໃໝ່'
      if (err instanceof Error && err.message) {
        msg = err.message
      }
      setError(msg)
      pushToast({ title: 'ອັບໂຫຼດເອກະສານບໍ່ສຳເລັດ', description: msg })
    } finally {
      setIsSubmitting(false)
      setUploadStep('idle')
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl"
        style={{ colorScheme: 'dark' }}
      >
        {/* Header: title & close — never scrolls away */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 px-5 py-3.5">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">ອັບໂຫຼດເອກະສານ</h2>
            <p className="mt-0.5 text-xs text-slate-400">PDF, DOC, PNG, JPG — ໄຟລ໌ + ຂໍ້ມູນເອກະສານ</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ປິດ"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body: 2 columns (left dropzone/file card fills full height, right metadata form scrolls independently) */}
        <div className="min-h-0 flex-1 overflow-hidden px-5 py-4">
          <div className="grid h-full min-h-0 gap-6 lg:grid-cols-2">
            {/* ── LEFT: dropzone + file card (Full height, pinned) ── */}
            <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-hidden">
              <label className="mb-0.5 block text-sm font-medium text-slate-300 shrink-0">
                ໄຟລ໌ <span className="text-rose-500">*</span>
              </label>

              {selectedFile ? (
                <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl border border-slate-600 bg-slate-800/80 shadow-inner">
                  {resolveFileType(selectedFile.name) === 'image' ? (
                    <div className="flex flex-1 min-h-0 items-center justify-center overflow-hidden bg-slate-900 px-4 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={filePreviewUrl}
                        alt={selectedFile.name}
                        className="max-h-full max-w-full rounded-lg object-contain"
                      />
                    </div>
                  ) : resolveFileType(selectedFile.name) === 'pdf' ? (
                    <div className="relative flex-1 min-h-0 overflow-hidden bg-slate-900">
                      {pdfLoading && (
                        <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-300">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ກຳລັງໂຫຼດ PDF...
                        </div>
                      )}
                      <iframe
                        src={filePreviewUrl}
                        title={selectedFile.name}
                        className="h-full w-full border-0"
                        onLoad={() => setPdfLoading(false)}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-3 bg-slate-900 px-6 py-10 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10">
                        <FileText className="h-8 w-8 text-indigo-400" />
                      </div>
                      <p className="text-sm text-slate-400">ໄຟລ໌ປະເພດນີ້ບໍ່ສາມາດສະແດງຕົວຢ່າງໄດ້</p>
                    </div>
                  )}

                  {/* File card footer: name/size + checkmark + actions */}
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-700 bg-slate-800/90 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-5 w-5 shrink-0 text-indigo-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        ກຽມພ້ອມ
                      </span>
                      <label
                        htmlFor="upload-file-input"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-indigo-400 hover:text-indigo-300 transition"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        ປ່ຽນໄຟລ໌
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        ລຶບໄຟລ໌
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="upload-file-input"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragActive(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setDragActive(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragActive(false)
                    const file = e.dataTransfer?.files?.[0]
                    if (file) applyFile(file)
                  }}
                  className={`flex flex-1 h-full min-h-0 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
                    dragActive
                      ? 'border-indigo-400 bg-indigo-500/15 ring-4 ring-indigo-500/20'
                      : 'border-slate-600/80 bg-slate-800/30 hover:border-indigo-400/80 hover:bg-slate-800/50'
                  }`}
                >
                  <div
                    className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl transition ${
                      dragActive ? 'bg-indigo-500/20 text-indigo-300 scale-110' : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    <Upload className="h-10 w-10" />
                  </div>
                  <p className="text-base font-bold text-slate-100">
                    {dragActive ? 'ປ່ອຍໄຟລ໌ລົງທີ່ນີ້...' : 'ລາກ & ວາງໄຟລ໌ ຫຼື ກົດເພື່ອເລືອກໄຟລ໌'}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400 max-w-xs">
                    ຮອງຮັບ PDF, DOC, DOCX, PNG, JPG ຈະຖືກຮັບຮອງໃນລະບົບ
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95">
                    <Upload className="h-4 w-4" />
                    ເລືອກໄຟລ໌
                  </span>
                </label>
              )}

              <input
                id="upload-file-input"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
            </div>

            {/* ── RIGHT: metadata form (Independently scrollable) ── */}
            <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1.5">
              <h3 className="text-sm font-bold text-slate-200 shrink-0">ຂໍ້ມູນເອກະສານ</h3>
              <div className="space-y-3.5 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    ຊື່ເອກະສານ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ປ້ອນຊື່ເອກະສານ"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400"
                  />
                </div>

                {/* ເລກທີ: ສ້າງອັດຕະໂນມັດ ແລະ ບໍ່ສາມາດແກ້ໄຂໄດ້ */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      ເລກທີເອກະສານ <span className="text-rose-500">*</span>
                    </label>
                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
                      <Lock className="h-3 w-3" />
                      ອັດຕະໂນມັດ (Auto)
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={docNumber}
                      readOnly
                      tabIndex={-1}
                      title="ເລກທີເອກະສານຖືກສ້າງຂຶ້ນອັດຕະໂນມັດ ບໍ່ສາມາດແກ້ໄຂໄດ້"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-mono font-bold text-indigo-300 outline-none cursor-not-allowed select-all"
                    />
                    <button
                      type="button"
                      onClick={() => setDocNumber(generateDocNumber())}
                      title="ສ້າງເລກທີໃໝ່ອັດຕະໂນມັດ"
                      className="absolute right-2 inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                    >
                      <RefreshCw className="h-3 w-3 text-indigo-400" />
                      <span>ສ້າງໃໝ່</span>
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    ລະບົບກຳນົດເລກທີເອກະສານໃຫ້ອັດຕະໂນມັດ ບໍ່ສາມາດພິມແກ້ໄຂໄດ້
                  </p>
                </div>

                {/* 5-Level archive: Cabinet + Shelf + Folder dropdowns */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    ຕູ້ເອກະສານ <span className="text-xs text-slate-400">(ເລືອກໄດ້)</span>
                  </label>
                  <select
                    value={cabinetId}
                    onChange={handleCabinetChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400"
                  >
                    <option value="">— ເລືອກຕູ້ເອກະສານ (ບໍ່ບັງຄັບ) —</option>
                    {visibleCabinets.map((c) => (
                      <option key={c.id} value={c.id}>🗄️ {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    ຊັ້ນວາງເອກະສານ <span className="text-xs text-slate-400">(ເລືອກໄດ້)</span>
                  </label>
                  <select
                    value={shelfId}
                    onChange={handleShelfChange}
                    disabled={!cabinetId}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-800/40 disabled:text-slate-500"
                  >
                    <option value="">{cabinetId ? '— ທຸກຊັ້ນວາງ / ບໍ່ລະບຸ —' : '— ກະລຸນາເລືອກຕູ້ກ່ອນ —'}</option>
                    {visibleShelves.map((s) => (
                      <option key={s.id} value={s.id}>🪜 {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    ແຟ້ມເກັບເອກະສານ <span className="text-xs text-slate-400">(ເລືອກໄດ້)</span>
                  </label>
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    disabled={!cabinetId}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-800/40 disabled:text-slate-500"
                  >
                    <option value="">{cabinetId ? '— ເລືອກແຟ້ມ (ບໍ່ບັງຄັບ) —' : '— ກະລຸນາເລືອກຕູ້ກ່ອນ —'}</option>
                    {visibleFolders.map((f) => (
                      <option key={f.id} value={f.id}>📁 {f.name}</option>
                    ))}
                  </select>
                  {cabinetId && visibleFolders.length === 0 && (
                    <p className="mt-1 text-xs text-amber-400">ຕູ້ນີ້ຍັງບໍ່ມີແຟ້ມ — ສາມາດສ້າງແຟ້ມໄດ້ທີ່ໜ້າ ຄັງເກັບເອກະສານ</p>
                  )}
                </div>
                {/* ຂໍ້ມູນພະແນກ ແລະ ຝ່າຍ (ກຳນົດອັດຕະໂນມັດຈາກຜູ້ໃຊ້) */}
                <div className="rounded-lg border border-slate-700/80 bg-slate-800/60 p-3 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    <span>🏢 ພະແນກ:</span>
                    <span className="text-indigo-400 font-semibold">{currentUser?.department || '—'}</span>
                  </div>
                  {currentUser?.division && (
                    <div className="mt-1 text-slate-400">
                      <span>ຝ່າຍ:</span> {currentUser.division}
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">ປະເພດເອກະສານ</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400"
                  >
                    {categoryOptions.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">ວັນທີ</label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400"
                  />
                </div>

                {/* ວັນທີໝົດອາຍຸ (Expiration Date) */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      ວັນທີໝົດອາຍຸ <span className="text-xs text-slate-400">(ເລືອກໄດ້)</span>
                    </label>
                    {expiresAt && (
                      <button
                        type="button"
                        onClick={() => setExpiresAt('')}
                        className="text-[11px] text-rose-400 hover:text-rose-300 underline"
                      >
                        ລ້າງອອກ (ບໍ່ກຳນົດ)
                      </button>
                    )}
                  </div>

                  {/* Quick Presets */}
                  <div className="mb-2 grid grid-cols-4 gap-1.5">
                    {[
                      { label: '6 ເດືອນ', val: addMonths(6) },
                      { label: '1 ປີ', val: addYears(1) },
                      { label: '3 ປີ', val: addYears(3) },
                      { label: '5 ປີ', val: addYears(5) },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setExpiresAt(p.val)}
                        className={`rounded-md border py-1 text-xs font-medium transition ${
                          expiresAt === p.val
                            ? 'border-indigo-500 bg-indigo-600/30 text-indigo-200'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="date"
                    value={expiresAt}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    ຖ້າບໍ່ເລືອກ ລະບົບຈະຖືວ່າເອກະສານນີ້ບໍ່ມີກຳນົດໝົດອາຍຸ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: fixed at bottom, never scrolls away */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-800 px-5 py-3.5">
          <div className="min-w-0 flex-1">
            {error && <p className="text-xs text-rose-400">{error}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ຍົກເລີກ
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting || loading}
              className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? uploadStep === 'uploading'
                  ? 'ກຳລັງອັບໂຫຼດໄຟລ໌...'
                  : 'ກຳລັງບັນທຶກ...'
                : 'ບັນທຶກເປັນຮ່າງ'}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('approved')}
              disabled={isSubmitting || loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-900/60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? uploadStep === 'uploading'
                  ? 'ກຳລັງອັບໂຫຼດໄຟລ໌...'
                  : 'ກຳລັງບັນທຶກ...'
                : 'ອັບໂຫຼດເອກະສານ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}