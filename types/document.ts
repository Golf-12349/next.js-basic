export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'archived';
export type DocumentFileType = 'pdf' | 'doc' | 'image';

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
};
