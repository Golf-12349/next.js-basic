'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Search,
  Sparkles,
} from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import DirectionBadge from '@/app/components/documents/DirectionBadge';

function getFileIcon(fileName?: string, fileType?: string) {
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  if (fileType === 'pdf' || ext === 'pdf') {
    return {
      icon: FileText,
      label: 'PDF',
      style: 'bg-rose-50 text-rose-600 border-rose-100',
    };
  }
  if (fileType === 'doc' || ext === 'doc' || ext === 'docx') {
    return {
      icon: FileText,
      label: 'DOC',
      style: 'bg-blue-50 text-blue-600 border-blue-100',
    };
  }
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    return {
      icon: FileSpreadsheet,
      label: 'XLS',
      style: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };
  }
  if (fileType === 'image' || ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
    return {
      icon: ImageIcon,
      label: 'IMG',
      style: 'bg-amber-50 text-amber-600 border-amber-100',
    };
  }
  return {
    icon: FileCode,
    label: 'FILE',
    style: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };
}

export function RecentDocumentsCard() {
  const { documents } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');

  const recentDocs = useMemo(() => {
    return documents
      .filter((d) => !d.deleted)
      .filter((d) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          (d.title || '').toLowerCase().includes(q) ||
          (d.docNumber || '').toLowerCase().includes(q) ||
          (d.category || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.uploadDate || '').localeCompare(a.uploadDate || ''))
      .slice(0, 8);
  }, [documents, searchTerm]);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md h-full flex flex-col justify-between">
      <div>
        {/* Header with Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3.5 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">ລາຍການເອກະສານຫຼ້າສຸດ</h2>
              <p className="text-xs text-slate-500">ເອກະສານທີ່ຖືກບັນທຶກ ແລະ ອັບເດດເຂົ້າສູ່ລະບົບ</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ຄົ້ນຫາຊື່ ຫຼື ລະຫັດ..."
                className="w-40 sm:w-52 rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
              />
            </div>

            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition group whitespace-nowrap"
            >
              ເບິ່ງທັງໝົດ
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Content Table */}
        {recentDocs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-medium">ບໍ່ພົບເອກະສານທີ່ກົງກັບການຄົ້ນຫາ</p>
            <p className="text-xs text-slate-400 mt-1">ລອງຄົ້ນຫາດ້ວຍຄຳສັບອື່ນ ຫຼື ກົດເບິ່ງເອກະສານທັງໝົດ</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">ເອກະສານ</th>
                  <th className="py-3 px-3">ໝວດໝູ່</th>
                  <th className="py-3 px-3">ທິດທາງ</th>
                  <th className="py-3 px-3">ຜູ້ອັບໂຫຼດ</th>
                  <th className="py-3 px-3">ວັນທີ</th>
                  <th className="py-3 px-3 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentDocs.map((doc) => {
                  const fileInfo = getFileIcon(doc.fileName, doc.fileType);
                  const FileIcon = fileInfo.icon;
                  const userInitial = (doc.uploadedBy || 'U').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-indigo-50/30 transition-colors duration-150 group"
                    >
                      {/* Document title & code */}
                      <td className="py-3 px-3 max-w-[260px]">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex flex-col items-center justify-center h-9 w-9 rounded-xl border text-[9px] font-bold shrink-0 ${fileInfo.style}`}
                          >
                            <FileIcon className="h-4 w-4" />
                            <span>{fileInfo.label}</span>
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition">
                              {doc.title}
                            </p>
                            <span className="text-[11px] font-mono text-slate-400 tracking-tight">
                              {doc.docNumber || 'DOC-UNASSIGNED'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-lg bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200/50">
                          {doc.category || 'ທົ່ວໄປ'}
                        </span>
                      </td>

                      {/* Direction */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <DirectionBadge direction={doc.direction} category={doc.category} />
                      </td>

                      {/* Uploader */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {userInitial}
                          </span>
                          <span className="truncate max-w-[120px] font-medium text-slate-700">
                            {doc.uploadedBy || 'ຜູ້ໃຊ້ງານ'}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {doc.uploadDate ? doc.uploadDate.slice(0, 10) : '-'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Link
                          href="/documents"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all duration-200"
                        >
                          <span>ເບິ່ງ</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-4">
        <span>ສະແດງ {recentDocs.length} ເອກະສານຫຼ້າສຸດ</span>
        <Link href="/documents" className="font-semibold text-indigo-600 hover:underline">
          ຄົ້ນຫາລະອຽດໃນລະບົບ →
        </Link>
      </div>
    </section>
  );
}
