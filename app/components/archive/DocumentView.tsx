"use client"
import Link from 'next/link'
import { ChevronRight, Download, Eye, FileText, Home, Plus, Trash2 } from 'lucide-react'
import type { Cabinet, Document, Folder } from '@/types/document'
import type { ViewState } from './useArchive'

// ── Breadcrumbs ──────────────────────────────────────────────
interface BreadcrumbsProps {
  view: ViewState;
  activeCabinet?: Cabinet;
  activeFolder?: Folder;
  onNavigate: (view: ViewState) => void;
}

function Breadcrumbs({ view, activeCabinet, activeFolder, onNavigate }: BreadcrumbsProps) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm">
      <button
        onClick={() => onNavigate({ level: 'cabinets' })}
        className={`inline-flex items-center gap-1 font-medium transition ${
          view.level === 'cabinets'
            ? 'text-indigo-700'
            : 'text-gray-500 hover:text-indigo-700'
        }`}
      >
        <Home size={14} />
        ຕູ້ເອກະສານທັງໝົດ
      </button>

      {activeCabinet && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <button
            onClick={() => onNavigate({ level: 'folders', cabinetId: activeCabinet.id })}
            className={`inline-flex items-center gap-1 font-medium transition ${
              view.level === 'folders'
                ? 'text-indigo-700'
                : 'text-gray-500 hover:text-indigo-700'
            }`}
          >
            🗄️ {activeCabinet.name}
          </button>
        </>
      )}

      {activeFolder && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="font-medium text-gray-800">📁 {activeFolder.name}</span>
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

// ── Document List ────────────────────────────────────────────
interface DocumentListProps {
  documents: Document[];
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function DocumentList({ documents = [], onPreview, onDownload, onDelete }: DocumentListProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
          📄
        </div>
        <p className="text-gray-500">ຍັງບໍ່ມີເອກະສານໃນແຟ້ມນີ້</p>
        <p className="mt-1 text-xs text-gray-400">ສາມາດອັບໂຫຼດເອກະສານເຂົ້າມາກ່ອນໄດ້</p>
        <Link
          href="/documents/upload"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} /> ອັບໂຫຼດເອກະສານ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md lg:flex-row lg:items-center"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileText size={22} />
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
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>{formatDate(doc.uploadDate)}</span>
              <span>{doc.fileSize}</span>
              <span>ໂດຍ: {doc.uploadedBy}</span>
              <span>{doc.category}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onPreview(doc)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
            >
              <Eye size={14} />
              ເບິ່ງ
            </button>
            <button
              onClick={() => onDownload(doc)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              <Download size={14} />
              ດາວໂຫຼດ
            </button>
            <button
              onClick={() => onDelete(doc)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
            >
              <Trash2 size={14} />
              ລົບ
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Document View ────────────────────────────────────────────
interface DocumentViewProps {
  cabinet: Cabinet;
  folder: Folder;
  documents: Document[];
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export default function DocumentView({ cabinet, folder, documents = [], onPreview, onDownload, onDelete }: DocumentViewProps) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-xl">
            📁
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{folder.name}</h2>
            <p className="text-xs text-gray-500">
              ຢູ່ໃນ 🗄️ {cabinet.name} · ສ້າງເມື່ອ {formatDate(folder.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <DocumentList
        documents={documents}
        onPreview={onPreview}
        onDownload={onDownload}
        onDelete={onDelete}
      />
    </>
  );
}

export { Breadcrumbs, BackButton };