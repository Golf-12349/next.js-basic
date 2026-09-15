'use client'

import React from 'react'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize?: number
  onPageChange: (page: number) => void
  itemLabel?: string
  prevLabel?: string
  nextLabel?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 30,
  onPageChange,
  itemLabel = 'ລາຍການ',
  prevLabel = 'Prev',
  nextLabel = 'Next',
}: PaginationProps) {
  if (totalItems === 0) return null

  const safeTotalPages = Math.max(totalPages, 1)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers matching exact screenshot format:
  // e.g. [Prev] [1] [2] [3] [4] [5] ... [40] [41] [Next]
  const getPageNumbers = () => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1)
    }

    // Near beginning (e.g. page 1 to 4)
    if (currentPage <= 4) {
      const pages: (number | string)[] = []
      const count = Math.min(5, safeTotalPages)
      for (let i = 1; i <= count; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(safeTotalPages - 1)
      pages.push(safeTotalPages)
      return pages
    }

    // Near end (e.g. within 4 of the last page)
    if (currentPage >= safeTotalPages - 3) {
      const pages: (number | string)[] = [1, 2, '...']
      for (let i = safeTotalPages - 4; i <= safeTotalPages; i++) {
        pages.push(i)
      }
      return pages
    }

    // In the middle
    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      safeTotalPages,
    ]
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      {/* Left side: Item counter text */}
      <div className="text-xs text-gray-500 sm:text-sm">
        ສະແດງ <span className="font-semibold text-gray-800">{startItem}</span> -{' '}
        <span className="font-semibold text-gray-800">{endItem}</span> ຈາກທັງໝົດ{' '}
        <span className="font-semibold text-gray-800">{totalItems}</span> {itemLabel}
      </div>

      {/* Right side: Dark pill buttons matching user design */}
      <div className="flex items-center justify-end sm:ml-auto">
        <nav aria-label="Pagination" className="inline-flex items-center gap-1.5">
          {/* Prev button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium transition sm:h-9 sm:px-3.5 sm:text-sm ${
              currentPage <= 1
                ? 'cursor-not-allowed border-neutral-700 bg-neutral-950 text-neutral-500 opacity-60'
                : 'border-white/80 bg-neutral-950 text-white hover:bg-neutral-800'
            }`}
          >
            {prevLabel}
          </button>

          {/* Numbered buttons & ellipsis */}
          <div className="flex items-center gap-1.5">
            {pageNumbers.map((page, idx) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-8 w-6 items-center justify-center text-xs font-bold tracking-widest text-neutral-400 select-none sm:h-9 sm:w-7 sm:text-sm"
                  >
                    …
                  </span>
                )
              }

              const pageNum = page as number
              const isActive = pageNum === currentPage

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-xs font-semibold transition sm:h-9 sm:min-w-[2.25rem] sm:text-sm ${
                    isActive
                      ? 'border-2 border-white bg-neutral-950 text-white shadow-sm'
                      : 'border border-transparent bg-neutral-950 text-white hover:bg-neutral-800'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          {/* Next button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= safeTotalPages}
            className={`inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium transition sm:h-9 sm:px-3.5 sm:text-sm ${
              currentPage >= safeTotalPages
                ? 'cursor-not-allowed border-neutral-700 bg-neutral-950 text-neutral-500 opacity-60'
                : 'border-transparent bg-neutral-950 text-white hover:bg-neutral-800'
            }`}
          >
            {nextLabel}
          </button>
        </nav>
      </div>
    </div>
  )
}
