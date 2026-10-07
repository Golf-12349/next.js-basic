import * as XLSX from 'xlsx';
import type { Document } from '@/types/document';

export interface ExcelExportOptions {
  title?: string;
  subTitle?: string;
  preparedBy?: string;
  filterScope?: string;
  cabinets?: { id: string; name: string }[];
  warehouses?: { id: string; name: string }[];
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return 'ອະນຸມັດແລ້ວ';
    case 'pending':
      return 'ລໍຖ້າອະນຸມັດ';
    case 'draft':
      return 'ສະບັບຮ່າງ';
    case 'expired':
      return 'ໝົດອາຍຸ';
    case 'archived':
      return 'ຈັດເກັບແລ້ວ';
    default:
      return status || 'ທົ່ວໄປ';
  }
}

function getDirectionLabel(dir?: string): string {
  if (dir === 'inbound') return 'ຂາເຂົ້າ (Inbound)';
  if (dir === 'outbound') return 'ຂາອອກ (Outbound)';
  return 'ພາຍໃນ (Internal)';
}

/**
 * Professional multi-sheet Excel generator for EDL-DMS
 * Creates:
 *  Sheet 1: ລາຍການເອກະສານລະອຽດ (Document Register) with official header block and auto-calculated column widths
 *  Sheet 2: ສະຫຼຸບສະຖິຕິ KPI (Executive Summary & Breakdowns by Status, Flow, Category, and Department)
 */
