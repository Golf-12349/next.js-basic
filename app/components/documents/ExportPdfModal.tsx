'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Printer,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { pushToast } from '@/app/components/ui/Toast';
import type { Document } from '@/types/document';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { useMasterData } from '@/app/(main)/context/MasterDataContext';
import { useArchive } from '@/app/(main)/context/ArchiveContext';
import { exportDocumentsToExcel } from '@/lib/dms/excelExport';

interface ExportPdfModalProps {
  open: boolean;
  onClose: () => void;
  initialDocuments?: Document[];
  defaultTitle?: string;
}

export default function ExportPdfModal({
  open,
  onClose,
  initialDocuments,
  defaultTitle = 'ບົດລາຍງານສະຫຼຸບເອກະສານທາງການ',
}: ExportPdfModalProps) {
  const { documents: allContextDocs, categories } = useDocuments();
  const { divisions, getDepartments } = useMasterData();
  const { cabinets } = useArchive();

  const printTemplateRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'filter' | 'format' | 'preview'>('filter');
  const [exporting, setExporting] = useState(false);

  // 1. Filter criteria state
  const [presetRange, setPresetRange] = useState<'all' | 'this_year' | 'this_month' | 'custom'>('this_year');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDirection, setSelectedDirection] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [storageFilter, setStorageFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  // 2. Format & layout state
  const [reportTitle, setReportTitle] = useState(defaultTitle);
  const [reportSubTitle, setReportSubTitle] = useState('ລະບົບຄຸ້ມຄອງເອກະສານ EDL-DMS (Document Management System)');
  const [organizationName, setOrganizationName] = useState('ລັດວິສາຫະກິດໄຟຟ້າລາວ • ELECTRICITE DU LAOS');
  const [preparedBy, setPreparedBy] = useState('ເຈົ້າໜ້າທີ່ຄຸ້ມຄອງເອກະສານ');
  const [approvedBy, setApprovedBy] = useState('ຫົວໜ້າພະແນກ / ຫ້ອງການ');
  const [reportNotes, setReportNotes] = useState('ເອກະສານສະບັບນີ້ຖືກສ້າງຂຶ້ນໂດຍລະບົບ DMS ຕາມຂໍ້ມູນຕົວຈິງໃນຖານຂໍ້ມູນ.');

  // Column toggles
  const [showSummaryCards, setShowSummaryCards] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [columns, setColumns] = useState({
    seq: true,
    docNumber: true,
    title: true,
    department: true,
    category: true,
    uploadDate: true,
    status: true,
    storage: true,
  });

  // Base documents
  const baseDocs = useMemo(() => {
    const list = initialDocuments && initialDocuments.length > 0 ? initialDocuments : allContextDocs;
    return list.filter((d) => !d.deleted);
  }, [initialDocuments, allContextDocs]);

  // Departments for selected division
  const availableDepartments = useMemo(() => {
    if (selectedDivision === 'all') return [];
    return getDepartments(selectedDivision);
  }, [selectedDivision, getDepartments]);

  const currentYear = '2026';
  const currentMonthNum = '10';

  // Filtered documents calculation
  const filteredDocs = useMemo(() => {
    return baseDocs.filter((doc) => {
      const upDate = doc.uploadDate || '';

      if (presetRange === 'this_year') {
        if (!upDate.startsWith(currentYear)) return false;
      } else if (presetRange === 'this_month') {
        if (!upDate.startsWith(`${currentYear}-${currentMonthNum}`)) return false;
      } else if (presetRange === 'custom') {
        if (startDate && upDate < startDate) return false;
        if (endDate && upDate > endDate) return false;
      }

      if (selectedDivision !== 'all' && doc.division !== selectedDivision) return false;
      if (selectedDepartment !== 'all' && doc.department !== selectedDepartment) return false;
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && doc.status !== selectedStatus) return false;

      if (selectedDirection !== 'all') {
        if (selectedDirection === 'inbound' && doc.direction !== 'inbound') return false;
        if (selectedDirection === 'outbound' && doc.direction !== 'outbound') return false;
      }

      if (storageFilter === 'assigned') {
        if (!doc.cabinetId && !doc.folderId) return false;
      } else if (storageFilter === 'unassigned') {
        if (doc.cabinetId || doc.folderId) return false;
      }

      return true;
    });
  }, [
    baseDocs,
    presetRange,
    startDate,
    endDate,
    selectedDivision,
    selectedDepartment,
    selectedCategory,
    selectedStatus,
    selectedDirection,
    storageFilter,
  ]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = filteredDocs.length;
    const approved = filteredDocs.filter((d) => d.status === 'approved').length;
    const pending = filteredDocs.filter((d) => d.status === 'pending').length;
    const inbound = filteredDocs.filter((d) => d.direction === 'inbound').length;
    const outbound = filteredDocs.filter((d) => d.direction === 'outbound').length;
    const assigned = filteredDocs.filter((d) => d.cabinetId || d.folderId).length;
    const unassigned = total - assigned;

    return { total, approved, pending, inbound, outbound, assigned, unassigned };
  }, [filteredDocs]);

  const getStorageLocationText = (doc: Document) => {
    if (doc.folderName) return `ແຟ້ມ: ${doc.folderName}`;
    if (doc.cabinetName) return `ຕູ້: ${doc.cabinetName}`;
    if (doc.cabinetId) {
      const cab = cabinets.find((c) => c.id === doc.cabinetId);
      if (cab) return `ຕູ້: ${cab.name}`;
    }
    return 'ຍັງບໍ່ມີບ່ອນເກັບ';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'ອະນຸມັດແລ້ວ';
      case 'pending':
        return 'ລໍຖ້າອະນຸມັດ';
      case 'draft':
        return 'ສະບັບຮ່າງ';
      case 'expired':
        return 'ໝົດອາຍຸ';
      case 'archived':
        return 'ຈັດເກັບແລ້ວ';
      default:
        return status || 'ທົ່ວໄປ';
    }
  };

  const reportGenerateDate = useMemo(() => {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  // Direct PDF Export (Without Ctrl + P)
  async function handleExportDirectPdf() {
    if (!printTemplateRef.current) {
      pushToast({ title: 'ບໍ່ພົບເນື້ອຫາບົດລາຍງານ', description: 'ກະລຸນາລອງໃໝ່' });
      return;
    }

    setExporting(true);
    pushToast({
      title: 'ກຳລັງສ້າງໄຟລ໌ PDF...',
      description: 'ກຳລັງດຶງຂໍ້ມູນ ແລະ ຈັດຮູບແບບຕາມ template',
    });

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = printTemplateRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, '', 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, '', 'FAST');
        heightLeft -= pageHeight;
      }

      const cleanTitle = (reportTitle || 'Report').replace(/\s+/g, '_');
      const filename = `DMS-Report-${cleanTitle}-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);

      pushToast({
        title: 'ດາວໂຫຼດ PDF ສຳເລັດແລ້ວ 🎉',
        description: `ບັນທຶກໄຟລ໌ ${filename} ຮຽບຮ້ອຍແລ້ວ`,
      });
    } catch (err: unknown) {
      console.error('PDF export error:', err);
      const msg = err instanceof Error ? err.message : 'ເກີດຂໍ້ຜິດພາດ';
      pushToast({
        title: 'ບໍ່ສາມາດສ້າງ PDF ໄດ້',
        description: msg,
      });
    } finally {
      setExporting(false);
    }
  }

  function handleExportExcel() {
    if (filteredDocs.length === 0) {
      pushToast({ title: 'ບໍ່ມີຂໍ້ມູນໃຫ້ສົ່ງອອກ', description: 'ກະລຸນາເລືອກຕົວກັ່ນຕອງໃໝ່' });
      return;
    }

    try {
      exportDocumentsToExcel(filteredDocs, {
        title: reportTitle,
        subTitle: organizationName,
        preparedBy,
        filterScope:
          presetRange === 'all'
            ? 'ທຸກຊ່ວງເວລາ (All Time)'
            : presetRange === 'this_year'
            ? 'ປີ 2026'
            : presetRange === 'this_month'
            ? 'ເດືອນຕຸລາ 2026'
            : `${startDate || 'ເລີ່ມຕົ້ນ'} ຫາ ${endDate || 'ປັດຈຸບັນ'}`,
        cabinets,
      });

      pushToast({
        title: 'ສົ່ງອອກ Excel ມືອາຊີບສຳເລັດແລ້ວ 🎉',
        description: 'ລວມ 2 ແຜ່ນງານ (ລາຍການເອກະສານລະອຽດ + ສະຫຼຸບສະຖິຕິ KPI)',
      });
    } catch (err) {
      console.error('Excel export error:', err);
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກ Excel' });
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative flex w-full max-w-6xl flex-col bg-white shadow-2xl rounded-2xl overflow-hidden max-h-[94vh] border border-slate-200 z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                📑 ສົ່ງອອກບົດລາຍງານ PDF (Custom PDF Export)
              </h3>
              <p className="text-[11px] text-slate-500">
                ກັ່ນຕອງຂໍ້ມູນ, ປັບແຕ່ງຮູບແບບ, ເບິ່ງຕົວຢ່າງ ແລະ ດາວໂຫຼດໄຟລ໌ PDF ໂດຍກົງ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50/70 px-4 pt-3 pb-0 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('filter')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-t border-x ${
                activeTab === 'filter'
                  ? 'bg-white border-slate-200 text-indigo-700 shadow-sm -mb-px'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>1. ຕົວກັ່ນຕອງຂໍ້ມູນ (Filter)</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.2 text-[10px] font-bold text-indigo-800">
                {filteredDocs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('format')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-t border-x ${
                activeTab === 'format'
                  ? 'bg-white border-slate-200 text-indigo-700 shadow-sm -mb-px'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>2. ຈັດຮູບແບບ PDF (Format Template)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-t border-x ${
                activeTab === 'preview'
                  ? 'bg-white border-slate-200 text-indigo-700 shadow-sm -mb-px'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>3. ເບິ່ງຕົວຢ່າງ & ດາວໂຫຼດ (Preview & Export)</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30">
            {/* TAB 1: FILTER */}
            {activeTab === 'filter' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm font-bold text-sm">
                      {filteredDocs.length}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        ພົບເຫັນ {filteredDocs.length} ເອກະສານກົງກັບເງື່ອນໄຂ
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        ຈາກທັງໝົດ {baseDocs.length} ເອກະສານໃນລະບົບ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-emerald-800 font-medium">
                      ອະນຸມັດ: {stats.approved}
                    </span>
                    <span className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-amber-800 font-medium">
                      ລໍຖ້າ: {stats.pending}
                    </span>
                    <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-blue-800 font-medium">
                      ຂາເຂົ້າ: {stats.inbound}
                    </span>
                    <span className="rounded-lg bg-purple-50 border border-purple-200 px-2.5 py-1 text-purple-800 font-medium">
                      ຂາອອກ: {stats.outbound}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-indigo-600" />
                      <span>ກຳນົດເງື່ອນໄຂການກັ່ນຕອງຂໍ້ມູນ (Filter Criteria)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setPresetRange('all');
                        setStartDate('');
                        setEndDate('');
                        setSelectedDivision('all');
                        setSelectedDepartment('all');
                        setSelectedCategory('all');
                        setSelectedStatus('all');
                        setSelectedDirection('all');
                        setStorageFilter('all');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                    >
                      <RefreshCw className="w-3 h-3" />
                      ລ້າງຕົວກັ່ນຕອງທັງໝົດ
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ຊ່ວງເວລາ (Date Range)
                      </label>
                      <select
                        value={presetRange}
                        onChange={(e) => setPresetRange(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                      >
                        <option value="all">ທັງໝົດ (All Time)</option>
                        <option value="this_year">ປີນີ້ (ປີ 2026)</option>
                        <option value="this_month">ເດືອນນີ້ (ຕຸລາ 2026)</option>
                        <option value="custom">ກຳນົດວັນທີເອງ (Custom Range)</option>
                      </select>
                    </div>

                    {presetRange === 'custom' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            ຕັ້ງແຕ່ວັນທີ
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            ເຖິງວັນທີ
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ຝ່າຍ / ສາຍງານ
                      </label>
                      <select
                        value={selectedDivision}
                        onChange={(e) => {
                          setSelectedDivision(e.target.value);
                          setSelectedDepartment('all');
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                      >
                        <option value="all">ທຸກຝ່າຍ (All Divisions)</option>
                        {divisions.map((div) => (
                          <option key={div} value={div}>
                            {div}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ພະແນກ
                      </label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        disabled={selectedDivision === 'all'}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition disabled:opacity-50"
                      >
                        <option value="all">ທຸກພະແນກ (All Departments)</option>
                        {availableDepartments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ໝວດໝູ່ເອກະສານ
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                      >
                        <option value="all">ທຸກໝວດໝູ່ (All Categories)</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ສະຖານະເອກະສານ
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                      >
                        <option value="all">ທຸກສະຖານະ (All Status)</option>
                        <option value="approved">ອະນຸມັດແລ້ວ (Approved)</option>
                        <option value="pending">ລໍຖ້າອະນຸມັດ (Pending)</option>
                        <option value="draft">ສະບັບຮ່າງ (Draft)</option>
                        <option value="expired">ໝົດອາຍຸ (Expired)</option>
                        <option value="archived">ຈັດເກັບແລ້ວ (Archived)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ທິດທາງເອກະສານ
                      </label>
                      <select
                        value={selectedDirection}
                        onChange={(e) => setSelectedDirection(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                      >
                        <option value="all">ທັງໝົດ (All Flows)</option>
                        <option value="inbound">📥 ເອກະສານຂາເຂົ້າ (Inbound)</option>
                        <option value="outbound">📤 ເອກະສານຂາອອກ (Outbound)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ສະຖານະບ່ອນຈັດເກັບ
                      </label>
                      <select
                        value={storageFilter}
                        onChange={(e) => setStorageFilter(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                      >
                        <option value="all">ທັງໝົດ (All)</option>
                        <option value="assigned">✅ ມີບ່ອນເກັບແລ້ວ (Assigned)</option>
                        <option value="unassigned">⚠️ ຍັງບໍ່ມີບ່ອນເກັບ (Unassigned)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    ຂັ້ນຕອນທີ 1 / 3: ພ້ອມສົ່ງອອກ {filteredDocs.length} ລາຍການ
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('format')}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                  >
                    <span>ຕໍ່ໄປ: ຈັດຮູບແບບ PDF</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: FORMAT */}
            {activeTab === 'format' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                    <span>ປັບແຕ່ງຫົວຂໍ້ ແລະ ຂໍ້ມູນເອກະສານ (Header & Info)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ຊື່ຫົວຂໍ້ບົດລາຍງານ (Report Title)
                      </label>
                      <input
                        type="text"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ຊື່ອົງກອນ (Organization)
                      </label>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ຜູ້ສັງລວມບົດລາຍງານ (Prepared By)
                      </label>
                      <input
                        type="text"
                        value={preparedBy}
                        onChange={(e) => setPreparedBy(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ຜູ້ກວດກາ / ອະນຸມັດ (Approved By)
                      </label>
                      <input
                        type="text"
                        value={approvedBy}
                        onChange={(e) => setApprovedBy(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ໝາຍເຫດທ້າຍເອກະສານ (Footer Notes)
                      </label>
                      <textarea
                        rows={2}
                        value={reportNotes}
                        onChange={(e) => setReportNotes(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>ອົງປະກອບທີ່ຕ້ອງການສະແດງໃນ PDF (Sections & Columns)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSummaryCards}
                        onChange={(e) => setShowSummaryCards(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold">ສະແດງກ່ອງສະຫຼຸບສະຖິຕິ KPI</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSignatures}
                        onChange={(e) => setShowSignatures(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold">ສະແດງຊ່ອງລົງລາຍເຊັນທາງການ</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      ເລືອກຖັນໃນຕາຕະລາງເອກະສານ:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-slate-600">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columns.seq}
                          onChange={(e) => setColumns({ ...columns, seq: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        <span>ລ/ດ</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columns.docNumber}
                          onChange={(e) => setColumns({ ...columns, docNumber: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        <span>ເລກທີເອກະສານ</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columns.title}
                          onChange={(e) => setColumns({ ...columns, title: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        <span>ຊື່ເອກະສານ</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columns.department}
                          onChange={(e) => setColumns({ ...columns, department: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        <span>ຝ່າຍ & ພະແນກ</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columns.category}
                          onChange={(e) => setColumns({ ...columns, category: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        <span>ໝວດໝູ່</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columns.uploadDate}
                          onChange={(e) => setColumns({ ...columns, uploadDate: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        <span>ວັນທີອັບໂຫຼດ</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columns.status}
                          onChange={(e) => setColumns({ ...columns, status: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        <span>ສະຖານະ</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columns.storage}
                          onChange={(e) => setColumns({ ...columns, storage: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        <span>ບ່ອນຈັດເກັບ</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('filter')}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    ← ກັບຄືນຕົວກັ່ນຕອງ
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                  >
                    <span>ເບິ່ງຕົວຢ່າງ PDF & ດາວໂຫຼດ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: PREVIEW & DIRECT DOWNLOAD */}
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      ກຽມພ້ອມດາວໂຫຼດໄຟລ໌ PDF ({filteredDocs.length} ລາຍການ)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      ລະບົບຈະສ້າງໄຟລ໌ PDF ຂະໜາດ A4 ຕາມແບບຟອມດ້ານລຸ່ມ ແລະ ດາວໂຫຼດລົງເຄື່ອງທັນທີ
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      disabled={filteredDocs.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 shadow-sm transition disabled:opacity-50"
                      title="ດາວໂຫຼດ Excel ມືອາຊີບ (2 ແຜ່ນງານພ້ອມສະຫຼຸບ KPI)"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>📊 ດາວໂຫຼດ Excel (Pro Multi-Sheet)</span>
                    </button>

                    <button
                      type="button"
                      disabled={exporting || filteredDocs.length === 0}
                      onClick={() => void handleExportDirectPdf()}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                      {exporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>ກຳລັງສ້າງ PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>📥 ດາວໂຫຼດໄຟລ໌ PDF (Direct Download)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* LIVE PDF PREVIEW */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-slate-200/60 p-4 sm:p-8 flex justify-center shadow-inner">
                  <div
                    ref={printTemplateRef}
                    id="pdf-export-template"
                    className="w-[210mm] min-h-[297mm] bg-white p-8 sm:p-12 text-slate-900 shadow-xl border border-slate-300 font-sans text-xs flex flex-col justify-between"
                    style={{ boxSizing: 'border-box' }}
                  >
                    <div>
                      {/* Official Country Header */}
                      <div className="text-center pb-4 border-b border-slate-300">
                        <p className="text-[11px] font-bold tracking-wide uppercase text-slate-800">
                          ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
                        </p>
                        <div className="my-2 flex justify-center">
                          <div className="w-24 border-t border-slate-400"></div>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                          {organizationName}
                        </p>
                        <h1 className="text-lg font-bold text-slate-900 mt-2">
                          {reportTitle}
                        </h1>
                        <p className="text-[11px] text-slate-500 mt-0.5">{reportSubTitle}</p>
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-200 text-[10px] text-slate-600 bg-slate-50/60 px-3 my-3 rounded-lg">
                        <div>
                          <span className="font-bold text-slate-700 block">ວັນທີອອກບົດລາຍງານ:</span>
                          <span>{reportGenerateDate}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700 block">ຂອບເຂດເວລາ:</span>
                          <span>
                            {presetRange === 'all'
                              ? 'ທຸກຊ່ວງເວລາ'
                              : presetRange === 'this_year'
                              ? 'ປີ 2026'
                              : presetRange === 'this_month'
                              ? 'ເດືອນຕຸລາ 2026'
                              : `${startDate || '...'} ຫາ ${endDate || '...'}`}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-700 block">ຈຳນວນເອກະສານ:</span>
                          <span className="font-bold text-indigo-700">{filteredDocs.length} ສະບັບ</span>
                        </div>
                      </div>

                      {/* Summary Cards */}
                      {showSummaryCards && (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-center">
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">ເອກະສານທັງໝົດ</span>
                            <span className="text-sm font-bold text-slate-900">{stats.total}</span>
                          </div>
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-center">
                            <span className="text-[9px] uppercase font-bold text-emerald-700 block">ອະນຸມັດແລ້ວ</span>
                            <span className="text-sm font-bold text-emerald-800">{stats.approved}</span>
                          </div>
                          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-center">
                            <span className="text-[9px] uppercase font-bold text-amber-700 block">ລໍຖ້າອະນຸມັດ</span>
                            <span className="text-sm font-bold text-amber-800">{stats.pending}</span>
                          </div>
                          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-2.5 text-center">
                            <span className="text-[9px] uppercase font-bold text-blue-700 block">ຈັດເກັບໃນຄັງແລ້ວ</span>
                            <span className="text-sm font-bold text-blue-800">{stats.assigned}</span>
                          </div>
                        </div>
                      )}

                      {/* Table */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                        <table className="w-full text-left text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              {columns.seq && <th className="p-2 w-8 text-center">ລ/ດ</th>}
                              {columns.docNumber && <th className="p-2 min-w-[80px]">ເລກທີ</th>}
                              {columns.title && <th className="p-2 min-w-[140px]">ຊື່ເອກະສານ</th>}
                              {columns.department && <th className="p-2 min-w-[100px]">ຝ່າຍ & ພະແນກ</th>}
                              {columns.category && <th className="p-2 min-w-[80px]">ໝວດໝູ່</th>}
                              {columns.uploadDate && <th className="p-2 min-w-[70px]">ວັນທີ</th>}
                              {columns.status && <th className="p-2 min-w-[65px]">ສະຖານະ</th>}
                              {columns.storage && <th className="p-2 min-w-[80px]">ບ່ອນເກັບ</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredDocs.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="p-6 text-center text-slate-400">
                                  ບໍ່ພົບຂໍ້ມູນເອກະສານຕາມເງື່ອນໄຂ
                                </td>
                              </tr>
                            ) : (
                              filteredDocs.map((doc, idx) => (
                                <tr key={doc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                                  {columns.seq && (
                                    <td className="p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                                  )}
                                  {columns.docNumber && (
                                    <td className="p-2 font-mono font-medium text-slate-700">
                                      {doc.docNumber || '-'}
                                    </td>
                                  )}
                                  {columns.title && (
                                    <td className="p-2 font-semibold text-slate-900 max-w-[160px] truncate">
                                      {doc.title}
                                    </td>
                                  )}
                                  {columns.department && (
                                    <td className="p-2 text-slate-600">
                                      <div className="truncate max-w-[110px]">{doc.department || doc.division || '-'}</div>
                                    </td>
                                  )}
                                  {columns.category && (
                                    <td className="p-2 text-slate-600">{doc.category || '-'}</td>
                                  )}
                                  {columns.uploadDate && (
                                    <td className="p-2 text-slate-500 whitespace-nowrap">{doc.uploadDate || '-'}</td>
                                  )}
                                  {columns.status && (
                                    <td className="p-2">
                                      <span
                                        className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                          doc.status === 'approved'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : doc.status === 'pending'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        {getStatusText(doc.status)}
                                      </span>
                                    </td>
                                  )}
                                  {columns.storage && (
                                    <td className="p-2 text-[9px] text-slate-500 max-w-[100px] truncate">
                                      {getStorageLocationText(doc)}
                                    </td>
                                  )}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div>
                      {reportNotes && (
                        <p className="text-[9px] text-slate-400 italic mb-6">
                          * ໝາຍເຫດ: {reportNotes}
                        </p>
                      )}

                      {showSignatures && (
                        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-center text-[10px]">
                          <div>
                            <p className="font-bold text-slate-800 uppercase">ຜູ້ສັງລວມບົດລາຍງານ</p>
                            <p className="text-slate-400 text-[9px] mt-0.5">(ລົງລາຍເຊັນ ແລະ ວັນທີ)</p>
                            <div className="h-16 flex items-end justify-center">
                              <span className="font-semibold text-slate-700">{preparedBy}</span>
                            </div>
                          </div>

                          <div>
                            <p className="font-bold text-slate-800 uppercase">ຜູ້ກວດກາ / ຮັບຮອງ</p>
                            <p className="text-slate-400 text-[9px] mt-0.5">(ລົງລາຍເຊັນ ແລະ ປະທັບຕາ)</p>
                            <div className="h-16 flex items-end justify-center">
                              <span className="font-semibold text-slate-700">{approvedBy}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-white p-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              ປິດໜ້າຕ່າງ
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={filteredDocs.length === 0}
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition shadow-xs"
                title="ດາວໂຫຼດ Excel ມືອາຊີບ (2 ແຜ່ນງານ)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>ດາວໂຫຼດ Excel</span>
              </button>

              {activeTab !== 'preview' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ເບິ່ງຕົວຢ່າງ PDF</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={exporting || filteredDocs.length === 0}
                  onClick={() => void handleExportDirectPdf()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {exporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ກຳລັງສ້າງ PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>ດາວໂຫຼດ PDF (Direct Download)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

