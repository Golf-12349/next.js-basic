"use client"
import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { pushToast } from '@/app/components/ui/Toast'
import type { Cabinet, Document, Folder, Warehouse } from '@/types/document'
import type { CurrentUser } from '@/types/user'
import type { DeleteTarget } from './ArchiveModals'

export type ViewState =
  | { level: 'warehouses' }
  | { level: 'cabinets'; warehouseId?: string }
  | { level: 'folders'; warehouseId?: string; cabinetId?: string }
  | { level: 'documents'; warehouseId?: string; cabinetId?: string; folderId?: string };

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
  actions: ArchiveActions,
  currentUser?: CurrentUser | null
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryLevel = (searchParams.get('level') as ViewState['level']) || 'warehouses';
  const queryWarehouseId = searchParams.get('warehouseId') || undefined;
  const queryCabinetId = searchParams.get('cabinetId') || undefined;
  const queryFolderId = searchParams.get('folderId') || undefined;

  const view: ViewState = useMemo(() => {
    if (queryLevel === 'documents') {
      return {
        level: 'documents',
        warehouseId: queryWarehouseId,
        cabinetId: queryCabinetId,
        folderId: queryFolderId,
      };
    }
    if (queryLevel === 'folders') {
      return {
        level: 'folders',
        warehouseId: queryWarehouseId,
        cabinetId: queryCabinetId,
      };
    }
    if (queryLevel === 'cabinets') {
      return {
        level: 'cabinets',
        warehouseId: queryWarehouseId,
      };
    }
    return { level: 'warehouses' };
  }, [queryLevel, queryWarehouseId, queryCabinetId, queryFolderId]);

  const setView = useCallback(
    (nextView: ViewState) => {
      const params = new URLSearchParams();
      params.set('level', nextView.level);
      if ('warehouseId' in nextView && nextView.warehouseId) {
        params.set('warehouseId', nextView.warehouseId);
      }
      if ('cabinetId' in nextView && nextView.cabinetId) {
        params.set('cabinetId', nextView.cabinetId);
      }
      if ('folderId' in nextView && nextView.folderId) {
        params.set('folderId', nextView.folderId);
      }
      const query = params.toString();
      const newUrl = query ? `/documents/archive?${query}` : '/documents/archive';
      router.push(newUrl);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dms:archive-level-changed', {
            detail: { level: nextView.level },
          })
        );
      }
    },
    [router]
  );

  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [cabinetModalOpen, setCabinetModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget | null>(null);

  const visibleCabinets = useMemo(() => {
    if (currentUser?.role === 'DepartmentAdmin' && currentUser.department) {
      const userDept = currentUser.department.trim().toLowerCase();
      return cabinets.filter((c) => c.department?.trim().toLowerCase() === userDept);
    }
    if (currentUser?.role === 'DivisionAdmin' && currentUser.division) {
      return cabinets.filter((c) => !c.division || c.division === currentUser.division);
    }
    return cabinets;
  }, [cabinets, currentUser]);

  const activeFolder: Folder | undefined =
    view.level === 'documents' && 'folderId' in view && view.folderId
      ? folders.find((f) => f.id === view.folderId)
      : undefined;

  const activeCabinet: Cabinet | undefined =
    view.level === 'warehouses' || view.level === 'cabinets'
      ? undefined
      : 'cabinetId' in view && view.cabinetId
      ? visibleCabinets.find((c) => c.id === view.cabinetId)
      : activeFolder
      ? visibleCabinets.find((c) => c.id === activeFolder.cabinetId)
      : undefined;

  const activeWarehouse: Warehouse | undefined =
    view.level === 'warehouses'
      ? undefined
      : view.warehouseId
      ? warehouses.find((w) => w.id === view.warehouseId)
      : activeCabinet?.warehouseId
      ? warehouses.find((w) => w.id === activeCabinet.warehouseId)
      : undefined;

  const warehouseCabinets = useMemo(() => {
    return view.level === 'cabinets' && view.warehouseId
      ? visibleCabinets.filter((c) => c.warehouseId === view.warehouseId)
      : visibleCabinets;
  }, [visibleCabinets, view]);

  const cabinetFolders = activeCabinet
    ? folders.filter((f) => f.cabinetId === activeCabinet.id)
    : folders;

  // ເອກະສານຂອງຊັ້ນວາງໃຜຊັ້ນວາງມັນ strictly — ບໍ່ດຶງເອກະສານຂອງຊັ້ນວາງອື່ນມາປົນເດັດຂາດ
  const folderDocuments =
    activeFolder
      ? documents.filter(
          (d) =>
            !d.deleted &&
            (d.folderId === activeFolder.id ||
              (Boolean(activeFolder.name) && Boolean(d.folderName) && d.folderName === activeFolder.name))
        )
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
      if (activeCabinet) {
        setView({ level: 'folders', warehouseId: view.warehouseId, cabinetId: activeCabinet.id });
      } else {
        setView({ level: 'folders' });
      }
    } else if (view.level === 'folders') {
      if (view.warehouseId) {
        setView({ level: 'cabinets', warehouseId: view.warehouseId });
      } else {
        setView({ level: 'cabinets' });
      }
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
    visibleCabinets,
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