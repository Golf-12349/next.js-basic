"use client";

import { useEffect, useState } from "react";
import type { User } from "@/types/user";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { pushToast } from "@/app/components/ui/Toast";
import {
  Bell,
  Camera,
  Check,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  Building,
  Calendar,
  Sparkles,
} from "lucide-react";
import { avatarColors, isAvatarImage } from "@/app/components/users/UserModals";
import { useUsers } from "../context/UsersContext";
import { useCurrentUser } from "@/app/(main)/context/CurrentUserContext";
import { edlStructure, roleLabel } from "@/types/user";
import * as userService from "@/lib/dms/userService";
import { isAxiosError } from "axios";

/** Search division for department in EDL structure */
function findDivisionForDepartment(dept: string): string {
  for (const [div, departments] of Object.entries(edlStructure)) {
    if (departments.includes(dept)) return div;
  }
  return "";
}

type TabKey = "profile" | "security" | "preferences";

export default function PersonalProfilePage() {
  const { setUsers } = useUsers();
  const { user: currentUser, updateProfile } = useCurrentUser();

  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  // ---- Profile state ----
  const [name, setName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync form when currentUser changes
  useEffect(() => {
    setName(currentUser?.name ?? "");
    setEmail(currentUser?.email ?? "");
    setPhone(currentUser?.phone ?? "");
    setAvatarUrl(currentUser?.avatarUrl ?? "");
  }, [currentUser]);

  const role = currentUser?.role ?? "User";
  const division = currentUser?.division || findDivisionForDepartment(currentUser?.department || "");
  const department = currentUser?.department || "";
  const currentUserId = currentUser?.id;

  // ---- Security state ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ---- Preferences state ----
  const [notifDocPending, setNotifDocPending] = useState(true);
  const [notifDocApproved, setNotifDocApproved] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  const roleBadgeClass =
    role === "SuperAdmin"
      ? "bg-purple-100 text-purple-700 border-purple-200"
      : role === "Admin"
      ? "bg-indigo-100 text-indigo-700 border-indigo-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";

  // ---- Handlers ----
  async function handleSaveProfile() {
    if (!name.trim() || !email.trim()) {
      pushToast({ title: "ກະລຸນາປ້ອນຊື່ ແລະ ອີເມວ ໃຫ້ຄົບຖ້ວນ" });
      return;
    }

    setSaving(true);
    setFormError(null);

    const profilePatch: { name: string; email: string; phone?: string; avatarUrl?: string } = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
    };
    const result = await updateProfile(profilePatch);

    if (currentUserId) {
      try {
        await userService.updateOwnProfile({ name: name.trim(), phone: phone.trim(), department, avatarUrl });
      } catch (err) {
        console.warn("ບໍ່ສາມາດບັນທຶກໂປຣໄຟລ໌ຂຶ້ນ backend ໄດ້:", err);
      }
      const patch: Partial<User> = { name: name.trim(), email: email.trim(), phone: phone.trim() };
      if (avatarUrl) patch.avatarUrl = avatarUrl;
      setUsers((prev) => prev.map((u) => (u.id === currentUserId ? { ...u, ...patch } : u)));
    }

    if (result.ok) {
      pushToast({ title: "ບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌ສຳເລັດແລ້ວ" });
    } else {
      setFormError(result.error ?? "ບັນທຶກບໍ່ສຳເລັດ");
      pushToast({ title: result.error ?? "ບັນທຶກບໍ່ສຳເລັດ" });
    }
    setSaving(false);
  }

  async function handleUpdatePassword() {
    const err: string[] = [];
    if (!currentPassword) err.push("ກະລຸນາປ້ອນລະຫັດຜ່ານປັດຈຸບັນ");
    if (newPassword.length < 8) err.push("ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 8 ໂຕອັກສອນ");
    if (newPassword !== confirmPassword) err.push("ລະຫັດຜ່ານໃໝ່ ແລະ ຢືນຢັນບໍ່ກົງກັນ");

    if (err.length > 0) {
      setPasswordError(err.join(" • "));
      setTimeout(() => setPasswordError(""), 4000);
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await userService.updateOwnPassword(currentPassword, newPassword);
    } catch (apiErr: unknown) {
      const message = isAxiosError<{ message?: string }>(apiErr)
        ? apiErr.response?.data?.message ?? "ອັບເດດລະຫັດຜ່ານບໍ່ສຳເລັດ"
        : "ອັບເດດລະຫັດຜ່ານບໍ່ສຳເລັດ";
      setPasswordError(message);
      setTimeout(() => setPasswordError(""), 4000);
      setIsUpdatingPassword(false);
      return;
    }

    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsUpdatingPassword(false);
    pushToast({ title: "ອັບເດດລະຫັດຜ່ານໃໝ່ສຳເລັດແລ້ວ", description: "ລະຫັດຜ່ານຂອງທ່ານຖືກປ່ຽນແລ້ວ" });
  }

  const inputBase =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  return (
    <DashboardLayout title="ການຕັ້ງຄ່າສ່ວນຕົວ">
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Sparkles className="h-4 w-4" />
            <span>ບັນຊີຜູ້ໃຊ້ງານ</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">ການຕັ້ງຄ່າສ່ວນຕົວ</h1>
          <p className="mt-1 text-sm text-gray-500">
            ຈັດການຂໍ້ມູນໂປຣໄຟລ໌, ຮູບພາບຕົວແທນ, ແລະ ຄວາມປອດໄພຂອງບັນຊີຂອງທ່ານ
          </p>
        </div>

        {/* User Hero Overview Card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div
                  className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-2xl font-bold text-white shadow-md ring-4 ring-white/20 ${
                    avatarUrl && avatarUrl.startsWith("#") ? "" : "bg-indigo-600"
                  }`}
                  style={avatarUrl && avatarUrl.startsWith("#") ? { backgroundColor: avatarUrl } : undefined}
                >
                  {isAvatarImage(avatarUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{userInitials}</span>
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-bold sm:text-2xl">{currentUser?.name || "ຜູ້ໃຊ້ງານ"}</h2>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm ${roleBadgeClass}`}>
                    {roleLabel(role)}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-indigo-200">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{currentUser?.email || "—"}</span>
                </p>
                {(division || department) && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-indigo-300">
                    <Building className="h-3.5 w-3.5" />
                    <span>{division ? `${division} • ` : ""}{department}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 sm:border-0 sm:pt-0">
              <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                <div className="text-[11px] font-medium text-indigo-200">ສະຖານະບັນຊີ</div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>ເປີດໃຊ້ງານປົກກະຕິ</span>
                </div>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                <div className="text-[11px] font-medium text-indigo-200">ວັນທີເຂົ້າຮ່ວມ</div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Calendar className="h-3.5 w-3.5 text-indigo-300" />
                  <span>{currentUser?.joinDate || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "profile"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>ຂໍ້ມູນສ່ວນຕົວ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "security"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>ຄວາມປອດໄພ & ລະຫັດຜ່ານ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "preferences"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>ການແຈ້ງເຕືອນ & ລະບົບ</span>
          </button>
        </div>

        {/* TAB 1: Profile Information */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">ຂໍ້ມູນໂປຣໄຟລ໌ຂອງທ່ານ</h2>
                  <p className="text-sm text-gray-500">ອັບເດດຊື່, ອີເມວ, ເບີໂທລະສັບ ແລະ ຮູບພາບຕົວແທນ</p>
                </div>
              </div>

              <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                {/* Avatar Uploader */}
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-6 text-center lg:w-64">
                  <div className="relative">
                    <div
                      className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl text-2xl font-bold text-white shadow-md ring-4 ring-white ${
                        avatarUrl && avatarUrl.startsWith("#") ? "" : "bg-gradient-to-br from-indigo-500 to-indigo-700"
                      }`}
                      style={avatarUrl && avatarUrl.startsWith("#") ? { backgroundColor: avatarUrl } : undefined}
                    >
                      {isAvatarImage(avatarUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
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
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-white shadow-sm hover:bg-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <label
                    htmlFor="avatar-upload-profile"
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>ອັບໂຫຼດຮູບພາບໃໝ່</span>
                  </label>
                  <input
                    id="avatar-upload-profile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />

                  {/* Preset Colors */}
                  <div className="mt-2 w-full border-t border-gray-200 pt-3">
                    <span className="mb-2 block text-xs font-medium text-gray-500">ຫຼື ເລືອກສີພື້ນຫຼັງ:</span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {avatarColors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAvatarUrl(c)}
                          aria-label={`ເລືອກສີ ${c}`}
                          className={`h-6 w-6 rounded-full border-2 transition ${
                            avatarUrl === c
                              ? "scale-110 border-indigo-600 ring-2 ring-indigo-600/30"
                              : "border-white shadow-sm hover:scale-105"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid flex-1 gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      ຊື່ ແລະ ນາມສະກຸນ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`${inputBase} pl-10`}
                        placeholder="ປ້ອນຊື່ ແລະ ນາມສະກຸນ"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      ອີເມວ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`${inputBase} pl-10`}
                        placeholder="name@edl.com.la"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      ເບີໂທລະສັບ
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`${inputBase} pl-10`}
                        placeholder="020 XXXXXXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">ຕຳແໜ່ງ (Role)</label>
                    <div className="flex h-[42px] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass}`}>
                        {roleLabel(role)}
                      </span>
                      <span className="text-xs text-gray-400">(ຈັດການໂດຍ Admin)</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">ສັງກັດ (ພະແນກ / ຝ່າຍ)</label>
                    <div className="flex h-[42px] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-700">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{division ? `${division} • ` : ""}{department || "ທົ່ວໄປ"}</span>
                    </div>
                  </div>

                  {formError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700 md:col-span-2">
                      {formError}
                    </div>
                  )}

                  <div className="flex justify-end pt-4 md:col-span-2">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" />
                      <span>{saving ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກການປ່ຽນແປງ"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: Security & Password */}
        {activeTab === "security" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">ປ່ຽນລະຫັດຜ່ານ</h2>
                <p className="text-sm text-gray-500">ປ່ຽນລະຫັດຜ່ານໃໝ່ເພື່ອຄວາມປອດໄພຂອງບັນຊີທ່ານ</p>
              </div>
            </div>

            <div className="max-w-xl space-y-5">
              {/* Current Password */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">ລະຫັດຜ່ານປັດຈຸບັນ</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`${inputBase} pl-10 pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">ລະຫັດຜ່ານໃໝ່</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${inputBase} pl-10 pr-10`}
                    placeholder="ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">ຢືນຢັນລະຫັດຜ່ານໃໝ່</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputBase} pl-10 pr-10`}
                    placeholder="ຢືນຢັນລະຫັດຜ່ານໃໝ່ອີກຄັ້ງ"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                  {passwordError}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Lock className="h-4 w-4" />
                  <span>{isUpdatingPassword ? "ກຳລັງປ່ຽນແປງ..." : "ປ່ຽນລະຫັດຜ່ານ"}</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: Preferences */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">ການແຈ້ງເຕືອນ</h2>
                  <p className="text-sm text-gray-500">ຕັ້ງຄ່າການຮັບແຈ້ງເຕືອນ ແລະ ສຽງໃນລະບົບ</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">ແຈ້ງເຕືອນເອກະສານລໍຖ້າອະນຸມັດ</div>
                    <div className="text-xs text-gray-500">ຮັບການແຈ້ງເຕືອນເມື່ອມີເອກະສານໃໝ່ຖືກອັບໂຫຼດລໍຖ້າກວດສອບ</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={notifDocPending}
                      onChange={(e) => setNotifDocPending(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">ແຈ້ງເຕືອນເມື່ອເອກະສານຖືກອະນຸມັດ</div>
                    <div className="text-xs text-gray-500">ຮັບການແຈ້ງເຕືອນທັນທີເມື່ອເອກະສານຂອງທ່ານຜ່ານການອະນຸມັດ</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={notifDocApproved}
                      onChange={(e) => setNotifDocApproved(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">ສຽງແຈ້ງເຕືອນໃນລະບົບ</div>
                    <div className="text-xs text-gray-500">ເປີດສຽງແຈ້ງເຕືອນເມື່ອມີເຫດການ Real-time ເກີດຂຶ້ນ</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">ພາສາລະບົບ</h2>
                  <p className="text-sm text-gray-500">ການສະແດງຜົນພາສາຂອງລະບົບ DMS</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇱🇦</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">ພາສາລາວ (Lao)</div>
                    <div className="text-xs text-gray-500">ພາສາຫຼັກທີ່ໃຊ້ໃນລະບົບທັງໝົດ</div>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  ເລືອກແລ້ວ
                </span>
              </div>
            </section>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

