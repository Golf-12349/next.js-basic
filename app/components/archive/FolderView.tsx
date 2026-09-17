"use client"
import { useState, useMemo } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import type { Cabinet, Document, Folder, Shelf } from '@/types/document'
import Pagination from '@/app/components/ui/Pagination'

// ── Folder Card (ແຟ້ມເກັບເອກະສານ) ──────────────────────────────
interface FolderCardProps {
  folder: Folder;
  cabinetName?: string;
  shelfName?: string;
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

function FolderCard({ folder, cabinetName, shelfName, docCount, canManage = true, onOpen, onDelete }: FolderCardProps) {
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl transition group-hover:scale-105">
          📁
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {shelfName && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              🪜 {shelfName}
            </span>
          )}
          {cabinetName && !shelfName && (
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
              title="ລຶບແຟ້ມ"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      <h3 className="mt-4 text-lg font-bold text-gray-900">{folder.name}</h3>
      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
        {folder.description || 'ບໍ່ມີລາຍລະອຽດ'}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">ສ້າງເມື່ອ {formatDate(folder.createdAt)}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          <FileText size={12} />
          {docCount} ເອກະສານ
        </span>
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
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
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

// ── Folder View (ແຟ້ມເກັບເອກະສານ) ──────────────────────────────
interface FolderViewProps {
  cabinet?: Cabinet;
  cabinets?: Cabinet[];
  shelf?: Shelf;
  shelves?: Shelf[];
  folders: Folder[];
  documents: Document[];
  canManage?: boolean;
  onCreate: () => void;
  onOpen: (folderId: string) => void;
  onDelete: (folder: Folder) => void;
}

export default function FolderView({
  cabinet,
  cabinets = [],
  shelf,
  shelves = [],
  folders = [],
  documents = [],
  canManage = true,
  onCreate,
  onOpen,
  onDelete,
}: FolderViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30;

  const totalPages = Math.ceil(folders.length / PAGE_SIZE) || 1;
  const paginatedFolders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return folders.slice(start, start + PAGE_SIZE);
  }, [folders, currentPage]);

  const viewTitle = shelf ? `ແຟ້ມໃນ ${shelf.name}` : cabinet ? `ແຟ້ມໃນຕູ້ ${cabinet.name}` : 'ແຟ້ມເກັບເອກະສານທັງໝົດ';
  const viewSubtitle = shelf
    ? `ຕູ້: ${cabinet?.name || '—'} • ລວມ ${folders.length} ແຟ້ມ`
    : cabinet
    ? `${cabinet.department} • ລວມ ${folders.length} ແຟ້ມ`
    : `ລວມທັງໝົດ ${folders.length} ແຟ້ມ`;

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-xl text-white">
            📁
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{viewTitle}</h2>
            <p className="text-xs text-gray-500">{viewSubtitle}</p>
          </div>
        </div>
        {canManage && (
          <button
            onClick={onCreate}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
          >
            <Plus size={16} /> ສ້າງແຟ້ມໃໝ່
          </button>
        )}
      </div>

      {!folders || folders.length === 0 ? (
        <EmptyState
          icon="📁"
          message={shelf ? "ຍັງບໍ່ມີແຟ້ມໃນຊັ້ນວາງນີ້" : cabinet ? "ຍັງບໍ່ມີແຟ້ມໃນຕູ້ນີ້" : "ຍັງບໍ່ມີແຟ້ມເກັບເອກະສານ"}
          subMessage="ສ້າງແຟ້ມເກັບເອກະສານເພື່ອບັນຈຸເອກະສານຕົວຈິງ"
          actionLabel={canManage ? "ສ້າງແຟ້ມໃໝ່" : undefined}
          onAction={canManage ? onCreate : undefined}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginatedFolders.map((folder) => {
              const cab = cabinets.find((c) => c.id === folder.cabinetId);
              const sh = shelves.find((s) => s.id === folder.shelfId);
              const docCount = documents.filter(
                (d) =>
                  !d.deleted &&
                  (d.folderId === folder.id ||
                    (Boolean(folder.name) && Boolean(d.folderName) && d.folderName === folder.name))
              ).length;

              return (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  cabinetName={!cabinet && cab ? cab.name : undefined}
                  shelfName={!shelf && sh ? sh.name : undefined}
                  canManage={canManage}
                  docCount={docCount}
                  onOpen={() => onOpen(folder.id)}
                  onDelete={() => onDelete(folder)}
                />
              );
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={folders.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}