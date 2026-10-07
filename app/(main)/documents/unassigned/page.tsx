'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Eye,
  FileCheck2,
  FileClock,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderArchive,
  Image as ImageIcon,
  Layers,
  Library,
  PackageOpen,
  Pencil,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { DashboardLayout } from '@/app/components/dashboard-layout';
import { useDocuments } from '../../context/DocumentsContext';
import { useArchive } from '../../context/ArchiveContext';
import { useMasterData } from '../../context/MasterDataContext';
import { useUploadModal } from '../../context/UploadModalContext';
import { pushToast } from '@/app/components/ui/Toast';
import Modal from '@/app/components/ui/Modal';
import DocumentPreview from '@/app/components/ui/DocumentPreview';
import SelectStorageLocationModal from '@/app/components/documents/SelectStorageLocationModal';
import EditDocumentModal from '@/app/components/documents/EditDocumentModal';
import type { Document } from '@/types/document';

function getFileIcon(type?: string) {
  const t = (type || '').toLowerCase();
  if (t.includes('pdf')) return <FileText className="w-4 h-4 text-rose-500" />;
  if (t.includes('doc') || t.includes('word')) return <FileText className="w-4 h-4 text-blue-500" />;
  if (t.includes('xls') || t.includes('sheet')) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
  if (t.includes('image') || t.includes('png') || t.includes('jpg')) return <ImageIcon className="w-4 h-4 text-purple-500" />;
  return <FileText className="w-4 h-4 text-slate-400" />;
}

function getStatusBadge(status?: string) {
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> ອະນຸມັດແລ້ວ
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          <FileClock className="w-3 h-3" /> ລໍຖ້າກວດກາ
        </span>
      );
    case 'draft':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
          ຮ່າງເອກະສານ
        </span>
      );
    case 'expired':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
          ໝົດອາຍຸ
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {status || 'ທົ່ວໄປ'}
        </span>
      );
  }
}

