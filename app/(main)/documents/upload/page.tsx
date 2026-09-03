"use client"
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../../context/DocumentsContext'
import { useArchive } from '../../context/ArchiveContext'
import { pushToast } from '@/app/components/ui/Toast'
import type { DocumentFileType, DocumentStatus } from '@/types/document'
import { FileText, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react'
import { edlStructure } from '@/types/user'

const edlDivisions = Object.keys(edlStructure)

const documentTypeOptions = [
  'ເອກະສານການເງິນ',
  'ແຈ້ງການ / ປະກາດ',
  'ສັນຍາ & ຂໍ້ຕົກລົງ',
  'ບົດລາຍງານ',
  'ຄຳສັ່ງ / ມະຕິ',
  'ອື່ນໆ',
]

// ໝວດໝູ່ມານົອກ DMS — ເຫົ່ດືຶມປົວໝົດ ເມື່ອ categories ຈາກ useDMS ຍັງວາງເປົ້ອຍ (e.g. ເວົເປືອຍ ກ່ອນການລົ້ດ from backend)
const DEFAULT_CATEGORIES = [
  'ຂາເຂົ້າ',
  'ຂາອອກ',
  'ຄຳສັ່ງ',
  'ແຈ້ງການ',
  'ສັນຍາ',
  'ລາຍງານ',
  'ທົ່ວໄປ',
]

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

export default function UploadDocumentPage() {
  const router = useRouter()
  const { addDocument, uploadFile, categories } = useDocuments()
  const { cabinets, folders } = useArchive()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  // ອັດຕະໂນມັດຕື່ມເລກທີ reacts ເມື່ອເຂົ້າມາໜ້ານີ້ (ຜູ້ໃຊ້ສາມາດແກ້ໄຂໄດ້)
  const [docNumber, setDocNumber] = useState(generateDocNumber)
  // ໝວດໝູ່ ເລືອກໄດ້ຄຳອນຕົ້ມັດົດ ກັບຕົວເລືອກທຳອິດ — ສະນັ້ງ dropdown ບໍ່ວາງເປົ້ອຍ
  const categoryOptions = useMemo(
    () => Array.from(new Set([...DEFAULT_CATEGORIES, ...categories])),
    [categories]
  )
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0])
  const [division, setDivision] = useState('')
  const [department, setDepartment] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [uploadDate, setUploadDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('')
  const [pdfLoading, setPdfLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // ຮັກບັກໃຫ້ category ທີ່ເລືອກ ຍັງຢູ່ໃນໝວດໝູ່; ຖົ້ບໍ່, ຣີເຊັດໄປທີ່ທຳອິດ ເພື່ອບໍ່ໃຫ້ dropdown ວາງເປົ້ອຍ
    if (!category || !categoryOptions.includes(category)) setCategory(categoryOptions[0])
  }, [categories, category, categoryOptions])

  // ລຶບ object URL ເມື່ອປ່ຽນໄຟລ໌ ຫຼື ອອກໜ້າການ ເພື່ອປ້ອງກັນການຮົ່ວໄຫຼ
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    }
  }, [filePreviewUrl])

  // 3-Level archive: cabinet + folder selection
  const [cabinetId, setCabinetId] = useState('')
  const [folderId, setFolderId] = useState('')

  // ການກັນສະເພາະແຟ້ມຂອງຕູ້ທີ່ເລືອກ
  const visibleFolders = cabinetId ? folders.filter((f) => f.cabinetId === cabinetId) : []

  function handleCabinetChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setCabinetId(value)
    setFolderId('') // ຣີເຊັດແຟ້ມເມື່ອປ່ຽນຕູ້
  }

  // ສະແດງພະແນກ/ສູນ ພາຍໃຕ້ຝ່າຍທີ່ເລືອກ ແລະ ຣີເຊັດພະແນກ ເມື່ອປ່ຽນຝ່າຍ
  function handleDivisionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setDivision(value)
    const available = value ? (edlStructure[value] ?? []) : []
    if (!available.includes(department)) setDepartment('')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // ສ້າງ preview URL ຈາກໄຟລ໌ທີ່ເລືອກ ເພື່ອໃຊ້ສະແດງຕົວຢ່າງໃນ DocumentPreview
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
      setSelectedFile(file)
      setFilePreviewUrl(URL.createObjectURL(file))
      setPdfLoading(true)
    }
    // ຣີເຊັດຄ່າ input ເພື່ອໃຫ້ສາມາດເລືອກໄຟລ໌ເດີມ ໄດ້ອີກຄັ້ງ
    e.target.value = ''
  }

  function handleRemoveFile() {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setSelectedFile(null)
    setFilePreviewUrl('')
    setError(null)

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
    if (!documentType) {
      setError('ກະລຸນາເລືອກຕຳບົບເອກະສານ')
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
      // ອັບໂຫຼດໄຟລ໌ຈິງຂຶ້ນ Supabase Storage ກ່ອນ ແລ້ວຄ່ອຍສ້າງ record ເອກະສານໂດຍໃຊ້ URL ທີ່ໄດ້ກັບມາ
      const uploaded = await uploadFile(selectedFile)

      await addDocument({
        title: title.trim(),
        docNumber: docNumber.trim(),
        category,
        division,
        department,
        documentType,
        status, // 'draft' ສຳລັບບັນທຶກຮ່າງ, 'pending' ສຳລັບສົ່ງອະນຸມັດ
        fileType: resolveFileType(selectedFile.name),
        fileSize: uploaded.fileSize,
        uploadDate: uploadDate || new Date().toISOString().slice(0, 10),
        uploadedBy: '-', // backend ຈະໃຊ້ user ທີ່ login ຢູ່ ແທນຄ່ານີ້
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        // 3-Level archive: save cabinet + folder
        cabinetId,
        cabinetName: selectedCabinet?.name,
        folderId,
        folderName: selectedFolder?.name,
      })

      pushToast({
        title: status === 'draft' ? 'ບັນທຶກເປັນສະບັບຮ່າງສຳເລັດ' : 'ອັບໂຫຼດເອກະສານສຳເລັດ',
      })
      router.push(status === 'draft' ? '/documents' : '/documents/pending')
    } catch (err) {
      console.error('Upload failed:', err)
      setError('ອັບໂຫຼດເອກະສານລົ້ມເຫຼວ, ກະລຸນາລອງໃໝ່')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout title="ອັບໂຫຼດເອກະສານ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ອັບໂຫຼດເອກະສານ</h1>
          <p className="mt-1 text-sm text-gray-500">ອັບໂຫຼດເອກະສານໃໝກັບລະບົບເມັບເອກະສານຂອງທ່ານ</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] items-stretch">
          <div className="flex flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ໄຟລ໌ <span className="text-red-500">*</span>
            </label>

            {selectedFile ? (
              <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {resolveFileType(selectedFile.name) === 'image' ? (
                  <div className="flex flex-1 items-center justify-center overflow-hidden bg-gray-50 p-4">
                    <img
                      src={filePreviewUrl}
                      alt={selectedFile.name}
                      className="max-h-full max-w-full rounded-xl object-contain shadow-sm"
                    />
                  </div>
                ) : resolveFileType(selectedFile.name) === 'pdf' ? (
                  <div className="relative flex-1 overflow-hidden bg-gray-100">
                    {pdfLoading && (
                      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-indigo-50/80 px-3 py-1.5 text-xs font-medium text-indigo-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ກຳລັງໂຫຼດ PDF...
                      </div>
                    )}
                    <iframe
                      src={filePreviewUrl}
                      title={selectedFile.name}
                      className="h-full w-full"
                      onLoad={() => setPdfLoading(false)}
                      onError={() => setPdfLoading(false)}
                    />
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-gray-50 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                      <FileText className="h-8 w-8 text-indigo-600" />
                    </div>
                    <p className="text-sm text-gray-500">ໄຟລ໌ປະເພດນີ້ບໍ່ສາມາດສະແດງຕົວຢ່າງໄດ້</p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-5 w-5 shrink-0 text-indigo-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <label
                      htmlFor="file-input"
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      ປ່ຽນໄຟລ໌
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      ລຶບໄຟລ໌
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                htmlFor="file-input"
                className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-8 text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
                  <Upload className="h-6 w-6 text-indigo-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900">ລາກແລະວາງໄຟລ໌ທີ່ທ່ານຕ້ອງການອັບໂຫຼດ</p>
                <p className="mt-2 text-sm text-gray-500">PDF, DOC, PNG, JPG ຈະຖືກຮັບຮອງໃນລະບົບ</p>
                <span className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                  ເລືອກໄຟລ໌
                </span>
              </label>
            )}
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">ຂໍ້ມູນເອກະສານ</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ຊື່ເອກະສານ <span className="text-red-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="ປ້ອນຊື່ເອກະສານ"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ເຂກທີ <span className="text-red-500">*</span>
                </label>
                <input
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="DOC-2026-XXX"
                />
              </div>

              {/* 3-Level archive: Cabinet + Folder dropdowns */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ຕູ້ເອກະສານ <span className="text-red-500">*</span>
                </label>
                <select
                  value={cabinetId}
                  onChange={handleCabinetChange}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value=""> ເລືອກຕູ້ເອກະສານ </option>
                  {cabinets.map((c) => (
                    <option key={c.id} value={c.id}>🗄️ {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ແຟ້ມ <span className="text-red-500">*</span>
                </label>
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  disabled={!cabinetId}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">{cabinetId ? '— ເລືອກແຟ້ມ —' : '— ກະລຸນາເລືອກຕູ້ກ່ອນ —'}</option>
                  {visibleFolders.map((f) => (
                    <option key={f.id} value={f.id}>📁 {f.name}</option>
                  ))}
                </select>
                {cabinetId && visibleFolders.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">ຕູ້ນີ້ຍັງບໍ່ມີແຟ້ມ — ກະລຸນາສ້າງແຟ້ມກ່ອນທີ່ໜ້າ ຄັງເກັບເອກະສານ</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ຝ່າຍ / ຫ້ອງການ / ສະຖາບັນ <span className="text-red-500">*</span>
                </label>
                <select
                  value={division}
                  onChange={handleDivisionChange}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value=""> ເລືອກຝ່າຍ / ຫ້ອງການ </option>
                  {edlDivisions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ພະແນກ / ສູນ <span className="text-red-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={!division}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">{division ? '— ເລືອກພະແນກ / ສູນ —' : '— ເລືອກຝ່າຍກ່ອນ —'}</option>
                  {(division ? (edlStructure[division] ?? []) : []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ປະເພດເອກະສານ <span className="text-red-500">*</span>
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="">ເລືອກປະເພດເອກະສານ</option>
                  {documentTypeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ໝວດໝູ່</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  {categoryOptions.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ວັນທີ</label>
                <input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>

              {error && <p className="text-xs text-rose-600">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmit('pending')}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {isSubmitting ? 'ກຳລັງອັບໂຫຼດ...' : 'ອັບໂຫຼດເອກະສານ'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  {isSubmitting ? 'ກຳລັງອັບໂຫຼດ...' : 'ບັນທຶກເປັນສະບັບຮ່າງ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
