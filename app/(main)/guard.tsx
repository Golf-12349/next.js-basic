'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
    const validateAccess = async () => {
      await Promise.resolve()

      try {
        const token =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('token') || localStorage.getItem('token')
            : null
        const stored =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('data') || localStorage.getItem('data')
            : null

        if (!token) {
          setAuthorized(false)
          window.location.replace('/')
          return
        }

        let role: UserRole | undefined
        if (stored) {
          const parsed = (typeof stored === 'string' ? JSON.parse(stored) : stored) as { role?: UserRole }
          role = parsed?.role
        }

        // Check access to /users route
        if (pathname === '/users' || pathname.startsWith('/users/')) {
          if (role === 'User' || role === 'Staff') {
            pushToast({ title: 'ສະເພາະ Admin ເທົ່ານັ້ນທີ່ມີສິດເຂົ້າເຖິງໜ້ານີ້' })
            setAuthorized(false)
            router.replace('/dashboard')
            return
          }
        }

        setAuthorized(true)
      } catch (err) {
        console.error('Guard auth check error:', err)
        setAuthorized(false)
        window.location.replace('/')
      }
    }

    void validateAccess()
  }, [pathname, router])

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload()
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  useEffect(() => {
    if (!authorized) {
      return
    }

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }

    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [authorized])

  if (!authorized) {
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
