"use client"
import Link from 'next/link';
import { useMemo } from 'react';
import { DashboardLayout } from '@/app/components/dashboard-layout';
import { useDMS } from '../_dms-context';

const statusStyles: Record<string, string> = {
  'ຮ່າງ': 'bg-slate-100 text-slate-700',
  'ລໍຖ້າອະນຸມັດ': 'bg-amber-100 text-amber-700',
  'ອະນຸມັດ': 'bg-emerald-100 text-emerald-700',
  'ເກັບເຂົ້າຄັງ': 'bg-gray-200 text-gray-700',
};

const statusLabelMap: Record<string, string> = {
  draft: 'ຮ່າງ',
  pending: 'ລໍຖ້າອະນຸມັດ',
  approved: 'ອະນຸມັດ',
  archived: 'ເກັບເຂົ້າຄັງ',
};

export default function DashboardPage() {
  const { documents } = useDMS();

  const active = useMemo(() => documents.filter((d) => !d.deleted), [documents]);

  const summaryCards = useMemo(() => {
    const total = active.length;
    const inbound = active.filter((d) => d.category === 'ຂາເຂົ້າ').length;
    const outbound = active.filter((d) => d.category === 'ຂາອອກ').length;
    const pending = active.filter((d) => d.status === 'pending').length;

    return [
      { label: 'ເອກກະສານທັງໝົດ', value: String(total), trend: 'ຢູ່ໃນລະບົບ', tone: 'emerald' },
      { label: 'ຂາເຂົ້າ', value: String(inbound), trend: 'ເອກະສານ', tone: 'blue' },
      { label: 'ຂາອອກ', value: String(outbound), trend: 'ເອກະສານ', tone: 'amber' },
      { label: 'ລໍຖ້າອະນຸມັດ', value: String(pending), trend: 'ເອກະສານ', tone: 'violet' },
    ];
  }, [active]);

  const recentDocuments = useMemo(() => {
    return [...active]
      .sort((a, b) => (a.uploadDate < b.uploadDate ? 1 : -1))
      .slice(0, 5);
  }, [active]);

  return (
    <DashboardLayout title="ໜ້າຫຼັກ">
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ໜ້າຫຼັກ</h1>
            <p className="mt-1 text-sm text-gray-500">ພາບລວມລະບົບ DMS ແລະຄຸນນະພາບການຈັດການເອກະສານ.</p>
          </div>
          <Link
            href="/documents/upload"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            + ອັບໂຫຼດເອກກະສານໃໝ່
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">{card.label}</div>
              <div className="mt-4 text-2xl font-bold text-gray-900">{card.value}</div>
              <div
                className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  card.tone === 'emerald'
                    ? 'bg-emerald-100 text-emerald-700'
                    : card.tone === 'blue'
                      ? 'bg-blue-100 text-blue-700'
                      : card.tone === 'amber'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-violet-100 text-violet-700'
                }`}
              >
                {card.trend}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">ສະຫຼຸບຕາມສະຖານະ</h2>
            <div className="space-y-4">
              {(['pending', 'approved', 'draft', 'archived'] as const).map((status) => {
                const count = active.filter((d) => d.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                    <span className="text-sm text-gray-600">{statusLabelMap[status]}</span>
                    <span className="text-sm font-semibold text-gray-900">{count} ເອກະສານ</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">ເອກກະສານອັບໂຫຼດລ່າສຸດ</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">ຊື່ເອກກະສານ</th>
                    <th className="px-4 py-3">ໝວດໝູ່</th>
                    <th className="px-4 py-3">ວັນທີ</th>
                    <th className="px-4 py-3">ສະຖານະ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">
                        ຍັງບໍ່ມີເອກະສານ
                      </td>
                    </tr>
                  ) : (
                    recentDocuments.map((doc) => (
                      <tr key={doc.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{doc.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{doc.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{doc.uploadDate}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[statusLabelMap[doc.status]]}`}>
                            {statusLabelMap[doc.status]}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}