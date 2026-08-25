"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { pushToast } from "@/app/components/ui/Toast";
import secureLocalStorage from "react-secure-storage";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Camera,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

export default function SettingsPage() {
  // ---- Profile state ----
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [department] = useState("ຝ່າຍເຕັກໂນໂລຊີ & ບໍລິຫານລະບົບ");
  const [position] = useState("ຜູ້ບໍລິຫານລະບົບ (SuperAdmin)");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileError, setProfileError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Security state ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Load existing profile if stored
  useEffect(() => {
    try {
      const stored = secureLocalStorage.getItem("data");
      if (stored && typeof stored === "object") {
        const parsed = stored as { name?: string; email?: string };
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
      }
    } catch {
      // fallback to initial state
    }
  }, []);

  // Compute initials from current name
  const initials =
    name
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "JD";

  // ---- Avatar Upload Handler ----
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setProfileError("ຂະໜາດຮູບພາບຕ້ອງບໍ່ເກີນ 2MB");
        setTimeout(() => setProfileError(""), 4000);
        return;
      }
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      pushToast({ title: "ອັບໂຫຼດຮູບໂປຣໄຟລ໌ສຳເລັດແລ້ວ" });
    }
  }

  // ---- Handlers ----
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");

    if (!name.trim()) {
      setProfileError("ກະລຸນາປ້ອນຊື່ ແລະ ນາມສະກຸນ");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setProfileError("ກະລຸນາປ້ອນອີເມວທີ່ຖືກຕ້ອງ (ຕົວຢ່າງ: name@domain.com)");
      return;
    }

    setIsSavingProfile(true);

    try {
      // Simulate network request
      await new Promise((res) => setTimeout(res, 600));

      // Persist in secure storage
      const stored = (secureLocalStorage.getItem("data") || {}) as Record<string, unknown>;
      secureLocalStorage.setItem("data", {
        ...stored,
        name: name.trim(),
        email: email.trim(),
      });

      pushToast({
        title: "ບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌ສຳເລັດແລ້ວ",
        description: "ຂໍ້ມູນໂປຣໄຟລ໌ຂອງທ່ານຖືກອັບເດດຮຽບຮ້ອຍແລ້ວ",
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    const err: string[] = [];
    if (!currentPassword.trim()) {
      err.push("ກະລຸນາປ້ອນລະຫັດຜ່ານປັດຈຸບັນ");
    }
    if (newPassword.length < 8) {
      err.push("ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 8 ໂຕອັກສອນ");
    }
    if (newPassword !== confirmPassword) {
      err.push("ລະຫັດຜ່ານໃໝ່ ແລະ ຢືນຢັນລະຫັດຜ່ານບໍ່ກົງກັນ");
    }

    if (err.length > 0) {
      setPasswordError(err.join(" • "));
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // Simulate password change request
      await new Promise((res) => setTimeout(res, 700));

      setPasswordError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      pushToast({
        title: "ອັບເດດລະຫັດຜ່ານໃໝ່ສຳເລັດແລ້ວ",
        description: "ລະຫັດຜ່ານຂອງທ່ານຖືກປ່ຽນຮຽບຮ້ອຍແລ້ວ",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  // ---- Shared input styling ----
  const inputBase =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
  const disabledInputBase =
    "w-full rounded-xl border border-gray-200 bg-gray-100/80 px-3.5 py-2.5 text-sm text-gray-500 cursor-not-allowed shadow-none select-none";

  return (
    <DashboardLayout title="ຕັ້ງຄ່າ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ຕັ້ງຄ່າບັນຊີ</h1>
          <p className="mt-1 text-sm text-gray-500">
            ຈັດການຂໍ້ມູນສ່ວນຕົວ, ໂປຣໄຟລ໌ ແລະ ຄວາມປອດໄພຂອງບັນຊີຂອງທ່ານ
          </p>
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
                <p className="text-sm text-gray-500">
                  ຈັດການຂໍ້ມູນສ່ວນຕົວ ແລະ ຂໍ້ມູນຕິດຕໍ່ຂອງທ່ານ
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                {/* Avatar + Change Photo */}
                <div className="flex flex-col items-center gap-3 self-center lg:self-start">
                  <div className="relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar Preview"
                        className="h-24 w-24 rounded-full object-cover shadow-md ring-4 ring-indigo-50"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-2xl font-bold text-white shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-50">
                        {initials}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition-transform hover:scale-105 hover:bg-indigo-700 focus:outline-none"
                      title="ປ່ຽນຮູບໂປຣໄຟລ໌"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    ປ່ຽນຮູບໂປຣໄຟລ໌
                  </button>
                </div>

                {/* Form Fields */}
                <div className="grid flex-1 gap-5 md:grid-cols-2">
                  {/* Name (Editable, Required) */}
                  <div className="md:col-span-1">
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      ຊື່ ແລະ ນາມສະກຸນ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (profileError) setProfileError("");
                        }}
                        className={`${inputBase} pl-10`}
                        placeholder="ຊື່ ແລະ ນາມສະກຸນ"
                      />
                    </div>
                  </div>

                  {/* Email (Editable, Required) */}
                  <div className="md:col-span-1">
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      ອີເມວ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (profileError) setProfileError("");
                        }}
                        className={`${inputBase} pl-10`}
                        placeholder="example@dms.gov.la"
                      />
                    </div>
                  </div>

                  {/* Department (Read-only / Disabled) */}
                  <div className="md:col-span-1">
                    <div className="flex items-center justify-between">
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        ພະແນກ / ຝ່າຍ
                      </label>
                      <span className="text-xs text-gray-400 font-medium">(ບໍ່ສາມາດແກ້ໄຂໄດ້)</span>
                    </div>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        disabled
                        readOnly
                        value={department}
                        className={`${disabledInputBase} pl-10`}
                      />
                    </div>
                  </div>

                  {/* Position (Read-only / Disabled) */}
                  <div className="md:col-span-1">
                    <div className="flex items-center justify-between">
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        ຕຳແໜ່ງ / ສິດການໃຊ້ງານ
                      </label>
                      <span className="text-xs text-gray-400 font-medium">(ບໍ່ສາມາດແກ້ໄຂໄດ້)</span>
                    </div>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        disabled
                        readOnly
                        value={position}
                        className={`${disabledInputBase} pl-10`}
                      />
                    </div>
                  </div>

                  {/* Inline Profile Error */}
                  {profileError && (
                    <div className="md:col-span-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="md:col-span-2 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          ກຳລັງບັນທຶກ...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          ບັນທຶກການປ່ຽນແປງ
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </section>

          {/* ============ Section 2: Security & Password ============ */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">ຄວາມປອດໄພ & ລະຫັດຜ່ານ</h2>
                <p className="text-sm text-gray-500">
                  ປ່ຽນລະຫັດຜ່ານຂອງທ່ານເພື່ອປົກປ້ອງຄວາມປອດໄພຂອງບັນຊີ
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-3">
                {/* Current password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    ລະຫັດຜ່ານປັດຈຸບັນ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showCurrent ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      className={`${inputBase} pl-10 pr-10`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                      aria-label={showCurrent ? "ເຊື່ອງລະຫັດຜ່ານ" : "ສະແດງລະຫັດຜ່ານ"}
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    ລະຫັດຜ່ານໃໝ່ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showNew ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      className={`${inputBase} pl-10 pr-10`}
                      placeholder="ຢ່າງໜ້ອຍ 8 ໂຕອັກສອນ"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                      aria-label={showNew ? "ເຊື່ອງລະຫັດຜ່ານ" : "ສະແດງລະຫັດຜ່ານ"}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    ຢືນຢັນລະຫັດຜ່ານໃໝ່ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      className={`${inputBase} pl-10 pr-10`}
                      placeholder="ພິມລະຫັດຜ່ານໃໝ່ອີກຄັ້ງ"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                      aria-label={showConfirm ? "ເຊື່ອງລະຫັດຜ່ານ" : "ສະແດງລະຫັດຜ່ານ"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline validation error */}
              {passwordError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      ກຳລັງອັບເດດ...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      ອັບເດດລະຫັດຜ່ານ
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
}