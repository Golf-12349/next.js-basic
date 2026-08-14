"use client"
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import type { Document, DocumentStatus } from '@/types/document'
import { useDMS } from '../../_dms-context'
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

export default function DocumentDetailPage() {
  const params = useParams()
  const id = (params as any)?.id
  const { documents, setDocuments } = useDMS()
  const doc = documents.find((d) => d.id === id) as Document | undefined

  if (!doc) {
    return (
      <DashboardLayout title="ເອກະສານ">
        <main className="p-6">
          <div className="text-gray-500">ບໍ່ພົບເອກະສານ</div>
        </main>
      </DashboardLayout>
    )
  }

  function handleDelete() {
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, deleted: true } : d)))
    pushToast({ title: 'ເອກະສານຖືກນໍາໄປ Trash' })
  }

  function handleApprove() {
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: 'approved' } : d)))
    pushToast({ title: 'ເອກະສານຖືກອະນຸມັດ' })
  }

  return (
    <DashboardLayout title="ເອກະສານ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ລາຍລະອຽດເອກະສານ</h1>
            <p className="mt-1 text-sm text-gray-500">ຂໍ້ມູນເອກະສານທີ່ລະບົບໄດ້ບັນທຶກໄວ້</p>
          </div>

          <Link href="/documents" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            ← ກັບໄປລາຍການ
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-indigo-600">{doc.category}</div>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">{doc.title}</h2>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[doc.status]}`}>
                {statusLabels[doc.status]}
              </span>
            </div>

            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-3xl text-indigo-600">PDF</div>
              <div className="text-lg font-semibold text-gray-900">{doc.docNumber}</div>
              <div className="mt-2 text-sm text-gray-500">{doc.fileSize} • {doc.fileType.toUpperCase()}</div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">ເລກທີ</div>
                <div className="mt-2 font-semibold text-gray-900">{doc.docNumber}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">ວັນທີອັບໂຫຼດ</div>
                <div className="mt-2 font-semibold text-gray-900">{doc.uploadDate}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">ຜູ້ອັບໂຫຼດ</div>
                <div className="mt-2 font-semibold text-gray-900">{doc.uploadedBy}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">ຮູບແບບໄຟລ໌</div>
                <div className="mt-2 font-semibold text-gray-900 uppercase">{doc.fileType}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">ການກະທຳ</h3>
              <div className="mt-4 space-y-3">
                <button onClick={() => pushToast({ title: 'ເບິ່ງເອກະສານ' })} type="button" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">ເບິ່ງໄຟລ໌</button>
                <button onClick={() => pushToast({ title: 'ດາວໂຫຼດເອກະສານ' })} type="button" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">ດາວໂຫຼດ</button>
                <button onClick={handleDelete} type="button" className="w-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100">ລົບເອກະສານ</button>
                {doc.status === 'pending' && <button onClick={handleApprove} className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">ອະນຸມັດ</button>}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">ຂໍ້ມູນເພີ່ມເຕີມ</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">ຄຳອະທິບາຍ</dt>
                  <dd className="text-right text-gray-900">{doc.title}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">ໝວດໝູ່</dt>
                  <dd className="text-right text-gray-900">{doc.category}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">ຂະໜາດ</dt>
                  <dd className="text-right text-gray-900">{doc.fileSize}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}
