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
  ShieldAlert,
  Trash2,
  User as UserIcon,
  Building,
  Calendar,
  Sparkles,
  Briefcase,
} from "lucide-react";
import { avatarColors, isAvatarImage } from "@/app/components/users/UserModals";
import { compressAndResizeAvatar } from "@/lib/dms/avatarUtils";
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the editable form with the logged-in user's profile
    setName(currentUser?.name ?? "");
    setEmail(currentUser?.email ?? "");
    setPhone(currentUser?.phone ?? "");
    setAvatarUrl(currentUser?.avatarUrl ?? "");
  }, [currentUser]);

  const role = currentUser?.role ?? "DepartmentAdmin";
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

  // â”€â”€ Password Strength (mirrors login page rules) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  type PasswordStrengthChecks = {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };

  function checkPasswordStrength(pwd: string) {
    const checks: PasswordStrengthChecks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    const score = Object.values(checks).filter(Boolean).length;

    let label = "";
    let color = "";
    let barColor = "";
    if (pwd.length > 0) {
      if (score <= 2) {
        label = "à¸­à¹ˆà¸­à¸™à¹à¸­";
        color = "text-rose-600";
        barColor = "bg-rose-500";
      } else if (score <= 4) {
        label = "à¸›à¸²à¸™à¸à¸¥à¸²à¸‡";
        color = "text-amber-600";
        barColor = "bg-amber-500";
      } else {
        label = "à¹à¸‚à¹‡à¸‡à¹à¸£à¸‡";
        color = "text-emerald-600";
        barColor = "bg-emerald-500";
      }
    }
    return { checks, score, label, color, barColor };
  }

  const passwordStrength = checkPasswordStrength(newPassword);

  // ---- Preferences state ----
  const [notifDocPending, setNotifDocPending] = useState(true);
  const [notifDocApproved, setNotifDocApproved] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ---- Avatar helpers ----
  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAndResizeAvatar(file);
      setAvatarUrl(compressed);
    } catch (err) {
      console.error("Avatar compression error:", err);
      pushToast({ title: "àºšà»à»ˆàºªàº²àº¡àº²àº”à»‚àº«àº¼àº”àº®àº¹àºšàºžàº²àºšà»„àº”à»‰", description: "àºàº°àº¥àº¸àº™àº²à»€àº¥àº·àº­àºà»„àºŸàº¥à»Œàº®àº¹àºšàºžàº²àºšàº—àºµà»ˆàº–àº·àºàº•à»‰àº­àº‡" });
    } finally {
      e.target.value = "";
    }
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
      : role === "DivisionAdmin"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";

  // ---- Handlers ----
  async function handleSaveProfile() {
    if (!name.trim() || !email.trim()) {
      pushToast({ title: "àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àºŠàº·à»ˆ à»àº¥àº° àº­àºµà»€àº¡àº§ à»ƒàº«à»‰àº„àº»àºšàº–à»‰àº§àº™" });
      return;
    }

    setSaving(true);
    setFormError(null);

    const profilePatch: { name: string; email: string; phone?: string; avatarUrl?: string } = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      avatarUrl: avatarUrl ? avatarUrl : "",
    };
    const result = await updateProfile(profilePatch);

    if (currentUserId) {
      const patch: Partial<User> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      };
      setUsers((prev) => prev.map((u) => (u.id === currentUserId ? { ...u, ...patch } : u)));
    }

    if (result.ok) {
      pushToast({ title: "àºšàº±àº™àº—àº¶àºàº‚à»à»‰àº¡àº¹àº™à»‚àº›àº£à»„àºŸàº¥à»Œàºªàº³à»€àº¥àº±àº”à»àº¥à»‰àº§" });
    } else {
      setFormError(result.error ?? "àºšàº±àº™àº—àº¶àºàºšà»à»ˆàºªàº³à»€àº¥àº±àº”");
      pushToast({ title: result.error ?? "àºšàº±àº™àº—àº¶àºàºšà»à»ˆàºªàº³à»€àº¥àº±àº”" });
    }
    setSaving(false);
  }

  async function handleUpdatePassword() {
    if (role === "DivisionAdmin" || role === "DepartmentAdmin") {
      setPasswordError("Admin àºà»ˆàº²àº à»àº¥àº° Admin àºžàº°à»àº™àº àºšà»à»ˆàºªàº²àº¡àº²àº”àº›à»ˆàº½àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àº‚àº­àº‡àº•àº»àº™à»€àº­àº‡à»„àº”à»‰");
      return;
    }

    const err: string[] = [];
    if (!currentPassword) err.push("àºàº°àº¥àº¸àº™àº²àº›à»‰àº­àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àº›àº±àº”àºˆàº¸àºšàº±àº™");
    if (!passwordStrength.checks.length) err.push("àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆàº•à»‰àº­àº‡àº¡àºµàº¢à»ˆàº²àº‡à»œà»‰àº­àº 8 à»‚àº•àº­àº±àºàºªàº­àº™");
    if (!passwordStrength.checks.lowercase) err.push("àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆàº•à»‰àº­àº‡àº­à¹ˆàº·àº•àºªàº­àº™");
    if (!passwordStrength.checks.uppercase) err.push("àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆàº•à»‰àº­àº‡àº­à¹ˆàº·àº•àºªàº­àº™àº”à¹‡àº™");
    if (!passwordStrength.checks.number) err.push("àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆàº•à»‰àº­àº‡àº•àº»àº§àº­àº±àºàºªàº­àº™");
    if (!passwordStrength.checks.special) err.push("àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆàº•à»‰àº­àº‡àº­à¹ˆàº·àº—àº±àº‚à»‡àºàº™àº²àº‡");


    if (err.length > 0) {
      setPasswordError(err.join(" â€¢ "));
      setTimeout(() => setPasswordError(""), 4000);
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await userService.updateOwnPassword(currentPassword, newPassword);
    } catch (apiErr: unknown) {
      const message = isAxiosError<{ message?: string }>(apiErr)
        ? apiErr.response?.data?.message ?? "àº­àº±àºšà»€àº”àº”àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àºšà»à»ˆàºªàº³à»€àº¥àº±àº”"
        : "àº­àº±àºšà»€àº”àº”àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àºšà»à»ˆàºªàº³à»€àº¥àº±àº”";
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
    pushToast({ title: "àº­àº±àºšà»€àº”àº”àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆàºªàº³à»€àº¥àº±àº”à»àº¥à»‰àº§", description: "àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àº‚àº­àº‡àº—à»ˆàº²àº™àº–àº·àºàº›à»ˆàº½àº™à»àº¥à»‰àº§" });
  }

  const inputBase =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  return (
    <DashboardLayout title="àºàº²àº™àº•àº±à»‰àº‡àº„à»ˆàº²àºªà»ˆàº§àº™àº•àº»àº§">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Sparkles className="h-4 w-4" />
            <span>àºšàº±àº™àºŠàºµàºœàº¹à»‰à»ƒàºŠà»‰àº‡àº²àº™</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">àºàº²àº™àº•àº±à»‰àº‡àº„à»ˆàº²àºªà»ˆàº§àº™àº•àº»àº§</h1>
          <p className="mt-1.5 text-sm sm:text-base text-gray-500">
            àºˆàº±àº”àºàº²àº™àº‚à»à»‰àº¡àº¹àº™à»‚àº›àº£à»„àºŸàº¥à»Œ, àº®àº¹àºšàºžàº²àºšàº•àº»àº§à»àº—àº™, à»àº¥àº° àº„àº§àº²àº¡àº›àº­àº”à»„àºžàº‚àº­àº‡àºšàº±àº™àºŠàºµàº‚àº­àº‡àº—à»ˆàº²àº™
          </p>
        </div>

        {/* User Hero Overview Card */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-4 text-white shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-xl font-bold text-white shadow-md ring-4 ring-white/20 ${
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
                  <h2 className="truncate text-xl font-bold">{currentUser?.name || "àºœàº¹à»‰à»ƒàºŠà»‰àº‡àº²àº™"}</h2>
                  {currentUser?.position && (
                    <span className="inline-flex items-center rounded-full bg-white/20 border border-white/30 px-2.5 py-0.5 text-xs font-semibold text-white">
                      {currentUser.position}
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm ${roleBadgeClass}`}>
                    {roleLabel(role)}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-indigo-200">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{currentUser?.email || "â€”"}</span>
                </p>
                {(division || department) && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-indigo-300">
                    <Building className="h-3.5 w-3.5" />
                    <span>{division ? `${division} â€¢ ` : ""}{department}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 sm:border-0 sm:pt-0">
              <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                <div className="text-[11px] font-medium text-indigo-200">àºªàº°àº–àº²àº™àº°àºšàº±àº™àºŠàºµ</div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>à»€àº›àºµàº”à»ƒàºŠà»‰àº‡àº²àº™àº›àº»àºàºàº°àº•àº´</span>
                </div>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                <div className="text-[11px] font-medium text-indigo-200">àº§àº±àº™àº—àºµà»€àº‚àº»à»‰àº²àº®à»ˆàº§àº¡</div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Calendar className="h-3.5 w-3.5 text-indigo-300" />
                  <span>{currentUser?.joinDate || "â€”"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 flex gap-2 border-b border-gray-200 pb-2">
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
            <span>àº‚à»à»‰àº¡àº¹àº™àºªà»ˆàº§àº™àº•àº»àº§</span>
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
            <span>àº„àº§àº²àº¡àº›àº­àº”à»„àºž & àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™</span>
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
            <span>àºàº²àº™à»àºˆà»‰àº‡à»€àº•àº·àº­àº™ & àº¥àº°àºšàº»àºš</span>
          </button>
        </div>

        {/* TAB 1: Profile Information */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">àº‚à»à»‰àº¡àº¹àº™à»‚àº›àº£à»„àºŸàº¥à»Œàº‚àº­àº‡àº—à»ˆàº²àº™</h2>
                  <p className="text-sm text-gray-500">àº­àº±àºšà»€àº”àº”àºŠàº·à»ˆ, àº­àºµà»€àº¡àº§, à»€àºšàºµà»‚àº—àº¥àº°àºªàº±àºš à»àº¥àº° àº®àº¹àºšàºžàº²àºšàº•àº»àº§à»àº—àº™</p>
                </div>
              </div>

              <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                {/* Avatar Uploader */}
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-center lg:w-64">
                  <div className="relative">
                    <div
                      className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl text-xl font-bold text-white shadow-md ring-4 ring-white ${
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
                        aria-label="àº¥àº¶àºšàº®àº¹àºš"
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
                    <span>àº­àº±àºšà»‚àº«àº¼àº”àº®àº¹àºšàºžàº²àºšà»ƒà»à»ˆ</span>
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
                    <span className="mb-2 block text-xs font-medium text-gray-500">àº«àº¼àº· à»€àº¥àº·àº­àºàºªàºµàºžàº·à»‰àº™àº«àº¼àº±àº‡:</span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {avatarColors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAvatarUrl(c)}
                          aria-label={`à»€àº¥àº·àº­àºàºªàºµ ${c}`}
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
                <div className="grid flex-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      àºŠàº·à»ˆ à»àº¥àº° àº™àº²àº¡àºªàº°àºàº¸àº™ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`${inputBase} pl-10`}
                        placeholder="àº›à»‰àº­àº™àºŠàº·à»ˆ à»àº¥àº° àº™àº²àº¡àºªàº°àºàº¸àº™"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      àº­àºµà»€àº¡àº§ <span className="text-rose-500">*</span>
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
                      à»€àºšàºµà»‚àº—àº¥àº°àºªàº±àºš
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
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">àºªàº´àº”àº™àº³à»ƒàºŠà»‰ (Role)</label>
                    <div className="flex h-[42px] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass}`}>
                        {roleLabel(role)}
                      </span>
                      <span className="text-xs text-gray-400">(àºˆàº±àº”àºàº²àº™à»‚àº”àº Admin)</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">àº•àº³à»à»œà»ˆàº‡ (Position)</label>
                    <div className="flex h-[42px] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-700">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span>{currentUser?.position || "â€”"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">àºªàº±àº‡àºàº±àº” (àºžàº°à»àº™àº / àºà»ˆàº²àº)</label>
                    <div className="flex h-[42px] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-700">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{division ? `${division} â€¢ ` : ""}{department || "àº—àº»à»ˆàº§à»„àº›"}</span>
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
                      <span>{saving ? "àºàº³àº¥àº±àº‡àºšàº±àº™àº—àº¶àº..." : "àºšàº±àº™àº—àº¶àºàºàº²àº™àº›à»ˆàº½àº™à»àº›àº‡"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: Security & Password */}
        {activeTab === "security" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">àº›à»ˆàº½àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™</h2>
                <p className="text-sm text-gray-500">àº›à»ˆàº½àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆà»€àºžàº·à»ˆàº­àº„àº§àº²àº¡àº›àº­àº”à»„àºžàº‚àº­àº‡àºšàº±àº™àºŠàºµàº—à»ˆàº²àº™</p>
              </div>
            </div>

            {(role === "DivisionAdmin" || role === "DepartmentAdmin") ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      àºšà»à»ˆàº­àº°àº™àº¸àºàº²àº”à»ƒàº«à»‰àº›à»ˆàº½àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àº”à»‰àº§àºàº•àº»àº™à»€àº­àº‡
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-amber-800">
                      àºšàº±àº™àºŠàºµàº¥àº°àº”àº±àºš {role === "DivisionAdmin" ? "Admin àºà»ˆàº²àº" : "Admin àºžàº°à»àº™àº"} àºšà»à»ˆàºªàº²àº¡àº²àº”àº›à»ˆàº½àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àº”à»‰àº§àºàº•àº»àº™à»€àº­àº‡à»„àº”à»‰àº•àº²àº¡àº™àº°à»‚àºàºšàº²àºàº„àº§àº²àº¡àº›àº­àº”à»„àºžàº‚àº­àº‡àº¥àº°àºšàº»àºš.
                      {role === "DivisionAdmin"
                        ? " àº«àº²àºàº•à»‰àº­àº‡àºàº²àº™àº›à»ˆàº½àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™ àºàº°àº¥àº¸àº™àº²àº•àº´àº”àº•à»à»ˆ àºœàº¹à»‰àº”àº¹à»àº¥àº¥àº°àºšàº»àºšàºªàº¹àº‡àºªàº¸àº” (SuperAdmin)."
                        : " àº«àº²àºàº•à»‰àº­àº‡àºàº²àº™àº›à»ˆàº½àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™ àºàº°àº¥àº¸àº™àº²àº•àº´àº”àº•à»à»ˆ Admin àºà»ˆàº²àº àº«àº¼àº· àºœàº¹à»‰àº”àº¹à»àº¥àº¥àº°àºšàº»àºšàºªàº¹àº‡àºªàº¸àº” (SuperAdmin)."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-xl space-y-4">
                {/* Current Password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™àº›àº±àº”àºˆàº¸àºšàº±àº™</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`${inputBase} pl-10 pr-10`}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆ</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputBase} pl-10 pr-10`}
                      placeholder="àº¢à»ˆàº²àº‡à»œà»‰àº­àº 8 àº•àº»àº§àº­àº±àºàºªàº­àº™"
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

                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between mb-0.5 text-xs font-medium text-gray-500">
                      <span>ຄວາມແຂ້ງກ່ອງລະຫັດຜ່ານ</span>
                      <span className={`font-semibold ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.barColor} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 flex gap-1 text-[10px]">
                      {!passwordStrength.checks.length && <span className="text-rose-500">• 8 ຕົວອັກສອນຂຶ້ນໄປ</span>}
                      {!passwordStrength.checks.lowercase && <span className="text-rose-500">• ตัวพิมพ์เล็ก</span>}
                      {!passwordStrength.checks.uppercase && <span className="text-rose-500">• ตัวพิมพ์ใหญ่</span>}
                      {!passwordStrength.checks.number && <span className="text-rose-500">• ตัวเลข</span>}
                      {!passwordStrength.checks.special && <span className="text-rose-500">• ตัวอักษรพิเศษ</span>}
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">àº¢àº·àº™àº¢àº±àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆ</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputBase} pl-10 pr-10`}
                      placeholder="àº¢àº·àº™àº¢àº±àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™à»ƒà»à»ˆàº­àºµàºàº„àº±à»‰àº‡"
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
                    <span>{isUpdatingPassword ? "àºàº³àº¥àº±àº‡àº›à»ˆàº½àº™à»àº›àº‡..." : "àº›à»ˆàº½àº™àº¥àº°àº«àº±àº”àºœà»ˆàº²àº™"}</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: Preferences */}
        {activeTab === "preferences" && (
          <div className="space-y-4">
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">àºàº²àº™à»àºˆà»‰àº‡à»€àº•àº·àº­àº™</h2>
                  <p className="text-sm text-gray-500">àº•àº±à»‰àº‡àº„à»ˆàº²àºàº²àº™àº®àº±àºšà»àºˆà»‰àº‡à»€àº•àº·àº­àº™ à»àº¥àº° àºªàº½àº‡à»ƒàº™àº¥àº°àºšàº»àºš</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">à»àºˆà»‰àº‡à»€àº•àº·àº­àº™à»€àº­àºàº°àºªàº²àº™àº¥à»àº–à»‰àº²àº­àº°àº™àº¸àº¡àº±àº”</div>
                    <div className="text-xs text-gray-500">àº®àº±àºšàºàº²àº™à»àºˆà»‰àº‡à»€àº•àº·àº­àº™à»€àº¡àº·à»ˆàº­àº¡àºµà»€àº­àºàº°àºªàº²àº™à»ƒà»à»ˆàº–àº·àºàº­àº±àºšà»‚àº«àº¼àº”àº¥à»àº–à»‰àº²àºàº§àº”àºªàº­àºš</div>
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
                    <div className="text-sm font-semibold text-gray-900">à»àºˆà»‰àº‡à»€àº•àº·àº­àº™à»€àº¡àº·à»ˆàº­à»€àº­àºàº°àºªàº²àº™àº–àº·àºàº­àº°àº™àº¸àº¡àº±àº”</div>
                    <div className="text-xs text-gray-500">àº®àº±àºšàºàº²àº™à»àºˆà»‰àº‡à»€àº•àº·àº­àº™àº—àº±àº™àº—àºµà»€àº¡àº·à»ˆàº­à»€àº­àºàº°àºªàº²àº™àº‚àº­àº‡àº—à»ˆàº²àº™àºœà»ˆàº²àº™àºàº²àº™àº­àº°àº™àº¸àº¡àº±àº”</div>
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
                    <div className="text-sm font-semibold text-gray-900">àºªàº½àº‡à»àºˆà»‰àº‡à»€àº•àº·àº­àº™à»ƒàº™àº¥àº°àºšàº»àºš</div>
                    <div className="text-xs text-gray-500">à»€àº›àºµàº”àºªàº½àº‡à»àºˆà»‰àº‡à»€àº•àº·àº­àº™à»€àº¡àº·à»ˆàº­àº¡àºµà»€àº«àº”àºàº²àº™ Real-time à»€àºàºµàº”àº‚àº¶à»‰àº™</div>
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

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">àºžàº²àºªàº²àº¥àº°àºšàº»àºš</h2>
                  <p className="text-sm text-gray-500">àºàº²àº™àºªàº°à»àº”àº‡àºœàº»àº™àºžàº²àºªàº²àº‚àº­àº‡àº¥àº°àºšàº»àºš DMS</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">ðŸ‡±ðŸ‡¦</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">àºžàº²àºªàº²àº¥àº²àº§ (Lao)</div>
                    <div className="text-xs text-gray-500">àºžàº²àºªàº²àº«àº¼àº±àºàº—àºµà»ˆà»ƒàºŠà»‰à»ƒàº™àº¥àº°àºšàº»àºšàº—àº±àº‡à»àº»àº”</div>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  à»€àº¥àº·àº­àºà»àº¥à»‰àº§
                </span>
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


