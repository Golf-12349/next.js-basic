"use client";

import { useState } from "react";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { pushToast } from "@/app/components/ui/Toast";
import { Camera, Check, Eye, EyeOff, Lock, ShieldCheck, Trash2, User as UserIcon } from "lucide-react";
import { avatarColors, isAvatarImage } from "@/app/components/users/UserModals";
import { useUsers } from "../context/UsersContext";
import { edlStructure } from "@/types/user";
import type { User, UserRole } from "@/types/user";
import * as userService from "@/lib/dms/userService";
import { isAxiosError } from "axios";

type StoredProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  division?: string;
  avatarUrl?: string;
};

function getInitialProfile(): StoredProfile {
  if (typeof window === "undefined") {
    return { id: "", name: "", email: "", phone: "", role: "User", department: "", division: "", avatarUrl: "" };
  }
  try {
    const stored = sessionStorage.getItem("data") || localStorage.getItem("data");
    if (stored) {
      const parsed = (typeof stored === "string" ? JSON.parse(stored) : stored) as StoredProfile;
      return {
        id: parsed.id || "",
        name: parsed.name || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        role: parsed.role || "User",
        department: parsed.department || "",
        division: parsed.division || "",
        avatarUrl: parsed.avatarUrl || "",
      };
    }
  } catch {
    // fallback
  }
  return { id: "", name: "", email: "", phone: "", role: "User", department: "", division: "", avatarUrl: "" };
}

/** ຊອກຫາຝ່າຍ/ຫ້ອງການ ທີ່ພະແນກ/ສູນ ນັ້ນຂຶ້ນກັບ (EDL structure) */
function findDivisionForDepartment(dept: string): string {
  for (const [div, departments] of Object.entries(edlStructure)) {
    if (departments.includes(dept)) return div;
  }
  return "";
}

