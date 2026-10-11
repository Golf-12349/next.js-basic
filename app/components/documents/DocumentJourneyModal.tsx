'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import type { Document, DocumentTransfer } from '@/types/document'
import { fetchDocumentTransfers } from '@/lib/dms/documentService'
import {
  Route,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  ArrowRight,
  Building2,
  MapPin,
  User,
  Calendar,
  FileText,
  Copy,
  FolderArchive,
  Layers,
} from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  documentId: string
  document?: Document | null
}

const statusBadgeStyles: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200 border-amber-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200 border-rose-200',
  cancelled: 'bg-gray-100 text-gray-600 ring-gray-200 border-gray-200',
}

const statusLabels: Record<string, string> = {
  approved: 'ອະນຸມັດແລ້ວ',
  pending: 'ລໍຖ້າຮັບ',
  rejected: 'ຕີກັບ / ປະຕິເສດ',
  cancelled: 'ຍົກເລີກແລ້ວ',
}

function getField(val: unknown): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object' && val !== null && 'name' in val) {
    return String((val as { name: unknown }).name || '')
  }
  return String(val)
}

const SAMPLE_MULTI_TRANSFERS: DocumentTransfer[] = [
  {
    id: 'demo-tf-1',
    documentId: 'demo-doc-1',
    fromDivision: 'ຝ່າຍເຕັກໂນໂລຊີ ການສື່ສານ ຂໍ້ມູນຂ່າວສານ',
    fromDepartment: 'ພະແນກຄຸ້ມຄອງລະບົບເຄືອຂ່າຍ',
    toDivision: 'ຝ່າຍເຕັກໂນໂລຊີ ການສື່ສານ ຂໍ້ມູນຂ່າວສານ',
    toDepartment: 'ພະແນກພັດທະນາ-ຄຸ້ມຄອງຊອບແວ',
    senderId: 'u1',
    sender: { id: 'u1', name: 'test02', department: 'ພະແນກຄຸ້ມຄອງລະບົບເຄືອຂ່າຍ' },
    reviewer: { id: 'u2', name: 'Souk', department: 'ພະແນກພັດທະນາ-ຄຸ້ມຄອງຊອບແວ' },
    status: 'approved',
    keepCopy: false,
    note: 'ສົ່ງບົດສະເໜີໂຄງການພັດທະນາລະບົບໃໝ່ ເພື່ອກວດສອບ ແລະ ປະເມີນເຕັກໂນໂລຊີ',
    createdAt: '2026-09-20T08:30:00Z',
    updatedAt: '2026-09-21T10:15:00Z',
  },
  {
    id: 'demo-tf-2',
    documentId: 'demo-doc-1',
    fromDivision: 'ຝ່າຍເຕັກໂນໂລຊີ ການສື່ສານ ຂໍ້ມູນຂ່າວສານ',
    fromDepartment: 'ພະແນກພັດທະນາ-ຄຸ້ມຄອງຊອບແວ',
    toDivision: 'ຝ່າຍການເງິນ ແລະ ບັນຊີ',
    toDepartment: 'ພະແນກຄຸ້ມຄອງງົບປະມານ',
    senderId: 'u2',
    sender: { id: 'u2', name: 'Souk', department: 'ພະແນກພັດທະນາ-ຄຸ້ມຄອງຊອບແວ' },
    reviewer: { id: 'u3', name: 'ຄຳຫຼ້າ', department: 'ພະແນກຄຸ້ມຄອງງົບປະມານ' },
    status: 'rejected',
    keepCopy: true,
    note: 'ສົ່ງຂໍອະນຸມັດງົບປະມານຈັດຊື້ອຸປະກອນ Server ແລະ Cloud hosting',
    rejectionReason: 'ເອກະສານຂາດໃບສະເໜີລາຄາປຽບທຽບ 3 ບໍລິສັດ, ກະລຸນາຕິດຄັດເພີ່ມເຕີມແລ້ວສົ່ງໃໝ່',
    createdAt: '2026-09-26T13:45:00Z',
    updatedAt: '2026-09-27T09:00:00Z',
  },
  {
    id: 'demo-tf-3',
    documentId: 'demo-doc-1',
    fromDivision: 'ຝ່າຍເຕັກໂນໂລຊີ ການສື່ສານ ຂໍ້ມູນຂ່າວສານ',
    fromDepartment: 'ພະແນກພັດທະນາ-ຄຸ້ມຄອງຊອບແວ',
    toDivision: 'ຝ່າຍການເງິນ ແລະ ບັນຊີ',
    toDepartment: 'ພະແນກຄຸ້ມຄອງງົບປະມານ',
    senderId: 'u2',
    sender: { id: 'u2', name: 'Souk', department: 'ພະແນກພັດທະນາ-ຄຸ້ມຄອງຊອບແວ' },
    reviewer: { id: 'u3', name: 'ຄຳຫຼ້າ', department: 'ພະແນກຄຸ້ມຄອງງົບປະມານ' },
    status: 'approved',
    keepCopy: true,
    note: 'ສົ່ງເອກະສານຄືນໃໝ່ ພ້ອມຕິດຄັດໃບສະເໜີລາຄາຄົບ 3 ບໍລິສັດຕາມທີ່ຮ້ອງຂໍ',
    createdAt: '2026-10-02T10:20:00Z',
    updatedAt: '2026-10-03T14:30:00Z',
  },
  {
    id: 'demo-tf-4',
    documentId: 'demo-doc-1',
    fromDivision: 'ຝ່າຍການເງິນ ແລະ ບັນຊີ',
    fromDepartment: 'ພະແນກຄຸ້ມຄອງງົບປະມານ',
    toDivision: 'ຝ່າຍຈັດຕັ້ງ ແລະ ບໍລິຫານ',
    toDepartment: 'ພະແນກບໍລິຫານ-ສັງລວມ',
    senderId: 'u3',
    sender: { id: 'u3', name: 'ຄຳຫຼ້າ', department: 'ພະແນກຄຸ້ມຄອງງົບປະມານ' },
    status: 'pending',
    keepCopy: false,
    note: 'ສົ່ງໃຫ້ພະແນກບໍລິຫານ-ສັງລວມ ອະນຸມັດຂັ້ນສຸດທ້າຍ ແລະ ເກັບເຂົ້າຄັງເອກະສານກາງ',
    createdAt: '2026-10-10T16:00:00Z',
    updatedAt: '2026-10-10T16:00:00Z',
  },
]

