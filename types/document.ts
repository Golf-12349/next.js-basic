export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'archived';
export type DocumentFileType = 'pdf' | 'doc' | 'image';

export type DocumentCategory =
  | 'ຂາເຂົ້າ'
  | 'ຂາອອກ'
  | 'ຄຳສັ່ງ'
  | 'ແຈ້ງການ'
  | 'ສັນຍາ'
  | 'ລາຍງານ';

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
  category: DocumentCategory;
  status: DocumentStatus;
  fileType: DocumentFileType;
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  fileUrl: string;
  fileName?: string;
  pdfUrl?: string;
  deleted?: boolean;
  department?: string;
  documentType?: string;
  // 3-Level archive fields
  cabinetId?: string;
  cabinetName?: string;
  folderId?: string;
  folderName?: string;
};