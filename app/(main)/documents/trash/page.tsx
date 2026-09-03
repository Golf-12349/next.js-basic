'use client'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../../context/DocumentsContext'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import { pushToast } from '@/app/components/ui/Toast'
import { useDebounce } from '@/hooks/useDebounce'
import { useMemo, useState } from 'react'
import type { Document, DocumentFileType } from '@/types/document'
import {
  ArchiveRestore,
  CircleCheck,
  Clock3,
  Eye,
  File,
  FileImage,
  FileText,
  FolderOpen,
  HardDrive,
  RotateCcw,
  Search,
  Trash2,
  TriangleAlert,
} from 'lucide-react'

// ── Fixed category options (per requirements) ──────────────────────────────
const CATEGORY_OPTIONS = ['ທັງໝົດ', 'ຂາເຂົ້າ', 'ຂາອອກ', 'ຄຳສັ່ງ', 'ແຈ້ງການ', 'ສັນຍາ', 'ລາຍງານ'] as const

// ── File type icon helper ───────────────────────────────────────────────────
function fileTypeInfo(fileType: DocumentFileType) {
  switch (fileType) {
    case 'pdf':
      return { icon: FileText, color: 'bg-rose-50 text-rose-600', label: 'PDF' }
    case 'doc':
      return { icon: File, color: 'bg-blue-50 text-blue-600', label: 'DOC' }
    case 'image':
      return { icon: FileImage, color: 'bg-emerald-50 text-emerald-600', label: 'IMAGE' }
    default:
      return { icon: FileText, color: 'bg-gray-50 text-gray-600', label: (fileType as string).toUpperCase() }
  }
}

// ── Parse "2.4 MB" / "840 KB" → MB number ─────────────────────────────────
function parseSizeToMB(fileSize: string): number {
  const match = /^([\d.]+)\s*(KB|MB|GB)$/i.exec(fileSize.trim())
  if (!match) return 0
  const value = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  if (unit === 'KB') return value / 1024
  if (unit === 'GB') return value * 1024
  return value
}