export default function DocumentJourneyModal({
  open,
  onClose,
  documentId,
  document: initialDoc,
}: Props) {
  const [transfers, setTransfers] = useState<DocumentTransfer[]>([])
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !documentId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchDocumentTransfers(documentId)
      .then((data) => {
        if (!cancelled) {
          // Sort chronological (oldest transfer first) for clear journey timeline
          const sorted = [...data].sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime()
            const timeB = new Date(b.createdAt || 0).getTime()
            return timeA - timeB
          })
          setTransfers(sorted)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load document transfers:', err)
          setError('ບໍ່ສາມາດໂຫຼດປະຫວັດເສັ້ນທາງເອກະສານໄດ້')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, documentId])

  if (!open) return null

  const displayedTransfers = isDemoMode ? SAMPLE_MULTI_TRANSFERS : transfers
  const doc = initialDoc || (transfers.length > 0 ? transfers[0].document : null)
  const docTitle = isDemoMode
    ? 'ບົດສະເໜີໂຄງການພັດທະນາລະບົບ ແລະ ຈັດຊື້ອຸປະກອນ Cloud'
    : (doc?.title || `ເອກະສານ #${documentId.slice(0, 8)}`)
  const docNumber = isDemoMode ? 'DOC-2026-DEMO-001' : (doc?.docNumber || '')

  // Current location
  const currentDept = isDemoMode
    ? getField(SAMPLE_MULTI_TRANSFERS[SAMPLE_MULTI_TRANSFERS.length - 1].toDepartment)
    : (doc?.department || (transfers.length > 0 ? getField(transfers[transfers.length - 1].toDepartment) : ''))
  const currentDiv = isDemoMode
    ? getField(SAMPLE_MULTI_TRANSFERS[SAMPLE_MULTI_TRANSFERS.length - 1].toDivision)
    : (doc?.division || (transfers.length > 0 ? getField(transfers[transfers.length - 1].toDivision) : ''))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ເສັ້ນທາງການເຄື່ອນໄຫວເອກະສານ"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-gray-500">
            ມີການສົ່ງຕໍ່ທັງໝົດ <span className="font-bold text-gray-800">{displayedTransfers.length}</span> ຄັ້ງ {isDemoMode && <span className="text-purple-600 font-semibold">(ຕົວຢ່າງຈຳລອງ)</span>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            ປິດໜ້າຕ່າງ
          </button>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {/* Demo Simulation Toggle Bar */}
        <div className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50/80 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isDemoMode ? 'bg-purple-600 animate-pulse' : 'bg-gray-400'}`} />
            <span className="font-semibold text-purple-950 truncate">
              {isDemoMode ? '✨ ກຳລັງສະແດງ: ຕົວຢ່າງຈຳລອງສົ່ງຕໍ່ 4 ຂັ້ນຕອນ' : 'ໂໝດທົດສອບ (Demo):'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDemoMode((prev) => !prev)}
            className="shrink-0 rounded-lg bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700 transition shadow-xs cursor-pointer"
          >
            {isDemoMode ? '← ກັບໄປຂໍ້ມູນຈິງ' : '✨ ຈຳລອງສົ່ງຕໍ່ 4 ຂັ້ນຕອນ'}
          </button>
        </div>

        {/* Document Header Card */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-indigo-50/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                {doc?.category || 'ເອກະສານ'}
              </span>
              <h4 className="mt-0.5 text-base font-bold text-gray-900 truncate">
                {docTitle}
              </h4>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {docNumber && (
                  <span className="font-mono rounded bg-white px-2 py-0.5 border border-gray-200 text-gray-700 font-medium">
                    {docNumber}
                  </span>
                )}
                {doc?.uploadDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    ວັນທີສ້າງ: {doc.uploadDate.slice(0, 10)}
                  </span>
                )}
              </div>
            </div>

            {/* Current Location Badge */}
            <div className="shrink-0 text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800 border border-indigo-200">
                <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                ປັດຈຸບັນ
              </span>
              {currentDept && (
                <p className="mt-1 text-xs font-medium text-gray-700 max-w-[160px] truncate">
                  {currentDept}
                </p>
              )}
            </div>
          </div>

          {/* Storage hierarchy if available */}
          {(doc?.warehouseName || doc?.cabinetName || doc?.folderName) && (
            <div className="mt-3 pt-3 border-t border-gray-200/80 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span className="font-medium text-gray-500">ບ່ອນເກັບ:</span>
              {doc.warehouseName && (
                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 border border-gray-200 font-medium text-gray-700">
                  <Building2 className="h-3 w-3 text-amber-600" />
                  {doc.warehouseName}
                </span>
              )}
              {doc.cabinetName && (
                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 border border-gray-200 font-medium text-gray-700">
                  <Layers className="h-3 w-3 text-blue-600" />
                  {doc.cabinetName}
                </span>
              )}
              {doc.shelfName && (
                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 border border-gray-200 font-medium text-gray-700">
                  {doc.shelfName}
                </span>
              )}
              {doc.folderName && (
                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 border border-gray-200 font-medium text-gray-700">
                  <FolderArchive className="h-3 w-3 text-purple-600" />
                  {doc.folderName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="py-12 text-center text-sm text-gray-500">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
            ກຳລັງໂຫຼດເສັ້ນທາງເອກະສານ...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Visual Timeline Path */}
        {!loading && !error && (
          <div className="relative pl-6 space-y-6 before:absolute before:bottom-3 before:top-3 before:left-2.5 before:w-0.5 before:bg-gray-200">
            {/* 1. Point of Origin (Start) */}
            <div className="relative group">
              <div className="absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white text-white shadow-sm">
                <FileText className="h-3 w-3" />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs transition hover:border-gray-300">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 border border-blue-200">
                    ຈຸດເລີ່ມຕົ້ນ (Origin)
                  </span>
                  <span className="text-xs text-gray-400">
                    {doc?.uploadDate?.slice(0, 10) || 'ວັນທີເລີ່ມຕົ້ນ'}
                  </span>
                </div>

                <div className="mt-2 text-xs">
                  <p className="font-semibold text-gray-800">
                    🏬 {displayedTransfers.length > 0 ? getField(displayedTransfers[0].fromDepartment) : (doc?.department || 'ພະແນກຕົ້ນທາງ')}
                  </p>
                  {(displayedTransfers.length > 0 ? getField(displayedTransfers[0].fromDivision) : doc?.division) && (
                    <p className="text-gray-500">
                      🏢 {displayedTransfers.length > 0 ? getField(displayedTransfers[0].fromDivision) : doc?.division}
                    </p>
                  )}
                  {doc?.uploadedBy && (
                    <p className="mt-1 inline-flex items-center gap-1 text-gray-600">
                      <User className="h-3 w-3 text-gray-400" />
                      ຜູ້ສ້າງ / ອັບໂຫຼດ: <span className="font-medium text-gray-800">{isDemoMode ? 'test02' : doc.uploadedBy}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Transfer Steps */}
            {displayedTransfers.length === 0 ? (
              <div className="relative">
                <div className="absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white text-white shadow-sm">
                  <MapPin className="h-3 w-3" />
                </div>
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-4 text-center text-xs text-gray-500">
                  <p className="font-medium text-gray-700">ເອກະສານຍັງບໍ່ເຄີຍຖືກສົ່ງຕໍ່ໄປພະແນກອື່ນ</p>
                  <p className="mt-0.5 text-gray-400">ເອກະສານເກັບຮັກສາຢູ່ພະແນກຕົ້ນທາງ</p>
                </div>
              </div>
            ) : (
              displayedTransfers.map((t, idx) => {
                const stepNum = idx + 1
                const fromDept = getField(t.fromDepartment) || '—'
                const fromDiv = getField(t.fromDivision)
                const toDept = getField(t.toDepartment) || '—'
                const toDiv = getField(t.toDivision)
                const isApproved = t.status === 'approved'
                const isPending = t.status === 'pending'
                const isRejected = t.status === 'rejected'
                const isCancelled = t.status === 'cancelled'

                const StepIcon = isApproved
                  ? CheckCircle2
                  : isPending
                  ? Clock
                  : isRejected
                  ? XCircle
                  : Ban

                const iconBg = isApproved
                  ? 'bg-emerald-600 text-white'
                  : isPending
                  ? 'bg-amber-500 text-white'
                  : isRejected
                  ? 'bg-rose-600 text-white'
                  : 'bg-gray-500 text-white'

                return (
                  <div key={t.id} className="relative group">
                    <div className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white shadow-sm ${iconBg}`}>
                      <StepIcon className="h-3.5 w-3.5" />
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs transition hover:border-gray-300">
                      {/* Step Header */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">
                            ຂັ້ນຕອນທີ {stepNum}: ການສົ່ງຕໍ່
                          </span>
                          {t.keepCopy ? (
                            <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700 border border-blue-200">
                              <Copy className="h-2.5 w-2.5" /> ເກັບສຳເນົາ
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.2 text-[10px] text-gray-600">
                              ຍ້າຍຕົ້ນສະບັບ
                            </span>
                          )}
                        </div>

                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${statusBadgeStyles[t.status] || ''}`}>
                          {statusLabels[t.status] || t.status}
                        </span>
                      </div>

                      {/* Origin -> Destination Route */}
                      <div className="mt-3 flex items-center gap-3 rounded-lg bg-gray-50/80 p-2.5 text-xs border border-gray-100">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-semibold uppercase text-gray-400">ຈາກ (From)</span>
                          <p className="font-semibold text-gray-800 truncate">🏬 {fromDept}</p>
                          {fromDiv && <p className="text-[11px] text-gray-500 truncate">🏢 {fromDiv}</p>}
                        </div>

                        <div className="shrink-0 flex items-center justify-center text-gray-400">
                          <ArrowRight className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-semibold uppercase text-indigo-400">ຫາ (To)</span>
                          <p className="font-semibold text-indigo-900 truncate">🏬 {toDept}</p>
                          {toDiv && <p className="text-[11px] text-indigo-600 truncate">🏢 {toDiv}</p>}
                        </div>
                      </div>

                      {/* Meta: Sender, Date, Approver, Note */}
                      <div className="mt-2.5 space-y-1 text-xs text-gray-600">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-400" />
                            ຜູ້ສົ່ງ: <strong className="font-medium text-gray-800">{t.sender?.name || '—'}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1 text-gray-400">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {t.createdAt?.slice(0, 16).replace('T', ' ') || '—'}
                          </span>
                        </div>

                        {/* Reviewer / Approver info */}
                        {isApproved && (
                          <div className="rounded-lg bg-emerald-50/60 p-2 text-emerald-800 border border-emerald-100 text-[11px] flex items-center justify-between">
                            <span>
                              ✅ ຮັບເອກະສານແລ້ວໂດຍ: <strong>{t.reviewer?.name || 'ພະແນກປາຍທາງ'}</strong>
                            </span>
                            <span className="text-emerald-600 text-[10px]">
                              {t.updatedAt?.slice(0, 10)}
                            </span>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {isRejected && (
                          <div className="rounded-lg bg-rose-50 p-2 text-rose-800 border border-rose-100 text-[11px]">
                            <span>❌ ເຫດຜົນທີ່ຕີກັບ: <strong>{t.rejectionReason || 'ບໍ່ໄດ້ລະບຸເຫດຜົນ'}</strong></span>
                          </div>
                        )}

                        {/* Pending Status */}
                        {isPending && (
                          <div className="rounded-lg bg-amber-50 p-2 text-amber-800 border border-amber-100 text-[11px]">
                            ⏳ ລໍຖ້າພະແນກປາຍທາງ ({toDept}) ກວດກາ ແລະ ຢືນຢັນຮັບເຂົ້າຄັງ
                          </div>
                        )}

                        {/* Note */}
                        {t.note && (
                          <p className="text-[11px] text-gray-500 italic mt-1">
                            ໝາຍເຫດ: &ldquo;{t.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            {/* 3. Current Location Pin (End of path) */}
            {displayedTransfers.length > 0 && (
              <div className="relative">
                <div className="absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 ring-4 ring-white text-white shadow-sm">
                  <MapPin className="h-3 w-3" />
                </div>
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-xs text-indigo-900">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">📍 ບ່ອນຢູ່ລ່າສຸດຂອງເອກະສານ:</span>
                    <span className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider">
                      ປັດຈຸບັນ
                    </span>
                  </div>
                  <p className="mt-1 font-semibold text-indigo-950">
                    🏬 {currentDept || '—'}
                  </p>
                  {currentDiv && <p className="text-[11px] text-indigo-700">🏢 {currentDiv}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
