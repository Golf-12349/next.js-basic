'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Bookmark, ArrowRight, Tag } from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';

export function CategoryDirectoryCard() {
  const { documents, categories } = useDocuments();

  const categoryStats = useMemo(() => {
    const active = documents.filter((d) => !d.deleted);
    const list = categories.map((catName) => {
      const count = active.filter((d) => d.category === catName).length;
      return { name: catName, count };
    });
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [documents, categories]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md space-y-3.5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Bookmark className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">ໝວດໝູ່ເອກະສານ</h2>
            <p className="text-xs text-slate-500">ຈຳແນກເອກະສານຕາມປະເພດ ແລະ ວຽກງານ</p>
          </div>
        </div>

        <Link
          href="/documents"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center gap-1"
        >
          ເບິ່ງທັງໝົດ
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {categoryStats.map((cat) => (
          <Link
            key={cat.name}
            href="/documents"
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-1.5 text-xs transition-all hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600"
          >
            <Tag className="h-3 w-3 text-slate-400 group-hover:text-indigo-500" />
            <span className="font-semibold text-slate-800 group-hover:text-indigo-700">{cat.name}</span>
            <span className="rounded-full bg-white px-2 py-0.2 text-[11px] font-bold text-slate-600 shadow-2xs border border-slate-100">
              {cat.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

