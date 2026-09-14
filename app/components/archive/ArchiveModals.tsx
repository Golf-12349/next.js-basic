"use client"
import { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import DocumentPreview from '@/app/components/ui/DocumentPreview'
import { Download, Plus } from 'lucide-react'
import type { Document } from '@/types/document'
import { edlStructure } from '@/types/user'

// ── Shared types ─────────────────────────────────────────────
export type DeleteTarget = {
  type: 'warehouse' | 'cabinet' | 'folder' | 'document';
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
  createButtonLabel?: string;
  onCreate?: () => void;
}

export function PageHeader({ showCreateButton, createButtonLabel = '+ ສ້າງຕູ້ເອກະສານໃໝ່', onCreate }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ຄັງເກັບເອກກະສານ</h1>
        <p className="mt-1 text-sm text-gray-500">
          ຈັດລະບຽບເອກະສານແບບ 4 ລະດັບ: ຄັງເອກະສານ ➡️ ຕູ້ເອກະສານ ➡️ ຊັ້ນວາງເອກະສານ ➡️ ເອກະສານ
        </p>
      </div>

      {showCreateButton && (
        <button
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={16} />
          {createButtonLabel}
        </button>
      )}
    </div>
  );
}

// ── Create Warehouse Modal ───────────────────────────────────
interface CreateWarehouseModalProps {
  open: boolean;
  onClose: () => void;
  userDivision?: string;
  isSuperAdmin?: boolean;
  onCreate: (data: { name: string; division?: string; description?: string; color?: string }) => void;
}

