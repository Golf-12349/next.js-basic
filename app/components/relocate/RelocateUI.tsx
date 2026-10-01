'use client'

import type { ReactNode } from 'react'
import { Loader2, Search, X } from 'lucide-react'

export type SelectOption = { value: string; label: string }

// ── Badge (ປ້າຍຕຳແໜ່ງຈັດເກັບ — ສີດຽວກັບ ShelfCard) ──────────────────
type BadgeTone = 'warehouse' | 'cabinet' | 'shelf' | 'folder' | 'document'

const badgeToneClasses: Record<BadgeTone, string> = {
  warehouse: 'border-purple-100 bg-purple-50 text-purple-700',
  cabinet: 'border-slate-200 bg-slate-100 text-slate-700',
  shelf: 'border-blue-100 bg-blue-50 text-blue-700',
  folder: 'border-amber-100 bg-amber-50 text-amber-700',
  document: 'border-gray-200 bg-gray-100 text-gray-600',
}

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${badgeToneClasses[tone]}`}
    >
      {children}
    </span>
  )
}

// ── Page Header ──────────────────────────────────────────────
export function RelocateHeader({
  icon,
  title,
  subtitle,
  countLabel,
}: {
  icon: string
  title: string
  subtitle: string
  countLabel?: string
}) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-bold text-gray-900">
        {icon} {title}
        {countLabel && (
          <span className="ml-2.5 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            {countLabel}
          </span>
        )}
      </h1>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}

// ── Panel (ກາຕູນຂາວມາດຕະຖານ) ─────────────────────────────────
export function RelocatePanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>
}

// ── Step title in a panel ────────────────────────────────────
export function PanelTitle({
  step,
  icon,
  title,
  hint,
}: {
  step: number
  icon: string
  title: string
  hint?: string
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5 border-b border-gray-100 pb-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-base">{icon}</span>
      <div>
        <h2 className="text-base font-bold text-gray-900">
          {step}. {title}
        </h2>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  )
}

// ── Search box ───────────────────────────────────────────────
export function RelocateSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative mb-4">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-8 pr-8 text-xs font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

// ── Selectable item card ─────────────────────────────────────
export function SelectableCard({
  selected,
  onSelect,
  icon,
  title,
  subtitle,
  children,
}: {
  selected: boolean
  onSelect: () => void
  icon: string
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-100'
          : 'border-gray-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-lg transition group-hover:scale-105">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className={`truncate text-sm font-bold transition-colors ${
              selected ? 'text-indigo-600' : 'text-gray-900 group-hover:text-indigo-600'
            }`}
          >
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{subtitle}</p>}
          {children && <div className="mt-2 flex flex-wrap items-center gap-1.5">{children}</div>}
        </div>
      </div>
    </div>
  )
}

// ── Summary box (ສະຫຼຸບຂໍ້ມູນກ່ອນຍ້າຍ) ──────────────────────────
export function SummaryBox({
  icon,
  title,
  rows,
}: {
  icon?: string
  title: string
  rows: { label: string; value: ReactNode }[]
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-sm font-semibold text-gray-900">
        {icon ? `${icon} ` : ''}
        {title}
      </p>
      <dl className="mt-2.5 space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-xs">
            <dt className="text-gray-500">{row.label}</dt>
            <dd className="text-right font-medium text-gray-800">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ── Form select ──────────────────────────────────────────────
export function FormSelect({
  label,
  value,
  onChange,
  options,
  disabled,
  required,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  disabled?: boolean
  required?: boolean
  hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

// ── Confirm button ───────────────────────────────────────────
export function ConfirmButton({
  label,
  busyLabel,
  busy = false,
  disabled = false,
  onClick,
}: {
  label: string
  busyLabel: string
  busy?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy && <Loader2 size={16} className="animate-spin" />}
      {busy ? busyLabel : label}
    </button>
  )
}

// ── Empty state ──────────────────────────────────────────────
export function RelocateEmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-2xl">{icon}</div>
      <div className="mt-3 text-base font-semibold text-gray-900">{title}</div>
      <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">{sub}</p>
    </div>
  )
}

