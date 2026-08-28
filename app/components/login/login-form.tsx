/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import apiClient from "@/config/axiosClient";
import toast from "react-hot-toast";
import secureLocalStorage from "react-secure-storage";
import {
  FolderOpen,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  FileText,
} from "lucide-react";

type LoginForm = {
  email: string;
  password: string;
};

type LoginErrors = {
  email?: string | null;
  password?: string | null;
};

type PasswordStrengthChecks = {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
};

type PasswordStrengthKey = keyof PasswordStrengthChecks;
type SubmitStatus = "success" | "error" | null;

type APIResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export default function LoginForm() {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const validateForm = () => {
    const newErrors: LoginErrors = {};
    if (!form.email.trim()) {
      newErrors.email = "ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ ຫຼື ອີເມວ";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Handle Submit (API Integration) ────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitStatus(null);

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

      toast.success("ເຂົ້າສູ່ລະບົບສຳເລັດ");
      secureLocalStorage.setItem("token", accessToken);
      secureLocalStorage.setItem("data", JSON.stringify(user));

      setSubmitStatus("success");
      await new Promise((resolve) => setTimeout(resolve, 800));
      // ໃຊ້ full reload (ບໍ່ໃຊ້ router.push) ເພື່ອໃຫ້ DMSProvider mount ໃໝ່ ແລ້ວໂຫຼດຂໍ້ມູນດ້ວຍ token ທີ່ຫາກໍ່ໄດ້ມາ
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Login failed:", err);
      toast.error(
        err.response?.data?.message ?? err?.message ?? "ການເຂົ້າສູ່ລະບົບລົ້ມເຫຼວ"
      );
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-white font-sans text-slate-900">
      
      {/* ── ຝັ່ງຊ້າຍ: ຟອມເຂົ້າສູ່ລະບົບ (Left-aligned Clean Form) ── */}
      <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-16 xl:p-24 min-h-screen">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md shadow-slate-900/20">
            <FolderOpen size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              DMS SYSTEM
            </div>
            <div className="text-base font-bold text-slate-900">
              ລະບົບຈັດການເອກະສານ
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md my-auto py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              ເຂົ້າສູ່ລະບົບ
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              ຍິນດີຕ້ອນຮັບກັບຄືນ, ກະລຸນາປ້ອນຂໍ້ມູນຂອງທ່ານ
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ຊື່ຜູ້ໃຊ້ ຫຼື ອີເມວ
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  className={`w-full rounded-xl border bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-xs text-slate-900 outline-none transition focus:bg-white focus:ring-1 focus:ring-slate-900 ${
                    errors.email
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-slate-200 focus:border-slate-900"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  ລະຫັດຜ່ານ
                </label>
                <a href="#" className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700">
                  ລືມລະຫັດຜ່ານ?
                </a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange("password")}
                  className={`w-full rounded-xl border bg-slate-50/50 py-2.5 pl-10 pr-10 text-xs text-slate-900 outline-none transition focus:bg-white focus:ring-1 focus:ring-slate-900 ${
                    errors.password
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-slate-200 focus:border-slate-900"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.password}</p>
              )}

              {/* Password Strength Bar */}
              {form.password.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
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

            {/* Status Messages */}
            {submitStatus === "success" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-700">
                ເຂົ້າສູ່ລະບົບສຳເລັດ! ກຳລັງພາໄປໜ້າຫຼັກ...
              </div>
            )}
            {submitStatus === "error" && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700">
                ເກີດຂໍ້ຜິດພາດ, ກະລຸນາກວດສອບອີເມວ ແລະ ລະຫັດຜ່ານ
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-semibold text-white shadow-md shadow-slate-900/10 transition hover:bg-slate-800 disabled:bg-slate-400"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>ກຳລັງເຂົ້າສູ່ລະບົບ...</span>
                </>
              ) : (
                <>
                  <span>ເຂົ້າສູ່ລະບົບ</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer Badge */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>ລະບົບປອດໄພດ້ວຍການເຂົ້າລະຫັດ 256-bit SSL · ສະເພາະພາຍໃນອົງກອນ</span>
        </div>
      </div>

      {/* ── ຝັ່ງຂວາ: Visual Branding & Floating Glass Card ── */}
      <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        <div className="flex justify-end">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 backdrop-blur-sm">
            Enterprise Edition v2.0
          </span>
        </div>

        <div className="my-auto max-w-md mx-auto space-y-6">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl shadow-2xl shadow-black/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">ສັນຍາຮ່ວມທຸລະກິດ 2026</div>
                  <div className="text-xs text-slate-400">ເລກທີ: DOC-2026-088 · 2.4 MB</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                <CheckCircle2 size={12} />
                ອະນຸມັດແລ້ວ
              </span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-3/4 rounded-full bg-indigo-400" />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/10">
              <span>🗄️ ຕູ້ສັນຍາ &gt; 📁 ສັນຍາລູກຄ້າ</span>
              <span>ກວດສອບໂດຍ: SuperAdmin</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white leading-snug">
              ຈັດລະບຽບເອກະສານຂອງທ່ານ <br />
              <span className="text-indigo-400">ຢ່າງປອດໄພ ແລະ ວ່ອງໄວໃນບ່ອນດຽວ</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              ຮອງຮັບການເກັບເອກະສານແບບ 3 ລະດັບ (ຕູ້ ➡️ ແຟ້ມ ➡️ ເອກະສານ) ພ້ອມລະບົບກວດສອບ, ອະນຸມັດ ແລະ ຕິດຕາມສະຖານະແບບ Real-time.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          © 2026 DMS Document Management System. All rights reserved.
        </div>
      </div>

    </div>
  );
}