function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  return `${mb.toFixed(2)} MB`
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function TrashPage() {
  const { documents, restoreDocument, permDeleteDocument } = useDocuments()

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const [filterCategory, setFilterCategory] = useState('ທັງໝົດ')
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null)
  const [confirmEmpty, setConfirmEmpty] = useState(false)

  const trash = useMemo(() => documents.filter((d) => d.deleted), [documents])

  const visible = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    return trash.filter((d) => {
      if (q) {
        if (!(d.title.toLowerCase().includes(q) || d.docNumber.toLowerCase().includes(q))) return false
      }
      if (filterCategory !== 'ທັງໝົດ' && d.category !== filterCategory) return false
      return true
    })
  }, [trash, debouncedQuery, filterCategory])

  const reclaimableMB = useMemo(() => trash.reduce((sum, d) => sum + parseSizeToMB(d.fileSize), 0), [trash])

  function handleRestore(doc: Document) {
    restoreDocument(doc.id)
    pushToast({ title: 'ການກູ້ຄືນສຳເລັດ', description: `"${doc.title}" ຖືກກູ້ຄືນກັບບ່ອນເດີມ` })
  }

  function handleRestoreAll() {
    trash.forEach((d) => restoreDocument(d.id))
    pushToast({ title: 'ກູ້ຄືນທັງໝົດສຳເລັດ', description: `ກູ້ຄືນ ${trash.length} ເອກະສານ` })
  }

  function handlePermDelete() {
    if (!confirmDelete) return
    permDeleteDocument(confirmDelete.id)
    pushToast({ title: 'ເອກະສານຖືກລຶບຢ່າງຖາວອນ', description: `"${confirmDelete.title}" ບໍ່ສາມາດກູ້ຄືນໄດ້ອີກ` })
    setConfirmDelete(null)
  }

  function handleEmptyTrash() {
    trash.forEach((d) => permDeleteDocument(d.id))
    pushToast({ title: 'ລ້າງຖັງຂີ້ເຫຍື້ອສຳເລັດ', description: `ລຶບ ${trash.length} ເອກະສານຢ່າງຖາວອນ` })
    setConfirmEmpty(false)
  }

  return (
    <DashboardLayout title="ຖັງຂີ້ເຫຍື້ອ">
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ── Header & Actions ───────────────────────────────────── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ຖັງຂີ້ເຫຍື້ອ</h1>
            <p className="mt-1 text-sm text-gray-500">
              ລາຍການເອກະສານທີ່ຖືກລຶບຊົ່ວຄາວ ສາມາດກູ້ຄືນ ຫຼື ລຶບຖາວອນໄດ້
            </p>
          </div>

          {trash.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRestoreAll}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
              >
                <ArchiveRestore size={16} />
                ກູ້ຄືນທັງໝົດ
              </button>
              <button
                onClick={() => setConfirmEmpty(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-100"
              >
                <Trash2 size={16} />
                ລ້າງຖັງຂີ້ເຫຍື້ອ
              </button>
            </div>
          )}
        </div>

        {/* ── Stats Summary ──────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Trash2 size={22} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{trash.length}</div>
                <div className="text-sm text-gray-500">🗑️ ຈຳນວນໃນຖັງຂີ້ເຫຍື້ອ</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 size={22} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">30 ວັນ</div>
                <div className="text-sm text-gray-500">⏳ ນະໂຍບາຍການເກັບຮັກສາ</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <HardDrive size={22} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatMB(reclaimableMB)}</div>
                <div className="text-sm text-gray-500">💾 ພື້ນທີ່ທີ່ກູ້ຄືນໄດ້</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Bar ────────────────────────────────── */}
        {trash.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ຄົ້ນຫາ</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ຊື່ເອກະສານ / ເລກທີເອກະສານ"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ໝວດໝູ່</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Empty State ────────────────────────────────────────── */}
        {trash.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CircleCheck className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">ຖັງຂີ້ເຫຍື້ອວ່າງເປົ່າ</h3>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              ບໍ່ມີເອກະສານທີ່ຖືກລຶບຊົ່ວຄາວໃນຕອນນີ້ ເອກະສານທີ່ຖືກລຶບຈະປາກົດຢູ່ທີ່ນີ້.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">ບໍ່ພົບເອກະສານ</h3>
            <p className="mt-1 text-sm text-gray-500">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ໝວດໝູ່ທີ່ເລືອກໄວ້</p>
          </div>
        ) : (
          /* ── Modern Table ─────────────────────────────────────── */
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">ເອກະສານ</th>
                    <th className="px-4 py-3">ໝວດໝູ່ ແລະ ທີ່ຕັ້ງເດີມ</th>
                    <th className="px-4 py-3">ຂະໜາດ</th>
                    <th className="px-4 py-3">ວັນທີອັບໂຫຼດ</th>
                    <th className="px-4 py-3">ຜູ້ອັບໂຫຼດ</th>
                    <th className="px-4 py-3 text-center">ການກະທຳ</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((doc) => {
                    const { icon: TypeIcon, color: typeColor, label: typeLabel } = fileTypeInfo(doc.fileType)
                    return (
                      <tr key={doc.id} className="border-t border-gray-100 align-top transition hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeColor}`}>
                              <TypeIcon size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900">{doc.title}</div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-gray-500">{doc.docNumber}</span>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                                  {typeLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="mb-1 inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                            {doc.category}
                          </span>
                          {(doc.cabinetName || doc.folderName) && (
                            <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                              <FolderOpen size={13} className="shrink-0 text-amber-500" />
                              <span className="truncate">
                                🗄️ {doc.cabinetName ?? '—'} <span className="text-gray-400">{'>'}</span> 📁 {doc.folderName ?? '—'}
                              </span>
                            </div>
                          )}
                          {!doc.cabinetName && !doc.folderName && (
                            <div className="mt-1.5 text-xs text-gray-400">— ບໍ່ໄດ້ຈັດເຂົ້າຄັງເກັບ —</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{doc.fileSize}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{doc.uploadDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{doc.uploadedBy}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              title="ເບິ່ງຕົວຢ່າງ"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                            >
                              <Eye size={14} />
                              ເບິ່ງ
                            </button>
                            <button
                              onClick={() => handleRestore(doc)}
                              title="ກູ້ຄືນ"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <RotateCcw size={14} />
                              ກູ້ຄືນ
                            </button>
                            <button
                              onClick={() => setConfirmDelete(doc)}
                              title="ລຶບຖາວອນ"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                            >
                              <Trash2 size={14} />
                              ລຶບ
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Preview Modal ─────────────────────────────────────── */}
        <Modal open={!!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc?.title}>
          {previewDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <div className="text-xs text-gray-500">ເລກທີ</div>
                  <div className="text-sm font-semibold">{previewDoc.docNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ໝວດໝູ່</div>
                  <div className="text-sm font-semibold">{previewDoc.category}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ທີ່ຕັ້ງເດີມ</div>
                  <div className="text-sm font-semibold">
                    🗄️ {previewDoc.cabinetName ?? '—'} {'>'} 📁 {previewDoc.folderName ?? '—'}
                  </div>
                </div>
              </div>
              <DocumentPreview doc={previewDoc} />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  ປິດ
                </button>
                <button
                  onClick={() => { setPreviewDoc(null); handleRestore(previewDoc) }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <RotateCcw size={14} />
                  ກູ້ຄືນ
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ── Single-item Permanent Delete Modal ────────────────── */}
        <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="ຢືນຢັນການລຶບຖາວອນ">
          {confirmDelete && (
            <div>
              <div className="mb-4 flex items-start gap-3 rounded-lg bg-rose-50 p-4">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <div className="text-sm text-rose-800">
                  <p className="font-semibold">ທ່ານຕ້ອງການລຶບເອກະສານນີ້ຢ່າງຖາວອນແທ້ບໍ?</p>
                  <p className="mt-1 text-rose-700/80">&ldquo;{confirmDelete.title}&rdquo; ຈະຖືກລຶບຖາວອນ ແລະ ບໍ່ສາມາດກູ້ຄືນໄດ້.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  ຍົກເລີກ
                </button>
                <button
                  onClick={handlePermDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                >
                  <Trash2 size={14} />
                  ຢືນຢັນລຶບຖາວອນ
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ── Batch Empty Trash Modal ───────────────────────────── */}
        <Modal open={confirmEmpty} onClose={() => setConfirmEmpty(false)} title="ລ້າງຖັງຂີ້ເຫຍື້ອ">
          <div>
            <div className="mb-4 flex items-start gap-3 rounded-lg bg-rose-50 p-4">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div className="text-sm text-rose-800">
                <p className="font-semibold">ທ່ານຕ້ອງການລ້າງຖັງຂີ້ເຫຍື້ອທັງໝົດແທ້ບໍ?</p>
                <p className="mt-1 text-rose-700/80">
                  ເອກະສານທັງໝົດ {trash.length} ລາຍການໃນຖັງຂີ້ເຫຍື້ອຈະຖືກລຶບຖາວອນ
                  ແລະ ບໍ່ສາມາດກູ້ຄືນໄດ້.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmEmpty(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={handleEmptyTrash}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                <Trash2 size={14} />
                ຢືນຢັນລ້າງຖັງຂີ້ເຫຍື້ອ
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </DashboardLayout>
  )
}