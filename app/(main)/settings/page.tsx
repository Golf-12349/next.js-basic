"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { useCurrentUser } from "@/app/(main)/context/CurrentUserContext";
import { useRealtime } from "@/app/(main)/context/RealtimeContext";
import { pushToast } from "@/app/components/ui/Toast";
import {
  Activity,
  Archive,
  CheckCircle2,
  Database,
  FileText,
  HardDrive,
  Save,
  Server,
  Settings,
  ShieldAlert,
  User,
  Users,
  Wifi,
} from "lucide-react";

export default function SystemSettingsPage() {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const { isConnected } = useRealtime();

  // If normal user, redirect to their personal profile
  useEffect(() => {
    if (currentUser && currentUser.role !== "SuperAdmin" && currentUser.role !== "Admin") {
      router.replace("/profile");
    }
  }, [currentUser, router]);

  // System configuration state
  const [orgName, setOrgName] = useState("ລັດວິສາຫະກິດໄຟຟ້າລາວ (EDL)");
  const [systemTitle, setSystemTitle] = useState("ລະບົບຄຸ້ມຄອງເອກະສານ (DMS)");
  const [contactEmail, setContactEmail] = useState("admin@edl.com.la");
  const [docPrefix, setDocPrefix] = useState("DOC");
  const [maxUploadSizeMB, setMaxUploadSizeMB] = useState("20");
  const [saving, setSaving] = useState(false);

  function handleSaveSystemSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      pushToast({ title: "ບັນທຶກການຕັ້ງຄ່າລະບົບສຳເລັດແລ້ວ" });
    }, 400);
  }

  const inputBase =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  return (
    <DashboardLayout title="ຕັ້ງຄ່າລະບົບ">
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
              <Settings className="h-4 w-4" />
              <span>ການຕັ້ງຄ່າສ່ວນກາງ</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">ຕັ້ງຄ່າລະບົບ</h1>
            <p className="mt-1 text-sm text-gray-500">
              ກຳນົດຄ່າທົ່ວໄປ, ສະຖານະເຊີບເວີ, ແລະ ການເຊື່ອມຕໍ່ລະບົບ DMS (ສະເພາະ Admin)
            </p>
          </div>

          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <User className="h-4 w-4 text-indigo-600" />
            <span>ໄປທີ່ການຕັ້ງຄ່າສ່ວນຕົວ →</span>
          </Link>
        </div>

        {/* System Health Status Banner */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">ສະຖານະ Real-time</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isConnected ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                <Wifi className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-rose-500 animate-ping"}`}></span>
              <span className="text-sm font-bold text-gray-900">{isConnected ? "Online (SSE ເຊື່ອມຕໍ່ແລ້ວ)" : "Connecting..."}</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Server-Sent Events /api/events</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">ຖານຂໍ້ມູນ</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-bold text-gray-900">PostgreSQL (Prisma)</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">ເຊື່ອມຕໍ່ປົກກະຕິ</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">ບ່ອນເກັບໄຟລ໌</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <HardDrive className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-bold text-gray-900">Supabase Storage</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Private Bucket / Signed URLs</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">ເວີຊັນລະບົບ</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Server className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-sm font-bold text-gray-900">DMS v2.0 (NestJS + Next.js)</div>
            <p className="mt-1 text-xs text-gray-400">RBAC + Real-time Sync</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* General Config Form */}
          <form onSubmit={handleSaveSystemSettings} className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">ຂໍ້ມູນອົງກອນ & ລະບົບ</h2>
                  <p className="text-sm text-gray-500">ກຳນົດຊື່ອົງກອນ ແລະ ຂໍ້ມູນຕິດຕໍ່ຫຼັກ</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ຊື່ອົງກອນ / ບໍລິສັດ</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ຊື່ລະບົບ (System Name)</label>
                  <input
                    type="text"
                    value={systemTitle}
                    onChange={(e) => setSystemTitle(e.target.value)}
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ອີເມວຕິດຕໍ່ຜູ້ດູແລລະບົບ</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={inputBase}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">ຮູບແບບເລກທີເອກະສານ Prefix</label>
                    <input
                      type="text"
                      value={docPrefix}
                      onChange={(e) => setDocPrefix(e.target.value)}
                      className={inputBase}
                      placeholder="DOC"
                    />
                    <p className="mt-1 text-xs text-gray-400">ຕົວຢ່າງ: {docPrefix}-2026-001</p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">ຂະໜາດໄຟລ໌ສູງສຸດ (MB)</label>
                    <input
                      type="number"
                      value={maxUploadSizeMB}
                      onChange={(e) => setMaxUploadSizeMB(e.target.value)}
                      className={inputBase}
                      min="1"
                      max="100"
                    />
                    <p className="mt-1 text-xs text-gray-400">ກຳນົດສູງສຸດ 20MB ຕາມມາດຕະຖານ</p>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກການຕັ້ງຄ່າ"}</span>
                  </button>
                </div>
              </div>
            </section>
          </form>

          {/* Quick Management Shortcuts */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
                ທາງລັດການຈັດການລະບົບ
              </h3>
              <div className="space-y-3">
                <Link
                  href="/users"
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-colors hover:bg-indigo-50/50 hover:border-indigo-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">ຈັດການຜູ້ໃຊ້ງານທັງໝົດ</div>
                      <div className="text-xs text-gray-500">ກຳນົດສິດ (RBAC), ເພີ່ມ, ແກ້ໄຂ, ລຶບຜູ້ໃຊ້</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">ເປີດ →</span>
                </Link>

                <Link
                  href="/documents/archive"
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-colors hover:bg-indigo-50/50 hover:border-indigo-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Archive className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">ຄັງເກັບເອກະສານ & ຕູ້</div>
                      <div className="text-xs text-gray-500">ຈັດການຕູ້, ແຟ້ມ, ແລະ ການຈັດໝວດໝູ່</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">ເປີດ →</span>
                </Link>

                <Link
                  href="/documents"
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-colors hover:bg-indigo-50/50 hover:border-indigo-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">ເອກະສານ & ໝວດໝູ່</div>
                      <div className="text-xs text-gray-500">ເບິ່ງເອກະສານ ແລະ ຈັດການໝວດໝູ່</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">ເປີດ →</span>
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">ຄວາມປອດໄພລະບົບ</h4>
                  <p className="mt-1 text-xs text-amber-700">
                    ການແກ້ໄຂການຕັ້ງຄ່າລະບົບນີ້ຈະມີຜົນຕໍ່ຜູ້ໃຊ້ທັງໝົດໃນອົງກອນ ກະລຸນາກວດສອບຄວາມຖືກຕ້ອງກ່ອນບັນທຶກ
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}