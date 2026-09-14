"use client"
import { DashboardLayout } from '@/app/components/dashboard-layout';
import { useDocuments } from '../../context/DocumentsContext';
import { useArchive as useDMSArchive } from '../../context/ArchiveContext';
import { useCurrentUser } from '../../context/CurrentUserContext';
import {
  CreateWarehouseModal,
  CreateCabinetModal,
  CreateFolderModal,
  ConfirmDeleteModal,
  DocumentPreviewModal,
  PageHeader,
} from '@/app/components/archive/ArchiveModals';
import WarehouseView from '@/app/components/archive/WarehouseView';
import CabinetView from '@/app/components/archive/CabinetView';
import FolderView from '@/app/components/archive/FolderView';
import DocumentView, { Breadcrumbs, BackButton } from '@/app/components/archive/DocumentView';
import { useArchive } from '@/app/components/archive/useArchive';

export default function ArchivePage() {
  const { user } = useCurrentUser();
  const { documents, deleteDocument } = useDocuments();
  const {
    warehouses,
    cabinets,
    folders,
    createWarehouse,
    createCabinet,
    createFolder,
    deleteWarehouse,
    deleteCabinet,
    deleteFolder,
  } = useDMSArchive();

  // Role permissions: SuperAdmin and DivisionAdmin can manage warehouses/cabinets/shelves
  // DepartmentAdmin can view cabinets and shelves (read-only for archive structure)
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isDepartmentAdmin = user?.role === 'DepartmentAdmin';
  const canManage = !isDepartmentAdmin;

  const archive = useArchive(warehouses, cabinets, folders, documents, {
    createWarehouse,
    createCabinet,
    createFolder,
    deleteWarehouse,
    deleteCabinet,
    deleteFolder,
    deleteDocument,
  });

  const showCreateInHeader =
    canManage &&
    (archive.view.level === 'warehouses' ||
      archive.view.level === 'cabinets' ||
      archive.view.level === 'folders');

  const headerCreateLabel =
    archive.view.level === 'warehouses'
      ? '+ ສ້າງຄັງເອກະສານໃໝ່'
      : archive.view.level === 'cabinets'
      ? '+ ສ້າງຕູ້ເອກະສານໃໝ່'
      : '+ ສ້າງຊັ້ນວາງເອກະສານໃໝ່';

  const handleHeaderCreate = () => {
    if (archive.view.level === 'warehouses') {
      archive.setWarehouseModalOpen(true);
    } else if (archive.view.level === 'cabinets') {
      archive.setCabinetModalOpen(true);
    } else if (archive.view.level === 'folders') {
      archive.setFolderModalOpen(true);
    }
  };

  return (
    <DashboardLayout title="ຄັງເກັບເອກກະສານ">
      <main className="flex-1 overflow-y-auto p-6">
        <PageHeader
          showCreateButton={showCreateInHeader}
          createButtonLabel={headerCreateLabel}
          onCreate={handleHeaderCreate}
          showSecondaryButton={canManage && archive.view.level !== 'warehouses'}
          secondaryButtonLabel="+ ສ້າງຄັງເອກະສານໃໝ່"
          onSecondaryCreate={() => archive.setWarehouseModalOpen(true)}
        />

        <div className="mb-6">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <Breadcrumbs
              view={archive.view}
              activeWarehouse={archive.activeWarehouse}
              activeCabinet={archive.activeCabinet}
              activeFolder={archive.activeFolder}
              onNavigate={archive.setView}
            />
          </div>
        </div>

        {archive.view.level === 'warehouses' && (
          <WarehouseView
            warehouses={warehouses}
            cabinets={cabinets}
            documents={documents}
            canManage={canManage}
            onCreate={() => archive.setWarehouseModalOpen(true)}
            onOpen={(warehouseId) => archive.setView({ level: 'cabinets', warehouseId })}
            onDelete={(wh) => archive.handleDelete('warehouse', wh.id, wh.name)}
          />
        )}

        {archive.view.level === 'cabinets' && (
          <CabinetView
            cabinets={archive.warehouseCabinets}
            folders={folders}
            documents={documents}
            canManage={canManage}
            onCreate={() => archive.setCabinetModalOpen(true)}
            onOpen={(cabinetId) =>
              archive.setView({
                level: 'folders',
                warehouseId: archive.activeWarehouse?.id,
                cabinetId,
              })
            }
            onDelete={(cabinet) => archive.handleDelete('cabinet', cabinet.id, cabinet.name)}
          />
        )}

        {archive.view.level === 'folders' && archive.activeCabinet && (
          <FolderView
            cabinet={archive.activeCabinet}
            folders={archive.cabinetFolders}
            documents={documents}
            canManage={canManage}
            onCreate={() => archive.setFolderModalOpen(true)}
            onOpen={(folderId) =>
              archive.setView({
                level: 'documents',
                warehouseId: archive.activeWarehouse?.id,
                cabinetId: archive.activeCabinet!.id,
                folderId,
              })
            }
            onDelete={(folder) => archive.handleDelete('folder', folder.id, folder.name)}
          />
        )}

        {archive.view.level === 'documents' && archive.activeCabinet && archive.activeFolder && (
          <DocumentView
            cabinet={archive.activeCabinet}
            folder={archive.activeFolder}
            documents={archive.folderDocuments}
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
          isSuperAdmin={isSuperAdmin}
          onCreate={archive.handleCreateCabinet}
        />

        <CreateFolderModal
          open={archive.folderModalOpen}
          onClose={() => archive.setFolderModalOpen(false)}
          cabinetName={archive.activeCabinet?.name}
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