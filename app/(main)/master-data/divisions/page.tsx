'use client'

import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useUsers } from '../../context/UsersContext'
import { useArchive } from '../../context/ArchiveContext'
import { useMasterData } from '../../context/MasterDataContext'
import { pushToast } from '@/app/components/ui/Toast'
import { Building2 } from 'lucide-react'
import {
  AddButton,
  AddInput,
  ConfirmDeleteModal,
  DeleteButton,
  EditButton,
  IndigoPill,
  MasterCard,
  MasterDataHeader,
  MasterTable,
  RenameModal,
  ResetDefaultsButton,
  RowActions,
  Th,
} from '@/app/components/master-data/MasterDataUI'

export default function MasterDataDivisionsPage() {
  const { users } = useUsers()
  const { cabinets } = useArchive()
  const {
    divisions,
    departmentsByDivision,
    addDivision,
    updateDivision,
    deleteDivision,
    resetToDefaults,
  } = useMasterData()

  const [newDivName, setNewDivName] = useState('')
  const [editingDivision, setEditingDivision] = useState<string | null>(null)
  const [editDivName, setEditDivName] = useState('')
  const [deletingDivision, setDeletingDivision] = useState<string | null>(null)

  // ນັບພະແນກ / ຕູ້ເອກະສານ / ຜູ້ໃຊ້ງານ ພາຍໃນແຕ່ລະຝ່າຍ
  const divisionStats = useMemo(() => {
    const map = new Map<string, { departments: number; cabinets: number; users: number }>()
    for (const div of divisions) {
      const depts = departmentsByDivision[div] || []
      const cabCount = cabinets.filter((c) => c.division === div).length
      const userCount = users.filter((u) => u.division === div).length
      map.set(div, { departments: depts.length, cabinets: cabCount, users: userCount })
    }
    return map
  }, [divisions, departmentsByDivision, cabinets, users])

  function handleAddDivision() {
    const res = addDivision(newDivName)
    if (res.success) {
      pushToast({ title: 'ເພີ່ມຝ່າຍໃໝ່ສຳເລັດ' })
      setNewDivName('')
    } else {
      pushToast({ title: res.message || 'ບໍ່ສາມາດເພີ່ມຝ່າຍໄດ້' })
    }
  }

  function handleUpdateDivision() {
    if (!editingDivision) return
    const res = updateDivision(editingDivision, editDivName)
    if (res.success) {
      pushToast({ title: 'ແກ້ໄຂຊື່ຝ່າຍສຳເລັດແລ້ວ' })
      setEditingDivision(null)
    } else {
      pushToast({ title: res.message || 'ບໍ່ສາມາດແກ້ໄຂໄດ້' })
    }
  }

  function handleDeleteDivision() {
    if (!deletingDivision) return
    const res = deleteDivision(deletingDivision)
    if (res.success) {
      pushToast({ title: 'ລຶບຝ່າຍສຳເລັດແລ້ວ' })
      setDeletingDivision(null)
    } else {
      pushToast({ title: res.message || 'ບໍ່ສາມາດລຶບໄດ້' })
    }
  }

  return (
    <DashboardLayout title="ຈັດການຝ່າຍ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <MasterDataHeader
          icon={<Building2 className="h-6 w-6" />}
          title="ຈັດການຝ່າຍ (ໂຄງສ້າງອົງກອນ)"
          subtitle={`ກຳນົດ ແລະ ຈັດການໂຄງສ້າງຝ່າຍໃນລະບົບ ທັງໝົດ ${divisions.length} ຝ່າຍ`}
          action={
            <ResetDefaultsButton
              onReset={() => {
                resetToDefaults()
                pushToast({ title: 'ຣີເຊັດເປັນຄ່າເລີ່ມຕົ້ນຂອງ EDL ສຳເລັດ' })
              }}
            />
          }
        />

        {/* ຟອມເພີ່ມຝ່າຍໃໝ່ */}
        <MasterCard>
          <div className="flex flex-col gap-2 sm:flex-row">
            <AddInput
              icon={<Building2 className="h-4 w-4" />}
              value={newDivName}
              onChange={setNewDivName}
              onSubmit={handleAddDivision}
              placeholder="ປ້ອນຊື່ຝ່າຍໃໝ່..."
            />
            <AddButton label="ເພີ່ມຝ່າຍ" onClick={handleAddDivision} disabled={!newDivName.trim()} />
          </div>
        </MasterCard>

        {/* ຕາຕະລາງຝ່າຍ */}
        <MasterTable
          head={
            <>
              <Th align="center" className="w-12 whitespace-nowrap">ລ/ດ</Th>
              <Th>ຊື່ຝ່າຍ</Th>
              <Th>ຈຳນວນພະແນກ</Th>
              <Th>ຕູ້ເອກະສານ</Th>
              <Th>ຜູ້ໃຊ້ງານ</Th>
              <Th align="right">ການກະທຳ</Th>
            </>
          }
        >
          {divisions.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                ຍັງບໍ່ມີຝ່າຍໃນລະບົບ
              </td>
            </tr>
          ) : (
            divisions.map((division, idx) => {
              const stat = divisionStats.get(division)
              return (
                <tr key={division} className="transition hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 text-center font-medium text-slate-400 tabular-nums whitespace-nowrap">
                    {idx + 1}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-800">🏢 {division}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <IndigoPill>{stat?.departments || 0} ພະແນກ</IndigoPill>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{stat?.cabinets || 0} ຕູ້</td>
                  <td className="px-5 py-3.5 text-slate-600">{stat?.users || 0} ຄົນ</td>
                  <td className="px-5 py-3.5 text-right">
                    <RowActions>
                      <EditButton
                        onClick={() => {
                          setEditingDivision(division)
                          setEditDivName(division)
                        }}
                      />
                      <DeleteButton onClick={() => setDeletingDivision(division)} />
                    </RowActions>
                  </td>
                </tr>
              )
            })
          )}
        </MasterTable>

        <RenameModal
          open={!!editingDivision}
          title="ແກ້ໄຂຊື່ຝ່າຍ"
          label="ຊື່ຝ່າຍ"
          value={editDivName}
          onChange={setEditDivName}
          onClose={() => setEditingDivision(null)}
          onSubmit={handleUpdateDivision}
        />

        <ConfirmDeleteModal
          open={!!deletingDivision}
          title="ຢືນຢັນການລຶບຝ່າຍ"
          onClose={() => setDeletingDivision(null)}
          onConfirm={handleDeleteDivision}
        >
          {deletingDivision && (
            <>
              ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຝ່າຍ &ldquo;<strong>{deletingDivision}</strong>&rdquo; ແລະ
              ທຸກພະແນກພາຍໃນ?
            </>
          )}
        </ConfirmDeleteModal>
      </div>
    </DashboardLayout>
  )
}
