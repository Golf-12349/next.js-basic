'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import type { Document } from '@/types/document'
import { renewDocumentExpiry } from '@/lib/dms/documentService'
import { pushToast } from '@/app/components/ui/Toast'

interface RenewExpiryModalProps {
  document: Document | null
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addMonths(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return formatDate(d)
}

function addYears(years: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + years)
  return formatDate(d)
}

export default function RenewExpiryModal({
  document,
  open,
  onClose,
  onSuccess,
}: RenewExpiryModalProps) {
  const [newExpiryDate, setNewExpiryDate] = useState<string>(() => addYears(1))
  const [note, setNote] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setNewExpiryDate(addYears(1))
      setNote('')
      setError(null)
    }
  }, [open])

  if (!open || !document) return null

  const isExpired = document.status === 'expired' || (Boolean(document.expiresAt) && (document.expiresAt ?? '') < formatDate(new Date()))

  async function handleRenew(e: React.FormEvent) {
    e.preventDefault()
    if (!document) return
    if (!newExpiryDate) {
      setError('ກະລຸນາເລືອກວັນທີໝົດອາຍຸໃໝ່')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await renewDocumentExpiry(document.id, {
        expiresAt: new Date(newExpiryDate).toISOString(),
        note: note.trim() || undefined,
      })

      pushToast({
        title: 'ຕໍ່ອາຍຸເອກະສານສຳເລັດ',
        description: `ເອກະສານໄດ້ຮັບການຕໍ່ອາຍຸຮອດ ${newExpiryDate}`,
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'ບໍ່ສາມາດຕໍ່ອາຍຸເອກະສານໄດ້ ກະລຸນາລອງໃໝ່'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-indigo-50/70 to-blue-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">ຕໍ່ອາຍຸເອກະສານ</h2>
              <p className="text-xs text-gray-500">ກຳນົດວັນທີໝົດອາຍຸ ແລະ ເປີດໃຊ້ງານເອກະສານໃໝ່</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleRenew} className="p-6 space-y-5">
          {/* Document Summary */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/60 text-sm">
            <div className="font-semibold text-gray-900 line-clamp-1">{document.title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>ເລກທີ: <strong className="text-gray-700">{document.docNumber}</strong></span>
              <span>•</span>
              <span>
                ສະຖານະ: 
                <span className={`ml-1 font-semibold ${isExpired ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isExpired ? '🔴 ໝົດອາຍຸແລ້ວ' : '🟢 ໃຊ້ງານຢູ່'}
                </span>
              </span>
            </div>
            {document.expiresAt && (
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-700 font-medium bg-amber-50 rounded-lg px-2.5 py-1 w-fit border border-amber-200/50">
                <Clock className="h-3.5 w-3.5" />
                ວັນໝົດອາຍຸເດີມ: {document.expiresAt}
              </div>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              ເລືອກກຳນົດເວລາຕໍ່ອາຍຸດ່ວນ
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '+6 ເດືອນ', date: addMonths(6) },
                { label: '+1 ປີ', date: addYears(1) },
                { label: '+2 ປີ', date: addYears(2) },
                { label: '+3 ປີ', date: addYears(3) },
              ].map((preset) => {
                const active = newExpiryDate === preset.date
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setNewExpiryDate(preset.date)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      active
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/20'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ວັນທີໝົດອາຍຸໃໝ່ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={newExpiryDate}
                min={formatDate(new Date())}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ເຫດຜົນການຕໍ່ອາຍຸ / ໝາຍເຫດ (ເລືອກໄດ້)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ເຊັ່ນ: ຕໍ່ສັນຍາປະຈຳປີ 2027, ໄດ້ຮັບການອະນຸມັດຈາກຫົວໜ້າ..."
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  ກຳລັງບັນທຶກ...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  ຢືນຢັນການຕໍ່ອາຍຸ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
