"use client"
import { DashboardLayout } from '@/app/components/dashboard-layout';
import { useDMS } from '../../_dms-context';

export default function ArchivePage() {
  const { documents } = useDMS();
  const archivedDocuments = documents.filter((d) => d.status === 'archived' && !d.deleted);

  return (
    <DashboardLayout title="ຄັງເກັບເອກກະສານ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ຄັງເກັບເອກກະສານ</h1>
          <p className="mt-1 text-sm text-gray-500">ລາຍການເອກະສານທີ່ຖືກເກັບໄວ້ໃນຄັງບໍລິສັດ</p>
        </div>

        {archivedDocuments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-400">
            ຍັງບໍ່ມີເອກະສານໃນຄັງເກັບ
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {archivedDocuments.map((doc) => (
              <div key={doc.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 text-xs uppercase tracking-wide text-gray-500">{doc.uploadDate.slice(0, 4)}</div>
                <div className="text-lg font-bold text-gray-900">{doc.title}</div>
                <div className="mt-2 text-sm text-gray-600">{doc.category}</div>
                <div className="mt-4 inline-flex rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
                  ຄັງເກັບ
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}