export function exportDocumentsToExcel(
  documents: Document[],
  options: ExcelExportOptions = {}
): void {
  const {
    title = 'ບົດລາຍງານສະຫຼຸບເອກະສານທາງການ (EDL-DMS)',
    subTitle = 'ລະບົບຄຸ້ມຄອງເອກະສານ ລັດວິສາຫະກິດໄຟຟ້າລາວ • ELECTRICITE DU LAOS',
    preparedBy = 'ເຈົ້າໜ້າທີ່ຄຸ້ມຄອງເອກະສານ EDL',
    filterScope = 'ເອກະສານທັງໝົດຕາມເງື່ອນໄຂທີ່ກັ່ນຕອງ',
    cabinets = [],
  } = options;

  const now = new Date();
  const reportDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${String(
    now.getHours()
  ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const total = documents.length;

  // ---------------------------------------------------------------------------
  // SHEET 1: DETAIL DOCUMENT LIST
  // ---------------------------------------------------------------------------
  const sheet1Data: (string | number)[][] = [
    // Header block
    ['ລັດວິສາຫະກິດໄຟຟ້າລາວ • ELECTRICITE DU LAOS'],
    [title],
    [subTitle],
    [
      `ວັນທີສ້າງບົດລາຍງານ: ${reportDate}`,
      `ຜູ້ສັງລວມ: ${preparedBy}`,
      `ຈຳນວນເອກະສານ: ${total} ສະບັບ`,
      `ຂອບເຂດຂໍ້ມູນ: ${filterScope}`,
    ],
    [], // Spacer row
    // Column Headers (Row 6)
    [
      'ລ/ດ',
      'ເລກທີເອກະສານ',
      'ຊື່ເອກະສານ',
      'ໝວດໝູ່',
      'ທິດທາງ',
      'ຝ່າຍ / ສາຍງານ',
      'ພະແນກ / ສູນ',
      'ສະຖານະເອກະສານ',
      'ສະຖານະບ່ອນເກັບ',
      'ສາງ / ຄັງເກັບ',
      'ຕູ້ເອກະສານ',
      'ຊັ້ນວາງ / ແຟ້ມ',
      'ວັນທີອັບໂຫຼດ',
      'ວັນທີໝົດອາຍຸ',
      'ຂະໜາດໄຟລ໌',
      'ຜູ້ອັບໂຫຼດ',
    ],
  ];

  // Helper for cabinet name lookup
  const getCabinetName = (doc: Document) => {
    if (doc.cabinetName) return doc.cabinetName;
    if (doc.cabinetId) {
      const found = cabinets.find((c) => c.id === doc.cabinetId);
      if (found) return found.name;
    }
    return '-';
  };

  const getStorageStatus = (doc: Document) => {
    if (doc.folderId || doc.cabinetId || doc.warehouseId) return 'ມີບ່ອນເກັບແລ້ວ';
    return 'ຍັງບໍ່ມີບ່ອນເກັບ (ຄ້າງຈັດເກັບ)';
  };

  const getFolderOrShelf = (doc: Document) => {
    const parts: string[] = [];
    if (doc.shelfName) parts.push(`ຊັ້ນ: ${doc.shelfName}`);
    if (doc.folderName) parts.push(`ແຟ້ມ: ${doc.folderName}`);
    return parts.length > 0 ? parts.join(' | ') : '-';
  };

  // Populate data rows
  documents.forEach((doc, idx) => {
    sheet1Data.push([
      idx + 1,
      doc.docNumber || '-',
      doc.title || '-',
      doc.category || '-',
      getDirectionLabel(doc.direction),
      doc.division || '-',
      doc.department || '-',
      getStatusLabel(doc.status),
      getStorageStatus(doc),
      doc.warehouseName || '-',
      getCabinetName(doc),
      getFolderOrShelf(doc),
      doc.uploadDate || '-',
      doc.expiresAt || 'ບໍ່ມີກຳນົດ',
      doc.fileSize || '-',
      doc.uploadedBy || '-',
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Auto-calculate column widths
  const headers = sheet1Data[5] as string[];
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header ? header.length * 1.5 : 10;
    for (let r = 5; r < sheet1Data.length; r++) {
      const val = sheet1Data[r]?.[colIdx];
      if (val !== undefined && val !== null) {
        const strLen = String(val).length;
        if (strLen > maxLen) maxLen = strLen;
      }
    }
    // Min 10, Max 60
    return { wch: Math.min(Math.max(Math.round(maxLen) + 3, 11), 60) };
  });

  ws1['!cols'] = colWidths;

  // ---------------------------------------------------------------------------
  // SHEET 2: SUMMARY & KPI BREAKDOWN
  // ---------------------------------------------------------------------------
  const approvedCount = documents.filter((d) => d.status === 'approved').length;
  const pendingCount = documents.filter((d) => d.status === 'pending').length;
  const draftCount = documents.filter((d) => d.status === 'draft').length;
  const expiredCount = documents.filter((d) => d.status === 'expired').length;
  const archivedCount = documents.filter((d) => d.status === 'archived').length;

  const inboundCount = documents.filter((d) => d.direction === 'inbound').length;
  const outboundCount = documents.filter((d) => d.direction === 'outbound').length;
  const internalCount = total - inboundCount - outboundCount;

  const assignedCount = documents.filter((d) => d.cabinetId || d.folderId || d.warehouseId).length;
  const unassignedCount = total - assignedCount;

  // Category counts
  const catMap = new Map<string, number>();
  documents.forEach((d) => {
    const c = d.category || 'ບໍ່ໄດ້ລະບຸ';
    catMap.set(c, (catMap.get(c) || 0) + 1);
  });
  const catEntries = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);

  // Division counts
  const divMap = new Map<string, number>();
  documents.forEach((d) => {
    const div = d.division || 'ສູນກາງ / ທົ່ວໄປ';
    divMap.set(div, (divMap.get(div) || 0) + 1);
  });
  const divEntries = Array.from(divMap.entries()).sort((a, b) => b[1] - a[1]);

  // Department counts
  const deptMap = new Map<string, number>();
  documents.forEach((d) => {
    const dept = d.department || 'ບໍ່ໄດ້ລະບຸພະແນກ';
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
  });
  const deptEntries = Array.from(deptMap.entries()).sort((a, b) => b[1] - a[1]);

  const calcPct = (num: number) => (total > 0 ? `${Math.round((num / total) * 100)}%` : '0%');

  const sheet2Data: (string | number)[][] = [
    ['ລັດວິສາຫະກິດໄຟຟ້າລາວ • ELECTRICITE DU LAOS (EDL)'],
    ['ບົດສະຫຼຸບສະຖິຕິ ແລະ ຕົວຊີ້ວັດເອກະສານ (Executive Summary & KPIs)'],
    [`ວັນທີປະມວນຜົນ: ${reportDate}`, `ຈຳນວນເອກະສານລວມ: ${total} ສະບັບ`],
    [],
    // Section 1: Status
    ['📊 1. ສະຫຼຸບຕາມສະຖານະເອກະສານ', 'ຈຳນວນ (ສະບັບ)', 'ສັດສ່ວນ (%)'],
    ['ອະນຸມັດແລ້ວ (Approved)', approvedCount, calcPct(approvedCount)],
    ['ລໍຖ້າອະນຸມັດ (Pending)', pendingCount, calcPct(pendingCount)],
    ['ສະບັບຮ່າງ (Draft)', draftCount, calcPct(draftCount)],
    ['ໝົດອາຍຸ (Expired)', expiredCount, calcPct(expiredCount)],
    ['ເກັບເຂົ້າຄັງແລ້ວ (Archived)', archivedCount, calcPct(archivedCount)],
    ['ລວມທັງໝົດ', total, '100%'],
    [],
    // Section 2: Flow Direction
    ['🔄 2. ສະຫຼຸບຕາມທິດທາງເອກະສານ (Flow)', 'ຈຳນວນ (ສະບັບ)', 'ສັດສ່ວນ (%)'],
    ['ເອກະສານຂາເຂົ້າ (Inbound)', inboundCount, calcPct(inboundCount)],
    ['ເອກະສານຂາອອກ (Outbound)', outboundCount, calcPct(outboundCount)],
    ['ເອກະສານພາຍໃນ (Internal)', internalCount, calcPct(internalCount)],
    ['ລວມທັງໝົດ', total, '100%'],
    [],
    // Section 3: Archive Storage Status
    ['🏛️ 3. ສະຖານະການຈັດເກັບໃນຄັງ DMS', 'ຈຳນວນ (ສະບັບ)', 'ສັດສ່ວນ (%)'],
    ['ກຳນົດບ່ອນເກັບແລ້ວ (Assigned)', assignedCount, calcPct(assignedCount)],
    ['ຍັງບໍ່ມີບ່ອນເກັບ (Unassigned / ຄ້າງຈັດເກັບ)', unassignedCount, calcPct(unassignedCount)],
    ['ລວມທັງໝົດ', total, '100%'],
    [],
    // Section 4: By Category
    ['📑 4. ສະຫຼຸບຕາມໝວດໝູ່ເອກະສານ', 'ຈຳນວນ (ສະບັບ)', 'ສັດສ່ວນ (%)'],
    ...catEntries.map(([cat, count]) => [cat, count, calcPct(count)]),
    [],
    // Section 5: By Division
    ['🏢 5. ສະຫຼຸບຕາມຝ່າຍ / ສາຍງານ', 'ຈຳນວນ (ສະບັບ)', 'ສັດສ່ວນ (%)'],
    ...divEntries.map(([div, count]) => [div, count, calcPct(count)]),
    [],
    // Section 6: By Department
    ['👥 6. ສະຫຼຸບຕາມພະແນກ / ສູນ', 'ຈຳນວນ (ສະບັບ)', 'ສັດສ່ວນ (%)'],
    ...deptEntries.map(([dept, count]) => [dept, count, calcPct(count)]),
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [{ wch: 45 }, { wch: 18 }, { wch: 16 }];

  // ---------------------------------------------------------------------------
  // CREATE WORKBOOK & TRIGGER DOWNLOAD
  // ---------------------------------------------------------------------------
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, ws1, 'ລາຍການເອກະສານ (Documents)');
  XLSX.utils.book_append_sheet(workbook, ws2, 'ສະຫຼຸບສະຖິຕິ (KPI Summary)');

  const cleanTitle = (title || 'DMS_Report').replace(/[\s/\\?%*:|"<>]+/g, '_');
  const dateStr = now.toISOString().slice(0, 10);
  const fileName = `EDL_DMS_${cleanTitle}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
