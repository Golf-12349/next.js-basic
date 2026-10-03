"use client"
import { useState, useMemo } from 'react'
import { FileText, Plus, Trash2, Search, RotateCcw } from 'lucide-react'
import type { Cabinet, Document, Folder, Shelf, Warehouse } from '@/types/document'
import Pagination from '@/app/components/ui/Pagination'
import ArchiveListView, { ViewToggle, useArchiveSort } from './ArchiveListView'
import type { ArchiveColumn } from './ArchiveListView'
import type { ViewMode } from './useArchive'

// ── Folder Card (ແຟ້ມເກັບເອກະສານ) ──────────────────────────────
interface FolderCardProps {
  folder: Folder;
  warehouseName?: string;
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

/** ຄ່າສະຖິຕິເລີ່ມຕົ້ນ ສຳລັບແຟ້ມທີ່ຍັງບໍ່ມີຂໍ້ມູນ */
type FolderStats = { docs: number };
const EMPTY_FOLDER_STATS: FolderStats = { docs: 0 };

function FolderCard({
  folder,
  warehouseName,
  cabinetName,
  shelfName,
  docCount,
  canManage = true,
  onOpen,
  onDelete,
}: FolderCardProps) {
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-xl transition group-hover:scale-105">
            📁
          </div>
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

        <h3 className="mt-3 text-base font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
          {folder.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {folder.description || 'ບໍ່ມີລາຍລະອຽດ'}
        </p>

        {/* Storage Location Badges: Warehouse, Cabinet, Shelf */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-gray-100">
          <span
            className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-100"
            title="ຄັງເອກະສານ"
          >
            🏛️ {warehouseName || 'ຄັງທົ່ວໄປ'}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200"
            title="ຕູ້ເອກະສານ"
          >
            🗄️ {cabinetName || 'ບໍ່ມີຕູ້'}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-100"
            title="ຊັ້ນວາງ"
          >
            🪜 {shelfName || 'ຕັ້ງໃນຕູ້ໂດຍກົງ'}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-50">
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
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl">
        {icon}
      </div>
      <p className="text-gray-500">{message}</p>
      {subMessage && <p className="mt-1 text-xs text-gray-400">{subMessage}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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
  warehouses?: Warehouse[];
  folders: Folder[];
  documents: Document[];
  canManage?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onCreate: () => void;
  onOpen: (folderId: string) => void;
  onDelete: (folder: Folder) => void;
}

export default function FolderView({
  cabinet,
  cabinets = [],
  shelf,
  shelves = [],
  warehouses = [],
  folders = [],
  documents = [],
  canManage = true,
  viewMode = 'list',
  onViewModeChange,
  onCreate,
  onOpen,
  onDelete,
}: FolderViewProps) {
  const [filterWarehouseId, setFilterWarehouseId] = useState<string>('all');
  const [filterCabinetId, setFilterCabinetId] = useState<string>('all');
  const [filterShelfId, setFilterShelfId] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30;

  // Available cabinets for dropdown (cascading from warehouse)
  const availableCabinets = useMemo(() => {
    if (cabinet) return [cabinet];
    if (filterWarehouseId === 'all') return cabinets;
    return cabinets.filter((c) => c.warehouseId === filterWarehouseId);
  }, [cabinet, cabinets, filterWarehouseId]);

  // Available shelves for dropdown (cascading from cabinet/warehouse)
  const availableShelves = useMemo(() => {
    if (shelf) return [shelf];
    if (filterCabinetId !== 'all') {
      return shelves.filter((s) => s.cabinetId === filterCabinetId);
    }
    if (filterWarehouseId !== 'all') {
      const cabIds = new Set(availableCabinets.map((c) => c.id));
      return shelves.filter((s) => cabIds.has(s.cabinetId));
    }
    return shelves;
  }, [shelf, shelves, filterCabinetId, filterWarehouseId, availableCabinets]);

  // Filtered folders
  const filteredFolders = useMemo(() => {
    return folders.filter((f) => {
      // Warehouse filter
      if (filterWarehouseId !== 'all') {
        const cab = cabinets.find((c) => c.id === f.cabinetId);
        if (!cab || cab.warehouseId !== filterWarehouseId) return false;
      }
      // Cabinet filter
      if (filterCabinetId !== 'all' && f.cabinetId !== filterCabinetId) {
        return false;
      }
      // Shelf filter
      if (filterShelfId !== 'all') {
        if (filterShelfId === 'none') {
          if (f.shelfId) return false;
        } else if (f.shelfId !== filterShelfId) {
          return false;
        }
      }
      // Search
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchName = f.name?.toLowerCase().includes(q);
        const matchDesc = f.description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [folders, filterWarehouseId, filterCabinetId, filterShelfId, searchFilter, cabinets]);

  const isFiltered =
    filterWarehouseId !== 'all' ||
    filterCabinetId !== 'all' ||
    filterShelfId !== 'all' ||
    Boolean(searchFilter.trim());

  const resetFilters = () => {
    setFilterWarehouseId('all');
    setFilterCabinetId('all');
    setFilterShelfId('all');
    setSearchFilter('');
    setCurrentPage(1);
  };

  // ── ແຜນທີ່ອ້າງອີງ ສຳລັບສະແດງຊື່ຄັງ / ຕູ້ / ຊັ້ນວາງ
  const cabinetById = useMemo(() => {
    const map = new Map<string, Cabinet>();
    cabinets.forEach((c) => map.set(c.id, c));
    return map;
  }, [cabinets]);

  const warehouseById = useMemo(() => {
    const map = new Map<string, Warehouse>();
    warehouses.forEach((w) => map.set(w.id, w));
    return map;
  }, [warehouses]);

  const shelfById = useMemo(() => {
    const map = new Map<string, Shelf>();
    shelves.forEach((s) => map.set(s.id, s));
    return map;
  }, [shelves]);

  // ── ສະຖິຕິຈຳນວນເອກະສານຕໍ່ແຟ້ມ — ໃຊ້ຮ່ວມທັງມຸມມອງບັດ ແລະ ລາຍການ
  const folderStats = useMemo(() => {
    const stats = new Map<string, FolderStats>();
    folders.forEach((f) => stats.set(f.id, { docs: 0 }));

    // ແຟ້ມອາດຖືກອ້າງອີງດ້ວຍຊື່ (folderName) ໃນເອກະສານເກົ່າ
    const byName = new Map<string, string[]>();
    folders.forEach((f) => {
      if (!f.name) return;
      const list = byName.get(f.name) ?? [];
      list.push(f.id);
      byName.set(f.name, list);
    });

    documents.forEach((d) => {
      if (d.deleted) return;
      const targets = new Set<string>();
      if (d.folderId && stats.has(d.folderId)) targets.add(d.folderId);
      if (d.folderName) (byName.get(d.folderName) ?? []).forEach((id) => targets.add(id));
      targets.forEach((id) => {
        const entry = stats.get(id);
        if (entry) entry.docs += 1;
      });
    });

    return stats;
  }, [folders, documents]);

  // ── ຄໍລໍາຂອງມຸມມອງລາຍການ (list view)
  const columns = useMemo<ArchiveColumn<Folder>[]>(
    () => [
      {
        key: 'name',
        header: 'ຊື່ແຟ້ມ',
        sortValue: (f) => f.name ?? '',
        render: (f) => (
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-base">
              📁
            </span>
            <div className="min-w-0">
              <div className="truncate font-semibold text-gray-900">{f.name}</div>
              {f.description && <div className="truncate text-xs text-gray-400">{f.description}</div>}
            </div>
          </div>
        ),
      },
      {
        key: 'warehouse',
        header: 'ຄັງເອກະສານ',
        className: 'hidden md:table-cell',
        sortValue: (f) => {
          const cab = cabinetById.get(f.cabinetId);
          return cab?.warehouseId ? warehouseById.get(cab.warehouseId)?.name ?? '' : '';
        },
        render: (f) => {
          const cab = cabinetById.get(f.cabinetId);
          const wh = cab?.warehouseId ? warehouseById.get(cab.warehouseId) : undefined;
          return (
            <span className="inline-flex items-center gap-1 rounded-md border border-purple-100 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
              🏛️ {wh?.name || 'ຄັງທົ່ວໄປ'}
            </span>
          );
        },
      },
      {
        key: 'cabinet',
        header: 'ຕູ້ເອກະສານ',
        className: 'hidden lg:table-cell',
        sortValue: (f) => cabinetById.get(f.cabinetId)?.name ?? '',
        render: (f) => (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            🗄️ {cabinetById.get(f.cabinetId)?.name || 'ບໍ່ມີຕູ້'}
          </span>
        ),
      },
      {
        key: 'shelf',
        header: 'ຊັ້ນວາງ',
        className: 'hidden lg:table-cell',
        sortValue: (f) => (f.shelfId ? shelfById.get(f.shelfId)?.name ?? '' : ''),
        render: (f) => {
          const sh = f.shelfId ? shelfById.get(f.shelfId) : undefined;
          return (
            <span className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              🪜 {sh?.name || 'ບໍ່ມີຊັ້ນວາງ'}
            </span>
          );
        },
      },
      {
        key: 'docs',
        header: 'ເອກະສານ',
        align: 'center',
        sortValue: (f) => (folderStats.get(f.id) ?? EMPTY_FOLDER_STATS).docs,
        render: (f) => (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
            {(folderStats.get(f.id) ?? EMPTY_FOLDER_STATS).docs} ເອກະສານ
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'ສ້າງເມື່ອ',
        className: 'hidden xl:table-cell',
        sortValue: (f) => f.createdAt ?? '',
        render: (f) => <span className="text-xs text-gray-400">{formatDate(f.createdAt)}</span>,
      },
    ],
    [cabinetById, warehouseById, shelfById, folderStats],
  );

  const { sortKey, sortDir, toggleSort, sortRows } = useArchiveSort(columns);

  // ຈັດລຳດັບກ່ອນ ແລ້ວຈຶ່ງຕັດໜ້າ
  const sortedFolders = useMemo(() => sortRows(filteredFolders), [filteredFolders, sortRows]);

  const totalPages = Math.ceil(filteredFolders.length / PAGE_SIZE) || 1;
  const paginatedFolders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedFolders.slice(start, start + PAGE_SIZE);
  }, [sortedFolders, currentPage]);

  const viewTitle = shelf ? `ແຟ້ມໃນ ${shelf.name}` : cabinet ? `ແຟ້ມໃນຕູ້ ${cabinet.name}` : 'ແຟ້ມເກັບເອກະສານທັງໝົດ';
  const viewSubtitle = shelf
    ? `ຕູ້: ${cabinet?.name || '—'} • ລວມ ${filteredFolders.length} ແຟ້ມ`
    : cabinet
    ? `${cabinet.department} • ລວມ ${filteredFolders.length} ແຟ້ມ`
    : `ລວມທັງໝົດ ${filteredFolders.length} ແຟ້ມ`;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-xl text-white">
            📁
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
            <Plus size={16} /> ສ້າງແຟ້ມໃໝ່
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Warehouse Filter */}
            {!cabinet && warehouses.length > 0 && (
              <div className="flex items-center gap-1.5 min-w-[160px]">
                <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">🏛️ ຄັງ:</span>
                <select
                  value={filterWarehouseId}
                  onChange={(e) => {
                    setFilterWarehouseId(e.target.value);
                    setFilterCabinetId('all');
                    setFilterShelfId('all');
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

            {/* Cabinet Filter */}
            {!cabinet && (
              <div className="flex items-center gap-1.5 min-w-[160px]">
                <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">🗄️ ຕູ້:</span>
                <select
                  value={filterCabinetId}
                  onChange={(e) => {
                    setFilterCabinetId(e.target.value);
                    setFilterShelfId('all');
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">ທຸກຕູ້ເອກະສານ</option>
                  {availableCabinets.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Shelf Filter */}
            {!shelf && (
              <div className="flex items-center gap-1.5 min-w-[160px]">
                <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">🪜 ຊັ້ນວາງ:</span>
                <select
                  value={filterShelfId}
                  onChange={(e) => {
                    setFilterShelfId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">ທຸກຊັ້ນວາງ</option>
                  <option value="none">ຕັ້ງໃນຕູ້ໂດຍກົງ (ບໍ່ມີຊັ້ນ)</option>
                  {availableShelves.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                placeholder="ຄົ້ນຫາຊື່ແຟ້ມ..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-8 pr-3 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewModeChange && <ViewToggle mode={viewMode} onChange={onViewModeChange} />}
            <span className="text-xs text-gray-500">
              ພົບ <strong className="font-semibold text-gray-800">{filteredFolders.length}</strong> ແຟ້ມ
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

      {!filteredFolders || filteredFolders.length === 0 ? (
        <EmptyState
          icon="📁"
          message={
            isFiltered
              ? "ບໍ່ພົບແຟ້ມເອກະສານທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ"
              : shelf
              ? "ຍັງບໍ່ມີແຟ້ມໃນຊັ້ນວາງນີ້"
              : cabinet
              ? "ຍັງບໍ່ມີແຟ້ມໃນຕູ້ນີ້"
              : "ຍັງບໍ່ມີແຟ້ມເກັບເອກະສານ"
          }
          subMessage={isFiltered ? "ລອງປ່ຽນຕົວກອງ ຫຼື ຄຳຄົ້ນຫາໃໝ່" : "ສ້າງແຟ້ມເກັບເອກະສານເພື່ອບັນຈຸເອກະສານຕົວຈິງ"}
          actionLabel={isFiltered ? "ລ້າງຕົວກອງ" : canManage ? "ສ້າງແຟ້ມໃໝ່" : undefined}
          onAction={isFiltered ? resetFilters : canManage ? onCreate : undefined}
        />
      ) : (
        <div className="space-y-4">
          {viewMode === 'list' ? (
            <ArchiveListView
              rows={paginatedFolders}
              columns={columns}
              rowKey={(f) => f.id}
              onOpen={(f) => onOpen(f.id)}
              canManage={canManage}
              onDelete={(f) => onDelete(f)}
              deleteTitle="ລຶບແຟ້ມ"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              indexOffset={(currentPage - 1) * PAGE_SIZE}
            />
          ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedFolders.map((folder) => {
              const cab = cabinetById.get(folder.cabinetId);
              const sh = folder.shelfId ? shelfById.get(folder.shelfId) : undefined;
              const wh = cab?.warehouseId ? warehouseById.get(cab.warehouseId) : undefined;
              const stat = folderStats.get(folder.id) ?? EMPTY_FOLDER_STATS;

              return (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  warehouseName={wh?.name}
                  cabinetName={cab?.name}
                  shelfName={sh?.name}
                  canManage={canManage}
                  docCount={stat.docs}
                  onOpen={() => onOpen(folder.id)}
                  onDelete={() => onDelete(folder)}
                />
              );
            })}
          </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredFolders.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}