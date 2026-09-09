/**
 * ໝວດໝູ່ເລີ່ມຕົ້ນຂອງ DMS — Single source of truth
 *
 * ໃຊ້ຮ່ວມກັນໃນທຸກໜ້າ (upload / documents / trash / pending) ເພື່ອບໍ່ໃຫ້ list hardcode
 * ກະຈັດກະຈາຍຢູ່ຫຼາຍໄຟລ໌ ແລະ ບໍ່ສອດຄ່ອງກັນ
 *
 * ໝາຍເຫດ: ລາຍການເຫຼົ່ານີ້ຈະຖືກ auto-seed ລົງຕາຕະລາງ categories ຝັ່ງ backend
 * ເມື່ອຕາຕະລາງຍັງວ່າງ (ເບິ່ງ DocumentsContext.reload) — ຈຶ່ງຮັບປະກັນວ່າໝວດໝູ່
 * ທີ່ຜູ້ໃຊ້ເລືອກຕອນອັບໂຫຼດ ຈະມີ categoryId ຕິດກັບເອກະສານສະເໝີ
 */
export const DEFAULT_CATEGORIES = [
  'ຂາເຂົ້າ',
  'ຂາອອກ',
  'ຄຳສັ່ງ',
  'ແຈ້ງການ',
  'ສັນຍາ',
  'ລາຍງານ',
  'ທົ່ວໄປ',
]

/** ປ້າຍກຳກັບສຳລັບເອກະສານທີ່ຍັງບໍ່ມີໝວດໝູ່ (categoryId ວ່າງ) */
export const UNCATEGORIZED_LABEL = 'ບໍ່ລະບຸ'