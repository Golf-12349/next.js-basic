'use client'

import { useCallback, useEffect, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../../context/DocumentsContext'
import { pushToast } from '@/app/components/ui/Toast'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import type { Document, DocumentTransfer } from '@/types/document'
import { getStoredUser, type CurrentUser, type UserRole } from '@/types/user'
import CategoryBadge from '@/app/components/documents/CategoryBadge'
import SelectStorageLocationModal from '@/app/components/documents/SelectStorageLocationModal'
import { approveTransfer, fetchIncomingTransfers, rejectTransfer } from '@/lib/dms/documentService'

function getSessionRole(): UserRole | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = sessionStorage.getItem('data')
    if (!stored) return null
    const parsed = (typeof stored === 'string' ? JSON.parse(stored) : stored) as { role?: UserRole }
    return parsed?.role ?? null
  } catch {
    return null
  }
}

export default function PendingDocumentsPage() {
  const { documents, updateDocument, reload } = useDocuments()
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [currentRole, setCurrentRole] = useState<UserRole | null>(getSessionRole)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(getStoredUser)

  // Tabs: 'internal' (Regular pending documents) | 'incoming' (Transfers from other departments/divisions)
  const [activeTab, setActiveTab] = useState<'internal' | 'incoming'>('incoming')
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
      setCurrentRole(getSessionRole())
      setCurrentUser(getStoredUser())
    }
    window.addEventListener('storage', syncUser)
    return () => window.removeEventListener('storage', syncUser)
  }, [])

  // Moderation for internal documents: only DivisionAdmin / SuperAdmin
  const canModerateInternal = currentRole === 'DivisionAdmin' || currentRole === 'SuperAdmin'
  const list = documents.filter((d) => d.status === 'pending' && !d.deleted)

  async function approveInternal(id: string) {
    await updateDocument(id, { status: 'approved' })
    pushToast({ title: 'ເອກະສານຖືກອະນຸມັດ' })
  }

  async function rejectInternal(id: string) {
    await updateDocument(id, { status: 'draft' })
    pushToast({ title: 'ເອກະສານຖືກປະຕິເສດ' })
  }

  // Handle transfer approval with chosen storage location
  async function handleConfirmTransferStorage(data: {
    warehouseId?: string
    cabinetId?: string
    shelfId?: string
    folderId?: string
    note?: string
  }) {
    if (!transferToApprove) return
    await approveTransfer(transferToApprove.id, data)
    pushToast({
      title: 'ຮັບເອກະສານສຳເລັດ',
      description: `ເອກະສານຖືກຮັບເຂົ້າ ${transferToApprove.toDepartment} ແລະ ຈັດເກັບຮຽບຮ້ອຍແລ້ວ`,
    })
    setTransferToApprove(null)
    void reload()
    void loadTransfers()
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
    <DashboardLayout title="ເອກະສານລໍຖ້າອະນຸມັດ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ເອກະສານລໍຖ້າອະນຸມັດ</h1>
            <p className="mt-1 text-sm text-gray-500">
              ກວດສອບ ແລະ ອະນຸມັດເອກະສານທົ່ວໄປ ລວມທັງເອກະສານທີ່ຖືກສົ່ງຂ້າມພະແນກ/ຂ້າມຝ່າຍ
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('incoming')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'incoming'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>🔄 ເອກະສານສົ່ງຂ້າມມາຫາທ່ານ</span>
              {incomingTransfers.length > 0 && (
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-bold text-white">
                  {incomingTransfers.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('internal')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'internal'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>📑 ເອກະສານລໍຖ້າອະນຸມັດທົ່ວໄປ</span>
              {list.length > 0 && (
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                  {list.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Incoming Cross-department / Cross-division Transfers */}
        {activeTab === 'incoming' && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                ລາຍການເອກະສານທີ່ຖືກສົ່ງຂ້າມມາຫາພະແນກ / ຝ່າຍຂອງທ່ານ
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                ກະລຸນາກວດສອບເອກະສານ ແລະ ກົດຮັບເອກະສານເພື່ອເລືອກບ່ອນຈັດເກັບເຂົ້າຄັງ/ຕູ້/ຊັ້ນວາງ
              </p>
            </div>

            {loadingTransfers ? (
              <div className="p-8 text-center text-sm text-gray-500">ກຳລັງໂຫຼດຂໍ້ມູນ...</div>
            ) : incomingTransfers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-2xl">
                  📥
                </div>
                <div className="mt-3 text-sm font-medium text-gray-900">ບໍ່ມີເອກະສານສົ່ງຂ້າມທີ່ລໍຖ້າອະນຸມັດ</div>
                <div className="mt-1 text-xs text-gray-500">
                  ເມື່ອມີພະແນກ ຫຼື ຝ່າຍອື່ນສົ່ງເອກະສານມາຫາທ່ານ ລາຍການຈະສະແດງຢູ່ນີ້
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">ເອກະສານ</th>
                      <th className="px-4 py-3">ຕົ້ນທາງ (ສົ່ງມາຈາກ)</th>
                      <th className="px-4 py-3">ປາຍທາງ (ສົ່ງຫາ)</th>
                      <th className="px-4 py-3">ໝາຍເຫດ</th>
                      <th className="px-4 py-3">ວັນທີສົ່ງ</th>
                      <th className="px-4 py-3 text-center">ການກະທຳ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomingTransfers.map((t) => {
                      const docItem = t.document
                      const isCross =
                        t.fromDivision &&
                        t.toDivision &&
                        t.fromDivision.trim().toLowerCase() !== t.toDivision.trim().toLowerCase()

                      // Check permission to approve this transfer:
                      // If cross-division: only DivisionAdmin of toDivision or SuperAdmin
                      // If same-division: DepartmentAdmin of toDepartment or DivisionAdmin or SuperAdmin
                      const canApproveTransfer =
                        currentUser?.role === 'SuperAdmin' ||
                        (isCross
                          ? currentUser?.role === 'DivisionAdmin'
                          : true)

                      return (
                        <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900">
                                {docItem?.title || 'ເອກະສານບໍ່ລະບຸຊື່'}
                              </span>
                              {docItem?.docNumber && (
                                <div className="mt-0.5">
                                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700">
                                    {docItem.docNumber}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <div className="font-medium text-gray-900">{t.fromDepartment || '—'}</div>
                              <div className="text-gray-500">{t.fromDivision || '—'}</div>
                              {t.sender?.name && (
                                <div className="mt-0.5 text-indigo-600">👤 {t.sender.name}</div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <div className="font-medium text-gray-900">{t.toDepartment}</div>
                              <div className="text-gray-500">{t.toDivision}</div>
                              {isCross ? (
                                <span className="mt-1 inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                                  🌐 ຂ້າມຝ່າຍ
                                </span>
                              ) : (
                                <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                  🏢 ພາຍໃນຝ່າຍ
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-xs text-gray-700 max-w-[200px] truncate">
                            {t.note || <span className="text-gray-400">—</span>}
                          </td>

                          <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                            {t.createdAt ? t.createdAt.slice(0, 10) : '—'}
                          </td>

                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              {docItem && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(docItem)}
                                  className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                >
                                  ເບິ່ງ
                                </button>
                              )}

                              {canApproveTransfer ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setTransferToApprove(t)}
                                    className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 shadow-sm"
                                  >
                                    🗄️ ຮັບເອກະສານ & ເລືອກບ່ອນເກັບ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTransferToReject(t)}
                                    className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                                  >
                                    ປະຕິເສດ
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-amber-600">
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
        )}

        {/* Tab 2: Regular Internal Pending Documents */}
        {activeTab === 'internal' && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">ເອກະສານ</th>
                    <th className="px-4 py-3">ສະຖານະ</th>
                    <th className="px-4 py-3">ວັນທີ</th>
                    <th className="px-4 py-3">ຜູ້ອັບໂຫຼດ</th>
                    <th className="px-4 py-3 text-center">ການກະທຳ</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm text-gray-500">
                        ບໍ່ມີເອກະສານລໍຖ້າອະນຸມັດ
                      </td>
                    </tr>
                  ) : (
                    list.map((d) => (
                      <tr key={d.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{d.title}</span>
                            <CategoryBadge category={d.category} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                            ລໍຖ້າອະນຸມັດ
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{d.uploadDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{d.uploadedBy}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setPreviewDoc(d)}
                              className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              ເບິ່ງ
                            </button>
                            {canModerateInternal && (
                              <>
                                <button
                                  onClick={() => approveInternal(d.id)}
                                  className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                                >
                                  ອະນຸມັດ
                                </button>
                                <button
                                  onClick={() => rejectInternal(d.id)}
                                  className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                                >
                                  ປະຕິເສດ
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Select Storage Location when accepting transfer */}
        <SelectStorageLocationModal
          open={!!transferToApprove}
          title="🗄️ ຮັບເອກະສານ ແລະ ເລືອກບ່ອນຈັດເກັບໃນຄັງ"
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
              <>
                {canModerateInternal && activeTab === 'internal' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        approveInternal(previewDoc.id)
                        setPreviewDoc(null)
                      }}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      ອະນຸມັດ
                    </button>
                    <button
                      onClick={() => {
                        rejectInternal(previewDoc.id)
                        setPreviewDoc(null)
                      }}
                      className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      ປະຕິເສດ
                    </button>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPreviewDoc(null)
                      pushToast({ title: 'ປິດການເບິ່ງ' })
                    }}
                    className="px-3 py-2 rounded bg-gray-100 text-sm"
                  >
                    ປິດ
                  </button>
                  <button
                    onClick={() => {
                      pushToast({ title: 'ດາວໂຫຼດເອກະສານ' })
                    }}
                    className="px-3 py-2 rounded bg-indigo-600 text-sm text-white"
                  >
                    ດາວໂຫຼດ
                  </button>
                </div>
              </>
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