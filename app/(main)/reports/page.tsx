'use client'
import { useMemo, useRef } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../context/DocumentsContext'
import { pushToast } from '@/app/components/ui/Toast'

const statusStyles: Record<string, string> = {
  'ອະນຸມັດ': 'bg-emerald-100 text-emerald-700',
  'ລໍຖ້າອະນຸມັດ': 'bg-amber-100 text-amber-700',
  'ເກັບເຂົ້າຄັງ': 'bg-gray-200 text-gray-700',
  'ຮ່າງ': 'bg-slate-100 text-slate-700',
};

const statusLabelMap: Record<string, string> = {
  draft: 'ຮ່າງ',
  pending: 'ລໍຖ້າອະນຸມັດ',
  approved: 'ອະນຸມັດ',
  archived: 'ເກັບເຂົ້າຄັງ',
};

export default function ReportsPage() {
  const { documents, categories: allCategories } = useDocuments()
  const active = useMemo(() => documents.filter((d) => !d.deleted), [documents])

  // ອ້າງອິງເຖິງ Element ທີ່ຈະຖືກພິມ (ຫໍ່ ເນື້ອຫາທັງໝົດຂອງໜ້ານີ້)
  const printRef = useRef<HTMLDivElement>(null)

  const stats = useMemo(() => {
    const total = active.length
    const approved = active.filter((d) => d.status === 'approved').length
    const pending = active.filter((d) => d.status === 'pending').length
    const archived = active.filter((d) => d.status === 'archived').length

    return [
      { label: 'ເອກກະສານທັງໝົດ', value: String(total), tone: 'emerald' },
      { label: 'ເອກກະສານທີ່ອະນຸມັດ', value: String(approved), tone: 'blue' },
      { label: 'ລໍຖ້າອະນຸມັດ', value: String(pending), tone: 'amber' },
      { label: 'ເອກກະສານຄັງເກັບ', value: String(archived), tone: 'violet' },
    ]
  }, [active])

  const categoryData = useMemo(() => {
    const total = active.length || 1
    return allCategories.map((name) => {
      const count = active.filter((d) => d.category === name).length
      return { name, value: Math.round((count / total) * 100), count }
    })
  }, [active])

  const recentEntries = useMemo(() => {
    return [...active]
      .sort((a, b) => (a.uploadDate < b.uploadDate ? 1 : -1))
      .slice(0, 4)
  }, [active])

  // ---------- Export Excel ----------
  // ສ້າງໄຟລ໌ .xlsx ຈິງ ຈາກ documents[] ໃນ Context ແລ້ວດາວໂຫຼດອັດຕະໂນມັດ
  async function handleExportExcel() {
    const XLSX = await import('xlsx')
    if (active.length === 0) {
      pushToast({ title: 'ບໍ່ມີຂໍ້ມູນໃຫ້ສົ່ງອອກ' })
      return
    }

    // ປ່ຽນ documents[] ໃຫ້ເປັນຮູບແບບແຖວ/ຄໍລຳ (Rows) ພ້ອມຫົວຂໍ້ພາສາລາວ
    const rows = active.map((d) => ({
      'ຊື່ເອກກະສານ': d.title,
      'ເລກທີ': d.docNumber,
      'ໝວດໝູ່': d.category,
      'ສະຖານະ': statusLabelMap[d.status],
      'ວັນທີອັບໂຫຼດ': d.uploadDate,
      'ຜູ້ອັບໂຫຼດ': d.uploadedBy,
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ລາຍງານ')

    // ຕັ້ງຄວາມກວ້າງຄໍລຳໃຫ້ອ່ານງ່າຍ
    worksheet['!cols'] = [
      { wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
    ]

    const fileName = `dms-report-${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(workbook, fileName)
    pushToast({ title: 'ສົ່ງອອກ Excel ສຳເລັດ' })
  }

  // ---------- Print ----------
  // ໃຊ້ window.print() ຂອງ Browser + CSS ໃນ globals.css ໃຫ້ພິມສະເພາະ #print-area
  function handlePrint() {
    window.print()
  }

  return (
    <DashboardLayout title="ລາຍງານ & ສະຖິຕິ">
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div id="print-area" ref={printRef} className="space-y-6">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-gray-900">ລາຍງານ & ສະຖິຕິ</h1>
            <p className="mt-1 text-sm text-gray-500">ຂໍ້ມູນການໃຊ້ງານເອກະສານຂອງລະບົບ (ຄິດໄລ່ຈາກຂໍ້ມູນປັດຈຸບັນ)</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-sm text-gray-500">{stat.label}</div>
                <div className="mt-4 text-3xl font-bold text-gray-900">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-gray-900">ການແຜ່ຂະຫຍາຍເອກກະສານຕາມໝວດໝູ່</h2>
              <div className="space-y-4">
                {categoryData.map((item) => (
                  <div key={item.name}>
                    <div className="mb-1 flex items-center justify-between text-sm text-gray-700">
                      <span>{item.name}</span>
                      <span>{item.count} ({item.value}%)</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100">
                      <div className="h-2.5 rounded-full bg-indigo-500" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-gray-900">ລາຍການເຂົ້າໃໝ່</h2>
              <div className="space-y-3">
                {recentEntries.length === 0 ? (
                  <div className="text-sm text-gray-400">ຍັງບໍ່ມີເອກະສານ</div>
                ) : (
                  recentEntries.map((entry) => (
                    <div key={entry.id} className="rounded-2xl bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-4 text-sm text-gray-700">
                        <div>
                          <p className="font-semibold text-gray-900">{entry.title}</p>
                          <p className="text-xs text-gray-500">{entry.category} • {entry.uploadDate}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[statusLabelMap[entry.status]]}`}>
                          {statusLabelMap[entry.status]}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section ນີ້ຢູ່ນອກ #print-area ໂດຍຕັ້ງໃຈ ຈະບໍ່ຖືກພິມອອກ (ບໍ່ຈຳເປັນຕ້ອງມີປຸ່ມຢູ່ໃນເອກະສານທີ່ພິມແລ້ວ) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm print:hidden">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">ຕົວເລືອກສ່ວນປະກອບ</h2>
              <p className="mt-1 text-sm text-gray-500">ສົ່ງອອກ ຫຼື ພິມລາຍງານ</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleExportExcel} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Export Excel
              </button>
              <button onClick={handlePrint} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Print
              </button>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}