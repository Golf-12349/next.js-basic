'use client'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { pushToast } from '@/app/components/ui/Toast'

const stats = [
  { label: 'ເອກກະສານທັງໝົດ', value: '1,250', change: '+12% ຈາກເດືອນກ່ອນ', tone: 'emerald' },
  { label: 'ເອກກະສານທີ່ອະນຸມັດ', value: '860', change: '+8% ມື້ນີ້', tone: 'blue' },
  { label: 'ລໍຖ້າອະນຸມັດ', value: '32', change: '-5% ຈາກອາທິດກ່ອນ', tone: 'amber' },
  { label: 'ເອກກະສານຄັງເກັບ', value: '146', change: '+18% ທັງເດືອນ', tone: 'violet' },
];

const categoryData = [
  { name: 'ຂາເຂົ້າ', value: 42, total: 100 },
  { name: 'ຂາອອກ', value: 31, total: 100 },
  { name: 'ຄຳສັ່ງ', value: 26, total: 100 },
  { name: 'ແຈ້ງການ', value: 19, total: 100 },
  { name: 'ສັນຍາ', value: 14, total: 100 },
  { name: 'ລາຍງານ', value: 22, total: 100 },
];

const recentEntries = [
  { name: 'ຄຳສັ່ງເລກທີ 012/ສນ', type: 'ຂາເຂົ້າ', date: '2026-08-11', status: 'ອະນຸມັດ' },
  { name: 'ແຈ້ງການປະຊຸມ', type: 'ແຈ້ງການ', date: '2026-08-10', status: 'ລໍຖ້າອະນຸມັດ' },
  { name: 'ສັນຍາການວ່າຈ້າງ', type: 'ສັນຍາ', date: '2026-08-09', status: 'ອະນຸມັດ' },
  { name: 'ລາຍງານກິດຈະກຳ', type: 'ລາຍງານ', date: '2026-08-08', status: 'ເກັບເຂົ້າຄັງ' },
];

const statusStyles: Record<string, string> = {
  'ອະນຸມັດ': 'bg-emerald-100 text-emerald-700',
  'ລໍຖ້າອະນຸມັດ': 'bg-amber-100 text-amber-700',
  'ເກັບເຂົ້າຄັງ': 'bg-gray-200 text-gray-700',
};

export default function ReportsPage() {
  return (
    <DashboardLayout title="ລາຍງານ & ສະຖິຕິ">
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">ລາຍງານ & ສະຖິຕິ</h1>
          <p className="mt-1 text-sm text-gray-500">ຂໍ້ມູນການໃຊ້ງານເອກະສານຂອງລະບົບໃນທົ່ວເດືອນ</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className="mt-4 text-3xl font-bold text-gray-900">{stat.value}</div>
              <div
                className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  stat.tone === 'emerald'
                    ? 'bg-emerald-100 text-emerald-700'
                    : stat.tone === 'blue'
                      ? 'bg-blue-100 text-blue-700'
                      : stat.tone === 'amber'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-violet-100 text-violet-700'
                }`}
              >
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-gray-900">ການແຜ່ຂະຫຍາຍເອກກະສານຕາມໝວດໝູ່</h2>

            <div className="space-y-4">
              {categoryData.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-sm text-gray-700">
                    <span>{item.name}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100">
                    <div
                      className="h-2.5 rounded-full bg-indigo-500"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-gray-900">ລາຍການເຂົ້າໃໝ່</h2>
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div key={entry.name} className="rounded-2xl bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-4 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold text-gray-900">{entry.name}</p>
                      <p className="text-xs text-gray-500">{entry.type} • {entry.date}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[entry.status]}`}>
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">ຕົວເລືອກສ່ວນປະກອບ</h2>
              <p className="mt-1 text-sm text-gray-500">ເບິ່ງແຜນພິມແລະຟັງຊັນການກວດສອບ</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => pushToast({ title: 'ສົ່ງອອກ Excel' })} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Export Excel
              </button>
              <button onClick={() => pushToast({ title: 'ພີນ' })} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Print
              </button>
            </div>
          </div>

          <div className="h-72 rounded-2xl bg-gray-50 p-6 text-center text-gray-400">
            Chart & report preview placeholder
          </div>
        </div>
      </main>
    </DashboardLayout>
  ) 
}
