import React from 'react'

export default function PDFPlaceholder({ title }: { title?: string }) {
  return (
    <div className="w-full h-80 border border-dashed border-black/10 rounded-md flex items-center justify-center bg-gray-50">
      <div className="text-center text-black/50">
        <div className="text-sm mb-2">PDF ຕົວຢ່າງ</div>
        <div className="text-xs">{title ?? 'ເອກະສານ ຕ່ຳຫນື່ງ'}</div>
      </div>
    </div>
  )
}
