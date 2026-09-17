"use client"
import { useState, useMemo } from 'react'
import { Building2, Plus, Trash2, Search, RotateCcw } from 'lucide-react'
import type { Cabinet, Document, Warehouse } from '@/types/document'
import { edlStructure } from '@/types/user'
import Pagination from '@/app/components/ui/Pagination'

interface WarehouseCardProps {
  warehouse: Warehouse;
  cabinetCount: number;
  docCount: number;
  canManage: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function WarehouseCard({
  warehouse,
  cabinetCount,
  docCount,
  canManage,
  onOpen,
  onDelete,
}: WarehouseCardProps) {
  const gradient = warehouse.color && warehouse.color.startsWith('from-')
    ? warehouse.color
    : 'from-indigo-600 to-purple-600'

  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between"
    >
      <div>
        <div className={`bg-gradient-to-br ${gradient} px-5 py-6 text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
              🏛️
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                {cabinetCount} ຕູ້
              </span>
              {canManage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="rounded-lg bg-white/10 p-1.5 text-white/80 transition hover:bg-rose-500 hover:text-white"
                  title="ລຶບຄັງ"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
          <h2 className="mt-4 text-xl font-bold">{warehouse.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/90">
            <span className="inline-flex items-center gap-1 rounded bg-black/20 px-2 py-0.5 backdrop-blur-xs font-medium">
              <Building2 size={12} />
              {warehouse.division || 'ຄັງເອກະສານສູນກາງ'}
            </span>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-600 line-clamp-2">
            {warehouse.description || 'ບໍ່ມີລາຍລະອຽດ'}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">ສ້າງເມື່ອ {formatDate(warehouse.createdAt)}</span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              {docCount} ເອກະສານ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WarehouseViewProps {
  warehouses: Warehouse[];
  cabinets: Cabinet[];
  documents: Document[];
  canManage: boolean;
  onCreate: () => void;
  onOpen: (warehouseId: string) => void;
  onDelete: (warehouse: Warehouse) => void;
}

export default function WarehouseView({
  warehouses = [],
  cabinets = [],
  documents = [],
  canManage,
  onCreate,
  onOpen,
  onDelete,
}: WarehouseViewProps) {
  const [filterDivision, setFilterDivision] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30;

  // Division options from edlStructure + warehouses
  const divisionOptions = useMemo(() => {
    const list = new Set<string>(Object.keys(edlStructure));
    warehouses.forEach((w) => {
      if (w.division) list.add(w.division);
    });
    return Array.from(list);
  }, [warehouses]);

  // Filtered warehouses
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((w) => {
      if (filterDivision !== 'all' && w.division !== filterDivision) {
        return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchName = w.name?.toLowerCase().includes(q);
        const matchDiv = w.division?.toLowerCase().includes(q);
        const matchDesc = w.description?.toLowerCase().includes(q);
        if (!matchName && !matchDiv && !matchDesc) return false;
      }
      return true;
    });
  }, [warehouses, filterDivision, searchFilter]);

  const isFiltered = filterDivision !== 'all' || Boolean(searchFilter.trim());

  const resetFilters = () => {
    setFilterDivision('all');
    setSearchFilter('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredWarehouses.length / PAGE_SIZE) || 1;
  const paginatedWarehouses = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredWarehouses.slice(start, start + PAGE_SIZE);
  }, [filteredWarehouses, currentPage]);

  return (
    <>
      {/* Filter Toolbar */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Division Filter */}
            <div className="flex items-center gap-1.5 min-w-[180px]">
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">🏢 ຝ່າຍ:</span>
              <select
                value={filterDivision}
                onChange={(e) => {
                  setFilterDivision(e.target.value);
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
                placeholder="ຄົ້ນຫາຊື່ຄັງ, ສະຖານທີ່..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-8 pr-3 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              ພົບ <strong className="font-semibold text-gray-800">{filteredWarehouses.length}</strong> ຄັງ
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

      {!filteredWarehouses || filteredWarehouses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl">
            🏛️
          </div>
          <p className="text-gray-500">
            {isFiltered ? "ບໍ່ພົບຄັງເອກະສານທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ" : "ຍັງບໍ່ມີຄັງເອກະສານ"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {isFiltered ? "ລອງປ່ຽນຕົວກອງ ຫຼື ຄຳຄົ້ນຫາໃໝ່" : "ສ້າງຄັງເອກະສານເພື່ອຈັດແບ່ງຕູ້, ຊັ້ນວາງ ແລະ ແຟ້ມເກັບເອກະສານ"}
          </p>
          {isFiltered ? (
            <button
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <RotateCcw size={16} /> ລ້າງຕົວກອງ
            </button>
          ) : (
            canManage && (
              <button
                onClick={onCreate}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus size={16} /> ສ້າງຄັງເອກະສານໃໝ່
              </button>
            )
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {paginatedWarehouses.map((warehouse) => {
              const whCabinets = cabinets.filter((c) => c.warehouseId === warehouse.id);
              const whCabinetIds = whCabinets.map((c) => c.id);
              const whDocs = documents.filter(
                (d) =>
                  (d.warehouseId === warehouse.id || (d.cabinetId && whCabinetIds.includes(d.cabinetId))) &&
                  !d.deleted,
              );

              return (
                <WarehouseCard
                  key={warehouse.id}
                  warehouse={warehouse}
                  cabinetCount={whCabinets.length}
                  docCount={whDocs.length}
                  canManage={canManage}
                  onOpen={() => onOpen(warehouse.id)}
                  onDelete={() => onDelete(warehouse)}
                />
              );
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredWarehouses.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}
