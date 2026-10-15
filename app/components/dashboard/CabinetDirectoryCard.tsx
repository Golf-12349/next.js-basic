'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowRight,
  Folder,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useArchive } from '@/app/(main)/context/ArchiveContext';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';

export function CabinetDirectoryCard() {
  const { cabinets } = useArchive();
  const { documents } = useDocuments();

  const activeDocs = useMemo(() => documents.filter((d) => !d.deleted), [documents]);

  // Compute doc count per cabinet
  const cabinetsWithCounts = useMemo(() => {
    return cabinets.map((cab) => {
      const docCount = activeDocs.filter((d) => d.cabinetId === cab.id).length;
      return {
        ...cab,
        docCount,
      };
    });
  }, [cabinets, activeDocs]);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Archive className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              ຕູ້ເອກະສານຫຼັກໃນຄັງ (Cabinet Directory)
            </h2>
            <p className="text-xs text-slate-500">
              ເຂົ້າເຖິງຕູ້ຈັດເກັບເອກະສານແຍກຕາມຝ່າຍ ແລະ ພະແນກ
            </p>
          </div>
        </div>

        <Link
          href="/documents/archive"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition group"
        >
          ເບິ່ງຄັງທັງໝົດ
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Cabinets Grid */}
      {cabinetsWithCounts.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <Archive className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-medium">ຍັງບໍ່ມີຕູ້ເອກະສານໃນລະບົບ</p>
          <Link
            href="/documents/archive"
            className="mt-2 inline-flex items-center text-xs font-bold text-indigo-600 hover:underline"
          >
            + ສ້າງຕູ້ເອກະສານໃໝ່
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 mt-4">
          {cabinetsWithCounts.slice(0, 6).map((cab) => {
            const gradientClass = cab.color || 'from-indigo-500 to-blue-500';

            return (
              <Link
                key={cab.id}
                href="/documents/archive"
                className="group relative rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-all duration-200 hover:bg-white hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      <Archive className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">
                        {cab.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {cab.division || cab.department || 'ສູນກາງ EDL'}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200/80 text-[11px] font-bold text-slate-700 tabular-nums shrink-0">
                    {cab.docCount} ສະບັບ
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3 text-slate-400" />
                    {cab._count?.shelves || 0} ຊັ້ນວາງ
                  </span>
                  <span className="flex items-center gap-1">
                    <Folder className="h-3 w-3 text-slate-400" />
                    {cab._count?.folders || 0} ແຟ້ມ
                  </span>
                  <span className="text-indigo-600 font-bold group-hover:underline inline-flex items-center gap-0.5">
                    ເປີດຕູ້ →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

