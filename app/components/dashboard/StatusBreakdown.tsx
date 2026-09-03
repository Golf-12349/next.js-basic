'use client';

import { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { percentage } from './dashboard-utils';

type PhaseKey = 'draft' | 'pending' | 'approved';

const PHASES: { key: PhaseKey; label: string; bar: string; dot: string; pill: string }[] = [
  { key: 'draft', label: 'ຮ່າງ', bar: 'bg-sky-400', dot: 'bg-sky-400', pill: 'bg-sky-50 text-sky-700 ring-sky-100' },
  { key: 'pending', label: 'ລໍຖ້າອະນຸມັດ', bar: 'bg-blue-700', dot: 'bg-blue-700', pill: 'bg-blue-50 text-blue-700 ring-blue-100' },
  { key: 'approved', label: 'ອະນຸມັດແລ້ວ', bar: 'bg-slate-300', dot: 'bg-slate-400', pill: 'bg-slate-50 text-slate-600 ring-slate-200' },
];

export function StatusBreakdown() {
  const { documents } = useDocuments();

  const data = useMemo(() => {
    const active = documents.filter((d) => !d.deleted);
    const counts = PHASES.map((phase) => {
      const count = active.filter((d) => d.status === phase.key).length;
      return { ...phase, count };
    });
    const total = counts.reduce((sum, c) => sum + c.count, 0);
    return { total, counts: counts.map((c) => ({ ...c, pct: percentage(c.count, total) })) };
  }, [documents]);

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Layers className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">ສະຖານະເອກະສານໃນລະບົບ</h2>
            <p className="text-xs text-slate-500">ວົງຈອນຊີວິດເອກະສານ: ຮ່າງ → ລໍຖ້າອະນຸມັດ → ອະນຸມັດແລ້ວ</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {data.total} ເອກະສານ
        </span>
      </div>

      {/* Multi-segment lifecycle progress bar */}
      <div className="mt-6 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {data.counts.map((c) =>
          c.count > 0 ? (
            <div
              key={c.key}
              className={`${c.bar} h-full transition-all duration-700`}
              style={{ width: `${c.pct}%` }}
            />
          ) : null,
        )}
      </div>

      {/* Pill counters */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {data.counts.map((c) => (
          <div
            key={c.key}
            className={`flex items-center justify-between gap-2 rounded-2xl px-4 py-3 ring-1 ${c.pill}`}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
              {c.label}
            </span>
            <span className="text-sm font-bold tabular-nums">
              {c.count}
              <span className="ml-1 text-xs font-normal opacity-70">({c.pct}%)</span>
            </span>
          </div>
        ))}
      </div>

      {data.total === 0 && (
        <p className="mt-4 text-center text-sm text-slate-400">ຍັງບໍ່ມີຂໍ້ມູນເອກະສານໃນລະບົບ</p>
      )}
    </section>
  );
}