export function CreateWarehouseModal({ open, onClose, userDivision, isSuperAdmin, onCreate }: CreateWarehouseModalProps) {
  const [name, setName] = useState('');
  const [division, setDivision] = useState(isSuperAdmin ? '' : (userDivision || ''));
  const [color, setColor] = useState('from-indigo-600 to-purple-600');
  const [description, setDescription] = useState('');

  const divisionList = Object.keys(edlStructure);

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setDivision(isSuperAdmin ? '' : (userDivision || ''));
      setColor('from-indigo-600 to-purple-600');
    }
  }, [open, isSuperAdmin, userDivision]);

  function handleSubmit() {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      division: division || (!isSuperAdmin ? userDivision : undefined),
      description: description.trim() || 'ບໍ່ມີລາຍລະອຽດ',
      color,
    });
    setName('');
    setDescription('');
    setDivision(isSuperAdmin ? '' : (userDivision || ''));
    setColor('from-indigo-600 to-purple-600');
  }

  return (
    <Modal open={open} onClose={onClose} title="ສ້າງຄັງເອກະສານໃໝ່">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            ຊື່ຄັງເອກະສານ <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ເຊັ່ນ: ຄັງເອກະສານສູນກາງ, ຄັງຝ່າຍເຕັກໂນໂລຊີ..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ຝ່າຍ / ຫ້ອງການ</label>
          <select
            value={division}
            disabled={!isSuperAdmin && !!userDivision}
            onChange={(e) => setDivision(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-60"
          >
            <option value="">— ສູນກາງ (ໃຊ້ຮ່ວມກັນທັງໝົດ) —</option>
            {divisionList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ສີຄັງເອກະສານ</label>
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
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ລາຍລະອຽດ</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="ອະທິບາຍຄັງເອກະສານ..."
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
            ສ້າງຄັງເອກະສານ
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Create Cabinet Modal ─────────────────────────────────────
interface CreateCabinetModalProps {
  open: boolean;
  onClose: () => void;
  warehouses?: { id: string; name: string; division?: string | null }[];
  defaultWarehouseId?: string;
  userDivision?: string;
  isSuperAdmin?: boolean;
  onCreate: (data: { name: string; color: string; department: string; description: string; warehouseId?: string | null; division?: string | null }) => void;
}

export function CreateCabinetModal({ open, onClose, warehouses = [], defaultWarehouseId, userDivision, isSuperAdmin, onCreate }: CreateCabinetModalProps) {
  const [name, setName] = useState('');
  const [warehouseId, setWarehouseId] = useState(defaultWarehouseId || '');
  const [color, setColor] = useState(colorOptions[0].value);
  const [division, setDivision] = useState(isSuperAdmin ? '' : (userDivision || ''));
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setWarehouseId(defaultWarehouseId || '');
      setDivision(isSuperAdmin ? '' : (userDivision || ''));
      setDepartment('');
      setColor(colorOptions[0].value);
    }
  }, [open, defaultWarehouseId, isSuperAdmin, userDivision]);

  const selectedWh = warehouses.find((w) => w.id === (warehouseId || defaultWarehouseId));
  const activeDivision = isSuperAdmin ? division : (division || userDivision || selectedWh?.division || '');
  const availableDepts = activeDivision && edlStructure[activeDivision] ? edlStructure[activeDivision] : (isSuperAdmin ? Object.values(edlStructure).flat() : departmentOptions);

  function handleSubmit() {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      color,
      department: department || '—',
      description: description.trim() || 'ບໍ່ມີລາຍລະອຽດ',
      warehouseId: warehouseId || defaultWarehouseId || undefined,
      division: activeDivision || undefined,
    });
    setName('');
    setDescription('');
    setDepartment('');
    setColor(colorOptions[0].value);
  }

  return (
    <Modal open={open} onClose={onClose} title="ສ້າງຕູ້ເອກະສານໃໝ່">
      <div className="space-y-4">
        {warehouses.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ຄັງເອກະສານ <span className="text-red-500">*</span>
            </label>
            <select
              value={warehouseId || defaultWarehouseId || ''}
              onChange={(e) => {
                const wid = e.target.value;
                setWarehouseId(wid);
                const wh = warehouses.find((w) => w.id === wid);
                if (wh?.division && !division) setDivision(wh.division);
              }}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">— ເລືອກຄັງເອກະສານ —</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>🏛️ {w.name}</option>
              ))}
            </select>
          </div>
        )}

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

        {isSuperAdmin && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ຝ່າຍ / ຫ້ອງການ</label>
            <select
              value={division}
              onChange={(e) => {
                setDivision(e.target.value);
                setDepartment('');
              }}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">— ເລືອກຝ່າຍ (ຫຼື ສູນກາງ) —</option>
              {Object.keys(edlStructure).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ພະແນກ</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            <option value="">— ເລືອກພະແນກ —</option>
            {availableDepts.map((d) => (
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

// ── Create Folder Modal (ຊັ້ນວາງເອກະສານ) ──────────────────────────────
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
    <Modal open={open} onClose={onClose} title={`ສ້າງຊັ້ນວາງເອກະສານໃໝ່ໃນ 🗄️ ${cabinetName ?? ''}`}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            ຊື່ຊັ້ນວາງເອກະສານ <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ເຊັ່ນ: ຊັ້ນ 1 - ໄບສັ່ງຊື້, ຊັ້ນ 2 - ໄບຮັບເງິນ..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ລາຍລະອຽດ</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="ອະທິບາຍເອກະສານທີ່ຈະເກັບໃນຊັ້ນວາງນີ້..."
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
            ສ້າງຊັ້ນວາງ
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
              {target.type === 'warehouse'
                ? `ຄັງ "${target.name}"`
                : target.type === 'cabinet'
                ? `ຕູ້ "${target.name}"`
                : target.type === 'folder'
                ? `ຊັ້ນວາງ "${target.name}"`
                : `ເອກະສານ "${target.name}"`}
            </span>{' '}
            ແທ້ບໍ?
            {target.type === 'warehouse' && ' ຕູ້ ແລະ ເອກະສານທັງໝົດໃນຄັງນີ້ຈະຖືກຍ້າຍອອກຈາກການຈັດລະບຽບ.'}
            {target.type === 'cabinet' && ' ເອກະສານທັງໝົດໃນຕູ້ຈະຖືກຍ້າຍອອກຈາກການຈັດລະບຽບ.'}
            {target.type === 'folder' && ' ເອກະສານທັງໝົດໃນຊັ້ນວາງນີ້ຈະຖືກຍ້າຍອອກ.'}
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
                {doc.warehouseName ? `🏛️ ${doc.warehouseName} > ` : ''}🗄️ {doc.cabinetName ?? '—'} {'>'} 📁 {doc.folderName ?? '—'}
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