"use client"
import React, { createContext, useContext, useState } from 'react'
import { Document } from '@/types/document'
import { User } from '@/types/user'

type DMSContextType = {
  // Raw state (ຍັງເກັບໄວ້ໃຫ້ backward-compatible ກັບ Code ເກົ່າທີ່ໃຊ້ setDocuments ໂດຍກົງ)
  documents: Document[]
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
  categories: string[]
  setCategories: React.Dispatch<React.SetStateAction<string[]>>
  users: User[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>

  // Document helpers
  addDocument: (doc: Omit<Document, 'id' | 'deleted'>) => Document
  updateDocument: (id: string, patch: Partial<Document>) => void
  deleteDocument: (id: string) => void // soft delete -> ໄປ Trash
  restoreDocument: (id: string) => void // ກູ້ຄືນຈາກ Trash
  permDeleteDocument: (id: string) => void // ລຶບຖາວອນ
  archiveDocument: (id: string) => void // ປ່ຽນ status ເປັນ archived

  // Category helpers
  addCategory: (name: string) => void
  removeCategory: (name: string) => void

  // User helpers
  addUser: (user: Omit<User, 'id'>) => User
  removeUser: (id: string) => void
}

const DMSContext = createContext<DMSContextType | undefined>(undefined)

// ຟັງຊັນຊ່ວຍສ້າງ ID ແບບບໍ່ຊ້ຳກັນ, ໃຊ້ prefix ໄດ້ (ເຊັ່ນ 'DOC', 'USR')
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
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
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
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
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
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
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
      fileUrl: 'https://picsum.photos/800/1000',
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
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
  ])

  const [categories, setCategories] = useState<string[]>(['ທົ່ວໄປ', 'ສິນທັດ', 'ເອກະສານທີ່ສຳຄັນ'])

  const [users, setUsers] = useState<User[]>([
    { id: 'u1', name: 'ຈອນໂດ', role: 'Admin' },
    { id: 'u2', name: 'ສະໄໝ ສະໄໝ', role: 'Staff' },
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

  function removeUser(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id))
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
        removeUser,
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