"use client"
import { FileText, Plus, Trash2 } from 'lucide-react'
import type { Cabinet, Document, Folder } from '@/types/document'

// ── Folder Card ──────────────────────────────────────────────
interface FolderCardProps {
  folder: Folder;
  docCount: number;
  onOpen: () => void;
  onDelete: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FolderCard({ folder, docCount, onOpen, onDelete }: FolderCardProps) {
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl transition group-hover:scale-105">
          📁
        </div>
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
  href?: string;
}

function EmptyState({ icon, message, subMessage, actionLabel, onAction, href }: EmptyStateProps) {
  const actionButton = actionLabel && (
    onAction ? (
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
    ) : null
  );

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

// ── Folder View ──────────────────────────────────────────────
interface FolderViewProps {
  cabinet: Cabinet;
  folders: Folder[];
  documents: Document[];
  onCreate: () => void;
  onOpen: (folderId: string) => void;
  onDelete: (folder: Folder) => void;
}

export default function FolderView({ cabinet, folders = [], documents = [], onCreate, onOpen, onDelete }: FolderViewProps) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${cabinet.color} text-xl`}>
            🗄️
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{cabinet.name}</h2>
            <p className="text-xs text-gray-500">{cabinet.department}</p>
          </div>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={16} />
          + ສ້າງແຟ້ມໄໝ່
        </button>
      </div>

      {!folders || folders.length === 0 ? (
        <EmptyState
          icon="📁"
          message="ຍັງບໍ່ມີແຟ້ມໃນຕູ້ນີ້"
          actionLabel="ສ້າງແຟ້ມໄໝ່"
          onAction={onCreate}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              docCount={documents.filter((d) => d.folderId === folder.id && !d.deleted).length}
              onOpen={() => onOpen(folder.id)}
              onDelete={() => onDelete(folder)}
            />
          ))}
        </div>
      )}
    </>
  );
}