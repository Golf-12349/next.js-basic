"use client"
import { useState } from 'react'
import { pushToast } from '@/app/components/ui/Toast'
import type { Cabinet, Document, Folder } from '@/types/document'
import type { DeleteTarget } from './ArchiveModals'

export type ViewState =
  | { level: 'cabinets' }
  | { level: 'folders'; cabinetId: string }
  | { level: 'documents'; cabinetId: string; folderId: string };

interface ArchiveActions {
  createCabinet: (data: { name: string; color: string; department: string; description: string }) => void;
  createFolder: (data: { cabinetId: string; name: string; description: string }) => void;
  deleteCabinet: (id: string) => void;
  deleteFolder: (id: string) => void;
  deleteDocument: (id: string) => void;
}

export function useArchive(
  cabinets: Cabinet[] = [],
  folders: Folder[] = [],
  documents: Document[] = [],
  actions: ArchiveActions
) {
  const [view, setView] = useState<ViewState>({ level: 'cabinets' });
  const [cabinetModalOpen, setCabinetModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget | null>(null);

  const activeCabinet: Cabinet | undefined =
    view.level === 'cabinets' ? undefined : cabinets.find((c) => c.id === view.cabinetId);

  const activeFolder: Folder | undefined =
    view.level === 'documents' ? folders.find((f) => f.id === view.folderId) : undefined;

  const cabinetFolders = activeCabinet
    ? folders.filter((f) => f.cabinetId === activeCabinet.id)
    : [];

  const folderDocuments =
    view.level === 'documents'
      ? documents.filter((d) => d.folderId === view.folderId && !d.deleted)
      : [];

  function handleCreateCabinet(data: { name: string; color: string; department: string; description: string }) {
    actions.createCabinet(data);
    setCabinetModalOpen(false);
    pushToast({ title: 'ສ້າງຕູ້ເອກະສານສຳເລັດ' });
  }

  function handleCreateFolder(data: { name: string; description: string }) {
    if (!activeCabinet) return;
    actions.createFolder({ cabinetId: activeCabinet.id, ...data });
    setFolderModalOpen(false);
    pushToast({ title: 'ສ້າງແຟ້ມສຳເລັດ' });
  }

  function handleDelete(type: 'cabinet' | 'folder' | 'document', id: string, name: string) {
    setConfirmDelete({ type, id, name });
  }

  function confirmDeleteNow() {
    if (!confirmDelete) return;
    const { type, id, name } = confirmDelete;

    if (type === 'cabinet') {
      actions.deleteCabinet(id);
      setView({ level: 'cabinets' });
      pushToast({ title: `ລຶບຕູ້ "${name}" ສຳເລັດ` });
    } else if (type === 'folder') {
      actions.deleteFolder(id);
      if (view.level === 'folders') {
        setView({ level: 'folders', cabinetId: view.cabinetId });
      }
      pushToast({ title: `ລຶບແຟ້ມ "${name}" ສຳເລັດ` });
    } else if (type === 'document') {
      actions.deleteDocument(id);
      pushToast({ title: `ຍ້າຍ "${name}" ໄປ Trash` });
    }
    setConfirmDelete(null);
  }

  function handleDownload(doc: Document) {
    const url = doc.pdfUrl?.trim() || doc.fileUrl?.trim() || '#';
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
      pushToast({ title: 'ກຳລັງດາວໂຫຼດເອກະສານ' });
    } else {
      pushToast({ title: 'ບໍ່ພົບລິ້ງໄຟລ໌ຂອງເອກະສານ' });
    }
  }

  function handleBack() {
    if (view.level === 'documents') {
      setView({ level: 'folders', cabinetId: activeCabinet!.id });
    } else {
      setView({ level: 'cabinets' });
    }
  }

  return {
    view,
    setView,
    cabinetModalOpen,
    setCabinetModalOpen,
    folderModalOpen,
    setFolderModalOpen,
    previewDoc,
    setPreviewDoc,
    confirmDelete,
    setConfirmDelete,
    activeCabinet,
    activeFolder,
    cabinetFolders,
    folderDocuments,
    handleCreateCabinet,
    handleCreateFolder,
    handleDelete,
    confirmDeleteNow,
    handleDownload,
    handleBack,
  };
}