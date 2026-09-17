'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/Modal'
import { pushToast } from '@/app/components/ui/Toast'
import { edlStructure, type CurrentUser } from '@/types/user'
import type { Document } from '@/types/document'
import { transferDocument } from '@/lib/dms/documentService'

interface TransferDocumentModalProps {
  open: boolean
  doc: Document | null
  currentUser: CurrentUser | null
  onClose: () => void
  onSuccess?: () => void
}

export default function TransferDocumentModal({
  open,
  doc,
  currentUser,
  onClose,
  onSuccess,
}: TransferDocumentModalProps) {
  const isDeptAdmin = currentUser?.role === 'DepartmentAdmin'

  const [toDivision, setToDivision] = useState<string>('')
  const [toDepartment, setToDepartment] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [keepCopy, setKeepCopy] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Initialize or reset form when modal opens or doc changes
  useEffect(() => {
    if (doc && open) {
      const defaultDiv = isDeptAdmin
        ? currentUser?.division || doc.division || Object.keys(edlStructure)[0]
        : doc.division || currentUser?.division || Object.keys(edlStructure)[0]
      setToDivision(defaultDiv)
      setToDepartment('')
      setNote('')
      setKeepCopy(false)
    }
  }, [doc, open, isDeptAdmin, currentUser])

  // Available departments in the chosen division
  const availableDepartments = toDivision ? (edlStructure[toDivision] ?? []) : []

  // Check if cross-division
  const isCrossDivision = doc?.division && toDivision && doc.division.trim().toLowerCase() !== toDivision.trim().toLowerCase()

  if (!open || !doc) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!doc) return

    if (!toDivision.trim()) {
      pushToast({ title: 'ກະລຸນາເລືອກຝ່າຍປາຍທາງ' })
      return
    }

    if (!toDepartment.trim()) {
      pushToast({ title: 'ກະລຸນາເລືອກພະແນກປາຍທາງ' })
      return
    }

    if (
      doc.department &&
      toDepartment.trim().toLowerCase() === doc.department.trim().toLowerCase() &&
      doc.division &&
      toDivision.trim().toLowerCase() === doc.division.trim().toLowerCase()
    ) {
      pushToast({ title: 'ບໍ່ສາມາດສົ່ງໄປຫາພະແນກ ແລະ ຝ່າຍເດີມໄດ້' })
      return
    }

    // RBAC validation: Dept admin cannot send cross-division
    if (isDeptAdmin && isCrossDivision) {
      pushToast({
        title: 'ບໍ່ມີສິດສົ່ງຂ້າມຝ່າຍ',
        description: 'ສະເພາະ Admin ຝ່າຍ ຈຶ່ງສາມາດສົ່ງເອກະສານຂ້າມຝ່າຍໄດ້',
      })
      return
    }

    setSubmitting(true)
    try {
      await transferDocument(doc.id, {
        toDivision,
        toDepartment,
        note: note.trim() || undefined,
        keepCopy,
      })

      pushToast({
        title: 'ສົ່ງເອກະສານສຳເລັດ',
        description: keepCopy
          ? `ສົ່ງເອກະສານແລ້ວ (ພ້ອມເກັບສຳເນົາໄວ້ກັບພະແນກເຮົາ) ແລະ ກຳລັງລໍຖ້າການອະນຸມັດຈາກ ${isCrossDivision ? 'Admin ຝ່າຍ ' + toDivision : 'Admin ພະແນກ ' + toDepartment}`
          : `ເອກະສານກຳລັງລໍຖ້າການອະນຸມັດຈາກ ${isCrossDivision ? 'Admin ຝ່າຍ ' + toDivision : 'Admin ພະແນກ ' + toDepartment}`,
      })
      onClose()
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ເກີດຂໍ້ຜິດພາດໃນການສົ່ງເອກະສານ'
      pushToast({
        title: 'ບໍ່ສາມາດສົ່ງເອກະສານໄດ້',
        description: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || msg,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🔄 ສົ່ງເອກະສານຂ້າມພະແນກ"
      scrollBody={true}
      footer={
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !toDepartment}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>ກຳລັງສົ່ງ...</span>
              </>
            ) : (
              <span>{keepCopy ? 'ຢືນຢັນການສົ່ງ (ເກັບສຳເນົາໄວ້)' : 'ຢືນຢັນການສົ່ງ'}</span>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document summary box */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-500">ເອກະສານທີ່ຕ້ອງການສົ່ງ</div>
          <div className="mt-1 text-base font-semibold text-gray-900">{doc.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
            <span>ເລກທີ: <strong className="text-gray-800">{doc.docNumber}</strong></span>
            <span>ຝ່າຍປະຈຸບັນ: <strong className="text-gray-800">{doc.division || 'ບໍ່ລະບຸ'}</strong></span>
            <span>ພະແນກປະຈຸບັນ: <strong className="text-gray-800">{doc.department || 'ບໍ່ລະບຸ'}</strong></span>
          </div>
        </div>

        {/* Notice for DeptAdmin */}
        {isDeptAdmin && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            ℹ️ <strong>ໝາຍເຫດສຳລັບ Admin ພະແນກ:</strong> ທ່ານສາມາດສົ່ງເອກະສານໄດ້ສະເພາະພະແນກພາຍໃນຝ່າຍດຽວກັນ ({currentUser?.division || doc.division || 'ຝ່າຍຂອງທ່ານ'}). ຫາກຕ້ອງການສົ່ງຂ້າມຝ່າຍ ກະລຸນາແຈ້ງ Admin ຝ່າຍ ເປັນຜູ້ດຳເນີນການ.
          </div>
        )}

        {/* Workflow indicator badge */}
        {toDepartment && (
          <div className={`rounded-lg border p-3 text-xs ${
            isCrossDivision
              ? 'border-purple-200 bg-purple-50 text-purple-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}>
            {isCrossDivision ? (
              <div>
                🌐 <strong>ການສົ່ງຂ້າມຝ່າຍ:</strong> ເອກະສານຈະຖືກສົ່ງໄປຫາ <strong>Admin ຝ່າຍ ({toDivision})</strong> ເພື່ອລໍຖ້າການກວດສອບ ແລະ ອະນຸມັດຮັບເຂົ້າ.
              </div>
            ) : (
              <div>
                🏢 <strong>ການສົ່ງພາຍໃນຝ່າຍ:</strong> ເອກະສານຈະຖືກສົ່ງໄປຫາ <strong>Admin ພະແນກ ({toDepartment})</strong> ເພື່ອລໍຖ້າການອະນຸມັດຮັບເຂົ້າ.
              </div>
            )}
          </div>
        )}

        {/* Destination Division */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            ຝ່າຍ / ຫ້ອງການ ປາຍທາງ <span className="text-rose-500">*</span>
          </label>
          {isDeptAdmin ? (
            <input
              type="text"
              readOnly
              disabled
              value={toDivision}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 cursor-not-allowed"
            />
          ) : (
            <select
              value={toDivision}
              onChange={(e) => {
                setToDivision(e.target.value)
                setToDepartment('')
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">— ເລືອກຝ່າຍປາຍທາງ —</option>
              {Object.keys(edlStructure).map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Destination Department */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            ພະແນກ / ສູນ ປາຍທາງ <span className="text-rose-500">*</span>
          </label>
          <select
            value={toDepartment}
            onChange={(e) => setToDepartment(e.target.value)}
            disabled={!toDivision}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">— ເລືອກພະແນກປາຍທາງ —</option>
            {availableDepartments.map((dept) => {
              const isCurrent = Boolean(
                doc.department &&
                dept.trim().toLowerCase() === doc.department.trim().toLowerCase() &&
                !isCrossDivision
              )
              return (
                <option key={dept} value={dept} disabled={isCurrent}>
                  {dept} {isCurrent ? '(ພະແນກປະຈຸບັນ)' : ''}
                </option>
              )
            })}
          </select>
        </div>

        {/* Transfer Note */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            ໝາຍເຫດ / ເຫດຜົນການສົ່ງ
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ລະບຸລາຍລະອຽດ ຫຼື ຈຸດປະສົງການສົ່ງຕໍ່ເອກະສານ..."
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Keep copy option */}
        <div className={`rounded-xl border p-3.5 transition ${
          keepCopy
            ? 'border-indigo-300 bg-indigo-50/70 shadow-sm'
            : 'border-gray-200 bg-gray-50/60 hover:bg-gray-50'
        }`}>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepCopy}
              onChange={(e) => setKeepCopy(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="text-xs">
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                <span>📑 ເກັບສຳເນົາເອກະສານໄວ້ກັບເຮົາ (Keep a copy)</span>
                {keepCopy && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                    ເປີດໃຊ້ງານ
                  </span>
                )}
              </div>
              <p className="mt-1 text-gray-600 leading-relaxed">
                ຫາກເລືອກຕົວເລືອກນີ້, ເມື່ອປາຍທາງອະນຸມັດຮັບເອກະສານ, ລະບົບຈະຮັກສາສຳເນົາເອກະສານຊຸດນີ້ໄວ້ໃນພະແນກ ແລະ ຕູ້ເດີມຂອງທ່ານ (ເອກະສານຈະບໍ່ຫາຍໄປຈາກພະແນກ).
              </p>
            </div>
          </label>
        </div>
      </form>
    </Modal>
  )
}

