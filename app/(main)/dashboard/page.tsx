import Link from 'next/link';
import { DashboardLayout } from '@/app/components/dashboard-layout';

const summaryCards = [
  { label: 'ເອກກະສານທັງໝົດ', value: '1,250', trend: '+12% ຈາກເດືອນກ່ອນ', tone: 'emerald' },
  { label: 'ເອກກະສານມື້ນີ້', value: '+12', trend: 'ມື້ນີ້', tone: 'blue' },
  { label: 'ເອກກະສານເດືອນນີ້', value: '+145', trend: 'ເດືອນນີ້', tone: 'amber' },
  { label: 'ລໍຖ້າອະນຸມັດ', value: '5', trend: 'ເອກກະສານ', tone: 'violet' },
];

const recentActivities = [
  { text: 'ທ້າວ ສົມຊາຍ ອັບໂຫຼດເອກກະສານ: ຄຳສັ່ງເລກທີ 012/ສນ', time: '10 ນາທີກ່ອນ' },
  { text: 'ນາງ ສົມສີ ອະນຸມັດເອກກະສານ: ແຈ້ງການປະຊຸມ', time: '1 ຊົ່ວໂມງກ່ອນ' },
  { text: 'ທ່ານ ອານັນ ດາວໂຫຼດ: ສັນຍາການວ່າຈ້າງ', time: '2 ຊົ່ວໂມງກ່ອນ' },
];

const recentDocuments = [
  { name: 'ເອກະສານຄຳສັ່ງຊື້ 012/ສນ', category: 'ຄຳສັ່ງ', date: '2026-08-10', status: 'ອະນຸມັດ' },
  { name: 'ແຈ້ງການປະຊຸມຫ້າມະຫາສະຫມຸດ', category: 'ແຈ້ງການ', date: '2026-08-09', status: 'ລໍຖ້າອະນຸມັດ' },
  { name: 'ສັນຍາການວ່າຈ້າງ', category: 'ສັນຍາ', date: '2026-08-08', status: 'ຮ່າງ' },
  { name: 'ລາຍງານກິດຈະກຳປະຈໍາເດືອນ', category: 'ລາຍງານ', date: '2026-08-07', status: 'ອະນຸມັດ' },
  { name: 'ຂາເຂົ້າລະຫວ່າງບໍລິສັດ', category: 'ຂາເຂົ້າ', date: '2026-08-06', status: 'ເກັບເຂົ້າຄັງ' },
];

const statusStyles: Record<string, string> = {
  'ຮ່າງ': 'bg-slate-100 text-slate-700',
  'ລໍຖ້າອະນຸມັດ': 'bg-amber-100 text-amber-700',
  'ອະນຸມັດ': 'bg-emerald-100 text-emerald-700',
  'ເກັບເຂົ້າຄັງ': 'bg-gray-200 text-gray-700',
};

export default function DashboardPage() {
  return (
    <DashboardLayout title="ໜ້າຫຼັກ">
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ໜ້າຫຼັກ</h1>
            <p className="mt-1 text-sm text-gray-500">ພາບລວມລະບົບ DMS ແລະຄຸນນະພາບການຈັດການເອກະສານ.</p>
          </div>
          <Link
            href="/documents/upload"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            + ອັບໂຫຼດເອກກະສານໃໝ່
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">{card.label}</div>
              <div className="mt-4 text-2xl font-bold text-gray-900">{card.value}</div>
              <div
                className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  card.tone === 'emerald'
                    ? 'bg-emerald-100 text-emerald-700'
                    : card.tone === 'blue'
                      ? 'bg-blue-100 text-blue-700'
                      : card.tone === 'amber'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-violet-100 text-violet-700'
                }`}
              >
                {card.trend}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">ກິດຈະກຳທີ່ຜ່ານມາ</h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.text} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <span className="text-sm text-gray-600">{activity.text}</span>
                  <span className="shrink-0 text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">ເອກກະສານອັບໂຫຼດລ່າສຸດ</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">ຊື່ເອກກະສານ</th>
                    <th className="px-4 py-3">ໝວດໝູ່</th>
                    <th className="px-4 py-3">ວັນທີ</th>
                    <th className="px-4 py-3">ສະຖານະ</th>
                    <th className="px-4 py-3 text-center">ການກະທຳ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDocuments.map((doc) => (
                    <tr key={doc.name} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{doc.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{doc.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{doc.date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[doc.status]}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button type="button" className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                            ເບິ່ງ
                          </button>
                          <button type="button" className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
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
        </div>
      </main>
    </DashboardLayout>
  );
}
