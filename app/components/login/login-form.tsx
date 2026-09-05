"use client";
import React, { useEffect, useState } from "react";
import apiClient from "@/config/axiosClient";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

type LoginTab = "email" | "phone";

type LoginForm = {
  email: string;
  password: string;
};

type LoginErrors = {
  email?: string | null;
  password?: string | null;
  terms?: string | null;
};

type PasswordStrengthChecks = {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
};

type SubmitStatus = "success" | "error" | null;

type APIResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    department?: string | null;
    division?: string | null;
    avatarUrl?: string | null;
  };
};

type APIErrorResponse = {
  message?: string | string[];
  error?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_FORMAT_ERROR =
  "ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ (ຕົວຢ່າງ: name@gmail.com)";
const DEFAULT_ERROR_MESSAGE = "ການເຂົ້າສູ່ລະບົບລົ້ມເຫຼວ";
const RATE_LIMIT_ERROR =
  "ທ່ານປ້ອນລະຫັດຜິດຫຼາຍຄັ້ງເກີນໄປ, ກະລຸນາລໍຖ້າຈັກໜ່ອຍແລ້ວລອງໃໝ່";
const RATE_LIMIT_MESSAGE_KEYWORDS = ["throttlerexception", "too many requests"];
const COOLDOWN_SECONDS = 30;

// ── Typed error helpers (no untyped `any`) ──────────────────
function getErrorMessage(error: unknown): string {
  if (isAxiosError<APIErrorResponse>(error)) {
    const data = error.response?.data;
    if (data && typeof data.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }
    if (data && Array.isArray(data.message) && data.message.length > 0) {
      return data.message.join(", ");
    }
    if (data && typeof data.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return DEFAULT_ERROR_MESSAGE;
}

function isRateLimitError(error: unknown, message: string): boolean {
  if (isAxiosError<APIErrorResponse>(error) && error.response?.status === 429) {
    return true;
  }
  const normalized = message.toLowerCase();
  return RATE_LIMIT_MESSAGE_KEYWORDS.some((keyword) =>
    normalized.includes(keyword)
  );
}

// ── Floating glass notification bubble (purely visual) ───────
function GlassBubble({
  icon,
  title,
  subtitle,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={`dms-bubble pointer-events-none absolute flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-xl shadow-blue-500/10 backdrop-blur-xl ${className}`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-blue-600">
        {icon}
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-700">{title}</div>
        {subtitle && (
          <div className="mt-0.5 text-[10px] font-medium text-slate-400">{subtitle}</div>
        )}
      </div>
    </div>
  );
}

export default function LoginForm() {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<LoginTab>("email");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds === 0) return;

    const intervalId = window.setInterval(() => {
      setCooldownSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [cooldownSeconds]);

  // ── Password Strength Checker ──────────────────────────────
  const checkPasswordStrength = (pwd: string) => {
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
        label = "ອ່ອນ";
        color = "text-rose-600";
        barColor = "bg-rose-500";
      } else if (score <= 4) {
        label = "ປານກາງ";
        color = "text-amber-600";
        barColor = "bg-amber-500";
      } else {
        label = "ແຂງແຮງ";
        color = "text-emerald-600";
        barColor = "bg-emerald-500";
      }
    }
    return { checks, score, label, color, barColor };
  };

  const strength = checkPasswordStrength(form.password);

  const handleChange =
    (field: keyof LoginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
      if (submitStatus) setSubmitStatus(null);
    };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};
    const email = form.email.trim();
    if (!email || !EMAIL_PATTERN.test(email)) {
      newErrors.email = EMAIL_FORMAT_ERROR;
    }
    if (!acceptedTerms) {
      newErrors.terms =
        "ກະລຸນາຍອມຮັບເງື່ອນໄຂການນຳໃຊ້ ແລະ ນະໂຍບາຍຄວາມປອດໄພ";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Handle Submit (API Integration) ────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitStatus(null);

    if (cooldownSeconds > 0) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<APIResponse>("/auth/login", form);

      if (![200, 201].includes(response.status)) {
        throw new Error("ການເຂົ້າສູ່ລະບົບລົ້ມເຫຼວ");
      }

      const { accessToken, user } = response.data;

      if (!accessToken || !user) {
        throw new Error("ການເຂົ້າສູ່ລະບົບລົ້ມເຫຼວ");
      }

      toast.dismiss();
      toast.success("ເຂົ້າສູ່ລະບົບສຳເລັດ");
      // Save session in sessionStorage so closing the tab auto-logs out
      sessionStorage.setItem("token", accessToken);
      sessionStorage.setItem("data", JSON.stringify(user));

      setSubmitStatus("success");
      window.location.replace('/dashboard');
    } catch (err: unknown) {
      console.error("Login failed:", err);

      // Type-safe extraction of the API error message (no untyped `any`).
      const errorMessage = getErrorMessage(err);

      // Dismiss any existing toasts to avoid stacked popups.
      toast.dismiss();

      // Detect 429 / NestJS ThrottlerException / "Too Many Requests".
      if (isRateLimitError(err, errorMessage)) {
        setCooldownSeconds(COOLDOWN_SECONDS);
        toast.error(RATE_LIMIT_ERROR);
      } else {
        toast.error(errorMessage);
        setSubmitStatus("error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-tr from-blue-50 via-indigo-50/40 to-slate-100 font-sans text-slate-900">
      {/* ── Fluid gradient background blobs (soft light-blue / indigo / purple glow) ── */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="dms-blob absolute -left-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-gradient-to-br from-blue-200/70 via-sky-200/60 to-indigo-300/50 blur-3xl" />
        <div className="dms-blob dms-blob-delayed absolute -right-40 top-1/3 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-indigo-200/60 via-violet-200/50 to-purple-300/40 blur-3xl" />
        <div className="dms-blob-reverse absolute -bottom-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-sky-100/80 via-cyan-200/50 to-blue-300/40 blur-3xl" />
        <div className="dms-blob dms-blob-delayed absolute -left-32 top-1/2 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-tr from-white/30 via-transparent to-indigo-100/20"
        aria-hidden="true"
      />

      <div className="relative z-10 grid min-h-screen w-full lg:grid-cols-2">
        {/* ── ຝັ່ງຊ້າຍ: Brand identity + floating glass bubbles ── */}
        <div className="relative hidden min-h-screen flex-col justify-between p-10 lg:flex lg:p-16 xl:p-20">
          {/* Top-left logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
              <FolderOpen size={22} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900">DMS</div>
              <div className="text-[11px] font-medium tracking-wide text-slate-500">
                Document Management System
              </div>
            </div>
          </div>

          {/* Center title + floating bubbles */}
          <div className="relative my-auto max-w-lg pb-28">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur-md">
              <Sparkles size={14} className="text-blue-500" />
              ລະບົບຈັດການເອກະສານ 3 ລະດັບ
            </div>

            <h1 className="text-7xl font-black italic tracking-tight text-slate-900 xl:text-8xl">
              DMS
            </h1>
            <p className="mt-4 max-w-md text-xl font-semibold leading-snug text-slate-800">
              THE FUTURE OF{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                DOCUMENT MANAGEMENT
              </span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
              ເກັບຮັກສາ · ກວດສອບ · ອະນຸມັດ ໃນແພລດຟອມດຽວ ຢ່າງປອດໄພ ແລະ ທັນສະໄໝ
            </p>

            {/* Floating glass bubbles */}
            <GlassBubble
              icon={<ShieldCheck size={18} />}
              title="ກວດສອບຄວາມປອດໄພ"
              subtitle="256-bit SSL Encryption"
              className="right-0 top-0 lg:-right-6"
            />
            <div className="dms-bubble dms-bubble-delay-1 pointer-events-none absolute right-10 top-24 hidden flex-col items-end gap-1.5 rounded-2xl rounded-tr-sm border border-white/60 bg-white/70 px-4 py-3 shadow-xl shadow-blue-500/10 backdrop-blur-xl sm:flex lg:-right-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <FileText size={15} className="text-indigo-500" />
                DMS-2026-088.pdf
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                <CheckCircle2 size={12} />
                ສຳເລັດ
              </div>
            </div>
            <GlassBubble
              icon={<CheckCircle2 size={18} />}
              title="ເອກະສານໄດ້ຮັບການອະນຸມັດ"
              subtitle="SuperAdmin · ບໍ່ດົນມານີ້"
              className="bottom-6 left-4 lg:left-0"
            />
            <div className="dms-bubble dms-bubble-delay-2 pointer-events-none absolute bottom-32 right-16 hidden xl:block">
              <div className="rounded-2xl rounded-br-sm border border-white/60 bg-white/70 px-4 py-3 shadow-xl shadow-blue-500/10 backdrop-blur-xl">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  ອັບໂຫຼດສຳເລັດ
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-indigo-600">
                  <Sparkles size={14} className="text-blue-500" />
                  ຮ່າງເອກະສານພ້ອມສົ່ງອະນຸມັດ...
                </div>
              </div>
            </div>
          </div>

          {/* Bottom-left trust line */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <ShieldCheck size={15} className="text-emerald-500" />
            ລະບົບປອດໄພດ້ວຍການເຂົ້າລະຫັດ 256-bit SSL · © 2026 DMS
          </div>
        </div>

        {/* ── ຝັ່ງຂວາ: Frosted glass login card ── */}
        <div className="relative flex min-h-screen items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl shadow-blue-500/10 backdrop-blur-xl sm:p-10">
            {/* Card Header */}
            <div className="mb-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
                <Lock size={22} />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                ເຂົ້າສູ່ລະບົບ DMS
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                ຍິນດີຕ້ອນຮັບກັບຄືນ, ກະລຸນາປ້ອນຂໍ້ມູນຂອງທ່ານ
              </p>
            </div>

            {/* Switcher Tabs */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200/70 bg-slate-100/70 p-1">
              {(
                [
                  { key: "email" as LoginTab, label: "ອີເມວ", icon: <Mail size={15} /> },
                  {
                    key: "phone" as LoginTab,
                    label: "ເບີໂທ",
                    icon: <Smartphone size={15} />,
                  },
                ] as { key: LoginTab; label: string; icon: React.ReactNode }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    activeTab === tab.key
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Identifier input (Email / Phone) */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {activeTab === "email" ? "ຊື່ຜູ້ໃຊ້ ຫຼື ອີເມວ" : "ເບີໂທລະບົບ"}
                </label>
                <div className="relative">
                  {activeTab === "email" ? (
                    <Mail
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  ) : (
                    <Smartphone
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  )}
                  <input
                    type="text"
                    placeholder={
                      activeTab === "email" ? "name@company.com" : "+856 20 1234 5678"
                    }
                    value={form.email}
                    onChange={handleChange("email")}
                    disabled={cooldownSeconds > 0}
                    className={`w-full rounded-xl border border-slate-200/60 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${
                      errors.email ? "border-rose-400" : ""
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.email}</p>
                )}
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    ລະຫັດຜ່ານ
                  </label>
                  <a
                    href="#"
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    ລືມລະຫັດຜ່ານ?
                  </a>
                </div>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange("password")}
                    disabled={cooldownSeconds > 0}
                    className={`w-full rounded-xl border border-slate-200/60 bg-slate-50/80 py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${
                      errors.password ? "border-rose-400" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "ຊ່ອນລະຫັດຜ່ານ" : "ສະແດງລະຫັດຜ່ານ"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    {errors.password}
                  </p>
                )}

                {/* Password Strength Bar */}
                {form.password.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                            i < strength.score ? strength.barColor : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-semibold ${strength.color}`}>
                        ຄວາມປອດໄພ: {strength.label}
                      </span>
                      <span className="text-slate-400">{strength.score}/5</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={acceptedTerms}
                    aria-label="ຍອມຮັບເງື່ອນໄຂ ແລະ ນະໂຍບາຍ"
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition ${
                      acceptedTerms
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-transparent hover:border-blue-400"
                    }`}
                  >
                    <Check size={12} strokeWidth={3} />
                  </button>
                  <span className="text-xs leading-relaxed text-slate-500">
                    ຂ້າພະເຈົ້າໄດ້ອ່ານ ແລະ ຍອມຮັບ{" "}
                    <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">
                      ເງື່ອນໄຂການນຳໃຊ້
                    </a>{" "}
                    ແລະ{" "}
                    <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">
                      ນະໂຍບາຍຄວາມປອດໄພ
                    </a>
                  </span>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.terms}</p>
                )}
              </div>

              {/* Rate-Limit Cooldown Warning */}
              {cooldownSeconds > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs font-medium text-amber-700">
                  <span role="img" aria-hidden="true">
                    ⏳
                  </span>
                  ທ່ານປ້ອນລະຫັດຜິດຫຼາຍຄັ້ງ, ກະລຸນາລໍຖ້າອີກ{" "}
                  {cooldownSeconds}{" "}
                  ວິນາທີ
                </div>
              )}

              {/* Status Messages */}
              {submitStatus === "success" && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 size={15} />
                  ເຂົ້າສູ່ລະບົບສຳເລັດ! ກຳລັງພາໄປໜ້າຫຼັກ...
                </div>
              )}
              {submitStatus === "error" && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                  ເກີດຂໍ້ຜິດພາດ, ກະລຸນາກວດສອບອີເມວ ແລະ ລະຫັດຜ່ານ
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || cooldownSeconds > 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-blue-400 disabled:shadow-none"
              >
                {cooldownSeconds > 0 ? (
                  <span>ກະລຸນາລໍຖ້າ ({cooldownSeconds}s)...</span>
                ) : isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>ກຳລັງເຂົ້າສູ່ລະບົບ...</span>
                  </>
                ) : (
                  <>
                    <span>ເຂົ້າສູ່ລະບົບ</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Card Footer */}
            <div className="mt-6 flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              ລະບົບປອດໄພດ້ວຍການເຂົ້າລະຫັດ 256-bit SSL · ສະເພາະພາຍໃນອົງກອນ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
