'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Compass,
  FileBox,
  FolderArchive,
  FolderOpen,
  Layers,
} from 'lucide-react';
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
        id: 'cabinet',
        label: 'ຈັດເກັບເຂົ້າຕູ້ (Cabinet)',
        icon: Archive,
        count: inCabinet,
        pct: percentage(inCabinet, total),
        bgIcon: 'bg-indigo-50 text-indigo-600',
        barGradient: 'from-indigo-500 to-indigo-600',
      },
      {
        id: 'shelf',
        label: 'ຈັດເກັບໃນຊັ້ນວາງ (Shelf)',
        icon: Layers,
        count: inShelf,
        pct: percentage(inShelf, total),
        bgIcon: 'bg-sky-50 text-sky-600',
        barGradient: 'from-sky-400 to-sky-500',
      },
      {
        id: 'folder',
        label: 'ຈັດເກັບໃນແຟ້ມ (Folder)',
        icon: FolderOpen,
        count: inFolder,
        pct: percentage(inFolder, total),
        bgIcon: 'bg-emerald-50 text-emerald-600',
        barGradient: 'from-emerald-400 to-emerald-500',
      },
      {
        id: 'unassigned',
        label: 'ຍັງບໍ່ມີບ່ອນເກັບ (Unassigned)',
        icon: FileBox,
        count: unassigned,
        pct: percentage(unassigned, total),
        bgIcon: unassigned > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400',
        barGradient: 'from-amber-400 to-orange-500',
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
        id: 'inbound',
        label: 'ເອກະສານຂາເຂົ້າ (Inbound)',
        icon: ArrowDownLeft,
        count: inbound,
        pct: percentage(inbound, total),
        bgIcon: 'bg-emerald-50 text-emerald-600',
        barGradient: 'from-emerald-500 to-teal-600',
      },
      {
        id: 'outbound',
        label: 'ເອກະສານຂາອອກ (Outbound)',
        icon: ArrowUpRight,
        count: outbound,
        pct: percentage(outbound, total),
        bgIcon: 'bg-sky-50 text-sky-600',
        barGradient: 'from-sky-400 to-blue-500',
      },
      {
        id: 'internal',
        label: 'ເອກະສານພາຍໃນ (Internal)',
        icon: Compass,
        count: internal,
        pct: percentage(internal, total),
        bgIcon: 'bg-violet-50 text-violet-600',
        barGradient: 'from-violet-500 to-purple-600',
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
    const palettes = [
      { bgIcon: 'bg-indigo-50 text-indigo-600', barGradient: 'from-indigo-500 to-blue-600' },
      { bgIcon: 'bg-sky-50 text-sky-600', barGradient: 'from-sky-400 to-blue-500' },
      { bgIcon: 'bg-purple-50 text-purple-600', barGradient: 'from-purple-500 to-indigo-600' },
      { bgIcon: 'bg-emerald-50 text-emerald-600', barGradient: 'from-emerald-400 to-teal-500' },
    ];

    return top.map((d, i) => ({
      ...d,
      ...palettes[i % palettes.length],
      rank: i + 1,
    }));
  }, [divisions, active, total]);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md flex flex-col justify-between h-full">
      <div>
        {/* Card Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <FolderArchive className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">ສະຫຼຸບການແບ່ງປັນເອກະສານ</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">ສັດສ່ວນຕາມຄັງຈັດເກັບ, ທິດທາງ ແລະ ຝ່າຍ</p>
          </div>

          {/* Segmented Tab Control */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTab('archive')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                tab === 'archive'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              ຄັງເກັບ
            </button>
            <button
              type="button"
              onClick={() => setTab('flow')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                tab === 'flow'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              ທິດທາງ
            </button>
            <button
              type="button"
              onClick={() => setTab('division')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                tab === 'division'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              ຝ່າຍ
            </button>
          </div>
        </div>

        {/* Tab Items List */}
        <div className="mt-4 space-y-3.5">
          {tab === 'archive' && (
            <>
              {archiveStats.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="group/item">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${item.bgIcon} shrink-0`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-medium text-slate-700">{item.label}</span>
                      </div>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {item.count} ສະບັບ{' '}
                        <span className="text-slate-400 font-normal">({item.pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${item.barGradient}`}
                        style={{ width: `${Math.max(item.count > 0 ? 5 : 0, item.pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {archiveStats.find((s) => s.id === 'unassigned')?.alert && (
                <div className="mt-3 rounded-xl bg-amber-50/80 border border-amber-200/80 p-2.5 flex items-center justify-between text-xs">
                  <span className="text-amber-800 font-medium flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    ມີເອກະສານຍັງບໍ່ທັນຈັດເກັບ
                  </span>
                  <Link
                    href="/archive/unassigned"
                    className="font-bold text-amber-900 hover:underline inline-flex items-center gap-1"
                  >
                    ຈັດເກັບດຽວນີ້
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </>
          )}

          {tab === 'flow' && (
            <>
              {flowStats.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="group/item">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${item.bgIcon} shrink-0`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-medium text-slate-700">{item.label}</span>
                      </div>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {item.count} ສະບັບ{' '}
                        <span className="text-slate-400 font-normal">({item.pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${item.barGradient}`}
                        style={{ width: `${Math.max(item.count > 0 ? 5 : 0, item.pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {tab === 'division' && (
            <>
              {divisionStats.map((item) => (
                <div key={item.name} className="group/item">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-5 w-5 rounded-md bg-slate-100 font-bold text-slate-500 text-[10px] flex items-center justify-center shrink-0">
                        #{item.rank}
                      </span>
                      <span className="font-medium text-slate-700 truncate max-w-[200px]">
                        {item.name || 'ບໍ່ລະບຸຝ່າຍ'}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {item.count} ສະບັບ{' '}
                      <span className="text-slate-400 font-normal">({item.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${item.barGradient}`}
                      style={{ width: `${Math.max(item.count > 0 ? 5 : 0, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400">ໂຄງສ້າງ ແລະ ຄັງເອກະສານ DMS</span>
        <Link
          href="/archive"
          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition group"
        >
          ເບິ່ງຄັງເກັບທັງໝົດ
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
