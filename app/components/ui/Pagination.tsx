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
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 30,
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null

  const safeTotalPages = Math.max(totalPages, 1)

  return (
    <div
      aria-label="Pagination Navigation"
      className="fixed bottom-6 right-6 z-40 flex items-stretch overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg transition-all hover:shadow-xl select-none"
    >
      {/* 1. Page Selector with Chevron Down */}
      <div className="relative flex items-center border-r border-gray-200 transition hover:bg-gray-50">
        <select
          value={currentPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
          aria-label="ເລືອກໜ້າ"
          className="cursor-pointer appearance-none bg-transparent py-2.5 pl-3.5 pr-7 text-sm font-semibold text-gray-900 outline-none"
        >
          {Array.from({ length: safeTotalPages }, (_, i) => i + 1).map((p) => (
            <option key={p} value={p}>
              {String(p).padStart(2, '0')}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 text-gray-500"
        />
      </div>

      {/* 2. "of X pages" Label */}
      <div className="flex items-center border-r border-gray-200 px-4 py-2.5 text-sm font-normal text-slate-500 whitespace-nowrap">
        of {safeTotalPages} {safeTotalPages === 1 ? 'page' : 'pages'}
      </div>

      {/* 3. Previous Button (<) */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        title="Previous page"
        aria-label="Previous page"
        className="flex h-full w-10 items-center justify-center border-r border-gray-200 text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
      >
        <ChevronLeft size={16} />
      </button>

      {/* 4. Next Button (>) */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= safeTotalPages}
        title="Next page"
        aria-label="Next page"
        className="flex h-full w-10 items-center justify-center text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
