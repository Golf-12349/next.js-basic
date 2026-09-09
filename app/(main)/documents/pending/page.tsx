'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../../context/DocumentsContext'
import { pushToast } from '@/app/components/ui/Toast'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import type { Document } from '@/types/document'
import type { UserRole } from '@/types/user'
import CategoryBadge from '@/app/components/documents/CategoryBadge'

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

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    function syncRole() {
      setCurrentRole(getSessionRole())
    }
    window.addEventListener('storage', syncRole)
    return () => window.removeEventListener('storage', syncRole)
  }, [])

  // RBAC: only Admin / SuperAdmin may approve or reject
  const canModerate = currentRole === 'Admin' || currentRole === 'SuperAdmin'
  const list = documents.filter((d) => d.status === 'pending' && !d.deleted)

  async function approve(id: string) {
    await updateDocument(id, { status: 'approved' })
    pushToast({ title: 'ເອກະສານຖືກອະນຸມັດ' })
  }

  async function reject(id: string) {
    await updateDocument(id, { status: 'draft' })
    pushToast({ title: 'ເອກະສານຖືກປະຕິເສດ' })
  }

  return (
    <DashboardLayout title="ເອກະສານລໍຖ້າອະນຸມັດ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ເອກະສານລໍຖ້າອະນຸມັດ</h1>
        </div>

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
                {list.map((d) => (
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
                        <button onClick={() => setPreviewDoc(d)} className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                          ເບິ່ງ
                        </button>
                        {canModerate && (
                          <>
                            <button onClick={() => approve(d.id)} className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">ອະນຸມັດ</button>
                            <button onClick={() => reject(d.id)} className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">ປະຕິເສດ</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.title}
          scrollBody={false}
          footer={
            previewDoc && (
              <>
                {/* Left group: moderation actions */}
                {canModerate && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { approve(previewDoc.id); setPreviewDoc(null) }} className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                      ອະນຸມັດ
                    </button>
                    <button onClick={() => { reject(previewDoc.id); setPreviewDoc(null) }} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100">
                      ປະຕິເສດ
                    </button>
                  </div>
                )}
                {/* Right group: close / download — ml-auto keeps it right-aligned even without moderation rights */}
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => { setPreviewDoc(null); pushToast({ title: 'ປິດການເບິ່ງ' }) }} className="px-3 py-2 rounded bg-gray-100">ປິດ</button>
                  <button onClick={() => { pushToast({ title: 'ດາວໂຫຼດເອກະສານ' }) }} className="px-3 py-2 rounded bg-indigo-600 text-white">ດາວໂຫຼດ</button>
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
              {/* PDF viewer fills the remaining space and scrolls independently inside the modal body */}
              <DocumentPreview doc={previewDoc} heightClassName="min-h-0 flex-1" />
            </div>
          )}
        </Modal>
      </main>
    </DashboardLayout>
  )
}