'use client'

import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useArchive } from '../../../context/ArchiveContext'
import { useDocuments } from '../../../context/DocumentsContext'
import { useMasterData } from '../../../context/MasterDataContext'
import { pushToast } from '@/app/components/ui/Toast'
import {
  Badge,
  ConfirmButton,
  FormSelect,
  PanelTitle,
  RelocateEmptyState,
  RelocateHeader,
  RelocatePanel,
  RelocateSearch,
  SelectableCard,
  SummaryBox,
} from '@/app/components/relocate/RelocateUI'

export default function MoveCabinetPage() {
  const { warehouses, cabinets, shelves, folders, moveCabinet } = useArchive()
  const { documents } = useDocuments()
  const { divisions, getDepartments } = useMasterData()

  const [selectedCabinetId, setSelectedCabinetId] = useState<string>('')
  const [targetWarehouseForCabinet, setTargetWarehouseForCabinet] = useState<string>('')
  const [targetDivisionForCabinet, setTargetDivisionForCabinet] = useState<string>('')
  const [targetDepartmentForCabinet, setTargetDepartmentForCabinet] = useState<string>('')
  const [movingCabinet, setMovingCabinet] = useState<boolean>(false)
  const [sourceSearch, setSourceSearch] = useState<string>('')

  // ── ຂໍ້ມູນຕູ້ທີ່ເລືອກ ───────────────────────────────────────────
  const selectedCabinet = useMemo(
    () => cabinets.find((c) => c.id === selectedCabinetId),
    [cabinets, selectedCabinetId]
  )
  const currentWarehouseForCabinet = useMemo(
    () => warehouses.find((w) => w.id === selectedCabinet?.warehouseId),
    [warehouses, selectedCabinet]
  )
  const cabinetShelves = useMemo(
    () => shelves.filter((s) => s.cabinetId === selectedCabinetId),
    [shelves, selectedCabinetId]
  )
  const cabinetFolders = useMemo(
    () => folders.filter((f) => f.cabinetId === selectedCabinetId),
    [folders, selectedCabinetId]
  )
  const cabinetDocs = useMemo(
    () => documents.filter((d) => d.cabinetId === selectedCabinetId && !d.deleted),
    [documents, selectedCabinetId]
  )

  // ── ລາຍການຕູ້ (ຄົ້ນຫາໄດ້ທັງຊື່ຕູ້, ພະແນກ, ຝ່າຍ ແລະ ຄັງ) ─────────────
  const visibleCabinets = useMemo(() => {
    const query = sourceSearch.trim().toLowerCase()
    if (!query) return cabinets
    return cabinets.filter((cabinet) => {
      const warehouse = warehouses.find((w) => w.id === cabinet.warehouseId)
      return (
        cabinet.name.toLowerCase().includes(query) ||
        cabinet.department.toLowerCase().includes(query) ||
        (cabinet.division ?? '').toLowerCase().includes(query) ||
        (warehouse?.name ?? '').toLowerCase().includes(query)
      )
    })
  }, [cabinets, warehouses, sourceSearch])

  // ── ຄັງ / ຝ່າຍ / ພະແນກປາຍທາງ (ຝ່າຍ ແລະ ພະແນກ ເປັນທາງເລືອກ) ──────────
  const targetWarehouseOptions = useMemo(
    () => [
      { value: '', label: '— ເລືອກຄັງເອກະສານປາຍທາງ —' },
      ...warehouses.filter((w) => w.id !== selectedCabinet?.warehouseId).map((w) => ({ value: w.id, label: w.name })),
    ],
    [warehouses, selectedCabinet]
  )

  const targetDivisionOptions = useMemo(
    () => [
      { value: '', label: '— ຄົງເດີມ —' },
      ...divisions.map((division) => ({ value: division, label: division })),
    ],
    [divisions]
  )

  const targetDepartmentOptions = useMemo(
    () => [
      { value: '', label: '— ຄົງເດີມ —' },
      ...(targetDivisionForCabinet ? getDepartments(targetDivisionForCabinet) : []).map((department) => ({
        value: department,
        label: department,
      })),
    ],
    [getDepartments, targetDivisionForCabinet]
  )

  async function handleExecuteMoveCabinet() {
    if (!selectedCabinetId) {
      pushToast({ title: 'ກະລຸນາເລືອກຕູ້ເອກະສານທີ່ຕ້ອງການຍ້າຍ' })
      return
    }
    if (!targetWarehouseForCabinet) {
      pushToast({ title: 'ກະລຸນາເລືອກຄັງເອກະສານປາຍທາງ' })
      return
    }
    if (targetWarehouseForCabinet === selectedCabinet?.warehouseId) {
      pushToast({ title: 'ຄັງປາຍທາງຕ້ອງແຕກຕ່າງຈາກຄັງເດີມ' })
      return
    }
    setMovingCabinet(true)
    try {
      await moveCabinet(
        selectedCabinetId,
        targetWarehouseForCabinet,
        targetDivisionForCabinet || undefined,
        targetDepartmentForCabinet || undefined
      )
      const warehouseName = warehouses.find((w) => w.id === targetWarehouseForCabinet)?.name || 'ຄັງໃໝ່'
      pushToast({
        title: 'ຍ້າຍຕູ້ເອກະສານສຳເລັດ',
        description: `ຕູ້ "${selectedCabinet?.name}" ຖືກຍ້າຍໄປ "${warehouseName}" ຮຽບຮ້ອຍແລ້ວ`,
      })
      setSelectedCabinetId('')
      setTargetWarehouseForCabinet('')
      setTargetDivisionForCabinet('')
      setTargetDepartmentForCabinet('')
    } catch {
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການຍ້າຍຕູ້ເອກະສານ' })
    } finally {
      setMovingCabinet(false)
    }
  }

  return (
    <DashboardLayout title="ຍ້າຍຕູ້ເອກະສານ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <RelocateHeader
          icon="🗄️"
          title="ຍ້າຍຕູ້ເອກະສານ"
          subtitle="ຍ້າຍຕູ້ເອກະສານ ພ້ອມທັງຊັ້ນວາງ, ແຟ້ມ ແລະ ເອກະສານທັງໝົດທີ່ຢູ່ພາຍໃນ ໄປຄັງເອກະສານອື່ນ"
          countLabel={`${cabinets.length} ຕູ້`}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 1. ຕູ້ຕົ້ນທາງ */}
          <RelocatePanel>
            <PanelTitle step={1} icon="🗄️" title="ເລືອກຕູ້ຕົ້ນທາງ" hint={`ພົບ ${visibleCabinets.length} ຕູ້`} />
            <RelocateSearch
              value={sourceSearch}
              onChange={setSourceSearch}
              placeholder="ຄົ້ນຫາຊື່ຕູ້, ພະແນກ, ຝ່າຍ ຫຼື ຄັງ..."
            />

            {visibleCabinets.length === 0 ? (
              <RelocateEmptyState
                icon="🗄️"
                title="ບໍ່ພົບຕູ້ຕາມເງື່ອນໄຂ"
                sub="ລອງປ່ຽນຄຳຄົ້ນຫາໃໝ່ ຫຼື ສ້າງຕູ້ໃໝ່ທີ່ເມນູຄັງເກັບເອກະສານ"
              />
            ) : (
              <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                {visibleCabinets.map((cabinet) => {
                  const warehouse = warehouses.find((w) => w.id === cabinet.warehouseId)
                  return (
                    <SelectableCard
                      key={cabinet.id}
                      selected={selectedCabinetId === cabinet.id}
                      onSelect={() => {
                        setSelectedCabinetId(cabinet.id)
                        setTargetWarehouseForCabinet('')
                        setTargetDivisionForCabinet('')
                        setTargetDepartmentForCabinet('')
                      }}
                      icon="🗄️"
                      title={cabinet.name}
                      subtitle={
                        cabinet.description ||
                        `${cabinet.department}${cabinet.division ? ` • ${cabinet.division}` : ''}`
                      }
                    >
                      <Badge tone="warehouse">🏛️ {warehouse?.name || 'ຄັງທົ່ວໄປ'}</Badge>
                      <Badge tone="shelf">{shelves.filter((s) => s.cabinetId === cabinet.id).length} ຊັ້ນວາງ</Badge>
                      <Badge tone="folder">{folders.filter((f) => f.cabinetId === cabinet.id).length} ແຟ້ມ</Badge>
                      <Badge tone="document">
                        {documents.filter((d) => d.cabinetId === cabinet.id && !d.deleted).length} ເອກະສານ
                      </Badge>
                    </SelectableCard>
                  )
                })}
              </div>
            )}
          </RelocatePanel>

          {/* 2. ຄັງ / ຝ່າຍ / ພະແນກປາຍທາງ */}
          <RelocatePanel>
            <PanelTitle
              step={2}
              icon="🏛️"
              title="ເລືອກຄັງປາຍທາງ"
              hint="ຊັ້ນວາງ, ແຟ້ມ ແລະ ເອກະສານພາຍໃນຕູ້ຈະຍ້າຍຕາມໄປນຳ"
            />

            {selectedCabinet ? (
              <div className="space-y-4">
                <SummaryBox
                  icon="🗄️"
                  title={selectedCabinet.name}
                  rows={[
                    { label: 'ຄັງປັດຈຸບັນ', value: currentWarehouseForCabinet?.name || 'ຄັງທົ່ວໄປ' },
                    {
                      label: 'ຝ່າຍ / ພະແນກ',
                      value: `${selectedCabinet.division || '—'} • ${selectedCabinet.department}`,
                    },
                    { label: 'ຊັ້ນວາງພາຍໃນ', value: `${cabinetShelves.length} ຊັ້ນວາງ` },
                    { label: 'ແຟ້ມພາຍໃນ', value: `${cabinetFolders.length} ແຟ້ມ` },
                    { label: 'ເອກະສານພາຍໃນ', value: `${cabinetDocs.length} ເອກະສານ` },
                  ]}
                />

                <FormSelect
                  label="ຄັງເອກະສານປາຍທາງ"
                  required
                  value={targetWarehouseForCabinet}
                  onChange={setTargetWarehouseForCabinet}
                  options={targetWarehouseOptions}
                  hint="ຄັງເດີມຈະບໍ່ສະແດງໃນລາຍການ"
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormSelect
                    label="ຝ່າຍ (ທາງເລືອກ)"
                    value={targetDivisionForCabinet}
                    onChange={(value) => {
                      setTargetDivisionForCabinet(value)
                      setTargetDepartmentForCabinet('')
                    }}
                    options={targetDivisionOptions}
                    hint="ບໍ່ລະບຸ = ຄົງເດີມ"
                  />

                  <FormSelect
                    label="ພະແນກ (ທາງເລືອກ)"
                    value={targetDepartmentForCabinet}
                    onChange={setTargetDepartmentForCabinet}
                    options={targetDepartmentOptions}
                    disabled={!targetDivisionForCabinet}
                    hint="ຕ້ອງເລືອກຝ່າຍກ່ອນ"
                  />
                </div>

                <ConfirmButton
                  label="ຢືນຢັນການຍ້າຍຕູ້ເອກະສານ ➡️"
                  busyLabel="ກຳລັງຍ້າຍ..."
                  busy={movingCabinet}
                  disabled={!targetWarehouseForCabinet}
                  onClick={() => void handleExecuteMoveCabinet()}
                />
              </div>
            ) : (
              <RelocateEmptyState
                icon="🏛️"
                title="ຍັງບໍ່ໄດ້ເລືອກຕູ້"
                sub="ເລືອກຕູ້ທີ່ຕ້ອງການຍ້າຍຈາກລາຍການທາງຊ້າຍກ່ອນ"
              />
            )}
          </RelocatePanel>
        </div>
      </div>
    </DashboardLayout>
  )
}

