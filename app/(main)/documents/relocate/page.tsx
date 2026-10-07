'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/app/components/dashboard-layout'

// ── ປະເພດການຍ້າຍສະຖານທີ່ຈັດເກັບ ──────────────────────────────────
const relocateOptions = [
  {
    href: '/documents/relocate/cabinet',
    icon: '🗄️',
    title: 'ຍ້າຍຕູ້ເອກະສານ',
    description: 'ຍ້າຍຕູ້ໄປຄັງເອກະສານອື່ນ ພ້ອມກຳນົດຝ່າຍ / ພະແນກໃໝ່',
    flow: 'ຄັງ ➡️ ຕູ້ ➡️ ຊັ້ນວາງ ➡️ ແຟ້ມ ➡️ ເອກະສານ',
  },
  {
    href: '/documents/relocate/shelf',
    icon: '🪜',
    title: 'ຍ້າຍຊັ້ນວາງ',
    description: 'ຍ້າຍຊັ້ນວາງໄປຕູ້ເອກະສານອື່ນ ພ້ອມແຟ້ມ ແລະ ເອກະສານພາຍໃນ',
    flow: 'ຕູ້ ➡️ ຊັ້ນວາງ ➡️ ແຟ້ມ ➡️ ເອກະສານ',
  },
  {
    href: '/documents/relocate/folder',
    icon: '📁',
    title: 'ຍ້າຍແຟ້ມເອກະສານ',
    description: 'ຍ້າຍແຟ້ມໄປຕູ້ ຫຼື ຊັ້ນວາງອື່ນ ພ້ອມເອກະສານພາຍໃນ',
    flow: 'ຕູ້ ➡️ ຊັ້ນວາງ ➡️ ແຟ້ມ ➡️ ເອກະສານ',
  },
]

export default function RelocatePage() {
  return (
    <DashboardLayout title="ຍ້າຍສະຖານທີ່ຈັດເກັບ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">📦 ຍ້າຍສະຖານທີ່ຈັດເກັບ</h1>
          <p className="mt-1 text-sm text-gray-500">
            ເລືອກປະເພດທີ່ຕ້ອງການຍ້າຍ: ຕູ້ເອກະສານ ➡️ ຊັ້ນວາງເອກະສານ ➡️ ແຟ້ມເກັບເອກະສານ
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {relocateOptions.map(({ href, icon, title, description, flow }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl transition group-hover:scale-105">
                  {icon}
                </div>
                <h2 className="mt-3 text-base font-bold text-gray-900 transition-colors group-hover:text-indigo-600">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              </div>

              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-[11px] font-medium text-gray-400">{flow}</p>
                <span className="mt-2 inline-block text-sm font-semibold text-indigo-600">ເລີ່ມຍ້າຍ ➡️</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
