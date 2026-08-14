'use client'

import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDMS } from '../../_dms-context'
import { pushToast } from '@/app/components/ui/Toast'

export default function PendingDocumentsPage() {
  const { documents, setDocuments } = useDMS()
  const list = documents.filter((d) => d.status === 'pending' && !d.deleted)

  function approve(id: string) {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'approved' } : d)))
    pushToast({ title: 'ເອກະສານຖືກອະນຸມັດ' })
  }

  function reject(id: string) {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'draft' } : d)))
    pushToast({ title: 'ເອກະສານຖືກປະຕິເສດ' })
  }

  return (
    <DashboardLayout title="ເອກະສານລໍຖ້າອະນຸມັດ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ເອກະສານລໍຖ້າອະນຸມັດ</h1>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">ເອກະສານ</th>
                  <th className="px-4 py-3">ໝວດໝູ່</th>
                  <th className="px-4 py-3">ວັນທີ</th>
                  <th className="px-4 py-3">ຜູ້ອັບໂຫຼດ</th>
                  <th className="px-4 py-3 text-center">ການກະທຳ</th>
                </tr>
              </thead>
              <tbody>
                {list.map((d) => (
                  <tr key={d.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.uploadDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.uploadedBy}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => approve(d.id)} className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">ອະນຸມັດ</button>
                        <button onClick={() => reject(d.id)} className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">ປະຕິເສດ</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}