'use client'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { UNCATEGORIZED_LABEL } from '@/lib/dms/constants'

/** ສີ badge ຕາມໝວດໝູ່ — ໝວດໝູ່ໃດທີ່ບໍ່ຢູ່ໃນ map ຈະໃຊ້ສີ fallback */
const categoryBadgeStyles: Record<string, string> = {
  // ປະເພດເອກະສານ (ໃໝ່ — ລວມ documentType ເຂົ້າໝວດໝູ່)
  'ເອກະສານການເງິນ': 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
  'ແຈ້ງການ / ປະກາດ': 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80',
  'ສັນຍາ & ຂໍ້ຕົກລົງ': 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/80',
  'ບົດລາຍງານ': 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80',
  'ຄຳສັ່ງ / ມະຕິ': 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
  'ອື່ນໆ': 'bg-gray-50 text-gray-700 ring-1 ring-gray-200',
  // ເກົ່າ (legacy — ເອກະສານເກົ່າຍັງມີຊື່ກ່ອນຢູ່)
  'ຂາເຂົ້າ': 'bg-blue-50 text-blue-800 ring-1 ring-blue-200/80',
  'ຂາອອກ': 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/80',
  'ຄຳສັ່ງ': 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
  'ແຈ້ງການ': 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80',
  'ສັນຍາ': 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
  'ລາຍງານ': 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80',
  'ທົ່ວໄປ': 'bg-gray-50 text-gray-700 ring-1 ring-gray-200',
}

const categoryBadgeIcons: Record<string, typeof ArrowDownLeft> = {
  'ຂາເຂົ້າ': ArrowDownLeft,
  'ຂາອອກ': ArrowUpRight,
}

/** Badge ໝວດໝູ່ ແບບສີສັນ — ເອກະສານທີ່ບໍ່ມີໝວດໝູ່ຈະສະແດງ "ບໍ່ລະບຸ" ແບບເສັ້ນປືນ */
export default function CategoryBadge({
  category,
  className = '',
}: {
  category?: string | null
  className?: string
}) {
  const isUncategorized = !category || category.trim() === ''
  const label = isUncategorized ? UNCATEGORIZED_LABEL : category.trim()
  const Icon = categoryBadgeIcons[label]
  const styles =
    categoryBadgeStyles[label] ??
    (isUncategorized
      ? 'border border-dashed border-gray-300 bg-gray-50 text-gray-400'
      : 'bg-slate-100 text-slate-700')
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${styles} ${className}`}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {label}
    </span>
  )
}