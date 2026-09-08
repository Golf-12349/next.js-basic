'use client'

// Real-time Test Suite
import React, { useEffect, useState } from 'react'

interface SelfTestResult {
  status: string
  totalTests: number
  passCount: number
  durationMs: number
  results: { testName: string; passed: boolean; detail: unknown }[]
}

interface EventLogItem {
  id: string
  type: string
  receivedAt: string
  payload: unknown
}

export default function StandaloneRealtimeTestPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEventTimestamp, setLastEventTimestamp] = useState<string | null>(null)
  const [selfTest, setSelfTest] = useState<SelfTestResult | null>(null)
  const [loadingTest, setLoadingTest] = useState(false)
  const [eventLogs, setEventLogs] = useState<EventLogItem[]>([])
  const [emitting, setEmitting] = useState<string | null>(null)

  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/+$/, '')

  const runBackendSelfTest = async () => {
    setLoadingTest(true)
    try {
      const res = await fetch(`${apiBase}/events/test`)
      const data: SelfTestResult = await res.json()
      setSelfTest(data)
    } catch (err) {
      console.error('Self test error:', err)
    } finally {
      setLoadingTest(false)
    }
  }

  useEffect(() => {
    void runBackendSelfTest()
  }, [])

  // Direct EventSource connection
  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    let retryDelay = 2000
    let isDisposed = false

    function connect() {
      if (isDisposed) return
      try {
        eventSource = new EventSource(`${apiBase}/events`)

        eventSource.onopen = () => {
          setIsConnected(true)
          retryDelay = 2000
        }

        eventSource.onmessage = (event) => {
          try {
            if (!event.data) return
            const payload = JSON.parse(event.data)
            if (payload.type === 'PING') return

            setLastEventTimestamp(payload.timestamp ?? new Date().toISOString())
            setEventLogs((prev) => [
              {
                id: `${Date.now()}-${Math.random()}`,
                type: payload.type || 'UNKNOWN',
                receivedAt: new Date().toLocaleTimeString(),
                payload: payload.payload ?? payload,
              },
              ...prev.slice(0, 25),
            ])
          } catch (err) {
            console.debug('Failed to parse SSE payload:', err)
          }
        }

        eventSource.onerror = () => {
          setIsConnected(false)
          if (eventSource) {
            eventSource.close()
            eventSource = null
          }
          if (!isDisposed) {
            reconnectTimeout = setTimeout(() => {
              retryDelay = Math.min(retryDelay * 1.5, 30000)
              connect()
            }, retryDelay)
          }
        }
      } catch (err) {
        console.warn('EventSource error:', err)
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connect, 5000)
        }
      }
    }

    connect()

    return () => {
      isDisposed = true
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    }
  }, [apiBase])

  const triggerTestEmit = async (type: string) => {
    setEmitting(type)
    try {
      await fetch(`${apiBase}/events/test-emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          payload: {
            message: `ทดสอบระบบ Real-time (${type})`,
            sender: 'Test Dashboard',
            at: new Date().toISOString(),
          },
        }),
      })
    } catch (err) {
      console.error('Trigger emit failed:', err)
    } finally {
      setEmitting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ระบบทดสอบ Real-time Synchronization (SSE Test Suite)
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              ทดสอบการเชื่อมต่อ Server-Sent Events และการกระจายข้อมูลแบบ Real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                isConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full mr-2 ${
                  isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                }`}
              />
              {isConnected ? 'SSE Live Connected' : 'Connecting to SSE...'}
            </span>
            <button
              onClick={runBackendSelfTest}
              disabled={loadingTest}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition shadow-sm"
            >
              {loadingTest ? 'กำลังทดสอบ...' : 'รัน Test ใหม่'}
            </button>
          </div>
        </div>

        {/* Backend Self-Test Result Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                1. ผลการทดสอบระดับ Backend (Automated Self-Test)
              </h2>
              <p className="text-xs text-gray-500">
                ทดสอบการทำงานของ EventsService, Stream Observable และ Validation
              </p>
            </div>
            {selfTest && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selfTest.status === 'ALL_TESTS_PASSED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {selfTest.status === 'ALL_TESTS_PASSED'
                  ? `ผ่านทุกข้อ (${selfTest.passCount}/${selfTest.totalTests}) ใน ${selfTest.durationMs}ms`
                  : 'มีบางข้อไม่ผ่าน'}
              </span>
            )}
          </div>

          {selfTest ? (
            <div className="space-y-3">
              {selfTest.results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={r.passed ? 'text-emerald-600 font-bold text-base' : 'text-rose-600 font-bold text-base'}>
                        {r.passed ? '✓' : '✗'}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{r.testName}</span>
                    </div>
                    <pre className="text-xs text-gray-500 mt-1 pl-6">
                      {typeof r.detail === 'object' ? JSON.stringify(r.detail) : String(r.detail)}
                    </pre>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                      r.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {r.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-gray-400">
              กำลังเชื่อมต่อและรันทดสอบ...
            </div>
          )}
        </div>

        {/* Interactive Trigger Buttons */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            2. จำลองส่งสัญญาณ Event แบบ Real-time (Emit Event)
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            กดปุ่มเพื่อจำลองเหตุการณ์ต่างๆ และดูสัญญาณวิ่งสดเข้าสู่ตัว Monitor ด้านล่าง
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { type: 'DOCUMENTS_CHANGED', label: '📄 เอกสารเปลี่ยน (Documents)', color: 'bg-blue-600 hover:bg-blue-700' },
              { type: 'NOTIFICATIONS_CHANGED', label: '🔔 การแจ้งเตือน (Notifications)', color: 'bg-amber-600 hover:bg-amber-700' },
              { type: 'CATEGORIES_CHANGED', label: '📁 หมวดหมู่เปลี่ยน (Categories)', color: 'bg-purple-600 hover:bg-purple-700' },
              { type: 'USERS_CHANGED', label: '👤 บัญชีผู้ใช้ (Users)', color: 'bg-teal-600 hover:bg-teal-700' },
              { type: 'ARCHIVE_CHANGED', label: '🗄️ ตู้/แฟ้ม (Archive)', color: 'bg-indigo-600 hover:bg-indigo-700' },
            ].map((btn) => (
              <button
                key={btn.type}
                onClick={() => triggerTestEmit(btn.type)}
                disabled={emitting === btn.type}
                className={`px-4 py-3 text-white text-xs font-semibold rounded-xl shadow-sm transition ${btn.color} disabled:opacity-50`}
              >
                {emitting === btn.type ? 'กำลังส่ง...' : btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Event Monitor */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                3. หน้าต่างเฝ้าดูสัญญาณสด (Live Event Monitor)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                เวลาสัญญาณล่าสุด:{' '}
                {lastEventTimestamp
                  ? new Date(lastEventTimestamp).toLocaleTimeString()
                  : 'ยังไม่มีสัญญาณ'}
              </p>
            </div>
            {eventLogs.length > 0 && (
              <button
                onClick={() => setEventLogs([])}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                ล้างประวัติ
              </button>
            )}
          </div>

          {eventLogs.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              ยังไม่มี Event เข้ามา ลองกดปุ่มทดสอบด้านบนเพื่อดูสัญญาณวิ่งสดแบบ Real-time
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {eventLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-700 font-mono">{log.type}</span>
                      <span className="text-gray-400 font-mono">[{log.receivedAt}]</span>
                    </div>
                    <pre className="text-gray-600 overflow-x-auto">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Synced
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
