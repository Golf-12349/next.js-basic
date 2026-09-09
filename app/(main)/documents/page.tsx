'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import type { Document, DocumentStatus } from '@/types/document'
import { useEffect, useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocuments } from '../context/DocumentsContext'
import { useArchive } from '../context/ArchiveContext'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import { pushToast } from '@/app/components/ui/Toast'
import { Settings } from 'lucide-react'
import ManageCategoryModal from '@/app/components/documents/ManageCategoryModal'
import CategoryBadge from '@/app/components/documents/CategoryBadge'

const statusStyles: Record<DocumentStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-gray-200 text-gray-700',
}

const statusLabels: Record<DocumentStatus, string> = {
  draft: 'ຮ່າງ',
  pending: 'ລໍຖ້າອະນຸມັດ',
  approved: 'ອະນຸມັດ',
  archived: 'ເກັບເຂົ້າຄັງ',
}

export default function DocumentsPage() {
  const searchParams = useSearchParams()
  const { documents, categories, addCategory, removeCategory, deleteDocument, reload } = useDocuments()

  useEffect(() => {
    void reload()
  }, [reload])
  const { cabinets } = useArchive()
  const searchParam = searchParams.get('search') || ''
  const [prevParam, setPrevParam] = useState(searchParam)
  const [query, setQuery] = useState(searchParam)

  if (searchParam !== prevParam) {
    setPrevParam(searchParam)
    setQuery(searchParam)
  }

  const [filterCategory, setFilterCategory] = useState('ທັງໝົດ')
  const [filterCabinet, setFilterCabinet] = useState('ທັງໝົດ')
  const [filterStatus, setFilterStatus] = useState('ທັງໝົດ')
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null)
  const [manageCategoryOpen, setManageCategoryOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 250)

  const visible = useMemo(() => {
    return documents.filter((d) => !d.deleted && d.status !== 'pending').filter((d) => {
      const q = debouncedQuery.trim().toLowerCase()
      if (q) {
        if (!(d.title.toLowerCase().includes(q) || d.docNumber.toLowerCase().includes(q))) return false
      }
      if (filterCategory !== 'ທັງໝົດ' && d.category !== filterCategory) return false
      if (filterCabinet !== 'ທັງໝົດ' && d.cabinetId !== filterCabinet) return false
      if (filterStatus !== 'ທັງໝົດ') {
        if (filterStatus === 'ຮ່າງ' && d.status !== 'draft') return false
        if (filterStatus === 'ອະນຸມັດ' && d.status !== 'approved') return false
        if (filterStatus === 'ເກັບເຂົ້າຄັງ' && d.status !== 'archived') return false
      }
      return true
    })
  }, [documents, debouncedQuery, filterCategory, filterCabinet, filterStatus])

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
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ເອກກະສານທັງໝົດ</h1>
            <p className="text-sm text-gray-500 mt-1">ການຕິດຕາມແລະຈັດການເອກະສານໃນລະບົບ DMS</p>
          </div>

          <Link
            href="/documents/upload"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            + ອັບໂຫຼດເອກກະສານ
          </Link>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">ຕູ້ເອກະສານ</label>
              <select value={filterCabinet} onChange={(e) => setFilterCabinet(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400">
                <option>ທັງໝົດ</option>
                {cabinets.map((c) => (
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
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">ເອກະສານ</th>
                  <th className="px-4 py-3">ໝວດໝູ່</th>
                  <th className="px-4 py-3">ເລກທີ</th>
                  <th className="px-4 py-3">ຮູບແບບ</th>
                  <th className="px-4 py-3">ຂະໜາດ</th>
                  <th className="px-4 py-3">ວັນທີ</th>
                  <th className="px-4 py-3">ຜູ້ອັບໂຫຼດ</th>
                  <th className="px-4 py-3">ສະຖານະ</th>
                  <th className="px-4 py-3 text-center">ການກະທຳ</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((doc) => (
                  <tr key={doc.id} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{doc.title}</div>
                      <div className="text-xs text-gray-500">ID: {doc.id}</div>
                      {(doc.cabinetName || doc.folderName) && (
                        <span className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                          🗄️ {doc.cabinetName ?? '—'} {'>'} 📁 {doc.folderName ?? '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3"><CategoryBadge category={doc.category} /></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{doc.docNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 uppercase">{doc.fileType}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{doc.fileSize}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{doc.uploadDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{doc.uploadedBy}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[doc.status]}`}>
                        {statusLabels[doc.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setPreviewDoc(doc)} className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                          ເບິ່ງ
                        </button>
                        <button type="button" onClick={() => handleDownload(doc)} className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                          ດາວໂຫຼດ
                        </button>
                        <button onClick={() => handleDelete(doc)} type="button" className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100">
                          ລົບ
                        </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.title}
          scrollBody={false}
          footer={
            previewDoc && (
              /* Right group: close / download — ml-auto keeps it pinned right */
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => { setPreviewDoc(null); pushToast({ title: 'ປິດການເບິ່ງ' }) }} className="px-3 py-2 rounded bg-gray-100">ປິດ</button>
                <button onClick={() => handleDownload(previewDoc)} className="px-3 py-2 rounded bg-indigo-600 text-white">ດາວໂຫຼດ</button>
              </div>
            )
          }
        >
          {previewDoc && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="grid shrink-0 grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">ເລກທີ</div>
                  <div className="font-semibold">{previewDoc.docNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">ໝວດໝູ່</div>
                  <div className="font-semibold">{previewDoc.category}</div>
                </div>
              </div>
              {/* PDF/image viewer fills the remaining space and scrolls independently inside the modal body */}
              <DocumentPreview doc={previewDoc} heightClassName="min-h-0 flex-1" />
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
      </main>
    </DashboardLayout>
  )
}