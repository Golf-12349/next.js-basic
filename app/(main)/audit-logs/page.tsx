"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import Pagination from '@/app/components/ui/Pagination'
import Modal from '@/app/components/ui/Modal'
import { useDebounce } from '@/hooks/useDebounce'
import { fetchAuditLogs, type AuditLogItem } from '@/lib/dms/auditLogService'
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  KeyRound,
  UserPlus,
  UserX,
  RefreshCw,
  Info,
  Calendar,
  Filter,
  Globe,
  Monitor,
  CheckCircle2,
  XCircle,
  LogOut,
  Shield,
  Eye,
} from 'lucide-react'

const ACTION_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  LOGIN_SUCCESS: { label: 'ເຂົ້າສູ່ລະບົບສຳເລັດ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  LOGIN_FAILED: { label: 'ເຂົ້າສູ່ລະບົບລົ້ມເຫຼວ', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
  LOGOUT: { label: 'ອອກຈາກລະບົບ', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: LogOut },
  USER_CREATED: { label: 'ສ້າງຜູ້ໃຊ້ໃໝ່', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: UserPlus },
  USER_UPDATED: { label: 'ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: RefreshCw },
  ROLE_CHANGED: { label: 'ປ່ຽນແປງສິດ (Role)', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Shield },
  PASSWORD_RESET: { label: 'ຣີເຊັດລະຫັດຜ່ານ', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: KeyRound },
  USER_DELETED: { label: 'ລຶບຜູ້ໃຊ້ງານ', color: 'bg-red-50 text-red-700 border-red-200', icon: UserX },
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const [actionFilter, setActionFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchAuditLogs({
        page,
        limit: 20,
        search: debouncedQuery.trim() || undefined,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      setLogs(res.data)
      setTotalCount(res.meta.total)
      setTotalPages(res.meta.totalPages)
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQuery, actionFilter, startDate, endDate])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  // Reset page when filter changes
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, actionFilter, startDate, endDate])

  // Summary Metrics from current list
  const metrics = useMemo(() => {
    const successCount = logs.filter((l) => l.action === 'LOGIN_SUCCESS').length
    const failCount = logs.filter((l) => l.action === 'LOGIN_FAILED').length
    const userRoleChanges = logs.filter((l) => ['USER_CREATED', 'ROLE_CHANGED', 'PASSWORD_RESET', 'USER_DELETED'].includes(l.action)).length
    return {
      total: totalCount,
      loginSuccess: successCount,
      loginFailed: failCount,
      userChanges: userRoleChanges,
    }
  }, [logs, totalCount])

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleString('lo-LA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <DashboardLayout title="ບັນທຶກຄວາມປອດໄພ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <ShieldCheck className="h-6 w-6" />
              </span>
              ບັນທຶກຄວາມປອດໄພລະບົບ (Security Audit Logs)
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              ຕິດຕາມ ແລະ ກວດສອບປະຫວັດການດຳເນີນງານດ້ານຄວາມປອດໄພທັງໝົດໃນລະບົບ (OWASP A09 Compliant)
            </p>
          </div>
          <button
            onClick={() => void loadLogs()}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            ໂຫຼດໃໝ່
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">ບັນທຶກທັງໝົດ</span>
              <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-slate-900">{metrics.total.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-400">ລາຍການປະຫວັດໃນຖານຂໍ້ມູນ</p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">ເຂົ້າສູ່ລະບົບສຳເລັດ</span>
              <span className="rounded-lg bg-emerald-100/80 p-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-emerald-800">{metrics.loginSuccess}</p>
            <p className="mt-1 text-xs text-emerald-600/80">ໃນໜ້ານີ້</p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700">ເຂົ້າສູ່ລະບົບລົ້ມເຫຼວ</span>
              <span className="rounded-lg bg-rose-100/80 p-2 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-rose-800">{metrics.loginFailed}</p>
            <p className="mt-1 text-xs text-rose-600/80">ລະຫັດຜິດ / ບໍ່ພົບບັນຊີ</p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700">ຈັດການສິດ & ຜູ້ໃຊ້</span>
              <span className="rounded-lg bg-amber-100/80 p-2 text-amber-700">
                <KeyRound className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-amber-800">{metrics.userChanges}</p>
            <p className="mt-1 text-xs text-amber-600/80">ສ້າງ, ປ່ຽນ Role, Reset ລະຫັດ</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            {/* Search Input */}
            <div className="relative md:col-span-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ຄົ້ນຫາ Action, ອີເມວ, IP address..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            {/* Action Select */}
            <div className="relative md:col-span-3">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              >
                <option value="ALL">ທຸກ Action (ທັງໝົດ)</option>
                <option value="LOGIN_SUCCESS">🟢 ເຂົ້າສູ່ລະບົບສຳເລັດ</option>
                <option value="LOGIN_FAILED">🔴 ເຂົ້າສູ່ລະບົບລົ້ມເຫຼວ</option>
                <option value="LOGOUT">🚪 ອອກຈາກລະບົບ</option>
                <option value="USER_CREATED">👤 ສ້າງຜູ້ໃຊ້ໃໝ່</option>
                <option value="ROLE_CHANGED">⚡ ປ່ຽນແປງສິດ (Role)</option>
                <option value="USER_UPDATED">✏️ ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້</option>
                <option value="PASSWORD_RESET">🔑 ຣີເຊັດລະຫັດຜ່ານ</option>
                <option value="USER_DELETED">🗑️ ລຶບຜູ້ໃຊ້ງານ</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="relative md:col-span-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            {/* End Date */}
            <div className="relative md:col-span-2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            {/* Clear Filter Button */}
            <div className="md:col-span-1 flex items-center">
              {(query || actionFilter !== 'ALL' || startDate || endDate) && (
                <button
                  onClick={() => {
                    setQuery('')
                    setActionFilter('ALL')
                    setStartDate('')
                    setEndDate('')
                  }}
                  className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ລ້າງ
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-3.5 py-3 w-12 text-center text-slate-500 whitespace-nowrap">ລ/ດ</th>
                  <th className="px-3.5 py-3">ວັນທີ & ເວລາ</th>
                  <th className="px-3.5 py-3">ຜູ້ດຳເນີນການ</th>
                  <th className="px-3.5 py-3">ເຫດການ (Action)</th>
                  <th className="px-3.5 py-3">ເປົ້າໝາຍ / ລາຍລະອຽດ</th>
                  <th className="px-3.5 py-3">IP Address & ອຸປະກອນ</th>
                  <th className="px-3.5 py-3 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-500 mb-2" />
                      ກຳລັງໂຫຼດຂໍ້ມູນບັນທຶກຄວາມປອດໄພ...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                      <Info className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      ບໍ່ພົບຂໍ້ມູນບັນທຶກຄວາມປອດໄພຕາມເງື່ອນໄຂ
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => {
                    const actionMeta = ACTION_LABELS[log.action] || {
                      label: log.action,
                      color: 'bg-slate-50 text-slate-700 border-slate-200',
                      icon: Info,
                    }
                    const IconComp = actionMeta.icon

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Sequence Number */}
                        <td className="px-3.5 py-3 text-center font-medium text-slate-400 tabular-nums whitespace-nowrap">
                          {idx + 1}
                        </td>

                        {/* Timestamp */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-xs font-mono text-slate-500">
                          {formatDate(log.createdAt)}
                        </td>

                        {/* Actor */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                              {(log.user?.name || log.actorEmail || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-900">
                                {log.user?.name || log.actorEmail || 'ລະບົບ'}
                              </p>
                              {log.actorRole && (
                                <span className="inline-block mt-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                  {log.actorRole}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${actionMeta.color}`}
                          >
                            <IconComp className="h-3.5 w-3.5" />
                            {actionMeta.label}
                          </span>
                        </td>

                        {/* Target & Details preview */}
                        <td className="px-3 py-2.5 max-w-xs truncate text-xs text-slate-600">
                          {log.details ? (
                            <span className="font-mono text-[11px] bg-slate-100/80 px-2 py-0.5 rounded text-slate-700">
                              {JSON.stringify(log.details)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* IP & Device */}
                        <td className="px-3 py-2.5 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px]">
                            <Globe className="h-3.5 w-3.5 text-slate-400" />
                            {log.ipAddress || 'unknown'}
                          </div>
                          {log.userAgent && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5">
                              <Monitor className="h-3 w-3 shrink-0" />
                              <span className="truncate">{log.userAgent}</span>
                            </div>
                          )}
                        </td>

                        {/* Detail Modal Button */}
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            ເບິ່ງ
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={20}
              onPageChange={(p) => setPage(p)}
              itemLabel="ບັນທຶກ"
            />
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <Modal
          open={true}
          onClose={() => setSelectedLog(null)}
          title="ລາຍລະອຽດບັນທຶກຄວາມປອດໄພ (Audit Log Details)"
        >
          <div className="space-y-4 text-sm text-slate-700 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Log ID:</span>
                <span className="font-mono text-slate-700">{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">ວັນທີ & ເວລາ:</span>
                <span className="font-mono text-slate-700">{formatDate(selectedLog.createdAt)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">ຜູ້ດຳເນີນການ:</span>
                <span className="font-medium text-slate-900">{selectedLog.user?.name || selectedLog.actorEmail || 'ລະບົບ'}</span>
                {selectedLog.actorRole && (
                  <span className="ml-1.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                    {selectedLog.actorRole}
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Action:</span>
                <span className="font-semibold text-slate-900">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">IP Address:</span>
                <span className="font-mono text-slate-700">{selectedLog.ipAddress || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Entity / Target:</span>
                <span className="font-mono text-slate-700">{selectedLog.entity} {selectedLog.entityId ? `(#${selectedLog.entityId})` : ''}</span>
              </div>
            </div>

            {selectedLog.userAgent && (
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">User Agent (ອຸປະກອນ & ໂປຣແກຣມທ່ອງເວັບ):</label>
                <div className="p-2.5 rounded-lg bg-slate-100 font-mono text-[11px] text-slate-600 break-all">
                  {selectedLog.userAgent}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">ຂໍ້ມູນລາຍລະອຽດເພີ່ມເຕີມ (Payload & Details):</label>
              <pre className="p-3 rounded-xl bg-slate-900 text-indigo-200 font-mono text-xs overflow-x-auto">
                {selectedLog.details ? JSON.stringify(selectedLog.details, null, 2) : 'ບໍ່ມີຂໍ້ມູນເພີ່ມເຕີມ'}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                ປິດ
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}
