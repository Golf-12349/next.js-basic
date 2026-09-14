'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDocuments } from '@/app/(main)/context/DocumentsContext'
import { useArchive } from '@/app/(main)/context/ArchiveContext'
import { useCurrentUser } from '@/app/(main)/context/CurrentUserContext'
import { pushToast } from '@/app/components/ui/Toast'
import type { DocumentDirection, DocumentFileType, DocumentStatus } from '@/types/document'
import { CheckCircle2, FileText, Loader2, RefreshCw, Trash2, Upload, X } from 'lucide-react'
import { edlStructure } from '@/types/user'
import { DEFAULT_CATEGORIES, DOCUMENT_DIRECTIONS } from '@/lib/dms/constants'

const edlDivisions = Object.keys(edlStructure)

// ສ້າງເລກທີເອກະສານອັດຕະໂນມັດ ເຊັ່ນ DOC-2026-001
function generateDocNumber(): string {
  const year = new Date().getFullYear()
  const seq = Date.now().toString().slice(-3).padStart(3, '0')
  return `DOC-${year}-${seq}`
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

interface UploadDocumentModalProps {
  open: boolean
  onClose: () => void
}

export default function UploadDocumentModal({ open, onClose }: UploadDocumentModalProps) {
  const { user: currentUser } = useCurrentUser()
  const { addDocument, uploadFile, categories, loading, reload } = useDocuments()
  const { cabinets, folders } = useArchive()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [docNumber, setDocNumber] = useState(generateDocNumber)
  const [direction, setDirection] = useState<DocumentDirection>('inbound')
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0])
  const [division, setDivision] = useState('')
  const [department, setDepartment] = useState('')
  const [uploadDate, setUploadDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('')
  const [pdfLoading, setPdfLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cabinetId, setCabinetId] = useState('')
  const [folderId, setFolderId] = useState('')
  const [dragActive, setDragActive] = useState(false)

  // ໝວດໝູ່ ເລືອກໄດ້ — ຕັດ ຂາເຂົ້າ/ຂາອອກ (ທິດທາງ) ອອກຈາກປະເພດເອກະສານ
  const categoryOptions = useMemo(
    () =>
      Array.from(new Set([...DEFAULT_CATEGORIES, ...categories])).filter(
        (c) => c !== 'ຂາເຂົ້າ' && c !== 'ຂາອອກ',
      ),
    [categories],
  )

  // 3-Level archive: folder ຂອງຕູ້ທີເລືອກ
  const visibleFolders = cabinetId ? folders.filter((f) => f.cabinetId === cabinetId) : []

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
    setFolderId('') // ຣີເຊັດແຟ້ມເມື່ອປ່ຽນຕູ້
  }

  function handleDivisionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setDivision(value)
    const available = value ? (edlStructure[value] ?? []) : []
    if (!available.includes(department)) setDepartment('')
  }

  function validateForm(): boolean {
    if (!title.trim()) {
      setError('ກະລຸນາປ້ອນຊື່ເອກະສານ')
      return false
    }
    if (!docNumber.trim()) {
      setError('ກະລຸນາປ້ອນຍັງທີ')
      return false
    }
    if (!division) {
      setError('ກະລຸນາເລືອກຝ່າຍ / ຫ້ອງການ')
      return false
    }
    if (!department) {
      setError('ກະລຸນາເລືອກພະແນກ / ສູນ')
      return false
    }
    if (!selectedFile) {
      setError('ກະລຸນາເລືອກໄຟລ໌')
      return false
    }
    if (!cabinetId) {
      setError('ກະລຸນາເລືອກຕູ້ເອກະສານ')
      return false
    }
    if (!folderId) {
      setError('ກະລຸນາເລືອກແຟ້ມ')
      return false
    }
    setError(null)
    return true
  }

  async function handleSubmit(status: DocumentStatus) {
    if (!validateForm() || !selectedFile) return

    const selectedCabinet = cabinets.find((c) => c.id === cabinetId)
    const selectedFolder = folders.find((f) => f.id === folderId)

    setIsSubmitting(true)
    try {
      // ອັບໂຫຼດໄຟລ໌ຈິງຂຶ້ນ Supabase Storage ກ່ອນ ແລ້ວຄ່ອຍສ້າງ record ເອກະສານ
      const uploaded = await uploadFile(selectedFile)

      await addDocument({
        title: title.trim(),
        docNumber: docNumber.trim(),
        category,
        direction,
        division,
        department,
        status, // 'draft' ສຳລັບບັນທຶກຮ່າງ, 'pending' ສຳລັບົ່ງອະນຸມັດ
        fileType: resolveFileType(selectedFile.name),
        fileSize: uploaded.fileSize,
        uploadDate: uploadDate || new Date().toISOString().slice(0, 10),
        uploadedBy: currentUser?.name || 'ຜູ້ໃຊ້ງານ',
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        // 3-Level archive: save cabinet + folder
        cabinetId,
        cabinetName: selectedCabinet?.name,
        folderId,
        folderName: selectedFolder?.name,
      })

      // Auto refresh data across contexts and pages
      await reload()

      pushToast({
        title: status === 'draft' ? 'ບັນທຶກເປັນສະບັບຮ່າງສຳເລັດ' : 'ອັບໂຫຼດເອກະສານສຳເລັດ',
      })

      // ປິດ modal — ຜູ້ໃຊ້ ຄົ້ນ ຢູ່ໜ້າທີເກົ່າ ກັບຂໍ້ມູນທີ່ refresh ແລ້ວ
      onClose()
    } catch (err) {
      console.error('Upload failed:', err)
      setError('ອັບໂຫຼດເອກະສານລົ້ມເຫຼວ, ກະລຸນາລອງໃໝ່')
    } finally {
      setIsSubmitting(false)
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

        {/* Body: 2 columns (left dropzone/file card, right metadata form), scrolls independently */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid items-start gap-5 lg:grid-cols-2">
            {/* ── LEFT: dropzone + file card ── */}
            <div className="flex flex-col gap-3">
              <label className="mb-0.5 block text-sm font-medium text-slate-300">
                ໄຟລ໌ <span className="text-rose-500">*</span>
              </label>

              {selectedFile ? (
                <div className="flex flex-col overflow-hidden rounded-xl border border-slate-600 bg-slate-800/80">
                  {resolveFileType(selectedFile.name) === 'image' ? (
                    <div className="flex items-center justify-center overflow-hidden bg-slate-900 px-4 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={filePreviewUrl}
                        alt={selectedFile.name}
                        className="max-h-[220px] max-w-full rounded-lg object-contain"
                      />
                    </div>
                  ) : resolveFileType(selectedFile.name) === 'pdf' ? (
                    <div className="relative h-60 overflow-hidden bg-slate-900">
                      {pdfLoading && (
                        <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-300">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ກຳລັງໂຫຼດ PDF...
                        </div>
                      )}
                      <iframe
                        src={filePreviewUrl}
                        title={selectedFile.name}
                        className="h-full w-full"
                        onLoad={() => setPdfLoading(false)}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 bg-slate-900 px-6 py-10 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
                        <FileText className="h-7 w-7 text-indigo-400" />
                      </div>
                      <p className="text-sm text-slate-400">ໄຟລ໌ປະເພດນີ້ບໍ່ສາມາດສະແດງຕົວຢ່າງໄດ້</p>
                    </div>
                  )}

                  {/* File card footer: name/size + checkmark + actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 px-4 py-3">
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
                        ກຽມພາບ
                      </span>
                      <label
                        htmlFor="upload-file-input"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-indigo-400 hover:text-indigo-300"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        ປ່ຽນໄຟລ໌
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20"
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
                  className={`flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                    dragActive
                      ? 'border-indigo-400 bg-indigo-500/15'
                      : 'border-slate-600 bg-slate-800/40 hover:border-indigo-400/60 hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                      dragActive ? 'bg-indigo-500/20' : 'bg-indigo-500/10'
                    }`}
                  >
                    <Upload className={`h-6 w-6 ${dragActive ? 'text-indigo-300' : 'text-indigo-400'}`} />
                  </div>
                  <p className="text-base font-semibold text-slate-200">
                    {dragActive ? 'ປົດໄຟລ໌ມາບໍ່ລິກ...' : 'ລາກ & ວາງໄຟລ໌ ຫຼື ກົດມາບໍ່ລິກ'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">PDF, DOC, PNG, JPG ຈະຖືກຮັບຮອງໃນລະບົບ</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
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

            {/* ── RIGHT: metadata form ── */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-200">ຂໍ້ມູນເອກະສານ</h3>
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
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    ເລກທີ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="DOC-2026-XXX"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400"
                  />
                </div>

                {/* 3-Level archive: Cabinet + Folder dropdowns */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    ຕູ້ເອກະສານ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={cabinetId}
                    onChange={handleCabinetChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400"
                  >
                    <option value=""> ເລືອກຕູ້ເອກະສານ </option>
                    {cabinets.map((c) => (
                      <option key={c.id} value={c.id}>🗄️ {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    ແຟ້ມ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    disabled={!cabinetId}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-800/40 disabled:text-slate-500"
                  >
                    <option value="">{cabinetId ? '— ເລືອກແຟ້ມ —' : '— ກະລຸນາເລືອກຕູ້ກ່ອນ —'}</option>
                    {visibleFolders.map((f) => (
                      <option key={f.id} value={f.id}>📁 {f.name}</option>
                    ))}
                  </select>
                  {cabinetId && visibleFolders.length === 0 && (
                    <p className="mt-1 text-xs text-amber-400">ຕູ້ນີ້ຍັງບໍ່ມີແຟ້ມ — ກະລຸນາສ້າງແຟ້ມກ່ອນທີ່ໜ້າ ຄັງເກັບເອກະສານ</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    ຝ່າຍ / ຫ້ອງການ / ສະຖາບັນ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={division}
                    onChange={handleDivisionChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400"
                  >
                    <option value=""> ເລືອກຝ່າຍ / ຫ້ອງການ </option>
                    {edlDivisions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    ພະແນກ / ສູນ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!division}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-800/40 disabled:text-slate-500"
                  >
                    <option value="">{division ? '— ເລືອກພະແນກ / ສູນ —' : '— ເລືອກຝ່າຍກ່ອນ —'}</option>
                    {(division ? (edlStructure[division] ?? []) : []).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">ທິດທາງ</label>
                  <div className="flex gap-2">
                    {DOCUMENT_DIRECTIONS.map((dir) => (
                      <button
                        key={dir.value}
                        type="button"
                        onClick={() => setDirection(dir.value)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                          direction === dir.value
                            ? 'border-indigo-500 bg-indigo-600 text-white'
                            : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {dir.emoji} {dir.label}
                      </button>
                    ))}
                  </div>
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
              {isSubmitting ? 'ກຳລັງອັບໂຫຼດ...' : 'ບັນທຶກເປັນຮ່າງ'}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('pending')}
              disabled={isSubmitting || loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-900/60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'ກຳລັງອັບໂຫຼດ...' : 'ອັບໂຫຼດເອກະສານ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}