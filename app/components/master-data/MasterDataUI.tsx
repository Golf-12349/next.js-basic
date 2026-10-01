'use client'

import type { ReactNode } from 'react'
import Modal from '@/app/components/ui/Modal'
import { Edit2, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react'

// ── Page header (ຫົວໜ້າເພຈ + ປຸ່ມທາງຂວາ) ────────────────────────────
export function MasterDataHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          {icon}
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

// ── Reset ໂຄງສ້າງຝ່າຍ / ພະແນກ ກັບຄ່າເລີ່ມຕົ້ນ EDL ──────────────────────
export function ResetDefaultsButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm('ທ່ານຕ້ອງການຣີເຊັດໂຄງສ້າງຝ່າຍ ແລະ ພະແນກ ກັບໄປເປັນຄ່າເລີ່ມຕົ້ນຂອງ EDL ແທ້ບໍ່?')) {
          onReset()
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      <span>ຣີເຊັດເປັນຄ່າເລີ່ມຕົ້ນ</span>
    </button>
  )
}

// ── Card shell ───────────────────────────────────────────────
export function MasterCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ${className}`}>{children}</div>
}

// ── Inline add form ──────────────────────────────────────────
export function AddInput({
  icon,
  value,
  onChange,
  placeholder,
  onSubmit,
  className = '',
}: {
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder: string
  onSubmit: () => void
  className?: string
}) {
  return (
    <div className={`relative ${className || 'flex-1'}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit()
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:bg-white"
      />
    </div>
  )
}

export function AddButton({
  label,
  onClick,
  disabled,
  busy,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  busy?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      <span>{label}</span>
    </button>
  )
}

// ── Table shell ──────────────────────────────────────────────
export function MasterTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50/80">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{head}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

export function Th({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return <th className={`px-5 py-3.5 ${align === 'right' ? 'text-right' : ''}`}>{children}</th>
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1.5">{children}</div>
}

export function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
    >
      <Edit2 className="h-3.5 w-3.5" />
      ແກ້ໄຂ
    </button>
  )
}

export function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      ລຶບ
    </button>
  )
}

export function CountPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
      {children}
    </span>
  )
}

export function IndigoPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
      {children}
    </span>
  )
}

// ── Modal: ຢືນຢັນການລຶບ ─────────────────────────────────────────
export function ConfirmDeleteModal({
  open,
  title,
  onClose,
  onConfirm,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  onConfirm: () => void
  children: ReactNode
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{children}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
          >
            ຢືນຢັນລຶບ
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Modal: ແກ້ໄຂຊື່ ─────────────────────────────────────────────
export function RenameModal({
  open,
  title,
  label,
  value,
  onChange,
  onClose,
  onSubmit,
  extra,
}: {
  open: boolean
  title: string
  label: string
  value: string
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
  extra?: ReactNode
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        {extra}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            ບັນທຶກ
          </button>
        </div>
      </div>
    </Modal>
  )
}

