"use client"
import { DashboardLayout } from '@/app/components/dashboard-layout';
import { useDMS } from '../../_dms-context';
import {
  CreateCabinetModal,
  CreateFolderModal,
  ConfirmDeleteModal,
  DocumentPreviewModal,
  PageHeader,
} from '@/app/components/archive/ArchiveModals';
import CabinetView from '@/app/components/archive/CabinetView';
import FolderView from '@/app/components/archive/FolderView';
import DocumentView, { Breadcrumbs, BackButton } from '@/app/components/archive/DocumentView';
import { useArchive } from '@/app/components/archive/useArchive';

export default function ArchivePage() {
  const {
    cabinets,
    folders,
    documents,
    createCabinet,
    createFolder,
    deleteCabinet,
    deleteFolder,
    deleteDocument,
  } = useDMS();

  const archive = useArchive(cabinets, folders, documents, {
    createCabinet,
    createFolder,
    deleteCabinet,
    deleteFolder,
    deleteDocument,
  });

  return (
    <DashboardLayout title="ຄັງເກັບເອກກະສານ">
      <main className="flex-1 overflow-y-auto p-6">
        <PageHeader
          showCreateButton={archive.view.level === 'cabinets'}
          onCreate={() => archive.setCabinetModalOpen(true)}
        />

        <div className="mb-6">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <Breadcrumbs
              view={archive.view}
              activeCabinet={archive.activeCabinet}
              activeFolder={archive.activeFolder}
              onNavigate={archive.setView}
            />
          </div>
        </div>

        {archive.view.level === 'cabinets' && (
          <CabinetView
            cabinets={cabinets}
            folders={folders}
            documents={documents}
            onCreate={() => archive.setCabinetModalOpen(true)}
            onOpen={(cabinetId) => archive.setView({ level: 'folders', cabinetId })}
            onDelete={(cabinet) => archive.handleDelete('cabinet', cabinet.id, cabinet.name)}
          />
        )}

        {archive.view.level === 'folders' && archive.activeCabinet && (
          <FolderView
            cabinet={archive.activeCabinet}
            folders={archive.cabinetFolders}
            documents={documents}
            onCreate={() => archive.setFolderModalOpen(true)}
            onOpen={(folderId) => archive.setView({ level: 'documents', cabinetId: archive.activeCabinet!.id, folderId })}
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

        {archive.view.level !== 'cabinets' && <BackButton onClick={archive.handleBack} />}

        <CreateCabinetModal
          open={archive.cabinetModalOpen}
          onClose={() => archive.setCabinetModalOpen(false)}
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
  )
}