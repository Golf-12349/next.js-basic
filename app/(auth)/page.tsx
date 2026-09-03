'use client'

import { useEffect, useState } from 'react'
import LoginForm from '../components/login/login-form'

export default function Home() {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    try {
      const token =
        typeof window !== 'undefined' ? sessionStorage.getItem('token') : null

      if (token) {
        window.location.replace('/dashboard')
        return
      }
    } catch (err) {
      console.error('Guest guard check error:', err)
    }

    const timeoutId = window.setTimeout(() => setChecked(true), 0)
    return () => window.clearTimeout(timeoutId)
  }, [])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <main className="w-full min-h-screen m-0 p-0">
      <LoginForm />
    </main>
  )
}
