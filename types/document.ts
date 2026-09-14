export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'archived';
export type DocumentFileType = 'pdf' | 'doc' | 'image';
/** ທິດທາງເອກະສານ — ແຍກຈາກໝວດໝູ່ ເພື່ອຮອງຮັບເອກະສານທີ່ເປັນທັງຂາເຂົ້າ ແລະ ເປັນສັນຍາພ້ອມກັນ */
export type DocumentDirection = 'inbound' | 'outbound';

// ── 4-Level Archive types (Warehouse -> Cabinet -> Shelf/Folder -> Document)
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
};

export type Folder = {
  id: string;
  cabinetId: string;
  name: string;
  description: string;
  createdAt: string;
};

// Shelf is an alias for Folder (ຊັ້ນວາງເອກະສານ)
export type Shelf = Folder;

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
  uploadedBy: string;
  fileUrl: string;
  fileName?: string;
  pdfUrl?: string;
  deleted?: boolean;
  direction?: DocumentDirection; // ຂາເຂົ້າ / ຂາອອກ (ໃໝ່ — ແຍກຈາກໝວດໝູ່)
  division?: string; // ຝ່າຍ / ຫ້ອງການ / ສະຖາບັນ
  department?: string; // ພະແນກ / ສູນ
  // 4-Level archive fields
  warehouseId?: string;
  warehouseName?: string;
  cabinetId?: string;
  cabinetName?: string;
  folderId?: string;
  folderName?: string;
};