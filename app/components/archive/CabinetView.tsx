"use client"
import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Cabinet, Document, Folder, Shelf } from '@/types/document'
import Pagination from '@/app/components/ui/Pagination'

// ── Cabinet Card ─────────────────────────────────────────────
interface CabinetCardProps {
  cabinet: Cabinet;
  shelfCount: number;
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

function CabinetCard({ cabinet, shelfCount, folderCount, docCount, canManage = true, onOpen, onDelete }: CabinetCardProps) {
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`bg-gradient-to-br ${cabinet.color} px-5 py-6`}>
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
            🗄️
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {shelfCount} ຊັ້ນວາງ
          </span>
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">{cabinet.name}</h2>
        <p className="mt-1 text-xs text-white/80">{cabinet.department}</p>
      </div>
      <div className="p-5">
        <p className="text-sm text-gray-600 line-clamp-2">
          {cabinet.description || 'ບໍ່ມີລາຍລະອຽດ'}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">ສ້າງເມື່ອ {formatDate(cabinet.createdAt)}</span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              {folderCount} ແຟ້ມ
            </span>
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              {docCount} ເອກະສານ
            </span>
            {canManage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded-lg p-1.5 text-gray-300 transition hover:bg-rose-50 hover:text-rose-600"
                title="ລຶບຕູ້"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
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
  href?: string;
}

function EmptyState({ icon, message, subMessage, actionLabel, onAction, href }: EmptyStateProps) {
  const actionButton = onAction ? (
    <button
      onClick={onAction}
      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
    >
      <Plus size={16} /> {actionLabel}
    </button>
  ) : href ? (
    <a
      href={href}
      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
    >
      <Plus size={16} /> {actionLabel}
    </a>
  ) : null;

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl">
        {icon}
      </div>
      <p className="text-gray-500">{message}</p>
      {subMessage && <p className="mt-1 text-xs text-gray-400">{subMessage}</p>}
      {actionButton}
    </div>
  );
}

// ── Cabinet View ─────────────────────────────────────────────
interface CabinetViewProps {
  cabinets: Cabinet[];
  shelves?: Shelf[];
  folders?: Folder[];
  documents?: Document[];
  canManage?: boolean;
  onCreate: () => void;
  onOpen: (cabinetId: string) => void;
  onDelete: (cabinet: Cabinet) => void;
}

export default function CabinetView({
  cabinets = [],
  shelves = [],
  folders = [],
  documents = [],
  canManage = true,
  onCreate,
  onOpen,
  onDelete,
}: CabinetViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30;

  const totalPages = Math.ceil(cabinets.length / PAGE_SIZE) || 1;
  const paginatedCabinets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return cabinets.slice(start, start + PAGE_SIZE);
  }, [cabinets, currentPage]);

  if (!cabinets || cabinets.length === 0) {
    return (
      <EmptyState
        icon="🗄️"
        message="ຍັງບໍ່ມີຕູ້ເອກະສານ"
        subMessage="ສ້າງຕູ້ເອກະສານເພື່ອຈັດແບ່ງຊັ້ນວາງ ແລະ ແຟ້ມເກັບເອກະສານ"
        actionLabel={canManage ? "ສ້າງຕູ້ເອກະສານໃໝ່" : undefined}
        onAction={canManage ? onCreate : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {paginatedCabinets.map((cabinet) => {
          const cabShelves = shelves.filter((s) => s.cabinetId === cabinet.id);
          const cabFolders = folders.filter((f) => f.cabinetId === cabinet.id);
          const docCount = documents.filter(
            (d) =>
              !d.deleted &&
              (d.cabinetId === cabinet.id ||
                cabFolders.some((f) => f.id === d.folderId || (f.name && d.folderName === f.name)))
          ).length;

          return (
            <CabinetCard
              key={cabinet.id}
              cabinet={cabinet}
              shelfCount={cabShelves.length}
              folderCount={cabFolders.length}
              docCount={docCount}
              canManage={canManage}
              onOpen={() => onOpen(cabinet.id)}
              onDelete={() => onDelete(cabinet)}
            />
          );
        })}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={cabinets.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}