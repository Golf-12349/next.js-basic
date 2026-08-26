"use client";

import { useState } from "react";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { pushToast } from "@/app/components/ui/Toast";
import { Camera, Check, Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";

export default function SettingsPage() {
  // ---- Profile state ----
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [role] = useState<"Admin" | "Staff">("Admin");

  // ---- Security state ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ---- Handlers ----
  function handleSaveProfile() {
    if (!name.trim() || !email.trim()) return;
    pushToast({ title: "ບັນທຶກການປ່ຽນແປງສຳເລັດ", description: "ຂໍ້ມູນໂປຣໄຟລ໌ຂອງທ່ານຖືກອັບເດດແລ້ວ" });
  }

  function handleUpdatePassword() {
    const err: string[] = [];
    if (!currentPassword) err.push("ກະລຸນາປ້ອນລະຫັດຜ່ານປັດຈຸບັນ");
    if (newPassword.length < 8) err.push("ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 8 ໂຕອັກສອນ");
    if (newPassword !== confirmPassword) err.push("ລະຫັດຜ່ານໃໝ່ ແລະ ຢືນຢັນບໍ່ກົງກັນ");

    if (err.length > 0) {
      setPasswordError(err.join(" • "));
      // Clear the error after 4 seconds so the user can retype without a stale message
      setTimeout(() => setPasswordError(""), 4000);
      return;
    }

    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    pushToast({ title: "ອັບເດດລະຫັດຜ່ານສຳເລັດ", description: "ລະຫັດຜ່ານຂອງທ່ານຖືກປ່ຽນແລ້ວ" });
  }

  // ---- Shared input styling ----
  const inputBase =
    "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  return (
    <DashboardLayout title="ຕັ້ງຄ່າ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ຕັ້ງຄ່າ</h1>
          <p className="mt-1 text-sm text-gray-500">ຈັດການຂໍ້ມູນສ່ວນຕົວແລະຄວາມປອດໄພຂອງບັນຊີ</p>
        </div>

        <div className="space-y-6">
          {/* ============ Section 1: Profile ============ */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">ໂປຣໄຟລ໌ຂອງຂ້ອຍ</h2>
                <p className="text-sm text-gray-500">ຈັດການຂໍ້ມູນສ່ວນຕົວແລະຂໍ້ມູນຕິດຕໍ່ຂອງທ່ານ</p>
              </div>
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Avatar + change photo */}
              <div className="flex flex-col items-center gap-2 sm:items-start">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-2xl font-bold text-white shadow-lg shadow-indigo-600/30">
                  JD
                </div>
                <button
                  type="button"
                  className="mt-1 flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                >
                  <Camera className="h-4 w-4" />
                  ປ່ຽນຮູບ
                </button>
              </div>

              {/* Fields */}
              <div className="grid flex-1 gap-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ຊື່ ແລະ ນາມສະກຸນ</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputBase}
                    placeholder="ຊື່ ແລະ ນາມສະກຸນ"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ອີເມວ</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputBase}
                    placeholder="ອີເມວ"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ຕຳແໜ່ງ</label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        role === "Admin"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {role === "Admin" ? "ຜູ້ບໍລິຫານລະບົບ" : "ພະນັກງານ"}
                    </span>
                    <span className="text-xs text-gray-400">(ບໍ່ສາມາດແກ້ໄຂໄດ້)</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                  >
                    <Check className="h-4 w-4" />
                    ບັນທຶກການປ່ຽນແປງ
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ============ Section 2: Security ============ */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">ຄວາມປອດໄພ</h2>
                <p className="text-sm text-gray-500">ປ່ຽນລະຫັດຜ່ານເພື່ອປົກປ້ອງບັນຊີຂອງທ່ານ</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-3">
                {/* Current password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ລະຫັດຜ່ານປັດຈຸບັນ</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`${inputBase} pl-9 pr-10`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ລະຫັດຜ່ານໃໝ່</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputBase} pl-9 pr-10`}
                      placeholder="ຢ່າງໜ້ອຍ 8 ໂຕອັກສອນ"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ຢືນຢັນລະຫັດຜ່ານໃໝ່</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputBase} pl-9 pr-10`}
                      placeholder="ພິມລະຫັດຜ່ານໃໝ່ອີກຄັ້ງ"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline validation error */}
              {passwordError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {passwordError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  <Lock className="h-4 w-4" />
                  ອັບເດດລະຫັດຜ່ານ
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
}