export default function UnassignedDocumentsPage() {
  const { documents, categories, reload, loading } = useDocuments();
  const { warehouses, cabinets, shelves, folders, assignDocument } = useArchive();
  const { divisions, getDepartments } = useMasterData();
  const { openUpload } = useUploadModal();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [statusTab, setStatusTab] = useState<'all' | 'approved' | 'pending' | 'draft'>('all');

  // Selection mode & selected IDs for batch operations
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [storageDoc, setStorageDoc] = useState<Document | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  // Batch assignment state
  const [batchWarehouseId, setBatchWarehouseId] = useState('');
  const [batchCabinetId, setBatchCabinetId] = useState('');
  const [batchShelfId, setBatchShelfId] = useState('');
  const [batchFolderId, setBatchFolderId] = useState('');
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Filter unassigned docs (active, not deleted, no cabinet and no folder)
  const unassignedDocs = useMemo(() => {
    return documents.filter((d) => !d.deleted && !d.cabinetId && !d.folderId);
  }, [documents]);

  // Dynamic department list based on selected division
  const availableDepartments = useMemo(() => {
    if (selectedDivision === 'all') return [];
    return getDepartments(selectedDivision);
  }, [selectedDivision, getDepartments]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return unassignedDocs.filter((doc) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (doc.title || '').toLowerCase().includes(q);
        const matchNumber = (doc.docNumber || '').toLowerCase().includes(q);
        const matchUploader = (doc.uploadedBy || '').toLowerCase().includes(q);
        if (!matchTitle && !matchNumber && !matchUploader) return false;
      }

      // Category
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
        return false;
      }

      // Division
      if (selectedDivision !== 'all' && doc.division !== selectedDivision) {
        return false;
      }

      // Department
      if (selectedDepartment !== 'all' && doc.department !== selectedDepartment) {
        return false;
      }

      // Status
      if (statusTab !== 'all' && doc.status !== statusTab) {
        return false;
      }

      return true;
    });
  }, [unassignedDocs, searchQuery, selectedCategory, selectedDivision, selectedDepartment, statusTab]);

  // Counts for KPI cards
  const stats = useMemo(() => {
    const total = unassignedDocs.length;
    const approved = unassignedDocs.filter((d) => d.status === 'approved').length;
    const pending = unassignedDocs.filter((d) => d.status === 'pending').length;
    const draft = unassignedDocs.filter((d) => d.status === 'draft').length;
    return { total, approved, pending, draft };
  }, [unassignedDocs]);

  // Selection handlers
  const allFilteredSelected = filteredDocs.length > 0 && filteredDocs.every((d) => selectedIds.has(d.id));

  function handleToggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      filteredDocs.forEach((d) => next.add(d.id));
      setSelectedIds(next);
    }
  }

  function handleToggleSelectOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  function handleCancelSelection() {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }

  // Batch assign submit
  async function handleConfirmBatchAssign() {
    if (selectedIds.size === 0) return;
    if (!batchCabinetId && !batchFolderId) {
      pushToast({
        title: 'ກະລຸນາເລືອກບ່ອນຈັດເກັບ',
        description: 'ຕ້ອງເລືອກຢ່າງໜ້ອຍ ຕູ້ເອກະສານ ຫຼື ແຟ້ມເອກະສານ',
      });
      return;
    }

    setBatchSubmitting(true);
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        await assignDocument(
          id,
          batchCabinetId,
          batchFolderId,
          batchWarehouseId || undefined,
          batchShelfId || undefined
        );
      }
      pushToast({
        title: 'ຈັດເກັບເປັນກຸ່ມສຳເລັດ',
        description: `ໄດ້ກຳນົດບ່ອນເກັບໃຫ້ ${ids.length} ເອກະສານຮຽບຮ້ອຍແລ້ວ`,
      });
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setBatchModalOpen(false);
      setBatchWarehouseId('');
      setBatchCabinetId('');
      setBatchShelfId('');
      setBatchFolderId('');
      await reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ເກີດຂໍ້ຜິດພາດໃນການຈັດເກັບ';
      pushToast({ title: 'ບໍ່ສາມາດຈັດເກັບໄດ້', description: msg });
    } finally {
      setBatchSubmitting(false);
    }
  }

  // Cascading options for batch modal
  const batchAvailableCabinets = useMemo(() => {
    if (!batchWarehouseId) return cabinets;
    return cabinets.filter((c) => c.warehouseId === batchWarehouseId);
  }, [cabinets, batchWarehouseId]);

  const batchAvailableShelves = useMemo(() => {
    if (!batchCabinetId) return shelves;
    return shelves.filter((s) => s.cabinetId === batchCabinetId);
  }, [shelves, batchCabinetId]);

  const batchAvailableFolders = useMemo(() => {
    if (!batchCabinetId) return folders;
    return folders.filter((f) => {
      if (f.cabinetId !== batchCabinetId) return false;
      if (batchShelfId && f.shelfId !== batchShelfId) return false;
      return true;
    });
  }, [folders, batchCabinetId, batchShelfId]);

  return (
    <DashboardLayout>
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* =========================================================================
            HEADER & BREADCRUMB
           ========================================================================= */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/documents" className="hover:text-indigo-600 transition">
              ເອກະສານ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800">ຍັງບໍ່ມີບ່ອນເກັບ</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200">
                  <PackageOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      ເອກະສານຍັງບໍ່ມີບ່ອນເກັບ
                    </h1>
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200 tabular-nums">
                      {unassignedDocs.length} ສະບັບ
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    ລາຍການເອກະສານທີ່ຍັງບໍ່ທັນໄດ້ກຳນົດສາງ, ຕູ້, ຊັ້ນວາງ ຫຼື ແຟ້ມເກັບມ້ຽນຕົວຈິງໃນຄັງ DMS
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => void reload()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
                title="ໂຫຼດຂໍ້ມູນໃໝ່"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>ຣີເຟຣຊ</span>
              </button>

              <button
                type="button"
                onClick={openUpload}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                <span>+ ອັບໂຫຼດເອກະສານ</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            KPI SUMMARY STATS
           ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 to-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-amber-800 font-medium">
              <span>ລໍຖ້າຈັດເກັບທັງໝົດ</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-950 tabular-nums">
              {stats.total}
            </div>
            <div className="mt-1 text-[11px] text-amber-700">
              ເອກະສານທີ່ຍັງບໍ່ມີຕູ້ ຫຼື ແຟ້ມ
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 to-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
              <span>ອະນຸມັດແລ້ວ (ພ້ອມເກັບ)</span>
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-950 tabular-nums">
              {stats.approved}
            </div>
            <div className="mt-1 text-[11px] text-emerald-700">
              ຜ່ານການກວດກາແລ້ວ ຄວນເກັບເຂົ້າຄັງ
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 to-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-blue-800 font-medium">
              <span>ລໍຖ້າກວດກາ (Pending)</span>
              <FileClock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-950 tabular-nums">
              {stats.pending}
            </div>
            <div className="mt-1 text-[11px] text-blue-700">
              ກຳລັງຢູ່ໃນຂະບວນການອະນຸມັດ
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>ສະບັບຮ່າງ (Draft)</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {stats.draft}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              ເອກະສານຮ່າງທີ່ກຳລັງກະກຽມ
            </div>
          </div>
        </div>

        {/* =========================================================================
            FILTERS & SEARCH TOOLBAR
           ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setStatusTab('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
                statusTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ທັງໝົດ ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('approved')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
                statusTab === 'approved'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              ອະນຸມັດແລ້ວ ({stats.approved})
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('pending')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
                statusTab === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              ລໍຖ້າກວດກາ ({stats.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('draft')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
                statusTab === 'draft'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ສະບັບຮ່າງ ({stats.draft})
            </button>
          </div>

          {/* Search and Filters grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Search */}
            <div className="relative">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                ຄົ້ນຫາເອກະສານ
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ຊື່ເອກະສານ, ເລກທີ, ຜູ້ອັບໂຫຼດ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                ໝວດໝູ່ (Category)
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
              >
                <option value="all">ທຸກໝວດໝູ່ ({categories.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Division */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                ຝ່າຍ (Division)
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => {
                  setSelectedDivision(e.target.value);
                  setSelectedDepartment('all');
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
              >
                <option value="all">ທຸກຝ່າຍ</option>
                {divisions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                ພະແນກ (Department)
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={selectedDivision === 'all'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition disabled:opacity-50"
              >
                <option value="all">ທຸກພະແນກ</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* =========================================================================
            DOCUMENTS TABLE & LIST VIEW
           ========================================================================= */}
        {unassignedDocs.length === 0 ? (
          /* Empty Celebration State */
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/60 to-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-emerald-950">
              🎉 ຍິນດີດ້ວຍ! ບໍ່ມີເອກະສານຄ້າງຈັດເກັບ
            </h2>
            <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-emerald-800">
              ເອກະສານທຸກສະບັບໃນລະບົບໄດ້ຮັບການກຳນົດບ່ອນຈັດເກັບໃນຄັງ (ສາງ, ຕູ້, ຊັ້ນວາງ, ແຟ້ມ) ຄົບຖ້ວນຮຽບຮ້ອຍແລ້ວ 100%.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/documents/archive"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <FolderArchive className="w-4 h-4" />
                <span>ໄປທີ່ຄັງເກັບເອກະສານ</span>
              </Link>
              <Link
                href="/documents"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <span>ເບິ່ງເອກະສານທັງໝົດ</span>
              </Link>
            </div>
          </div>
        ) : filteredDocs.length === 0 ? (
          /* Filter No Results */
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Filter className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-700">ບໍ່ພົບເອກະສານຕາມເງື່ອນໄຂທີ່ເລືອກ</p>
            <p className="mt-1 text-xs text-slate-400">ກະລຸນາລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ລ້າງຕົວກັ່ນຕອງ</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedDivision('all');
                setSelectedDepartment('all');
                setStatusTab('all');
              }}
              className="mt-4 inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              ລ້າງຕົວກັ່ນຕອງທັງໝົດ
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Table Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-xs sm:text-sm">ລາຍການເອກະສານຄ້າງຈັດເກັບ</span>
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {filteredDocs.length}
                </span>
                {isSelectionMode && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    selectedIds.size > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedIds.size > 0 ? `ເລືອກແລ້ວ ${selectedIds.size}` : 'ໂໝດເລືອກຫຼາຍລາຍການ'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isSelectionMode ? (
                  <button
                    type="button"
                    onClick={() => setIsSelectionMode(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ເລືອກຫຼາຍລາຍການ</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setBatchModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>ກຳນົດບ່ອນເກັບ ({selectedIds.size})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCancelSelection}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                      <span>ຍົກເລີກ</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    {isSelectionMode && (
                      <th className="py-3.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={handleToggleSelectAll}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="ເລືອກທັງໝົດ"
                        />
                      </th>
                    )}
                    <th className="py-3.5 px-3 w-12 text-center text-slate-500 whitespace-nowrap">ລ/ດ</th>
                    <th className="py-3.5 px-3.5 min-w-[260px]">ຊື່ເອກະສານ / ເລກທີ</th>
                    <th className="py-3.5 px-3 min-w-[160px]">ຝ່າຍ & ພະແນກ</th>
                    <th className="py-3.5 px-3 min-w-[120px] whitespace-nowrap">ໝວດໝູ່</th>
                    <th className="py-3.5 px-3 min-w-[110px] whitespace-nowrap">ສະຖານະ</th>
                    <th className="py-3.5 px-3 min-w-[130px] whitespace-nowrap">ສະຖານະບ່ອນເກັບ</th>
                    <th className="py-3.5 px-3 min-w-[120px] whitespace-nowrap">ວັນທີອັບໂຫຼດ</th>
                    <th className="py-3.5 px-3.5 min-w-[160px] text-right whitespace-nowrap">ຈັດການ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc, idx) => {
                    const isSelected = selectedIds.has(doc.id);
                    return (
                      <tr
                        key={doc.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Checkbox */}
                        {isSelectionMode && (
                          <td className="py-3.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(doc.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                        )}

                        {/* Sequence Number */}
                        <td className="py-3.5 px-3 text-center font-medium text-slate-400 tabular-nums whitespace-nowrap">
                          {idx + 1}
                        </td>

                        {/* Title & DocNumber */}
                        <td className="py-3.5 px-3.5">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 shrink-0">{getFileIcon(doc.fileType)}</div>
                            <div className="min-w-0">
                              <Link
                                href={`/documents/${doc.id}`}
                                className="font-semibold text-slate-900 hover:text-indigo-600 transition block truncate max-w-[280px]"
                                title={doc.title}
                              >
                                {doc.title}
                              </Link>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                                <span className="tabular-nums font-mono text-slate-500">
                                  {doc.docNumber || 'ບໍ່ມີເລກທີ'}
                                </span>
                                {doc.fileSize ? (
                                  <span>• {doc.fileSize}</span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Division & Department */}
                        <td className="py-3.5 px-3">
                          <div className="text-slate-800 font-medium truncate max-w-[160px]">
                            {doc.division || '-'}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                            {doc.department || '-'}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 whitespace-nowrap">
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            {doc.category || 'ທົ່ວໄປ'}
                          </span>
                        </td>

                        {/* Document Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap">{getStatusBadge(doc.status)}</td>

                        {/* Unassigned Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 border border-amber-200 whitespace-nowrap">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            ຍັງບໍ່ມີບ່ອນເກັບ
                          </span>
                        </td>

                        {/* Upload Date */}
                        <td className="py-3.5 px-3 text-slate-500 tabular-nums whitespace-nowrap">
                          {doc.uploadDate ? (
                            <div>
                              <div>{doc.uploadDate.slice(0, 10)}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                ໂດຍ: {doc.uploadedBy || '-'}
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setStorageDoc(doc)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-600 hover:text-white transition shadow-2xs whitespace-nowrap shrink-0"
                              title="ກຳນົດບ່ອນຈັດເກັບໃນຄັງ"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>ກຳນົດບ່ອນເກັບ</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditDoc(doc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition shrink-0"
                              title="ແກ້ໄຂເອກະສານ"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0"
                              title="ເບິ່ງຕົວຢ່າງ"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50 text-xs text-slate-500">
              <div>
                ສະແດງທັງໝົດ <span className="font-semibold text-slate-800 tabular-nums">{filteredDocs.length}</span> ສະບັບ
              </div>
              <div className="text-[11px] text-slate-400">
                ກະລຸນາກຳນົດສາງ, ຕູ້, ຊັ້ນວາງ ຫຼື ແຟ້ມໃຫ້ຄົບຖ້ວນເພື່ອຄວາມເປັນລະບຽບ
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SINGLE DOCUMENT ASSIGN MODAL
           ========================================================================= */}
        <SelectStorageLocationModal
          open={Boolean(storageDoc)}
          docTitle={storageDoc?.title}
          docNumber={storageDoc?.docNumber}
          department={storageDoc?.department}
          division={storageDoc?.division}
          initialWarehouseId={storageDoc?.warehouseId}
          initialCabinetId={storageDoc?.cabinetId}
          initialShelfId={storageDoc?.shelfId}
          initialFolderId={storageDoc?.folderId}
          confirmLabel="ບັນທຶກບ່ອນຈັດເກັບ"
          onClose={() => setStorageDoc(null)}
          onConfirm={async (data) => {
            if (!storageDoc) return;
            await assignDocument(
              storageDoc.id,
              data.cabinetId || '',
              data.folderId || '',
              data.warehouseId,
              data.shelfId
            );
            pushToast({
              title: 'ກຳນົດບ່ອນຈັດເກັບສຳເລັດ',
              description: storageDoc.title,
            });
            setStorageDoc(null);
            await reload();
          }}
        />

        {/* =========================================================================
            BATCH ASSIGNMENT MODAL
           ========================================================================= */}
        <Modal
          open={batchModalOpen}
          onClose={() => !batchSubmitting && setBatchModalOpen(false)}
          title={`🗄️ ກຳນົດບ່ອນເກັບເປັນກຸ່ມ (${selectedIds.size} ສະບັບ)`}
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-indigo-900">
              <div className="font-semibold">ທ່ານກຳລັງຈະກຳນົດບ່ອນເກັບໃຫ້ {selectedIds.size} ເອກະສານພ້ອມກັນ:</div>
              <div className="mt-1 text-[11px] text-indigo-700">
                ທຸກເອກະສານທີ່ເລືອກຈະຖືກຍ້າຍເຂົ້າໄປຢູ່ໃນ ສາງ, ຕູ້, ຊັ້ນວາງ ແລະ ແຟ້ມດຽວກັນທັນທີ.
              </div>
            </div>

            {/* Warehouse */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ຄັງເອກະສານ (Warehouse)
              </label>
              <select
                value={batchWarehouseId}
                onChange={(e) => {
                  setBatchWarehouseId(e.target.value);
                  setBatchCabinetId('');
                  setBatchShelfId('');
                  setBatchFolderId('');
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- ເລືອກຄັງເອກະສານ --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cabinet */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ຕູ້ເອກະສານ (Cabinet) <span className="text-rose-500">*</span>
              </label>
              <select
                value={batchCabinetId}
                onChange={(e) => {
                  setBatchCabinetId(e.target.value);
                  setBatchShelfId('');
                  setBatchFolderId('');
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- ເລືອກຕູ້ເອກະສານ --</option>
                {batchAvailableCabinets.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Shelf */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ຊັ້ນວາງເອກະສານ (Shelf)
              </label>
              <select
                value={batchShelfId}
                onChange={(e) => {
                  setBatchShelfId(e.target.value);
                  setBatchFolderId('');
                }}
                disabled={!batchCabinetId}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">-- ເລືອກຊັ້ນວາງ (ຖ້າມີ) --</option>
                {batchAvailableShelves.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Folder */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ແຟ້ມເອກະສານ (Folder)
              </label>
              <select
                value={batchFolderId}
                onChange={(e) => setBatchFolderId(e.target.value)}
                disabled={!batchCabinetId}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">-- ເລືອກແຟ້ມເກັບເອກະສານ (ຖ້າມີ) --</option>
                {batchAvailableFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                disabled={batchSubmitting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchAssign}
                disabled={batchSubmitting || (!batchCabinetId && !batchFolderId)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {batchSubmitting ? 'ກຳລັງບັນທຶກ...' : `ບັນທຶກທັງໝົດ (${selectedIds.size} ສະບັບ)`}
              </button>
            </div>
          </div>
        </Modal>

        {/* =========================================================================
            DOCUMENT PREVIEW MODAL
           ========================================================================= */}
        <Modal
          open={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.title || 'ເບິ່ງຕົວຢ່າງເອກະສານ'}
        >
          {previewDoc && (
            <div className="space-y-4">
              <DocumentPreview
                doc={previewDoc}
              />
            </div>
          )}
        </Modal>

        {/* =========================================================================
            EDIT DOCUMENT MODAL
           ========================================================================= */}
        <EditDocumentModal
          open={Boolean(editDoc)}
          doc={editDoc}
          onClose={() => setEditDoc(null)}
          onSuccess={() => void reload()}
        />
      </div>
    </DashboardLayout>
  );
}
