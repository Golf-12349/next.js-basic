import { DashboardLayout } from '@/app/components/dashboard-layout';

const archivedDocuments = [
  { name: 'ເອກະສານຂາເຂົ້າວິຊາການ', category: 'ຂາເຂົ້າ', year: '2025', status: 'ຄັງເກັບ' },
  { name: 'ບົດລາຍງານກິດຈະກຳການເງິນ', category: 'ລາຍງານ', year: '2025', status: 'ຄັງເກັບ' },
  { name: 'ແຈ້ງການສົ່ງສິນຄ້າ', category: 'ແຈ້ງການ', year: '2024', status: 'ຄັງເກັບ' },
  { name: 'ສັນຍາການສຳພາດ', category: 'ສັນຍາ', year: '2024', status: 'ຄັງເກັບ' },
];

export default function ArchivePage() {
  return (
    <DashboardLayout title="ຄັງເກັບເອກກະສານ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ຄັງເກັບເອກກະສານ</h1>
          <p className="mt-1 text-sm text-gray-500">ລາຍການເອກະສານທີ່ຖືກເກັບໄວ້ໃນຄັງບໍລິສັດ</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {archivedDocuments.map((doc) => (
            <div key={doc.name} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 text-xs uppercase tracking-wide text-gray-500">{doc.year}</div>
              <div className="text-lg font-bold text-gray-900">{doc.name}</div>
              <div className="mt-2 text-sm text-gray-600">{doc.category}</div>
              <div className="mt-4 inline-flex rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
                {doc.status}
              </div>
            </div>
          ))}
        </div>
      </main>
    </DashboardLayout>
  )
}
