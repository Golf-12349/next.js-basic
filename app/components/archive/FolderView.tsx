"use client"
import { useState, useMemo } from 'react'
import { FileText, Plus, Trash2, Search, RotateCcw } from 'lucide-react'
import type { Cabinet, Document, Folder, Shelf, Warehouse } from '@/types/document'
import Pagination from '@/app/components/ui/Pagination'

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
      className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl transition group-hover:scale-105">
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

        <h3 className="mt-4 text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
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

      <div className="mt-4 flex items-center justify-between pt-2 border-t border-gray-50">
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
  warehouses?: Warehouse[];
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
  warehouses = [],
  folders = [],
  documents = [],
  canManage = true,
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

  const totalPages = Math.ceil(filteredFolders.length / PAGE_SIZE) || 1;
  const paginatedFolders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredFolders.slice(start, start + PAGE_SIZE);
  }, [filteredFolders, currentPage]);

  const viewTitle = shelf ? `ແຟ້ມໃນ ${shelf.name}` : cabinet ? `ແຟ້ມໃນຕູ້ ${cabinet.name}` : 'ແຟ້ມເກັບເອກະສານທັງໝົດ';
  const viewSubtitle = shelf
    ? `ຕູ້: ${cabinet?.name || '—'} • ລວມ ${filteredFolders.length} ແຟ້ມ`
    : cabinet
    ? `${cabinet.department} • ລວມ ${filteredFolders.length} ແຟ້ມ`
    : `ລວມທັງໝົດ ${filteredFolders.length} ແຟ້ມ`;

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

      {/* Filter Toolbar */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginatedFolders.map((folder) => {
              const cab = cabinets.find((c) => c.id === folder.cabinetId);
              const sh = shelves.find((s) => s.id === folder.shelfId);
              const wh = cab?.warehouseId ? warehouses.find((w) => w.id === cab.warehouseId) : undefined;
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
                  warehouseName={wh?.name}
                  cabinetName={cab?.name}
                  shelfName={sh?.name}
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
            totalItems={filteredFolders.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}