"use client"

import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowUpDown, ChevronRight, Eye, LayoutGrid, List, Trash2 } from 'lucide-react'
import type { ViewMode } from './useArchive'

// ── Column definition ────────────────────────────────────────
// ໃຊ້ຮ່ວມກັນທຸກລະດັບ (ຄັງ / ຕູ້ / ຊັ້ນວາງ / ແຟ້ມ) ເພື່ອໃຫ້ຕາຕະລາງມີຮູບແບບດຽວກັນ
export interface ArchiveColumn<T> {
  /** ຄີປະຈຳຄໍລໍາ — ໃຊ້ເປັນ key ຂອງ React ແລະ ຄີຈັດລຳດັບ */
  key: string
  header: string
  /** class ເພີ່ມເຕີມ ເຊັ່ນ 'hidden md:table-cell' ສຳລັບຈໍນ້ອຍ */
  className?: string
  align?: 'left' | 'center' | 'right'
  /** ຄ່າທີ່ໃຊ້ຈັດລຳດັບ — ຖ້າບໍ່ສົ່ງມາ ຄໍລໍານັ້ນຈະກົດຈັດລຳດັບບໍ່ໄດ້ */
  sortValue?: (item: T) => string | number
  render: (item: T) => ReactNode
}

// ── Grid / List toggle ───────────────────────────────────────
interface ViewToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const base = 'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition'
  return (
    <div
      role="group"
      aria-label="ມຸມມອງການສະແດງຜົນ"
      className="inline-flex items-center gap-0.5 rounded-xl border border-gray-200 bg-gray-50/60 p-0.5"
    >
      <button
        type="button"
        onClick={() => onChange('grid')}
        aria-pressed={mode === 'grid'}
        title="ມຸມມອງບັດ"
        className={`${base} ${mode === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <LayoutGrid size={13} /> ບັດ
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-pressed={mode === 'list'}
        title="ມຸມມອງລາຍການ"
        className={`${base} ${mode === 'list' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <List size={13} /> ລາຍການ
      </button>
    </div>
  )
}

// ── Sorting helper ───────────────────────────────────────────
// ຈັດລຳດັບ "ກ່ອນ" ຕັດໜ້າ (pagination) ເພື່ອໃຫ້ຈັດລຳດັບທັງຊຸດ ບໍ່ແມ່ນສະເພາະໜ້າປະຈຸບັນ
export function useArchiveSort<T>(columns: ArchiveColumn<T>[]) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortDir('asc')
      }
    },
    [sortKey],
  )

  const sortRows = useCallback(
    (rows: T[]): T[] => {
      const column = columns.find((c) => c.key === sortKey)
      if (!column?.sortValue) return rows
      const valueOf = column.sortValue
      const factor = sortDir === 'asc' ? 1 : -1
      return [...rows].sort((a, b) => {
        const av = valueOf(a)
        const bv = valueOf(b)
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
        return String(av ?? '').localeCompare(String(bv ?? ''), 'lo') * factor
      })
    },
    [columns, sortKey, sortDir],
  )

  return { sortKey, sortDir, toggleSort, sortRows }
}

// ── List (table) view ────────────────────────────────────────
interface ArchiveListViewProps<T> {
  rows: T[]
  columns: ArchiveColumn<T>[]
  rowKey: (item: T) => string
  onOpen: (item: T) => void
  onView?: (item: T) => void
  canManage?: boolean
  onDelete?: (item: T) => void
  deleteTitle?: string
  sortKey?: string | null
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  /** ລຳດັບເລີ່ມຕົ້ນ ເພື່ອໃຫ້ເລກແຖວຕໍ່ເນື່ອງກັນທຸກໜ້າ */
  indexOffset?: number
}

export default function ArchiveListView<T>({
  rows,
  columns,
  rowKey,
  onOpen,
  onView,
  canManage = false,
  onDelete,
  deleteTitle = 'ລຶບ',
  sortKey = null,
  sortDir = 'asc',
  onSort,
  indexOffset = 0,
}: ArchiveListViewProps<T>) {
  const alignClass = (align?: 'left' | 'center' | 'right') =>
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto min-h-[360px]">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-12 px-3 py-2.5 text-center">#</th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-3 py-2.5 ${alignClass(column.align)} ${column.className ?? ''}`}
                >
                  {column.sortValue && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      title="ຈັດລຳດັບ"
                      className={`inline-flex items-center gap-1 transition hover:text-indigo-600 ${
                        sortKey === column.key ? 'text-indigo-700' : ''
                      }`}
                    >
                      {column.header}
                      <ArrowUpDown
                        size={12}
                        className={
                          sortKey === column.key && sortDir === 'desc' ? 'rotate-180 transition' : 'transition'
                        }
                      />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              <th className="px-3 py-2.5 text-center">ການກະທຳ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={rowKey(row)}
                onClick={() => onOpen(row)}
                className="cursor-pointer border-t border-gray-100 align-top transition hover:bg-indigo-50/40"
              >
                <td className="px-3 py-2.5 text-center text-xs text-gray-400">
                  {String(indexOffset + index + 1).padStart(2, '0')}
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-2.5 text-sm ${alignClass(column.align)} ${column.className ?? ''}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {onView && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(row);
                        }}
                        title="ເບິ່ງລາຍລະອຽດ"
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(row);
                      }}
                      title="ເປີດ"
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <ChevronRight size={16} />
                    </button>
                    {canManage && onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(row);
                        }}
                        title={deleteTitle}
                        className="rounded-lg p-1.5 text-gray-300 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
