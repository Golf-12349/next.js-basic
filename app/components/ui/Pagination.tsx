'use client'

import React from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize?: number
  onPageChange: (page: number) => void
  itemLabel?: string
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  itemLabel = 'ລາຍການ',
  className = '',
}: PaginationProps) {
  if (totalItems === 0) return null

  const safeTotalPages = Math.max(totalPages, 1)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200/80 bg-white px-4 py-3 sm:px-6 select-none ${className}`}
    >
      {/* 1. Summary Label */}
      <div className="text-xs sm:text-sm text-gray-500 font-medium">
        ສະແດງ <span className="font-semibold text-gray-800 tabular-nums">{startItem}</span> ຫາ{' '}
        <span className="font-semibold text-gray-800 tabular-nums">{endItem}</span> ຈາກທັງໝົດ{' '}
        <span className="font-semibold text-gray-800 tabular-nums">{totalItems}</span> {itemLabel}
      </div>

      {/* 2. Control Pill */}
      <nav
        aria-label="Pagination Navigation"
        className="inline-flex h-9 items-stretch overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xs"
      >
        {/* Page Selector (01 ⌵) */}
        <div className="relative flex h-full items-center transition hover:bg-gray-50">
          <select
            value={currentPage}
            onChange={(e) => onPageChange(Number(e.target.value))}
            aria-label="ເລືອກໜ້າ"
            className="h-full cursor-pointer appearance-none bg-transparent pl-3 pr-6 text-sm font-semibold text-gray-800 outline-none"
          >
            {Array.from({ length: safeTotalPages }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                {String(p).padStart(2, '0')}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            strokeWidth={2.5}
            className="pointer-events-none absolute right-1.5 text-gray-500"
          />
        </div>

        {/* Divider 1 */}
        <div className="w-[1px] h-full bg-gray-200 shrink-0" />

        {/* "of X pages" Label */}
        <div className="flex h-full items-center px-3 text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap bg-gray-50/50">
          of {safeTotalPages} {safeTotalPages === 1 ? 'page' : 'pages'}
        </div>

        {/* Divider 2 */}
        <div className="w-[1px] h-full bg-gray-200 shrink-0" />

        {/* Previous Button (<) */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous page"
          aria-label="Previous page"
          className="flex h-full w-9 items-center justify-center text-gray-600 transition hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
        >
          <ChevronLeft size={15} strokeWidth={2.5} />
        </button>

        {/* Divider 3 */}
        <div className="w-[1px] h-full bg-gray-200 shrink-0" />

        {/* Next Button (>) */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= safeTotalPages}
          title="Next page"
          aria-label="Next page"
          className="flex h-full w-9 items-center justify-center text-gray-600 transition hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
        >
          <ChevronRight size={15} strokeWidth={2.5} />
        </button>
      </nav>
    </div>
  )
}
