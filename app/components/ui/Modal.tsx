"use client"
import React from 'react'

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[min(48rem,calc(100vw-2rem))] bg-white rounded-lg shadow-lg p-6 flex max-h-[80vh] flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-black/50 hover:text-black">ປິດ</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
        {footer && <div className="mt-4 shrink-0">{footer}</div>}
      </div>
    </div>
  )
}
