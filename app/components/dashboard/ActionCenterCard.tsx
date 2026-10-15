'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileBox,
  Inbox,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { addDays, toDateKey } from './dashboard-utils';

export function ActionCenterCard() {
  const { documents, incomingTransfers } = useDocuments();

  const actionData = useMemo(() => {
    const active = documents.filter((d) => !d.deleted);
    const now = new Date();
    const today = toDateKey(now);
    const in7Days = toDateKey(addDays(now, 7));

    // 1. Unassigned docs
    const unassignedDocs = active.filter(
      (d) => !d.cabinetId && !d.folderId && !d.shelfId && !d.warehouseId,
    );

    // 2. Expired & Expiring soon docs
    const expiredDocs = active.filter(
      (d) => d.status === 'expired' || (Boolean(d.expiresAt) && d.expiresAt! <= today),
    );
    const expiringSoonDocs = active.filter(
      (d) =>
        d.status !== 'expired' &&
        Boolean(d.expiresAt) &&
        d.expiresAt! > today &&
        d.expiresAt! <= in7Days,
    );

    // 3. Incoming transfers needing review
    const pendingTransfers = (incomingTransfers || []).filter(
      (t) => t.status === 'pending',
    );

    const totalActions =
      unassignedDocs.length +
      expiredDocs.length +
      expiringSoonDocs.length +
      pendingTransfers.length;

    return {
      unassignedDocs,
      expiredDocs,
      expiringSoonDocs,
      pendingTransfers,
      totalActions,
    };
  }, [documents, incomingTransfers]);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <ShieldAlert className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              ສູນກາງວຽກທີ່ຕ້ອງດຳເນີນການດ່ວນ
            </h2>
            <p className="text-xs text-slate-500">
              ລາຍການເອກະສານທີ່ຮຽກຮ້ອງການຈັດການ, ກຳນົດບ່ອນເກັບ ຫຼື ກວດສອບອາຍຸ
            </p>
          </div>
        </div>

        {actionData.totalActions > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200/80">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {actionData.totalActions} ລາຍການຕ້ອງດຳເນີນການ
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            ບໍ່ມີວຽກຄ້າງ 100%
          </span>
        )}
      </div>

      {/* Task Queue Cards */}
      <div className="mt-4 space-y-3">
        {/* Task 1: Unassigned Storage Queue */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            actionData.unassignedDocs.length > 0
              ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
              : 'bg-slate-50/60 border-slate-200/60'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  actionData.unassignedDocs.length > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <FileBox className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">
                    ເອກະສານລໍຖ້າກຳນົດບ່ອນຈັດເກັບໃນຄັງ
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      actionData.unassignedDocs.length > 0
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {actionData.unassignedDocs.length} ສະບັບ
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ເອກະສານທີ່ຖືກອັບໂຫຼດເຂົ້າມາແຕ່ຍັງບໍ່ທັນຖືກຈັດເຂົ້າຕູ້, ຊັ້ນວາງ ຫຼື ແຟ້ມ
                </p>
              </div>
            </div>

            <Link
              href="/documents/unassigned"
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap self-start sm:self-center shadow-xs ${
                actionData.unassignedDocs.length > 0
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>ກຳນົດບ່ອນເກັບດຽວນີ້</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Task 2: Incoming Transfers Queue */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            actionData.pendingTransfers.length > 0
              ? 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-300'
              : 'bg-slate-50/60 border-slate-200/60'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  actionData.pendingTransfers.length > 0
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Inbox className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">
                    ເອກະສານສົ່ງຕໍ່ທີ່ລໍຖ້າການຕອບຮັບ
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      actionData.pendingTransfers.length > 0
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {actionData.pendingTransfers.length} ສະບັບ
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ເອກະສານທີ່ຖືກໂອນຍ້າຍຈາກພະແນກ ຫຼື ຝ່າຍອື່ນເຂົ້າມາຫາທ່ານ
                </p>
              </div>
            </div>

            <Link
              href="/documents/incoming"
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap self-start sm:self-center shadow-xs ${
                actionData.pendingTransfers.length > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>ກວດສອບລາຍການໂອນ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Task 3: Expiration & Retention Alerts */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            actionData.expiredDocs.length > 0 || actionData.expiringSoonDocs.length > 0
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
              : 'bg-slate-50/60 border-slate-200/60'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  actionData.expiredDocs.length > 0 || actionData.expiringSoonDocs.length > 0
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Clock3 className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">
                    ເອກະສານໝົດອາຍຸ ແລະ ໃກ້ໝົດອາຍຸ
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      actionData.expiredDocs.length > 0
                        ? 'bg-rose-600 text-white'
                        : actionData.expiringSoonDocs.length > 0
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {actionData.expiredDocs.length > 0
                      ? `${actionData.expiredDocs.length} ໝົດອາຍຸ`
                      : actionData.expiringSoonDocs.length > 0
                      ? `${actionData.expiringSoonDocs.length} ໃກ້ໝົດ`
                      : 'ປົກກະຕິ'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ເອກະສານທີ່ໝົດກຳນົດການເກັບຮັກສາ ຫຼື ຮອດກຳນົດທົບທວນສັນຍາ (≤ 7 ວັນ)
                </p>
              </div>
            </div>

            <Link
              href="/documents/expired"
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap self-start sm:self-center shadow-xs ${
                actionData.expiredDocs.length > 0 || actionData.expiringSoonDocs.length > 0
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>ຈັດການຕໍ່ອາຍຸ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

