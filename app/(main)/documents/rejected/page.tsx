'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RejectedPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/documents/incoming?tab=rejected')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-sm text-gray-500">ກຳລັງໂຫຼດ...</p>
    </div>
  )
}
