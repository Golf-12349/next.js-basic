"use client"
import React, { useEffect, useState } from 'react'

export type ToastMessage = { id: string; title: string; description?: string }

let listeners: ((toasts: ToastMessage[]) => void)[] = []
let toasts: ToastMessage[] = []

export function pushToast(t: Omit<ToastMessage, 'id'>) {
  const id = Math.random().toString(36).slice(2, 9)
  const msg = { id, ...t }
  toasts = [msg, ...toasts]
  listeners.forEach((l) => l(toasts))
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== id)
    listeners.forEach((l) => l(toasts))
  }, 3500)
}

export default function ToastContainer() {
  const [local, setLocal] = useState<ToastMessage[]>([])
  useEffect(() => {
    const l = (t: ToastMessage[]) => setLocal(t)
    listeners.push(l)
    return () => { listeners = listeners.filter((x) => x !== l) }
  }, [])

  if (local.length === 0) return null
  return (
    <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-3">
      {local.map((t) => (
        <div key={t.id} className="bg-white border rounded-lg px-4 py-3 shadow-md w-80">
          <div className="font-semibold">{t.title}</div>
          {t.description && <div className="text-sm text-black/60">{t.description}</div>}
        </div>
      ))}
    </div>
  )
}
