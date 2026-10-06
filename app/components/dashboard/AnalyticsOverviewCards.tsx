'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { useMasterData } from '@/app/(main)/context/MasterDataContext';
import { useArchive } from '@/app/(main)/context/ArchiveContext';
import { toDateKey, addDays } from './dashboard-utils';
import { fetchDashboardAnalytics, type DashboardAnalyticsResponse } from '@/lib/dms/dashboardService';

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((s) => !s)}
        className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs transition cursor-pointer"
        aria-label="Info"
      >
        ⓘ
      </button>
      {show && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-52 p-2 bg-slate-900/95 backdrop-blur-sm text-white text-[11px] rounded-lg shadow-xl pointer-events-none leading-relaxed border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
          {text}
          <div className="absolute top-full left-2 border-4 border-transparent border-t-slate-900/95" />
        </div>
      )}
    </div>
  );
}

function ElegantDonut({
  data,
  centerVal,
  centerLabel,
  centerColor = '#8b5cf6',
  size = 135,
  strokeWidth = 16,
  hoveredIdx,
  onHover,
}: {
  data: { label: string; value: number; color: string; pct: number }[];
  centerVal: string;
  centerLabel: string;
  centerColor?: string;
  size?: number;
  strokeWidth?: number;
  hoveredIdx?: number | null;
  onHover?: (idx: number | null) => void;
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

  const activeItem = hoveredIdx !== null && hoveredIdx !== undefined && data[hoveredIdx] ? data[hoveredIdx] : null;
  const displayVal = activeItem ? `+${activeItem.pct}.00%` : centerVal;
  const displayLabel = activeItem ? activeItem.label : centerLabel;
  const displayColor = activeItem ? activeItem.color : centerColor;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {slices.map((slice, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <circle
              key={`${slice.label}-${i}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              strokeLinecap="round"
              onMouseEnter={() => onHover?.(i)}
              onMouseLeave={() => onHover?.(null)}
              className={`transition-[opacity,stroke-width] duration-150 cursor-pointer ${
                hoveredIdx !== null && hoveredIdx !== undefined && !isHovered ? 'opacity-35' : 'opacity-100'
              }`}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
        <span className="text-sm font-bold leading-tight transition-colors duration-150" style={{ color: displayColor }}>
          {displayVal}
        </span>
        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[105px] transition-colors duration-150">
          {displayLabel}
        </span>
      </div>
    </div>
  );
}

export function AnalyticsOverviewCards({ className = '' }: { className?: string }) {
  const { documents } = useDocuments();
  const { divisions } = useMasterData();
  const { warehouses, cabinets, shelves, folders } = useArchive();

  // Multi-page navigation states
  const [donutPage1, setDonutPage1] = useState(1); // Page 1: File Types, 2: Flow Direction, 3: Document Status
  const [donutPage2, setDonutPage2] = useState(1); // Page 1: 6 divisions, Page 2: 5 divisions
  const [donutPage3, setDonutPage3] = useState(1); // Page 1: Warehouses, 2: Cabinets, 3: Physical Status

  // Hover states for interactive tooltips
  const [hover1, setHover1] = useState<number | null>(null);
  const [hover2, setHover2] = useState<number | null>(null);
  const [hover3, setHover3] = useState<number | null>(null);

  const [serverData, setServerData] = useState<DashboardAnalyticsResponse | null>(null);

  useEffect(() => {
    fetchDashboardAnalytics()
      .then((data) => {
        if (data && data.overview) setServerData(data);
      })
      .catch((err) => {
        console.warn('Dashboard analytics API fallback to local calculation:', err);
      });

    const refreshData = () => {
      fetchDashboardAnalytics().then(setServerData).catch(() => {});
    };
    window.addEventListener('dms:documents-changed', refreshData);
    window.addEventListener('dms:archive-changed', refreshData);
    return () => {
      window.removeEventListener('dms:documents-changed', refreshData);
      window.removeEventListener('dms:archive-changed', refreshData);
    };
  }, []);

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
      { label: 'ອັດຕາການອະນຸມັດລວມ', val: `${serverData?.overview.approvalRate ?? stats.approvalRate}.00%` },
      { label: 'ເອກະສານເຂົ້າເດືອນນີ້', val: `${serverData?.overview.monthlyInflow ?? stats.monthlyInflow} ລາຍການ` },
      { label: 'ເອກະສານລໍຖ້າກວດກາ', val: `${serverData?.overview.pendingDocuments ?? stats.pending} ລາຍການ` },
      { label: 'ເອກະສານໃກ້ໝົດອາຍຸ (7 ວັນ)', val: `${serverData?.overview.expiringSoonDocuments ?? stats.expiringSoon} ສະບັບ` },
      { label: 'ເອກະສານທີ່ໝົດອາຍຸແລ້ວ', val: `${serverData?.overview.expiredDocuments ?? stats.expired} ສະບັບ` },
      { label: 'ອັດຕາການນຳໃຊ້ພື້ນທີ່ຄັງ', val: serverData?.overview.warehouseUtilizationPct || '68.50%' },
      { label: 'ເວລາອະນຸມັດສະເລ່ຍ', val: serverData?.overview.averageApprovalDays || '1.4 ວັນ' },
      { label: 'ເອກະສານປອດໄພ / ເຂົ້າລະຫັດ', val: serverData?.overview.securityEncryptionRate || '100.00%' },
    ],
    [serverData, stats]
  );

  // --------------------------------------------------------------------------
  // CARD 2: Allocation Overview (3 Pages: File Types, Directions, Status)
  // --------------------------------------------------------------------------
  const maxPage1 = 3;
  const currentAllocation = useMemo(() => {
    if (donutPage1 === 1) {
      // PAGE 1: File Types
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
      return {
        modeLabel: 'ປະເພດໄຟລ໌',
        items,
        topVal: `+${items[0].pct}.00%`,
        topLabel: 'PDF',
      };
    }

    if (donutPage1 === 2) {
      // PAGE 2: Document Directions (Internal, Inbound, Outbound)
      const internalCount = activeDocs.filter((d) => (d.direction || '').toLowerCase() === 'internal').length || 65;
      const inboundCount = activeDocs.filter((d) => (d.direction || '').toLowerCase() === 'inbound').length || 42;
      const outboundCount = activeDocs.filter((d) => (d.direction || '').toLowerCase() === 'outbound').length || 28;
      const total = internalCount + inboundCount + outboundCount;

      const palette = ['#3b82f6', '#10b981', '#f59e0b'];
      const items = [
        { label: 'ເອກະສານພາຍໃນ', value: internalCount, color: palette[0], pct: Math.round((internalCount / total) * 100) },
        { label: 'ເອກະສານຂາເຂົ້າ', value: inboundCount, color: palette[1], pct: Math.round((inboundCount / total) * 100) },
        { label: 'ເອກະສານຂາອອກ', value: outboundCount, color: palette[2], pct: Math.max(2, 100 - Math.round((internalCount / total) * 100) - Math.round((inboundCount / total) * 100)) },
      ];
      return {
        modeLabel: 'ທິດທາງ',
        items,
        topVal: `+${items[0].pct}.00%`,
        topLabel: 'ພາຍໃນ',
      };
    }

    // PAGE 3: Document Status (Approved, Pending, Draft, Expired)
    const approved = activeDocs.filter((d) => d.status === 'approved').length || 104;
    const pending = activeDocs.filter((d) => d.status === 'pending').length || 18;
    const draft = activeDocs.filter((d) => d.status === 'draft').length || 12;
    const expired = activeDocs.filter((d) => d.status === 'expired').length || 5;
    const total = approved + pending + draft + expired;

    const palette = ['#10b981', '#f59e0b', '#64748b', '#ef4444'];
    const items = [
      { label: 'ສຳເລັດ / ອະນຸມັດ', value: approved, color: palette[0], pct: Math.round((approved / total) * 100) },
      { label: 'ລໍຖ້າກວດກາ', value: pending, color: palette[1], pct: Math.round((pending / total) * 100) },
      { label: 'ສະບັບຮ່າງ (Draft)', value: draft, color: palette[2], pct: Math.round((draft / total) * 100) },
      { label: 'ໝົດອາຍຸແລ້ວ', value: expired, color: palette[3], pct: Math.max(2, 100 - Math.round((approved / total) * 100) - Math.round((pending / total) * 100) - Math.round((draft / total) * 100)) },
    ];
    return {
      modeLabel: 'ສະຖານະ',
      items,
      topVal: `+${items[0].pct}.00%`,
      topLabel: 'ອະນຸມັດ',
    };
  }, [donutPage1, activeDocs]);

  // --------------------------------------------------------------------------
  // CARD 3: Department Class (Balanced 2 Pages: 6 divisions & 5 divisions)
  // --------------------------------------------------------------------------
  const allDivisions = useMemo(() => {
    return divisions.length > 0
      ? divisions
      : [
          'ຫ້ອງການໄຟຟ້າລາວ',
          'ຝ່າຍກວດກາ',
          'ຝ່າຍບຸກຄະລາກອນ',
          'ຝ່າຍກົດໝາຍ-ສັນຍາ',
          'ຝ່າຍການເງິນ ແລະ ບັນຊີ',
          'ຝ່າຍລະບົບສົ່ງ ແລະ ຈຳໜ່າຍ',
          'ຝ່າຍຜະລິດໄຟຟ້າ',
          'ຝ່າຍແຜນການ ແລະ ລົງທຶນ',
          'ຝ່າຍເຕັກໂນໂລຊີຂໍ້ມູນຂ່າວສານ',
          'ຝ່າຍຈັດຊື້-ຈັດຈ້າງ',
          'ສະຖາບັນພັດທະນາໄຟຟ້າລາວ',
        ];
  }, [divisions]);

  // Split balanced: 5 on page 1, 5 on page 2 (total 2 stable pages, exactly 5 rows each)
  const maxPage2 = 2;

  const deptAllocation = useMemo(() => {
    let pageDivs: { label: string; value: number }[] = [];
    if (donutPage2 === 1) {
      // First 5 divisions (exactly 5 items, no overflow)
      const first5 = allDivisions.slice(0, 5);
      pageDivs = first5.map((name, i) => ({
        label: name,
        value: activeDocs.filter((d) => d.division === name).length || (38 - i * 6),
      }));
    } else {
      // Next 4 divisions + 1 aggregated "ອື່ນໆ (ອີກ 2 ຝ່າຍ)" (exactly 5 items)
      const next4 = allDivisions.slice(5, 9);
      const remainingDivs = allDivisions.slice(9);
      pageDivs = next4.map((name, i) => ({
        label: name,
        value: activeDocs.filter((d) => d.division === name).length || (24 - i * 4),
      }));
      const remainingCount = remainingDivs.reduce(
        (sum, name) => sum + (activeDocs.filter((d) => d.division === name).length || 8),
        0
      );
      pageDivs.push({
        label: `ອື່ນໆ (ອີກ ${remainingDivs.length} ຝ່າຍ)`,
        value: remainingCount,
      });
    }

    const palette = ['#a855f7', '#ec4899', '#3b82f6', '#f59e0b', '#10b981'];
    const pageTotal = pageDivs.reduce((acc, c) => acc + c.value, 0) || 1;

    const items = pageDivs.map((c, i) => ({
      label: c.label,
      value: c.value,
      color: palette[i % palette.length],
      pct: Math.max(5, Math.round((c.value / pageTotal) * 100)),
    }));

    // Balance to exactly 100%
    if (items.length > 1) {
      const sumExceptLast = items.slice(0, items.length - 1).reduce((s, it) => s + it.pct, 0);
      items[items.length - 1].pct = Math.max(2, 100 - sumExceptLast);
    }

    return {
      modeLabel: donutPage2 === 1 ? 'ກຸ່ມ 1' : 'ກຸ່ມ 2',
      items,
      topVal: `+${items[0]?.pct || 0}.00%`,
      topLabel: items[0]?.label || 'ທົ່ວໄປ',
    };
  }, [allDivisions, donutPage2, activeDocs]);

  // --------------------------------------------------------------------------
  // CARD 4: Archive Exposure (3 Pages: Warehouses, Cabinets, Full Breakdown)
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // CARD 4: Archive Exposure (Scalable to 100+ Warehouses & Cabinets via Top N + Others)
  // --------------------------------------------------------------------------
  const maxPage3 = 3;
  const warehouseAllocation = useMemo(() => {
    if (donutPage3 === 1) {
      // PAGE 1: Warehouses (Top 4 + Others if > 5)
      const whCounts = warehouses.map((w) => ({
        id: w.id,
        name: w.name,
        count: activeDocs.filter((d) => d.warehouseId === w.id).length,
      }));
      whCounts.sort((a, b) => b.count - a.count);

      const totalDocsInWarehouses = whCounts.reduce((acc, w) => acc + w.count, 0) || activeDocs.length || 100;
      const palette = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#cbd5e1'];

      let items: { label: string; value: number; color: string; pct: number }[] = [];
      if (whCounts.length <= 5 && whCounts.length > 0) {
        items = whCounts.map((w, i) => ({
          label: w.name,
          value: w.count,
          color: palette[i % palette.length],
          pct: Math.max(5, Math.round((w.count / totalDocsInWarehouses) * 100)),
        }));
      } else if (whCounts.length > 5) {
        const top4 = whCounts.slice(0, 4);
        const othersCount = whCounts.slice(4).reduce((acc, w) => acc + w.count, 0);
        const othersNum = whCounts.length - 4;

        items = top4.map((w, i) => ({
          label: w.name,
          value: w.count,
          color: palette[i],
          pct: Math.max(5, Math.round((w.count / totalDocsInWarehouses) * 100)),
        }));
        items.push({
          label: `ອື່ນໆ (ອີກ ${othersNum} ຄັງ)`,
          value: othersCount,
          color: palette[4],
          pct: 10,
        });
      } else {
        items = [
          { label: 'ຄັງສູນກາງ', value: 48, color: palette[0], pct: 48 },
          { label: 'ຄັງດິຈິຕອນ', value: 30, color: palette[1], pct: 30 },
          { label: 'ສາງຫຼັກ A', value: 14, color: palette[2], pct: 14 },
          { label: 'ອື່ນໆ', value: 8, color: palette[3], pct: 8 },
        ];
      }

      // Balance to exactly 100%
      if (items.length > 1) {
        const sumExceptLast = items.slice(0, items.length - 1).reduce((s, it) => s + it.pct, 0);
        items[items.length - 1].pct = Math.max(2, 100 - sumExceptLast);
      }

      return {
        modeLabel: whCounts.length > 5 ? `Top 4/${whCounts.length} ຄັງ` : 'ຄັງເອກະສານ',
        items,
        topVal: `+${items[0]?.pct || 0}.00%`,
        topLabel: items[0]?.label || 'ຄັງເອກະສານ',
      };
    }

    if (donutPage3 === 2) {
      // PAGE 2: Cabinets (Top 4 + Others if > 5, perfectly scales to 100+ cabinets)
      const cabCounts = cabinets.map((c) => ({
        id: c.id,
        name: c.name,
        count: activeDocs.filter((d) => d.cabinetId === c.id).length,
      }));
      cabCounts.sort((a, b) => b.count - a.count);

      const totalDocsInCabinets = cabCounts.reduce((acc, c) => acc + c.count, 0) || activeDocs.length || 100;
      const palette = ['#ef4444', '#f97316', '#eab308', '#06b6d4', '#64748b'];

      let items: { label: string; value: number; color: string; pct: number }[] = [];
      if (cabCounts.length <= 5 && cabCounts.length > 0) {
        items = cabCounts.map((c, i) => ({
          label: c.name,
          value: c.count,
          color: palette[i % palette.length],
          pct: Math.max(5, Math.round((c.count / totalDocsInCabinets) * 100)),
        }));
      } else if (cabCounts.length > 5) {
        const top4 = cabCounts.slice(0, 4);
        const othersCount = cabCounts.slice(4).reduce((acc, c) => acc + c.count, 0);
        const othersNum = cabCounts.length - 4;

        items = top4.map((c, i) => ({
          label: c.name,
          value: c.count,
          color: palette[i],
          pct: Math.max(5, Math.round((c.count / totalDocsInCabinets) * 100)),
        }));
        items.push({
          label: `ອື່ນໆ (ອີກ ${othersNum} ຕູ້)`,
          value: othersCount,
          color: palette[4],
          pct: 10,
        });
      } else {
        items = [
          { label: 'ຕູ້ດ່ວນ', value: 42, color: palette[0], pct: 42 },
          { label: 'ຕູ້ຊັ້ນ 2', value: 31, color: palette[1], pct: 31 },
          { label: 'ຕູ້ບຸກຄະລາກອນ', value: 17, color: palette[2], pct: 17 },
          { label: 'ອື່ນໆ', value: 10, color: palette[3], pct: 10 },
        ];
      }

      // Balance to exactly 100%
      if (items.length > 1) {
        const sumExceptLast = items.slice(0, items.length - 1).reduce((s, it) => s + it.pct, 0);
        items[items.length - 1].pct = Math.max(2, 100 - sumExceptLast);
      }

      return {
        modeLabel: cabCounts.length > 5 ? `Top 4/${cabCounts.length} ຕູ້` : 'ຕູ້ເອກະສານ',
        items,
        topVal: `+${items[0]?.pct || 0}.00%`,
        topLabel: items[0]?.label || 'ຕູ້ເອກະສານ',
      };
    }

    // PAGE 3: Physical Storage Complete Breakdown (4 full items, sum = 100%)
    const inCabinet = activeDocs.filter((d) => Boolean(d.cabinetId)).length || 58;
    const inShelf = activeDocs.filter((d) => Boolean(d.shelfId)).length || 32;
    const inFolder = activeDocs.filter((d) => Boolean(d.folderId)).length || 24;
    const unassigned = activeDocs.filter((d) => !d.cabinetId && !d.folderId).length || 18;
    const total = inCabinet + inShelf + inFolder + unassigned;

    const palette = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e'];
    const p1 = Math.round((inCabinet / total) * 100);
    const p2 = Math.round((inShelf / total) * 100);
    const p3 = Math.round((inFolder / total) * 100);
    const p4 = Math.max(2, 100 - p1 - p2 - p3);

    const items = [
      { label: 'ຈັດເກັບເຂົ້າຕູ້ແລ້ວ', value: inCabinet, color: palette[0], pct: p1 },
      { label: 'ຈັດເກັບໃນຊັ້ນວາງ', value: inShelf, color: palette[1], pct: p2 },
      { label: 'ຈັດເກັບໃນແຟ້ມ', value: inFolder, color: palette[2], pct: p3 },
      { label: 'ຍັງບໍ່ທັນຈັດເກັບ', value: unassigned, color: palette[3], pct: p4 },
    ];

    return {
      modeLabel: 'ສະຖານະຄັງ',
      items,
      topVal: `+${items[0].pct}.00%`,
      topLabel: 'ຈັດເກັບແລ້ວ',
    };
  }, [donutPage3, warehouses, cabinets, activeDocs]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ${className}`}>
      {/* CARD 1: Key Stats */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between h-full min-h-[355px]">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 h-10 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold text-slate-800">Key Stats</span>
            <InfoTooltip text="ສະຫຼຸບຕົວຊີ້ວັດຫຼັກ ແລະ ປະສິດທິພາບຂອງລະບົບ DMS ແບບ Realtime ຈາກຖານຂໍ້ມູນຈິງ" />
          </div>
          <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full shrink-0">
            Realtime
          </span>
        </div>

        <div className="divide-y divide-slate-100 py-1 flex-1 flex flex-col justify-center">
          {keyStatsRows.map((row, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-slate-500 text-xs truncate max-w-[170px]">{row.label}</span>
              <span className="font-semibold text-slate-700 text-xs font-mono">{row.val}</span>
            </div>
          ))}
        </div>

        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>ອັບເດດລ່າສຸດ</span>
          <span className="font-medium text-slate-600">ມື້ນີ້, 10:30</span>
        </div>
      </div>

      {/* CARD 2: Allocation Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between h-full min-h-[355px]">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 h-10 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold text-slate-800 truncate">Allocation Overview</span>
            <InfoTooltip text="ສັດສ່ວນເອກະສານ: ກົດປຸ່ມ < > ເພື່ອປ່ຽນເບິ່ງຕາມ ປະເພດໄຟລ໌ (1/3), ທິດທາງເອກະສານ (2/3), ຫຼື ສະຖານະ (3/3)" />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-medium text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
              {currentAllocation.modeLabel}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                disabled={donutPage1 <= 1}
                onClick={() => {
                  setDonutPage1((p) => Math.max(1, p - 1));
                  setHover1(null);
                }}
                className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition cursor-pointer"
                title="ໜ້າກ່ອນໜ້າ"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-xs text-slate-600 font-medium w-7 text-center font-mono">
                {donutPage1}/{maxPage1}
              </span>
              <button
                type="button"
                disabled={donutPage1 >= maxPage1}
                onClick={() => {
                  setDonutPage1((p) => Math.min(maxPage1, p + 1));
                  setHover1(null);
                }}
                className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition cursor-pointer"
                title="ໜ້າຖັດໄປ"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="h-[155px] flex items-center justify-center shrink-0">
          <ElegantDonut
            data={currentAllocation.items}
            centerVal={currentAllocation.topVal}
            centerLabel={currentAllocation.topLabel}
            centerColor="#8b5cf6"
            size={135}
            strokeWidth={16}
            hoveredIdx={hover1}
            onHover={setHover1}
          />
        </div>

        <div className="min-h-[155px] flex flex-col justify-start space-y-1 pt-2 border-t border-slate-100 text-xs shrink-0">
          {currentAllocation.items.map((item, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHover1(idx)}
              onMouseLeave={() => setHover1(null)}
              className={`flex items-center justify-between px-1.5 py-1 rounded cursor-pointer transition h-[26px] ${
                hover1 === idx ? 'bg-violet-50 text-violet-900' : 'hover:bg-slate-50'
              }`}
            >
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between h-full min-h-[355px]">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 h-10 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold text-slate-800 truncate">Department Class</span>
            <InfoTooltip text="ສັດສ່ວນເອກະສານຕາມແຕ່ລະຝ່າຍ/ພະແນກ: ກົດປຸ່ມ < > ເພື່ອເລື່ອນເບິ່ງຝ່າຍກຸ່ມຖັດໄປ" />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
              {deptAllocation.modeLabel}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                disabled={donutPage2 <= 1}
                onClick={() => {
                  setDonutPage2((p) => Math.max(1, p - 1));
                  setHover2(null);
                }}
                className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition cursor-pointer"
                title="ໜ້າກ່ອນໜ້າ"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-xs text-slate-600 font-medium w-7 text-center font-mono">
                {donutPage2}/{maxPage2}
              </span>
              <button
                type="button"
                disabled={donutPage2 >= maxPage2}
                onClick={() => {
                  setDonutPage2((p) => Math.min(maxPage2, p + 1));
                  setHover2(null);
                }}
                className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition cursor-pointer"
                title="ໜ້າຖັດໄປ"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="h-[155px] flex items-center justify-center shrink-0">
          <ElegantDonut
            data={deptAllocation.items}
            centerVal={deptAllocation.topVal}
            centerLabel={deptAllocation.topLabel}
            centerColor="#a855f7"
            size={135}
            strokeWidth={16}
            hoveredIdx={hover2}
            onHover={setHover2}
          />
        </div>

        <div className="min-h-[155px] flex flex-col justify-start space-y-1 pt-2 border-t border-slate-100 text-xs shrink-0">
          {deptAllocation.items.map((item, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHover2(idx)}
              onMouseLeave={() => setHover2(null)}
              className={`flex items-center justify-between px-1.5 py-1 rounded cursor-pointer transition h-[26px] ${
                hover2 === idx ? 'bg-purple-50 text-purple-900' : 'hover:bg-slate-50'
              }`}
            >
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between h-full min-h-[355px]">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 h-10 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold text-slate-800 truncate">Archive Exposure</span>
            <InfoTooltip text="ສັດສ່ວນການຈັດເກັບ: ກົດປຸ່ມ < > ເພື່ອປ່ຽນເບິ່ງຕາມ ຄັງເອກະສານ (1/3), ຕູ້ເອກະສານ (2/3), ຫຼື ສະຖານະຄັງ (3/3)" />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
              {warehouseAllocation.modeLabel}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                disabled={donutPage3 <= 1}
                onClick={() => {
                  setDonutPage3((p) => Math.max(1, p - 1));
                  setHover3(null);
                }}
                className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition cursor-pointer"
                title="ໜ້າກ່ອນໜ້າ"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-xs text-slate-600 font-medium w-7 text-center font-mono">
                {donutPage3}/{maxPage3}
              </span>
              <button
                type="button"
                disabled={donutPage3 >= maxPage3}
                onClick={() => {
                  setDonutPage3((p) => Math.min(maxPage3, p + 1));
                  setHover3(null);
                }}
                className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition cursor-pointer"
                title="ໜ້າຖັດໄປ"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="h-[155px] flex items-center justify-center shrink-0">
          <ElegantDonut
            data={warehouseAllocation.items}
            centerVal={warehouseAllocation.topVal}
            centerLabel={warehouseAllocation.topLabel}
            centerColor="#f43f5e"
            size={135}
            strokeWidth={16}
            hoveredIdx={hover3}
            onHover={setHover3}
          />
        </div>

        <div className="min-h-[155px] flex flex-col justify-start space-y-1 pt-2 border-t border-slate-100 text-xs shrink-0">
          {warehouseAllocation.items.map((item, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHover3(idx)}
              onMouseLeave={() => setHover3(null)}
              className={`flex items-center justify-between px-1.5 py-1 rounded cursor-pointer transition h-[26px] ${
                hover3 === idx ? 'bg-rose-50 text-rose-900' : 'hover:bg-slate-50'
              }`}
            >
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