export default function SettingsPage() {
  const { setUsers } = useUsers();

  // ---- Profile state (synced with the logged-in user) ----
  const initialProfile = getInitialProfile();
  const [name, setName] = useState(initialProfile.name);
  const [email, setEmail] = useState(initialProfile.email);
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl || "");
  const role = initialProfile.role;
  const division = initialProfile.division || findDivisionForDepartment(initialProfile.department || "");
  const department = initialProfile.department || "";
  const currentUserId = initialProfile.id || undefined;

  // ---- Security state ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ---- Avatar helpers ----
  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const userInitials = (name || "JD")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel =
    role === "SuperAdmin" ? "ຜູ້ດູແລລະບົບສູງສຸດ" : role === "Admin" ? "ຜູ້ບໍລິຫານລະບົບ" : "ພະນັກງານ";
  const roleBadgeClass = role === "User" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700";

  // ---- Handlers ----
  async function handleSaveProfile() {
    if (!name.trim() || !email.trim()) {
      pushToast({ title: "ກະລຸນາປ້ອນຊື່ ແລະ ອີເມວ ໃຫ້ຄົບຖ້ວນ" });
      return;
    }

    // 1) Update session storage ("data") so Sidebar & Header reflect it immediately
    const stored = sessionStorage.getItem("data");
    const storedProfile = (typeof stored === "string" ? JSON.parse(stored) : stored) as StoredProfile;
    const nextProfile: Record<string, unknown> = {
      ...(storedProfile ?? {}),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };
    if (avatarUrl) {
      nextProfile.avatarUrl = avatarUrl;
    } else {
      delete nextProfile.avatarUrl;
    }
    sessionStorage.setItem("data", JSON.stringify(nextProfile));

    // 2) Sync the matching record in DMS context (users list) + backend
    if (currentUserId) {
      // ໃຊ້ /users/me/profile (ບໍ່ແມ່ນ PATCH /users/:id ທີ່ຕ້ອງການສິດ Admin/SuperAdmin) —
      // email ບໍ່ສົ່ງໄປ backend ໂດຍຕັ້ງໃຈ (ບໍ່ມີ column ຖາວອນ ແລະ ບໍ່ຢູ່ໃນ UpdateOwnProfileDto)
      // ຈຶ່ງຍັງເກັບ email ໄວ້ໃນ sessionStorage/local state ຢ່າງດຽວ ສ່ວນ avatarUrl ຕອນນີ້ backend ຮັບແລ້ວ
      try {
        await userService.updateOwnProfile({ name: name.trim(), phone: phone.trim(), department, avatarUrl });
      } catch (err) {
        console.warn("ບໍ່ສາມາດບັນທຶກໂປຣໄຟລ໌ຂຶ້ນ backend ໄດ້:", err);
      }
      const patch: Partial<User> = { name: name.trim(), email: email.trim(), phone: phone.trim() };
      if (avatarUrl) patch.avatarUrl = avatarUrl;
      setUsers((prev) => prev.map((u) => (u.id === currentUserId ? { ...u, ...patch } : u)));
    }

    // 3) Notify the already-mounted DashboardLayout to re-read "data" (name/avatar in Sidebar & Header)
    window.dispatchEvent(new Event("dms:user-profile-updated"));
    pushToast({ title: "ບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌ສຳເລັດແລ້ວ" });
  }

  async function handleUpdatePassword() {
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

    try {
      await userService.updateOwnPassword(currentPassword, newPassword);
    } catch (apiErr: unknown) {
      const message = isAxiosError<{ message?: string }>(apiErr)
        ? apiErr.response?.data?.message ?? "ອັບເດດລະຫັດຜ່ານບໍ່ສຳເລັດ"
        : "ອັບເດດລະຫັດຜ່ານບໍ່ສຳເລັດ";
      setPasswordError(message);
      setTimeout(() => setPasswordError(""), 4000);
      return;
    }

    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    pushToast({ title: "ອັບເດດລະຫັດຜ່ານໃໝ່ສຳເລັດແລ້ວ", description: "ລະຫັດຜ່ານຂອງທ່ານຖືກປ່ຽນແລ້ວ" });
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
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">ໂປຣໄຟລ໌ຂອງຂ້ອຍ</h2>
                <p className="text-sm text-gray-500">ຈັດການຂໍ້ມູນສ່ວນຕົວແລະຂໍ້ມູນຕິດຕໍ່ຂອງທ່ານ</p>
              </div>
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Avatar + change photo + color picker */}
              <div className="flex flex-col items-center gap-2 sm:items-start">
                <div className="relative">
                  <div
                    className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-white shadow-lg shadow-indigo-600/30 ${
                      avatarUrl && avatarUrl.startsWith("#") ? "" : "bg-gradient-to-br from-indigo-500 to-indigo-700"
                    }`}
                    style={avatarUrl && avatarUrl.startsWith("#") ? { backgroundColor: avatarUrl } : undefined}
                  >
                    {isAvatarImage(avatarUrl) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{userInitials}</span>
                    )}
                  </div>
                  {isAvatarImage(avatarUrl) && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("")}
                      aria-label="ລຶບຮູບ"
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-white shadow-sm transition-colors hover:bg-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="mt-1 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                >
                  <Camera className="h-4 w-4" />
                  ປ່ຽນຮູບ
                </label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-gray-400">ສີ:</span>
                  {avatarColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarUrl(c)}
                      aria-label={`ເລືອກສີ ${c}`}
                      className={`h-5 w-5 rounded-full border-2 transition ${
                        avatarUrl === c ? "scale-110 border-indigo-600 ring-2 ring-indigo-600/30" : "border-white shadow-sm hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ເບີໂລມົບປື໋ (ທ້ອນພົນ)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputBase}
                    placeholder="ເບີໂລມົບປື໋"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ຕຳແໜ່ງ</label>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${roleBadgeClass}`}>
                      {roleLabel}
                    </span>
                    <span className="text-xs text-gray-400">(ບໍ່ສາມາດແກ້ໄຂໄດ້)</span>
                  </div>
                </div>

                {(division || department) && (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">ຝ່າຍ / ພະແນກ</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {division && (
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
                          ຝ່າຍ: {division}
                        </span>
                      )}
                      {department && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                          ພະແນກ: {department}
                        </span>
                      )}
                    </div>
                  </div>
                )}

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