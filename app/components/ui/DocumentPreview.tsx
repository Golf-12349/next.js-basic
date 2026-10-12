"use client"
import React, { useState } from 'react'
import type { Document } from '@/types/document'
import { Download, ExternalLink, FileSpreadsheet, FileText, FileWarning, Loader2 } from 'lucide-react'

function isPdf(fileType: Document['fileType'], url: string): boolean {
  if (fileType === 'pdf') return true
  return /\.pdf($|\?)/i.test(url)
}

function isImage(fileType: Document['fileType'], url: string): boolean {
  if (fileType === 'image') return true
  return /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(url)
}

function isDocx(fileType: Document['fileType'], url: string): boolean {
  if (fileType === 'doc' || (fileType as string) === 'docx') return true
  return /\.(docx?|odt)($|\?)/i.test(url)
}

function isExcel(url: string): boolean {
  return /\.(xlsx?|csv)($|\?)/i.test(url)
}

export default function DocumentPreview({
  doc,
  className = '',
  heightClassName = 'h-[500px]',
}: {
  doc: Document
  className?: string
  /** Height utilities for the preview box. Pass e.g. 'min-h-0 flex-1' to make it fill a flex column parent. */
  heightClassName?: string
}) {
  const [pdfError, setPdfError] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(true)

  const url = doc.pdfUrl?.trim() || doc.fileUrl?.trim() || ''
  const hasUrl = !!url && url !== '#'
  const showPdf = hasUrl && isPdf(doc.fileType, url)
  const showImage = hasUrl && !showPdf && isImage(doc.fileType, url)
  const showWord = hasUrl && !showPdf && !showImage && isDocx(doc.fileType, url)
  const showExcel = hasUrl && !showPdf && !showImage && isExcel(url)

  if (!hasUrl || (showPdf && pdfError) || (showImage && imgError)) {
    return (
      <div className={`w-full ${heightClassName} border border-dashed border-gray-300 rounded bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400 px-6">
          <FileWarning className="mx-auto mb-3 h-10 w-10" />
          <p className="text-sm font-medium text-gray-500">ບໍ່ສາມາດສະແດງເອກະສານນີ້ໄດ້</p>
          <p className="mt-1 text-xs">{hasUrl ? 'ກະລຸນາລອງເປີດໄຟລ໌ຜ່ານປຸ່ມດ້ານລຸ່ມ' : 'ບໍ່ພົບລິ້ງໄຟລ໌ຂອງເອກະສານ'}</p>
          {hasUrl && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
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
      <div className={`relative w-full ${heightClassName} border rounded bg-gray-100 overflow-hidden ${className}`}>
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

  if (showWord || showExcel || !showImage) {
    return (
      <div className={`relative w-full ${heightClassName} border rounded-xl bg-slate-50 flex items-center justify-center p-6 ${className}`}>
        <div className="max-w-md text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-100">
            {showExcel ? <FileSpreadsheet className="h-8 w-8 text-emerald-600" /> : <FileText className="h-8 w-8 text-blue-600" />}
          </div>
          <h3 className="font-bold text-slate-900 text-base line-clamp-2">{doc.title}</h3>
          <p className="mt-1 text-xs text-slate-500 font-mono">
            {doc.fileName || (showExcel ? 'Excel Spreadsheet Document' : 'Microsoft Word Document')}
          </p>
          <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {showExcel ? 'XLSX / CSV' : 'DOCX / Word'}
          </div>
          <div className="mt-5 flex items-center justify-center gap-3">
            <a
              href={url}
              download={doc.fileName || doc.title}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              ດາວໂຫຼດໄຟລ໌
            </a>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              ເປີດເບິ່ງ
            </a>
          </div>
        </div>
      </div>
    )
  }

  // image previewable file
  return (
    <div className={`relative w-full ${heightClassName} border rounded bg-gray-50 flex items-center justify-center overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={doc.title}
        className="max-w-full max-h-full object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  )
}