'use client'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import type { DocumentDirection } from '@/types/document'

const DIRECTION_LABELS: Record<DocumentDirection, string> = {
  inbound: 'ຂາເຂົ້າ',
  outbound: 'ຂາອອກ',
}

const DIRECTION_STYLES: Record<DocumentDirection, string> = {
  inbound: 'bg-emerald-100 text-emerald-800',
  outbound: 'bg-sky-100 text-sky-800',
}

const DIRECTION_ICONS: Record<DocumentDirection, typeof ArrowDownLeft> = {
  inbound: ArrowDownLeft,
  outbound: ArrowUpRight,
}

/**
 * ຄິດໄລ່ທິດທາງຈາກ field ໃໝ່ `direction` —
 * ມີ fallback ສຳລັບເອກະສານເກົ່າທີ່ຍັງໃຊ້ category ('ຂາເຂົ້າ'/'ຂາອອກ') ເປັນທິດທາງ
 */
export function resolveDirection(doc: {
  direction?: DocumentDirection
  category?: string | null
}): DocumentDirection | undefined {
  if (doc.direction) return doc.direction
  if (doc.category === 'ຂາເຂົ້າ') return 'inbound'
  if (doc.category === 'ຂາອອກ') return 'outbound'
  return undefined
}

/** Badge ທິດທາງເອກະສານ (ຂາເຂົ້າ / ຂາອອກ) — ເອກະສານທີ່ບໍ່ມີທິດທາງຈະບໍ່ແສດງ badge */
export default function DirectionBadge({
  direction,
  category,
  className = '',
}: {
  direction?: DocumentDirection
  category?: string | null
  className?: string
}) {
  const resolved = direction ?? resolveDirection({ direction, category })
  if (!resolved) return null
  const Icon = DIRECTION_ICONS[resolved]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${DIRECTION_STYLES[resolved]} ${className}`}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {DIRECTION_LABELS[resolved]}
    </span>
  )
}