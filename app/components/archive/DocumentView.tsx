"use client"
import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import {
  ChevronRight,
  Download,
  Eye,
  FileText,
  FolderInput,
  Home,
  Plus,
  Trash2,
  Filter,
  ArrowRightLeft,
} from 'lucide-react'
import type { Cabinet, Document, Folder, Shelf, Warehouse } from '@/types/document'
import type { ViewState } from './useArchive'
import Modal from '@/app/components/ui/Modal'
import { pushToast } from '@/app/components/ui/Toast'
import Pagination from '@/app/components/ui/Pagination'
import { useUploadModal } from '@/app/(main)/context/UploadModalContext'
import TransferDocumentModal from '@/app/components/documents/TransferDocumentModal'
import { useCurrentUser } from '@/app/(main)/context/CurrentUserContext'
import { useDocuments } from '@/app/(main)/context/DocumentsContext'

// ── Breadcrumbs ──────────────────────────────────────────────
interface BreadcrumbsProps {
  view: ViewState;
  activeWarehouse?: Warehouse;
  activeCabinet?: Cabinet;
  activeShelf?: Shelf;
  activeFolder?: Folder;
  onNavigate: (view: ViewState) => void;
}

export function Breadcrumbs({
  view,
  activeWarehouse,
  activeCabinet,
  activeShelf,
  activeFolder,
  onNavigate,
}: BreadcrumbsProps) {
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

      {view.level === 'shelves' && !activeCabinet && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="font-semibold text-indigo-700">🪜 ຊັ້ນວາງເອກະສານທັງໝົດ</span>
        </>
      )}

      {activeCabinet && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <button
            onClick={() =>
              onNavigate({
                level: 'shelves',
                warehouseId: activeWarehouse?.id,
                cabinetId: activeCabinet.id,
              })
            }
            className={`inline-flex items-center gap-1 font-medium transition ${
              view.level === 'shelves'
                ? 'text-indigo-700 font-bold'
                : 'text-gray-500 hover:text-indigo-700'
            }`}
          >
            🗄️ {activeCabinet.name}
          </button>
        </>
      )}

      {view.level === 'folders' && !activeShelf && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="font-semibold text-indigo-700">📁 ແຟ້ມເກັບເອກະສານທັງໝົດ</span>
        </>
      )}

      {activeShelf && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <button
            onClick={() =>
              onNavigate({
                level: 'folders',
                warehouseId: activeWarehouse?.id,
                cabinetId: activeCabinet?.id,
                shelfId: activeShelf.id,
              })
            }
            className={`inline-flex items-center gap-1 font-medium transition ${
              view.level === 'folders'
                ? 'text-indigo-700 font-bold'
                : 'text-gray-500 hover:text-indigo-700'
            }`}
          >
            🪜 {activeShelf.name}
          </button>
        </>
      )}

      {view.level === 'documents' && !activeFolder && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="font-semibold text-indigo-700">📑 ບ່ອນເກັບເອກະສານທັງໝົດ</span>
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

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
    >
      ← ກັບຄືນ
    </button>
  );
}

