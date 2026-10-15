'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { resolveDirection } from '@/app/components/documents/DirectionBadge';
import { addDays, LAO_MONTHS, percentage, toDateKey } from './dashboard-utils';

export function MetricCards() {
  const { documents } = useDocuments();

  const stats = useMemo(() => {
    const active = documents.filter((d) => !d.deleted);
    const total = active.length;

    // Monthly velocity
    const now = new Date();
    const today = toDateKey(now);
    const monthPrefix = today.slice(0, 7);
    const monthly = active.filter((d) => d.uploadDate.slice(0, 7) === monthPrefix).length;

    // Flow metrics (Inbound vs Outbound)
    let inbound = 0;
    let outbound = 0;
    let internal = 0;
    for (const d of active) {
      const dir = resolveDirection(d);
      if (dir === 'inbound') inbound++;
      else if (dir === 'outbound') outbound++;
      else internal++;
    }

    // Storage metrics (Archive vs Unassigned)
    const stored = active.filter((d) => Boolean(d.cabinetId || d.folderId || d.shelfId || d.warehouseId)).length;
    const unassigned = active.filter((d) => !d.cabinetId && !d.folderId && !d.shelfId && !d.warehouseId).length;

    // Expiration alerts
    const in7Days = toDateKey(addDays(now, 7));
    const expired = active.filter((d) => d.status === 'expired' || (Boolean(d.expiresAt) && d.expiresAt! <= today)).length;
    const expiringSoon = active.filter(
      (d) => d.status !== 'expired' && Boolean(d.expiresAt) && d.expiresAt! > today && d.expiresAt! <= in7Days,
    ).length;

    const storedPct = percentage(stored, total);
    const monthlyPct = percentage(monthly, total);
    const expiredPct = percentage(expired, total);

    return {
      total,
      monthly,
      monthlyPct,
      inbound,
      outbound,
      internal,
      stored,
      unassigned,
      storedPct,
      expired,
      expiringSoon,
      expiredPct,
      monthLabel: LAO_MONTHS[now.getMonth()],
    };
  }, [documents]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Card 1 — ເອກະສານທັງໝົດໃນລະບົບ (Total Documents) */}
      <Link
        href="/documents"
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-500 p-5 text-white shadow-lg shadow-indigo-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-300/40 hover:-translate-y-0.5"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-white/10 blur-xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-100">ເອກະສານທັງໝົດ</p>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight">{stats.total}</span>
              <span className="text-sm font-medium text-indigo-200">ເອກະສານ</span>
            </div>
          </div>
          <span className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
            <FileText className="h-5 w-5" />
          </span>
        </div>

        <div className="relative mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-100">
          <TrendingUp className="h-3.5 w-3.5" />
          +{stats.monthly} ເອກະສານໃໝ່ເດືອນນີ້ ({stats.monthLabel})
        </div>

        <div className="relative mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${Math.max(8, stats.monthlyPct)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-indigo-100">
            {stats.monthlyPct}% ຖືກເພີ່ມໃນເດືອນນີ້
          </p>
        </div>
      </Link>

      {/* Card 2 — ເອກະສານຂາເຂົ້າ - ຂາອອກ (Inbound & Outbound Traffic) */}
      <Link
        href="/documents"
        className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">ເອກະສານຂາເຂົ້າ - ຂາອອກ</p>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.inbound + stats.outbound}
              </span>
              <span className="text-sm font-medium text-slate-400">ເອກະສານ</span>
            </div>
          </div>
          <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 ring-1 ring-emerald-100">
            <ArrowDownLeft className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs font-medium">
          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
            <ArrowDownLeft className="h-3.5 w-3.5" /> ຂາເຂົ້າ: {stats.inbound}
          </span>
          <span className="inline-flex items-center gap-1 text-sky-600 font-semibold">
            <ArrowUpRight className="h-3.5 w-3.5" /> ຂາອອກ: {stats.outbound}
          </span>
        </div>

        <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="bg-emerald-500 transition-all duration-700"
            style={{
              width: `${
                stats.inbound + stats.outbound > 0
                  ? Math.round((stats.inbound / (stats.inbound + stats.outbound)) * 100)
                  : 50
              }%`,
            }}
          />
          <div
            className="bg-sky-500 transition-all duration-700"
            style={{
              width: `${
                stats.inbound + stats.outbound > 0
                  ? Math.round((stats.outbound / (stats.inbound + stats.outbound)) * 100)
                  : 50
              }%`,
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
          <span>ຂາເຂົ້າ ({percentage(stats.inbound, stats.total)}%)</span>
          <span>ຂາອອກ ({percentage(stats.outbound, stats.total)}%)</span>
        </div>
      </Link>

      {/* Card 3 — ການຈັດເກັບໃນຄັງ (Archive Storage & Unassigned) */}
      <Link
        href={stats.unassigned > 0 ? '/archive/unassigned' : '/archive'}
        className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">ການຈັດເກັບໃນຄັງ</p>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.stored}</span>
              <span className="text-sm font-medium text-slate-400">ຈັດເກັບແລ້ວ</span>
            </div>
          </div>
          <span
            className={`rounded-2xl p-3 ring-1 ${
              stats.unassigned > 0
                ? 'bg-amber-50 text-amber-600 ring-amber-100'
                : 'bg-indigo-50 text-indigo-600 ring-indigo-100'
            }`}
          >
            <Archive className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          {stats.unassigned > 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              ຍັງບໍ່ມີບ່ອນເກັບ {stats.unassigned} ເອກະສານ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              ຈັດເກັບຄົບຖ້ວນແລ້ວ 100%
            </span>
          )}
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              stats.unassigned > 0 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${stats.storedPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">
          ຈັດເກັບແລ້ວ {stats.storedPct}% ຂອງເອກະສານທັງໝົດ
        </p>
      </Link>

      {/* Card 4 — ແຈ້ງເຕືອນອາຍຸເອກະສານ (Document Expiration Tracking) */}
      <Link
        href="/documents"
        className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">ແຈ້ງເຕືອນອາຍຸເອກະສານ</p>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-extrabold tracking-tight ${
                  stats.expired > 0 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {stats.expired}
              </span>
              <span className="text-sm font-medium text-slate-400">ໝົດອາຍຸ</span>
            </div>
          </div>
          <span
            className={`rounded-2xl p-3 ring-1 ${
              stats.expired > 0
                ? 'bg-rose-50 text-rose-600 ring-rose-100'
                : stats.expiringSoon > 0
                ? 'bg-amber-50 text-amber-600 ring-amber-100'
                : 'bg-emerald-50 text-emerald-600 ring-emerald-100'
            }`}
          >
            {stats.expired > 0 ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Clock3 className="h-5 w-5" />
            )}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          {stats.expiringSoon > 0 ? (
            <span className="text-amber-600 font-semibold inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              ໃກ້ໝົດອາຍຸ {stats.expiringSoon} ເອກະສານ (≤ 7 ວັນ)
            </span>
          ) : stats.expired > 0 ? (
            <span className="text-rose-600 font-semibold inline-flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              ຕ້ອງການກວດສອບ ຫຼື ຕໍ່ອາຍຸ
            </span>
          ) : (
            <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              ບໍ່ມີເອກະສານໃກ້ໝົດອາຍຸ
            </span>
          )}
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-rose-500 transition-all duration-700"
            style={{ width: `${Math.min(100, stats.expiredPct)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">
          {stats.expired > 0 ? `${stats.expiredPct}% ໝົດອາຍຸແລ້ວ` : 'ສະຖານະເອກະສານປົກກະຕິ'}
        </p>
      </Link>
    </div>
  );
}