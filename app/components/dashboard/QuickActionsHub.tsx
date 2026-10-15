'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  FileBox,
  FileText,
  Plus,
  Zap,
} from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { resolveDirection } from '@/app/components/documents/DirectionBadge';
import { addDays, toDateKey } from './dashboard-utils';

export function QuickActionsHub() {
  const { documents } = useDocuments();

  const stats = useMemo(() => {
    const active = documents.filter((d) => !d.deleted);

    let inbound = 0;
    let outbound = 0;
    for (const d of active) {
      const dir = resolveDirection(d);
      if (dir === 'inbound') inbound++;
      else if (dir === 'outbound') outbound++;
    }

    const unassigned = active.filter((d) => !d.cabinetId && !d.folderId && !d.shelfId && !d.warehouseId).length;

    const now = new Date();
    const today = toDateKey(now);
    const in7Days = toDateKey(addDays(now, 7));
    const expiringSoon = active.filter(
      (d) => d.status !== 'expired' && Boolean(d.expiresAt) && d.expiresAt! > today && d.expiresAt! <= in7Days,
    ).length;
    const expired = active.filter((d) => d.status === 'expired' || (Boolean(d.expiresAt) && d.expiresAt! <= today)).length;

    return {
      inbound,
      outbound,
      unassigned,
      expiringSoon,
      expired,
    };
  }, [documents]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Zap className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">ລາຍການຕິດຕາມດ່ວນ</h2>
            <p className="text-xs text-slate-500">ທາງລັດເຂົ້າສູ່ລາຍການທີ່ຕ້ອງດຳເນີນການ</p>
          </div>
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-2.5">
        {/* Unassigned Docs Item */}
        <Link
          href={stats.unassigned > 0 ? '/archive/unassigned' : '/archive'}
          className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
            stats.unassigned > 0
              ? 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-50 hover:border-amber-300'
              : 'bg-slate-50/70 border-slate-200/60 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`p-2 rounded-lg ${
                stats.unassigned > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
              }`}
            >
              <FileBox className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">ເອກະສານຍັງບໍ່ມີບ່ອນເກັບ</p>
              <p className="text-[11px] text-slate-500">ລໍຖ້າກຳນົດຕູ້ ຫຼື ແຟ້ມໃນຄັງ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                stats.unassigned > 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {stats.unassigned} ສະບັບ
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Inbound Docs Item */}
        <Link
          href="/documents"
          className="group flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">ເອກະສານຂາເຂົ້າທັງໝົດ</p>
              <p className="text-[11px] text-slate-500">ເອກະສານຮັບເຂົ້າຈາກພາຍນອກ ແລະ ພາຍໃນ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
              {stats.inbound} ສະບັບ
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Outbound Docs Item */}
        <Link
          href="/documents"
          className="group flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">ເອກະສານຂາອອກທັງໝົດ</p>
              <p className="text-[11px] text-slate-500">ເອກະສານສົ່ງອອກ ແລະ ແຈ້ງການຕ່າງໆ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-xs font-bold">
              {stats.outbound} ສະບັບ
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Expired / Expiring Alert Item */}
        <Link
          href="/documents"
          className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
            stats.expired > 0 || stats.expiringSoon > 0
              ? 'bg-rose-50/60 border-rose-200/80 hover:bg-rose-50 hover:border-rose-300'
              : 'bg-slate-50/70 border-slate-200/60 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`p-2 rounded-lg ${
                stats.expired > 0 || stats.expiringSoon > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">ແຈ້ງເຕືອນອາຍຸເອກະສານ</p>
              <p className="text-[11px] text-slate-500">
                {stats.expired > 0
                  ? `ໝົດອາຍຸແລ້ວ ${stats.expired} ສະບັບ`
                  : stats.expiringSoon > 0
                  ? `ໃກ້ໝົດອາຍຸ ${stats.expiringSoon} ສະບັບ`
                  : 'ບໍ່ມີເອກະສານໝົດອາຍຸ'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                stats.expired > 0
                  ? 'bg-rose-600 text-white'
                  : stats.expiringSoon > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {stats.expired > 0 ? `${stats.expired} ໝົດອາຍຸ` : stats.expiringSoon > 0 ? `${stats.expiringSoon} ໃກ້ໝົດ` : 'ປົກກະຕິ'}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <Link
          href="/documents"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-200 transition hover:from-indigo-700 hover:to-blue-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          ອັບໂຫຼດເອກະສານໃໝ່ເຂົ້າລະບົບ
        </Link>
      </div>
    </div>
  );
}

