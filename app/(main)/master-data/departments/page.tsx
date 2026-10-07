'use client'

import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useUsers } from '../../context/UsersContext'
import { useArchive } from '../../context/ArchiveContext'
import { useMasterData } from '../../context/MasterDataContext'
import { pushToast } from '@/app/components/ui/Toast'
import { Plus, Users } from 'lucide-react'
import {
  AddButton,
  AddInput,
  ConfirmDeleteModal,
  DeleteButton,
  EditButton,
  MasterCard,
  MasterDataHeader,
  MasterTable,
  RenameModal,
  ResetDefaultsButton,
  RowActions,
  Th,
} from '@/app/components/master-data/MasterDataUI'

export default function MasterDataDepartmentsPage() {
  const { users } = useUsers()
  const { cabinets } = useArchive()
  const {
    divisions,
    departmentsByDivision,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    resetToDefaults,
  } = useMasterData()

  const [filterDivision, setFilterDivision] = useState<string>('ທັງໝົດ')
  const [targetDivisionForNewDept, setTargetDivisionForNewDept] = useState<string>(divisions[0] || '')
  const [newDeptName, setNewDeptName] = useState('')
  const [editingDept, setEditingDept] = useState<{ division: string; department: string } | null>(null)
  const [editDeptName, setEditDeptName] = useState('')
  const [deletingDept, setDeletingDept] = useState<{ division: string; department: string } | null>(null)

  // ນັບຕູ້ເອກະສານ / ຜູ້ໃຊ້ງານ ພາຍໃນແຕ່ລະພະແນກ
  const departmentStats = useMemo(() => {
    const map = new Map<string, { cabinets: number; users: number }>()
    for (const [div, depts] of Object.entries(departmentsByDivision)) {
      for (const dept of depts) {
        map.set(`${div}:::${dept}`, {
          cabinets: cabinets.filter((c) => c.department === dept).length,
          users: users.filter((u) => u.department === dept).length,
        })
      }
    }
    return map
  }, [departmentsByDivision, cabinets, users])

  // ລາຍການພະແນກ (ກອງຕາມຝ່າຍໄດ້)
  const visibleDepartments = useMemo(
    () =>
      divisions
        .filter((div) => filterDivision === 'ທັງໝົດ' || div === filterDivision)
        .flatMap((div) => (departmentsByDivision[div] || []).map((dept) => ({ division: div, department: dept }))),
    [divisions, departmentsByDivision, filterDivision]
  )

  function handleAddDepartment() {
    const res = addDepartment(targetDivisionForNewDept, newDeptName)
    if (res.success) {
      pushToast({ title: 'ເພີ່ມພະແນກໃໝ່ສຳເລັດ' })
      setNewDeptName('')
    } else {
      pushToast({ title: res.message || 'ບໍ່ສາມາດເພີ່ມພະແນກໄດ້' })
    }
  }

  function handleUpdateDepartment() {
    if (!editingDept) return
    const res = updateDepartment(editingDept.division, editingDept.department, editDeptName)
    if (res.success) {
      pushToast({ title: 'ແກ້ໄຂພະແນກສຳເລັດແລ້ວ' })
      setEditingDept(null)
    } else {
      pushToast({ title: res.message || 'ບໍ່ສາມາດແກ້ໄຂໄດ້' })
    }
  }

  function handleDeleteDepartment() {
    if (!deletingDept) return
    const res = deleteDepartment(deletingDept.division, deletingDept.department)
    if (res.success) {
      pushToast({ title: 'ລຶບພະແນກສຳເລັດແລ້ວ' })
      setDeletingDept(null)
    } else {
      pushToast({ title: res.message || 'ບໍ່ສາມາດລຶບໄດ້' })
    }
  }

  return (
    <DashboardLayout title="ຈັດການພະແນກ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <MasterDataHeader
          icon={<Users className="h-6 w-6" />}
          title="ຈັດການພະແນກ"
          subtitle={`ພະແນກພາຍໃນແຕ່ລະຝ່າຍ ທັງໝົດ ${visibleDepartments.length} ພະແນກ`}
          action={
            <ResetDefaultsButton
              onReset={() => {
                resetToDefaults()
                pushToast({ title: 'ຣີເຊັດເປັນຄ່າເລີ່ມຕົ້ນຂອງ EDL ສຳເລັດ' })
              }}
            />
          }
        />

        {/* ຟອມເພີ່ມພະແນກໃໝ່ */}
        <MasterCard>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="w-full sm:w-64">
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">ສັງກັດຝ່າຍ *</label>
              <select
                value={targetDivisionForNewDept}
                onChange={(e) => setTargetDivisionForNewDept(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white"
              >
                {divisions.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">ຊື່ພະແນກໃໝ່ *</label>
              <div className="flex gap-2">
                <AddInput
                  icon={<Plus className="h-4 w-4" />}
                  value={newDeptName}
                  onChange={setNewDeptName}
                  onSubmit={handleAddDepartment}
                  placeholder="ປ້ອນຊື່ພະແນກ..."
                />
                <AddButton
                  label="ເພີ່ມພະແນກ"
                  onClick={handleAddDepartment}
                  disabled={!newDeptName.trim() || !targetDivisionForNewDept}
                />
              </div>
            </div>
          </div>
        </MasterCard>

        {/* ກອງຕາມຝ່າຍ */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>ກອງຕາມຝ່າຍ:</span>
          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-400"
          >
            <option value="ທັງໝົດ">ຝ່າຍທັງໝົດ</option>
            {divisions.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
        </div>

        {/* ຕາຕະລາງພະແນກ */}
        <MasterTable
          head={
            <>
              <Th align="center" className="w-12 whitespace-nowrap">ລ/ດ</Th>
              <Th>ຊື່ພະແນກ</Th>
              <Th>ສັງກັດຝ່າຍ</Th>
              <Th>ຕູ້ເອກະສານ</Th>
              <Th>ຜູ້ໃຊ້ງານ</Th>
              <Th align="right">ການກະທຳ</Th>
            </>
          }
        >
          {visibleDepartments.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                ຍັງບໍ່ມີພະແນກຕາມເງື່ອນໄຂທີ່ເລືອກ
              </td>
            </tr>
          ) : (
            visibleDepartments.map(({ division, department }, idx) => {
              const stat = departmentStats.get(`${division}:::${department}`)
              return (
                <tr key={`${division}:::${department}`} className="transition hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 text-center font-medium text-slate-400 tabular-nums whitespace-nowrap">
                    {idx + 1}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-800">🏬 {department}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">🏢 {division}</td>
                  <td className="px-5 py-3.5 text-slate-600">{stat?.cabinets || 0} ຕູ້</td>
                  <td className="px-5 py-3.5 text-slate-600">{stat?.users || 0} ຄົນ</td>
                  <td className="px-5 py-3.5 text-right">
                    <RowActions>
                      <EditButton
                        onClick={() => {
                          setEditingDept({ division, department })
                          setEditDeptName(department)
                        }}
                      />
                      <DeleteButton onClick={() => setDeletingDept({ division, department })} />
                    </RowActions>
                  </td>
                </tr>
              )
            })
          )}
        </MasterTable>

        <RenameModal
          open={!!editingDept}
          title="ແກ້ໄຂພະແນກ"
          label="ຊື່ພະແນກ"
          value={editDeptName}
          onChange={setEditDeptName}
          onClose={() => setEditingDept(null)}
          onSubmit={handleUpdateDepartment}
          extra={
            editingDept ? (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">ສັງກັດຝ່າຍ</label>
                <p className="text-sm font-semibold text-slate-800">🏢 {editingDept.division}</p>
              </div>
            ) : null
          }
        />

        <ConfirmDeleteModal
          open={!!deletingDept}
          title="ຢືນຢັນການລຶບພະແນກ"
          onClose={() => setDeletingDept(null)}
          onConfirm={handleDeleteDepartment}
        >
          {deletingDept && (
            <>
              ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບພະແນກ &ldquo;<strong>{deletingDept.department}</strong>&rdquo; (ຝ່າຍ:{' '}
              {deletingDept.division})?
            </>
          )}
        </ConfirmDeleteModal>
      </div>
    </DashboardLayout>
  )
}
