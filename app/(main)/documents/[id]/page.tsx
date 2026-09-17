"use client"
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import type { Document, DocumentStatus } from '@/types/document'
import type { UserRole } from '@/types/user'
import { getStoredUser, type CurrentUser } from '@/types/user'
import { useDocuments } from '../../context/DocumentsContext'
import { useArchive } from '../../context/ArchiveContext'
import { pushToast } from '@/app/components/ui/Toast'
import TransferDocumentModal from '@/app/components/documents/TransferDocumentModal'
import SelectStorageLocationModal from '@/app/components/documents/SelectStorageLocationModal'
import RenewExpiryModal from '@/app/components/documents/RenewExpiryModal'

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

const statusStyles: Record<DocumentStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-gray-200 text-gray-700',
  expired: 'bg-rose-100 text-rose-700 font-semibold',
}

const statusLabels: Record<DocumentStatus, string> = {
  draft: 'ຮ່າງ',
  pending: 'ລໍຖ້າອະນຸມັດ',
  approved: 'ອະນຸມັດ',
  archived: 'ເກັບເຂົ້າຄັງ',
  expired: '🔴 ໝົດອາຍຸ',
}

export default function DocumentDetailPage() {
  const params = useParams()
  const id = params?.id
  const { documents, updateDocument, deleteDocument, reload } = useDocuments()
  const { assignDocument } = useArchive()
  const doc = documents.find((d) => d.id === id) as Document | undefined

  const [currentRole, setCurrentRole] = useState<UserRole | null>(getSessionRole)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(getStoredUser)

  // Modals for transfer, storage, and renewal
  const [transferOpen, setTransferOpen] = useState<boolean>(false)
  const [storageOpen, setStorageOpen] = useState<boolean>(false)
  const [renewOpen, setRenewOpen] = useState<boolean>(false)

  useEffect(() => {
    function syncRole() {
      setCurrentRole(getSessionRole())
      setCurrentUser(getStoredUser())
    }
    window.addEventListener('storage', syncRole)
    return () => window.removeEventListener('storage', syncRole)
  }, [])

  // RBAC: only DivisionAdmin / SuperAdmin may approve documents
  const canModerate = currentRole === 'DivisionAdmin' || currentRole === 'SuperAdmin'

  if (!doc) {
    return (
      <DashboardLayout title="ເອກະສານ">
        <main className="p-6">
          <div className="text-gray-500">ບໍ່ພົບເອກະສານ</div>
        </main>
      </DashboardLayout>
    )
  }

  function handleDelete() {
    if (!doc) return
    void deleteDocument(doc.id)
    pushToast({ title: 'ເອກະສານຖືກນໍາໄປ Trash' })
  }

  function handleApprove() {
    if (!doc) return
    void updateDocument(doc.id, { status: 'approved' })
    pushToast({ title: 'ເອກະສານຖືກອະນຸມັດ' })
  }

  const pendingTransfer = doc.transfers && doc.transfers.length > 0 && doc.transfers[0].status === 'pending'
    ? doc.transfers[0]
    : null

  const todayStr = new Date().toISOString().slice(0, 10)
  const isExpired = doc.status === 'expired' || (Boolean(doc.expiresAt) && (doc.expiresAt ?? '') <= todayStr)
  const daysUntilExpiry = doc.expiresAt
    ? Math.ceil((new Date(doc.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const isExpiringSoon = !isExpired && daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7

  return (
    <DashboardLayout title="ເອກະສານ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ລາຍລະອຽດເອກະສານ</h1>
            <p className="mt-1 text-sm text-gray-500">ຂໍ້ມູນເອກະສານທີ່ລະບົບໄດ້ບັນທຶກໄວ້</p>
          </div>

          <Link href="/documents" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            ← ກັບໄປລາຍການ
          </Link>
        </div>

        {/* Expiration Alert Banners */}
        {isExpired && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-rose-800">
                  ເອກະສານນີ້ໝົດອາຍຸແລ້ວ {doc.expiresAt ? `(ວັນທີ ${doc.expiresAt})` : ''}
                </div>
                <div className="mt-0.5 text-xs text-rose-700">
                  ເອກະສານບໍ່ສາມາດນຳໃຊ້ໃນການອ້າງອີງທາງການໄດ້ ຈົນກວ່າຈະໄດ້ຮັບການຕໍ່ອາຍຸ
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRenewOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition shrink-0"
            >
              🔄 ຕໍ່ອາຍຸເອກະສານ
            </button>
          </div>
        )}

        {isExpiringSoon && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <div className="font-semibold text-amber-800">
                  ເອກະສານນີ້ໃກ້ຈະໝົດອາຍຸ (ເຫຼືອອີກ {daysUntilExpiry} ວັນ - ຮອດວັນທີ {doc.expiresAt})
                </div>
                <div className="mt-0.5 text-xs text-amber-700">
                  ກະລຸນາດຳເນີນການຕໍ່ອາຍຸ ຫຼື ທົບທວນເອກະສານກ່ອນຮອດກຳນົດ
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRenewOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition shrink-0"
            >
              🔄 ຕໍ່ອາຍຸເອກະສານ
            </button>
          </div>
        )}

        {/* Transfer Pending Alert Banner */}
        {pendingTransfer && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
            <span className="text-xl">🔄</span>
            <div>
              <div className="font-semibold">ເອກະສານນີ້ກຳລັງຢູ່ໃນຂັ້ນຕອນການລໍຖ້າອະນຸມັດການໂອນຍ້າຍ</div>
              <div className="mt-1 text-xs text-amber-800">
                ສົ່ງຕໍ່ໄປຫາ: <strong>{pendingTransfer.toDepartment}</strong> (ຝ່າຍ <strong>{pendingTransfer.toDivision}</strong>)
                {pendingTransfer.note && ` • ໝາຍເຫດ: ${pendingTransfer.note}`}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-indigo-600">{doc.category}</div>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">{doc.title}</h2>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[doc.status]}`}>
                {statusLabels[doc.status]}
              </span>
            </div>

            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-3xl text-indigo-600">PDF</div>
              <div className="text-lg font-semibold text-gray-900">{doc.docNumber}</div>
              <div className="mt-2 text-sm text-gray-500">{doc.fileSize} • {doc.fileType.toUpperCase()}</div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">ເລກທີ</div>
                <div className="mt-2 font-semibold text-gray-900">{doc.docNumber}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">ວັນທີອັບໂຫຼດ</div>
                <div className="mt-2 font-semibold text-gray-900">{doc.uploadDate}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">ຜູ້ອັບໂຫຼດ</div>
                <div className="mt-2 font-semibold text-gray-900">{doc.uploadedBy}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">ຮູບແບບໄຟລ໌</div>
                <div className="mt-2 font-semibold text-gray-900 uppercase">{doc.fileType}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">ວັນທີໝົດອາຍຸ</div>
                <div className="mt-2 font-semibold">
                  {doc.expiresAt ? (
                    <span className={isExpired ? 'text-rose-600 font-bold' : isExpiringSoon ? 'text-amber-600 font-bold' : 'text-gray-900'}>
                      {doc.expiresAt} {isExpired ? '(ໝົດອາຍຸ)' : isExpiringSoon ? `(ເຫຼືອ ${daysUntilExpiry} ວັນ)` : ''}
                    </span>
                  ) : (
                    <span className="text-gray-400 font-normal">ບໍ່ມີກຳນົດ</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Actions card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">ການກະທຳ</h3>
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => pushToast({ title: 'ເບິ່ງເອກະສານ' })}
                  type="button"
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  ເບິ່ງໄຟລ໌
                </button>
                <button
                  onClick={() => pushToast({ title: 'ດາວໂຫຼດເອກະສານ' })}
                  type="button"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  ດາວໂຫຼດ
                </button>

                {/* Renew document button */}
                <button
                  onClick={() => setRenewOpen(true)}
                  type="button"
                  className="w-full rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                >
                  🔄 ຕໍ່ອາຍຸເອກະສານ
                </button>

                {/* Storage location picker button */}
                <button
                  onClick={() => setStorageOpen(true)}
                  type="button"
                  className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  🗄️ ເລືອກບ່ອນຈັດເກັບໃນຄັງ
                </button>

                {/* Cross-department transfer button */}
                <button
                  onClick={() => setTransferOpen(true)}
                  type="button"
                  className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  🔄 ສົ່ງເອກະສານຂ້າມພະແນກ
                </button>

                <button
                  onClick={handleDelete}
                  type="button"
                  className="w-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  ລົບເອກະສານ
                </button>

                {canModerate && doc.status === 'pending' && (
                  <button
                    onClick={handleApprove}
                    className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    ອະນຸມັດ
                  </button>
                )}
              </div>
            </div>

            {/* Additional info card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">ຂໍ້ມູນເພີ່ມເຕີມ</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">ຄຳອະທິບາຍ</dt>
                  <dd className="text-right text-gray-900">{doc.title}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">ໝວດໝູ່</dt>
                  <dd className="text-right text-gray-900">{doc.category}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">ຝ່າຍ / ຫ້ອງການ</dt>
                  <dd className="text-right font-medium text-gray-900">{doc.division || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">ພະແນກ / ສູນ</dt>
                  <dd className="text-right font-medium text-gray-900">{doc.department || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">ບ່ອນຈັດເກັບໃນຄັງ</dt>
                  <dd className="text-right text-gray-900">
                    {doc.warehouseName || doc.cabinetName || doc.shelfName || doc.folderName ? (
                      <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        {[
                          doc.warehouseName && `🏛️ ${doc.warehouseName}`,
                          doc.cabinetName && `🗄️ ${doc.cabinetName}`,
                          doc.shelfName && `🪜 ${doc.shelfName}`,
                          doc.folderName && `📁 ${doc.folderName}`,
                        ].filter(Boolean).join(' > ')}
                      </span>
                    ) : (
                      <span className="text-gray-400">ຍັງບໍ່ໄດ້ກຳນົດບ່ອນເກັບ</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">ຂະໜາດ</dt>
                  <dd className="text-right text-gray-900">{doc.fileSize}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Transfer Modal */}
        <TransferDocumentModal
          open={transferOpen}
          doc={doc}
          currentUser={currentUser}
          onClose={() => setTransferOpen(false)}
          onSuccess={() => void reload()}
        />

        {/* Storage Location Modal */}
        <SelectStorageLocationModal
          open={storageOpen}
          docTitle={doc.title}
          docNumber={doc.docNumber}
          department={doc.department}
          division={doc.division}
          initialWarehouseId={doc.warehouseId}
          initialCabinetId={doc.cabinetId}
          initialFolderId={doc.folderId}
          confirmLabel="ບັນທຶກບ່ອນຈັດເກັບ"
          onClose={() => setStorageOpen(false)}
          onConfirm={async (data) => {
            await assignDocument(doc.id, data.cabinetId || '', data.folderId || '', data.warehouseId)
            await assignDocument(doc.id, data.cabinetId || '', data.folderId || '', data.warehouseId, data.shelfId)
            pushToast({ title: 'ອັບເດດບ່ອນຈັດເກັບສຳເລັດ' })
            void reload()
          }}
        />

        {/* Renew Expiry Modal */}
        <RenewExpiryModal
          open={renewOpen}
          document={doc}
          onClose={() => setRenewOpen(false)}
          onSuccess={() => void reload()}
        />

      </main>
    </DashboardLayout>
  )
}
