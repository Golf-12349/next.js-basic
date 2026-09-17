"use client"
import { useState, useMemo } from 'react'
import { FileText, FolderArchive, Plus, Trash2 } from 'lucide-react'
import type { Cabinet, Document, Folder, Shelf } from '@/types/document'
import Pagination from '@/app/components/ui/Pagination'

// ── Shelf Card (ຊັ້ນວາງເອກະສານ) ──────────────────────────────
interface ShelfCardProps {
  shelf: Shelf;
  cabinetName?: string;
  folderCount: number;
  docCount: number;
  canManage?: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ShelfCard({ shelf, cabinetName, folderCount, docCount, canManage = true, onOpen, onDelete }: ShelfCardProps) {
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl transition group-hover:scale-105">
          🪜
        </div>
        <div className="flex items-center gap-1.5">
          {cabinetName && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              🗄️ {cabinetName}
            </span>
          )}
          {canManage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded-lg p-1.5 text-gray-300 transition hover:bg-rose-50 hover:text-rose-600"
              title="ລຶບຊັ້ນວາງ"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      <h3 className="mt-4 text-lg font-bold text-gray-900">{shelf.name}</h3>
      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
        {shelf.description || 'ບໍ່ມີລາຍລະອຽດ'}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">ສ້າງເມື່ອ {formatDate(shelf.createdAt)}</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            <FolderArchive size={12} />
            {folderCount} ແຟ້ມ
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
            <FileText size={12} />
            {docCount} ເອກະສານ
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────
interface EmptyStateProps {
  icon: string;
  message: string;
  subMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({ icon, message, subMessage, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl">
        {icon}
      </div>
      <p className="text-gray-500">{message}</p>
      {subMessage && <p className="mt-1 text-xs text-gray-400">{subMessage}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── Shelf View (ຊັ້ນວາງເອກະສານ) ──────────────────────────────
interface ShelfViewProps {
  cabinet?: Cabinet;
  cabinets?: Cabinet[];
  shelves: Shelf[];
  folders: Folder[];
  documents: Document[];
  canManage?: boolean;
  onCreate: () => void;
  onOpen: (shelfId: string) => void;
  onDelete: (shelf: Shelf) => void;
}

export default function ShelfView({
  cabinet,
  cabinets = [],
  shelves = [],
  folders = [],
  documents = [],
  canManage = true,
  onCreate,
  onOpen,
  onDelete,
}: ShelfViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30;

  const totalPages = Math.ceil(shelves.length / PAGE_SIZE) || 1;
  const paginatedShelves = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return shelves.slice(start, start + PAGE_SIZE);
  }, [shelves, currentPage]);

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${cabinet ? `bg-gradient-to-br ${cabinet.color}` : 'bg-blue-600'} text-xl text-white`}>
            {cabinet ? '🗄️' : '🪜'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{cabinet ? cabinet.name : 'ຊັ້ນວາງເອກະສານທັງໝົດ'}</h2>
            <p className="text-xs text-gray-500">{cabinet ? cabinet.department : `ລວມທັງໝົດ ${shelves.length} ຊັ້ນວາງ`}</p>
          </div>
        </div>
        {canManage && (
          <button
            onClick={onCreate}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
          >
            <Plus size={16} /> ສ້າງຊັ້ນວາງໃໝ່
          </button>
        )}
      </div>

      {!shelves || shelves.length === 0 ? (
        <EmptyState
          icon="🪜"
          message={cabinet ? "ຍັງບໍ່ມີຊັ້ນວາງໃນຕູ້ນີ້" : "ຍັງບໍ່ມີຊັ້ນວາງເອກະສານ"}
          subMessage="ສ້າງຊັ້ນວາງເພື່ອຈັດວາງແຟ້ມເກັບເອກະສານໃຫ້ເປັນລະບຽບ"
          actionLabel={canManage ? "ສ້າງຊັ້ນວາງໃໝ່" : undefined}
          onAction={canManage ? onCreate : undefined}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginatedShelves.map((shelf) => {
              const cab = cabinets.find((c) => c.id === shelf.cabinetId);
              const shelfFolderList = folders.filter((f) => f.shelfId === shelf.id);
              const shelfFolderIds = new Set(shelfFolderList.map((f) => f.id));
              const docCount = documents.filter(
                (d) =>
                  !d.deleted &&
                  (d.shelfId === shelf.id || (d.folderId && shelfFolderIds.has(d.folderId)))
              ).length;

              return (
                <ShelfCard
                  key={shelf.id}
                  shelf={shelf}
                  cabinetName={!cabinet && cab ? cab.name : undefined}
                  canManage={canManage}
                  folderCount={shelfFolderList.length}
                  docCount={docCount}
                  onOpen={() => onOpen(shelf.id)}
                  onDelete={() => onDelete(shelf)}
                />
              );
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={shelves.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}

