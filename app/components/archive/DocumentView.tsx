"use client"
import Link from 'next/link'
import { useState, useMemo } from 'react'
import {
  ChevronRight,
  Download,
  Eye,
  FileText,
  Folder as FolderIcon,
  FolderInput,
  Home,
  Plus,
  Trash2,
  ExternalLink,
  Filter,
} from 'lucide-react'
import type { Cabinet, Document, Folder, Warehouse } from '@/types/document'
import type { ViewState } from './useArchive'
import Modal from '@/app/components/ui/Modal'
import { pushToast } from '@/app/components/ui/Toast'

// ── Breadcrumbs ──────────────────────────────────────────────
interface BreadcrumbsProps {
  view: ViewState;
  activeWarehouse?: Warehouse;
  activeCabinet?: Cabinet;
  activeFolder?: Folder;
  onNavigate: (view: ViewState) => void;
}

function Breadcrumbs({ view, activeWarehouse, activeCabinet, activeFolder, onNavigate }: BreadcrumbsProps) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm">
      <button
        onClick={() => onNavigate({ level: 'warehouses' })}
        className={`inline-flex items-center gap-1 font-medium transition ${
          view.level === 'warehouses'
            ? 'text-indigo-700 font-bold'
            : 'text-gray-500 hover:text-indigo-700'
        }`}
      >
        <Home size={14} />
        ຄັງເອກະສານທັງໝົດ
      </button>

      {view.level === 'cabinets' && !activeWarehouse && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="font-semibold text-indigo-700">🗄️ ຕູ້ເອກະສານທັງໝົດ</span>
        </>
      )}

      {activeWarehouse && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <button
            onClick={() => onNavigate({ level: 'cabinets', warehouseId: activeWarehouse.id })}
            className={`inline-flex items-center gap-1 font-medium transition ${
              view.level === 'cabinets'
                ? 'text-indigo-700 font-bold'
                : 'text-gray-500 hover:text-indigo-700'
            }`}
          >
            🏛️ {activeWarehouse.name}
          </button>
        </>
      )}

      {view.level === 'folders' && !activeCabinet && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="font-semibold text-indigo-700">📁 ຊັ້ນວາງເອກະສານທັງໝົດ</span>
        </>
      )}

      {activeCabinet && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <button
            onClick={() => onNavigate({ level: 'folders', warehouseId: activeWarehouse?.id, cabinetId: activeCabinet.id })}
            className={`inline-flex items-center gap-1 font-medium transition ${
              view.level === 'folders'
                ? 'text-indigo-700 font-bold'
                : 'text-gray-500 hover:text-indigo-700'
            }`}
          >
            🗄️ {activeCabinet.name}
          </button>
        </>
      )}

      {view.level === 'documents' && !activeFolder && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="font-semibold text-indigo-700">📑 ແຟ້ມເອກະສານທັງໝົດ</span>
        </>
      )}

      {activeFolder && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="font-bold text-gray-800">📁 {activeFolder.name}</span>
        </>
      )}
    </nav>
  );
}

// ── Back Button ──────────────────────────────────────────────
interface BackButtonProps {
  onClick: () => void;
}

function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
    >
      <ChevronRight size={14} className="rotate-180" />
      ກັບຄືນ
    </button>
  );
}

// ── Helper ───────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Document List ────────────────────────────────────────────
interface DocumentListProps {
  documents: Document[];
  folders?: Folder[];
  cabinets?: Cabinet[];
  warehouses?: Warehouse[];
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onMoveShelf?: (doc: Document) => void;
  emptyMessage?: string;
  emptySubMessage?: string;
}

