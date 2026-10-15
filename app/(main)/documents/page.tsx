'use client'

import { Suspense } from 'react'
import { DocumentsView } from '@/app/components/documents/DocumentsView'

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">ກຳລັງໂຫຼດເອກະສານ...</div>}>
      <DocumentsView
        initialScope="all"
        pageTitle="ເອກະສານທັງໝົດ"
        pageDescription="ລະບົບບໍລິຫານ, ຕິດຕາມ ແລະ ຈັດການເອກະສານທັງໝົດໃນລະບົບ DMS"
      />
    </Suspense>
  )
}