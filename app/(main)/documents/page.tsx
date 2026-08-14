'use client'
import Link from 'next/link'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import type { Document, DocumentStatus } from '@/types/document'
import { useEffect, useMemo, useState } from 'react'
import { useDMS } from '../_dms-context'
import Modal from '@/app/components/ui/Modal'
import PDFPlaceholder from '@/app/components/ui/PDFPlaceholder'
import { pushToast } from '@/app/components/ui/Toast'

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
  const { documents, setDocuments, categories } = useDMS()
  const [query, setQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('ທັງໝົດ')
  const [filterStatus, setFilterStatus] = useState('ທັງໝົດ')
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null)

  useEffect(() => {
    // ensure categories include special 'ທັງໝົດ'
  }, [])

  const visible = useMemo(() => {
    return documents.filter((d) => !d.deleted).filter((d) => {
      const q = query.trim().toLowerCase()
      if (q) {
        if (!(d.title.toLowerCase().includes(q) || d.docNumber.toLowerCase().includes(q))) return false
      }
      if (filterCategory !== 'ທັງໝົດ' && d.category !== filterCategory) return false
      if (filterStatus !== 'ທັງໝົດ') {
        if (filterStatus === 'ຮ່າງ' && d.status !== 'draft') return false
        if (filterStatus === 'ລໍຖ້າອະນຸມັດ' && d.status !== 'pending') return false
        if (filterStatus === 'ອະນຸມັດ' && d.status !== 'approved') return false
        if (filterStatus === 'ເກັບເຂົ້າຄັງ' && d.status !== 'archived') return false
      }
      return true
    })
  }, [documents, query, filterCategory, filterStatus])

  function handleDelete(doc: Document) {
    setConfirmDelete(doc)
  }

  function confirmDeleteNow() {
    if (!confirmDelete) return
    setDocuments((prev) => prev.map((d) => (d.id === confirmDelete.id ? { ...d, deleted: true } : d)))
    pushToast({ title: 'ເອກະສານຖືກນໍາໄປຍັງ Trash' })
    setConfirmDelete(null)
  }
 
  function handleRestore(id: string) {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, deleted: false } : d)))
    pushToast({ title: 'ການກູ້ຄືນສຳເລັດ' })
  }

  function handleApprove(id: string) {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'approved' } : d)))
    pushToast({ title: 'ເອກະສານຖືກອະນຸມັດ' })
  }

  function handleReject(id: string) {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'draft' } : d)))
    pushToast({ title: 'ເອກະສານຖືກປະຕິເສດ' })
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
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
              <label className="mb-1 block text-sm font-medium text-gray-700">ໝວດໝູ່</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400">
                <option>ທັງໝົດ</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ສະຖານະ</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400">
                <option>ທັງໝົດ</option>
                <option>ຮ່າງ</option>
                <option>ລໍຖ້າອະນຸມັດ</option>
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
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{doc.category}</td>
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
                        <button type="button" className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                          ດາວໂຫຼດ
                        </button>
                        <button onClick={() => handleDelete(doc)} type="button" className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100">
                          ລົບ
                        </button>
                        {doc.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(doc.id)} className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                              ອະນຸມັດ
                            </button>
                            <button onClick={() => handleReject(doc.id)} className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">
                              ປະຕິເສດ
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal open={!!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc?.title}>
          {previewDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">ເລກທີ</div>
                  <div className="font-semibold">{previewDoc.docNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">ໝວດໝູ່</div>
                  <div className="font-semibold">{previewDoc.category}</div>
                </div>
              </div>
              <PDFPlaceholder title={previewDoc.title} />
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => { setPreviewDoc(null); pushToast({ title: 'ປິດການເບິ່ງ' }) }} className="px-3 py-2 rounded bg-gray-100">ປິດ</button>
                <button onClick={() => { pushToast({ title: 'ດາວໂຫຼດເອກະສານ' }) }} className="px-3 py-2 rounded bg-indigo-600 text-white">ດາວໂຫຼດ</button>
              </div>
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
      </main>
    </DashboardLayout>
  )
}
