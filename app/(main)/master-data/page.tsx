'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/app/components/dashboard-layout'

// ── ສ່ວນຕ່າງໆຂອງຂໍ້ມູນພື້ນຖານ ────────────────────────────────────
const masterDataOptions = [
  {
    href: '/master-data/categories',
    icon: '🏷️',
    title: 'ປະເພດ / ໝວດໝູ່ເອກະສານ',
    description: 'ກຳນົດ ແລະ ຈັດການໝວດໝູ່ເອກະສານທີ່ໃຊ້ໃນລະບົບ',
  },
  {
    href: '/master-data/divisions',
    icon: '🏢',
    title: 'ຈັດການຝ່າຍ',
    description: 'ໂຄງສ້າງຝ່າຍ / ຫ້ອງການພາຍໃນອົງກອນ',
  },
  {
    href: '/master-data/departments',
    icon: '🏬',
    title: 'ຈັດການພະແນກ',
    description: 'ພະແນກພາຍໃນແຕ່ລະຝ່າຍ ແລະ ຈຳນວນຕູ້ / ຜູ້ໃຊ້ງານ',
  },
]

export default function MasterDataPage() {
  return (
    <DashboardLayout title="ຈັດການຂໍ້ມູນພື້ນຖານ">
      <div className="w-full min-w-0 space-y-4 p-3 sm:p-4 lg:p-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            ຈັດການຂໍ້ມູນພື້ນຖານ (Master Data)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            ເລືອກສ່ວນທີ່ຕ້ອງການຈັດການ: ໝວດໝູ່ເອກະສານ ➡️ ຝ່າຍ ➡️ ພະແນກ
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {masterDataOptions.map(({ href, icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl transition group-hover:scale-105">
                  {icon}
                </div>
                <h2 className="mt-3 text-base font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </div>

              <span className="mt-3 inline-block border-t border-slate-100 pt-3 text-sm font-semibold text-indigo-600">
                ເປີດຈັດການ ➡️
              </span>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
