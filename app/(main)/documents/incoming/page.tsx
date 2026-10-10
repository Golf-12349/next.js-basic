'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../../context/DocumentsContext'
import { useCurrentUser } from '../../context/CurrentUserContext'
import { pushToast } from '@/app/components/ui/Toast'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import Pagination from '@/app/components/ui/Pagination'
import type { Document, DocumentTransfer, TransferStatus } from '@/types/document'
import SelectStorageLocationModal from '@/app/components/documents/SelectStorageLocationModal'
import {
  approveTransfer,
  cancelTransfer,
  rejectTransfer,
} from '@/lib/dms/documentService'
import { toFrontendDocument } from '@/lib/dms/types'
import { useDebounce } from '@/hooks/useDebounce'
import { CheckCircle2, Clock, FileText } from 'lucide-react'

const PAGE_SIZE = 15

type TabType = 'pending' | 'history'

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

export default function IncomingDocumentsPage() {
  const {
    incomingTransfers,
    transferHistory,
    loadingTransfers,
    reloadTransfers,
    reload,
  } = useDocuments()
  const { user: currentUser } = useCurrentUser()

  const [activeTab, setActiveTab] = useState<TabType>('pending')

  const [query, setQuery] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | TransferStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [detailTransfer, setDetailTransfer] = useState<DocumentTransfer | null>(null)
  const [transferToApprove, setTransferToApprove] = useState<DocumentTransfer | null>(null)
  const [transferToReject, setTransferToReject] = useState<DocumentTransfer | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 250)

  useEffect(() => {
    void reloadTransfers()
  }, [reloadTransfers])

  const userDept = currentUser?.department?.trim().toLowerCase()
  const userDiv = currentUser?.division?.trim().toLowerCase()

  // Filter history transfers for incoming only
  const incomingHistoryList = useMemo(() => {
    return transferHistory.filter((item) => {
      const toDept = getField(item.toDepartment).trim().toLowerCase()
      const toDiv = getField(item.toDivision).trim().toLowerCase()
      if (userDept) return toDept === userDept
      if (userDiv) return toDiv === userDiv
      return true
    })
  }, [transferHistory, userDept, userDiv])

  // Current active list based on selected view
  const currentList = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()

    if (activeTab === 'pending') {
      if (!q) return incomingTransfers
      return incomingTransfers.filter((t) => {
        const title = t.document?.title?.toLowerCase() || ''
        const docNum = t.document?.docNumber?.toLowerCase() || ''
        const fromDept = (t.fromDepartment || '').toLowerCase()
        const sender = (t.sender?.name || '').toLowerCase()
        const note = (t.note || '').toLowerCase()
        return title.includes(q) || docNum.includes(q) || fromDept.includes(q) || sender.includes(q) || note.includes(q)
      })
    } else {
      return incomingHistoryList.filter((item) => {
        if (historyStatusFilter !== 'all' && item.status !== historyStatusFilter) return false
        if (q) {
          const title = item.document?.title?.toLowerCase() || ''
          const docNum = item.document?.docNumber?.toLowerCase() || ''
          const fromDept = getField(item.fromDepartment).toLowerCase()
          const sender = (item.sender?.name || '').toLowerCase()
          const note = (item.note || '').toLowerCase()
          if (!title.includes(q) && !docNum.includes(q) && !fromDept.includes(q) && !sender.includes(q) && !note.includes(q)) {
            return false
          }
        }
        return true
      })
    }
  }, [activeTab, incomingTransfers, incomingHistoryList, historyStatusFilter, debouncedQuery])

  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const pageItems = useMemo(
    () => currentList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [currentList, page],
  )

  // Actions
  async function handleConfirmTransferStorage(data: {
    warehouseId?: string
    cabinetId?: string
    shelfId?: string
    folderId?: string
    note?: string
  }) {
    if (!transferToApprove) return
    try {
      await approveTransfer(transferToApprove.id, data)
      pushToast({
        title: 'ຮັບເອກະສານສຳເລັດ',
        description: `ເອກະສານຖືກຮັບເຂົ້າ ${transferToApprove.toDepartment} ແລະ ຈັດເກັບຮຽບຮ້ອຍແລ້ວ`,
      })
      setTransferToApprove(null)
      void reload()
      void reloadTransfers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ເກີດຂໍ້ຜິດພາດໃນການຮັບເອກະສານ'
      pushToast({ title: 'ບໍ່ສາມາດຮັບເອກະສານໄດ້', description: msg })
    }
  }

  async function handleConfirmReject() {
    if (!transferToReject) return
    setRejecting(true)
    try {
      await rejectTransfer(transferToReject.id, rejectionReason)
      pushToast({
        title: 'ປະຕິເສດການຮັບໂອນສຳເລັດ',
        description: 'ເອກະສານຖືກສົ່ງກັບຄືນພະແນກຕົ້ນທາງແລ້ວ',
      })
      setTransferToReject(null)
      setRejectionReason('')
      void reload()
      void reloadTransfers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ເກີດຂໍ້ຜິດພາດໃນການປະຕິເສດ'
      pushToast({ title: 'ບໍ່ສາມາດປະຕິເສດໄດ້', description: msg })
    } finally {
      setRejecting(false)
    }
  }

  async function handleCancel(transferId: string) {
    if (!confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຍົກເລີກການສົ່ງຕໍ່ນີ້?')) return
    setCancellingId(transferId)
    try {
      await cancelTransfer(transferId)
      pushToast({ title: 'ຍົກເລີກສຳເລັດ' })
      void reload()
      void reloadTransfers()
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ເອກະສານຂາເຂົ້າ</h1>
            <p className="mt-1 text-sm text-gray-500">
              ຈັດການເອກະສານຂາເຂົ້າທັງໝົດ — ທັງເອກະສານລໍຖ້າຮັບ ແລະ ປະຫວັດເອກະສານຂາເຂົ້າ
            </p>
          </div>
          <button
            type="button"
            onClick={() => { void reloadTransfers(); pushToast({ title: 'ໂຫຼດຂໍ້ມູນຄືນໃໝ່ແລ້ວ' }) }}
            disabled={loadingTransfers}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingTransfers ? 'ກຳລັງໂຫຼດ...' : '🔄 ໂຫຼດຄືນໃໝ່'}
          </button>
        </div>

        {/* View Switcher: หน้ารอรับ VS หน้าประวัติ */}
        <div className="flex border-b border-gray-200 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('pending'); setCurrentPage(1) }}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'pending'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>ເອກະສານລໍຖ້າຮັບ</span>
            {incomingTransfers.length > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {incomingTransfers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('history'); setCurrentPage(1) }}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>ປະຫວັດເອກະສານຂາເຂົ້າ</span>
            {incomingHistoryList.length > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'history' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {incomingHistoryList.length}
              </span>
            )}
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
                placeholder="ຊື່ເອກະສານ, ເລກທີ, ຕົ້ນທາງ, ຜູ້ສົ່ງ..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white"
              />
            </div>
            {activeTab === 'history' && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  ສະຖານະ
                </label>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => { setHistoryStatusFilter(e.target.value as 'all' | TransferStatus); setCurrentPage(1) }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:bg-white"
                >
                  <option value="all">ທັງໝົດ</option>
                  <option value="approved">ອະນຸມັດແລ້ວ</option>
                  <option value="rejected">ປະຕິເສດ</option>
                  <option value="pending">ລໍຖ້າອະນຸມັດ</option>
                  <option value="cancelled">ຍົກເລີກແລ້ວ</option>
                </select>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            ພົບ {currentList.length} ລາຍການ {activeTab === 'pending' ? 'ລໍຖ້າຮັບ' : 'ໃນປະຫວັດ'}
          </p>
        </div>

        {/* Classic Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto min-h-[320px]">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-3.5 py-3 w-12 text-center whitespace-nowrap">ລ/ດ</th>
                  <th className="px-3.5 py-3 min-w-[200px]">ເອກະສານ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ຕົ້ນທາງ (From)</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ຜູ້ສົ່ງ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ວັນທີ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ສະຖານະ</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">ການກະທຳ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingTransfers && currentList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                      ກຳລັງໂຫຼດຂໍ້ມູນ...
                    </td>
                  </tr>
                )}
                {(!loadingTransfers || currentList.length > 0) && pageItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl">
                        {activeTab === 'pending' ? '📥' : '📋'}
                      </div>
                      <p className="text-sm font-semibold text-gray-700">
                        {activeTab === 'pending' ? 'ບໍ່ມີເອກະສານລໍຖ້າຮັບ' : 'ບໍ່ມີປະຫວັດເອກະສານຂາເຂົ້າ'}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {activeTab === 'pending'
                          ? 'ເມື່ອມີພະແນກອື່ນສົ່ງເອກະສານຫາພະແນກຂອງທ່ານ ລາຍການຈະສະແດງຢູ່ນີ້'
                          : 'ຍັງບໍ່ມີປະຫວັດການຮັບໂອນ ຫຼື ບໍ່ກົງກັບເງື່ອນໄຂຄົ້ນຫາ'}
                      </p>
                    </td>
                  </tr>
                )}
                {pageItems.map((t, idx) => {
                  const docItem = t.document
                  const fromDept = getField(t.fromDepartment) || '—'
                  const fromDiv = getField(t.fromDivision)
                  const isCross =
                    t.fromDivision &&
                    t.toDivision &&
                    t.fromDivision.trim().toLowerCase() !== t.toDivision.trim().toLowerCase()

                  const canApproveTransfer =
                    currentUser?.role === 'SuperAdmin' ||
                    (isCross ? currentUser?.role === 'DivisionAdmin' : true)

                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition align-top">
                      <td className="px-3.5 py-3 text-center font-medium text-gray-400 tabular-nums whitespace-nowrap">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            {docItem?.title || `ເອກະສານ #${t.documentId?.slice(0, 8)}`}
                          </span>
                          {docItem?.docNumber && (
                            <span className="mt-0.5 text-xs text-gray-500 font-mono">
                              {docItem.docNumber}
                            </span>
                          )}
                          {t.keepCopy && (
                            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                              📑 ຕົ້ນທາງເກັບສຳເນົາໄວ້
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-xs whitespace-nowrap">
                        <p className="font-semibold text-gray-800">🏬 {fromDept}</p>
                        {fromDiv && <p className="text-gray-400">🏢 {fromDiv}</p>}
                      </td>
                      <td className="px-3.5 py-3 text-xs text-gray-700 whitespace-nowrap">
                        {t.sender?.name || '—'}
                      </td>
                      <td className="px-3.5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {t.createdAt?.slice(0, 10) || '—'}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadgeStyles[t.status]}`}>
                          {statusLabels[t.status]}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {docItem && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(toFrontendDocument(docItem))}
                              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
                            >
                              ເບິ່ງ
                            </button>
                          )}
                          {activeTab === 'pending' && t.status === 'pending' ? (
                            canApproveTransfer ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setTransferToApprove(t)}
                                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
                                >
                                  ອະນຸມັດ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTransferToReject(t)}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
                                >
                                  ປະຕິເສດ
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                ລໍຖ້າ Admin ຝ່າຍ
                              </span>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDetailTransfer(t)}
                              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
                            >
                              ລາຍລະອຽດ
                            </button>
                          )}
                          {t.status === 'pending' && currentUser?.role === 'SuperAdmin' && (
                            <button
                              type="button"
                              onClick={() => void handleCancel(t.id)}
                              disabled={cancellingId === t.id}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 transition"
                              title="ຍົກເລີກ"
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
          {currentList.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={currentList.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="ລາຍການ"
            />
          )}
        </div>

        {/* Modal: Select Storage Location for Approval */}
        <SelectStorageLocationModal
          open={!!transferToApprove}
          docTitle={transferToApprove?.document?.title}
          department={transferToApprove?.toDepartment}
          division={transferToApprove?.toDivision}
          onClose={() => setTransferToApprove(null)}
          onConfirm={handleConfirmTransferStorage}
        />

        {/* Modal: Rejection Reason */}
        <Modal
          open={!!transferToReject}
          onClose={() => setTransferToReject(null)}
          title="❌ ປະຕິເສດການຮັບໂອນເອກະສານ"
          footer={
            <div className="flex w-full items-center justify-between">
              <button
                type="button"
                onClick={() => setTransferToReject(null)}
                disabled={rejecting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejecting}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {rejecting ? 'ກຳລັງປະຕິເສດ...' : 'ຢືນຢັນການປະຕິເສດ'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              ທ່ານຕ້ອງການປະຕິເສດການຮັບໂອນເອກະສານ{' '}
              <strong className="text-gray-900">{transferToReject?.document?.title}</strong> ແມ່ນບໍ່?
              ເອກະສານຈະຖືກສົ່ງກັບຄືນໄປຫາພະແນກຕົ້ນທາງ ({transferToReject?.fromDepartment}).
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700">
                ເຫດຜົນການປະຕິເສດ (ເລືອກໄດ້)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="ລະບຸເຫດຜົນ ເຊັ່ນ: ເອກະສານບໍ່ກ່ຽວຂ້ອງກັບພະແນກ..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </Modal>

        {/* Modal: Transfer Detail */}
        <Modal
          open={!!detailTransfer}
          onClose={() => setDetailTransfer(null)}
          title="ລາຍລະອຽດເອກະສານຂາເຂົ້າ"
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
                  <p className="mt-1 text-gray-600">
                    👤 ຜູ້ສົ່ງ: {detailTransfer.sender?.name || '—'}
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
                  <span className="text-gray-500 font-semibold">ໝາຍເຫດ:</span>
                  <p className="mt-1 text-gray-800">{detailTransfer.note}</p>
                </div>
              )}

              {detailTransfer.rejectionReason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs">
                  <span className="text-rose-600 font-semibold">ເຫດຜົນການປະຕິເສດ:</span>
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
