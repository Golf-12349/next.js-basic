'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Building2,
  Calendar,
  CalendarDays,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderArchive,
  Printer,
  RefreshCw,
  Search,
} from 'lucide-react';
import { DashboardLayout } from '@/app/components/dashboard-layout';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { useMasterData } from '@/app/(main)/context/MasterDataContext';
import { useArchive } from '@/app/(main)/context/ArchiveContext';
import { LAO_MONTHS } from '@/app/components/dashboard/dashboard-utils';
import { pushToast } from '@/app/components/ui/Toast';

type TabKey = 'monthly' | 'division' | 'expiry' | 'archive' | 'details';

// Classic Modern Monochrome / Minimalist Status Badges (No loud rainbow colors)
const statusBadgeClasses: Record<string, string> = {
  approved: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
  pending: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
  draft: 'bg-slate-50 text-slate-500 border border-slate-200 font-medium',
  archived: 'bg-slate-100 text-slate-600 border border-slate-200 font-medium',
  expired: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
};

const statusLabels: Record<string, string> = {
  approved: 'ອະນຸມັດແລ້ວ',
  pending: 'ລໍຖ້າອະນຸມັດ',
  draft: 'ຮ່າງເອກະສານ',
  archived: 'ເກັບເຂົ້າຄັງ',
  expired: 'ໝົດອາຍຸ',
};

const directionLabels: Record<string, string> = {
  inbound: 'ຂາເຂົ້າ (Inbound)',
  outbound: 'ຂາອອກ (Outbound)',
  internal: 'ພາຍໃນ (Internal)',
};

const directionBadgeClasses: Record<string, string> = {
  inbound: 'bg-slate-100 text-slate-700 border border-slate-200',
  outbound: 'bg-slate-100 text-slate-700 border border-slate-200',
  internal: 'bg-slate-50 text-slate-600 border border-slate-200',
};

function getDocDirection(direction?: string): 'inbound' | 'outbound' | 'internal' {
  if (direction === 'inbound' || direction === 'IN') return 'inbound';
  if (direction === 'outbound' || direction === 'OUT') return 'outbound';
  return 'internal';
}

