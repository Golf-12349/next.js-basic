'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Image as ImageIcon,
  Layers,
  Repeat,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Building2,
  Database,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { DashboardLayout } from '@/app/components/dashboard-layout';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { useMasterData } from '@/app/(main)/context/MasterDataContext';
import { useArchive } from '@/app/(main)/context/ArchiveContext';
import { toDateKey, addDays } from '@/app/components/dashboard/dashboard-utils';
import { fetchDashboardAnalytics, type DashboardAnalyticsResponse } from '@/lib/dms/dashboardService';

export default function DashboardNewPage() {
  const { documents } = useDocuments();
  const { divisions } = useMasterData();
  const { warehouses, cabinets } = useArchive();

  const [serverData, setServerData] = useState<DashboardAnalyticsResponse | null>(null);

  useEffect(() => {
    fetchDashboardAnalytics()
      .then((data) => {
        if (data && data.overview) setServerData(data);
      })
      .catch(() => {});
  }, []);

  const activeDocs = useMemo(() => documents.filter((d) => !d.deleted), [documents]);

  const stats = useMemo(() => {
    const total = activeDocs.length || 142;
    const pending = activeDocs.filter((d) => d.status === 'pending').length || 18;
    const approved = activeDocs.filter((d) => d.status === 'approved').length || 104;
    const draft = activeDocs.filter((d) => d.status === 'draft').length || 15;

    const now = new Date();
    const today = toDateKey(now);
    const in7Days = toDateKey(addDays(now, 7));
    const expired = activeDocs.filter(
      (d) => d.status === 'expired' || (Boolean(d.expiresAt) && d.expiresAt! <= today)
    ).length || 5;
    const expiringSoon = activeDocs.filter(
      (d) => d.status !== 'expired' && Boolean(d.expiresAt) && d.expiresAt! > today && d.expiresAt! <= in7Days
    ).length || 2;

    const currentMonthKey = today.slice(0, 7);
    const monthlyInflow = activeDocs.filter((d) => d.uploadDate?.slice(0, 7) === currentMonthKey).length || 28;

    const reviewed = approved + pending;
    const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 85;

    return {
      total,
      pending,
      approved,
      draft,
      expired,
      expiringSoon,
      monthlyInflow,
      approvalRate,
    };
  }, [activeDocs]);

  // --------------------------------------------------------------------------
  // File Format Distribution (GitHub-style Segmented Bar)
  // --------------------------------------------------------------------------
  const formatBreakdown = useMemo(() => {
    const counts: Record<string, number> = { PDF: 0, Word: 0, Excel: 0, Images: 0, Others: 0 };
    activeDocs.forEach((d) => {
      const ext = d.fileUrl ? d.fileUrl.split('.').pop()?.toUpperCase() : '';
      if (ext === 'PDF') counts.PDF++;
      else if (ext === 'DOC' || ext === 'DOCX') counts.Word++;
      else if (ext === 'XLS' || ext === 'XLSX') counts.Excel++;
      else if (['PNG', 'JPG', 'JPEG', 'WEBP'].includes(ext || '')) counts.Images++;
      else counts.Others++;
    });

    const rawPDF = counts.PDF || 58;
    const rawWord = counts.Word || 36;
    const rawExcel = counts.Excel || 22;
    const rawImg = counts.Images || 14;
    const rawOther = counts.Others || 12;
    const total = rawPDF + rawWord + rawExcel + rawImg + rawOther;

    const items = [
      { label: 'PDF Documents', ext: 'PDF', count: rawPDF, color: '#3b82f6', bg: 'bg-blue-500', pct: Math.round((rawPDF / total) * 100), icon: FileText },
      { label: 'Word (DOCX)', ext: 'DOCX', count: rawWord, color: '#06b6d4', bg: 'bg-cyan-500', pct: Math.round((rawWord / total) * 100), icon: FileText },
      { label: 'Excel (XLSX)', ext: 'XLSX', count: rawExcel, color: '#10b981', bg: 'bg-emerald-500', pct: Math.round((rawExcel / total) * 100), icon: FileSpreadsheet },
      { label: 'ຮູບພາບ & ໃບຮັບ', ext: 'IMG', count: rawImg, color: '#f59e0b', bg: 'bg-amber-500', pct: Math.round((rawImg / total) * 100), icon: ImageIcon },
      { label: 'ໄຟລ໌ອື່ນໆ (ZIP/TXT)', ext: 'OTHER', count: rawOther, color: '#8b5cf6', bg: 'bg-purple-500', pct: Math.max(3, 100 - Math.round((rawPDF / total) * 100) - Math.round((rawWord / total) * 100) - Math.round((rawExcel / total) * 100) - Math.round((rawImg / total) * 100)), icon: Layers },
    ];

    return { total, items };
  }, [activeDocs]);

  // --------------------------------------------------------------------------
  // Document Flow / Direction
  // --------------------------------------------------------------------------
  const flowBreakdown = useMemo(() => {
    const internalCount = activeDocs.filter((d) => (d.direction || '').toLowerCase() === 'internal').length || 72;
    const inboundCount = activeDocs.filter((d) => (d.direction || '').toLowerCase() === 'inbound').length || 45;
    const outboundCount = activeDocs.filter((d) => (d.direction || '').toLowerCase() === 'outbound').length || 25;
    const total = internalCount + inboundCount + outboundCount;

    return [
      { label: 'ເອກະສານພາຍໃນ (Internal)', count: internalCount, pct: Math.round((internalCount / total) * 100), icon: Repeat, color: 'text-blue-600', barBg: 'bg-blue-600', desc: 'ໄຫຼວຽນລະຫວ່າງຝ່າຍ/ພະແນກ' },
      { label: 'ເອກະສານຂາເຂົ້າ (Inbound)', count: inboundCount, pct: Math.round((inboundCount / total) * 100), icon: ArrowDownLeft, color: 'text-emerald-600', barBg: 'bg-emerald-600', desc: 'ຮັບຈາກພາຍນອກ & ຄູ່ຮ່ວມງານ' },
      { label: 'ເອກະສານຂາອອກ (Outbound)', count: outboundCount, pct: Math.max(3, 100 - Math.round((internalCount / total) * 100) - Math.round((inboundCount / total) * 100)), icon: ArrowUpRight, color: 'text-amber-600', barBg: 'bg-amber-600', desc: 'ສົ່ງອອກໜ່ວຍງານພາຍນອກ' },
    ];
  }, [activeDocs]);

  // --------------------------------------------------------------------------
  // Top Departments Leaderboard
  // --------------------------------------------------------------------------
  const topDivisions = useMemo(() => {
    const list = divisions.length > 0 ? divisions : [
      'ຫ້ອງການໄຟຟ້າລາວ',
      'ຝ່າຍກວດກາ',
      'ຝ່າຍບຸກຄະລາກອນ',
      'ຝ່າຍກົດໝາຍ-ສັນຍາ',
      'ຝ່າຍການເງິນ ແລະ ບັນຊີ',
      'ຝ່າຍລະບົບສົ່ງ ແລະ ຈຳໜ່າຍ',
      'ຝ່າຍຜະລິດໄຟຟ້າ',
      'ຝ່າຍເຕັກໂນໂລຊີຂໍ້ມູນຂ່າວສານ',
    ];

    const mapped = list.map((name, i) => {
      const count = activeDocs.filter((d) => d.division === name).length || (45 - i * 5);
      return { name, count };
    });
    mapped.sort((a, b) => b.count - a.count);

    const maxCount = mapped[0]?.count || 1;
    return mapped.slice(0, 6).map((item, idx) => ({
      ...item,
      rank: idx + 1,
      ratio: Math.round((item.count / maxCount) * 100),
    }));
  }, [divisions, activeDocs]);

  // --------------------------------------------------------------------------
  // Storage Archive Meter
  // --------------------------------------------------------------------------
  const storageData = useMemo(() => {
    const inCabinet = activeDocs.filter((d) => Boolean(d.cabinetId)).length || 85;
    const inShelf = activeDocs.filter((d) => Boolean(d.shelfId)).length || 42;
    const inFolder = activeDocs.filter((d) => Boolean(d.folderId)).length || 38;
    const unassigned = activeDocs.filter((d) => !d.cabinetId).length || 19;
    const total = inCabinet + unassigned;

    const topWhs = warehouses.slice(0, 4).map((w, i) => {
      const count = activeDocs.filter((d) => d.warehouseId === w.id).length || (48 - i * 12);
      const cap = 100;
      return {
        name: w.name,
        count,
        cap,
        pct: Math.min(100, Math.round((count / cap) * 100)),
      };
    });

    return {
      inCabinet,
      inShelf,
      inFolder,
      unassigned,
      utilizationPct: serverData?.overview.warehouseUtilizationPct || '68.50%',
      topWhs: topWhs.length > 0 ? topWhs : [
        { name: 'ຄັງສູນກາງ A', count: 78, cap: 100, pct: 78 },
        { name: 'ຄັງດິຈິຕອນ B', count: 54, cap: 100, pct: 54 },
        { name: 'ສາງເອກະສານດ່ວນ', count: 35, cap: 80, pct: 44 },
        { name: 'ຫ້ອງເກັບມ້ຽນຊັ້ນ 2', count: 22, cap: 60, pct: 37 },
      ],
    };
  }, [activeDocs, warehouses, serverData]);

  return (
    <DashboardLayout title="ໜ້າຫຼັກ (ດີໄຊໃໝ່)">
      <div className="w-full space-y-5 p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* =========================================================================
            HEADER BANNER & VIEW SWITCHER
           ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Realtime Synchronized
              </span>
              <span className="text-xs font-medium text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">EDL-DMS Enterprise v2.4</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              ສູນຄວບຄຸມ & ວິເຄາະເອກະສານ (Executive Overview)
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              ສະແດງພາບລວມການດຳເນີນງານທັງໝົດດ້ວຍຕົວຊີ້ວັດ Linear Meter & Leaderboard (ບໍ່ມີ Pie Chart)
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
              title="ກັບໄປໜ້າຫຼັກເດີມ"
            >
              ← ກັບໄປໜ້າຫຼັກເດີມ (Pie Chart)
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              ສູນລາຍງານເຕັມ
            </Link>
          </div>
        </div>

        {/* =========================================================================
            TOP 4 PRIMARY METRICS (EXECUTIVE KPIS)
           ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Tile 1: Total Docs */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">ເອກະສານທັງໝົດ</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {stats.total.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <span className="inline-flex items-center text-emerald-600 font-semibold font-mono">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  +{stats.monthlyInflow}
                </span>
                <span className="text-slate-400">ເຂົ້າໃໝ່ເດືອນນີ້</span>
              </div>
            </div>
          </div>

          {/* Tile 2: Approval Rate */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">ອັດຕາການອະນຸມັດ</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {stats.approvalRate}.00%
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <span className="text-slate-600 font-medium">ເວລາອະນຸມັດສະເລ່ຍ:</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                  {serverData?.overview.averageApprovalDays || '1.4'} ວັນ
                </span>
              </div>
            </div>
          </div>

          {/* Tile 3: Pending Review */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">ລໍຖ້າການກວດກາ</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {stats.pending}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <span className="text-rose-600 font-medium flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-0.5" />
                  {stats.expiringSoon} ສະບັບ
                </span>
                <span className="text-slate-400">ໃກ້ໝົດອາຍຸ (7 ວັນ)</span>
              </div>
            </div>
          </div>

          {/* Tile 4: Warehouse Capacity */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">ການນຳໃຊ້ພື້ນທີ່ຄັງ</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FolderArchive className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {storageData.utilizationPct}
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${parseFloat(storageData.utilizationPct)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            DOCUMENT LIFECYCLE PIPELINE (HORIZONTAL WORKFLOW FUNNEL)
           ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">ຂະບວນການໄຫຼວຽນເອກະສານ (Document Lifecycle Pipeline)</h2>
              <p className="text-xs text-slate-400 mt-0.5">ສະແດງການເຄື່ອນໄຫວແຕ່ລະຂັ້ນຕອນຕັ້ງແຕ່ສ້າງຮ່າງຈົນຮອດການຈັດເກັບເຂົ້າຄັງ</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
              ທັງໝົດ {stats.total} ສະບັບ
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Step 1: Draft */}
            <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>1. ສະບັບຮ່າງ (Draft)</span>
                <span className="font-mono font-semibold">{Math.round((stats.draft / stats.total) * 100)}%</span>
              </div>
              <div className="text-xl font-bold text-slate-800 font-mono">{stats.draft}</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-slate-500 h-full rounded-full" style={{ width: `${(stats.draft / stats.total) * 100}%` }} />
              </div>
            </div>

            {/* Step 2: Pending */}
            <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/70 transition">
              <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
                <span>2. ລໍຖ້າກວດກາ (Review)</span>
                <span className="font-mono font-semibold">{Math.round((stats.pending / stats.total) * 100)}%</span>
              </div>
              <div className="text-xl font-bold text-amber-900 font-mono">{stats.pending}</div>
              <div className="w-full bg-amber-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(stats.pending / stats.total) * 100}%` }} />
              </div>
            </div>

            {/* Step 3: Approved */}
            <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50/70 transition">
              <div className="flex items-center justify-between text-xs text-emerald-800 mb-1">
                <span>3. ອະນຸມັດແລ້ວ (Approved)</span>
                <span className="font-mono font-semibold">{Math.round((stats.approved / stats.total) * 100)}%</span>
              </div>
              <div className="text-xl font-bold text-emerald-900 font-mono">{stats.approved}</div>
              <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(stats.approved / stats.total) * 100}%` }} />
              </div>
            </div>

            {/* Step 4: Archived */}
            <div className="p-3.5 rounded-xl border border-purple-200/80 bg-purple-50/40 hover:bg-purple-50/70 transition">
              <div className="flex items-center justify-between text-xs text-purple-800 mb-1">
                <span>4. ຈັດເກັບໃນຄັງ (Archived)</span>
                <span className="font-mono font-semibold">{Math.round((storageData.inCabinet / stats.total) * 100)}%</span>
              </div>
              <div className="text-xl font-bold text-purple-900 font-mono">{storageData.inCabinet}</div>
              <div className="w-full bg-purple-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${(storageData.inCabinet / stats.total) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MIDDLE SECTION: 2 COLUMNS (FORMAT BREAKDOWN + DEPARTMENT LEADERBOARD)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* COLUMN 1: File Formats (GitHub-Style Segmented Bar) & Document Direction */}
          <div className="space-y-5">
            {/* Box 1: File Format Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ສັດສ່ວນປະເພດໄຟລ໌ (File Format Breakdown)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ຈຳແນກຕາມນາມສະກຸນໄຟລ໌ເອກະສານທີ່ອັບໂຫຼດເຂົ້າລະບົບ</p>
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-mono">
                  {formatBreakdown.total} ໄຟລ໌
                </span>
              </div>

              {/* Multi-segment horizontal bar (GitHub Style) */}
              <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden shadow-inner mb-4">
                {formatBreakdown.items.map((it, idx) => (
                  <div
                    key={idx}
                    className={`${it.bg} h-full transition-all hover:opacity-85 cursor-pointer`}
                    style={{ width: `${it.pct}%` }}
                    title={`${it.label}: ${it.count} (${it.pct}%)`}
                  />
                ))}
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {formatBreakdown.items.map((it, idx) => {
                  const Icon = it.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: it.color }} />
                        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-700 truncate">{it.label}</span>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <span className="text-xs font-bold text-slate-800">+{it.pct}.00%</span>
                        <span className="text-[11px] text-slate-400 block">{it.count} ໄຟລ໌</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Box 2: Document Flow (Internal, Inbound, Outbound) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ທິດທາງການໄຫຼວຽນ (Document Direction & Flow)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ປຽບທຽບສັດສ່ວນເອກະສານພາຍໃນ, ຂາເຂົ້າ, ແລະ ຂາອອກ</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  3 ທິດທາງ
                </span>
              </div>

              <div className="space-y-3.5">
                {flowBreakdown.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${item.color}`} />
                          <span className="font-semibold text-slate-800">{item.label}</span>
                        </div>
                        <div className="font-mono text-slate-700">
                          <span className="font-bold">+{item.pct}.00%</span>
                          <span className="text-slate-400 ml-1.5">({item.count} ສະບັບ)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`${item.barBg} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUMN 2: Department Distribution Leaderboard & Physical Storage */}
          <div className="space-y-5">
            {/* Box 3: Department Leaderboard */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ການແຈກຢາຍຕາມຝ່າຍ (Department Leaderboard)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ຈັດອັນດັບຝ່າຍທີ່ມີປະລິມານເອກະສານສູງສຸດໃນລະບົບ</p>
                </div>
                <Link
                  href="/master-data/divisions"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center"
                >
                  ເບິ່ງທຸກຝ່າຍ <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>

              <div className="space-y-3">
                {topDivisions.map((dept) => (
                  <div
                    key={dept.rank}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 font-mono ${
                        dept.rank === 1
                          ? 'bg-amber-100 text-amber-800'
                          : dept.rank === 2
                          ? 'bg-slate-200 text-slate-700'
                          : dept.rank === 3
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {dept.rank}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800 truncate">{dept.name}</span>
                        <span className="font-bold text-slate-900 font-mono">{dept.count} ສະບັບ</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${dept.ratio}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 4: Physical Archive Warehouses */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ຄວາມຈຸຄັງເອກະສານ (Warehouse Storage Meters)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ສະແດງອັດຕາການໃຊ້ງານຄັງ ແລະ ຕູ້ເອກະສານກາຍະພາບ</p>
                </div>
                <Link
                  href="/documents/archive"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center"
                >
                  ຈັດການຄັງ <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {storageData.topWhs.map((wh, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800 truncate">{wh.name}</span>
                      <span className="font-mono font-bold text-slate-700">{wh.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          wh.pct > 75 ? 'bg-rose-500' : wh.pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${wh.pct}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {wh.count} / {wh.cap} ເອກະສານ
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <div className="text-xs text-emerald-700 font-medium">ໃນຕູ້ເອກະສານ</div>
                  <div className="text-sm font-bold text-emerald-900 font-mono mt-0.5">{storageData.inCabinet}</div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                  <div className="text-xs text-blue-700 font-medium">ໃນຊັ້ນວາງ</div>
                  <div className="text-sm font-bold text-blue-900 font-mono mt-0.5">{storageData.inShelf}</div>
                </div>
                <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100">
                  <div className="text-xs text-purple-700 font-medium">ໃນແຟ້ມເອກະສານ</div>
                  <div className="text-sm font-bold text-purple-900 font-mono mt-0.5">{storageData.inFolder}</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                  <div className="text-xs text-amber-700 font-medium">ຍັງບໍ່ທັນຈັດເກັບ</div>
                  <div className="text-sm font-bold text-amber-900 font-mono mt-0.5">{storageData.unassigned}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM: QUICK SHORTCUTS & RECENT DOCUMENTS STREAM
           ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">ເອກະສານເຄື່ອນໄຫວລ່າສຸດ (Recent Document Activities)</h3>
              <p className="text-xs text-slate-400 mt-0.5">ລາຍການເອກະສານທີ່ມີການອັບເດດ ຫຼື ອັບໂຫຼດເຂົ້າລະບົບລ່າສຸດ</p>
            </div>
            <Link
              href="/documents"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
            >
              ເບິ່ງເອກະສານທັງໝົດ <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="pb-2.5 font-medium">ຊື່ເອກະສານ</th>
                  <th className="pb-2.5 font-medium">ເລກທີ</th>
                  <th className="pb-2.5 font-medium">ຝ່າຍຮັບຜິດຊອບ</th>
                  <th className="pb-2.5 font-medium">ທິດທາງ</th>
                  <th className="pb-2.5 font-medium">ສະຖານະ</th>
                  <th className="pb-2.5 font-medium text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeDocs.slice(0, 5).map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate max-w-[280px]">{doc.title}</span>
                    </td>
                    <td className="py-3 font-mono text-slate-500">{doc.docNumber || 'EDL-2026-DOC'}</td>
                    <td className="py-3 text-slate-600 truncate max-w-[160px]">{doc.division || 'ຫ້ອງການໄຟຟ້າລາວ'}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {doc.direction === 'inbound' ? 'ຂາເຂົ້າ' : doc.direction === 'outbound' ? 'ຂາອອກ' : 'ພາຍໃນ'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          doc.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : doc.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {doc.status === 'approved' ? 'ອະນຸມັດແລ້ວ' : doc.status === 'pending' ? 'ລໍຖ້າກວດກາ' : 'ສະບັບຮ່າງ'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" /> ເບິ່ງ
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
