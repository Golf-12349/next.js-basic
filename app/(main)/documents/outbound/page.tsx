'use client'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDMS } from '../../_dms-context'
import { pushToast } from '@/app/components/ui/Toast'

export default function OutboundPage() {
  const { documents } = useDMS()
  const list = documents.filter((d) => d.category === 'ຂາອອກ' && !d.deleted)
  return (
    <DashboardLayout title="ເອກະສານຂາອອກ">
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-2">ເອກະສານຂາອອກ</h1>
        <div className="rounded bg-white border p-4">
          {list.length === 0 ? <div className="text-gray-500">ບໍ່ມີເອກະສານ</div> : (
            <div className="space-y-3">
              {list.map((d) => (
                <div key={d.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-gray-500">{d.docNumber} • {d.uploadDate}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => pushToast({ title: 'ດາວໂຫຼດເອກະສານ' })} className="px-3 py-1 rounded bg-indigo-50 border text-indigo-700">ດາວໂຫຼດ</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}