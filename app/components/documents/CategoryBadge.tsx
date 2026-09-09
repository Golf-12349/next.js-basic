'use client'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { UNCATEGORIZED_LABEL } from '@/lib/dms/constants'

/** ສີ badge ຕາມໝວດໝູ່ — ໝວດໝູ່ໃດທີ່ບໍ່ຢູ່ໃນ map ຈະໃຊ້ສີ fallback */
const categoryBadgeStyles: Record<string, string> = {
  'ຂາເຂົ້າ': 'bg-blue-100 text-blue-800',
  'ຂາອອກ': 'bg-violet-100 text-violet-800',
  'ຄຳສັ່ງ': 'bg-amber-100 text-amber-800',
  'ແຈ້ງການ': 'bg-sky-100 text-sky-800',
  'ສັນຍາ': 'bg-emerald-100 text-emerald-800',
  'ລາຍງານ': 'bg-rose-100 text-rose-800',
  'ທົ່ວໄປ': 'bg-gray-100 text-gray-700',
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