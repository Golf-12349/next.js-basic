'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../../context/DocumentsContext'
import { useCurrentUser } from '../../context/CurrentUserContext'
import { pushToast } from '@/app/components/ui/Toast'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import Pagination from '@/app/components/ui/Pagination'
import type { Document, DocumentTransfer } from '@/types/document'
import SelectStorageLocationModal from '@/app/components/documents/SelectStorageLocationModal'
import { approveTransfer, cancelTransfer, fetchIncomingTransfers, rejectTransfer } from '@/lib/dms/documentService'
import { toFrontendDocument } from '@/lib/dms/types'
import { useDebounce } from '@/hooks/useDebounce'

const PAGE_SIZE = 15

export default function IncomingPendingPage() {
  const { reload } = useDocuments()
  const { user: currentUser } = useCurrentUser()

  const [incomingTransfers, setIncomingTransfers] = useState<DocumentTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [transferToApprove, setTransferToApprove] = useState<DocumentTransfer | null>(null)
  const [transferToReject, setTransferToReject] = useState<DocumentTransfer | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 250)

  const loadTransfers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchIncomingTransfers()
      setIncomingTransfers(Array.isArray(data) ? data : [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTransfers()
  }, [loadTransfers])

  // Filter transfers
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return incomingTransfers
    return incomingTransfers.filter((t) => {
      const title = t.document?.title?.toLowerCase() || ''
      const docNum = t.document?.docNumber?.toLowerCase() || ''
      const fromDept = (t.fromDepartment || '').toLowerCase()
      const fromDiv = (t.fromDivision || '').toLowerCase()
      const sender = (t.sender?.name || '').toLowerCase()
      const note = (t.note || '').toLowerCase()
      return title.includes(q) || docNum.includes(q) || fromDept.includes(q) || fromDiv.includes(q) || sender.includes(q) || note.includes(q)
    })
  }, [incomingTransfers, debouncedQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )

  // Approve
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
      void loadTransfers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ເກີດຂໍ້ຜິດພາດໃນການຮັບເອກະສານ'
      pushToast({ title: 'ບໍ່ສາມາດຮັບເອກະສານໄດ້', description: msg })
    }
  }

  // Reject
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
      void loadTransfers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ເກີດຂໍ້ຜິດພາດໃນການປະຕິເສດ'
      pushToast({ title: 'ບໍ່ສາມາດປະຕິເສດໄດ້', description: msg })
    } finally {
      setRejecting(false)
    }
  }

  // Cancel
  async function handleCancel(transferId: string) {
    if (!confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຍົກເລີກການສົ່ງຕໍ່ນີ້?')) return
    setCancellingId(transferId)
    try {
      await cancelTransfer(transferId)
      pushToast({ title: 'ຍົກເລີກສຳເລັດ' })
      void reload()
      void loadTransfers()
    } catch {
      pushToast({ title: 'ບໍ່ສາມາດຍົກເລີກໄດ້' })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <DashboardLayout title="ເອກະສານລໍຖ້າຮັບ (ຂາເຂົ້າ)">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ເອກະສານລໍຖ້າຮັບ (ຂາເຂົ້າ)</h1>
            <p className="mt-1 text-sm text-gray-500">
              ລາຍການເອກະສານທີ່ຖືກສົ່ງໂອນມາຫາພະແນກຂອງທ່ານ — ລໍຖ້າກວດສອບ ແລະ ຮັບເຂົ້າຄັງ
            </p>
          </div>
          <button
            type="button"
            onClick={() => { void loadTransfers(); pushToast({ title: 'ໂຫຼດຂໍ້ມູນຄືນໃໝ່ແລ້ວ' }) }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'ກຳລັງໂຫຼດ...' : '🔄 ໂຫຼດຄືນໃໝ່'}
          </button>
        </div>

        {/* Filter bar */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="max-w-md">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              ຄົ້ນຫາ
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setCurrentPage(1) }}
              placeholder="ຊື່ເອກະສານ, ເລກທີ, ຕົ້ນທາງ, ຜູ້ສົ່ງ, ໝາຍເຫດ..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            ພົບ {filtered.length} ລາຍການລໍຖ້າຮັບ
          </p>
        </div>

        {/* Classic Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto min-h-[320px]">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-3.5 py-3 w-12 text-center whitespace-nowrap">ລ/ດ</th>
                  <th className="px-3.5 py-3 min-w-[220px]">ເອກະສານ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ຕົ້ນທາງ (ສົ່ງມາຈາກ)</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ປາຍທາງ (ສົ່ງຫາ)</th>
                  <th className="px-3.5 py-3">ໝາຍເຫດ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ວັນທີສົ່ງ</th>
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
                        📥
                      </div>
                      <p className="text-sm font-semibold text-gray-700">ບໍ່ມີເອກະສານລໍຖ້າຮັບ</p>
                      <p className="mt-1 text-xs text-gray-400">
                        ເມື່ອມີພະແນກອື່ນສົ່ງເອກະສານມາຫາພະແນກຂອງທ່ານ ລາຍການຈະສະແດງຢູ່ນີ້
                      </p>
                    </td>
                  </tr>
                )}
                {!loading && pageItems.map((t, idx) => {
                  const docItem = t.document
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
                            {docItem?.title || 'ເອກະສານບໍ່ລະບຸຊື່'}
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
                        <p className="font-semibold text-gray-800">🏬 {t.fromDepartment || '—'}</p>
                        {t.fromDivision && <p className="text-gray-400">🏢 {t.fromDivision}</p>}
                        {t.sender?.name && <p className="mt-0.5 text-gray-500">👤 {t.sender.name}</p>}
                      </td>
                      <td className="px-3.5 py-3 text-xs whitespace-nowrap">
                        <p className="font-semibold text-indigo-700">🏬 {t.toDepartment}</p>
                        {t.toDivision && <p className="text-indigo-400">🏢 {t.toDivision}</p>}
                        {isCross && (
                          <span className="mt-1 inline-flex rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                            ຂ້າມຝ່າຍ
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-xs text-gray-600 max-w-xs">
                        {t.note ? <span className="italic">{t.note}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3.5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {t.createdAt?.slice(0, 10) || '—'}
                      </td>
                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {docItem && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(toFrontendDocument(docItem))}
                              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
                            >
                              ເບິ່ງ
                            </button>
                          )}
                          {canApproveTransfer ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setTransferToApprove(t)}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
                              >
                                ອະນຸມັດ
                              </button>
                              <button
                                type="button"
                                onClick={() => setTransferToReject(t)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
                              >
                                ປະຕິເສດ
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              ລໍຖ້າ Admin ຝ່າຍ
                            </span>
                          )}
                          {currentUser?.role === 'SuperAdmin' && (
                            <button
                              type="button"
                              onClick={() => void handleCancel(t.id)}
                              disabled={cancellingId === t.id}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition"
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
