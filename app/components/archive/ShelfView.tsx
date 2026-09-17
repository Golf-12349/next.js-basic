"use client"
import { useState, useMemo } from 'react'
import { FileText, FolderArchive, Plus, Trash2, Search, RotateCcw } from 'lucide-react'
import type { Cabinet, Document, Folder, Shelf, Warehouse } from '@/types/document'
import Pagination from '@/app/components/ui/Pagination'

// ── Shelf Card (ຊັ້ນວາງເອກະສານ) ──────────────────────────────
interface ShelfCardProps {
  shelf: Shelf;
  warehouseName?: string;
  cabinetName?: string;
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

function ShelfCard({
  shelf,
  warehouseName,
  cabinetName,
  folderCount,
  docCount,
  canManage = true,
  onOpen,
  onDelete,
}: ShelfCardProps) {
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl transition group-hover:scale-105">
            🪜
          </div>
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

        <h3 className="mt-4 text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
          {shelf.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {shelf.description || 'ບໍ່ມີລາຍລະອຽດ'}
        </p>

        {/* Storage Location Badges: Warehouse & Cabinet */}
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
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400">ສ້າງເມື່ອ {formatDate(shelf.createdAt)}</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            <FolderArchive size={12} />
            {folderCount} ແຟ້ມ
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
            <FileText size={12} />
            {docCount} ເອກະສານ
          </span>
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
}

function EmptyState({ icon, message, subMessage, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl">
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

// ── Shelf View (ຊັ້ນວາງເອກະສານ) ──────────────────────────────
interface ShelfViewProps {
  cabinet?: Cabinet;
  cabinets?: Cabinet[];
  warehouses?: Warehouse[];
  shelves: Shelf[];
  folders: Folder[];
  documents: Document[];
  canManage?: boolean;
  onCreate: () => void;
  onOpen: (shelfId: string) => void;
  onDelete: (shelf: Shelf) => void;
}

export default function ShelfView({
  cabinet,
  cabinets = [],
  warehouses = [],
  shelves = [],
  folders = [],
  documents = [],
  canManage = true,
  onCreate,
  onOpen,
  onDelete,
}: ShelfViewProps) {
  const [filterWarehouseId, setFilterWarehouseId] = useState<string>('all');
  const [filterCabinetId, setFilterCabinetId] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30;

  // Available cabinets for dropdown (cascading from warehouse)
  const availableCabinets = useMemo(() => {
    if (cabinet) return [cabinet];
    if (filterWarehouseId === 'all') return cabinets;
    return cabinets.filter((c) => c.warehouseId === filterWarehouseId);
  }, [cabinet, cabinets, filterWarehouseId]);

  // Filtered shelves
  const filteredShelves = useMemo(() => {
    return shelves.filter((s) => {
      // Warehouse filter
      if (filterWarehouseId !== 'all') {
        const cab = cabinets.find((c) => c.id === s.cabinetId);
        if (!cab || cab.warehouseId !== filterWarehouseId) return false;
      }
      // Cabinet filter
      if (filterCabinetId !== 'all' && s.cabinetId !== filterCabinetId) {
        return false;
      }
      // Search
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchName = s.name?.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [shelves, filterWarehouseId, filterCabinetId, searchFilter, cabinets]);

  const isFiltered =
    filterWarehouseId !== 'all' ||
    filterCabinetId !== 'all' ||
    Boolean(searchFilter.trim());

  const resetFilters = () => {
    setFilterWarehouseId('all');
    setFilterCabinetId('all');
    setSearchFilter('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredShelves.length / PAGE_SIZE) || 1;
  const paginatedShelves = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredShelves.slice(start, start + PAGE_SIZE);
  }, [filteredShelves, currentPage]);

  const viewTitle = cabinet ? `ຊັ້ນວາງໃນຕູ້ ${cabinet.name}` : 'ຊັ້ນວາງເອກະສານທັງໝົດ';
  const viewSubtitle = cabinet
    ? `${cabinet.department} • ລວມ ${filteredShelves.length} ຊັ້ນວາງ`
    : `ລວມທັງໝົດ ${filteredShelves.length} ຊັ້ນວາງ`;

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              cabinet ? `bg-gradient-to-br ${cabinet.color || 'from-indigo-600 to-purple-600'}` : 'bg-blue-600'
            } text-xl text-white`}
          >
            {cabinet ? '🗄️' : '🪜'}
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
            <Plus size={16} /> ສ້າງຊັ້ນວາງໃໝ່
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
                placeholder="ຄົ້ນຫາຊື່ຊັ້ນວາງ..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-8 pr-3 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              ພົບ <strong className="font-semibold text-gray-800">{filteredShelves.length}</strong> ຊັ້ນວາງ
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

      {!filteredShelves || filteredShelves.length === 0 ? (
        <EmptyState
          icon="🪜"
          message={
            isFiltered
              ? "ບໍ່ພົບຊັ້ນວາງທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ"
              : cabinet
              ? "ຍັງບໍ່ມີຊັ້ນວາງໃນຕູ້ນີ້"
              : "ຍັງບໍ່ມີຊັ້ນວາງເອກະສານ"
          }
          subMessage={isFiltered ? "ລອງປ່ຽນຕົວກອງ ຫຼື ຄຳຄົ້ນຫາໃໝ່" : "ສ້າງຊັ້ນວາງເພື່ອຈັດວາງແຟ້ມເກັບເອກະສານໃຫ້ເປັນລະບຽບ"}
          actionLabel={isFiltered ? "ລ້າງຕົວກອງ" : canManage ? "ສ້າງຊັ້ນວາງໃໝ່" : undefined}
          onAction={isFiltered ? resetFilters : canManage ? onCreate : undefined}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginatedShelves.map((shelf) => {
              const cab = cabinets.find((c) => c.id === shelf.cabinetId);
              const wh = cab?.warehouseId ? warehouses.find((w) => w.id === cab.warehouseId) : undefined;
              const shelfFolderList = folders.filter((f) => f.shelfId === shelf.id);
              const shelfFolderIds = new Set(shelfFolderList.map((f) => f.id));
              const docCount = documents.filter(
                (d) =>
                  !d.deleted &&
                  (d.shelfId === shelf.id || (d.folderId && shelfFolderIds.has(d.folderId)))
              ).length;

              return (
                <ShelfCard
                  key={shelf.id}
                  shelf={shelf}
                  warehouseName={wh?.name}
                  cabinetName={cab?.name}
                  canManage={canManage}
                  folderCount={shelfFolderList.length}
                  docCount={docCount}
                  onOpen={() => onOpen(shelf.id)}
                  onDelete={() => onDelete(shelf)}
                />
              );
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredShelves.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}
