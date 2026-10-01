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

export default function MoveFolderPage() {
  const { warehouses, cabinets, shelves, folders, moveFolder } = useArchive()
  const { documents } = useDocuments()

  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const [targetCabinetForFolder, setTargetCabinetForFolder] = useState<string>('')
  const [targetShelfForFolder, setTargetShelfForFolder] = useState<string>('')
  const [movingFolder, setMovingFolder] = useState<boolean>(false)
  const [sourceSearch, setSourceSearch] = useState<string>('')

  // ── ຂໍ້ມູນແຟ້ມທີ່ເລືອກ ──────────────────────────────────────────
  const selectedFolder = useMemo(() => folders.find((f) => f.id === selectedFolderId), [folders, selectedFolderId])
  const currentCabinetForFolder = useMemo(
    () => cabinets.find((c) => c.id === selectedFolder?.cabinetId),
    [cabinets, selectedFolder]
  )
  const currentShelfForFolder = useMemo(
    () => shelves.find((s) => s.id === selectedFolder?.shelfId),
    [shelves, selectedFolder]
  )
  const folderDocs = useMemo(
    () => documents.filter((d) => d.folderId === selectedFolderId && !d.deleted),
    [documents, selectedFolderId]
  )

  // ── ລາຍການແຟ້ມ (ຄົ້ນຫາໄດ້ທັງຊື່ແຟ້ມ, ຕູ້, ຊັ້ນວາງ ແລະ ຄັງ) ───────────
  const visibleFolders = useMemo(() => {
    const query = sourceSearch.trim().toLowerCase()
    if (!query) return folders
    return folders.filter((folder) => {
      const cabinet = cabinets.find((c) => c.id === folder.cabinetId)
      const shelf = folder.shelfId ? shelves.find((s) => s.id === folder.shelfId) : undefined
      const warehouse = cabinet?.warehouseId ? warehouses.find((w) => w.id === cabinet.warehouseId) : undefined
      return (
        folder.name.toLowerCase().includes(query) ||
        (folder.description ?? '').toLowerCase().includes(query) ||
        (cabinet?.name ?? '').toLowerCase().includes(query) ||
        (shelf?.name ?? '').toLowerCase().includes(query) ||
        (warehouse?.name ?? '').toLowerCase().includes(query)
      )
    })
  }, [folders, cabinets, shelves, warehouses, sourceSearch])

  // ── ຕູ້ ແລະ ຊັ້ນວາງປາຍທາງ ────────────────────────────────────
  const targetCabinetOptions = useMemo(
    () => [
      { value: '', label: '— ເລືອກຕູ້ເອກະສານປາຍທາງ —' },
      ...cabinets.map((c) => {
        const warehouse = warehouses.find((w) => w.id === c.warehouseId)
        return { value: c.id, label: warehouse ? `${c.name} (${warehouse.name})` : c.name }
      }),
    ],
    [cabinets, warehouses]
  )

  const targetShelfOptions = useMemo(
    () => [
      { value: '', label: '— ບໍ່ລະບຸຊັ້ນວາງ (ວາງໃນຕູ້ໂດຍກົງ) —' },
      ...shelves.filter((s) => s.cabinetId === targetCabinetForFolder).map((s) => ({ value: s.id, label: s.name })),
    ],
    [shelves, targetCabinetForFolder]
  )

  async function handleExecuteMoveFolder() {
    if (!selectedFolderId) {
      pushToast({ title: 'ກະລຸນາເລືອກແຟ້ມເອກະສານທີ່ຕ້ອງການຍ້າຍ' })
      return
    }
    if (!targetCabinetForFolder) {
      pushToast({ title: 'ກະລຸນາເລືອກຕູ້ເອກະສານປາຍທາງ' })
      return
    }
    setMovingFolder(true)
    try {
      await moveFolder(selectedFolderId, targetCabinetForFolder, targetShelfForFolder || null)
      const cabinetName = cabinets.find((c) => c.id === targetCabinetForFolder)?.name || 'ຕູ້ໃໝ່'
      pushToast({
        title: 'ຍ້າຍແຟ້ມເອກະສານສຳເລັດ',
        description: `ແຟ້ມ "${selectedFolder?.name}" ຖືກຍ້າຍໄປ "${cabinetName}" ຮຽບຮ້ອຍແລ້ວ`,
      })
      setSelectedFolderId('')
      setTargetCabinetForFolder('')
      setTargetShelfForFolder('')
    } catch {
      pushToast({ title: 'ເກີດຂໍ້ຜິດພາດໃນການຍ້າຍແຟ້ມ' })
    } finally {
      setMovingFolder(false)
    }
  }

  return (
    <DashboardLayout title="ຍ້າຍແຟ້ມເອກະສານ">
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
        <RelocateHeader
          icon="📁"
          title="ຍ້າຍແຟ້ມເອກະສານ"
          subtitle="ຍ້າຍແຟ້ມ ພ້ອມທັງເອກະສານທັງໝົດທີ່ຢູ່ພາຍໃນ ໄປຕູ້ ຫຼື ຊັ້ນວາງອື່ນ"
          countLabel={`${folders.length} ແຟ້ມ`}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 1. ແຟ້ມຕົ້ນທາງ */}
          <RelocatePanel>
            <PanelTitle
              step={1}
              icon="📁"
              title="ເລືອກແຟ້ມຕົ້ນທາງ"
              hint={`ພົບ ${visibleFolders.length} ແຟ້ມ`}
            />
            <RelocateSearch
              value={sourceSearch}
              onChange={setSourceSearch}
              placeholder="ຄົ້ນຫາຊື່ແຟ້ມ, ຕູ້, ຊັ້ນວາງ ຫຼື ຄັງ..."
            />

            {visibleFolders.length === 0 ? (
              <RelocateEmptyState
                icon="📁"
                title="ບໍ່ພົບແຟ້ມຕາມເງື່ອນໄຂ"
                sub="ລອງປ່ຽນຄຳຄົ້ນຫາໃໝ່ ຫຼື ສ້າງແຟ້ມໃໝ່ທີ່ເມນູຄັງເກັບເອກະສານ"
              />
            ) : (
              <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                {visibleFolders.map((folder) => {
                  const cabinet = cabinets.find((c) => c.id === folder.cabinetId)
                  const shelf = folder.shelfId ? shelves.find((s) => s.id === folder.shelfId) : undefined
                  const warehouse = cabinet?.warehouseId
                    ? warehouses.find((w) => w.id === cabinet.warehouseId)
                    : undefined
                  return (
                    <SelectableCard
                      key={folder.id}
                      selected={selectedFolderId === folder.id}
                      onSelect={() => {
                        setSelectedFolderId(folder.id)
                        setTargetCabinetForFolder('')
                        setTargetShelfForFolder('')
                      }}
                      icon="📁"
                      title={folder.name}
                      subtitle={folder.description || 'ບໍ່ມີລາຍລະອຽດ'}
                    >
                      <Badge tone="warehouse">🏛️ {warehouse?.name || 'ຄັງທົ່ວໄປ'}</Badge>
                      <Badge tone="cabinet">🗄️ {cabinet?.name || 'ບໍ່ມີຕູ້'}</Badge>
                      <Badge tone="shelf">🪜 {shelf?.name || 'ບໍ່ລະບຸຊັ້ນວາງ'}</Badge>
                      <Badge tone="document">
                        {documents.filter((d) => d.folderId === folder.id && !d.deleted).length} ເອກະສານ
                      </Badge>
                    </SelectableCard>
                  )
                })}
              </div>
            )}
          </RelocatePanel>

          {/* 2. ຕູ້ ແລະ ຊັ້ນວາງປາຍທາງ */}
          <RelocatePanel>
            <PanelTitle
              step={2}
              icon="🗄️"
              title="ເລືອກຕູ້ ແລະ ຊັ້ນວາງປາຍທາງ"
              hint="ເອກະສານພາຍໃນແຟ້ມຈະຍ້າຍຕາມໄປນຳ"
            />

            {selectedFolder ? (
              <div className="space-y-4">
                <SummaryBox
                  icon="📁"
                  title={selectedFolder.name}
                  rows={[
                    { label: 'ຕູ້ປັດຈຸບັນ', value: currentCabinetForFolder?.name || '—' },
                    { label: 'ຊັ້ນວາງປັດຈຸບັນ', value: currentShelfForFolder?.name || 'ບໍ່ລະບຸຊັ້ນວາງ' },
                    { label: 'ເອກະສານພາຍໃນ', value: `${folderDocs.length} ເອກະສານ` },
                  ]}
                />

                <FormSelect
                  label="ຕູ້ເອກະສານປາຍທາງ"
                  required
                  value={targetCabinetForFolder}
                  onChange={(value) => {
                    setTargetCabinetForFolder(value)
                    setTargetShelfForFolder('')
                  }}
                  options={targetCabinetOptions}
                />

                <FormSelect
                  label="ຊັ້ນວາງປາຍທາງ (ທາງເລືອກ)"
                  value={targetShelfForFolder}
                  onChange={setTargetShelfForFolder}
                  options={targetShelfOptions}
                  disabled={!targetCabinetForFolder}
                  hint={
                    targetCabinetForFolder && targetShelfOptions.length <= 1
                      ? 'ຕູ້ປາຍທາງນີ້ຍັງບໍ່ມີຊັ້ນວາງຍ່ອຍ'
                      : 'ບໍ່ລະບຸ = ວາງໃນຕູ້ໂດຍກົງ'
                  }
                />

                <ConfirmButton
                  label="ຢືນຢັນການຍ້າຍແຟ້ມ ➡️"
                  busyLabel="ກຳລັງຍ້າຍ..."
                  busy={movingFolder}
                  disabled={!targetCabinetForFolder}
                  onClick={() => void handleExecuteMoveFolder()}
                />
              </div>
            ) : (
              <RelocateEmptyState
                icon="📁"
                title="ຍັງບໍ່ໄດ້ເລືອກແຟ້ມ"
                sub="ເລືອກແຟ້ມທີ່ຕ້ອງການຍ້າຍຈາກລາຍການທາງຊ້າຍກ່ອນ"
              />
            )}
          </RelocatePanel>
        </div>
      </main>
    </DashboardLayout>
  )
}

