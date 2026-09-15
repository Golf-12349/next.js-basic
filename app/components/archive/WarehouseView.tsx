"use client"
import { useState, useMemo } from 'react'
import { Building2, Plus, Trash2 } from 'lucide-react'
import type { Cabinet, Document, Warehouse } from '@/types/document'
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
      className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`bg-gradient-to-br ${gradient} px-5 py-6 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
            🏛️
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
            {cabinetCount} ຕູ້
          </span>
        </div>
        <h2 className="mt-4 text-xl font-bold">{warehouse.name}</h2>
        <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
          <Building2 size={12} />
          {warehouse.division || 'ຄັງເອກະສານສູນກາງ'}
        </p>
      </div>

      <div className="p-5">
        <p className="text-sm text-gray-600 line-clamp-2">
          {warehouse.description || 'ບໍ່ມີລາຍລະອຽດ'}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">ສ້າງເມື່ອ {formatDate(warehouse.createdAt)}</span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              {docCount} ເອກະສານ
            </span>
            {canManage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded-lg p-1.5 text-gray-300 transition hover:bg-rose-50 hover:text-rose-600"
                title="ລຶບຄັງ"
              >
                <Trash2 size={16} />
              </button>
            )}
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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30;

  const totalPages = Math.ceil(warehouses.length / PAGE_SIZE) || 1;
  const paginatedWarehouses = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return warehouses.slice(start, start + PAGE_SIZE);
  }, [warehouses, currentPage]);

  if (!warehouses || warehouses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl">
          🏛️
        </div>
        <p className="text-gray-500">ຍັງບໍ່ມີຄັງເອກະສານ</p>
        <p className="mt-1 text-xs text-gray-400">ສ້າງຄັງເອກະສານເພື່ອຈັດແບ່ງຕູ້ ແລະ ຊັ້ນວາງເອກະສານ</p>
        {canManage && (
          <button
            onClick={onCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> ສ້າງຄັງເອກະສານໃໝ່
          </button>
        )}
      </div>
    );
  }

  return (
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
        totalItems={warehouses.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

