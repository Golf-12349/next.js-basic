'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Archive,
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderArchive,
  Layers,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DashboardLayout } from '@/app/components/dashboard-layout';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { useMasterData } from '@/app/(main)/context/MasterDataContext';
import { useArchive } from '@/app/(main)/context/ArchiveContext';
import { LAO_MONTHS, toDateKey } from '@/app/components/dashboard/dashboard-utils';
import { pushToast } from '@/app/components/ui/Toast';

type TabKey = 'monthly' | 'division' | 'expiry' | 'archive' | 'details';

const statusBadgeClasses: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  draft: 'bg-slate-100 text-slate-700 border border-slate-200',
  archived: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  expired: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const statusLabels: Record<string, string> = {
  approved: 'ອະນຸມັດແລ້ວ',
  pending: 'ລໍຖ້າອະນຸມັດ',
  draft: 'ຮ່າງເອກະສານ',
  archived: 'ເກັບເຂົ້າຄັງ',
  expired: 'ໝົດອາຍຸ',
};

const directionLabels: Record<string, string> = {
  inbound: 'ຂາເຂົ້າ (IN)',
  outbound: 'ຂາອອກ (OUT)',
  internal: 'ພາຍໃນ (INTERNAL)',
};

function getDocDirection(direction?: string): 'inbound' | 'outbound' | 'internal' {
  if (direction === 'inbound' || direction === 'IN') return 'inbound';
  if (direction === 'outbound' || direction === 'OUT') return 'outbound';
  return 'internal';
}

