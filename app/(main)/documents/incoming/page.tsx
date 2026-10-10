'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../../context/DocumentsContext'
import { useCurrentUser } from '../../context/CurrentUserContext'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import Pagination from '@/app/components/ui/Pagination'
import { pushToast } from '@/app/components/ui/Toast'
import {
  cancelTransfer,
  fetchIncomingTransfers,
  fetchTransferHistory,
} from '@/lib/dms/documentService'
import type { Document, DocumentTransfer, TransferStatus } from '@/types/document'
import { Eye, FileText, Info } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

const PAGE_SIZE = 15

const statusBadgeStyles: Record<TransferStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 ring-rose-200',
  cancelled: 'bg-slate-100 text-slate-700 ring-slate-200',
}

const statusLabels: Record<TransferStatus, string> = {
  pending: 'ລໍຖ້າອະນຸມັດ',
  approved: 'ອະນຸມັດແລ້ວ',
  rejected: 'ປະຕິເສດ',
  cancelled: 'ຍົກເລີກແລ້ວ',
}

interface EnrichedTransfer extends DocumentTransfer {
  document?: Document
}

function formatStamp(rawDate?: string): { date: string; time: string } {
  if (!rawDate) return { date: '—', time: '' }
  const d = new Date(rawDate)
  if (isNaN(d.getTime())) return { date: rawDate, time: '' }
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return { date: `${dd}/${mm}/${yyyy}`, time: `${hh}:${mi}` }
}

function getField(value: unknown): string {
  if (typeof value === 'object' && value !== null && 'name' in value) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects
    return (value as any).name || ''
  }
  return (value as string) || ''
}



