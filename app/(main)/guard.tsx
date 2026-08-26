'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import secureLocalStorage from 'react-secure-storage'
import { pushToast } from '@/app/components/ui/Toast'
import type { UserRole } from '@/types/user'

type Props = {
  children: React.ReactNode
}

export default function Guard({ children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    try {
      const token = secureLocalStorage.getItem('token')
      const stored = secureLocalStorage.getItem('data')

      if (!token) {
        setAuthorized(false)
        router.replace('/')
        return
      }

      let role: UserRole | undefined
      if (stored) {
        const parsed = (typeof stored === 'string' ? JSON.parse(stored) : stored) as { role?: UserRole }
        role = parsed?.role
      }

      // Check access to /users route
      if (pathname === '/users' || pathname.startsWith('/users/')) {
        if (role === 'User') {
          pushToast({ title: 'ສະເພາະ Admin ເທົ່ານັ້ນທີ່ມີສິດເຂົ້າເຖິງໜ້ານີ້' })
          router.replace('/dashboard')
          return
        }
      }

      setAuthorized(true)
    } catch (err) {
      console.error('Guard auth check error:', err)
      setAuthorized(true)
    }
  }, [pathname, router])

  if (!authorized && (pathname === '/users' || pathname.startsWith('/users/'))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-white">
      {children}
    </div>
  )
}