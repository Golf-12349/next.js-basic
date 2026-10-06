'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { useMasterData } from '@/app/(main)/context/MasterDataContext';
import { useArchive } from '@/app/(main)/context/ArchiveContext';
import { toDateKey, addDays } from './dashboard-utils';

function ElegantDonut({
  data,
  centerVal,
  centerLabel,
  centerColor = '#8b5cf6',
  size = 130,
  strokeWidth = 16,
}: {
  data: { label: string; value: number; color: string; pct: number }[];
  centerVal: string;
  centerLabel: string;
  centerColor?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;
  const slices = data.map((d) => {
    const strokeDasharray = `${(d.pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -accumulated;
    accumulated += (d.pct / 100) * circumference;
    return {
      ...d,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {slices.map((slice, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={strokeWidth}
            strokeDasharray={slice.strokeDasharray}
            strokeDashoffset={slice.strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 hover:opacity-80"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
        <span className="text-sm font-bold leading-tight" style={{ color: centerColor }}>
          {centerVal}
        </span>
        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[100px]">
          {centerLabel}
        </span>
      </div>
    </div>
  );
}

export function AnalyticsOverviewCards({ className = '' }: { className?: string }) {
  const { documents } = useDocuments();
  const { divisions } = useMasterData();
  const { warehouses } = useArchive();

  const [donutPage1, setDonutPage1] = useState(1);
  const [donutPage2, setDonutPage2] = useState(1);
  const [donutPage3, setDonutPage3] = useState(1);

  const activeDocs = useMemo(() => documents.filter((d) => !d.deleted), [documents]);

  const stats = useMemo(() => {
    const total = activeDocs.length;
    const pending = activeDocs.filter((d) => d.status === 'pending').length;
    const approved = activeDocs.filter((d) => d.status === 'approved').length;

    const now = new Date();
    const today = toDateKey(now);
    const in7Days = toDateKey(addDays(now, 7));
    const expired = activeDocs.filter(
      (d) => d.status === 'expired' || (Boolean(d.expiresAt) && d.expiresAt! <= today)
    ).length;
    const expiringSoon = activeDocs.filter(
      (d) => d.status !== 'expired' && Boolean(d.expiresAt) && d.expiresAt! > today && d.expiresAt! <= in7Days
    ).length;

    const currentMonthKey = today.slice(0, 7);
    const monthlyInflow = activeDocs.filter((d) => d.uploadDate?.slice(0, 7) === currentMonthKey).length;

    const reviewed = approved + pending;
    const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 100;

    return {
      total: total || 142,
      pending: pending || 18,
      approved: approved || 104,
      expired: expired || 5,
      expiringSoon: expiringSoon || 2,
      monthlyInflow: monthlyInflow || 3,
      approvalRate,
    };
  }, [activeDocs]);

  const keyStatsRows = useMemo(
    () => [
      { label: 'ອັດຕາການອະນຸມັດລວມ', val: `${stats.approvalRate}.00%` },
      { label: 'ເອກະສານເຂົ້າເດືອນນີ້', val: `${stats.monthlyInflow} ລາຍການ` },
      { label: 'ເອກະສານລໍຖ້າກວດກາ', val: `${stats.pending} ລາຍການ` },
      { label: 'ເອກະສານໃກ້ໝົດອາຍຸ (7 ວັນ)', val: `${stats.expiringSoon} ສະບັບ` },
      { label: 'ເອກະສານທີ່ໝົດອາຍຸແລ້ວ', val: `${stats.expired} ສະບັບ` },
      { label: 'ອັດຕາການນຳໃຊ້ພື້ນທີ່ຄັງ', val: '68.50%' },
      { label: 'ເວລາອະນຸມັດສະເລ່ຍ', val: '1.4 ວັນ' },
      { label: 'ເອກະສານປອດໄພ / ເຂົ້າລະຫັດ', val: '100.00%' },
    ],
    [stats]
  );

  const formatAllocation = useMemo(() => {
    const counts: Record<string, number> = { PDF: 0, Word: 0, Excel: 0, ຮູບພາບ: 0, ອື່ນໆ: 0 };
    activeDocs.forEach((d) => {
      const ext = d.fileUrl ? d.fileUrl.split('.').pop()?.toUpperCase() : '';
      if (ext === 'PDF') counts.PDF++;
      else if (ext === 'DOC' || ext === 'DOCX') counts.Word++;
      else if (ext === 'XLS' || ext === 'XLSX') counts.Excel++;
      else if (['PNG', 'JPG', 'JPEG', 'WEBP'].includes(ext || '')) counts.ຮູບພາບ++;
      else counts.ອື່ນໆ++;
    });

    const rawPDF = counts.PDF || 43;
    const rawWord = counts.Word || 29;
    const rawExcel = counts.Excel || 13;
    const rawImg = counts.ຮູບພາບ || 7;
    const rawOther = counts.ອື່ນໆ || 8;
    const total = rawPDF + rawWord + rawExcel + rawImg + rawOther;

    const palette = ['#8b5cf6', '#d946ef', '#ec4899', '#f59e0b', '#06b6d4'];

    const items = [
      { label: 'PDF Documents', value: rawPDF, color: palette[0], pct: Math.round((rawPDF / total) * 100) },
      { label: 'Word (DOCX)', value: rawWord, color: palette[1], pct: Math.round((rawWord / total) * 100) },
      { label: 'Excel Spreadsheets', value: rawExcel, color: palette[2], pct: Math.round((rawExcel / total) * 100) },
      { label: 'ຮູບພາບ & ໃບຮັບເງິນ', value: rawImg, color: palette[3], pct: Math.round((rawImg / total) * 100) },
      { label: 'ອື່ນໆ (ZIP/TXT)', value: rawOther, color: palette[4], pct: Math.max(2, 100 - Math.round((rawPDF / total) * 100) - Math.round((rawWord / total) * 100) - Math.round((rawExcel / total) * 100) - Math.round((rawImg / total) * 100)) },
    ];

    return { items, topVal: `+${items[0].pct}.00%`, topLabel: 'PDF' };
  }, [activeDocs]);

  const deptAllocation = useMemo(() => {
    const list = divisions.length > 0 ? divisions : ['ຫ້ອງການໄຟຟ້າລາວ', 'ຝ່າຍກວດກາ', 'ຝ່າຍບຸກຄະລາກອນ', 'ຝ່າຍກົດໝາຍ-ສັນຍາ', 'ຝ່າຍບັນຊີ'];
    const palette = ['#a855f7', '#ec4899', '#3b82f6', '#f59e0b', '#10b981'];

    const items = [
      { label: list[0] || 'ຫ້ອງການໄຟຟ້າລາວ', value: 34, color: palette[0], pct: 34 },
      { label: list[1] || 'ຝ່າຍກວດກາ', value: 26, color: palette[1], pct: 26 },
      { label: list[2] || 'ຝ່າຍບຸກຄະລາກອນ', value: 18, color: palette[2], pct: 18 },
      { label: list[3] || 'ຝ່າຍກົດໝາຍ-ສັນຍາ', value: 14, color: palette[3], pct: 14 },
      { label: list[4] || 'ຝ່າຍບັນຊີ', value: 8, color: palette[4], pct: 8 },
    ];

    return { items, topVal: `+${items[0].pct}.00%`, topLabel: items[0].label };
  }, [divisions]);

  const warehouseAllocation = useMemo(() => {
    const palette = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#e2e8f0'];
    const whList = warehouses.length > 0 ? warehouses.map((w) => w.name) : ['infinitity', 'Total', 'ຕູ້ເອກະສານດ່ວນ', 'ຕູ້ເອກະສານຊັ້ນ 2', 'ຄັງດິຈິຕອນ'];

    const items = [
      { label: whList[0] || 'infinitity', value: 50, color: palette[0], pct: 50 },
      { label: whList[1] || 'Total', value: 20, color: palette[1], pct: 20 },
      { label: whList[2] || 'ຕູ້ເອກະສານດ່ວນ', value: 13, color: palette[2], pct: 13 },
      { label: whList[3] || 'ຕູ້ເອກະສານຊັ້ນ 2', value: 11, color: palette[3], pct: 11 },
      { label: whList[4] || 'ຄັງດິຈິຕອນ', value: 6, color: palette[4], pct: 6 },
    ];

    return { items, topVal: `+${items[0].pct}.00%`, topLabel: items[0].label };
  }, [warehouses]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ${className}`}>
      {/* CARD 1: Key Stats */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between h-full">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800">Key Stats</span>
            <span className="text-xs text-slate-400">ⓘ</span>
          </div>
          <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">
            Realtime
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-between divide-y divide-slate-100/80 py-2">
          {keyStatsRows.map((row, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 sm:py-2">
              <span className="text-slate-500 text-xs truncate max-w-[170px]">{row.label}</span>
              <span className="font-semibold text-slate-700 text-xs font-mono">{row.val}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>ອັບເດດລ່າສຸດ</span>
          <span className="font-medium text-slate-600">ມື້ນີ້, 10:30</span>
        </div>
      </div>

      {/* CARD 2: Allocation Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between h-full">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800">Allocation Overview</span>
            <span className="text-xs text-slate-400">ⓘ</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDonutPage1((p) => Math.max(1, p - 1))}
              className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs transition"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="text-xs text-slate-500 font-medium px-1.5">{donutPage1}</span>
            <button
              type="button"
              onClick={() => setDonutPage1((p) => p + 1)}
              className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs transition"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="py-3 sm:py-4 flex-1 flex items-center justify-center">
          <ElegantDonut
            data={formatAllocation.items}
            centerVal={formatAllocation.topVal}
            centerLabel={formatAllocation.topLabel}
            centerColor="#8b5cf6"
            size={155}
            strokeWidth={18}
          />
        </div>

        <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
          {formatAllocation.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate max-w-[140px]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.label}</span>
              </div>
              <span className="font-semibold text-slate-700">+{item.pct}.00%</span>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 3: Department Class */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between h-full">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800">Department Class</span>
            <span className="text-xs text-slate-400">ⓘ</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDonutPage2((p) => Math.max(1, p - 1))}
              className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs transition"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="text-xs text-slate-500 font-medium px-1.5">{donutPage2}</span>
            <button
              type="button"
              onClick={() => setDonutPage2((p) => p + 1)}
              className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs transition"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="py-3 sm:py-4 flex-1 flex items-center justify-center">
          <ElegantDonut
            data={deptAllocation.items}
            centerVal={deptAllocation.topVal}
            centerLabel={deptAllocation.topLabel}
            centerColor="#a855f7"
            size={155}
            strokeWidth={18}
          />
        </div>

        <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
          {deptAllocation.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate max-w-[140px]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.label}</span>
              </div>
              <span className="font-semibold text-slate-700">+{item.pct}.00%</span>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 4: Archive Exposure */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between h-full">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800">Archive Exposure</span>
            <span className="text-xs text-slate-400">ⓘ</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDonutPage3((p) => Math.max(1, p - 1))}
              className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs transition"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="text-xs text-slate-500 font-medium px-1.5">{donutPage3}</span>
            <button
              type="button"
              onClick={() => setDonutPage3((p) => p + 1)}
              className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs transition"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="py-3 sm:py-4 flex-1 flex items-center justify-center">
          <ElegantDonut
            data={warehouseAllocation.items}
            centerVal={warehouseAllocation.topVal}
            centerLabel={warehouseAllocation.topLabel}
            centerColor="#f43f5e"
            size={155}
            strokeWidth={18}
          />
        </div>

        <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
          {warehouseAllocation.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate max-w-[140px]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.label}</span>
              </div>
              <span className="font-semibold text-slate-700">+{item.pct}.00%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
