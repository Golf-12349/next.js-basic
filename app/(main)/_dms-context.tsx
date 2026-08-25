"use client"
import React, { createContext, useContext, useState } from 'react'
import { Cabinet, Document, Folder } from '@/types/document'
import { User } from '@/types/user'

type DMSContextType = {
  // Raw state (ยังเก็บไว้ให้ backward-compatible กับ Code เก่าที่ใช้ setDocuments โดยตรง)
  documents: Document[]
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
  categories: string[]
  setCategories: React.Dispatch<React.SetStateAction<string[]>>
  users: User[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>

  // Document helpers
  addDocument: (doc: Omit<Document, 'id' | 'deleted'>) => Document
  updateDocument: (id: string, patch: Partial<Document>) => void
  deleteDocument: (id: string) => void // soft delete -> ไป Trash
  restoreDocument: (id: string) => void // กู้คืนจาก Trash
  permDeleteDocument: (id: string) => void // ลบถาวร
  archiveDocument: (id: string) => void // เปลี่ยน status เป็น archived

  // Category helpers
  addCategory: (name: string) => void
  removeCategory: (name: string) => void

  // User helpers
  addUser: (user: Omit<User, 'id'>) => User
  updateUser: (id: string, patch: Partial<User>) => void
  removeUser: (id: string) => void
  toggleUserStatus: (id: string) => void

  // 3-Level Archive (cabinets -> folders -> documents) helpers
  cabinets: Cabinet[]
  setCabinets: React.Dispatch<React.SetStateAction<Cabinet[]>>
  folders: Folder[]
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>
  createCabinet: (data: { name: string; color: string; department: string; description: string }) => void
  createFolder: (data: { cabinetId: string; name: string; description: string }) => void
  deleteCabinet: (id: string) => void
  deleteFolder: (id: string) => void
  assignDocument: (docId: string, cabinetId: string, folderId: string) => void
}

const DMSContext = createContext<DMSContextType | undefined>(undefined)

// ฟังก์ชันช่วยสร้าง ID แบบไม่ซ้ำกัน, ใช้ prefix ได้ (เช่น 'DOC', 'USR', 'CAB', 'FLDR')
function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`
}

export function DMSProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'DOC-001',
      title: 'ເອກະສານຂາເຂົ້າທີ່ກ່ຽວກັບຄຳສັ່ງຊື້',
      docNumber: 'K-2026-001',
      category: 'ຂາເຂົ້າ',
      status: 'approved',
      fileType: 'pdf',
      fileSize: '2.4 MB',
      uploadDate: '2026-08-08',
      uploadedBy: 'ນາງ ທຳມະເພກ',
      fileUrl: '#',
      cabinetId: 'CAB-001',
      cabinetName: 'ການເງິນ',
      folderId: 'FLDR-001',
      folderName: 'ໄບສັ່ງຊື້',
    },
    {
      id: 'DOC-002',
      title: 'ແຈ້ງການປະກາດຄວາມກ້າຫານໃນອຸດສາຫະກໍາ',
      docNumber: 'AN-2026-014',
      category: 'ແຈ້ງການ',
      status: 'pending',
      fileType: 'doc',
      fileSize: '840 KB',
      uploadDate: '2026-08-07',
      uploadedBy: 'ທ້າວ ອາລີ',
      fileUrl: '#',
      cabinetId: 'CAB-002',
      cabinetName: 'ປະກາດ',
      folderId: 'FLDR-004',
      folderName: 'ແຈ້ງການພາຍໃນ',
    },
    {
      id: 'DOC-003',
      title: 'ສັນຍາເຊົ່ອມຕໍ່ກັບຜູ້ສະຫນອງ',
      docNumber: 'CT-2026-021',
      category: 'ສັນຍາ',
      status: 'draft',
      fileType: 'pdf',
      fileSize: '1.1 MB',
      uploadDate: '2026-08-05',
      uploadedBy: 'ນາງ ຄຳນາ',
      fileUrl: '#',
      cabinetId: 'CAB-003',
      cabinetName: 'ສັນຍາ',
      folderId: 'FLDR-007',
      folderName: 'ສັນຍາຜູ້ສະໜອງ',
    },
    {
      id: 'DOC-004',
      title: 'ບົດລາຍງານການງານຂອງຫົວໜ້າພະແນກ',
      docNumber: 'RP-2026-045',
      category: 'ລາຍງານ',
      status: 'approved',
      fileType: 'image',
      fileSize: '3.2 MB',
      uploadDate: '2026-08-04',
      uploadedBy: 'ທ້າວ ລະມາ',
      fileUrl: '#',
    },
    {
      id: 'DOC-005',
      title: 'ເອກະສານຂາອອກ ກ່ຽວກັບຂໍ້ຕົກລົງການສົ່ງສິນຄ້າ',
      docNumber: 'OUT-2026-009',
      category: 'ຂາອອກ',
      status: 'archived',
      fileType: 'pdf',
      fileSize: '1.7 MB',
      uploadDate: '2026-08-02',
      uploadedBy: 'ທ້າວ ຊົມບູລີ',
      fileUrl: '#',
    },
  ])

  const [categories, setCategories] = useState<string[]>(['ທົ່ວໄປ', 'ສິນທັດ', 'ເອກະສານທີ່ສຳຄັນ'])

  const [users, setUsers] = useState<User[]>([
    {
      id: 'USR-001',
      name: 'ສົມສັກ ວົງສະຫວັນ',
      email: 'somsack.v@dms.gov.la',
      phone: '020 5551 0011',
      role: 'SuperAdmin',
      department: 'ຝ່າຍບໍລິຫານລະບົບ',
      status: 'active',
      joinDate: '2024-01-15',
      lastActive: '2026-08-23',
    },
    {
      id: 'USR-002',
      name: 'ນາງ ທຳມະເພກ ພົມມະວົງ',
      email: 'thammapheak.p@dms.gov.la',
      phone: '020 5552 0022',
      role: 'Admin',
      department: 'ຝ່າຍທຸລະການ',
      status: 'active',
      joinDate: '2024-03-02',
      lastActive: '2026-08-22',
    },
    {
      id: 'USR-003',
      name: 'ທ້າວ ອາລີ ໄຊຍະລາດ',
      email: 'ali.s@dms.gov.la',
      phone: '020 5553 0033',
      role: 'Admin',
      department: 'ຝ່າຍແຜນການ',
      status: 'active',
      joinDate: '2024-05-20',
      lastActive: '2026-08-20',
    },
    {
      id: 'USR-004',
      name: 'ນາງ ຄຳນາ ສີວິໄລ',
      email: 'khamna.s@dms.gov.la',
      phone: '020 5554 0044',
      role: 'User',
      department: 'ຝ່າຍການເງິນ',
      status: 'active',
      joinDate: '2024-07-11',
      lastActive: '2026-08-23',
    },
    {
      id: 'USR-005',
      name: 'ທ້າວ ລະມາ ບຸນມີ',
      email: 'lama.b@dms.gov.la',
      phone: '020 5555 0055',
      role: 'User',
      department: 'ຝ່າຍຊັບພະຍາກອນມະນຸດ',
      status: 'inactive',
      joinDate: '2024-09-09',
      lastActive: '2026-07-30',
    },
    {
      id: 'USR-006',
      name: 'ທ້າວ ຊົມບູລີ ແກ້ວມະນີ',
      email: 'sombouly.k@dms.gov.la',
      phone: '020 5556 0066',
      role: 'User',
      department: 'ຝ່າຍເຕັກໂນໂລຊີ',
      status: 'active',
      joinDate: '2025-01-18',
      lastActive: '2026-08-21',
    },
  ])

  // ── 3-Level Archive state: Cabinets & Folders ──────────────────────────
  const [cabinets, setCabinets] = useState<Cabinet[]>([
    {
      id: 'CAB-001',
      name: 'ການເງິນ',
      color: 'from-emerald-500 to-teal-600',
      department: 'ຝ່າຍການເງິນ & ບັນຊີ',
      description: 'ເກັບເອກະສານການເງິນ ແລະ ບັນຊີທັງໝົດ',
      createdAt: '2026-01-10',
    },
    {
      id: 'CAB-002',
      name: 'ປະກາດ',
      color: 'from-indigo-500 to-blue-600',
      department: 'ຝ່າຍປະກາດ & ສື່ມວນຊົນ',
      description: 'ປະກາດ ແຈ້ງການ ຕ່າງໆ ຂອງອົງກອນ',
      createdAt: '2026-01-12',
    },
    {
      id: 'CAB-003',
      name: 'ສັນຍາ',
      color: 'from-amber-500 to-orange-600',
      department: 'ຝ່າຍສັນຍາ & ກົດໝາຍ',
      description: 'ສັນຍາ ຂໍ້ຕົກລົງ ແລະ ເອກະສານທາງກົດໝາຍ',
      createdAt: '2026-01-15',
    },
  ])

  const [folders, setFolders] = useState<Folder[]>([
    // ການເງິນ (CAB-001)
    { id: 'FLDR-001', cabinetId: 'CAB-001', name: 'ໄບສັ່ງຊື້', description: 'ໃບສັ່ງຊື້ສິນຄ້າ ແລະ ບໍລິການ', createdAt: '2026-02-01' },
    { id: 'FLDR-002', cabinetId: 'CAB-001', name: 'ໄບຮັບເງິນ', description: 'ໃບຮັບເງິນ ແລະ ໃບເສຍພາສີ', createdAt: '2026-02-02' },
    { id: 'FLDR-003', cabinetId: 'CAB-001', name: 'ລາຍງານການເງິນ', description: 'ລາຍງານປະຈຳເດືອນ / ປີ', createdAt: '2026-02-05' },

    // ປະກາດ (CAB-002)
    { id: 'FLDR-004', cabinetId: 'CAB-002', name: 'ແຈ້ງການພາຍໃນ', description: 'ແຈ້ງການພາຍໃນອົງກອນ', createdAt: '2026-02-03' },
    { id: 'FLDR-005', cabinetId: 'CAB-002', name: 'ປະກາດສາທາລະນະ', description: 'ປະກາດທີ່ເຜີຍແຜ່ສາທາລະນະ', createdAt: '2026-02-07' },

    // ສັນຍາ (CAB-003)
    { id: 'FLDR-006', cabinetId: 'CAB-003', name: 'ສັນຍາພະນັກງານ', description: 'ສັນຍາຈ້າງງານພະນັກງານ', createdAt: '2026-02-04' },
    { id: 'FLDR-007', cabinetId: 'CAB-003', name: 'ສັນຍາຜູ້ສະໜອງ', description: 'ສັນຍາກັບຜູ້ສະໜອງສິນຄ້າ/ບໍລິການ', createdAt: '2026-02-08' },
  ])

  // ---------- Document helpers ----------
  function addDocument(doc: Omit<Document, 'id' | 'deleted'>): Document {
    const newDoc: Document = { ...doc, id: generateId('DOC'), deleted: false }
    setDocuments((prev) => [newDoc, ...prev])
    return newDoc
  }

  function updateDocument(id: string, patch: Partial<Document>) {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  function deleteDocument(id: string) {
    updateDocument(id, { deleted: true })
  }

  function restoreDocument(id: string) {
    updateDocument(id, { deleted: false })
  }

  function permDeleteDocument(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  function archiveDocument(id: string) {
    updateDocument(id, { status: 'archived' })
  }

  // ---------- Category helpers ----------
  function addCategory(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    setCategories((prev) => (prev.includes(trimmed) ? prev : [trimmed, ...prev]))
  }

  function removeCategory(name: string) {
    setCategories((prev) => prev.filter((c) => c !== name))
  }

  // ---------- User helpers ----------
  function addUser(user: Omit<User, 'id'>): User {
    const newUser: User = { ...user, id: generateId('USR') }
    setUsers((prev) => [newUser, ...prev])
    return newUser
  }

  function updateUser(id: string, patch: Partial<User>) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  function removeUser(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  function toggleUserStatus(id: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u))
    )
  }

  // ---------- 3-Level Archive helpers ----------
  function createCabinet(data: { name: string; color: string; department: string; description: string }) {
    const newCabinet: Cabinet = {
      id: generateId('CAB'),
      name: data.name,
      color: data.color,
      department: data.department,
      description: data.description,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setCabinets((prev) => [newCabinet, ...prev])
  }

  function createFolder(data: { cabinetId: string; name: string; description: string }) {
    const newFolder: Folder = {
      id: generateId('FLDR'),
      cabinetId: data.cabinetId,
      name: data.name,
      description: data.description,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setFolders((prev) => [newFolder, ...prev])
  }

  function deleteCabinet(id: string) {
    // ลบตู้ และ folders ในตู้นั้น พร้อมถอนเอกสารออกจากการจัดระเบียบ
    setCabinets((prev) => prev.filter((c) => c.id !== id))
    setFolders((prev) => prev.filter((f) => f.cabinetId !== id))
    setDocuments((prev) =>
      prev.map((d) =>
        d.cabinetId === id
          ? { ...d, cabinetId: undefined, cabinetName: undefined, folderId: undefined, folderName: undefined }
          : d
      )
    )
  }

  function deleteFolder(id: string) {
    setFolders((prev) => prev.filter((f) => f.id !== id))
    setDocuments((prev) =>
      prev.map((d) => (d.folderId === id ? { ...d, folderId: undefined, folderName: undefined } : d))
    )
  }

  function assignDocument(docId: string, cabinetId: string, folderId: string) {
    const cabinet = cabinets.find((c) => c.id === cabinetId)
    const folder = folders.find((f) => f.id === folderId)
    updateDocument(docId, {
      cabinetId,
      cabinetName: cabinet?.name,
      folderId,
      folderName: folder?.name,
    })
  }

  return (
    <DMSContext.Provider
      value={{
        documents,
        setDocuments,
        categories,
        setCategories,
        users,
        setUsers,
        addDocument,
        updateDocument,
        deleteDocument,
        restoreDocument,
        permDeleteDocument,
        archiveDocument,
        addCategory,
        removeCategory,
        addUser,
        updateUser,
        removeUser,
        toggleUserStatus,
        cabinets,
        setCabinets,
        folders,
        setFolders,
        createCabinet,
        createFolder,
        deleteCabinet,
        deleteFolder,
        assignDocument,
      }}
    >
      {children}
    </DMSContext.Provider>
  )
}

export function useDMS() {
  const ctx = useContext(DMSContext)
  if (!ctx) throw new Error('useDMS must be used within DMSProvider')
  return ctx
}

export default DMSContext