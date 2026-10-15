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

    const now = new Date();
    const today = toDateKey(now);
    const monthPrefix = today.slice(0, 7);
    const monthly = active.filter((d) => d.uploadDate.slice(0, 7) === monthPrefix).length;

    let inbound = 0;
    let outbound = 0;
    let internal = 0;
    for (const d of active) {
      const dir = resolveDirection(d);
      if (dir === 'inbound') inbound++;
      else if (dir === 'outbound') outbound++;
      else internal++;
    }

    const stored = active.filter((d) => Boolean(d.cabinetId || d.folderId || d.shelfId || d.warehouseId)).length;
    const unassigned = active.filter((d) => !d.cabinetId && !d.folderId && !d.shelfId && !d.warehouseId).length;

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
      {/* =========================================================================
          CARD 1: Total Documents (ເອກະສານທັງໝົດ)
         ========================================================================= */}
      <Link
        href="/documents"
        className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ເອກະສານທັງໝົດ
            </span>
            <span className="rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-2.5 text-white shadow-sm shadow-indigo-200 transition-transform duration-300 group-hover:scale-110">
              <FileText className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.total}
            </span>
            <span className="text-xs font-medium text-slate-400">ເອກະສານ</span>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              <TrendingUp className="h-3 w-3" />
              +{stats.monthly} ເດືອນນີ້ ({stats.monthLabel})
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>ສັດສ່ວນເດືອນນີ້</span>
            <span className="font-semibold text-slate-700">{stats.monthlyPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500"
              style={{ width: `${Math.max(6, stats.monthlyPct)}%` }}
            />
          </div>
        </div>
      </Link>

      {/* =========================================================================
          CARD 2: Inbound & Outbound Traffic (ເອກະສານຂາເຂົ້າ - ຂາອອກ)
         ========================================================================= */}
      <Link
        href="/documents"
        className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ເອກະສານຂາເຂົ້າ - ຂາອອກ
            </span>
            <span className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 text-white shadow-sm shadow-emerald-200 transition-transform duration-300 group-hover:scale-110">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.inbound + stats.outbound}
            </span>
            <span className="text-xs font-medium text-slate-400">ເອກະສານ</span>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
              <ArrowDownLeft className="h-3 w-3" />
              ຂາເຂົ້າ: {stats.inbound}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-100">
              <ArrowUpRight className="h-3 w-3" />
              ຂາອອກ: {stats.outbound}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>ຂາເຂົ້າ ({percentage(stats.inbound, stats.total)}%)</span>
            <span>ຂາອອກ ({percentage(stats.outbound, stats.total)}%)</span>
          </div>
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{
                width: `${
                  stats.inbound + stats.outbound > 0
                    ? Math.round((stats.inbound / (stats.inbound + stats.outbound)) * 100)
                    : 50
                }%`,
              }}
            />
            <div
              className="bg-sky-400 transition-all duration-500"
              style={{
                width: `${
                  stats.inbound + stats.outbound > 0
                    ? Math.round((stats.outbound / (stats.inbound + stats.outbound)) * 100)
                    : 50
                }%`,
              }}
            />
          </div>
        </div>
      </Link>

      {/* =========================================================================
          CARD 3: Archive Storage & Readiness (ການຈັດເກັບໃນຄັງ)
         ========================================================================= */}
      <Link
        href={stats.unassigned > 0 ? '/archive/unassigned' : '/archive'}
        className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-amber-200 hover:-translate-y-1 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ການຈັດເກັບໃນຄັງ
            </span>
            <span
              className={`rounded-xl p-2.5 text-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${
                stats.unassigned > 0
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-200'
                  : 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-200'
              }`}
            >
              <Archive className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.stored}
            </span>
            <span className="text-xs font-medium text-slate-400">ຈັດເກັບແລ້ວ</span>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5">
            {stats.unassigned > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                ຍັງບໍ່ມີບ່ອນເກັບ {stats.unassigned} ເອກະສານ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                ຈັດເກັບຄົບຖ້ວນ 100%
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>ຄວາມພ້ອມໃນຄັງ</span>
            <span className="font-semibold text-slate-700">{stats.storedPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.unassigned > 0
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(6, stats.storedPct)}%` }}
            />
          </div>
        </div>
      </Link>

      {/* =========================================================================
          CARD 4: Expiration & Alerts (ແຈ້ງເຕືອນອາຍຸເອກະສານ)
         ========================================================================= */}
      <Link
        href="/documents"
        className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-rose-200 hover:-translate-y-1 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ແຈ້ງເຕືອນອາຍຸເອກະສານ
            </span>
            <span
              className={`rounded-xl p-2.5 text-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${
                stats.expired > 0
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-200'
                  : stats.expiringSoon > 0
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-200'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200'
              }`}
            >
              {stats.expired > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                stats.expired > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {stats.expired}
            </span>
            <span className="text-xs font-medium text-slate-400">ໝົດອາຍຸ</span>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5">
            {stats.expiringSoon > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                <Clock3 className="h-3 w-3" />
                ໃກ້ໝົດອາຍຸ {stats.expiringSoon} ສະບັບ (≤ 7 ວັນ)
              </span>
            ) : stats.expired > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                <AlertTriangle className="h-3 w-3" />
                ຕ້ອງກວດສອບຕໍ່ອາຍຸ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                ສະຖານະເອກະສານປົກກະຕິ
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>ອັດຕາເອກະສານໝົດອາຍຸ</span>
            <span className={`font-semibold ${stats.expired > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {stats.expiredPct}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.expired > 0 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(6, stats.expiredPct || 100)}%` }}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}