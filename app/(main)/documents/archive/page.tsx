"use client"
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/app/components/dashboard-layout';
import { useDocuments } from '../../context/DocumentsContext';
import { useArchive as useDMSArchive } from '../../context/ArchiveContext';
import { useCurrentUser } from '../../context/CurrentUserContext';
import {
  CreateWarehouseModal,
  CreateCabinetModal,
  CreateShelfModal,
  CreateFolderModal,
  ConfirmDeleteModal,
  DocumentPreviewModal,
  PageHeader,
} from '@/app/components/archive/ArchiveModals';
import WarehouseView from '@/app/components/archive/WarehouseView';
import CabinetView from '@/app/components/archive/CabinetView';
import ShelfView from '@/app/components/archive/ShelfView';
import FolderView from '@/app/components/archive/FolderView';
import DocumentView, { Breadcrumbs, BackButton } from '@/app/components/archive/DocumentView';
import { useArchive } from '@/app/components/archive/useArchive';

export default function ArchivePage() {
  const { user } = useCurrentUser();
  const { documents, deleteDocument, reload } = useDocuments();
  const {
    warehouses,
    cabinets,
    shelves,
    folders,
    createWarehouse,
    createCabinet,
    createShelf,
    createFolder,
    deleteWarehouse,
    deleteCabinet,
    deleteShelf,
    deleteFolder,
    assignDocument,
  } = useDMSArchive();

  // Role permissions:
  // - SuperAdmin ແລະ DivisionAdmin: ສາມາດສ້າງ ແລະ ຈັດການໂຄງສ້າງ (ຄັງ, ຕູ້, ຊັ້ນວາງ, ແຟ້ມ)
  // - DepartmentAdmin: ບໍ່ສາມາດສ້າງຄັງ, ຕູ້, ຊັ້ນວາງ, ແຟ້ມໄດ້ (ເບິ່ງໂຄງສ້າງ ແລະ ຈັດເກັບເອກະສານໄດ້ເທົ່ານັ້ນ)
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isDivisionAdmin = user?.role === 'DivisionAdmin';
  const isDepartmentAdmin = user?.role === 'DepartmentAdmin';
  const canManage = isSuperAdmin || isDivisionAdmin;

  const archive = useArchive(
    warehouses,
    cabinets,
    shelves,
    folders,
    documents,
    {
      createWarehouse,
      createCabinet,
      createShelf,
      createFolder,
      deleteWarehouse,
      deleteCabinet,
      deleteShelf,
      deleteFolder,
      deleteDocument,
    },
    user,
  );

  const [searchQuery, setSearchQuery] = useState('');

  const unassignedDocsCount = useMemo(() => {
    return documents.filter(
      (d) =>
        !d.deleted &&
        d.status !== 'pending' &&
        !(
          d.warehouseId ||
          d.cabinetId ||
          d.shelfId ||
          d.folderId ||
          d.warehouseName ||
          d.cabinetName ||
          d.shelfName ||
          d.folderName
        ),
    ).length;
  }, [documents]);

  // Reset search query when navigating between levels or containers
  useEffect(() => {
    setSearchQuery('');
  }, [archive.view]);

  const showCreateInHeader =
    canManage &&
    (archive.view.level === 'warehouses' ||
      archive.view.level === 'cabinets' ||
      archive.view.level === 'shelves' ||
      archive.view.level === 'folders');

  const showSearchInHeader =
    archive.view.level === 'warehouses' ||
    archive.view.level === 'cabinets' ||
    archive.view.level === 'shelves' ||
    archive.view.level === 'folders';

  const headerCreateLabel =
    archive.view.level === 'warehouses'
      ? 'ສ້າງຄັງເອກະສານໃໝ່'
      : archive.view.level === 'cabinets'
      ? 'ສ້າງຕູ້ເອກະສານໃໝ່'
      : archive.view.level === 'shelves'
      ? 'ສ້າງຊັ້ນວາງເອກະສານໃໝ່'
      : 'ສ້າງແຟ້ມເກັບເອກະສານໃໝ່';

  const searchPlaceholder =
    archive.view.level === 'warehouses'
      ? 'ຄົ້ນຫາຄັງເອກະສານ...'
      : archive.view.level === 'cabinets'
      ? 'ຄົ້ນຫາຕູ້ເອກະສານ...'
      : archive.view.level === 'shelves'
      ? 'ຄົ້ນຫາຊັ້ນວາງເອກະສານ...'
      : archive.view.level === 'folders'
      ? 'ຄົ້ນຫາແຟ້ມເກັບເອກະສານ...'
      : 'ຄົ້ນຫາ...';

  const handleHeaderCreate = () => {
    if (archive.view.level === 'warehouses') {
      archive.setWarehouseModalOpen(true);
    } else if (archive.view.level === 'cabinets') {
      archive.setCabinetModalOpen(true);
    } else if (archive.view.level === 'shelves') {
      archive.setShelfModalOpen(true);
    } else if (archive.view.level === 'folders') {
      archive.setFolderModalOpen(true);
    }
  };

  // Filtered lists based on search query
  const filteredWarehouses = useMemo(() => {
    if (!searchQuery.trim()) return warehouses;
    const q = searchQuery.toLowerCase().trim();
    return warehouses.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.division && w.division.toLowerCase().includes(q)) ||
        (w.description && w.description.toLowerCase().includes(q)),
    );
  }, [warehouses, searchQuery]);

  const filteredCabinets = useMemo(() => {
    const base = archive.warehouseCabinets;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase().trim();
    return base.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.department && c.department.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)),
    );
  }, [archive.warehouseCabinets, searchQuery]);

  const filteredShelves = useMemo(() => {
    const base = archive.activeCabinet ? archive.cabinetShelves : shelves;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase().trim();
    return base.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)),
    );
  }, [archive.activeCabinet, archive.cabinetShelves, shelves, searchQuery]);

  const filteredFolders = useMemo(() => {
    const base = archive.shelfFolders;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase().trim();
    return base.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q)),
    );
  }, [archive.shelfFolders, searchQuery]);

  return (
    <DashboardLayout title="ຄັງເກັບເອກກະສານ">
      <main className="flex-1 overflow-y-auto p-6">
        <PageHeader
          showCreateButton={showCreateInHeader}
          createButtonLabel={headerCreateLabel}
          onCreate={handleHeaderCreate}
          searchValue={searchQuery}
          onSearchChange={showSearchInHeader ? setSearchQuery : undefined}
          searchPlaceholder={searchPlaceholder}
        />

        {unassignedDocsCount > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl">
                📦
              </span>
              <div>
                <div className="text-sm font-semibold text-amber-900">
                  ມີ {unassignedDocsCount} ເອກະສານທີ່ຍັງບໍ່ທັນຖືກຈັດເກັບເຂົ້າຄັງ / ຕູ້ / ຊັ້ນ / ແຟ້ມ
                </div>
                <div className="text-xs text-amber-700">
                  ທ່ານສາມາດກວດສອບ ແລະ ເລືອກບ່ອນຈັດເກັບໃຫ້ເອກະສານໄດ້ໂດຍກົງ
                </div>
              </div>
            </div>
            <Link
              href="/documents?warehouse=unassigned"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition shrink-0"
            >
              🔍 ກວດສອບ ແລະ ລະບຸບ່ອນເກັບ →
            </Link>
          </div>
        )}

        <div className="mb-6">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <Breadcrumbs
              view={archive.view}
              activeWarehouse={archive.activeWarehouse}
              activeCabinet={archive.activeCabinet}
              activeShelf={archive.activeShelf}
              activeFolder={archive.activeFolder}
              onNavigate={archive.setView}
            />
          </div>
        </div>

        {archive.view.level === 'warehouses' && (
          <WarehouseView
            warehouses={filteredWarehouses}
            cabinets={archive.visibleCabinets}
            documents={documents}
            canManage={canManage}
            onCreate={() => archive.setWarehouseModalOpen(true)}
            onOpen={(warehouseId) => archive.setView({ level: 'cabinets', warehouseId })}
            onDelete={(wh) => archive.handleDelete('warehouse', wh.id, wh.name)}
          />
        )}

        {archive.view.level === 'cabinets' && (
          <CabinetView
            cabinets={filteredCabinets}
            shelves={shelves}
            folders={folders}
            documents={documents}
            canManage={canManage}
            onCreate={() => archive.setCabinetModalOpen(true)}
            onOpen={(cabinetId) =>
              archive.setView({
                level: 'shelves',
                warehouseId: archive.activeWarehouse?.id,
                cabinetId,
              })
            }
            onDelete={(cabinet) => archive.handleDelete('cabinet', cabinet.id, cabinet.name)}
          />
        )}

        {archive.view.level === 'shelves' && (
          <ShelfView
            cabinet={archive.activeCabinet}
            cabinets={archive.visibleCabinets}
            shelves={filteredShelves}
            folders={folders}
            documents={documents}
            canManage={canManage}
            onCreate={() => archive.setShelfModalOpen(true)}
            onOpen={(shelfId) => {
              const sh = shelves.find((s) => s.id === shelfId);
              archive.setView({
                level: 'folders',
                warehouseId: archive.activeWarehouse?.id,
                cabinetId: sh?.cabinetId || archive.activeCabinet?.id || '',
                shelfId,
              });
            }}
            onDelete={(shelf) => archive.handleDelete('shelf', shelf.id, shelf.name)}
          />
        )}

        {archive.view.level === 'folders' && (
          <FolderView
            cabinet={archive.activeCabinet}
            cabinets={archive.visibleCabinets}
            shelf={archive.activeShelf}
            shelves={shelves}
            folders={filteredFolders}
            documents={documents}
            canManage={canManage}
            onCreate={() => archive.setFolderModalOpen(true)}
            onOpen={(folderId) => {
              const fol = folders.find((f) => f.id === folderId);
              archive.setView({
                level: 'documents',
                warehouseId: archive.activeWarehouse?.id,
                cabinetId: fol?.cabinetId || archive.activeCabinet?.id || '',
                shelfId: fol?.shelfId || archive.activeShelf?.id,
                folderId,
              });
            }}
            onDelete={(folder) => archive.handleDelete('folder', folder.id, folder.name)}
          />
        )}

        {archive.view.level === 'documents' && (
          <DocumentView
            cabinet={archive.activeCabinet}
            shelf={archive.activeShelf}
            folder={archive.activeFolder}
            warehouses={warehouses}
            cabinets={archive.visibleCabinets}
            shelves={shelves}
            folders={folders}
            documents={
              archive.activeFolder
                ? archive.folderDocuments
                : documents.filter((d) => !d.deleted && (d.folderId || d.cabinetId || d.status === 'archived'))
            }
            onSelectFolder={(folderId) => {
              const fol = folders.find((f) => f.id === folderId);
              archive.setView({
                level: 'documents',
                warehouseId: archive.activeWarehouse?.id,
                cabinetId: fol?.cabinetId || archive.activeCabinet?.id || '',
                shelfId: fol?.shelfId || archive.activeShelf?.id,
                folderId,
              });
            }}
            onAssignDocument={async (docId, cabId, folId, whId, shId) => {
              await assignDocument(docId, cabId, folId, whId, shId);
              await reload();
            }}
            onPreview={archive.setPreviewDoc}
            onDownload={archive.handleDownload}
            onDelete={(doc) => archive.handleDelete('document', doc.id, doc.title)}
          />
        )}

        {archive.view.level !== 'warehouses' && <BackButton onClick={archive.handleBack} />}

        <CreateWarehouseModal
          open={archive.warehouseModalOpen}
          onClose={() => archive.setWarehouseModalOpen(false)}
          userDivision={isSuperAdmin ? undefined : user?.division}
          isSuperAdmin={isSuperAdmin}
          onCreate={archive.handleCreateWarehouse}
        />

        <CreateCabinetModal
          open={archive.cabinetModalOpen}
          onClose={() => archive.setCabinetModalOpen(false)}
          warehouses={warehouses}
          defaultWarehouseId={archive.activeWarehouse?.id}
          userDivision={isSuperAdmin ? undefined : user?.division}
          userDepartment={isSuperAdmin ? undefined : user?.department}
          isSuperAdmin={isSuperAdmin}
          isDepartmentAdmin={isDepartmentAdmin}
          onCreate={archive.handleCreateCabinet}
        />

        <CreateShelfModal
          open={archive.shelfModalOpen}
          onClose={() => archive.setShelfModalOpen(false)}
          cabinets={archive.visibleCabinets.length > 0 ? archive.visibleCabinets : cabinets}
          activeCabinetId={archive.activeCabinet?.id}
          cabinetName={archive.activeCabinet?.name}
          onCreate={archive.handleCreateShelf}
        />

        <CreateFolderModal
          open={archive.folderModalOpen}
          onClose={() => archive.setFolderModalOpen(false)}
          cabinets={archive.visibleCabinets.length > 0 ? archive.visibleCabinets : cabinets}
          shelves={shelves}
          activeCabinetId={archive.activeCabinet?.id}
          activeShelfId={archive.activeShelf?.id}
          cabinetName={archive.activeCabinet?.name}
          shelfName={archive.activeShelf?.name}
          onCreate={archive.handleCreateFolder}
        />

        <DocumentPreviewModal
          doc={archive.previewDoc}
          onClose={() => archive.setPreviewDoc(null)}
          onDownload={archive.handleDownload}
        />

        <ConfirmDeleteModal
          target={archive.confirmDelete}
          onClose={() => archive.setConfirmDelete(null)}
          onConfirm={archive.confirmDeleteNow}
        />
      </main>
    </DashboardLayout>
  );
}