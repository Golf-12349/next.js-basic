"use client"
import { FileText, Plus, Trash2 } from 'lucide-react'
import type { Cabinet, Document, Folder } from '@/types/document'

// ── Folder Card (ຊັ້ນວາງເອກະສານ) ──────────────────────────────
interface FolderCardProps {
  folder: Folder;
  cabinetName?: string;
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

function FolderCard({ folder, cabinetName, docCount, canManage = true, onOpen, onDelete }: FolderCardProps) {
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl transition group-hover:scale-105">
          📁
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
  const actionButton = onAction ? (
    <button
      onClick={onAction}
      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
    >
      <Plus size={16} /> {actionLabel}
    </button>
  ) : (
    href ? (
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

// ── Folder View (ຊັ້ນວາງເອກະສານ) ──────────────────────────────
interface FolderViewProps {
  cabinet?: Cabinet;
  cabinets?: Cabinet[];
  folders: Folder[];
  documents: Document[];
  canManage?: boolean;
  onCreate: () => void;
  onOpen: (folderId: string) => void;
  onDelete: (folder: Folder) => void;
}

export default function FolderView({ cabinet, cabinets = [], folders = [], documents = [], canManage = true, onCreate, onOpen, onDelete }: FolderViewProps) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${cabinet ? `bg-gradient-to-br ${cabinet.color}` : 'bg-amber-500'} text-xl text-white`}>
            {cabinet ? '🗄️' : '📁'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{cabinet ? cabinet.name : 'ຊັ້ນວາງເອກະສານທັງໝົດ'}</h2>
            <p className="text-xs text-gray-500">{cabinet ? cabinet.department : `ລວມທັງໝົດ ${folders.length} ຊັ້ນວາງ`}</p>
          </div>
        </div>
        {canManage && (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={16} />
            + ສ້າງຊັ້ນວາງໃໝ່
          </button>
        )}
      </div>

      {!folders || folders.length === 0 ? (
        <EmptyState
          icon="📁"
          message={cabinet ? "ຍັງບໍ່ມີຊັ້ນວາງໃນຕູ້ນີ້" : "ຍັງບໍ່ມີຊັ້ນວາງເອກະສານ"}
          actionLabel={canManage ? "ສ້າງຊັ້ນວາງໃໝ່" : undefined}
          onAction={canManage ? onCreate : undefined}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {folders.map((folder) => {
            const cab = cabinets.find((c) => c.id === folder.cabinetId);
            return (
              <FolderCard
                key={folder.id}
                folder={folder}
                cabinetName={!cabinet && cab ? cab.name : undefined}
                canManage={canManage}
                docCount={
                  documents.filter(
                    (d) =>
                      !d.deleted &&
                      (d.folderId === folder.id ||
                        (Boolean(folder.name) && Boolean(d.folderName) && d.folderName === folder.name))
                  ).length
                }
                onOpen={() => onOpen(folder.id)}
                onDelete={() => onDelete(folder)}
              />
            );
          })}
        </div>
      )}
    </>
  );
}