// ── Document Row ─────────────────────────────────────────────
interface DocumentRowProps {
  doc: Document;
  folders?: Folder[];
  shelves?: Shelf[];
  cabinets?: Cabinet[];
  warehouses?: Warehouse[];
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onMoveShelf?: (doc: Document) => void;
  onTransfer?: (doc: Document) => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function DocumentRow({
  doc,
  folders = [],
  shelves = [],
  cabinets = [],
  warehouses = [],
  onPreview,
  onDownload,
  onDelete,
  onMoveShelf,
  onTransfer,
}: DocumentRowProps) {
  const currentFolder = folders.find((f) => f.id === doc.folderId);
  const currentShelf = shelves.find((s) => s.id === doc.shelfId || (currentFolder && s.id === currentFolder.shelfId));
  const currentCabinet = cabinets.find((c) => c.id === doc.cabinetId || (currentFolder && c.id === currentFolder.cabinetId));
  const currentWarehouse = warehouses.find((w) => w.id === doc.warehouseId || (currentCabinet && w.id === currentCabinet.warehouseId));

  const folderName = doc.folderName || currentFolder?.name;
  const shelfName = doc.shelfName || currentShelf?.name;
  const cabinetName = doc.cabinetName || currentCabinet?.name;
  const warehouseName = doc.warehouseName || currentWarehouse?.name;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <FileText size={20} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/documents/${doc.id}`}
              className="text-sm font-bold text-gray-900 transition hover:text-indigo-600 hover:underline"
            >
              {doc.title}
            </Link>
            <span className="font-mono text-xs text-gray-400">({doc.docNumber})</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 uppercase">
              {doc.fileType}
            </span>
          </div>

          {/* Hierarchy Badges: Warehouse > Cabinet > Shelf > Folder */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            {doc.transfers && doc.transfers.length > 0 && doc.transfers[0].status === 'pending' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-300">
                🔄 ກຳລັງໂອນຍ້າຍຫາ: {doc.transfers[0].toDepartment}
              </span>
            )}
            {folderName ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                📁 ແຟ້ມ: {folderName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600 border border-rose-200">
                ⚠️ ຍັງບໍ່ມີແຟ້ມ
              </span>
            )}
            {shelfName && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
                🪜 ຊັ້ນວາງ: {shelfName}
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
      </div>

      <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
        <button
          onClick={() => onPreview(doc)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          title="ສະແດງຕົວຢ່າງ"
        >
          <Eye size={14} /> ເບິ່ງ
        </button>
        <button
          onClick={() => onDownload(doc)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          title="ດາວໂຫຼດ"
        >
          <Download size={14} /> ດາວໂຫຼດ
        </button>
        {onTransfer && (
          <button
            type="button"
            onClick={() => onTransfer(doc)}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
            title="ສົ່ງເອກະສານຂ້າມພະແນກ"
          >
            <ArrowRightLeft size={14} /> ສົ່ງຂ້າມ
          </button>
        )}
        {onMoveShelf && (
          <button
            onClick={() => onMoveShelf(doc)}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
            title="ຍ້າຍບ່ອນເກັບ"
          >
            <FolderInput size={14} /> ຍ້າຍແຟ້ມ
          </button>
        )}
        <button
          onClick={() => onDelete(doc)}
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
          title="ຍ້າຍໄປ Trash"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Document List ────────────────────────────────────────────
interface DocumentListProps {
  documents: Document[];
  folders?: Folder[];
  shelves?: Shelf[];
  cabinets?: Cabinet[];
  warehouses?: Warehouse[];
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onMoveShelf?: (doc: Document) => void;
  onTransfer?: (doc: Document) => void;
  emptyMessage?: string;
  emptySubMessage?: string;
  showPagination?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

function DocumentList({
  documents,
  folders,
  shelves,
  cabinets,
  warehouses,
  onPreview,
  onDownload,
  onDelete,
  onMoveShelf,
  onTransfer,
  emptyMessage = 'ຍັງບໍ່ມີເອກະສານ',
  emptySubMessage = 'ອັບໂຫຼດເອກະສານໃໝ່ເພື່ອເລີ່ມຕົ້ນຈັດເກັບ',
  showPagination = true,
  actionLabel,
  onAction,
}: DocumentListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30;

  const totalPages = Math.ceil(documents.length / PAGE_SIZE) || 1;
  const paginatedDocs = useMemo(() => {
    if (!showPagination) return documents;
    const start = (currentPage - 1) * PAGE_SIZE;
    return documents.slice(start, start + PAGE_SIZE);
  }, [documents, currentPage, showPagination]);

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl text-indigo-600">
          📄
        </div>
        <p className="text-gray-500">{emptyMessage}</p>
        <p className="mt-1 text-xs text-gray-400">{emptySubMessage}</p>
        {onAction && actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={14} /> {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {paginatedDocs.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            folders={folders}
            shelves={shelves}
            cabinets={cabinets}
            warehouses={warehouses}
            onPreview={onPreview}
            onDownload={onDownload}
            onDelete={onDelete}
            onMoveShelf={onMoveShelf}
            onTransfer={onTransfer}
          />
        ))}
      </div>
      {showPagination && documents.length > PAGE_SIZE && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={documents.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

// ── Move to Folder Modal ─────────────────────────────────────
interface MoveToFolderModalProps {
  open: boolean;
  doc: Document | null;
  warehouses?: Warehouse[];
  cabinets?: Cabinet[];
  shelves?: Shelf[];
  folders?: Folder[];
  onClose: () => void;
  onConfirm: (docId: string, cabinetId: string, folderId: string, warehouseId?: string, shelfId?: string) => Promise<void> | void;
}

function MoveToFolderModal({
  open,
  doc,
  cabinets = [],
  shelves = [],
  folders = [],
  onClose,
  onConfirm,
}: MoveToFolderModalProps) {
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>(doc?.cabinetId || '');
  const [selectedShelfId, setSelectedShelfId] = useState<string>(doc?.shelfId || '');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(doc?.folderId || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (doc) {
      setSelectedCabinetId(doc.cabinetId || (cabinets[0]?.id ?? ''));
      setSelectedShelfId(doc.shelfId || '');
      setSelectedFolderId(doc.folderId || '');
    }
  }, [doc, cabinets]);

  const availableShelves = useMemo(() => {
    if (!selectedCabinetId) return [];
    return shelves.filter((s) => s.cabinetId === selectedCabinetId);
  }, [shelves, selectedCabinetId]);

  const availableFolders = useMemo(() => {
    if (selectedShelfId) {
      return folders.filter((f) => f.shelfId === selectedShelfId);
    }
    if (selectedCabinetId) {
      return folders.filter((f) => f.cabinetId === selectedCabinetId);
    }
    return [];
  }, [folders, selectedShelfId, selectedCabinetId]);

  if (!open || !doc) return null;

  async function handleSave() {
    if (!doc || !selectedCabinetId || !selectedFolderId) {
      pushToast({ title: 'ກະລຸນາເລືອກຕູ້ ແລະ ແຟ້ມເກັບເອກະສານ' });
      return;
    }
    setLoading(true);
    try {
      const cab = cabinets.find((c) => c.id === selectedCabinetId);
      const whId = cab?.warehouseId || undefined;
      await onConfirm(doc.id, selectedCabinetId, selectedFolderId, whId, selectedShelfId || undefined);
      pushToast({ title: `ຍ້າຍເອກະສານເຂົ້າແຟ້ມສຳເລັດ` });
      onClose();
    } catch {
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການຍ້າຍແຟ້ມ' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="ຍ້າຍ / ຈັດເອກະສານເຂົ້າແຟ້ມ">
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <p className="text-xs text-gray-500">ເອກະສານ:</p>
          <p className="font-semibold text-gray-900 text-sm">{doc.title}</p>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{doc.docNumber}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            🗄️ 1. ເລືອກຕູ້ເອກະສານ
          </label>
          <select
            value={selectedCabinetId}
            onChange={(e) => {
              setSelectedCabinetId(e.target.value);
              setSelectedShelfId('');
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
            🪜 2. ເລືອກຊັ້ນວາງເອກະສານ (ທາງເລືອກ)
          </label>
          <select
            value={selectedShelfId}
            onChange={(e) => {
              setSelectedShelfId(e.target.value);
              setSelectedFolderId('');
            }}
            disabled={!selectedCabinetId}
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-gray-100"
          >
            <option value="">-- ທຸກຊັ້ນວາງ / ບໍ່ລະບຸ --</option>
            {availableShelves.map((sh) => (
              <option key={sh.id} value={sh.id}>
                🪜 {sh.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            📁 3. ເລືອກແຟ້ມເກັບເອກະສານ
          </label>
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            disabled={!selectedCabinetId}
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-gray-100"
          >
            <option value="">
              {!selectedCabinetId ? '-- ກະລຸນາເລືອກຕູ້ກ່ອນ --' : '-- ເລືອກແຟ້ມເກັບເອກະສານ --'}
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
  shelf?: Shelf;
  folder?: Folder;
  warehouses?: Warehouse[];
  cabinets?: Cabinet[];
  shelves?: Shelf[];
  folders?: Folder[];
  documents: Document[];
  onSelectFolder?: (folderId: string) => void;
  onAssignDocument?: (docId: string, cabinetId: string, folderId: string, warehouseId?: string, shelfId?: string) => Promise<void>;
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export default function DocumentView({
  cabinet,
  shelf,
  folder,
  warehouses = [],
  cabinets = [],
  shelves = [],
  folders = [],
  documents = [],
  onSelectFolder,
  onAssignDocument,
  onPreview,
  onDownload,
  onDelete,
}: DocumentViewProps) {
  const { openUpload } = useUploadModal();
  const { user: currentUser } = useCurrentUser();
  const { reload } = useDocuments();
  const [moveDoc, setMoveDoc] = useState<Document | null>(null);
  const [transferDoc, setTransferDoc] = useState<Document | null>(null);
  const [filterCabinetId, setFilterCabinetId] = useState<string>('all');
  const [filterShelfId, setFilterShelfId] = useState<string>('all');
  const [filterFolderId, setFilterFolderId] = useState<string>('all');

  // Filtered documents for storage browsing
  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      if (filterCabinetId !== 'all' && d.cabinetId !== filterCabinetId) return false;
      if (filterShelfId !== 'all' && d.shelfId !== filterShelfId) return false;
      if (filterFolderId !== 'all' && d.folderId !== filterFolderId) return false;
      return true;
    });
  }, [documents, filterCabinetId, filterShelfId, filterFolderId]);

  // 1. SPECIFIC FOLDER VIEW (When user clicks into a folder -> ບ່ອນເກັບເອກະສານ)
  if (folder) {
    const handleUploadToFolder = () => {
      openUpload({
        cabinetId: folder.cabinetId || cabinet?.id,
        shelfId: folder.shelfId || shelf?.id,
        folderId: folder.id,
      });
    };

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
                  ແຟ້ມເກັບເອກະສານ
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {shelf ? `ຢູ່ໃນ 🪜 ${shelf.name} · ` : ''}
                {cabinet ? `🗄️ ${cabinet.name} · ` : ''}
                ມີທັງໝົດ{' '}
                <span className="font-semibold text-indigo-700">{documents.length}</span> ເອກະສານໃນແຟ້ມນີ້
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUploadToFolder}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={14} /> ອັບໂຫຼດເອກະສານເຂົ້າແຟ້ມນີ້
          </button>
        </div>

        <DocumentList
          documents={documents}
          showPagination={true}
          folders={folders}
          shelves={shelves}
          cabinets={cabinets}
          warehouses={warehouses}
          onPreview={onPreview}
          onDownload={onDownload}
          onDelete={onDelete}
          onMoveShelf={(doc) => setMoveDoc(doc)}
          onTransfer={(doc) => setTransferDoc(doc)}
          emptyMessage={`ຍັງບໍ່ມີເອກະສານໃນແຟ້ມ "${folder.name}"`}
          emptySubMessage="ເອກະສານຂອງແຟ້ມນີ້ຈະສະແດງສະເພາະຢູ່ທີ່ນີ້ເທົ່ານັ້ນ"
          actionLabel="ອັບໂຫຼດເອກະສານເຂົ້າແຟ້ມນີ້"
          onAction={handleUploadToFolder}
        />

        <MoveToFolderModal
          open={Boolean(moveDoc)}
          doc={moveDoc}
          warehouses={warehouses}
          cabinets={cabinets}
          shelves={shelves}
          folders={folders}
          onClose={() => setMoveDoc(null)}
          onConfirm={async (docId, cabId, folId, whId, shId) => {
            await onAssignDocument?.(docId, cabId, folId, whId, shId);
            setMoveDoc(null);
          }}
        />

        <TransferDocumentModal
          open={Boolean(transferDoc)}
          doc={transferDoc}
          currentUser={currentUser}
          onClose={() => setTransferDoc(null)}
          onSuccess={() => {
            setTransferDoc(null);
            void reload();
          }}
        />
      </>
    );
  }

  // 2. ALL DOCUMENTS STORAGE LOCATION BROWSING VIEW
  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-2xl shadow-sm">
            📑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">ບ່ອນເກັບເອກະສານ</h2>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                ລາຍການເອກະສານໃນຄັງ
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              ລວມເອກະສານທັງໝົດ {documents.length} ສະບັບ · ສະແດງຕາມສາຍທາງ: ຄັງ ➡️ ຕູ້ ➡️ ຊັ້ນວາງ ➡️ ແຟ້ມ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            openUpload({
              cabinetId: filterCabinetId !== 'all' ? filterCabinetId : cabinet?.id,
              shelfId: filterShelfId !== 'all' ? filterShelfId : shelf?.id,
              folderId: filterFolderId !== 'all' ? filterFolderId : undefined,
            })
          }
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={14} /> ອັບໂຫຼດເອກະສານ
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Filter size={14} />
            ກັ່ນຕອງບ່ອນເກັບ:
          </div>

          <select
            value={filterCabinetId}
            onChange={(e) => {
              setFilterCabinetId(e.target.value);
              setFilterShelfId('all');
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
            value={filterShelfId}
            onChange={(e) => {
              setFilterShelfId(e.target.value);
              setFilterFolderId('all');
            }}
            className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">🪜 ທຸກຊັ້ນວາງ ({shelves.length})</option>
            {(filterCabinetId === 'all'
              ? shelves
              : shelves.filter((s) => s.cabinetId === filterCabinetId)
            ).map((s) => (
              <option key={s.id} value={s.id}>
                🪜 {s.name}
              </option>
            ))}
          </select>

          <select
            value={filterFolderId}
            onChange={(e) => setFilterFolderId(e.target.value)}
            className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">📁 ທຸກແຟ້ມ ({folders.length})</option>
            {(filterShelfId !== 'all'
              ? folders.filter((f) => f.shelfId === filterShelfId)
              : filterCabinetId !== 'all'
              ? folders.filter((f) => f.cabinetId === filterCabinetId)
              : folders
            ).map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>

          {(filterCabinetId !== 'all' || filterShelfId !== 'all' || filterFolderId !== 'all') && (
            <button
              onClick={() => {
                setFilterCabinetId('all');
                setFilterShelfId('all');
                setFilterFolderId('all');
              }}
              className="rounded-lg text-xs font-medium text-rose-600 hover:underline"
            >
              ລ້າງຕົວກັ່ນຕອງ
            </button>
          )}
        </div>
      </div>

      <DocumentList
        documents={filteredDocuments}
        showPagination={true}
        folders={folders}
        shelves={shelves}
        cabinets={cabinets}
        warehouses={warehouses}
        onPreview={onPreview}
        onDownload={onDownload}
        onDelete={onDelete}
        onMoveShelf={(doc) => setMoveDoc(doc)}
        onTransfer={(doc) => setTransferDoc(doc)}
        emptyMessage="ບໍ່ພົບເອກະສານໃນບ່ອນເກັບນີ້"
        emptySubMessage="ເລືອກຕູ້, ຊັ້ນວາງ ຫຼື ແຟ້ມອື່ນ ເພື່ອເບິ່ງເອກະສານ"
      />

      <MoveToFolderModal
        open={Boolean(moveDoc)}
        doc={moveDoc}
        warehouses={warehouses}
        cabinets={cabinets}
        shelves={shelves}
        folders={folders}
        onClose={() => setMoveDoc(null)}
        onConfirm={async (docId, cabId, folId, whId, shId) => {
          await onAssignDocument?.(docId, cabId, folId, whId, shId);
          setMoveDoc(null);
        }}
      />

      <TransferDocumentModal
        open={Boolean(transferDoc)}
        doc={transferDoc}
        currentUser={currentUser}
        onClose={() => setTransferDoc(null)}
        onSuccess={() => {
          setTransferDoc(null);
          void reload();
        }}
      />
    </>
  );
}