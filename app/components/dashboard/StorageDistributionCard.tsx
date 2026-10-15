'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Archive, ArrowRight, Building2, Layers, Compass } from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { useMasterData } from '@/app/(main)/context/MasterDataContext';
import { resolveDirection } from '@/app/components/documents/DirectionBadge';
import { percentage } from './dashboard-utils';

type Tab = 'archive' | 'flow' | 'division';

export function StorageDistributionCard() {
  const { documents } = useDocuments();
  const { divisions } = useMasterData();
  const [tab, setTab] = useState<Tab>('archive');

  const active = useMemo(() => documents.filter((d) => !d.deleted), [documents]);
  const total = active.length || 1;

  // 1. Archive Allocation
  const archiveStats = useMemo(() => {
    const inCabinet = active.filter((d) => Boolean(d.cabinetId)).length;
    const inShelf = active.filter((d) => Boolean(d.shelfId)).length;
    const inFolder = active.filter((d) => Boolean(d.folderId)).length;
    const unassigned = active.filter((d) => !d.cabinetId && !d.folderId && !d.shelfId && !d.warehouseId).length;

    return [
      {
        label: 'ຈັດເກັບເຂົ້າຕູ້ເອກະສານ (Cabinet)',
        count: inCabinet,
        pct: percentage(inCabinet, total),
        color: 'bg-indigo-500',
        textColor: 'text-indigo-600',
      },
      {
        label: 'ຈັດເກັບໃນຊັ້ນວາງ (Shelf)',
        count: inShelf,
        pct: percentage(inShelf, total),
        color: 'bg-sky-500',
        textColor: 'text-sky-600',
      },
      {
        label: 'ຈັດເກັບໃນແຟ້ມ (Folder)',
        count: inFolder,
        pct: percentage(inFolder, total),
        color: 'bg-emerald-500',
        textColor: 'text-emerald-600',
      },
      {
        label: 'ຍັງບໍ່ມີບ່ອນເກັບ (Unassigned)',
        count: unassigned,
        pct: percentage(unassigned, total),
        color: 'bg-amber-500',
        textColor: 'text-amber-600',
        alert: unassigned > 0,
      },
    ];
  }, [active, total]);

  // 2. Flow Direction
  const flowStats = useMemo(() => {
    let inbound = 0;
    let outbound = 0;
    let internal = 0;

    for (const d of active) {
      const dir = resolveDirection(d);
      if (dir === 'inbound') inbound++;
      else if (dir === 'outbound') outbound++;
      else internal++;
    }

    return [
      {
        label: 'ເອກະສານຂາເຂົ້າ (Inbound)',
        count: inbound,
        pct: percentage(inbound, total),
        color: 'bg-emerald-500',
        textColor: 'text-emerald-600',
      },
      {
        label: 'ເອກະສານຂາອອກ (Outbound)',
        count: outbound,
        pct: percentage(outbound, total),
        color: 'bg-sky-500',
        textColor: 'text-sky-600',
      },
      {
        label: 'ເອກະສານພາຍໃນ (Internal)',
        count: internal,
        pct: percentage(internal, total),
        color: 'bg-violet-500',
        textColor: 'text-violet-600',
      },
    ];
  }, [active, total]);

  // 3. Division Allocation
  const divisionStats = useMemo(() => {
    const counts = divisions.map((name) => {
      const count = active.filter((d) => d.division === name).length;
      return { name, count, pct: percentage(count, total) };
    });

    counts.sort((a, b) => b.count - a.count);
    const top = counts.slice(0, 4);
    const palette = ['bg-indigo-500', 'bg-sky-500', 'bg-violet-500', 'bg-emerald-500'];

    return top.map((d, i) => ({
      ...d,
      color: palette[i % palette.length],
    }));
  }, [divisions, active, total]);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">ສະຫຼຸບການແບ່ງປັນເອກະສານ</h2>
            <p className="text-xs text-slate-500">ສະແດງສັດສ່ວນຕາມຄັງເກັບ, ທິດທາງ ແລະ ຝ່າຍ</p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTab('archive')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                tab === 'archive'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              ຄັງເກັບ
            </button>
            <button
              type="button"
              onClick={() => setTab('flow')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                tab === 'flow'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              ທິດທາງ
            </button>
            <button
              type="button"
              onClick={() => setTab('division')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                tab === 'division'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              ຝ່າຍ
            </button>
          </div>
        </div>

        {/* Content Rows */}
        <div className="mt-4 space-y-4">
          {tab === 'archive' && (
            <div className="space-y-3.5">
              {archiveStats.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      {item.alert && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                      {item.label}
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {item.count} ເອກະສານ ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${Math.max(item.count > 0 ? 4 : 0, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'flow' && (
            <div className="space-y-3.5">
              {flowStats.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {item.count} ເອກະສານ ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${Math.max(item.count > 0 ? 4 : 0, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'division' && (
            <div className="space-y-3.5">
              {divisionStats.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">
                      {item.name || 'ບໍ່ລະບຸຝ່າຍ'}
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {item.count} ເອກະສານ ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${Math.max(item.count > 0 ? 4 : 0, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400">ຈັດການໂຄງສ້າງ ແລະ ຄັງເອກະສານ</span>
        <Link
          href="/archive"
          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          ເບິ່ງຄັງເກັບທັງໝົດ
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
