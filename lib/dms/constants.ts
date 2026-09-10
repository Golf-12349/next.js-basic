import type { DocumentDirection } from '@/types/document'

/**
 * ປະເພດເອກະສານ (categories) — Single source of truth
 *
 * ໝາຍເຫດ: ຕັດ ຂາເຂົ້າ/ຂາອອກ (ທິດທາງ) ອອກຈາກໝວດໝູ່ແລ້ວ ເພື່ອບໍ່ໃຫ້ປົນ 2 ມິຕິ — ທິດທາງ
 * ຍ້າຍໄປໃຊ້ field `direction` (inbound/outbound) ແຍກຕ່າງຫາກ ແລະ ລວມເອົາ
 * ປະເພດເອກະສານເກົ່າ (documentType) ເຂົ້າມາເປັນໝວດໝູ່ເລີຍ ເພື່ອບໍ່ໃຫ້ taxonomy ຊ້ຳຊ້ອນ
 */
export const DEFAULT_CATEGORIES = [
  'ເອກະສານການເງິນ',
  'ແຈ້ງການ / ປະກາດ',
  'ສັນຍາ & ຂໍ້ຕົກລົງ',
  'ບົດລາຍງານ',
  'ຄຳສັ່ງ / ມະຕິ',
  'ອື່ນໆ',
]

/** ປ້າຍກຳກັບສຳລັບເອກະສານທີ່ຍັງບໍ່ມີໝວດໝູ່ (categoryId ວ່າງ) */
export const UNCATEGORIZED_LABEL = 'ບໍ່ລະບຸ'

/** ທິດທາງເອກະສານ (ຂາເຂົ້າ / ຂາອອກ) — ແຍກຈາກໝວດໝູ່ ເພື່ອຮອງຮັບເອກະສານທີ່ເປັນທັງຂາເຂົ້າ ແລະ ເປັນສັນຍາພ້ອມກັນ */
export const DOCUMENT_DIRECTIONS: { value: DocumentDirection; label: string; emoji: string }[] = [
  { value: 'inbound', label: 'ຂາເຂົ້າ', emoji: '📥' },
  { value: 'outbound', label: 'ຂາອອກ', emoji: '📤' },
]