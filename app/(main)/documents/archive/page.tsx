"use client"
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
    moveCabinet,
    moveShelf,
    moveFolder,
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

  return (
    <DashboardLayout title="ຄັງເກັບເອກກະສານ">
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
        <PageHeader
          showCreateButton={false}
          onSearchChange={undefined}
        />

        <div className="mb-4">
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
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
            warehouses={warehouses}
            cabinets={archive.visibleCabinets}
            folders={folders}
            documents={documents}
            canManage={canManage}
            viewMode={archive.viewMode}
            onViewModeChange={archive.setViewMode}
            onCreate={() => archive.setWarehouseModalOpen(true)}
            onOpen={(warehouseId) => archive.setView({ level: 'cabinets', warehouseId })}
            onDelete={(wh) => archive.handleDelete('warehouse', wh.id, wh.name)}
          />
        )}

        {archive.view.level === 'cabinets' && (
          <CabinetView
            warehouse={archive.activeWarehouse}
            warehouses={warehouses}
            cabinets={archive.warehouseCabinets}
            shelves={shelves}
            folders={folders}
            documents={documents}
            canManage={canManage}
            viewMode={archive.viewMode}
            onViewModeChange={archive.setViewMode}
            onCreate={() => archive.setCabinetModalOpen(true)}
            onOpen={(cabinetId) =>
              archive.setView({
                 level: 'shelves',
                 warehouseId: archive.activeWarehouse?.id,
                 cabinetId,
               })
             }
            onMoveCabinet={moveCabinet}
            onDelete={(cabinet) => archive.handleDelete('cabinet', cabinet.id, cabinet.name)}
          />
        )}

        {archive.view.level === 'shelves' && (
          <ShelfView
            cabinet={archive.activeCabinet}
            cabinets={archive.visibleCabinets}
            warehouses={warehouses}
            shelves={archive.activeCabinet ? archive.cabinetShelves : shelves}
            folders={folders}
            documents={documents}
            canManage={canManage}
            viewMode={archive.viewMode}
            onViewModeChange={archive.setViewMode}
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
            onMoveShelf={moveShelf}
            onDelete={(shelf) => archive.handleDelete('shelf', shelf.id, shelf.name)}
          />
        )}

        {archive.view.level === 'folders' && (
          <FolderView
            cabinet={archive.activeCabinet}
            cabinets={archive.visibleCabinets}
            shelf={archive.activeShelf}
            shelves={shelves}
            warehouses={warehouses}
            folders={archive.shelfFolders}
            documents={documents}
            canManage={canManage}
            viewMode={archive.viewMode}
            onViewModeChange={archive.setViewMode}
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
            onMoveFolder={moveFolder}
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