export default function ReportsPage() {
  const { documents, categories } = useDocuments();
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

    return { months, maxTotal };
  }, [filteredDocs]);

  // ---------- 2. Division & Department Breakdown ----------
  const divisionBreakdown = useMemo(() => {
    const divList = divisions.length > 0 ? divisions : [
      'ຫ້ອງການໄຟຟ້າລາວ',
      'ຝ່າຍກວດກາ',
      'ຝ່າຍບຸກຄະລາກອນ',
      'ຝ່າຍກົດໝາຍ-ສັນຍາ',
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

      // Group departments under this division
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
    const today = toDateKey(now);

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
        color: wh.color || '#4f46e5',
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
        { wch: 16 },
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

  return (
    <DashboardLayout title="ລາຍງານ & ສະຖິຕິ">
      <div className="w-full min-h-screen bg-[#f8fafc] text-slate-800 p-3 sm:p-5 lg:p-6 space-y-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                ສູນລາຍງານ &amp; ສະຖິຕິເອກະສານ
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ລາຍງານສະຫຼຸບຂໍ້ມູນເອກະສານລະດັບອົງກອນ (EDL DMS) ແຍກຕາມເດືອນ, ຝ່າຍ, ພະແນກ, ແລະ ອາຍຸການຈັດເກັບ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
              title="ລ້າງຕົວກອງ"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>ລ້າງຕົວກອງ</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
              title="ພິມລາຍງານ"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>ພິມລາຍງານ</span>
            </button>
            <button
              type="button"
              onClick={() => void handleExportExcel()}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm flex items-center gap-1.5"
              title="ສົ່ງອອກໄຟລ໌ Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* FILTER TOOLBAR */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-violet-600" />
            <span>ຕົວກອງລາຍງານ (Report Filters)</span>
            <span className="text-[11px] font-normal text-slate-400">
              (ພົບ {filteredDocs.length} ລາຍການ ຈາກທັງໝົດ {activeDocs.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {/* Filter Year */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">ປີ (Year)</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:outline-violet-500"
              >
                <option value="all">ທຸກປີ (All Years)</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            {/* Filter Month */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">ເດືອນ (Month)</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:outline-violet-500"
              >
                <option value="all">ທຸກເດືອນ (All Months)</option>
                {LAO_MONTHS.map((m, idx) => (
                  <option key={idx} value={String(idx + 1).padStart(2, '0')}>
                    {m} (ເດືອນ {idx + 1})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Division */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">ຝ່າຍ (Division)</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:outline-violet-500"
              >
                <option value="all">ທຸກຝ່າຍ (All Divisions)</option>
                {divisions.map((div, i) => (
                  <option key={i} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Direction */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">ທິດທາງ (Direction)</label>
              <select
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:outline-violet-500"
              >
                <option value="all">ທັງໝົດ (All)</option>
                <option value="inbound">ຂາເຂົ້າ (IN)</option>
                <option value="outbound">ຂາອອກ (OUT)</option>
                <option value="internal">ພາຍໃນ (INTERNAL)</option>
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">ສະຖານະ (Status)</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:outline-violet-500"
              >
                <option value="all">ທຸກສະຖານະ (All Statuses)</option>
                <option value="approved">ອະນຸມັດແລ້ວ</option>
                <option value="pending">ລໍຖ້າອະນຸມັດ</option>
                <option value="archived">ເກັບເຂົ້າຄັງ</option>
                <option value="expired">ໝົດອາຍຸ</option>
                <option value="draft">ຮ່າງເອກະສານ</option>
              </select>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">ຄົ້ນຫາ (Search)</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ເລກທີ ຫຼື ຊື່..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-2 text-xs text-slate-700 focus:bg-white focus:outline-violet-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* PRINTABLE REPORT CONTAINER */}
        <div id="print-area" ref={printRef} className="space-y-6">
          
          {/* TOP KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">ເອກະສານໃນຊ່ວງນີ້</span>
              <div className="mt-1 text-xl font-bold text-slate-900">{kpiStats.total}</div>
              <span className="text-[10px] text-slate-400">ສະບັບທັງໝົດ</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
              <span className="text-[10px] font-semibold text-emerald-600 uppercase">ອະນຸມັດແລ້ວ</span>
              <div className="mt-1 text-xl font-bold text-emerald-700">{kpiStats.approved}</div>
              <span className="text-[10px] text-emerald-600 font-medium">{kpiStats.approvalRate}% ຂອງທັງໝົດ</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
              <span className="text-[10px] font-semibold text-amber-600 uppercase">ລໍຖ້າອະນຸມັດ</span>
              <div className="mt-1 text-xl font-bold text-amber-700">{kpiStats.pending}</div>
              <span className="text-[10px] text-amber-600">ລໍຖ້າດຳເນີນການ</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
              <span className="text-[10px] font-semibold text-sky-600 uppercase">ເອກະສານຂາເຂົ້າ</span>
              <div className="mt-1 text-xl font-bold text-sky-700">{kpiStats.inCount}</div>
              <span className="text-[10px] text-sky-600">ຂາເຂົ້າ (IN)</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
              <span className="text-[10px] font-semibold text-purple-600 uppercase">ເອກະສານຂາອອກ</span>
              <div className="mt-1 text-xl font-bold text-purple-700">{kpiStats.outCount}</div>
              <span className="text-[10px] text-purple-600">ຂາອອກ (OUT)</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
              <span className="text-[10px] font-semibold text-rose-600 uppercase">ໝົດອາຍຸແລ້ວ</span>
              <div className="mt-1 text-xl font-bold text-rose-700">{kpiStats.expired}</div>
              <span className="text-[10px] text-rose-600">ຕ້ອງຕໍ່ອາຍຸ</span>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none print:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'monthly'
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>1. ລາຍງານລາຍເດືອນ (Monthly Trends)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('division')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'division'
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>2. ຕາມຝ່າຍ &amp; ພະແນກ (By Division)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expiry')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'expiry'
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>3. ອາຍຸເອກະສານ &amp; ຄວາມສ່ຽງ (Expiry &amp; Risk)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'archive'
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>4. ຄັງຈັດເກັບກາຍະພາບ (Physical Archive)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'details'
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>5. ລາຍການເອກະສານລະອຽດ ({filteredDocs.length})</span>
            </button>
          </div>

          {/* TAB 1: MONTHLY TRENDS */}
          {activeTab === 'monthly' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      ແນວໂນ້ມປະລິມານເອກະສານຕະຫຼອດປີ {selectedYear}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      ປຽບທຽບເອກະສານ ຂາເຂົ້າ (IN), ຂາອອກ (OUT) ແລະ ພາຍໃນ (INTERNAL) ທັງ 12 ເດືອນ
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-sky-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> ຂາເຂົ້າ (IN)
                    </span>
                    <span className="flex items-center gap-1.5 text-purple-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> ຂາອອກ (OUT)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> ພາຍໃນ (INTERNAL)
                    </span>
                  </div>
                </div>

                {/* MONTHLY BAR VISUALIZATION */}
                <div className="mt-6">
                  <div className="flex items-end gap-2 h-56 w-full pt-4 pb-2 border-b border-slate-100">
                    <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2 h-full">
                      {monthlyBreakdown.months.map((m) => {
                        const inPct = (m.inDocs / monthlyBreakdown.maxTotal) * 100;
                        const outPct = (m.outDocs / monthlyBreakdown.maxTotal) * 100;
                        const internalPct = (m.internalDocs / monthlyBreakdown.maxTotal) * 100;

                        return (
                          <div
                            key={m.monthNum}
                            className="flex-1 flex flex-col justify-end h-full items-center group relative cursor-pointer"
                          >
                            {/* Tooltip */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[9px] py-1 px-2 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap">
                              <span className="font-bold">{m.monthName}</span>
                              <span>ທັງໝົດ: {m.total} (IN: {m.inDocs}, OUT: {m.outDocs}, INT: {m.internalDocs})</span>
                            </div>

                            {/* Stacked Bar */}
                            <div className="w-full max-w-[28px] flex flex-col justify-end h-full rounded-t overflow-hidden transition-transform duration-200 group-hover:scale-y-105 origin-bottom">
                              <div
                                className="w-full bg-amber-400 hover:bg-amber-500 transition-colors"
                                style={{ height: `${internalPct}%` }}
                              />
                              <div
                                className="w-full bg-purple-500 hover:bg-purple-600 transition-colors"
                                style={{ height: `${outPct}%` }}
                              />
                              <div
                                className="w-full bg-sky-500 hover:bg-sky-600 transition-colors"
                                style={{ height: `${inPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 mt-2 truncate max-w-[36px]">
                              {m.monthName.slice(0, 3)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* MONTHLY TABLE */}
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 pr-4">ເດືອນ</th>
                        <th className="py-2.5 px-4 text-center">ເອກະສານທັງໝົດ</th>
                        <th className="py-2.5 px-4 text-center">ຂາເຂົ້າ (IN)</th>
                        <th className="py-2.5 px-4 text-center">ຂາອອກ (OUT)</th>
                        <th className="py-2.5 px-4 text-center">ພາຍໃນ (INT)</th>
                        <th className="py-2.5 px-4 text-center">ອະນຸມັດແລ້ວ</th>
                        <th className="py-2.5 pl-4 text-center">ລໍຖ້າອະນຸມັດ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {monthlyBreakdown.months.map((m) => (
                        <tr key={m.monthNum} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 pr-4 font-semibold text-slate-800">
                            {m.monthName} (ເດືອນ {m.monthNum})
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-slate-900">{m.total}</td>
                          <td className="py-2.5 px-4 text-center text-sky-600 font-medium">{m.inDocs}</td>
                          <td className="py-2.5 px-4 text-center text-purple-600 font-medium">{m.outDocs}</td>
                          <td className="py-2.5 px-4 text-center text-amber-600 font-medium">{m.internalDocs}</td>
                          <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">{m.approved}</td>
                          <td className="py-2.5 pl-4 text-center text-amber-600 font-medium">{m.pending}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIVISION & DEPARTMENT BREAKDOWN */}
          {activeTab === 'division' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    ສະຖິຕິເອກະສານແຍກຕາມຝ່າຍ ແລະ ພະແນກ
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ປຽບທຽບພາລະງານເອກະສານ ແລະ ປະສິດທິພາບການອະນຸມັດຂອງແຕ່ລະຝ່າຍໃນອົງກອນ
                  </p>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="py-3 pr-4">ຊື່ຝ່າຍ (Division)</th>
                        <th className="py-3 px-4 text-center">ຈຳນວນເອກະສານ</th>
                        <th className="py-3 px-4 text-center">ສັດສ່ວນ (%)</th>
                        <th className="py-3 px-4 text-center">ອະນຸມັດແລ້ວ</th>
                        <th className="py-3 px-4 text-center">ລໍຖ້າອະນຸມັດ</th>
                        <th className="py-3 px-4 text-center">ໝົດອາຍຸ</th>
                        <th className="py-3 pl-4 text-center">ອັດຕາອະນຸມັດ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {divisionBreakdown.map((div, i) => {
                        const totalAll = filteredDocs.length || 1;
                        const pctOfTotal = Math.round((div.total / totalAll) * 100);

                        return (
                          <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 pr-4">
                              <div className="font-semibold text-slate-800">{div.name}</div>
                              <span className="text-[10px] text-slate-400">
                                {div.departmentCount} ພະແນກພາຍໃຕ້ສັງກັດ
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-900 text-sm">{div.total}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="w-24 mx-auto">
                                <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1">
                                  <span>{pctOfTotal}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-violet-600 rounded-full"
                                    style={{ width: `${pctOfTotal}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{div.approved}</td>
                            <td className="py-3 px-4 text-center text-amber-600 font-semibold">{div.pending}</td>
                            <td className="py-3 px-4 text-center text-rose-600 font-semibold">{div.expired}</td>
                            <td className="py-3 pl-4 text-center">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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

          {/* TAB 3: EXPIRY & RETENTION RISK */}
          {activeTab === 'expiry' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-4">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>ເອກະສານທີ່ໝົດອາຍຸແລ້ວ ({expiryRiskData.expiredList.length})</span>
                  </div>
                  <p className="text-[11px] text-rose-600/80 mt-1">
                    ເອກະສານທີ່ເກີນກຳນົດອາຍຸການຈັດເກັບ ຕ້ອງໄດ້ຮັບການຕໍ່ອາຍຸ ຫຼື ທຳລາຍຕາມລະບຽບ
                  </p>
                </div>
                <div className="bg-amber-50/50 rounded-2xl border border-amber-200 p-4">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>ໃກ້ໝົດອາຍຸໃນ 7 ວັນ ({expiryRiskData.soon7DaysList.length})</span>
                  </div>
                  <p className="text-[11px] text-amber-600/80 mt-1">
                    ເອກະສານດ່ວນທີ່ຕ້ອງກຽມຕໍ່ອາຍຸພາຍໃນອາທິດນີ້
                  </p>
                </div>
                <div className="bg-sky-50/50 rounded-2xl border border-sky-200 p-4">
                  <div className="flex items-center gap-2 text-sky-700 font-bold text-xs">
                    <CalendarDays className="w-4 h-4" />
                    <span>ໃກ້ໝົດອາຍຸໃນ 30 ວັນ ({expiryRiskData.soon30DaysList.length})</span>
                  </div>
                  <p className="text-[11px] text-sky-600/80 mt-1">
                    ເອກະສານທີ່ຢູ່ໃນໄລຍະເຝົ້າລະວັງພາຍໃນ 1 ເດືອນ
                  </p>
                </div>
              </div>

              {/* LIST OF EXPIRED & EXPIRING DOCS */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    ລາຍການເອກະສານທີ່ມີຄວາມສ່ຽງດ້ານອາຍຸການ
                  </h3>
                  <span className="text-xs text-slate-400">
                    ທັງໝົດ {expiryRiskData.expiredList.length + expiryRiskData.soon7DaysList.length} ສະບັບ
                  </span>
                </div>

                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 pr-4">ເລກທີ / ຊື່ເອກະສານ</th>
                        <th className="py-2.5 px-4">ຝ່າຍ / ພະແນກ</th>
                        <th className="py-2.5 px-4">ວັນທີໝົດອາຍຸ</th>
                        <th className="py-2.5 px-4 text-center">ສະຖານະຄວາມສ່ຽງ</th>
                        <th className="py-2.5 pl-4 text-right">ຈັດການ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {[...expiryRiskData.expiredList, ...expiryRiskData.soon7DaysList].map((doc, idx) => (
                        <tr key={doc.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 pr-4">
                            <p className="font-semibold text-slate-800">{doc.title}</p>
                            <p className="text-[10px] text-slate-400">{doc.docNumber}</p>
                          </td>
                          <td className="py-3 px-4 text-[11px]">
                            {doc.division || 'ສູນກາງ'} {doc.department ? `• ${doc.department}` : ''}
                          </td>
                          <td className="py-3 px-4 text-[11px] font-medium text-slate-700">
                            {doc.expiresAt}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {doc.daysRemaining <= 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                <AlertTriangle className="w-3 h-3" />
                                ໝົດອາຍຸແລ້ວ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                <Clock className="w-3 h-3" />
                                ເຫຼືອອີກ {doc.daysRemaining} ມື້
                              </span>
                            )}
                          </td>
                          <td className="py-3 pl-4 text-right">
                            <Link
                              href="/documents/expired"
                              className="text-[11px] font-semibold text-violet-600 hover:text-violet-800 underline"
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

          {/* TAB 4: PHYSICAL STORAGE ARCHIVE */}
          {activeTab === 'archive' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">ອັດຕາການຈັດເກັບເຂົ້າຄັງ</span>
                    <div className="mt-1 text-2xl font-bold text-slate-900">{archiveBreakdown.assignedRate}%</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {archiveBreakdown.assignedCount} ສະບັບ ໄດ້ລະບຸຕູ້/ຊັ້ນ/ແຟ້ມແລ້ວ
                    </p>
                  </div>
                  <span className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Archive className="w-7 h-7" />
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-amber-600 uppercase">ເອກະສານທີ່ຍັງບໍ່ໄດ້ເຂົ້າຕູ້</span>
                    <div className="mt-1 text-2xl font-bold text-amber-700">{archiveBreakdown.unassignedCount}</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ເອກະສານທີ່ຍັງລອຍຢູ່ ບໍ່ທັນໄດ້ລະບຸຕູ້ເກັບມ້ຽນ
                    </p>
                  </div>
                  <span className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <FolderArchive className="w-7 h-7" />
                  </span>
                </div>
              </div>

              {/* WAREHOUSE UTILIZATION TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    ສະຖິຕິເອກະສານແຍກຕາມຄັງຈັດເກັບ (Warehouses)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ປະລິມານເອກະສານ ແລະ ຈຳນວນຕູ້ໃນແຕ່ລະຄັງ
                  </p>
                </div>

                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="py-3 pr-4">ຊື່ຄັງເອກະສານ</th>
                        <th className="py-3 px-4 text-center">ຈຳນວນຕູ້ເອກະສານ</th>
                        <th className="py-3 px-4 text-center">ຈຳນວນເອກະສານພາຍໃນ</th>
                        <th className="py-3 pl-4 text-right">ຈັດການ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {archiveBreakdown.whStats.map((wh) => (
                        <tr key={wh.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 pr-4 font-semibold text-slate-800 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: wh.color }} />
                            <span>{wh.name}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-medium">{wh.cabinetsCount} ຕູ້</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">{wh.total} ສະບັບ</td>
                          <td className="py-3 pl-4 text-right">
                            <Link
                              href={`/documents/archive?warehouseId=${wh.id}`}
                              className="text-[11px] font-semibold text-violet-600 hover:text-violet-800"
                            >
                              ເບິ່ງຄັງ
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

          {/* TAB 5: DOCUMENT DETAILS LIST */}
          {activeTab === 'details' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ລາຍການເອກະສານລະອຽດຕາມຕົວກອງ
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ສະແດງທັງໝົດ {filteredDocs.length} ລາຍການ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleExportExcel()}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ດາວໂຫຼດ Excel</span>
                </button>
              </div>

              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 pr-4">#</th>
                      <th className="py-2.5 px-4">ເລກທີ / ຊື່ເອກະສານ</th>
                      <th className="py-2.5 px-4">ໝວດໝູ່</th>
                      <th className="py-2.5 px-4">ທິດທາງ</th>
                      <th className="py-2.5 px-4">ຝ່າຍ / ພະແນກ</th>
                      <th className="py-2.5 px-4">ສະຖານະ</th>
                      <th className="py-2.5 px-4">ວັນທີອັບໂຫຼດ</th>
                      <th className="py-2.5 pl-4 text-right">ເປີດເບິ່ງ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredDocs.map((doc, i) => (
                      <tr key={doc.id || i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pr-4 text-slate-400 font-mono text-[11px]">{i + 1}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <p className="font-semibold text-slate-900 truncate max-w-xs">{doc.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{doc.docNumber || '-'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]">
                            {doc.category || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          {directionLabels[getDocDirection(doc.direction)] || 'ພາຍໃນ'}
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          <p className="text-slate-800 font-medium">{doc.division || 'ສູນກາງ'}</p>
                          <p className="text-slate-400 text-[10px]">{doc.department || '-'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              statusBadgeClasses[doc.status] || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {statusLabels[doc.status] || doc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {doc.uploadDate || '-'}
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <Link
                            href="/documents"
                            className="text-slate-400 hover:text-violet-600 transition p-1"
                            title="ເບິ່ງເອກະສານ"
                          >
                            <Eye className="w-4 h-4 inline" />
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
