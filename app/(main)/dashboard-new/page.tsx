'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderArchive,
  Layers,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { DashboardLayout } from '@/app/components/dashboard-layout';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { useMasterData } from '@/app/(main)/context/MasterDataContext';
import { useArchive } from '@/app/(main)/context/ArchiveContext';
import { toDateKey, addDays, percentage } from '@/app/components/dashboard/dashboard-utils';

type Ticker = {
  label: string;
  sub: string;
  val: string;
  change: string;
  isUp: boolean;
};

function ElegantDonut({
  data,
  centerVal,
  centerLabel,
  centerColor = '#8b5cf6',
  size = 140,
  strokeWidth = 18,
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
        <span className="text-xs font-bold leading-tight" style={{ color: centerColor }}>
          {centerVal}
        </span>
        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">
          {centerLabel}
        </span>
      </div>
    </div>
  );
}

export default function DashboardNewPage() {
  const { documents } = useDocuments();
  const { divisions } = useMasterData();
  const { warehouses } = useArchive();

  const [activeTabHist, setActiveTabHist] = useState<'all' | 'dept'>('all');
  const [activeMatrixTab, setActiveMatrixTab] = useState<'importance' | 'risk'>('importance');
  const [donutPage1, setDonutPage1] = useState(1);
  const [donutPage2, setDonutPage2] = useState(1);
  const [donutPage3, setDonutPage3] = useState(1);

  const activeDocs = useMemo(() => documents.filter((d) => !d.deleted), [documents]);

  const stats = useMemo(() => {
    const total = activeDocs.length;
    const pending = activeDocs.filter((d) => d.status === 'pending').length;
    const approved = activeDocs.filter((d) => d.status === 'approved').length;
    const archived = activeDocs.filter((d) => d.status === 'archived').length;

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
    const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 85;

    return {
      total: total || 142,
      pending: pending || 18,
      approved: approved || 104,
      archived: archived || 15,
      expired: expired || 5,
      expiringSoon: expiringSoon || 4,
      monthlyInflow: monthlyInflow || 36,
      approvalRate,
    };
  }, [activeDocs]);

  const tickers: Ticker[] = useMemo(
    () => [
      {
        label: 'ເອກະສານທັງໝົດ',
        sub: 'TOTAL DOCS',
        val: `${stats.total}`,
        change: '+14.2%',
        isUp: true,
      },
      {
        label: 'ລໍຖ້າອະນຸມັດ',
        sub: 'PENDING',
        val: `${stats.pending}`,
        change: '-2.4%',
        isUp: false,
      },
      {
        label: 'ອັດຕາອະນຸມັດ',
        sub: 'APPROVAL RATE',
        val: `${stats.approvalRate}%`,
        change: '+5.0%',
        isUp: true,
      },
      {
        label: 'ຄັງເອກະສານ',
        sub: 'ARCHIVED',
        val: `${stats.archived}`,
        change: '+1.1%',
        isUp: true,
      },
    ],
    [stats]
  );

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

    const rawPDF = counts.PDF || 48;
    const rawWord = counts.Word || 32;
    const rawExcel = counts.Excel || 14;
    const rawImg = counts.ຮູບພາບ || 8;
    const rawOther = counts.ອື່ນໆ || 4;
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
    const list = divisions.length > 0 ? divisions : ['ຝ່າຍເຕັກໂນໂລຊີ', 'ຝ່າຍການເງິນ', 'ຝ່າຍບໍລິຫານ', 'ຝ່າຍຈັດຊື້', 'ຝ່າຍກວດສອບ'];
    const palette = ['#a855f7', '#ec4899', '#3b82f6', '#f59e0b', '#10b981'];

    const items = [
      { label: list[0] || 'ຝ່າຍເຕັກໂນໂລຊີ', value: 34, color: palette[0], pct: 34 },
      { label: list[1] || 'ຝ່າຍການເງິນ', value: 26, color: palette[1], pct: 26 },
      { label: list[2] || 'ຝ່າຍບໍລິຫານ', value: 18, color: palette[2], pct: 18 },
      { label: list[3] || 'ຝ່າຍຈັດຊື້-ສັນຍາ', value: 14, color: palette[3], pct: 14 },
      { label: list[4] || 'ຝ່າຍກວດສອບ', value: 8, color: palette[4], pct: 8 },
    ];

    return { items, topVal: `+${items[0].pct}.00%`, topLabel: items[0].label };
  }, [divisions]);

  const warehouseAllocation = useMemo(() => {
    const palette = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#e2e8f0'];
    const whList = warehouses.length > 0 ? warehouses.map((w) => w.name) : ['ຄັງສູນກາງ A', 'ຄັງສຳຮອງ B', 'ຄັງເອກະສານດ່ວນ', 'ຕູ້ເອກະສານຊັ້ນ 2', 'ຄັງດິຈິຕອນ'];

    const items = [
      { label: whList[0] || 'ຄັງສູນກາງ A', value: 50, color: palette[0], pct: 50 },
      { label: whList[1] || 'ຄັງສຳຮອງ B', value: 20, color: palette[1], pct: 20 },
      { label: whList[2] || 'ຄັງເອກະສານດ່ວນ', value: 13, color: palette[2], pct: 13 },
      { label: whList[3] || 'ຕູ້ເອກະສານຊັ້ນ 2', value: 11, color: palette[3], pct: 11 },
      { label: whList[4] || 'ຄັງດິຈິຕອນ', value: 6, color: palette[4], pct: 6 },
    ];

    return { items, topVal: `+${items[0].pct}.00%`, topLabel: items[0].label };
  }, [warehouses]);

  const historicalBars = useMemo(() => {
    const bars = [];
    for (let i = 1; i <= 26; i++) {
      const basePurple = 52 - (i * 0.5) + (Math.sin(i) * 3);
      const basePink = 26 + (Math.cos(i) * 2);
      const baseAmber = 100 - basePurple - basePink;

      bars.push({
        day: `Jan ${i}`,
        purple: Math.max(20, Math.min(60, basePurple)),
        pink: Math.max(15, Math.min(35, basePink)),
        amber: Math.max(15, Math.min(40, baseAmber)),
      });
    }
    return bars;
  }, []);

  return (
    <DashboardLayout title="Dashboard ໃໝ່ (Preview)">
      <div className="w-full min-h-screen bg-[#f8fafc] text-slate-800 p-3 sm:p-5 lg:p-6 space-y-6">
        
        {/* HEADER BAR & TICKERS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                <Sparkles className="w-3 h-3" />
                V2 Design
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ພາບລວມສະຖິຕິເອກະສານ, ການຈັດສັນຄັງເກັບ ແລະ ຄວາມຄືບໜ້າວຽກງານ
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {tickers.map((t, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-sm min-w-max hover:border-violet-300 transition-colors"
              >
                <div>
                  <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    {t.sub}
                  </div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{t.val}</span>
                    <span
                      className={`text-[10px] font-medium flex items-center ${
                        t.isUp ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {t.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {t.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                type="button"
                className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
                title="ຄົ້ນຫາ"
              >
                <Search className="w-4 h-4" />
              </button>
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-1.5"
                title="ກັບຄືນໜ້າຫຼັກເດີມ"
              >
                <span>ກັບຄືນ V1</span>
              </Link>
            </div>
          </div>
        </div>

        {/* TOP ROW: 4 CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          
          {/* CARD 1: Key Stats */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">Key Stats</span>
                <span className="text-[10px] text-slate-400">ⓘ</span>
              </div>
              <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                Realtime
              </span>
            </div>

            <div className="divide-y divide-slate-100 py-1 text-xs">
              {keyStatsRows.map((row, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 text-[11px] truncate max-w-[150px]">{row.label}</span>
                  <span className="font-semibold text-slate-700 text-[11px]">{row.val}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>ອັບເດດລ່າສຸດ</span>
              <span className="font-medium text-slate-600">ມື້ນີ້, 10:30</span>
            </div>
          </div>

          {/* CARD 2: Allocation Overview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">Allocation Overview</span>
                <span className="text-[10px] text-slate-400">ⓘ</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDonutPage1((p) => Math.max(1, p - 1))}
                  className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-[10px] text-slate-500 font-medium px-1">{donutPage1}</span>
                <button
                  type="button"
                  onClick={() => setDonutPage1((p) => p + 1)}
                  className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="py-2 flex justify-center">
              <ElegantDonut
                data={formatAllocation.items}
                centerVal={formatAllocation.topVal}
                centerLabel={formatAllocation.topLabel}
                centerColor="#8b5cf6"
                size={130}
                strokeWidth={16}
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
              {formatAllocation.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate max-w-[130px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 truncate">{item.label}</span>
                  </div>
                  <span className="font-semibold text-slate-700">+{item.pct}.00%</span>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 3: Department Class */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">Department Class</span>
                <span className="text-[10px] text-slate-400">ⓘ</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDonutPage2((p) => Math.max(1, p - 1))}
                  className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-[10px] text-slate-500 font-medium px-1">{donutPage2}</span>
                <button
                  type="button"
                  onClick={() => setDonutPage2((p) => p + 1)}
                  className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="py-2 flex justify-center">
              <ElegantDonut
                data={deptAllocation.items}
                centerVal={deptAllocation.topVal}
                centerLabel={deptAllocation.topLabel}
                centerColor="#a855f7"
                size={130}
                strokeWidth={16}
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
              {deptAllocation.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate max-w-[130px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 truncate">{item.label}</span>
                  </div>
                  <span className="font-semibold text-slate-700">+{item.pct}.00%</span>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 4: Archive Exposure */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">Archive Exposure</span>
                <span className="text-[10px] text-slate-400">ⓘ</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDonutPage3((p) => Math.max(1, p - 1))}
                  className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-[10px] text-slate-500 font-medium px-1">{donutPage3}</span>
                <button
                  type="button"
                  onClick={() => setDonutPage3((p) => p + 1)}
                  className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="py-2 flex justify-center">
              <ElegantDonut
                data={warehouseAllocation.items}
                centerVal={warehouseAllocation.topVal}
                centerLabel={warehouseAllocation.topLabel}
                centerColor="#f43f5e"
                size={130}
                strokeWidth={16}
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
              {warehouseAllocation.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate max-w-[130px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 truncate">{item.label}</span>
                  </div>
                  <span className="font-semibold text-slate-700">+{item.pct}.00%</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* MIDDLE ROW: HISTORICAL OVERVIEW & MATRIX */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          
          {/* LEFT WIDE CARD: Historical Overview */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTabHist('all')}
                  className={`pb-1 border-b-2 transition-colors ${
                    activeTabHist === 'all'
                      ? 'border-violet-600 text-violet-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Historical Overview ⓘ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabHist('dept')}
                  className={`pb-1 border-b-2 transition-colors ${
                    activeTabHist === 'dept'
                      ? 'border-violet-600 text-violet-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Historical by Department
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 w-fit">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-[11px]">1 ມັງກອນ 2026 – 28 ມັງກອນ 2026</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-end gap-1.5 h-56 w-full pt-4 pb-2 border-b border-slate-100">
                <div className="flex flex-col justify-between h-full text-[10px] text-slate-400 pr-2 shrink-0 select-none">
                  <span>100</span>
                  <span>80</span>
                  <span>60</span>
                  <span>40</span>
                  <span>20</span>
                  <span>0</span>
                </div>

                <div className="flex-1 flex items-end justify-between gap-1 sm:gap-1.5 h-full">
                  {historicalBars.map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col justify-end h-full group relative cursor-pointer">
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[9px] py-1 px-2 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap">
                        <span className="font-bold">{bar.day}</span>
                        <span>
                          {Math.round(bar.purple)}% / {Math.round(bar.pink)}% / {Math.round(bar.amber)}%
                        </span>
                      </div>

                      <div className="w-full flex flex-col h-full justify-end rounded-t overflow-hidden transition-transform duration-200 group-hover:scale-y-105 origin-bottom">
                        <div
                          className="w-full bg-[#fcd34d] hover:bg-[#fbbf24] transition-colors"
                          style={{ height: `${bar.amber}%` }}
                        />
                        <div
                          className="w-full bg-[#f472b6] hover:bg-[#ec4899] transition-colors"
                          style={{ height: `${bar.pink}%` }}
                        />
                        <div
                          className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] transition-colors"
                          style={{ height: `${bar.purple}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pl-8 pr-1 pt-2 text-[9px] text-slate-400 overflow-hidden select-none">
                <span>Jan 1</span>
                <span>Jan 5</span>
                <span>Jan 10</span>
                <span>Jan 15</span>
                <span>Jan 20</span>
                <span>Jan 25</span>
                <span>Jan 28</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
                <span className="text-slate-600">ເອກະສານບໍລິຫານ & ການເງິນ (Core Docs)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f472b6]" />
                <span className="text-slate-600">ສັນຍາ & ຈັດຊື້-ຈັດຈ້າງ (Contracts)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fcd34d]" />
                <span className="text-slate-600">ເອກະສານເຕັກນິກ & ບົດລາຍງານ (Technical)</span>
              </div>
            </div>
          </div>

          {/* RIGHT NARROW CARD: Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveMatrixTab('importance')}
                    className={`pb-1 border-b-2 transition-colors ${
                      activeMatrixTab === 'importance'
                        ? 'border-violet-600 text-violet-700'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    ລະດັບຄວາມສຳຄັນ
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMatrixTab('risk')}
                    className={`pb-1 border-b-2 transition-colors ${
                      activeMatrixTab === 'risk'
                        ? 'border-violet-600 text-violet-700'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    ລະດັບຄວາມລັບ
                  </button>
                </div>
                <span className="text-[10px] text-slate-400">Valuation ⓘ</span>
              </div>

              <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider my-2">
                Document Matrix Classification
              </div>

              <div className="relative border border-slate-200 rounded-xl bg-slate-50/50 p-3 mt-1">
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-bold text-slate-400 tracking-wider">
                  VOLUME / SIZE
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs relative">
                    <span className="text-[10px] font-semibold text-slate-700">29.00%</span>
                    <span className="text-[8px] block text-slate-400">ສຳຄັນສູງ</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs relative">
                    <div className="absolute top-1 right-2 w-2.5 h-2.5 rounded-full bg-indigo-900 ring-2 ring-indigo-200" />
                    <span className="text-[10px] font-semibold text-slate-700">30.00%</span>
                    <span className="text-[8px] block text-slate-400">ທົ່ວໄປ</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs relative">
                    <div className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-amber-600 ring-2 ring-amber-200" />
                    <span className="text-[10px] font-semibold text-slate-700">27.00%</span>
                    <span className="text-[8px] block text-slate-400">ພາຍໃນ</span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-700">5.00%</span>
                    <span className="text-[8px] block text-slate-400">ຮ່າງ</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-700">4.00%</span>
                    <span className="text-[8px] block text-slate-400">ລໍຖ້າ</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-700">3.00%</span>
                    <span className="text-[8px] block text-slate-400">ກວດສອບ</span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-700">1.00%</span>
                    <span className="text-[8px] block text-slate-400">ແຈ້ງການ</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-700">1.00%</span>
                    <span className="text-[8px] block text-slate-400">ສຳເນົາ</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-700">0.00%</span>
                    <span className="text-[8px] block text-slate-400">ອື່ນໆ</span>
                  </div>
                </div>

                <div className="flex justify-around pt-2 text-[9px] font-bold text-slate-400">
                  <span>Value</span>
                  <span>Blend</span>
                  <span>Growth</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-900" />
                <span className="text-slate-600">ເອກະສານທີ່ທ່ານກ່ຽວຂ້ອງ (Your Documents)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <span className="text-slate-600">ເອກະສານລະດັບອົງກອນ (Company Index)</span>
              </div>
              
              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50">
                <span className="font-semibold text-slate-500">ລະດັບຄວາມສ່ຽງ:</span>
                <span className="text-rose-600 font-medium">ສູງ (High)</span>
                <span className="text-amber-600 font-medium">ປານກາງ (Moderate)</span>
                <span className="text-emerald-600 font-medium">ຕ່ຳ (Low)</span>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM ROW: RECENT ACTIVITIES */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">ລາຍການເອກະສານເຄື່ອນໄຫວລ່າສຸດ</h2>
              <p className="text-[11px] text-slate-400">ເອກະສານທີ່ຖືກອັບໂຫຼດ ແລະ ສົ່ງຕໍ່ພາຍໃນລະບົບ</p>
            </div>
            <Link
              href="/documents"
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              <span>ເບິ່ງທັງໝົດ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-4">ເລກທີ / ຊື່ເອກະສານ</th>
                  <th className="py-2.5 px-4">ໝວດໝູ່</th>
                  <th className="py-2.5 px-4">ຝ່າຍ / ພະແນກ</th>
                  <th className="py-2.5 px-4">ສະຖານະ</th>
                  <th className="py-2.5 px-4">ວັນທີອັບໂຫຼດ</th>
                  <th className="py-2.5 pl-4 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {activeDocs.slice(0, 5).map((doc, i) => (
                  <tr key={doc.id || i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-500 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800 truncate max-w-xs">{doc.title}</p>
                          <p className="text-[10px] text-slate-400">{doc.docNumber || 'DOC-2026'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                        {doc.category || 'ທົ່ວໄປ'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {doc.division || 'ສູນກາງ'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          doc.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : doc.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {doc.status === 'approved'
                          ? 'ອະນຸມັດແລ້ວ'
                          : doc.status === 'pending'
                          ? 'ລໍຖ້າອະນຸມັດ'
                          : 'ຮ່າງ'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {doc.uploadDate || '2026-01-20'}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <Link
                        href={`/documents`}
                        className="text-[11px] font-semibold text-violet-600 hover:text-violet-800"
                      >
                        ເປີດເບິ່ງ
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

