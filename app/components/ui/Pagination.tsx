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
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null

  const safeTotalPages = Math.max(totalPages, 1)

  return (
    <aside
      aria-label="Pagination Navigation"
      className="fixed bottom-6 right-6 z-40 flex h-10 items-stretch overflow-hidden rounded-lg border border-gray-300 bg-white shadow-md select-none"
    >
      {/* 1. Page Selector (01 ⌵) */}
      <div className="relative flex h-full items-center transition hover:bg-gray-50">
        <select
          value={currentPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
          aria-label="ເລືອກໜ້າ"
          className="h-full cursor-pointer appearance-none bg-transparent pl-3.5 pr-7 text-sm font-bold text-gray-900 outline-none"
        >
          {Array.from({ length: safeTotalPages }, (_, i) => i + 1).map((p) => (
            <option key={p} value={p}>
              {String(p).padStart(2, '0')}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className="pointer-events-none absolute right-2 text-gray-600"
        />
      </div>

      {/* Divider 1 */}
      <div className="w-[1px] h-full bg-gray-200 shrink-0" />

      {/* 2. "of X pages" Label */}
      <div className="flex h-full items-center px-4 text-sm font-normal text-[#5c6479] whitespace-nowrap">
        of {safeTotalPages} {safeTotalPages === 1 ? 'page' : 'pages'}
      </div>

      {/* Divider 2 */}
      <div className="w-[1px] h-full bg-gray-200 shrink-0" />

      {/* 3. Previous Button (<) */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        title="Previous page"
        aria-label="Previous page"
        className="flex h-full w-10 items-center justify-center text-gray-700 transition hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
      </button>

      {/* Divider 3 - Full height divider between < and > */}
      <div className="w-[1px] h-full bg-gray-200 shrink-0" />

      {/* 4. Next Button (>) */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= safeTotalPages}
        title="Next page"
        aria-label="Next page"
        className="flex h-full w-10 items-center justify-center text-gray-700 transition hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
      >
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>
    </aside>
  )
}
