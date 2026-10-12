'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TransfersRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/documents/incoming?tab=outgoing')
  }, [router])

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">
      ກຳລັງໂອນຍ້າຍໄປໜ້າເອກະສານຂາເຂົ້າ-ຂາອອກ...
    </div>
  )
}
