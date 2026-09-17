export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'archived' | 'expired';
export type DocumentFileType = 'pdf' | 'doc' | 'image';
/** ທິດທາງເອກະສານ — ແຍກຈາກໝວດໝູ່ ເພື່ອຮອງຮັບເອກະສານທີ່ເປັນທັງຂາເຂົ້າ ແລະ ເປັນສັນຍາພ້ອມກັນ */
export type DocumentDirection = 'inbound' | 'outbound';

// ── 5-Level Archive types (Warehouse -> Cabinet -> Shelf -> Folder -> Document Storage)
export type Warehouse = {
  id: string;
  name: string;
  division?: string | null;
  description?: string | null;
  color?: string | null;
  createdAt: string;
};

export type Cabinet = {
  id: string;
  warehouseId?: string | null;
  name: string;
  color: string; // Tailwind gradient classes e.g. "from-indigo-500 to-blue-500"
  division?: string | null;
  department: string;
  description: string;
  createdAt: string;
  _count?: { shelves?: number; folders?: number; documents?: number };
};

export type Shelf = {
  id: string;
  cabinetId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  cabinet?: Cabinet | null;
  _count?: { folders?: number; documents?: number };
};

export type Folder = {
  id: string;
  cabinetId: string;
  shelfId?: string | null;
  name: string;
  description: string;
  createdAt: string;
  cabinet?: Cabinet | null;
  shelf?: Shelf | null;
  _count?: { documents?: number };
};

export type Document = {
  id: string;
  title: string;
  docNumber: string;
  // ໝວດໝູ່ຕອນນີ້ດຶງມາຈາກຕາຕະລາງ categories ໃນຖານຂໍ້ມູນ (dynamic), ບໍ່ແມ່ນຄ່າຄົງທີ່ອີກຕໍ່ໄປ
  category: string;
  categoryId?: string; // id ຂອງໝວດໝູ່ໃນ backend — ວ່າງເມື່ອເອກະສານບໍ່ມີໝວດໝູ່
  status: DocumentStatus;
  fileType: DocumentFileType;
  fileSize: string;
  uploadDate: string;
  expiresAt?: string;
  uploadedBy: string;
  fileUrl: string;
  fileName?: string;
  pdfUrl?: string;
  deleted?: boolean;
  direction?: DocumentDirection; // ຂາເຂົ້າ / ຂາອອກ (ໃໝ່ — ແຍກຈາກໝວດໝູ່)
  division?: string; // ຝ່າຍ / ຫ້ອງການ / ສະຖາບັນ
  department?: string; // ພະແນກ / ສູນ
  // 5-Level archive fields
  warehouseId?: string;
  warehouseName?: string;
  cabinetId?: string;
  cabinetName?: string;
  shelfId?: string;
  shelfName?: string;
  folderId?: string;
  folderName?: string;
  transfers?: DocumentTransfer[];
};

export type TransferStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type DocumentTransfer = {
  id: string;
  documentId: string;
  fromDivision?: string;
  fromDepartment?: string;
  toDivision: string;
  toDepartment: string;
  senderId: string;
  reviewerId?: string;
  status: TransferStatus;
  keepCopy?: boolean;
  note?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  document?: Document;
  sender?: {
    id: string;
    name: string;
    department?: string;
    division?: string;
    role?: string;
  };
  reviewer?: {
    id: string;
    name: string;
    department?: string;
    division?: string;
    role?: string;
  };
};
