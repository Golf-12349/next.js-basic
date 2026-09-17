'use client'

import { useCallback, useEffect, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../../context/DocumentsContext'
import { pushToast } from '@/app/components/ui/Toast'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import type { Document, DocumentTransfer } from '@/types/document'
import { getStoredUser, type CurrentUser } from '@/types/user'
import SelectStorageLocationModal from '@/app/components/documents/SelectStorageLocationModal'
import { approveTransfer, fetchIncomingTransfers, rejectTransfer } from '@/lib/dms/documentService'

export default function PendingDocumentsPage() {
  const { reload } = useDocuments()
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(getStoredUser)

  const [incomingTransfers, setIncomingTransfers] = useState<DocumentTransfer[]>([])
  const [loadingTransfers, setLoadingTransfers] = useState<boolean>(false)

  // Storage Location Modal for approving transfer
  const [transferToApprove, setTransferToApprove] = useState<DocumentTransfer | null>(null)

  // Rejection modal
  const [transferToReject, setTransferToReject] = useState<DocumentTransfer | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [rejecting, setRejecting] = useState<boolean>(false)

  const loadTransfers = useCallback(async () => {
    setLoadingTransfers(true)
    try {
      const data = await fetchIncomingTransfers()
      setIncomingTransfers(data)
    } catch {
      // Fallback silently if offline
    } finally {
      setLoadingTransfers(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    void loadTransfers()
  }, [reload, loadTransfers])

  useEffect(() => {
    function syncUser() {
      setCurrentUser(getStoredUser())
    }
    window.addEventListener('storage', syncUser)
    return () => window.removeEventListener('storage', syncUser)
  }, [])

  // Handle transfer approval with chosen storage location
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

  // Handle transfer rejection
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

  return (
    <DashboardLayout title="ເອກະສານສົ່ງຂ້າມມາຫາທ່ານ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🔄 ເອກະສານສົ່ງຂ້າມມາຫາທ່ານ
              {incomingTransfers.length > 0 && (
                <span className="ml-2.5 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  {incomingTransfers.length} ລາຍການ
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              ກວດສອບ ແລະ ຮັບເອກະສານທີ່ຖືກສົ່ງຂ້າມມາຫາພະແນກ / ຝ່າຍຂອງທ່ານ ພ້ອມກຳນົດບ່ອນຈັດເກັບໃນຄັງ
            </p>
          </div>
        </div>

        {/* Incoming Cross-department / Cross-division Transfers */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loadingTransfers ? (
            <div className="p-12 text-center text-sm text-gray-500">ກຳລັງໂຫຼດຂໍ້ມູນ...</div>
          ) : incomingTransfers.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-3xl">
                📥
              </div>
              <div className="mt-4 text-base font-semibold text-gray-900">ບໍ່ມີເອກະສານສົ່ງຂ້າມທີ່ລໍຖ້າການຕອບຮັບ</div>
              <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                ເມື່ອມີພະແນກ ຫຼື ຝ່າຍອື່ນສົ່ງເອກະສານມາຫາພະແນກຂອງທ່ານ ລາຍການຈະສະແດງຢູ່ນີ້ເພື່ອໃຫ້ທ່ານກວດສອບ ແລະ ຈັດເກັບເຂົ້າຄັງ
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3.5">ເອກະສານ</th>
                    <th className="px-4 py-3.5">ຕົ້ນທາງ (ສົ່ງມາຈາກ)</th>
                    <th className="px-4 py-3.5">ປາຍທາງ (ສົ່ງຫາ)</th>
                    <th className="px-4 py-3.5">ໝາຍເຫດ</th>
                    <th className="px-4 py-3.5">ວັນທີສົ່ງ</th>
                    <th className="px-4 py-3.5 text-center">ການກະທຳ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {incomingTransfers.map((t) => {
                    const docItem = t.document
                    const isCross =
                      t.fromDivision &&
                      t.toDivision &&
                      t.fromDivision.trim().toLowerCase() !== t.toDivision.trim().toLowerCase()

                    // Check permission:
                    // SuperAdmin has full permission.
                    // If cross-division: DivisionAdmin of toDivision or SuperAdmin.
                    // If same-division: DepartmentAdmin of toDepartment, DivisionAdmin, or SuperAdmin.
                    const canApproveTransfer =
                      currentUser?.role === 'SuperAdmin' ||
                      (isCross
                        ? currentUser?.role === 'DivisionAdmin'
                        : true)

                    return (
                      <tr key={t.id} className="hover:bg-gray-50/60 transition">
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">
                              {docItem?.title || 'ເອກະສານບໍ່ລະບຸຊື່'}
                            </span>
                            {docItem?.docNumber && (
                              <div className="mt-1">
                                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
                                  {docItem.docNumber}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-gray-800">
                              🏢 {t.fromDepartment || '—'}
                            </span>
                            {t.fromDivision && (
                              <span className="text-gray-500">
                                🏛️ {t.fromDivision}
                              </span>
                            )}
                            {t.sender?.name && (
                              <span className="mt-1 text-gray-400">
                                👤 {t.sender.name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-indigo-700">
                              🏢 {t.toDepartment}
                            </span>
                            {t.toDivision && (
                              <span className="text-gray-500">
                                🏛️ {t.toDivision}
                              </span>
                            )}
                            {isCross && (
                              <span className="mt-1 inline-flex w-fit rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                                ຂ້າມຝ່າຍ
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-gray-600 max-w-xs">
                          {t.note ? (
                            <span className="italic">{t.note}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                          {t.createdAt?.slice(0, 10) || '—'}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            {docItem && (
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(docItem)}
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
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition shadow-sm"
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
                                ລໍຖ້າ Admin ຝ່າຍ ອະນຸມັດ
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Select Storage Location when accepting transfer */}
        <SelectStorageLocationModal
          open={!!transferToApprove}
          title="🗄️ ຮັບເອກະສານ ແລະ ເລືອກບ່ອນຈັດເກັບ"
          docTitle={transferToApprove?.document?.title}
          docNumber={transferToApprove?.document?.docNumber}
          department={transferToApprove?.toDepartment}
          division={transferToApprove?.toDivision}
          confirmLabel="ອະນຸມັດ ແລະ ບັນທຶກບ່ອນເກັບ"
          onClose={() => setTransferToApprove(null)}
          onConfirm={handleConfirmTransferStorage}
        />

        {/* Modal: Rejection Reason Dialog */}
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

        {/* Modal: Document Preview */}
        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.title}
          scrollBody={false}
          footer={
            previewDoc && (
              <div className="ml-auto flex items-center gap-2">
                <button
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
                  <div className="font-semibold">{previewDoc.category}</div>
                </div>
              </div>
              <DocumentPreview doc={previewDoc} heightClassName="min-h-0 flex-1" />
            </div>
          )}
        </Modal>
      </main>
    </DashboardLayout>
  )
}