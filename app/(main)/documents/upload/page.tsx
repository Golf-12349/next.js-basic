"use client"
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDMS } from '../../_dms-context'
import { pushToast } from '@/app/components/ui/Toast'
import type { DocumentCategory, DocumentFileType } from '@/types/document'

const categoryOptions: DocumentCategory[] = ['ຂາເຂົ້າ', 'ຂາອອກ', 'ຄຳສັ່ງ', 'ແຈ້ງການ', 'ສັນຍາ', 'ລາຍງານ']

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
  const { addDocument } = useDMS()

  const [title, setTitle] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [category, setCategory] = useState<DocumentCategory>('ຂາເຂົ້າ')
  const [uploadDate, setUploadDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // ສ້າງ preview URL ຈາກໄຟລ໌ທີ່ເລືອກ ເພື່ອໃຊ້ສະແດງຕົວຢ່າງໃນ DocumentPreview
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
      setSelectedFile(file)
      setFilePreviewUrl(URL.createObjectURL(file))
    }
  }

  function handleUpload() {
    if (!title.trim() || !docNumber.trim()) {
      setError('ກະລຸນາປ້ອນຊື່ເອກະສານ ແລະ ເລກທີ ໃຫ້ຄົບ')
      return
    }
    setError(null)

    addDocument({
      title: title.trim(),
      docNumber: docNumber.trim(),
      category,
      status: 'pending', // ເອກະສານໃໝ່ ຕັ້ງເປັນ "ລໍຖ້າອະນຸມັດ" ໂດຍ default
      fileType: selectedFile ? resolveFileType(selectedFile.name) : 'pdf',
      fileSize: selectedFile ? formatFileSize(selectedFile.size) : '0 KB',
      uploadDate: uploadDate || new Date().toISOString().slice(0, 10),
      uploadedBy: 'John Doe', // TODO: ປ່ຽນເປັນ user ທີ່ login ຢູ່ ເມື່ອມີລະບົບ Auth ແທ້
      fileUrl: filePreviewUrl || '#',
      fileName: selectedFile?.name,
    })

    pushToast({ title: 'ອັບໂຫຼດເອກະສານສຳເລັດ' })
    router.push('/documents/pending')
  }

  return (
    <DashboardLayout title="ອັບໂຫຼດເອກກະສານ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ອັບໂຫຼດເອກກະສານ</h1>
          <p className="mt-1 text-sm text-gray-500">ອັບໂຫຼດເອກະສານໃຫ້ກັບລະບົບເກັບເອກະສານຂອງທ່ານ</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <label
            htmlFor="file-input"
            className="cursor-pointer rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-8 text-center block"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl text-indigo-600">
              ⤴
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {selectedFile ? selectedFile.name : 'ລາກແລະວາງໄຟລ໌ທີ່ທ່ານຕ້ອງການອັບໂຫຼດ'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {selectedFile ? formatFileSize(selectedFile.size) : 'PDF, DOC, PNG, JPG ຈະຖືກຮັບຮອງໃນລະບົບ'}
            </p>
            <input id="file-input" type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} />
            <span className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              ເລືອກໄຟລ໌
            </span>
          </label>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">ຂໍ້ມູນເອກະສານ</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ຊື່ເອກກະສານ</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="ປ້ອນຊື່ເອກະສານ"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ເລກທີ</label>
                <input
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="DOC-2026-XXX"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ໝວດໝູ່</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
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

              <button
                type="button"
                onClick={handleUpload}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                ອັບໂຫຼດເອກະສານ
              </button>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}