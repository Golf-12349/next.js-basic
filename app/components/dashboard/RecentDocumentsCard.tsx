'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, ExternalLink, Calendar, User } from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import DirectionBadge from '@/app/components/documents/DirectionBadge';

export function RecentDocumentsCard() {
  const { documents } = useDocuments();

  const recentDocs = useMemo(() => {
    return documents
      .filter((d) => !d.deleted)
      .sort((a, b) => (b.uploadDate || '').localeCompare(a.uploadDate || ''))
      .slice(0, 5);
  }, [documents]);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">ລາຍການເອກະສານຫຼ້າສຸດ</h2>
          <p className="text-xs text-slate-500">ເອກະສານທີ່ຖືກເພີ່ມ ຫຼື ອັບເດດເຂົ້າສູ່ລະບົບຫຼ້າສຸດ</p>
        </div>
        <Link
          href="/documents"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          ເບິ່ງທັງໝົດ
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Content */}
      {recentDocs.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-medium">ບໍ່ມີເອກະສານໃນລະບົບ</p>
          <p className="text-xs text-slate-400 mt-1">ກະລຸນາອັບໂຫຼດເອກະສານໃໝ່ເພື່ອເລີ່ມຕົ້ນໃຊ້ງານ</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="py-3 px-2">ລະຫັດ & ຊື່ເອກະສານ</th>
                <th className="py-3 px-2">ໝວດໝູ່</th>
                <th className="py-3 px-2">ທິດທາງ</th>
                <th className="py-3 px-2">ຜູ້ອັບໂຫຼດ</th>
                <th className="py-3 px-2">ວັນທີ</th>
                <th className="py-3 px-2 text-right">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="py-3 px-2 max-w-[260px]">
                    <div className="flex items-start gap-2.5">
                      <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition">
                          {doc.title}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{doc.docNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {doc.category || 'ທົ່ວໄປ'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <DirectionBadge direction={doc.direction} category={doc.category} />
                  </td>
                  <td className="py-3 px-2 text-slate-600">
                    <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                      <User className="h-3 w-3 text-slate-400" />
                      {doc.uploadedBy || 'ຜູ້ໃຊ້ງານ'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {doc.uploadDate ? doc.uploadDate.slice(0, 10) : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Link
                      href="/documents"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-xs hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition"
                    >
                      ເບິ່ງ
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
