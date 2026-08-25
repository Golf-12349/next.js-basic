'use client'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDMS } from '../../_dms-context'
import Modal from '@/app/components/ui/Modal'
import { useState } from 'react'
import { pushToast } from '@/app/components/ui/Toast'

export default function TrashPage() {
  const { documents, restoreDocument, permDeleteDocument } = useDMS()
  const [confirm, setConfirm] = useState<string | null>(null)

  const trash = documents.filter((d) => d.deleted)

  async function restore(id: string) {
    await restoreDocument(id)
    pushToast({ title: 'ການກູ້ຄືນສຳເລັດ' })
  }

  async function permDelete(id: string) {
    await permDeleteDocument(id)
    pushToast({ title: 'ເອກະສານຖືກລຶບຢ່າງຖາວອນ' })
    setConfirm(null)
  }

  return (
    <DashboardLayout title="Trash">
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-2">ຖົງຂະຫນາດ (Trash)</h1>
        <p className="text-sm text-gray-500 mb-4">ຂໍ້ມູນເອກະສານທີ່ຖືກນໍາໄວ້</p>

        <div className="rounded bg-white border p-4">
          {trash.length === 0 ? (
            <div className="text-gray-500">ບໍ່ມີເອກະສານໃນ Trash</div>
          ) : (
            <div className="space-y-3">
              {trash.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-gray-500">{t.id} • {t.uploadDate}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => restore(t.id)} className="px-3 py-1 rounded bg-emerald-50 border text-emerald-700">ກູ້ຄືນ</button>
                    <button onClick={() => setConfirm(t.id)} className="px-3 py-1 rounded bg-rose-50 border text-rose-700">ລຶບຖາວອນ</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal open={!!confirm} onClose={() => setConfirm(null)} title="ຢືນຢັນການລຶບ">
          <div>
            <p className="mb-4">ທ່ານຕ້ອງການລຶບເອກະສານນີ້ຢ່າງຖາວອນແທ້ບໍ? ການນີ້ຈະບໍ່ສາມາດກູ້ຄືນໄດ້.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="px-3 py-2 rounded bg-gray-100">ຍົກເລີກ</button>
              <button onClick={() => permDelete(confirm!)} className="px-3 py-2 rounded bg-rose-600 text-white">ຢືນຢັນລຶບ</button>
            </div>
          </div>
        </Modal>
      </main>
    </DashboardLayout>
  )
}