export default function ReportsPage() {
  const { documents } = useDocuments();
  const { divisions, getDepartments } = useMasterData();
  const { warehouses, cabinets } = useArchive();

  const printRef = useRef<HTMLDivElement>(null);

  // ---------- Filters State ----------
  const [activeTab, setActiveTab] = useState<TabKey>('monthly');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDirection, setSelectedDirection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ---------- Filtered Dataset ----------
  const activeDocs = useMemo(() => documents.filter((d) => !d.deleted), [documents]);

  const filteredDocs = useMemo(() => {
    return activeDocs.filter((d) => {
      const dateStr = d.uploadDate || '';
      const docYear = dateStr.slice(0, 4);
      const docMonth = dateStr.slice(5, 7);

      if (selectedYear !== 'all' && docYear && docYear !== selectedYear) return false;
      if (selectedMonth !== 'all' && docMonth && docMonth !== selectedMonth) return false;
      if (selectedDivision !== 'all' && d.division !== selectedDivision) return false;
      if (selectedDirection !== 'all' && getDocDirection(d.direction) !== selectedDirection) return false;
      if (selectedStatus !== 'all' && d.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (d.title || '').toLowerCase().includes(q);
        const matchNo = (d.docNumber || '').toLowerCase().includes(q);
        const matchCat = (d.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchNo && !matchCat) return false;
      }

      return true;
    });
  }, [activeDocs, selectedYear, selectedMonth, selectedDivision, selectedDirection, selectedStatus, searchQuery]);

  // ---------- Overall KPI Calculations ----------
  const kpiStats = useMemo(() => {
    const total = filteredDocs.length;
    const approved = filteredDocs.filter((d) => d.status === 'approved').length;
    const pending = filteredDocs.filter((d) => d.status === 'pending').length;
    const archived = filteredDocs.filter((d) => d.status === 'archived').length;
    const expired = filteredDocs.filter((d) => d.status === 'expired').length;

    const inCount = filteredDocs.filter((d) => getDocDirection(d.direction) === 'inbound').length;
    const outCount = filteredDocs.filter((d) => getDocDirection(d.direction) === 'outbound').length;
    const internalCount = filteredDocs.filter((d) => getDocDirection(d.direction) === 'internal').length;

    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 100;

    return {
      total,
      approved,
      pending,
      archived,
      expired,
      inCount,
      outCount,
      internalCount,
      approvalRate,
    };
  }, [filteredDocs]);

  // ---------- 1. Monthly Trends Breakdown ----------
  const monthlyBreakdown = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const mNum = String(i + 1).padStart(2, '0');
      const mName = LAO_MONTHS[i];
      const docsInMonth = filteredDocs.filter((d) => (d.uploadDate || '').slice(5, 7) === mNum);

      const inDocs = docsInMonth.filter((d) => getDocDirection(d.direction) === 'inbound').length;
      const outDocs = docsInMonth.filter((d) => getDocDirection(d.direction) === 'outbound').length;
      const internalDocs = docsInMonth.filter((d) => getDocDirection(d.direction) === 'internal').length;
      const total = docsInMonth.length;

      return {
        monthNum: mNum,
        monthName: mName,
        total,
        inDocs,
        outDocs,
        internalDocs,
        approved: docsInMonth.filter((d) => d.status === 'approved').length,
        pending: docsInMonth.filter((d) => d.status === 'pending').length,
      };
    });

    const maxTotal = Math.max(1, ...months.map((m) => m.total));

    const totals = months.reduce(
      (acc, m) => ({
        total: acc.total + m.total,
        inDocs: acc.inDocs + m.inDocs,
        outDocs: acc.outDocs + m.outDocs,
        internalDocs: acc.internalDocs + m.internalDocs,
        approved: acc.approved + m.approved,
        pending: acc.pending + m.pending,
      }),
      { total: 0, inDocs: 0, outDocs: 0, internalDocs: 0, approved: 0, pending: 0 }
    );

    return { months, maxTotal, totals };
  }, [filteredDocs]);

  // ---------- 2. Division & Department Breakdown ----------
  const divisionBreakdown = useMemo(() => {
    const divList = divisions.length > 0 ? divisions : [
      'ຫ້ອງການສຳນັກງານໃຫຍ່',
      'ຝ່າຍຈັດຕັ້ງ ແລະ ບໍລິຫານ',
      'ຝ່າຍແຜນການ ແລະ ການລົງທຶນ',
      'ຝ່າຍການເງິນ',
      'ຝ່າຍເຕັກໂນໂລຊີ',
    ];

    const results = divList.map((divName) => {
      const docs = filteredDocs.filter((d) => d.division === divName);
      const total = docs.length;
      const approved = docs.filter((d) => d.status === 'approved').length;
      const pending = docs.filter((d) => d.status === 'pending').length;
      const expired = docs.filter((d) => d.status === 'expired').length;
      const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 100;

      const deptsInDiv = getDepartments(divName);

      return {
        name: divName,
        total,
        approved,
        pending,
        expired,
        approvalRate,
        departmentCount: deptsInDiv.length || 1,
      };
    });

    return results.sort((a, b) => b.total - a.total);
  }, [filteredDocs, divisions, getDepartments]);

  // ---------- 3. Expiry & Retention Risk Breakdown ----------
  const expiryRiskData = useMemo(() => {
    const now = new Date();

    const expiredList: any[] = [];
    const soon7DaysList: any[] = [];
    const soon30DaysList: any[] = [];
    const safeList: any[] = [];

    filteredDocs.forEach((d) => {
      if (!d.expiresAt) {
        safeList.push(d);
        return;
      }

      const expDate = new Date(d.expiresAt);
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const enriched = { ...d, daysRemaining: diffDays };

      if (d.status === 'expired' || diffDays <= 0) {
        expiredList.push(enriched);
      } else if (diffDays <= 7) {
        soon7DaysList.push(enriched);
      } else if (diffDays <= 30) {
        soon30DaysList.push(enriched);
      } else {
        safeList.push(enriched);
      }
    });

    return {
      expiredList: expiredList.sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0)),
      soon7DaysList: soon7DaysList.sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0)),
      soon30DaysList: soon30DaysList.sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0)),
      safeCount: safeList.length,
    };
  }, [filteredDocs]);

  // ---------- 4. Physical Storage Archive Breakdown ----------
  const archiveBreakdown = useMemo(() => {
    const assignedCount = filteredDocs.filter((d) => d.warehouseId || d.cabinetId || d.shelfId || d.folderId).length;
    const unassignedCount = filteredDocs.length - assignedCount;

    const whStats = warehouses.map((wh) => {
      const docsInWh = filteredDocs.filter((d) => d.warehouseId === wh.id);
      const whCabinets = cabinets.filter((c) => c.warehouseId === wh.id);
      return {
        id: wh.id,
        name: wh.name,
        color: wh.color || '#475569',
        total: docsInWh.length,
        cabinetsCount: whCabinets.length,
      };
    });

    return {
      assignedCount,
      unassignedCount,
      assignedRate: filteredDocs.length > 0 ? Math.round((assignedCount / filteredDocs.length) * 100) : 0,
      whStats,
    };
  }, [filteredDocs, warehouses, cabinets]);

  // ---------- Export to Excel ----------
  async function handleExportExcel() {
    if (filteredDocs.length === 0) {
      pushToast({ title: 'ບໍ່ມີຂໍ້ມູນໃຫ້ສົ່ງອອກ' });
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const rows = filteredDocs.map((d, index) => ({
        'ລຳດັບ': index + 1,
        'ເລກທີເອກະສານ': d.docNumber || '-',
        'ຊື່ເອກະສານ': d.title,
        'ໝວດໝູ່': d.category || '-',
        'ທິດທາງ': directionLabels[getDocDirection(d.direction)] || 'ພາຍໃນ',
        'ຝ່າຍ': d.division || 'ສູນກາງ',
        'ພະແນກ': d.department || '-',
        'ສະຖານະ': statusLabels[d.status] || d.status,
        'ວັນທີອັບໂຫຼດ': d.uploadDate || '-',
        'ວັນທີໝົດອາຍຸ': d.expiresAt || 'ບໍ່ກຳນົດ',
        'ຜູ້ອັບໂຫຼດ': d.uploadedBy || '-',
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ລາຍງານເອກະສານ');

      worksheet['!cols'] = [
        { wch: 8 },
        { wch: 18 },
        { wch: 36 },
        { wch: 16 },
        { wch: 14 },
        { wch: 22 },
        { wch: 20 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
      ];

      const fileName = `EDL-DMS-Report-${selectedYear}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      pushToast({ title: 'ສົ່ງອອກໄຟລ໌ Excel ສຳເລັດແລ້ວ' });
    } catch (err) {
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກ Excel' });
    }
  }

  // ---------- Print / PDF ----------
  function handlePrint() {
    window.print();
  }

  // ---------- Reset Filters ----------
  function handleResetFilters() {
    setSelectedYear('2026');
    setSelectedMonth('all');
    setSelectedDivision('all');
    setSelectedDirection('all');
    setSelectedStatus('all');
    setSearchQuery('');
  }

  const currentDateText = useMemo(() => {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }, []);

  return (
    <DashboardLayout title="ລາຍງານ & ສະຖິຕິ">
      <div className="w-full min-h-screen bg-[#fcfcfd] text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* =========================================================================
            CLASSIC MODERN MONOCHROME HEADER
            Clean executive presentation with no distracting colored badges
           ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    ລັດວິສາຫະກິດໄຟຟ້າລາວ • EDL-DMS
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    REPORT REGISTER
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
                  ບົດລາຍງານ ແລະ ສະຖິຕິເອກະສານປະຈຳງວດ
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  ສະຫຼຸບການເຄື່ອນໄຫວເອກະສານທາງການ, ສັດສ່ວນການອະນຸມັດ, ພາລະງານແຕ່ລະຝ່າຍ ແລະ ຄວາມສ່ຽງດ້ານອາຍຸການຈັດເກັບ
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS (Classic Modern Minimalist Buttons) */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
                title="ລ້າງຕົວກອງທັງໝົດ"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>ລ້າງຕົວກອງ</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
                title="ພິມລາຍງານ"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>ພິມລາຍງານ</span>
              </button>
              <button
                type="button"
                onClick={() => void handleExportExcel()}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition shadow-sm flex items-center gap-1.5"
                title="ສົ່ງອອກໄຟລ໌ Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-200" />
                <span>Export Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* REPORT METADATA STRIP */}
          <div className="pt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">ວັນທີອອກບົດລາຍງານ</span>
              <span className="font-medium text-slate-700 tabular-nums">{currentDateText}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">ຂອບເຂດປີທີ່ວິເຄາະ</span>
              <span className="font-medium text-slate-700">
                {selectedYear === 'all' ? 'ທຸກປີ (All Years)' : `ປີ ${selectedYear}`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">ຈຳນວນເອກະສານທີ່ພົບ</span>
              <span className="font-bold text-slate-900 tabular-nums">{filteredDocs.length} ສະບັບ</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">ສະຖານະລະບົບ</span>
              <span className="font-medium text-slate-700">
                ອັບເດດສົດຕາມຖານຂໍ້ມູນ
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FILTER CRITERIA TOOLBAR (Clean Minimalist Form Controls)
           ========================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 print:hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-slate-500" />
              <span>ເງື່ອນໄຂການກັ່ນຕອງຂໍ້ມູນ (Report Filters)</span>
            </div>
            <div className="text-[11px] text-slate-400">
              ກັ່ນຕອງໄດ້ <span className="font-semibold text-slate-600 tabular-nums">{filteredDocs.length}</span> / <span className="tabular-nums">{activeDocs.length}</span> ລາຍການ
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* Filter Year */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                ປີ (Year)
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              >
                <option value="all">ທຸກປີ (All)</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

            {/* Filter Month */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                ເດືອນ (Month)
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              >
                <option value="all">ທຸກເດືອນ (All)</option>
                {LAO_MONTHS.map((m, idx) => {
                  const mVal = String(idx + 1).padStart(2, '0');
                  return (
                    <option key={mVal} value={mVal}>
                      {idx + 1}. {m}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filter Division */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                ຝ່າຍ (Division)
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              >
                <option value="all">ທຸກຝ່າຍ (All)</option>
                {divisions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Direction */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                ທິດທາງ (Direction)
              </label>
              <select
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              >
                <option value="all">ທັງໝົດ (All)</option>
                <option value="inbound">ຂາເຂົ້າ (Inbound)</option>
                <option value="outbound">ຂາອອກ (Outbound)</option>
                <option value="internal">ພາຍໃນ (Internal)</option>
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                ສະຖານະ (Status)
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              >
                <option value="all">ທຸກສະຖານະ (All)</option>
                <option value="approved">ອະນຸມັດແລ້ວ</option>
                <option value="pending">ລໍຖ້າອະນຸມັດ</option>
                <option value="draft">ຮ່າງເອກະສານ</option>
                <option value="archived">ເກັບເຂົ້າຄັງ</option>
                <option value="expired">ໝົດອາຍຸ</option>
              </select>
            </div>

            {/* Search Query */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                ຄົ້ນຫາ (Keyword)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ເລກທີ, ຊື່, ໝວດໝູ່..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            PRINTABLE / REPORT CONTAINER
           ========================================================================= */}
        <div id="print-area" ref={printRef} className="space-y-6">
          
          {/* =========================================================================
              CLASSIC MODERN KPI METRIC CARDS (No Loud Colors, Pure Minimalist Elegance)
             ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            
            {/* 1. Total */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                ເອກະສານທັງໝົດ
              </span>
              <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                {kpiStats.total}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">ສະບັບໃນງວດນີ້</span>
            </div>

            {/* 2. Approved */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                ອະນຸມັດແລ້ວ
              </span>
              <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                {kpiStats.approved}
              </div>
              <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                {kpiStats.approvalRate}% ຂອງທັງໝົດ
              </span>
            </div>

            {/* 3. Pending */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                ລໍຖ້າອະນຸມັດ
              </span>
              <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                {kpiStats.pending}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">ລໍຖ້າການດຳເນີນງານ</span>
            </div>

            {/* 4. Inbound */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                ເອກະສານຂາເຂົ້າ
              </span>
              <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                {kpiStats.inCount}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">ຂາເຂົ້າ (Inbound)</span>
            </div>

            {/* 5. Outbound */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                ເອກະສານຂາອອກ
              </span>
              <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                {kpiStats.outCount}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">ຂາອອກ (Outbound)</span>
            </div>

            {/* 6. Expired */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                ໝົດອາຍຸແລ້ວ
              </span>
              <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                {kpiStats.expired}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">ຕ້ອງຕໍ່ອາຍຸ ຫຼື ທຳລາຍ</span>
            </div>

          </div>

          {/* =========================================================================
              CLASSIC MODERN TABS (Clean Minimalist Underline)
             ========================================================================= */}
          <div className="border-b border-slate-200 bg-white rounded-t-xl px-3 pt-2 border-x border-t flex items-center gap-1 overflow-x-auto scrollbar-none print:hidden">
            
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'monthly'
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>1. ແນວໂນ້ມລາຍເດືອນ (Monthly Trends)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('division')}
              className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'division'
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>2. ຕາມຝ່າຍ &amp; ພະແນກ (Divisions)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('expiry')}
              className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'expiry'
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>3. ຄວາມສ່ຽງໝົດອາຍຸ (Expiry &amp; Retention)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'archive'
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>4. ຄັງຈັດເກັບ (Physical Archive)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'details'
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>5. ລາຍການເອກະສານລະອຽດ ({filteredDocs.length})</span>
            </button>

          </div>

          {/* =========================================================================
              TAB 1: MONTHLY TRENDS (Monochrome Clean Presentation)
             ========================================================================= */}
          {activeTab === 'monthly' && (
            <div className="space-y-5">
              <div className="bg-white rounded-b-xl rounded-t-none border-x border-b border-slate-200 p-5 shadow-sm">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      ສະຖິຕິການເຄື່ອນໄຫວເອກະສານຕະຫຼອດປີ {selectedYear}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ປຽບທຽບເອກະສານ ຂາເຂົ້າ (Inbound), ຂາອອກ (Outbound) ແລະ ພາຍໃນ (Internal) ທັງ 12 ເດືອນ
                    </p>
                  </div>

                  {/* Monochrome Minimalist Legend */}
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-slate-800 rounded-sm" /> ຂາເຂົ້າ (Inbound)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-slate-500 rounded-sm" /> ຂາອອກ (Outbound)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-slate-300 rounded-sm" /> ພາຍໃນ (Internal)
                    </span>
                  </div>
                </div>

                {/* MONTHLY COLUMN VISUALIZATION */}
                <div className="mt-6">
                  <div className="relative h-60 w-full pt-4 pb-2 border-b border-slate-200">
                    
                    {/* Horizontal Reference Grid Lines */}
                    <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-100 pointer-events-none" />
                    <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-100 pointer-events-none" />

                    <div className="flex items-end justify-between gap-2 h-full">
                      {monthlyBreakdown.months.map((m) => {
                        const inPct = (m.inDocs / monthlyBreakdown.maxTotal) * 100;
                        const outPct = (m.outDocs / monthlyBreakdown.maxTotal) * 100;
                        const internalPct = (m.internalDocs / monthlyBreakdown.maxTotal) * 100;

                        return (
                          <div
                            key={m.monthNum}
                            className="flex-1 flex flex-col justify-end h-full items-center group relative cursor-pointer"
                          >
                            {/* Hover Tooltip */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-slate-800 text-white text-[10px] py-1 px-2.5 rounded-md shadow-lg pointer-events-none z-20 whitespace-nowrap">
                              <span className="font-bold">{m.monthName}</span>
                              <span className="font-mono text-[9px] text-slate-300">
                                ລວມ: {m.total} (IN: {m.inDocs}, OUT: {m.outDocs}, INT: {m.internalDocs})
                              </span>
                            </div>

                            {/* Stacked Column Bar (Monochrome Slate Grayscale) */}
                            <div className="w-full max-w-[32px] flex flex-col justify-end h-full rounded-t-[2px] overflow-hidden transition-transform duration-150 group-hover:brightness-95">
                              <div
                                className="w-full bg-slate-300 transition-colors"
                                style={{ height: `${internalPct}%` }}
                                title={`ພາຍໃນ: ${m.internalDocs}`}
                              />
                              <div
                                className="w-full bg-slate-500 transition-colors"
                                style={{ height: `${outPct}%` }}
                                title={`ຂາອອກ: ${m.outDocs}`}
                              />
                              <div
                                className="w-full bg-slate-800 transition-colors"
                                style={{ height: `${inPct}%` }}
                                title={`ຂາເຂົ້າ: ${m.inDocs}`}
                              />
                            </div>

                            <span className="text-[11px] font-medium text-slate-500 mt-2 truncate">
                              {m.monthName.slice(0, 3)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* MONTHLY BREAKDOWN TABLE (All Neutral Figures, No Rainbow Text) */}
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">ງວດເດືອນ</th>
                        <th className="py-2.5 px-3 text-right">ເອກະສານທັງໝົດ</th>
                        <th className="py-2.5 px-3 text-right">ຂາເຂົ້າ (IN)</th>
                        <th className="py-2.5 px-3 text-right">ຂາອອກ (OUT)</th>
                        <th className="py-2.5 px-3 text-right">ພາຍໃນ (INT)</th>
                        <th className="py-2.5 px-3 text-right">ອະນຸມັດແລ້ວ</th>
                        <th className="py-2.5 px-3 text-right">ລໍຖ້າອະນຸມັດ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {monthlyBreakdown.months.map((m) => (
                        <tr key={m.monthNum} className="even:bg-slate-50/40 hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {m.monthName} ({m.monthNum})
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {m.total}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {m.inDocs}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {m.outDocs}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                            {m.internalDocs}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 font-medium">
                            {m.approved}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                            {m.pending}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Classic Financial Total Row */}
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-800 text-xs">
                        <td className="py-2.5 px-3">ລວມທັງໝົດ (TOTAL)</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900">
                          {monthlyBreakdown.totals.total}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                          {monthlyBreakdown.totals.inDocs}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                          {monthlyBreakdown.totals.outDocs}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                          {monthlyBreakdown.totals.internalDocs}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                          {monthlyBreakdown.totals.approved}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                          {monthlyBreakdown.totals.pending}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: DIVISION & DEPARTMENT BREAKDOWN
             ========================================================================= */}
          {activeTab === 'division' && (
            <div className="space-y-5">
              <div className="bg-white rounded-b-xl rounded-t-none border-x border-b border-slate-200 p-5 shadow-sm">
                
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">
                    ສະຖິຕິພາລະງານເອກະສານແຍກຕາມແຕ່ລະຝ່າຍ (Divisions)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ປຽບທຽບປະລິມານເອກະສານ, ອັດຕາການອະນຸມັດ ແລະ ຄວາມສ່ຽງເອກະສານໝົດອາຍຸແຕ່ລະພາກສ່ວນ
                  </p>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">ຊື່ຝ່າຍ (Division)</th>
                        <th className="py-2.5 px-3 text-center">ຈຳນວນພະແນກ</th>
                        <th className="py-2.5 px-3 text-right">ເອກະສານທັງໝົດ</th>
                        <th className="py-2.5 px-3 text-center">ສັດສ່ວນ (%)</th>
                        <th className="py-2.5 px-3 text-right">ອະນຸມັດແລ້ວ</th>
                        <th className="py-2.5 px-3 text-right">ລໍຖ້າອະນຸມັດ</th>
                        <th className="py-2.5 px-3 text-right">ໝົດອາຍຸ</th>
                        <th className="py-2.5 px-3 text-center">ອັດຕາອະນຸມັດ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {divisionBreakdown.map((div, i) => {
                        const totalAll = filteredDocs.length || 1;
                        const pctOfTotal = Math.round((div.total / totalAll) * 100);

                        return (
                          <tr key={i} className="even:bg-slate-50/40 hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {div.name}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                              {div.departmentCount}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 tabular-nums">
                              {div.total}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="w-24 mx-auto flex items-center gap-2">
                                <div className="h-1.5 w-full bg-slate-100 rounded-sm overflow-hidden">
                                  <div
                                    className="h-full bg-slate-800 rounded-sm"
                                    style={{ width: `${pctOfTotal}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                  {pctOfTotal}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 font-medium">
                              {div.approved}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 font-medium">
                              {div.pending}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 font-medium">
                              {div.expired}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {div.approvalRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: EXPIRY & RETENTION RISK (Clean Monochrome Cards)
             ========================================================================= */}
          {activeTab === 'expiry' && (
            <div className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      ເອກະສານໝົດອາຍຸແລ້ວ
                    </span>
                    <AlertTriangle className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {expiryRiskData.expiredList.length} ສະບັບ
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ເກີນກຳນົດອາຍຸການຈັດເກັບ ຕ້ອງດຳເນີນການຕໍ່ອາຍຸ ຫຼື ທຳລາຍຕາມລະບຽບ
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      ຈະໝົດອາຍຸໃນ 7 ວັນ
                    </span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {expiryRiskData.soon7DaysList.length} ສະບັບ
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ເອກະສານດ່ວນທີ່ຕ້ອງກຽມຕໍ່ອາຍຸພາຍໃນອາທິດນີ້
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      ຈະໝົດອາຍຸໃນ 30 ວັນ
                    </span>
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {expiryRiskData.soon30DaysList.length} ສະບັບ
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ເອກະສານໃນໄລຍະເຝົ້າລະວັງພາຍໃນ 1 ເດືອນ
                  </p>
                </div>

              </div>

              {/* TABLE OF EXPIRING DOCS */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      ລາຍການເອກະສານທີ່ມີຄວາມສ່ຽງດ້ານອາຍຸການ (Risk Inventory)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ລາຍການເອກະສານທີ່ໝົດອາຍຸ ແລະ ໃກ້ໝົດອາຍຸພາຍໃນ 7 ວັນ
                    </p>
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-500">
                    ລວມ {expiryRiskData.expiredList.length + expiryRiskData.soon7DaysList.length} ລາຍການ
                  </span>
                </div>

                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">ເລກທີ / ຊື່ເອກະສານ</th>
                        <th className="py-2.5 px-3">ຝ່າຍ / ພະແນກ</th>
                        <th className="py-2.5 px-3">ວັນທີໝົດອາຍຸ</th>
                        <th className="py-2.5 px-3 text-center">ສະຖານະຄວາມສ່ຽງ</th>
                        <th className="py-2.5 px-3 text-right">ຈັດການ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {[...expiryRiskData.expiredList, ...expiryRiskData.soon7DaysList].map((doc, idx) => (
                        <tr key={doc.id || idx} className="even:bg-slate-50/40 hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-800">{doc.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{doc.docNumber || '-'}</p>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {doc.division || 'ສູນກາງ'} {doc.department ? `• ${doc.department}` : ''}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {doc.expiresAt}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {doc.daysRemaining <= 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                                ໝົດອາຍຸແລ້ວ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                ເຫຼືອ {doc.daysRemaining} ມື້
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              href="/documents/expired"
                              className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                            >
                              ຕໍ່ອາຍຸ
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: PHYSICAL STORAGE ARCHIVE
             ========================================================================= */}
          {activeTab === 'archive' && (
            <div className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      ອັດຕາການຈັດເກັບເຂົ້າຄັງກາຍະພາບ
                    </span>
                    <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                      {archiveBreakdown.assignedRate}%
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700 tabular-nums">{archiveBreakdown.assignedCount}</span> ສະບັບ ໄດ້ລະບຸຕູ້/ຊັ້ນ/ແຟ້ມແລ້ວ
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 flex items-center justify-center">
                    <Archive className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      ເອກະສານທີ່ຍັງບໍ່ທັນເຂົ້າຕູ້ (Unassigned)
                    </span>
                    <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                      {archiveBreakdown.unassignedCount}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ເອກະສານທີ່ຍັງບໍ່ທັນໄດ້ກຳນົດຕູ້ຈັດເກັບ
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 flex items-center justify-center">
                    <FolderArchive className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* WAREHOUSE UTILIZATION TABLE */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">
                    ສະຖິຕິເອກະສານແຍກຕາມຄັງຈັດເກັບ (Warehouse Utilization)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ປະລິມານເອກະສານ ແລະ ຈຳນວນຕູ້ໃນແຕ່ລະຄັງເອກະສານ
                  </p>
                </div>

                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">ຊື່ຄັງເອກະສານ</th>
                        <th className="py-2.5 px-3 text-center">ຈຳນວນຕູ້ເອກະສານ</th>
                        <th className="py-2.5 px-3 text-right">ເອກະສານພາຍໃນຄັງ</th>
                        <th className="py-2.5 px-3 text-right">ຈັດການ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {archiveBreakdown.whStats.map((wh) => (
                        <tr key={wh.id} className="even:bg-slate-50/40 hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm bg-slate-600" />
                            <span>{wh.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700">
                            {wh.cabinetsCount} ຕູ້
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {wh.total} ສະບັບ
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              href={`/documents/archive?warehouseId=${wh.id}`}
                              className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                            >
                              ເປີດເບິ່ງຄັງ
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 5: DOCUMENT DETAILS LIST
             ========================================================================= */}
          {activeTab === 'details' && (
            <div className="bg-white rounded-b-xl rounded-t-none border-x border-b border-slate-200 p-5 shadow-sm">
              
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    ລາຍການເອກະສານລະອຽດ (Document Register)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ສະແດງທັງໝົດ {filteredDocs.length} ລາຍການຕາມເງື່ອນໄຂຕົວກອງ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleExportExcel()}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>ດາວໂຫຼດ Excel</span>
                </button>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-slate-400">#</th>
                      <th className="py-2.5 px-3">ເລກທີ / ຊື່ເອກະສານ</th>
                      <th className="py-2.5 px-3">ໝວດໝູ່</th>
                      <th className="py-2.5 px-3">ທິດທາງ</th>
                      <th className="py-2.5 px-3">ຝ່າຍ / ພະແນກ</th>
                      <th className="py-2.5 px-3">ສະຖານະ</th>
                      <th className="py-2.5 px-3">ວັນທີອັບໂຫຼດ</th>
                      <th className="py-2.5 px-3 text-right">ເບິ່ງ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredDocs.map((doc, i) => (
                      <tr key={doc.id || i} className="even:bg-slate-50/40 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{i + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          <p className="font-semibold text-slate-800 truncate max-w-xs">{doc.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{doc.docNumber || '-'}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                            {doc.category || '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                              directionBadgeClasses[getDocDirection(doc.direction)] || 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {directionLabels[getDocDirection(doc.direction)] || 'ພາຍໃນ'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          <p className="text-slate-800 font-medium">{doc.division || 'ສູນກາງ'}</p>
                          <p className="text-slate-400 text-[10px]">{doc.department || '-'}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] ${
                              statusBadgeClasses[doc.status] || 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {statusLabels[doc.status] || doc.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                          {doc.uploadDate || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href="/documents"
                            className="inline-flex p-1 text-slate-400 hover:text-slate-700 transition"
                            title="ເປີດເບິ່ງເອກະສານ"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}
