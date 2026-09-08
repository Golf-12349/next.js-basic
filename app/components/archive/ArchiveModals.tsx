"use client"
import { useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import { Download, Plus } from 'lucide-react'
import type { Document } from '@/types/document'

// ── Shared types ─────────────────────────────────────────────
export type DeleteTarget = {
  type: 'cabinet' | 'folder' | 'document';
  id: string;
  name: string;
};

// ── Options ──────────────────────────────────────────────────
export const colorOptions = [
  { label: 'ສີຂຽວ', value: 'from-emerald-500 to-teal-600' },
  { label: 'ສີຟ້າ', value: 'from-indigo-500 to-blue-600' },
  { label: 'ສີສົ້ມ', value: 'from-amber-500 to-orange-600' },
  { label: 'ສີບົວ', value: 'from-pink-500 to-rose-600' },
  { label: 'ສີມ່ວງ', value: 'from-purple-500 to-violet-600' },
  { label: 'ສີຟ້າທະເລ', value: 'from-cyan-500 to-sky-600' },
];

export const departmentOptions = [
  'ພະແນກບໍລິຫານ & ຈັດຕັ້ງ',
  'ພະແນກການເງິນ & ບັນຊີ',
  'ພະແນກໄອທີ & ເຕັກໂນໂລຊີ',
  'ພະແນກການຕະຫຼາດ & ຂາຍ',
  'ພະແນກແຜນການ & ໂຄງການ',
];

// ── Page Header ──────────────────────────────────────────────
interface PageHeaderProps {
  showCreateButton?: boolean;
  onCreate?: () => void;
}

export function PageHeader({ showCreateButton, onCreate }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ຄັງເກັບເອກກະສານ</h1>
        <p className="mt-1 text-sm text-gray-500">
          ຈັດລະບຽບເອກະສານແບບ 3 ລະດັບ: ຕູ້ເອກະສານ ➡️ ແຟ້ມ ➡️ ເອກະສານ
        </p>
      </div>

      {showCreateButton && (
        <button
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={16} />
          + ສ້າງຕູ້ເອກະສານໄໝ່
        </button>
      )}
    </div>
  );
}

// ── Create Cabinet Modal ─────────────────────────────────────
interface CreateCabinetModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; color: string; department: string; description: string }) => void;
}

export function CreateCabinetModal({ open, onClose, onCreate }: CreateCabinetModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(colorOptions[0].value);
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');

  function handleSubmit() {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      color,
      department: department || '—',
      description: description.trim() || 'ບໍ່ມີລາຍລະອຽດ',
    });
    setName('');
    setDescription('');
    setDepartment('');
    setColor(colorOptions[0].value);
  }

  return (
    <Modal open={open} onClose={onClose} title="ສ້າງຕູ້ເອກະສານໃໝ່">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            ຊື່ຕູ້ເອກະສານ <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ເຊັ່ນ: ການເງິນ, ສັນຍາ..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ພະແນກ</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            <option value="">— ເລືອກພະແນກ —</option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ສີຕູ້ເອກະສານ</label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {colorOptions.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`h-12 rounded-xl bg-gradient-to-br ${c.value} transition ${
                  color === c.value
                    ? 'ring-2 ring-gray-900 ring-offset-2'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title={c.label}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">ເລືອກສີທີ່ທ່ານຕ້ອງການ</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ລາຍລະອຽດ</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="ອະທິບາຍເອກະສານທີ່ຈະເກັບໃນຕູ້ນີ້..."
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            ຍົກເລີກ
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            ສ້າງຕູ້ເອກະສານ
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Create Folder Modal ──────────────────────────────────────
interface CreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  cabinetName?: string;
  onCreate: (data: { name: string; description: string }) => void;
}

export function CreateFolderModal({ open, onClose, cabinetName, onCreate }: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleSubmit() {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim() || 'ບໍ່ມີລາຍລະອຽດ',
    });
    setName('');
    setDescription('');
  }

  return (
    <Modal open={open} onClose={onClose} title={`ສ້າງແຟ້ມໄໝ່ໃນ 🗄️ ${cabinetName ?? ''}`}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            ຊື່ແຟ້ມ <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ເຊັ່ນ: ໄບສັ່ງຊື້, ໄບຮັບເງິນ..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ລາຍລະອຽດ</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="ອະທິບາຍເອກະສານທີ່ຈະເກັບໃນແຟ້ມນີ້..."
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            ຍົກເລີກ
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            ສ້າງແຟ້ມ
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Confirm Delete Modal ─────────────────────────────────────
interface ConfirmDeleteModalProps {
  target: DeleteTarget | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({ target, onClose, onConfirm }: ConfirmDeleteModalProps) {
  return (
    <Modal open={!!target} onClose={onClose} title="ຢືນຢັນການລົບ">
      {target && (
        <div>
          <p className="mb-4 text-sm text-gray-600">
            ທ່ານຕ້ອງການລົບ{' '}
            <span className="font-semibold text-gray-900">
              {target.type === 'cabinet'
                ? `ຕູ້ "${target.name}"`
                : target.type === 'folder'
                  ? `ແຟ້ມ "${target.name}"`
                  : `ເອກະສານ "${target.name}"`}
            </span>{' '}
            ແທ້ບໍ?
            {target.type === 'cabinet' && ' ເອກະສານທັງໝົດໃນຕູ້ຈະຖືກຍ້າຍອອກຈາກການຈັດລະບຽບ.'}
            {target.type === 'document' && ' ເອກະສານຈະເຂົ້າໄປຢູ່ Trash.'}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              ຍົກເລີກ
            </button>
            <button
              onClick={onConfirm}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
            >
              ຢືນຢັນລົບ
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Document Preview Modal ───────────────────────────────────
interface DocumentPreviewModalProps {
  doc: Document | null;
  onClose: () => void;
  onDownload: (doc: Document) => void;
}

export function DocumentPreviewModal({ doc, onClose, onDownload }: DocumentPreviewModalProps) {
  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      title={doc?.title}
      scrollBody={false}
      footer={
        doc && (
          /* Right group: close / download — ml-auto keeps it pinned right */
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              ປິດ
            </button>
            <button
              onClick={() => onDownload(doc)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Download size={14} />
              ດາວໂຫຼດ
            </button>
          </div>
        )
      }
    >
      {doc && (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <div className="text-xs text-gray-500">ເລກທີ</div>
              <div className="text-sm font-semibold">{doc.docNumber}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">ໝວດໝູ່</div>
              <div className="text-sm font-semibold">{doc.category}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">ທີ່ຕັ້ງ</div>
              <div className="text-sm font-semibold">
                🗄️ {doc.cabinetName ?? '—'} {'>'} 📁 {doc.folderName ?? '—'}
              </div>
            </div>
          </div>
          {/* PDF/image viewer fills the remaining space and scrolls independently inside the modal body */}
          <DocumentPreview doc={doc} heightClassName="min-h-0 flex-1" />
        </div>
      )}
    </Modal>
  );
}