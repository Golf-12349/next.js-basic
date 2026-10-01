'use client'

import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useDocuments } from '../../context/DocumentsContext'
import { pushToast } from '@/app/components/ui/Toast'
import { Tag } from 'lucide-react'
import {
  AddButton,
  AddInput,
  ConfirmDeleteModal,
  CountPill,
  DeleteButton,
  MasterCard,
  MasterDataHeader,
  MasterTable,
  RowActions,
  Th,
} from '@/app/components/master-data/MasterDataUI'

export default function MasterDataCategoriesPage() {
  const { categories, addCategory, removeCategory, documents } = useDocuments()

  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null)

  // ນັບຈຳນວນເອກະສານທີ່ໃຊ້ແຕ່ລະໝວດໝູ່
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of documents) {
      if (!d.deleted && d.category) {
        counts.set(d.category, (counts.get(d.category) || 0) + 1)
      }
    }
    return counts
  }, [documents])

  async function handleAddCategory() {
    const trimmed = newCatName.trim()
    if (!trimmed || addingCat) return
    setAddingCat(true)
    const ok = await addCategory(trimmed)
    setAddingCat(false)
    if (ok) {
      pushToast({ title: 'ເພີ່ມໝວດໝູ່ເອກະສານສຳເລັດ' })
      setNewCatName('')
    } else {
      pushToast({ title: 'ບໍ່ສາມາດເພີ່ມໝວດໝູ່ໄດ້ (ອາດມີຊື່ນີ້ແລ້ວ)' })
    }
  }

  async function handleConfirmDeleteCategory() {
    if (!deletingCategory) return
    const docCount = categoryCounts.get(deletingCategory) || 0
    if (docCount > 0) {
      pushToast({
        title: 'ບໍ່ສາມາດລຶບໝວດໝູ່ນີ້ໄດ້',
        description: `ຍັງມີ ${docCount} ເອກະສານກຳລັງໃຊ້ງານໝວດໝູ່ນີ້ຢູ່`,
      })
      setDeletingCategory(null)
      return
    }
    const ok = await removeCategory(deletingCategory)
    if (ok) {
      pushToast({ title: 'ລຶບໝວດໝູ່ສຳເລັດແລ້ວ' })
    } else {
      pushToast({ title: 'ບໍ່ສາມາດລຶບໝວດໝູ່ໄດ້' })
    }
    setDeletingCategory(null)
  }

  return (
    <DashboardLayout title="ປະເພດ / ໝວດໝູ່ເອກະສານ">
      <div className="w-full min-w-0 space-y-4 p-3 sm:p-4 lg:p-5">
        <MasterDataHeader
          icon={<Tag className="h-6 w-6" />}
          title="ປະເພດ / ໝວດໝູ່ເອກະສານ"
          subtitle={`ກຳນົດ ແລະ ຈັດການໝວດໝູ່ເອກະສານທັງໝົດ ${categories.length} ໝວດໝູ່`}
        />

        {/* ຟອມເພີ່ມໝວດໝູ່ໃໝ່ */}
        <MasterCard>
          <div className="flex flex-col gap-2 sm:flex-row">
            <AddInput
              icon={<Tag className="h-4 w-4" />}
              value={newCatName}
              onChange={setNewCatName}
              onSubmit={() => void handleAddCategory()}
              placeholder="ປ້ອນຊື່ໝວດໝູ່ເອກະສານໃໝ່ (ເຊັ່ນ: ເອກະສານການເງິນ, ສັນຍາ, ແຈ້ງການ...)"
            />
            <AddButton
              label="ເພີ່ມໝວດໝູ່"
              onClick={() => void handleAddCategory()}
              disabled={!newCatName.trim()}
              busy={addingCat}
            />
          </div>
        </MasterCard>

        {/* ຕາຕະລາງໝວດໝູ່ */}
        <MasterTable
          head={
            <>
              <Th>ຊື່ໝວດໝູ່</Th>
              <Th>ຈຳນວນເອກະສານທີ່ໃຊ້</Th>
              <Th align="right">ການກະທຳ</Th>
            </>
          }
        >
          {categories.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-5 py-12 text-center text-sm text-slate-400">
                ຍັງບໍ່ມີໝວດໝູ່ເອກະສານໃນລະບົບ
              </td>
            </tr>
          ) : (
            categories.map((category) => (
              <tr key={category} className="transition hover:bg-slate-50/60">
                <td className="px-5 py-3.5">
                  <span className="font-semibold text-slate-800">🏷️ {category}</span>
                </td>
                <td className="px-5 py-3.5">
                  <CountPill>{categoryCounts.get(category) || 0} ເອກະສານ</CountPill>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <RowActions>
                    <DeleteButton onClick={() => setDeletingCategory(category)} />
                  </RowActions>
                </td>
              </tr>
            ))
          )}
        </MasterTable>

        <ConfirmDeleteModal
          open={!!deletingCategory}
          title="ຢືນຢັນການລຶບໝວດໝູ່"
          onClose={() => setDeletingCategory(null)}
          onConfirm={() => void handleConfirmDeleteCategory()}
        >
          {deletingCategory && (
            <>
              ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໝວດໝູ່ &ldquo;<strong>{deletingCategory}</strong>&rdquo;?
            </>
          )}
        </ConfirmDeleteModal>
      </div>
    </DashboardLayout>
  )
}