function DocumentList({
  documents = [],
  folders = [],
  cabinets = [],
  warehouses = [],
  onPreview,
  onDownload,
  onDelete,
  onMoveShelf,
  emptyMessage = 'ຍັງບໍ່ມີເອກະສານໃນຊັ້ນວາງນີ້',
  emptySubMessage = 'ສາມາດອັບໂຫຼດເອກະສານເຂົ້າມາກ່ອນໄດ້',
}: DocumentListProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
          📄
        </div>
        <p className="text-gray-500 text-sm font-medium">{emptyMessage}</p>
        <p className="mt-1 text-xs text-gray-400">{emptySubMessage}</p>
        <Link
          href="/documents/upload"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={14} /> ອັບໂຫຼດເອກະສານ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const matchedFolder = folders.find((f) => f.id === doc.folderId || f.name === doc.folderId);
        const folderName = doc.folderName || matchedFolder?.name;
        const matchedCabinet = cabinets.find(
          (c) => c.id === doc.cabinetId || (matchedFolder && c.id === matchedFolder.cabinetId)
        );
        const cabinetName = doc.cabinetName || matchedCabinet?.name;
        const matchedWarehouse = warehouses.find(
          (w) => w.id === doc.warehouseId || (matchedCabinet && w.id === matchedCabinet.warehouseId)
        );
        const warehouseName = doc.warehouseName || matchedWarehouse?.name;

        return (
          <div
            key={doc.id}
            className="flex flex-col gap-3.5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md lg:flex-row lg:items-center"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileText size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {doc.docNumber}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 uppercase">
                  {doc.fileType}
                </span>
              </div>

              {/* Hierarchy Badges: Warehouse > Cabinet > Shelf */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                {folderName ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                    📁 ຊັ້ນວາງ: {folderName}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600 border border-rose-200">
                    ⚠️ ຍັງບໍ່ມີຊັ້ນວາງ
                  </span>
                )}
                {cabinetName && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-200">
                    🗄️ ຕູ້: {cabinetName}
                  </span>
                )}
                {warehouseName && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200">
                    🏛️ ຄັງ: {warehouseName}
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>📅 {formatDate(doc.uploadDate)}</span>
                <span>📦 {doc.fileSize}</span>
                <span>👤 ໂດຍ: {doc.uploadedBy}</span>
                {doc.category && <span>🏷️ {doc.category}</span>}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => onPreview(doc)}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                title="ເບິ່ງເອກະສານ"
              >
                <Eye size={13} />
                ເບິ່ງ
              </button>
              <button
                onClick={() => onDownload(doc)}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                title="ດາວໂຫຼດ"
              >
                <Download size={13} />
                ດາວໂຫຼດ
              </button>
              {onMoveShelf && (
                <button
                  onClick={() => onMoveShelf(doc)}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                  title="ຍ້າຍ/ຈັດຊັ້ນວາງ"
                >
                  <FolderInput size={13} />
                  ຍ້າຍຊັ້ນວາງ
                </button>
              )}
              <button
                onClick={() => onDelete(doc)}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                title="ລຶບເອກະສານ"
              >
                <Trash2 size={13} />
                ລົບ
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Move to Shelf Modal ───────────────────────────────────────
interface MoveToShelfModalProps {
  open: boolean;
  doc: Document | null;
  warehouses?: Warehouse[];
  cabinets?: Cabinet[];
  folders?: Folder[];
  onClose: () => void;
  onConfirm: (docId: string, cabinetId: string, folderId: string, warehouseId?: string) => Promise<void> | void;
}

function MoveToShelfModal({
  open,
  doc,
  warehouses = [],
  cabinets = [],
  folders = [],
  onClose,
  onConfirm,
}: MoveToShelfModalProps) {
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Pre-fill selection when document changes
  useState(() => {
    if (doc) {
      setSelectedCabinetId(doc.cabinetId || (cabinets[0]?.id ?? ''));
      setSelectedFolderId(doc.folderId || '');
    }
  });

  const availableFolders = useMemo(() => {
    if (!selectedCabinetId) return [];
    return folders.filter((f) => f.cabinetId === selectedCabinetId);
  }, [folders, selectedCabinetId]);

  if (!open || !doc) return null;

  async function handleSave() {
    if (!doc || !selectedCabinetId || !selectedFolderId) {
      pushToast({ title: 'ກະລຸນາເລືອກຕູ້ ແລະ ຊັ້ນວາງເອກະສານ' });
      return;
    }
    setLoading(true);
    try {
      const cab = cabinets.find((c) => c.id === selectedCabinetId);
      const whId = cab?.warehouseId || undefined;
      await onConfirm(doc.id, selectedCabinetId, selectedFolderId, whId);
      pushToast({ title: `ຍ້າຍເອກະສານເຂົ້າຊັ້ນວາງສຳເລັດ` });
      onClose();
    } catch {
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການຍ້າຍຊັ້ນວາງ' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="ຍ້າຍ / ຈັດເອກະສານເຂົ້າຊັ້ນວາງ">
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <p className="text-xs text-gray-500">ເອກະສານ:</p>
          <p className="font-semibold text-gray-900 text-sm">{doc.title}</p>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{doc.docNumber}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            🗄️ ເລືອກຕູ້ເອກະສານ
          </label>
          <select
            value={selectedCabinetId}
            onChange={(e) => {
              setSelectedCabinetId(e.target.value);
              setSelectedFolderId('');
            }}
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">-- ເລືອກຕູ້ເອກະສານ --</option>
            {cabinets.map((cab) => (
              <option key={cab.id} value={cab.id}>
                {cab.name} ({cab.department})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            📁 ເລືອກຊັ້ນວາງເອກະສານ
          </label>
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            disabled={!selectedCabinetId}
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-gray-100"
          >
            <option value="">
              {!selectedCabinetId ? '-- ກະລຸນາເລືອກຕູ້ກ່ອນ --' : '-- ເລືອກຊັ້ນວາງ --'}
            </option>
            {availableFolders.map((fol) => (
              <option key={fol.id} value={fol.id}>
                📁 {fol.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !selectedFolderId}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກການຍ້າຍ'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Document View ────────────────────────────────────────────
interface DocumentViewProps {
  cabinet?: Cabinet;
  folder?: Folder;
  warehouses?: Warehouse[];
  cabinets?: Cabinet[];
  folders?: Folder[];
  documents: Document[];
  onSelectFolder?: (folderId: string) => void;
  onAssignDocument?: (docId: string, cabinetId: string, folderId: string, warehouseId?: string) => Promise<void> | void;
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export default function DocumentView({
  cabinet,
  folder,
  warehouses = [],
  cabinets = [],
  folders = [],
  documents = [],
  onSelectFolder,
  onAssignDocument,
  onPreview,
  onDownload,
  onDelete,
}: DocumentViewProps) {
  const [filterCabinetId, setFilterCabinetId] = useState<string>('all');
  const [filterFolderId, setFilterFolderId] = useState<string>('all');
  const [moveDoc, setMoveDoc] = useState<Document | null>(null);

  // Grouping documents by shelf for All Documents View
  const shelvesWithDocs = useMemo(() => {
    let relevantFolders = folders;
    if (filterCabinetId !== 'all') {
      relevantFolders = relevantFolders.filter((f) => f.cabinetId === filterCabinetId);
    }
    if (filterFolderId !== 'all') {
      relevantFolders = relevantFolders.filter((f) => f.id === filterFolderId);
    }

    return relevantFolders.map((f) => {
      const docs = documents.filter(
        (d) =>
          !d.deleted &&
          (d.folderId === f.id || (Boolean(f.name) && Boolean(d.folderName) && d.folderName === f.name))
      );
      const cab = cabinets.find((c) => c.id === f.cabinetId);
      return {
        folder: f,
        cabinet: cab,
        docs,
      };
    });
  }, [folders, cabinets, documents, filterCabinetId, filterFolderId]);

  // Documents unassigned to any shelf
  const unassignedDocs = useMemo(() => {
    return documents.filter(
      (d) =>
        !d.deleted &&
        !folders.some(
          (f) => d.folderId === f.id || (Boolean(f.name) && Boolean(d.folderName) && d.folderName === f.name)
        )
    );
  }, [documents, folders]);

  // 1. SPECIFIC SHELF VIEW (When user clicks into a shelf)
  if (folder) {
    return (
      <>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl shadow-sm">
              📁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{folder.name}</h2>
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                  ຊັ້ນວາງເອກະສານ
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                ຢູ່ໃນ 🗄️ {cabinet?.name || 'ຕູ້ເອກະສານ'} · ມີທັງໝົດ{' '}
                <span className="font-semibold text-indigo-700">{documents.length}</span> ເອກະສານໃນຊັ້ນວາງນີ້
              </p>
            </div>
          </div>

          <Link
            href="/documents/upload"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={14} /> ອັບໂຫຼດເອກະສານເຂົ້າຊັ້ນວາງນີ້
          </Link>
        </div>

        <DocumentList
          documents={documents}
          folders={folders}
          cabinets={cabinets}
          warehouses={warehouses}
          onPreview={onPreview}
          onDownload={onDownload}
          onDelete={onDelete}
          onMoveShelf={(doc) => setMoveDoc(doc)}
          emptyMessage={`ຍັງບໍ່ມີເອກະສານໃນຊັ້ນວາງ "${folder.name}"`}
          emptySubMessage="ເອກະສານຂອງຊັ້ນວາງນີ້ຈະສະແດງສະເພາະຢູ່ທີ່ນີ້ເທົ່ານັ້ນ"
        />

        <MoveToShelfModal
          open={Boolean(moveDoc)}
          doc={moveDoc}
          warehouses={warehouses}
          cabinets={cabinets}
          folders={folders}
          onClose={() => setMoveDoc(null)}
          onConfirm={async (docId, cabId, folId, whId) => {
            await onAssignDocument?.(docId, cabId, folId, whId);
            setMoveDoc(null);
          }}
        />
      </>
    );
  }

  // 2. ALL DOCUMENTS / SHELF-SCOPED BROWSING VIEW
  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-2xl shadow-sm">
            📑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">ແຟ້ມເອກະສານທັງໝົດ</h2>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                ຈັດຕາມຊັ້ນວາງ
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              ລວມເອກະສານທັງໝົດ {documents.length} ສະບັບ · ແຍກຕາມຊັ້ນວາງໃຜຊັ້ນວາງມັນ
            </p>
          </div>
        </div>

        <Link
          href="/documents/upload"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={14} /> ອັບໂຫຼດເອກະສານ
        </Link>
      </div>

      {/* Shelf Filter Bar */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Filter size={14} />
            ກັ່ນຕອງຕາມຊັ້ນວາງ:
          </div>

          <select
            value={filterCabinetId}
            onChange={(e) => {
              setFilterCabinetId(e.target.value);
              setFilterFolderId('all');
            }}
            className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">🗄️ ທຸກຕູ້ເອກະສານ ({cabinets.length})</option>
            {cabinets.map((c) => (
              <option key={c.id} value={c.id}>
                🗄️ {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterFolderId}
            onChange={(e) => setFilterFolderId(e.target.value)}
            className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">📁 ທຸກຊັ້ນວາງ ({folders.length})</option>
            {(filterCabinetId === 'all'
              ? folders
              : folders.filter((f) => f.cabinetId === filterCabinetId)
            ).map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>

          {(filterCabinetId !== 'all' || filterFolderId !== 'all') && (
            <button
              onClick={() => {
                setFilterCabinetId('all');
                setFilterFolderId('all');
              }}
              className="rounded-lg text-xs font-medium text-rose-600 hover:underline"
            >
              ລ້າງຕົວກັ່ນຕອງ
            </button>
          )}
        </div>
      </div>

      {/* Grouped by Shelf display */}
      <div className="space-y-6">
        {shelvesWithDocs.map(({ folder: f, cabinet: cab, docs }) => (
          <div
            key={f.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3 transition hover:border-gray-300"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-bold">
                  📁
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm">{f.name}</h3>
                    {cab && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        🗄️ {cab.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {docs.length} ເອກະສານໃນຊັ້ນວາງນີ້ {f.description ? `· ${f.description}` : ''}
                  </p>
                </div>
              </div>

              {onSelectFolder && (
                <button
                  onClick={() => onSelectFolder(f.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  ເປີດຊັ້ນວາງນີ້ສະເພາະ
                  <ChevronRight size={14} />
                </button>
              )}
            </div>

            <DocumentList
              documents={docs}
              folders={folders}
              cabinets={cabinets}
              warehouses={warehouses}
              onPreview={onPreview}
              onDownload={onDownload}
              onDelete={onDelete}
              onMoveShelf={(doc) => setMoveDoc(doc)}
              emptyMessage={`ຊັ້ນວາງ "${f.name}" ຍັງບໍ່ມີເອກະສານ`}
              emptySubMessage="ເມື່ອອັບໂຫຼດເອກະສານໃສ່ຊັ້ນວາງນີ້ ຈະສະແດງຢູ່ນີ້"
            />
          </div>
        ))}

        {/* Unassigned Documents Section */}
        {unassignedDocs.length > 0 && filterFolderId === 'all' && (
          <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/30 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-bold text-amber-900 text-sm">
                    ເອກະສານທີ່ຍັງບໍ່ທັນຈັດເຂົ້າຊັ້ນວາງ
                  </h3>
                  <p className="text-xs text-amber-700">
                    ມີ {unassignedDocs.length} ເອກະສານທີ່ຍັງບໍ່ໄດ້ກຳນົດຊັ້ນວາງ (ສາມາດກົດ &quot;ຍ້າຍຊັ້ນວາງ&quot; ເພື່ອຈັດເກັບ)
                  </p>
                </div>
              </div>
            </div>

            <DocumentList
              documents={unassignedDocs}
              folders={folders}
              cabinets={cabinets}
              warehouses={warehouses}
              onPreview={onPreview}
              onDownload={onDownload}
              onDelete={onDelete}
              onMoveShelf={(doc) => setMoveDoc(doc)}
            />
          </div>
        )}
      </div>

      <MoveToShelfModal
        open={Boolean(moveDoc)}
        doc={moveDoc}
        warehouses={warehouses}
        cabinets={cabinets}
        folders={folders}
        onClose={() => setMoveDoc(null)}
        onConfirm={async (docId, cabId, folId, whId) => {
          await onAssignDocument?.(docId, cabId, folId, whId);
          setMoveDoc(null);
        }}
      />
    </>
  );
}

export { Breadcrumbs, BackButton };