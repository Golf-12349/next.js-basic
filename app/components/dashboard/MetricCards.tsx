'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CalendarDays, CheckCircle2, Clock3, TrendingUp } from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { addDays, LAO_MONTHS, percentage, toDateKey } from './dashboard-utils';

export function MetricCards() {
  const { documents } = useDocuments();

  const stats = useMemo(() => {
    const active = documents.filter((d) => !d.deleted);
    const total = active.length;
    const pending = active.filter((d) => d.status === 'pending').length;
    const approved = active.filter((d) => d.status === 'approved').length;

    const now = new Date();
    const monthPrefix = toDateKey(now).slice(0, 7);
    const monthly = active.filter((d) => d.uploadDate.slice(0, 7) === monthPrefix).length;

    const weekStart = toDateKey(addDays(now, -6));
    const newThisWeek = active.filter((d) => d.status === 'pending' && d.uploadDate >= weekStart).length;

    const reviewed = approved + pending;
    const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0;

    return {
      total,
      pending,
      approved,
      monthly,
      newThisWeek,
      approvalRate,
      pendingPct: percentage(pending, total),
      monthlyPct: percentage(monthly, total),
      monthLabel: LAO_MONTHS[now.getMonth()],
    };
  }, [documents]);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {/* Card 1 — Primary featured card (pending approvals, indigo/blue gradient) */}
      <Link
        href="/documents/pending"
        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 p-6 text-white shadow-lg shadow-indigo-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-300/40"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-white/10 blur-xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-100">ເອກະສານລໍຖ້າອະນຸມັດ</p>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight">{stats.pending}</span>
              <span className="text-sm font-medium text-indigo-200">ເອກະສານ</span>
            </div>
          </div>
          <span className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110">
            <Clock3 className="h-5 w-5" />
          </span>
        </div>

        <div className="relative mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-100">
          <TrendingUp className="h-3.5 w-3.5" />
          {stats.newThisWeek} ເອກະສານໃໝ່ 7 ວັນຜ່ານມາ
        </div>

        <div className="relative mt-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${stats.pendingPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-indigo-100">
            {stats.pendingPct}% ຂອງເອກະສານໃນລະບົບ
          </p>
        </div>
      </Link>
{/* Card 2 — Monthly documents */}
      <div className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">ເອກະສານປະຈຳເດືອນ</p>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight text-slate-900">{stats.monthly}</span>
              <span className="text-sm font-medium text-slate-400">ເອກະສານ</span>
            </div>
          </div>
          <span className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 ring-1 ring-indigo-100 transition-transform duration-300 group-hover:scale-110">
            <CalendarDays className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" />
          {stats.monthLabel} · ກວມ {stats.monthlyPct}% ຂອງເອກະສານທັງໝົດ
        </div>

        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-700"
            style={{ width: `${stats.monthlyPct}%` }}
          />
        </div>
      </div>

      {/* Card 3 — Approval rate */}
      <div className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">ອັດຕາການອະນຸມັດ</p>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight text-slate-900">{stats.approvalRate}%</span>
              <span className="text-sm font-medium text-slate-400">ອະນຸມັດ</span>
            </div>
          </div>
          <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 ring-1 ring-emerald-100 transition-transform duration-300 group-hover:scale-110">
            <CheckCircle2 className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          {stats.approved} ອະນຸມັດ · {stats.pending} ລໍຖ້າອະນຸມັດ
        </div>

        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${stats.approvalRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}