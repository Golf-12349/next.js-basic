'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useCurrentUser } from '../../context/CurrentUserContext'
import { pushToast } from '@/app/components/ui/Toast'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import Pagination from '@/app/components/ui/Pagination'
import { cancelTransfer, fetchTransferHistory } from '@/lib/dms/documentService'
import type { Document, DocumentTransfer, TransferStatus } from '@/types/document'
import { toFrontendDocument } from '@/lib/dms/types'
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

function getField(value: unknown): string {
  if (typeof value === 'object' && value !== null && 'name' in value) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy backend fields may arrive as objects
    return (value as any).name || ''
  }
  return (value as string) || ''
}

export default function OutgoingTransfersPage() {
  const { user: currentUser } = useCurrentUser()

  const [historyTransfers, setHistoryTransfers] = useState<DocumentTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TransferStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [detailTransfer, setDetailTransfer] = useState<DocumentTransfer | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 250)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const histRes = await fetchTransferHistory()
      setHistoryTransfers(Array.isArray(histRes) ? histRes : [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const userDept = currentUser?.department?.trim().toLowerCase()
  const userDiv = currentUser?.division?.trim().toLowerCase()

  // Filter outgoing transfers (sent from current user's department)
  const outgoingTransfers = useMemo(() => {
    return historyTransfers.filter((item) => {
      const fromDept = getField(item.fromDepartment).trim().toLowerCase()
      const fromDiv = getField(item.fromDivision).trim().toLowerCase()
      if (userDept) return fromDept === userDept || item.senderId === currentUser?.id
      if (userDiv) return fromDiv === userDiv || item.senderId === currentUser?.id
      return true
    })
  }, [historyTransfers, currentUser, userDept, userDiv])

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    return outgoingTransfers.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (q) {
        const title = item.document?.title?.toLowerCase() || ''
        const docNum = item.document?.docNumber?.toLowerCase() || ''
        const toDept = getField(item.toDepartment).toLowerCase()
        const note = (item.note || '').toLowerCase()
        if (!title.includes(q) && !docNum.includes(q) && !toDept.includes(q) && !note.includes(q)) return false
      }
      return true
    })
  }, [outgoingTransfers, statusFilter, debouncedQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )

  const handleCancel = async (transferId: string) => {
    if (!confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຍົກເລີກການສົ່ງຕໍ່ນີ້?')) return
    setCancellingId(transferId)
    try {
      await cancelTransfer(transferId)
      pushToast({ title: 'ຍົກເລີກສຳເລັດ' })
      void loadData()
    } catch {
      pushToast({ title: 'ບໍ່ສາມາດຍົກເລີກໄດ້' })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <DashboardLayout title="ປະຫວັດເອກະສານຂາອອກ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ປະຫວັດເອກະສານຂາອອກ</h1>
            <p className="mt-1 text-sm text-gray-500">
              ປະຫວັດເອກະສານທີ່ສົ່ງອອກຈາກພະແນກຂອງທ່ານໄປຍັງພະແນກ / ຝ່າຍອື່ນ
            </p>
          </div>
          <button
            type="button"
            onClick={() => { void loadData(); pushToast({ title: 'ໂຫຼດຂໍ້ມູນຄືນໃໝ່ແລ້ວ' }) }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'ກຳລັງໂຫຼດ...' : '🔄 ໂຫຼດຄືນໃໝ່'}
          </button>
        </div>

        {/* Filter bar */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                ຄົ້ນຫາ
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1) }}
                placeholder="ຊື່ເອກະສານ, ເລກທີ, ປາຍທາງ..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                ສະຖານະ
              </label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as 'all' | TransferStatus); setCurrentPage(1) }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:bg-white"
              >
                <option value="all">ທັງໝົດ</option>
                <option value="pending">ລໍຖ້າອະນຸມັດ</option>
                <option value="approved">ອະນຸມັດແລ້ວ</option>
                <option value="rejected">ປະຕິເສດ</option>
                <option value="cancelled">ຍົກເລີກແລ້ວ</option>
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">ພົບ {filtered.length} ລາຍການ</p>
        </div>

        {/* Classic Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto min-h-[320px]">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-3.5 py-3 w-12 text-center whitespace-nowrap">ລ/ດ</th>
                  <th className="px-3.5 py-3 min-w-[200px]">ເອກະສານ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ປາຍທາງ (To)</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ວັນທີສົ່ງ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ຮູບແບບ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ສະຖານະ</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">ການກະທຳ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                      ກຳລັງໂຫຼດຂໍ້ມູນ...
                    </td>
                  </tr>
                )}
                {!loading && pageItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl">
                        📤
                      </div>
                      <p className="text-sm font-semibold text-gray-700">ບໍ່ພົບປະຫວັດການສົ່ງອອກ</p>
                      <p className="mt-1 text-xs text-gray-400">ຍັງບໍ່ມີເອກະສານທີ່ສົ່ງອອກ ຫຼື ບໍ່ກົງກັບເງື່ອນໄຂຄົ້ນຫາ</p>
                    </td>
                  </tr>
                )}
                {!loading && pageItems.map((item, idx) => {
                  const docItem = item.document
                  const toDept = getField(item.toDepartment) || '—'
                  const toDiv = getField(item.toDivision)
                  const canCancel = item.status === 'pending'

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition align-top">
                      <td className="px-3.5 py-3 text-center font-medium text-gray-400 tabular-nums whitespace-nowrap">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            {docItem?.title || `ເອກະສານ #${item.documentId?.slice(0, 8)}`}
                          </span>
                          {docItem?.docNumber && (
                            <span className="mt-0.5 text-xs text-gray-500 font-mono">
                              {docItem.docNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-xs whitespace-nowrap">
                        <p className="font-semibold text-indigo-700">🏬 {toDept}</p>
                        {toDiv && <p className="text-indigo-400">🏢 {toDiv}</p>}
                      </td>
                      <td className="px-3.5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {item.createdAt?.slice(0, 10) || '—'}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        {item.keepCopy ? (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
                            ເກັບສຳເນົາ
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                            ຍ້າຍຕົ້ນສະບັບ
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadgeStyles[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailTransfer(item)}
                            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
                          >
                            ລາຍລະອຽດ
                          </button>
                          {docItem && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(toFrontendDocument(docItem))}
                              className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition"
                            >
                              ເບິ່ງໄຟລ໌
                            </button>
                          )}
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => void handleCancel(item.id)}
                              disabled={cancellingId === item.id}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
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
          {filtered.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="ລາຍການ"
            />
          )}
        </div>

        {/* Modal: Detail */}
        <Modal
          open={!!detailTransfer}
          onClose={() => setDetailTransfer(null)}
          title="ລາຍລະອຽດການສົ່ງອອກ"
        >
          {detailTransfer && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">ສະຖານະ</span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadgeStyles[detailTransfer.status]}`}>
                    {statusLabels[detailTransfer.status]}
                  </span>
                </div>
                <h3 className="mt-2 font-semibold text-gray-900">
                  {detailTransfer.document?.title || `ເອກະສານ #${detailTransfer.documentId}`}
                </h3>
                <p className="text-xs text-gray-500">
                  ເລກທີ: {detailTransfer.document?.docNumber || '—'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-gray-200 p-3">
                  <span className="font-semibold text-gray-400">ຕົ້ນທາງ (From)</span>
                  <p className="mt-1 font-medium text-gray-800">
                    🏬 {getField(detailTransfer.fromDepartment) || '—'}
                  </p>
                  <p className="text-gray-500">
                    🏢 {getField(detailTransfer.fromDivision) || '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                  <span className="font-semibold text-indigo-400">ປາຍທາງ (To)</span>
                  <p className="mt-1 font-medium text-indigo-900">
                    🏬 {getField(detailTransfer.toDepartment) || '—'}
                  </p>
                  <p className="text-indigo-600">
                    🏢 {getField(detailTransfer.toDivision) || '—'}
                  </p>
                </div>
              </div>

              {detailTransfer.note && (
                <div className="rounded-xl border border-gray-200 p-3 text-xs">
                  <span className="text-gray-500 font-semibold">ໝາຍເຫດການສົ່ງ:</span>
                  <p className="mt-1 text-gray-800">{detailTransfer.note}</p>
                </div>
              )}

              {detailTransfer.rejectionReason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs">
                  <span className="text-rose-600 font-semibold">ເຫດຜົນການປະຕິເສດຈາກປາຍທາງ:</span>
                  <p className="mt-1 text-rose-800">{detailTransfer.rejectionReason}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDetailTransfer(null)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  ປິດ
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: Preview */}
        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.title}
          scrollBody={false}
          footer={
            previewDoc && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                >
                  ປິດ
                </button>
                {previewDoc.fileUrl && previewDoc.fileUrl !== '#' && (
                  <a
                    href={previewDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition inline-flex items-center gap-1.5"
                  >
                    ດາວໂຫຼດໄຟລ໌
                  </a>
                )}
              </div>
            )
          }
        >
          {previewDoc && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="grid shrink-0 grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">ເລກທີ</div>
                  <div className="font-semibold">{previewDoc.docNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">ໝວດໝູ່</div>
                  <div className="font-semibold">
                    {typeof previewDoc.category === 'object' && previewDoc.category !== null
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy category field may arrive as an object
                      ? ((previewDoc.category as any).name || '—')
                      : (previewDoc.category || '—')}
                  </div>
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
