import { redirect } from 'next/navigation'

/**
 * ໜ້າ "ລາຍງານ & ສະຖິຕິ" ຖືກລວມເຂົ້າກັບໜ້າຫຼັກແລ້ວ
 * ດັ່ງນັ້ນ URL ເກົ່າ /reports ຈະຖືກສົ່ງຕໍ່ໄປ /dashboard ອັດຕະໂນມັດ
 */
export default function ReportsRedirectPage() {
  redirect('/dashboard')
}
