"use client"
import React from 'react'

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  scrollBody = true,
}: {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  /**
   * true  (default): the body scrolls itself (overflow-y-auto) — good for forms/lists.
   * false: the body never scrolls (overflow-hidden) and the dialog becomes a
   *        fixed-height h-[92vh] flex column, so children (e.g. a PDF iframe)
   *        can fill the space and scroll independently while the footer stays
   *        permanently pinned at the bottom of the dialog.
   */
  scrollBody?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative w-full max-w-[min(48rem,calc(100vw-2rem))] bg-white rounded-lg shadow-lg p-6 flex flex-col ${
          scrollBody ? 'max-h-[92vh]' : 'h-[92vh]'
        }`}
      >
        {/* Header: title & close — never scrolls away */}
        <div className="flex shrink-0 items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-black/50 hover:text-black">ປິດ</button>
        </div>
        {/* Body: either scrolls itself, or lets the PDF viewer scroll independently */}
        <div
          className={
            scrollBody
              ? 'min-h-0 flex-1 overflow-y-auto pt-4 pr-1'
              : 'flex min-h-0 flex-1 flex-col overflow-hidden pt-4'
          }
        >
          {children}
        </div>
        {/* Footer: pinned to the bottom of the dialog, never scrolls away */}
        {footer && (
          <div className="flex shrink-0 sticky bottom-0 z-10 items-center justify-between gap-2 mt-2 pt-4 border-t border-gray-100 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
