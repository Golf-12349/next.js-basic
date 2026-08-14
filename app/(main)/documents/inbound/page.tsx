'use client'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDMS } from '../../_dms-context'
import { useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import PDFPlaceholder from '@/app/components/ui/PDFPlaceholder'
import { pushToast } from '@/app/components/ui/Toast'

export default function InboundDocumentsPage() {
  const { documents } = useDMS()
  const [preview, setPreview] = useState<any | null>(null)

  const inbound = documents.filter((d) => d.category === 'ຂາເຂົ້າ' && !d.deleted)

  return (
    <DashboardLayout title="ເອກກະສານຂາເຂົ້າ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ເອກກະສານຂາເຂົ້າ</h1>
          <p className="mt-1 text-sm text-gray-500">ລາຍການເອກະສານທີ່ມາຈາກພາຍນອກ</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">ເອກະສານ</th>
                  <th className="px-4 py-3">ວັນທີ</th>
                  <th className="px-4 py-3">ຜູ້ອັບໂຫຼດ</th>
                  <th className="px-4 py-3 text-center">ການກະທຳ</th>
                </tr>
              </thead>
              <tbody>
                {inbound.map((doc) => (
                  <tr key={doc.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{doc.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{doc.uploadDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{doc.uploadedBy}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setPreview(doc)} type="button" className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                          ເບິ່ງ
                        </button>
                        <button onClick={() => pushToast({ title: 'ດາວໂຫຼດເອກະສານ' })} type="button" className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                          ດາວໂຫຼດ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title}>
          {preview && (
            <div>
              <PDFPlaceholder title={preview.title} />
              <div className="mt-3 text-right">
                <button onClick={() => setPreview(null)} className="px-3 py-2 rounded bg-gray-100">ປິດ</button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </DashboardLayout>
  )
}
