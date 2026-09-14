"use client"
import { useState } from 'react'
import { pushToast } from '@/app/components/ui/Toast'
import type { Cabinet, Document, Folder, Warehouse } from '@/types/document'
import type { DeleteTarget } from './ArchiveModals'

export type ViewState =
  | { level: 'warehouses' }
  | { level: 'cabinets'; warehouseId?: string }
  | { level: 'folders'; warehouseId?: string; cabinetId: string }
  | { level: 'documents'; warehouseId?: string; cabinetId: string; folderId: string };

interface ArchiveActions {
  createWarehouse?: (data: { name: string; division?: string; description?: string; color?: string }) => Promise<unknown> | void;
  createCabinet: (data: { name: string; color: string; department: string; description: string; warehouseId?: string | null; division?: string | null }) => Promise<unknown> | void;
  createFolder: (data: { cabinetId: string; name: string; description: string }) => Promise<unknown> | void;
  deleteWarehouse?: (id: string) => Promise<unknown> | void;
  deleteCabinet: (id: string) => Promise<unknown> | void;
  deleteFolder: (id: string) => Promise<unknown> | void;
  deleteDocument: (id: string) => Promise<unknown> | void;
}

export function useArchive(
  warehouses: Warehouse[] = [],
  cabinets: Cabinet[] = [],
  folders: Folder[] = [],
  documents: Document[] = [],
  actions: ArchiveActions
) {
  const [view, setView] = useState<ViewState>({ level: 'warehouses' });
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [cabinetModalOpen, setCabinetModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget | null>(null);

  const activeWarehouse: Warehouse | undefined =
    view.level === 'warehouses'
      ? undefined
      : view.warehouseId
      ? warehouses.find((w) => w.id === view.warehouseId)
      : 'cabinetId' in view
      ? warehouses.find((w) => w.id === cabinets.find((c) => c.id === view.cabinetId)?.warehouseId)
      : undefined;

  const activeCabinet: Cabinet | undefined =
    view.level === 'warehouses' || view.level === 'cabinets'
      ? undefined
      : cabinets.find((c) => c.id === view.cabinetId);

  const activeFolder: Folder | undefined =
    view.level === 'documents' ? folders.find((f) => f.id === view.folderId) : undefined;

  const warehouseCabinets =
    view.level === 'cabinets' && view.warehouseId
      ? cabinets.filter((c) => c.warehouseId === view.warehouseId)
      : cabinets;

  const cabinetFolders = activeCabinet
    ? folders.filter((f) => f.cabinetId === activeCabinet.id)
    : [];

  const folderDocuments =
    view.level === 'documents'
      ? documents.filter((d) => d.folderId === view.folderId && !d.deleted)
      : [];

  async function handleCreateWarehouse(data: { name: string; division?: string; description?: string; color?: string }) {
    try {
      await actions.createWarehouse?.(data);
      setWarehouseModalOpen(false);
      pushToast({ title: 'ສ້າງຄັງເອກະສານສຳເລັດ' });
    } catch (err) {
      console.error('Failed to create warehouse:', err);
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງຄັງເອກະສານ' });
    }
  }

  async function handleCreateCabinet(data: { name: string; color: string; department: string; description: string; warehouseId?: string | null; division?: string | null }) {
    try {
      await actions.createCabinet({
        ...data,
        warehouseId: data.warehouseId || activeWarehouse?.id || undefined,
        division: data.division || activeWarehouse?.division || undefined,
      });
      setCabinetModalOpen(false);
      pushToast({ title: 'ສ້າງຕູ້ເອກະສານສຳເລັດ' });
    } catch (err) {
      console.error('Failed to create cabinet:', err);
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງຕູ້ເອກະສານ' });
    }
  }

  async function handleCreateFolder(data: { name: string; description: string }) {
    if (!activeCabinet) return;
    try {
      await actions.createFolder({ cabinetId: activeCabinet.id, ...data });
      setFolderModalOpen(false);
      pushToast({ title: 'ສ້າງຊັ້ນວາງເອກະສານສຳເລັດ' });
    } catch (err) {
      console.error('Failed to create folder:', err);
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງຊັ້ນວາງເອກະສານ' });
    }
  }

  function handleDelete(type: 'warehouse' | 'cabinet' | 'folder' | 'document', id: string, name: string) {
    setConfirmDelete({ type, id, name });
  }

  function confirmDeleteNow() {
    if (!confirmDelete) return;
    const { type, id, name } = confirmDelete;

    if (type === 'warehouse') {
      actions.deleteWarehouse?.(id);
      setView({ level: 'warehouses' });
      pushToast({ title: `ລຶບຄັງ "${name}" ສຳເລັດ` });
    } else if (type === 'cabinet') {
      actions.deleteCabinet(id);
      const whId = 'warehouseId' in view ? view.warehouseId : undefined;
      setView({ level: 'cabinets', warehouseId: whId });
      pushToast({ title: `ລຶບຕູ້ "${name}" ສຳເລັດ` });
    } else if (type === 'folder') {
      actions.deleteFolder(id);
      if (view.level === 'folders') {
        setView({ level: 'folders', warehouseId: view.warehouseId, cabinetId: view.cabinetId });
      }
      pushToast({ title: `ລຶບຊັ້ນວາງ "${name}" ສຳເລັດ` });
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
      setView({ level: 'folders', warehouseId: view.warehouseId, cabinetId: activeCabinet!.id });
    } else if (view.level === 'folders') {
      setView({ level: 'cabinets', warehouseId: view.warehouseId });
    } else if (view.level === 'cabinets') {
      setView({ level: 'warehouses' });
    }
  }

  return {
    view,
    setView,
    warehouseModalOpen,
    setWarehouseModalOpen,
    cabinetModalOpen,
    setCabinetModalOpen,
    folderModalOpen,
    setFolderModalOpen,
    previewDoc,
    setPreviewDoc,
    confirmDelete,
    setConfirmDelete,
    activeWarehouse,
    activeCabinet,
    activeFolder,
    warehouseCabinets,
    cabinetFolders,
    folderDocuments,
    handleCreateWarehouse,
    handleCreateCabinet,
    handleCreateFolder,
    handleDelete,
    confirmDeleteNow,
    handleDownload,
    handleBack,
  };
}