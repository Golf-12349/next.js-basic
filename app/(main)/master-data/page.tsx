'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../context/DocumentsContext'
import { useMasterData } from '../context/MasterDataContext'
import { Bookmark, Briefcase, Building2, Clock, Layers, Tag } from 'lucide-react'

export default function MasterDataPage() {
  const { categories } = useDocuments()
  const {
    divisions,
    departmentsByDivision,
    retentionPeriods,
    tags,
    positions,
  } = useMasterData()

  const totalDepartments = Object.values(departmentsByDivision).reduce(
    (acc, list) => acc + list.length,
    0
  )

  const masterDataOptions = [
    {
      href: '/master-data/categories',
      icon: <Tag className="h-6 w-6" />,
      title: 'ປະເພດ / ໝວດໝູ່ເອກະສານ',
      description: 'ກຳນົດ ແລະ ຈັດການໝວດໝູ່ເອກະສານທີ່ໃຊ້ໃນລະບົບ',
      count: `${categories.length} ໝວດໝູ່`,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      href: '/master-data/divisions',
      icon: <Building2 className="h-6 w-6" />,
      title: 'ຈັດການຝ່າຍ',
      description: 'ໂຄງສ້າງຝ່າຍ / ຫ້ອງການພາຍໃນອົງກອນ EDL',
      count: `${divisions.length} ຝ່າຍ`,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      href: '/master-data/departments',
      icon: <Layers className="h-6 w-6" />,
      title: 'ຈັດການພະແນກ',
      description: 'ພະແນກພາຍໃນແຕ່ລະຝ່າຍ ແລະ ຈຳນວນຕູ້ / ຜູ້ໃຊ້ງານ',
      count: `${totalDepartments} ພະແນກ`,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      href: '/master-data/retention',
      icon: <Clock className="h-6 w-6" />,
      title: 'ອາຍຸການເກັບຮັກສາ (Retention)',
      description: 'ກຳນົດນະໂຍບາຍອາຍຸເອກະສານ ເພື່ອແຈ້ງເຕືອນການໝົດອາຍຸອັດຕະໂນມັດ',
      count: `${retentionPeriods.length} ໄລຍະເວລາ`,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      href: '/master-data/tags',
      icon: <Bookmark className="h-6 w-6" />,
      title: 'ປ້າຍກຳກັບ / ແທັກ (Tags)',
      description: 'ກຳນົດແທັກ ແລະ ຄຳຄົ້ນຫາສຳລັບຈັດໝວດໝູ່ເອກະສານເພີ່ມເຕີມ',
      count: `${tags.length} ແທັກ`,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      href: '/master-data/positions',
      icon: <Briefcase className="h-6 w-6" />,
      title: 'ຈັດການຕຳແໜ່ງງານ (Positions)',
      description: 'ລາຍການຕຳແໜ່ງງານມາດຕະຖານໃນອົງກອນ ສຳລັບກຳນົດໃຫ້ຜູ້ໃຊ້ງານ',
      count: `${positions.length} ຕຳແໜ່ງ`,
      color: 'bg-rose-50 text-rose-600',
    },
  ]

  return (
    <DashboardLayout title="ຈັດການຂໍ້ມູນພື້ນຖານ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            ຈັດການຂໍ້ມູນພື້ນຖານ (Master Data)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            ເລືອກຂໍ້ມູນພື້ນຖານທີ່ຕ້ອງການຕັ້ງຄ່າ ແລະ ຈັດການພາຍໃນລະບົບ
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {masterDataOptions.map(({ href, icon, title, description, count, color }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} text-2xl transition group-hover:scale-105`}>
                    {icon}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {count}
                  </span>
                </div>
                <h2 className="mt-4 text-base font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                  {title}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{description}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-indigo-600">
                <span>ເປີດຈັດການ</span>
                <span className="transition-transform group-hover:translate-x-1">➡️</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