export default function IncomingTransfersPage() {
  const { documents, reload } = useDocuments()
  const { user: currentUser } = useCurrentUser()

  const [incomingTransfers, setIncomingTransfers] = useState<DocumentTransfer[]>([])
  const [historyTransfers, setHistoryTransfers] = useState<DocumentTransfer[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [detailTransfer, setDetailTransfer] = useState<EnrichedTransfer | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 250)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [incRes, histRes] = await Promise.allSettled([
        fetchIncomingTransfers(),
        fetchTransferHistory(),
      ])
      if (incRes.status === 'fulfilled' && Array.isArray(incRes.value)) {
        setIncomingTransfers(incRes.value)
      }
      if (histRes.status === 'fulfilled' && Array.isArray(histRes.value)) {
        setHistoryTransfers(histRes.value)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load data on mount
    void loadData()
  }, [reload, loadData])

  const userDept = currentUser?.department?.trim().toLowerCase()
  const userDiv = currentUser?.division?.trim().toLowerCase()

  // Build enriched incoming pending transfers (from fetchIncomingTransfers API which already filters server-side)
  const pendingIncoming = useMemo((): EnrichedTransfer[] => {
    const docMap = new Map<string, Document>()
    documents.forEach((d) => docMap.set(d.id, d))

    return incomingTransfers.map((t) => ({
      ...t,
      document: t.document ?? docMap.get(t.documentId),
    }))
  }, [incomingTransfers, documents])

  // Build enriched history transfers filtered for incoming
  const historyIncoming = useMemo((): EnrichedTransfer[] => {
    const docMap = new Map<string, Document>()
    documents.forEach((d) => docMap.set(d.id, d))

    return historyTransfers
      .filter((item) => {
        const toDept = getField(item.toDepartment).trim().toLowerCase()
        const toDiv = getField(item.toDivision).trim().toLowerCase()
        if (userDept) return toDept === userDept
        if (userDiv) return toDiv === userDiv
        return false
      })
      .filter((item) => item.status !== 'pending') // pending ones are in incomingTransfers already
      .map((t) => ({ ...t, document: t.document ?? docMap.get(t.documentId) }))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  }, [historyTransfers, documents, userDept, userDiv])

  // Filtered pending list
  const filteredPending = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return pendingIncoming
    return pendingIncoming.filter((item) => {
      const title = item.document?.title?.toLowerCase() || ''
      const docNum = item.document?.docNumber?.toLowerCase() || ''
      const sender = (item.sender?.name || '').toLowerCase()
      const note = (item.note || '').toLowerCase()
      return title.includes(q) || docNum.includes(q) || sender.includes(q) || note.includes(q)
    })
  }, [pendingIncoming, debouncedQuery])

  const totalPages = Math.max(1, Math.ceil(filteredPending.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const pageItems = useMemo(
    () => filteredPending.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPending, page],
  )

  const handleCancel = async (transferId: string) => {
    if (!confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຍົກເລີກການສົ່ງຕໍ່ນີ້?')) return
    setCancellingId(transferId)
    try {
      await cancelTransfer(transferId)
      pushToast({ title: 'ຍົກເລີກສຳເລັດ' })
      void reload()
      void loadData()
    } catch {
      pushToast({ title: 'ບໍ່ສາມາດຍົກເລີກໄດ້' })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <DashboardLayout title="ເອກະສານຂາເຂົ້າ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ເອກະສານຂາເຂົ້າ</h1>
            <p className="mt-1 text-sm text-gray-500">
              ເອກະສານທີ່ຖືກສົ່ງໂອນມາຫາພະແນກຂອງທ່ານ — ລໍຖ້າກວດສອບ ແລະ ຮັບ
            </p>
          </div>
          <button
            type="button"
            onClick={() => { void reload(); void loadData(); pushToast({ title: 'ໂຫຼດຂໍ້ມູນຄືນໃໝ່' }) }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'ກຳລັງໂຫຼດ...' : '🔄 ໂຫຼດຄືນໃໝ່'}
          </button>
        </div>

        {/* Search */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="max-w-md">
            <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              ຄົ້ນຫາ
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setCurrentPage(1) }}
              placeholder="ຊື່ເອກະສານ, ເລກທີ, ຜູ້ສົ່ງ, ໝາຍເຫດ..."
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">ພົບ {filteredPending.length} ລາຍການລໍຖ້າ</p>
        </div>

        {/* Pending Incoming Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">
              📥 ລໍຖ້າການຮັບ
              {pendingIncoming.length > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  {pendingIncoming.length} ລາຍການ
                </span>
              )}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12 text-center">ລ/ດ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ວັນທີ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[180px]">ເອກະສານ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ຕົ້ນທາງ (From)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ຜູ້ສົ່ງ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ໝາຍເຫດ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ສະຖານະ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">ການກະທຳ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">ກຳລັງໂຫຼດ...</td>
                  </tr>
                )}
                {!loading && pageItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-2xl">📥</div>
                      <p className="text-sm font-medium text-gray-600">ບໍ່ມີເອກະສານຂາເຂົ້າທີ່ລໍຖ້າ</p>
                      <p className="mt-1 text-xs text-gray-400">ເມື່ອມີຜູ້ໃດສົ່ງເອກະສານຫາພະແນກຂອງທ່ານ ລາຍການຈະສະແດງຢູ່ນີ້</p>
                    </td>
                  </tr>
                )}
                {pageItems.map((item, idx) => {
                  const stamp = formatStamp(item.createdAt)
                  const fromDept = getField(item.fromDepartment) || '—'
                  const fromDiv = getField(item.fromDivision)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center text-sm text-gray-400 tabular-nums">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        <div>{stamp.date}</div>
                        {stamp.time && <div className="text-xs text-gray-400">{stamp.time}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <FileText className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                              {item.document?.title || `ເອກະສານ #${item.documentId?.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-gray-500">{item.document?.docNumber || '—'}</p>
                            {item.keepCopy && (
                              <span className="mt-0.5 inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                                📑 ຕົ້ນທາງເກັບສຳເນົາ
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                        <p className="font-medium">🏬 {fromDept}</p>
                        {fromDiv && <p className="text-gray-400">🏢 {fromDiv}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">{item.sender?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px]">
                        {item.note ? <span className="italic">{item.note}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeStyles[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailTransfer(item)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            <Info className="h-3.5 w-3.5 text-gray-400" />
                            ລາຍລະອຽດ
                          </button>
                          {item.document && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(item.document || null)}
                              className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              ເບິ່ງ
                            </button>
                          )}
                          {item.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => void handleCancel(item.id)}
                              disabled={cancellingId === item.id}
                              className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              ຍົກເລີກ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredPending.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredPending.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="ລາຍການ"
            />
          )}
        </div>

        {/* History Section */}
        {historyIncoming.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">📋 ປະຫວັດການຮັບ (ອະນຸມັດ / ປະຕິເສດ)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12 text-center">ລ/ດ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ວັນທີ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[160px]">ເອກະສານ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ຕົ້ນທາງ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ຜູ້ສົ່ງ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ສະຖານະ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">ການກະທຳ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historyIncoming.map((item, idx) => {
                    const stamp = formatStamp(item.createdAt)
                    const fromDept = getField(item.fromDepartment) || '—'
                    const fromDiv = getField(item.fromDivision)
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-center text-sm text-gray-400 tabular-nums">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          <div>{stamp.date}</div>
                          {stamp.time && <div className="text-xs text-gray-400">{stamp.time}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {item.document?.title || `ເອກະສານ #${item.documentId?.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-gray-500">{item.document?.docNumber || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                          <p className="font-medium">🏬 {fromDept}</p>
                          {fromDiv && <p className="text-gray-400">🏢 {fromDiv}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">{item.sender?.name || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeStyles[item.status]}`}>
                            {statusLabels[item.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDetailTransfer(item)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            <Info className="h-3.5 w-3.5 text-gray-400" />
                            ລາຍລະອຽດ
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        <Modal
          open={!!detailTransfer}
          onClose={() => setDetailTransfer(null)}
          title="ລາຍລະອຽດການໂອນເອກະສານ"
        >
          {detailTransfer && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">ສະຖານະ</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeStyles[detailTransfer.status]}`}>
                    {statusLabels[detailTransfer.status]}
                  </span>
                </div>
                <h3 className="mt-2 font-semibold text-gray-900">
                  {detailTransfer.document?.title || `ເອກະສານ #${detailTransfer.documentId}`}
                </h3>
                <p className="text-xs text-gray-500">{detailTransfer.document?.docNumber || '—'}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-3">
                  <span className="text-xs font-semibold uppercase text-gray-400">ຕົ້ນທາງ (From)</span>
                  <p className="mt-1 text-sm font-semibold text-gray-800">🏬 {getField(detailTransfer.fromDepartment) || '—'}</p>
                  <p className="text-xs text-gray-400">🏢 {getField(detailTransfer.fromDivision) || '—'}</p>
                </div>
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                  <span className="text-xs font-semibold uppercase text-indigo-500">ປາຍທາງ (To)</span>
                  <p className="mt-1 text-sm font-semibold text-indigo-900">🏬 {getField(detailTransfer.toDepartment) || '—'}</p>
                  <p className="text-xs text-indigo-700">🏢 {getField(detailTransfer.toDivision) || '—'}</p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-gray-100 p-3 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">ຜູ້ສົ່ງ:</span>
                  <span className="font-medium text-gray-900">{detailTransfer.sender?.name || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">ວັນທີ:</span>
                  <span className="font-medium text-gray-900">
                    {formatStamp(detailTransfer.createdAt).date} {formatStamp(detailTransfer.createdAt).time}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">ຮູບແບບ:</span>
                  <span className="font-medium text-gray-900">
                    {detailTransfer.keepCopy ? 'ເກັບສຳເນົາຕົ້ນສະບັບ' : 'ຍ້າຍຕົ້ນສະບັບ'}
                  </span>
                </div>
                {detailTransfer.note && (
                  <div className="py-1">
                    <span className="text-gray-500">ໝາຍເຫດ:</span>
                    <p className="mt-1 rounded-md bg-gray-50 p-2 text-gray-700">{detailTransfer.note}</p>
                  </div>
                )}
                {detailTransfer.rejectionReason && (
                  <div className="py-1">
                    <span className="font-semibold text-rose-600">ເຫດຜົນການຕີກັບ:</span>
                    <p className="mt-1 rounded-md bg-rose-50 p-2 text-rose-800">{detailTransfer.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDetailTransfer(null)}
                  className="rounded-md bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  ປິດ
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Preview Modal */}
        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.title}
          scrollBody={false}
        >
          {previewDoc && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <div className="text-xs text-gray-500">ເລກທີ</div>
                  <div className="text-sm font-semibold">{previewDoc.docNumber || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ໝວດໝູ່</div>
                  <div className="text-sm font-semibold">{previewDoc.category || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ຝ່າຍ</div>
                  <div className="text-sm font-semibold">{previewDoc.division || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ພະແນກ</div>
                  <div className="text-sm font-semibold">{previewDoc.department || '—'}</div>
                </div>
              </div>
              <DocumentPreview doc={previewDoc} heightClassName="min-h-0 flex-1" />
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}

