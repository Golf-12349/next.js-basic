'use client'

import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { useArchive } from '../../../context/ArchiveContext'
import { useDocuments } from '../../../context/DocumentsContext'
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

export default function MoveShelfPage() {
  const { warehouses, cabinets, shelves, folders, moveShelf } = useArchive()
  const { documents } = useDocuments()

  const [selectedShelfId, setSelectedShelfId] = useState<string>('')
  const [targetCabinetForShelf, setTargetCabinetForShelf] = useState<string>('')
  const [movingShelf, setMovingShelf] = useState<boolean>(false)
  const [sourceSearch, setSourceSearch] = useState<string>('')

  // ── ຂໍ້ມູນຊັ້ນວາງທີ່ເລືອກ ────────────────────────────────────────
  const selectedShelf = useMemo(() => shelves.find((s) => s.id === selectedShelfId), [shelves, selectedShelfId])
  const currentCabinetForShelf = useMemo(
    () => cabinets.find((c) => c.id === selectedShelf?.cabinetId),
    [cabinets, selectedShelf]
  )
  const currentWarehouseForShelf = useMemo(
    () => warehouses.find((w) => w.id === currentCabinetForShelf?.warehouseId),
    [warehouses, currentCabinetForShelf]
  )
  const shelfFolders = useMemo(() => folders.filter((f) => f.shelfId === selectedShelfId), [folders, selectedShelfId])
  const shelfDocs = useMemo(
    () => documents.filter((d) => d.shelfId === selectedShelfId && !d.deleted),
    [documents, selectedShelfId]
  )

  // ── ລາຍການຊັ້ນວາງ (ຄົ້ນຫາໄດ້ທັງຊື່ຊັ້ນວາງ, ຕູ້ ແລະ ຄັງ) ─────────────
  const visibleShelves = useMemo(() => {
    const query = sourceSearch.trim().toLowerCase()
    if (!query) return shelves
    return shelves.filter((shelf) => {
      const cabinet = cabinets.find((c) => c.id === shelf.cabinetId)
      const warehouse = cabinet?.warehouseId ? warehouses.find((w) => w.id === cabinet.warehouseId) : undefined
      return (
        shelf.name.toLowerCase().includes(query) ||
        (shelf.description ?? '').toLowerCase().includes(query) ||
        (cabinet?.name ?? '').toLowerCase().includes(query) ||
        (warehouse?.name ?? '').toLowerCase().includes(query)
      )
    })
  }, [shelves, cabinets, warehouses, sourceSearch])

  // ── ຕູ້ປາຍທາງ (ບໍ່ສະແດງຕູ້ເດີມຂອງຊັ້ນວາງ) ─────────────────────────
  const targetCabinetOptions = useMemo(
    () => [
      { value: '', label: '— ເລືອກຕູ້ເອກະສານປາຍທາງ —' },
      ...cabinets
        .filter((c) => c.id !== selectedShelf?.cabinetId)
        .map((c) => {
          const warehouse = warehouses.find((w) => w.id === c.warehouseId)
          return { value: c.id, label: warehouse ? `${c.name} (${warehouse.name})` : c.name }
        }),
    ],
    [cabinets, warehouses, selectedShelf]
  )

  async function handleExecuteMoveShelf() {
    if (!selectedShelfId) {
      pushToast({ title: 'ກະລຸນາເລືອກຊັ້ນວາງທີ່ຕ້ອງການຍ້າຍ' })
      return
    }
    if (!targetCabinetForShelf) {
      pushToast({ title: 'ກະລຸນາເລືອກຕູ້ເອກະສານປາຍທາງ' })
      return
    }
    if (targetCabinetForShelf === selectedShelf?.cabinetId) {
      pushToast({ title: 'ຕູ້ປາຍທາງຕ້ອງແຕກຕ່າງຈາກຕູ້ເດີມ' })
      return
    }
    setMovingShelf(true)
    try {
      await moveShelf(selectedShelfId, targetCabinetForShelf)
      const cabinetName = cabinets.find((c) => c.id === targetCabinetForShelf)?.name || 'ຕູ້ໃໝ່'
      pushToast({
        title: 'ຍ້າຍຊັ້ນວາງສຳເລັດ',
        description: `ຊັ້ນວາງ "${selectedShelf?.name}" ຖືກຍ້າຍໄປ "${cabinetName}" ຮຽບຮ້ອຍແລ້ວ`,
      })
      setSelectedShelfId('')
      setTargetCabinetForShelf('')
    } catch {
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການຍ້າຍຊັ້ນວາງ' })
    } finally {
      setMovingShelf(false)
    }
  }

  return (
    <DashboardLayout title="ຍ້າຍຊັ້ນວາງ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <RelocateHeader
          icon="🪜"
          title="ຍ້າຍຊັ້ນວາງເອກະສານ"
          subtitle="ຍ້າຍຊັ້ນວາງ ພ້ອມທັງແຟ້ມ ແລະ ເອກະສານທັງໝົດທີ່ຢູ່ພາຍໃນ ໄປຕູ້ເອກະສານອື່ນ"
          countLabel={`${shelves.length} ຊັ້ນວາງ`}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 1. ຊັ້ນວາງຕົ້ນທາງ */}
          <RelocatePanel>
            <PanelTitle
              step={1}
              icon="🪜"
              title="ເລືອກຊັ້ນວາງຕົ້ນທາງ"
              hint={`ພົບ ${visibleShelves.length} ຊັ້ນວາງ`}
            />
            <RelocateSearch
              value={sourceSearch}
              onChange={setSourceSearch}
              placeholder="ຄົ້ນຫາຊື່ຊັ້ນວາງ, ຕູ້ ຫຼື ຄັງ..."
            />

            {visibleShelves.length === 0 ? (
              <RelocateEmptyState
                icon="🪜"
                title="ບໍ່ພົບຊັ້ນວາງຕາມເງື່ອນໄຂ"
                sub="ລອງປ່ຽນຄຳຄົ້ນຫາໃໝ່ ຫຼື ສ້າງຊັ້ນວາງໃໝ່ທີ່ເມນູຄັງເກັບເອກະສານ"
              />
            ) : (
              <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                {visibleShelves.map((shelf) => {
                  const cabinet = cabinets.find((c) => c.id === shelf.cabinetId)
                  const warehouse = cabinet?.warehouseId
                    ? warehouses.find((w) => w.id === cabinet.warehouseId)
                    : undefined
                  return (
                    <SelectableCard
                      key={shelf.id}
                      selected={selectedShelfId === shelf.id}
                      onSelect={() => {
                        setSelectedShelfId(shelf.id)
                        setTargetCabinetForShelf('')
                      }}
                      icon="🪜"
                      title={shelf.name}
                      subtitle={shelf.description || 'ບໍ່ມີລາຍລະອຽດ'}
                    >
                      <Badge tone="warehouse">🏛️ {warehouse?.name || 'ຄັງທົ່ວໄປ'}</Badge>
                      <Badge tone="cabinet">🗄️ {cabinet?.name || 'ບໍ່ມີຕູ້'}</Badge>
                      <Badge tone="folder">{folders.filter((f) => f.shelfId === shelf.id).length} ແຟ້ມ</Badge>
                      <Badge tone="document">
                        {documents.filter((d) => d.shelfId === shelf.id && !d.deleted).length} ເອກະສານ
                      </Badge>
                    </SelectableCard>
                  )
                })}
              </div>
            )}
          </RelocatePanel>

          {/* 2. ຕູ້ປາຍທາງ */}
          <RelocatePanel>
            <PanelTitle
              step={2}
              icon="🗄️"
              title="ເລືອກຕູ້ເອກະສານປາຍທາງ"
              hint="ແຟ້ມ ແລະ ເອກະສານພາຍໃນຈະຍ້າຍຕາມໄປນຳ"
            />

            {selectedShelf ? (
              <div className="space-y-4">
                <SummaryBox
                  icon="🪜"
                  title={selectedShelf.name}
                  rows={[
                    { label: 'ຕູ້ປັດຈຸບັນ', value: currentCabinetForShelf?.name || '—' },
                    { label: 'ຄັງປັດຈຸບັນ', value: currentWarehouseForShelf?.name || 'ຄັງທົ່ວໄປ' },
                    { label: 'ແຟ້ມພາຍໃນ', value: `${shelfFolders.length} ແຟ້ມ` },
                    { label: 'ເອກະສານພາຍໃນ', value: `${shelfDocs.length} ເອກະສານ` },
                  ]}
                />

                <FormSelect
                  label="ຕູ້ເອກະສານປາຍທາງ"
                  required
                  value={targetCabinetForShelf}
                  onChange={setTargetCabinetForShelf}
                  options={targetCabinetOptions}
                  hint="ຕູ້ເດີມຈະບໍ່ສະແດງໃນລາຍການ"
                />

                <ConfirmButton
                  label="ຢືນຢັນການຍ້າຍຊັ້ນວາງ ➡️"
                  busyLabel="ກຳລັງຍ້າຍ..."
                  busy={movingShelf}
                  disabled={!targetCabinetForShelf}
                  onClick={() => void handleExecuteMoveShelf()}
                />
              </div>
            ) : (
              <RelocateEmptyState
                icon="🗄️"
                title="ຍັງບໍ່ໄດ້ເລືອກຊັ້ນວາງ"
                sub="ເລືອກຊັ້ນວາງທີ່ຕ້ອງການຍ້າຍຈາກລາຍການທາງຊ້າຍກ່ອນ"
              />
            )}
          </RelocatePanel>
        </div>
      </div>
    </DashboardLayout>
  )
}

