export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'archived';
export type DocumentFileType = 'pdf' | 'doc' | 'image';

// ── 3-Level Archive types ────────────────────────────────────────────────
export type Cabinet = {
  id: string;
  name: string;
  color: string; // Tailwind gradient classes e.g. "from-indigo-500 to-blue-500"
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

export type Document = {
  id: string;
  title: string;
  docNumber: string;
  // ໝວດໝູ່ຕອນນີ້ດຶງມາຈາກຕາຕະລາງ categories ໃນຖານຂໍ້ມູນ (dynamic), ບໍ່ແມ່ນຄ່າຄົງທີ່ອີກຕໍ່ໄປ
  category: string;
  status: DocumentStatus;
  fileType: DocumentFileType;
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  fileUrl: string;
  fileName?: string;
  pdfUrl?: string;
  deleted?: boolean;
  division?: string; // ຝ່າຍ / ຫ້ອງການ / ສະຖາບັນ
  department?: string; // ພະແນກ / ສູນ
  documentType?: string;
  // 3-Level archive fields
  cabinetId?: string;
  cabinetName?: string;
  folderId?: string;
  folderName?: string;
};