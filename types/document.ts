export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'archived';
export type DocumentFileType = 'pdf' | 'doc' | 'image';

export type DocumentCategory =
  | 'ຂາເຂົ້າ'
  | 'ຂາອອກ'
  | 'ຄຳສັ່ງ'
  | 'ແຈ້ງການ'
  | 'ສັນຍາ'
  | 'ລາຍງານ';

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
};
