"use client"
import { useState, useMemo } from 'react'
import { Plus, Trash2, Search, RotateCcw } from 'lucide-react'
import type { Cabinet, Document, Folder, Shelf, Warehouse } from '@/types/document'
import { edlStructure } from '@/types/user'
import Pagination from '@/app/components/ui/Pagination'
import ArchiveListView, { ViewToggle, useArchiveSort } from './ArchiveListView'
import type { ArchiveColumn } from './ArchiveListView'
import type { ViewMode } from './useArchive'

// ── Cabinet Card ─────────────────────────────────────────────
interface CabinetCardProps {
  cabinet: Cabinet;
  warehouseName?: string;
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

function CabinetCard({
  cabinet,
  warehouseName,
  shelfCount,
  folderCount,
  docCount,
  canManage = true,
  onOpen,
  onDelete,
}: CabinetCardProps) {
  const gradient = cabinet.color && cabinet.color.startsWith('from-')
    ? cabinet.color
    : 'from-indigo-600 to-purple-600';

  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between"
    >
      <div>
        <div className={`bg-gradient-to-br ${gradient} px-5 py-6 text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-xl backdrop-blur-sm">
              🗄️
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {shelfCount} ຊັ້ນວາງ
              </span>
              {canManage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="rounded-lg bg-white/10 p-1.5 text-white/80 transition hover:bg-rose-500 hover:text-white"
                  title="ລຶບຕູ້"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">{cabinet.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-white/90">
            <span className="inline-flex items-center gap-1 rounded bg-black/25 px-2 py-0.5 backdrop-blur-xs font-medium">
              🏛️ {warehouseName || 'ຄັງເອກະສານທົ່ວໄປ'}
            </span>
            {cabinet.division && (
              <span className="rounded bg-white/15 px-2 py-0.5 backdrop-blur-xs">
                {cabinet.division}
              </span>
            )}
            {cabinet.department && (
              <span className="text-white/80">
                • {cabinet.department}
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            {cabinet.description || 'ບໍ່ມີລາຍລະອຽດ'}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">ສ້າງເມື່ອ {formatDate(cabinet.createdAt)}</span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              {folderCount} ແຟ້ມ
            </span>
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              {docCount} ເອກະສານ
            </span>
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
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
    >
      <Plus size={16} /> {actionLabel}
    </button>
  ) : href ? (
    <a
      href={href}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
    >
      <Plus size={16} /> {actionLabel}
    </a>
  ) : null;

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl">
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
  warehouse?: Warehouse;
  warehouses?: Warehouse[];
  cabinets: Cabinet[];
  shelves?: Shelf[];
  folders?: Folder[];
  documents?: Document[];
  canManage?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onCreate: () => void;
  onOpen: (cabinetId: string) => void;
  onDelete: (cabinet: Cabinet) => void;
}

/** ຄ່າສະຖິຕິເລີ່ມຕົ້ນ ສຳລັບຕູ້ທີ່ຍັງບໍ່ມີຂໍ້ມູນ */
type CabinetStats = { shelves: number; folders: number; docs: number };
const EMPTY_CABINET_STATS: CabinetStats = { shelves: 0, folders: 0, docs: 0 };

export default function CabinetView({
  warehouse,
  warehouses = [],
  cabinets = [],
  shelves = [],
  folders = [],
  documents = [],
  canManage = true,
  viewMode = 'grid',
  onViewModeChange,
  onCreate,
  onOpen,
  onDelete,
}: CabinetViewProps) {
  const [filterWarehouseId, setFilterWarehouseId] = useState<string>('all');
  const [filterDivision, setFilterDivision] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30;

  // Unique divisions from edlStructure + cabinets
  const divisionOptions = useMemo(() => {
    const list = new Set<string>(Object.keys(edlStructure));
    cabinets.forEach((c) => {
      if (c.division) list.add(c.division);
    });
    return Array.from(list);
  }, [cabinets]);

  // Departments for selected division
  const departmentOptions = useMemo(() => {
    if (filterDivision === 'all') {
      const depts = new Set<string>();
      cabinets.forEach((c) => {
        if (c.department) depts.add(c.department);
      });
      return Array.from(depts);
    }
    const standardDepts = edlStructure[filterDivision] || [];
    const customDepts = cabinets
      .filter((c) => c.division === filterDivision && c.department)
      .map((c) => c.department);
    return Array.from(new Set([...standardDepts, ...customDepts]));
  }, [filterDivision, cabinets]);

  // Filtered cabinets
  const filteredCabinets = useMemo(() => {
    return cabinets.filter((c) => {
      // Warehouse filter
      if (filterWarehouseId !== 'all' && c.warehouseId !== filterWarehouseId) {
        return false;
      }
      // Division filter
      if (filterDivision !== 'all' && c.division !== filterDivision) {
        return false;
      }
      // Department filter
      if (filterDepartment !== 'all' && c.department !== filterDepartment) {
        return false;
      }
      // Search filter
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchDesc = c.description?.toLowerCase().includes(q);
        const matchDept = c.department?.toLowerCase().includes(q);
        const matchDiv = c.division?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchDept && !matchDiv) return false;
      }
      return true;
    });
  }, [cabinets, filterWarehouseId, filterDivision, filterDepartment, searchFilter]);

  const isFiltered =
    filterWarehouseId !== 'all' ||
    filterDivision !== 'all' ||
    filterDepartment !== 'all' ||
    Boolean(searchFilter.trim());

  const resetFilters = () => {
    setFilterWarehouseId('all');
    setFilterDivision('all');
    setFilterDepartment('all');
    setSearchFilter('');
    setCurrentPage(1);
  };

  // ── ສະຖິຕິຕໍ່ຕູ້ (ຊັ້ນວາງ / ແຟ້ມ / ເອກະສານ) — ໃຊ້ຮ່ວມທັງມຸມມອງບັດ ແລະ ລາຍການ
  const warehouseById = useMemo(() => {
    const map = new Map<string, Warehouse>();
    warehouses.forEach((w) => map.set(w.id, w));
    return map;
  }, [warehouses]);

  const cabinetStats = useMemo(() => {
    const stats = new Map<string, CabinetStats>();
    cabinets.forEach((c) => stats.set(c.id, { shelves: 0, folders: 0, docs: 0 }));

    shelves.forEach((s) => {
      const entry = stats.get(s.cabinetId);
      if (entry) entry.shelves += 1;
    });

    // ແຟ້ມ → ຕູ້ (ຈັບຄູ່ທັງ id ແລະ ຊື່ແຟ້ມ) ເພື່ອນັບເອກະສານທີ່ອ້າງອີງເຖິງແຟ້ມ
    const folderCabinet = new Map<string, string>();
    folders.forEach((f) => {
      const entry = stats.get(f.cabinetId);
      if (entry) entry.folders += 1;
      folderCabinet.set(f.id, f.cabinetId);
      if (f.name) folderCabinet.set(f.name, f.cabinetId);
    });

    documents.forEach((d) => {
      if (d.deleted) return;
      const targets = new Set<string>();
      if (d.cabinetId) targets.add(d.cabinetId);
      const byFolderId = d.folderId ? folderCabinet.get(d.folderId) : undefined;
      const byFolderName = d.folderName ? folderCabinet.get(d.folderName) : undefined;
      if (byFolderId) targets.add(byFolderId);
      if (byFolderName) targets.add(byFolderName);
      targets.forEach((id) => {
        const entry = stats.get(id);
        if (entry) entry.docs += 1;
      });
    });

    return stats;
  }, [cabinets, shelves, folders, documents]);

  const totalPages = Math.ceil(filteredCabinets.length / PAGE_SIZE) || 1;
  // ── ຄໍລໍາຂອງມຸມມອງລາຍການ (list view)
  const columns = useMemo<ArchiveColumn<Cabinet>[]>(
    () => [
      {
        key: 'name',
        header: 'ຊື່ຕູ້ເອກະສານ',
        sortValue: (c) => c.name ?? '',
        render: (c) => (
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-base">
              🗄️
            </span>
            <div className="min-w-0">
              <div className="truncate font-semibold text-gray-900">{c.name}</div>
              {c.description && <div className="truncate text-xs text-gray-400">{c.description}</div>}
            </div>
          </div>
        ),
      },
      {
        key: 'warehouse',
        header: 'ຄັງເອກະສານ',
        className: 'hidden md:table-cell',
        sortValue: (c) => (c.warehouseId ? warehouseById.get(c.warehouseId)?.name ?? '' : ''),
        render: (c) => (
          <span className="inline-flex items-center gap-1 rounded-md border border-purple-100 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
            🏛️ {c.warehouseId ? warehouseById.get(c.warehouseId)?.name ?? 'ຄັງທົ່ວໄປ' : 'ຄັງທົ່ວໄປ'}
          </span>
        ),
      },
      {
        key: 'division',
        header: 'ຝ່າຍ / ພະແນກ',
        className: 'hidden lg:table-cell',
        sortValue: (c) => `${c.division ?? ''} ${c.department ?? ''}`,
        render: (c) => (
          <div className="text-xs">
            <div className="font-medium text-gray-800">{c.division || '—'}</div>
            {c.department && <div className="text-gray-400">{c.department}</div>}
          </div>
        ),
      },
      {
        key: 'shelves',
        header: 'ຊັ້ນວາງ',
        align: 'center',
        sortValue: (c) => (cabinetStats.get(c.id) ?? EMPTY_CABINET_STATS).shelves,
        render: (c) => (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {(cabinetStats.get(c.id) ?? EMPTY_CABINET_STATS).shelves}
          </span>
        ),
      },
      {
        key: 'folders',
        header: 'ແຟ້ມ',
        align: 'center',
        className: 'hidden lg:table-cell',
        sortValue: (c) => (cabinetStats.get(c.id) ?? EMPTY_CABINET_STATS).folders,
        render: (c) => (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            {(cabinetStats.get(c.id) ?? EMPTY_CABINET_STATS).folders}
          </span>
        ),
      },
      {
        key: 'docs',
        header: 'ເອກະສານ',
        align: 'center',
        sortValue: (c) => (cabinetStats.get(c.id) ?? EMPTY_CABINET_STATS).docs,
        render: (c) => (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
            {(cabinetStats.get(c.id) ?? EMPTY_CABINET_STATS).docs} ເອກະສານ
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'ສ້າງເມື່ອ',
        className: 'hidden xl:table-cell',
        sortValue: (c) => c.createdAt ?? '',
        render: (c) => <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>,
      },
    ],
    [warehouseById, cabinetStats],
  );

  const { sortKey, sortDir, toggleSort, sortRows } = useArchiveSort(columns);

  // ຈັດລຳດັບກ່ອນ ແລ້ວຈຶ່ງຕັດໜ້າ
  const sortedCabinets = useMemo(() => sortRows(filteredCabinets), [filteredCabinets, sortRows]);

  const paginatedCabinets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedCabinets.slice(start, start + PAGE_SIZE);
  }, [sortedCabinets, currentPage]);

  const viewTitle = warehouse ? `ຕູ້ເອກະສານໃນ ${warehouse.name}` : 'ຕູ້ເອກະສານທັງໝົດ';
  const viewSubtitle = warehouse
    ? `ຄັງ: ${warehouse.name} • ລວມ ${filteredCabinets.length} ຕູ້`
    : `ລວມທັງໝົດ ${filteredCabinets.length} ຕູ້`;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-xl text-white">
            🗄️
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">{viewTitle}</h2>
            <p className="text-xs text-gray-500">{viewSubtitle}</p>
          </div>
        </div>
        {canManage && (
          <button
            onClick={onCreate}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
          >
            <Plus size={16} /> ສ້າງຕູ້ເອກະສານໃໝ່
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Warehouse Filter */}
            {warehouses.length > 0 && (
              <div className="flex items-center gap-1.5 min-w-[160px]">
                <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">🏛️ ຄັງ:</span>
                <select
                  value={filterWarehouseId}
                  onChange={(e) => {
                    setFilterWarehouseId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">ທຸກຄັງເອກະສານ</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Division Filter */}
            <div className="flex items-center gap-1.5 min-w-[160px]">
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">🏢 ຝ່າຍ:</span>
              <select
                value={filterDivision}
                onChange={(e) => {
                  setFilterDivision(e.target.value);
                  setFilterDepartment('all');
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">ທຸກຝ່າຍ / ຫ້ອງການ</option>
                {divisionOptions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5 min-w-[160px]">
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">🏬 ພະແນກ:</span>
              <select
                value={filterDepartment}
                onChange={(e) => {
                  setFilterDepartment(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">ທຸກພະແນກ</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[180px] flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ຄົ້ນຫາຊື່ຕູ້, ພະແນກ..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-8 pr-3 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewModeChange && <ViewToggle mode={viewMode} onChange={onViewModeChange} />}
            <span className="text-xs text-gray-500">
              ພົບ <strong className="font-semibold text-gray-800">{filteredCabinets.length}</strong> ຕູ້
            </span>
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                title="ລ້າງຕົວກອງ"
              >
                <RotateCcw size={12} /> ລ້າງຕົວກອງ
              </button>
            )}
          </div>
        </div>
      </div>

      {!filteredCabinets || filteredCabinets.length === 0 ? (
        <EmptyState
          icon="🗄️"
          message={isFiltered ? "ບໍ່ພົບຕູ້ເອກະສານທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ" : "ຍັງບໍ່ມີຕູ້ເອກະສານ"}
          subMessage={isFiltered ? "ລອງປ່ຽນຕົວກອງ ຫຼື ຄຳຄົ້ນຫາໃໝ່" : "ສ້າງຕູ້ເອກະສານເພື່ອຈັດແບ່ງຊັ້ນວາງ ແລະ ແຟ້ມເກັບເອກະສານ"}
          actionLabel={isFiltered ? "ລ້າງຕົວກອງ" : canManage ? "ສ້າງຕູ້ເອກະສານໃໝ່" : undefined}
          onAction={isFiltered ? resetFilters : canManage ? onCreate : undefined}
        />
      ) : (
        <div className="space-y-4">
          {viewMode === 'list' ? (
            <ArchiveListView
              rows={paginatedCabinets}
              columns={columns}
              rowKey={(c) => c.id}
              onOpen={(c) => onOpen(c.id)}
              canManage={canManage}
              onDelete={(c) => onDelete(c)}
              deleteTitle="ລຶບຕູ້"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              indexOffset={(currentPage - 1) * PAGE_SIZE}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paginatedCabinets.map((cabinet) => {
                const wh = cabinet.warehouseId ? warehouseById.get(cabinet.warehouseId) : undefined;
                const stat = cabinetStats.get(cabinet.id) ?? EMPTY_CABINET_STATS;

                return (
                  <CabinetCard
                    key={cabinet.id}
                    cabinet={cabinet}
                    warehouseName={wh?.name}
                    shelfCount={stat.shelves}
                    folderCount={stat.folders}
                    docCount={stat.docs}
                    canManage={canManage}
                    onOpen={() => onOpen(cabinet.id)}
                    onDelete={() => onDelete(cabinet)}
                  />
                );
              })}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCabinets.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}