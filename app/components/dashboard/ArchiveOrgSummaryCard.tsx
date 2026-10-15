'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowRight,
  Building2,
  FolderOpen,
  Layers,
  Package,
} from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { useArchive } from '@/app/(main)/context/ArchiveContext';
import { useMasterData } from '@/app/(main)/context/MasterDataContext';

export function ArchiveOrgSummaryCard() {
  const { documents } = useDocuments();
  const { warehouses, cabinets, shelves, folders } = useArchive();
  const { divisions } = useMasterData();

  const active = useMemo(() => documents.filter((d) => !d.deleted), [documents]);

  const topDivisions = useMemo(() => {
    const list = divisions.map((name) => {
      const count = active.filter((d) => d.division === name).length;
      return { name, count };
    });
    list.sort((a, b) => b.count - a.count);
    return list.slice(0, 4);
  }, [divisions, active]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Archive className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">ໂຄງສ້າງຄັງ & ອົງກອນ</h2>
            <p className="text-xs text-slate-500">ສະຫຼຸບຈຳນວນຄັງ ແລະ ຝ່າຍທີ່ມີເອກະສານ</p>
          </div>
        </div>
        <Link
          href="/archive"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center gap-1"
        >
          ເບິ່ງຄັງທັງໝົດ
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* 4-Box Inventory Matrix (No charts) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Package className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-xs font-medium">ຄັງເອກະສານ</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">{warehouses.length || 1}</p>
          <p className="text-[10px] text-slate-400">ຄັງສູນກາງ EDL</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Archive className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-medium">ຕູ້ເອກະສານ</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">{cabinets.length}</p>
          <p className="text-[10px] text-slate-400">ຕູ້ທັງໝົດໃນລະບົບ</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Layers className="h-3.5 w-3.5 text-sky-600" />
            <span className="text-xs font-medium">ຊັ້ນວາງເອກະສານ</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">{shelves.length}</p>
          <p className="text-[10px] text-slate-400">ຊັ້ນວາງໃນຕູ້</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <FolderOpen className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-medium">ແຟ້ມເອກະສານ</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">{folders.length}</p>
          <p className="text-[10px] text-slate-400">ແຟ້ມຈັດເກັບ</p>
        </div>
      </div>

      {/* Top Divisions Section */}
      <div className="pt-2">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          ຝ່າຍທີ່ມີເອກະສານສູງສຸດ
        </p>
        <div className="space-y-2">
          {topDivisions.map((div, i) => (
            <div
              key={div.name || i}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50/60 border border-slate-100 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-5 w-5 rounded-md bg-indigo-50 font-bold text-indigo-600 text-[10px] flex items-center justify-center shrink-0">
                  #{i + 1}
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                  {div.name || 'ບໍ່ລະບຸຝ່າຍ'}
                </span>
              </div>
              <span className="font-bold text-slate-900 shrink-0">
                {div.count} <span className="font-normal text-slate-400">ສະບັບ</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

