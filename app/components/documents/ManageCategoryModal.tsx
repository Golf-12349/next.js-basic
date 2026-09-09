"use client"
import { useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { Tag, Trash2, TriangleAlert } from 'lucide-react'

interface ManageCategoryModalProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  onAdd: (name: string) => Promise<boolean>;
  onRemove: (category: string) => Promise<boolean>;
  countDocs: (category: string) => number;
}

export default function ManageCategoryModal({ open, onClose, categories, onAdd, onRemove, countDocs }: ManageCategoryModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [pendingAdd, setPendingAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)

  async function handleAdd() {
    const trimmed = newCategoryName.trim()
    if (!trimmed || pendingAdd) return
    setPendingAdd(true)
    const ok = await onAdd(trimmed)
    setPendingAdd(false)
    if (ok) setNewCategoryName('')
  }

  async function handleConfirmRemove() {
    if (!confirmDelete || pendingDelete) return
    setPendingDelete(true)
    const ok = await onRemove(confirmDelete)
    setPendingDelete(false)
    if (ok) setConfirmDelete(null)
  }

  function handleClose() {
    setConfirmDelete(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="ຈັດການໝວດໝູ່">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            placeholder="ຊື່ໝວດໝູ່ໃໝ່"
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          <button
            onClick={handleAdd}
            disabled={pendingAdd}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            <Tag size={14} />
            ເພີ່ມ
          </button>
        </div>

        {confirmDelete && (
          <div className="flex items-start gap-3 rounded-lg bg-rose-50 p-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-800">ຢືນຢັນການລຶບໝວດໝູ່ &ldquo;{confirmDelete}&rdquo;?</p>
              <p className="mt-0.5 text-xs text-rose-700/80">ເອກະສານທີ່ຍັງໃຊ້ໝວດໝູ່ນີ້ຈະສະແດງເປັນ &ldquo;ບໍ່ລະບຸ&rdquo;</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={pendingDelete}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={pendingDelete}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {pendingDelete ? 'ກຳລັງລຶບ...' : 'ຢືນຢັນລຶບ'}
              </button>
            </div>
          </div>
        )}

        {categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">ຍັງບໍ່ມີໝວດໝູ່ (ລະບົບຈະສ້າງໝວດໝູ່ເລີ່ມຕົ້ນໃຫ້ອັດຕະໂນມັດ)</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {categories.map((c) => (
              <li key={c} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-gray-800">
                  {c} <span className="text-gray-400">({countDocs(c)})</span>
                </span>
                <button
                  onClick={() => setConfirmDelete(c)}
                  title="ລຶບໝວດໝູ່"
                  className="rounded-lg p-1.5 text-gray-300 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            ປິດ
          </button>
        </div>
      </div>
    </Modal>
  );
}