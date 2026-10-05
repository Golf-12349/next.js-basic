"use client"

import type { ReactNode } from 'react'
import Modal from '@/app/components/ui/Modal'
import type { Cabinet, Folder, Shelf, Warehouse } from '@/types/document'

// ── Detail target ────────────────────────────────────────────
// ເປົ້າໝາຍທີ່ຈະສະແດງໃນປ໊ອບອັບລາຍລະອຽດ — ສົ່ງຂໍ້ມູນພ້ອມເສັ້ນທາງ + ສະຖິຕິທີ່ຄຳນວນໄວ້ແລ້ວ
export type ArchiveDetailTarget =
  | {
      kind: 'warehouse'
      name: string
      division?: string | null
      description?: string | null
      createdAt?: string
      path: { label: string; icon: string }[]
      stats: { label: string; value: number; icon: string }[]
    }
  | {
      kind: 'cabinet'
      name: string
      division?: string | null
      department?: string | null
      description?: string | null
      createdAt?: string
      path: { label: string; icon: string }[]
      stats: { label: string; value: number; icon: string }[]
    }
  | {
      kind: 'shelf'
      name: string
      description?: string | null
      createdAt?: string
      path: { label: string; icon: string }[]
      stats: { label: string; value: number; icon: string }[]
    }
  | {
      kind: 'folder'
      name: string
      description?: string | null
      createdAt?: string
      path: { label: string; icon: string }[]
      stats: { label: string; value: number; icon: string }[]
    }

const KIND_META: Record<ArchiveDetailTarget['kind'], { icon: string; openLabel: string }> = {
  warehouse: { icon: '🏛️', openLabel: 'ເປີດຄັງເອກະສານ' },
  cabinet: { icon: '🗄️', openLabel: 'ເປີດຕູ້ເອກະສານ' },
  shelf: { icon: '🪜', openLabel: 'ເປີດຊັ້ນວາງ' },
  folder: { icon: '📁', openLabel: 'ເປີດແຟ້ມເອກະສານ' },
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-50 py-2.5 last:border-0 last:pb-0">
      <span className="shrink-0 text-xs text-gray-400">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium text-gray-800">{children}</span>
    </div>
  )
}

export function toWarehouseDetail(
  w: Warehouse,
  stat: { cabinets: number; folders: number; docs: number },
): ArchiveDetailTarget {
  return {
    kind: 'warehouse',
    name: w.name,
    division: w.division,
    description: w.description,
    createdAt: w.createdAt,
    path: [{ label: w.name, icon: '🏛️' }],
    stats: [
      { label: 'ຕູ້', value: stat.cabinets, icon: '🗄️' },
      { label: 'ແຟ້ມ', value: stat.folders, icon: '📁' },
      { label: 'ເອກະສານ', value: stat.docs, icon: '📄' },
    ],
  }
}

export function toCabinetDetail(
  c: Cabinet,
  stat: { shelves: number; folders: number; docs: number },
  warehouseName?: string,
): ArchiveDetailTarget {
  return {
    kind: 'cabinet',
    name: c.name,
    division: c.division,
    department: c.department,
    description: c.description,
    createdAt: c.createdAt,
    path: [
      { label: warehouseName || 'ຄັງທົ່ວໄປ', icon: '🏛️' },
      { label: c.name, icon: '🗄️' },
    ],
    stats: [
      { label: 'ຊັ້ນວາງ', value: stat.shelves, icon: '🪜' },
      { label: 'ແຟ້ມ', value: stat.folders, icon: '📁' },
      { label: 'ເອກະສານ', value: stat.docs, icon: '📄' },
    ],
  }
}

export function toShelfDetail(
  s: Shelf,
  stat: { folders: number; docs: number },
  path: { label: string; icon: string }[],
): ArchiveDetailTarget {
  return {
    kind: 'shelf',
    name: s.name,
    description: s.description,
    createdAt: s.createdAt,
    path,
    stats: [
      { label: 'ແຟ້ມ', value: stat.folders, icon: '📁' },
      { label: 'ເອກະສານ', value: stat.docs, icon: '📄' },
    ],
  }
}

export function toFolderDetail(
  f: Folder,
  stat: { docs: number },
  path: { label: string; icon: string }[],
): ArchiveDetailTarget {
  return {
    kind: 'folder',
    name: f.name,
    description: f.description,
    createdAt: f.createdAt,
    path,
    stats: [{ label: 'ເອກະສານ', value: stat.docs, icon: '📄' }],
  }
}

export function ArchiveDetailModal({ target, onClose, onOpen }: {
  target: ArchiveDetailTarget | null
  onClose: () => void
  onOpen: () => void
}) {
  const meta = target ? KIND_META[target.kind] : null
  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={target ? `${meta!.icon} ${target.name}` : undefined}
      footer={
        target && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              ປິດ
            </button>
            <button
              onClick={onOpen}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {meta!.openLabel} →
            </button>
          </div>
        )
      }
    >
      {target && (
        <div className="space-y-4">
          <div className="rounded-xl bg-gray-50 p-3">
            <div className="mb-1.5 text-xs font-medium text-gray-400">📍 ເສັ້ນທາງບ່ອນເກັບ</div>
            <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-gray-800">
              {target.path.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1.5">
                  {i > 0 && <span className="text-gray-300">›</span>}
                  <span className="inline-flex items-center gap-1">
                    {p.icon} {p.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div className={`grid gap-2 ${target.stats.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {target.stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-3 text-center">
                <div className="text-lg">{s.icon}</div>
                <div className="mt-1 text-xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-100 p-3">
            <MetaRow label="ລາຍລະອຽດ">
              <span className="font-normal text-gray-600">
                {target.description || 'ບໍ່ມີລາຍລະອຽດ'}
              </span>
            </MetaRow>
            {(target.kind === 'warehouse' || target.kind === 'cabinet') && target.division && (
              <MetaRow label="ຝ່າຍ">{target.division}</MetaRow>
            )}
            {target.kind === 'cabinet' && target.department && (
              <MetaRow label="ພະແນກ">{target.department}</MetaRow>
            )}
            <MetaRow label="ສ້າງເມື່ອ">{formatDate(target.createdAt)}</MetaRow>
          </div>
        </div>
      )}
    </Modal>
  )
}

