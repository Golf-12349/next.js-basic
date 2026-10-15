'use client'

import { Suspense } from 'react'
import { DocumentsView } from '@/app/components/documents/DocumentsView'

export default function UploadHistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">ກຳລັງໂຫຼດປະຫວັດການອັບໂຫຼດ...</div>}>
      <DocumentsView
        initialScope="mine"
        pageTitle="ປະຫວັດການອັບໂຫຼດເອກະສານ"
        pageDescription="ຕິດຕາມ ແລະ ກວດສອບລາຍການເອກະສານທີ່ມີການອັບໂຫຼດເຂົ້າສູ່ລະບົບ"
      />
    </Suspense>
  )
}