"use client"
import { useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { Tag, Trash2 } from 'lucide-react'

interface ManageCategoryModalProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  onAdd: (name: string) => void;
  onRemove: (category: string) => void;
  countDocs: (category: string) => number;
}

export default function ManageCategoryModal({ open, onClose, categories, onAdd, onRemove, countDocs }: ManageCategoryModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('')

  function handleAdd() {
    if (!newCategoryName.trim()) return
    onAdd(newCategoryName)
    setNewCategoryName('')
  }

  return (
    <Modal open={open} onClose={onClose} title="ຈັດການໝວດໝູ່">
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
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Tag size={14} />
            ເພີ່ມ
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">ຍັງບໍ່ມີໝວດໝູ່</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {categories.map((c) => (
              <li key={c} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-gray-800">
                  {c} <span className="text-gray-400">({countDocs(c)})</span>
                </span>
                <button
                  onClick={() => onRemove(c)}
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
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            ປິດ
          </button>
        </div>
      </div>
    </Modal>
  );
}