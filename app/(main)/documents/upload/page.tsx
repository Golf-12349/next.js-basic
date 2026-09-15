import { redirect } from 'next/navigation'

// ໜ້າ `ອັບໂຫຼດເອກະສານ` ເກົ່າ ຖືກປ່ຽນ → modal ຢູ່ `/documents` (UploadDocumentModal).
// ລົດ redirect ນີ້ຖືກຮັກສາໄວ້ ເພື່ອໃຫ້ ບຸກມາກ/ລິ້ງ ເກົ່າບໍ່ກໍ່ 404 — ເຂົາເຖິງກັບ modal ເປີດອັດຕະໂນມັດ (ພາກ `upload=open`).
export default function UploadRedirectPage() {
  redirect('/documents?upload=open')
}
