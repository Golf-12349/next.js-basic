"use client"
import React, { useState } from 'react'
import type { Document } from '@/types/document'
import { ExternalLink, FileWarning, Loader2 } from 'lucide-react'

function isPdf(fileType: Document['fileType'], url: string): boolean {
  if (fileType === 'pdf') return true
  return /\.pdf($|\?)/i.test(url)
}

export default function DocumentPreview({ doc, className = '' }: { doc: Document; className?: string }) {
  const [pdfError, setPdfError] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(true)

  const url = doc.pdfUrl?.trim() || doc.fileUrl?.trim() || ''
  const hasUrl = !!url && url !== '#'
  const showPdf = hasUrl && isPdf(doc.fileType, url)

  if (!hasUrl || (showPdf && pdfError) || (!showPdf && imgError)) {
    return (
      <div className={`w-full h-[500px] border border-dashed border-gray-300 rounded bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400 px-6">
          <FileWarning className="mx-auto mb-3 h-10 w-10" />
          <p className="text-sm font-medium text-gray-500">ບໍ່ສາມາດສະແດງເອກະສານນີ້ໄດ້</p>
          <p className="mt-1 text-xs">{hasUrl ? 'ກະລຸນາລອງເປີດໄຟລ໌ຜ່ານປຸ່ມດ້ານລຸ່ມ' : 'ບໍ່ພົບລິ້ງໄຟລ໌ຂອງເອກະສານ'}</p>
          {hasUrl && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              ເປີດໃນແຖບໃໝ່
            </a>
          )}
        </div>
      </div>
    )
  }

  if (showPdf) {
    return (
      <div className={`relative w-full h-[500px] border rounded bg-gray-100 overflow-hidden ${className}`}>
        {pdfLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-2 text-xs">ກຳລັງໂຫຼດ PDF...</p>
            </div>
          </div>
        )}
        <iframe
          src={url}
          title={doc.title}
          className="w-full h-full"
          onLoad={() => setPdfLoading(false)}
          onError={() => { setPdfLoading(false); setPdfError(true) }}
        />
      </div>
    )
  }

  // image / other previewable file
  return (
    <div className={`relative w-full h-[500px] border rounded bg-gray-50 flex items-center justify-center overflow-hidden ${className}`}>
      {imgError ? (
        <div className="text-center text-gray-400 px-6">
          <FileWarning className="mx-auto mb-3 h-10 w-10" />
          <p className="text-sm font-medium text-gray-500">ບໍ່ສາມາດສະແດງຮູບພາບໄດ້</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            ເປີດໄຟລ໌
          </a>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt={doc.title}
          className="max-w-full max-h-full object-contain"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  )
}