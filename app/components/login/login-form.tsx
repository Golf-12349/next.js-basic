/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRouter } from "next/navigation";
import { Noto_Sans_Lao } from "next/font/google";
import React, { useState } from "react";
import apiClient from "@/config/axiosClient";
import toast from 'react-hot-toast';
import secureLocalStorage from 'react-secure-storage';

// Noto Sans Lao ຮອງຮັບພາສາລາວ, ໃຫ້ import ໄວ້ນອກ component
const notoSansLao = Noto_Sans_Lao({
  subsets: ["lao"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
  user: UserData;
};

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function LoginForm() {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // ກວດສອບຄວາມປອດໄພຂອງ password
  const checkPasswordStrength = (
    pwd: string,
  ): {
    checks: PasswordStrengthChecks;
    score: number;
    label: string;
    color: string;
    barColor: string;
  } => {
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
        color = "text-red-600";
        barColor = "bg-red-500";
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

  // ຟັງຊັນກວດສອບຄວາມຖືກຕ້ອງຂອງຟອມ
  const validateForm = () => {
    const newErrors: LoginErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ ຫຼື ອີເມວ";
    }

    // if (!form.password) {
    //   newErrors.password = 'ກະລຸນາປ້ອນລະຫັດຜ່ານ'
    // } else if (strength.score < 3) {
    //   newErrors.password = 'ລະຫັດຜ່ານບໍ່ປອດໄພພຽງພໍ ກະລຸນາປັບປຸງ'
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ຟັງຊັນ handle submit
 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setSubmitStatus(null);

  if (!validateForm()) return;

  setIsSubmitting(true);
  try {
    // ຈຳລອງການເອີ້ນ API — ປ່ຽນເປັນ endpoint ຈິງໄດ້ຕາມໂຕໂປຣເຈັກ
    const response = await apiClient.post<APIResponse>("/auth/login", form);
    console.log("Login response:", response.data);

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
    console.log("Login payload:", form);

    await new Promise((resolve) => setTimeout(resolve, 1200));
    router.push("/dashboard"); // ການເຂົ້າສູ່ dashboard ຫຼັງຈາກ login ສຳເລັດ
  } catch (err: any) {
    console.error("Login failed:", err);
    toast.error(err.response?.data?.message ?? err?.message ?? "ການເຂົ້າສູ່ລະບົບລົ້ມເຫຼວ");
    setSubmitStatus("error");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div
      className={`${notoSansLao.className} w-full max-w-md mx-auto bg-white border border-black/10 rounded-2xl shadow-xl shadow-black/5 px-8 py-10`}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center mb-5">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h4 className="text-2xl font-bold text-black tracking-tight">
          ເຂົ້າສູ່ລະບົບ
        </h4>
        <p className="text-sm text-black/50 mt-1">
          ຍິນດີຕ້ອນຮັບກັບຄືນ, ກະລຸນາປ້ອນຂໍ້ມູນຂອງທ່ານ
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Username / Email */}
        <div>
          <label className="block text-black text-sm font-semibold mb-1.5">
            ຊື່ຜູ້ໃຊ້ ຫຼື ອີເມວ
          </label>
          <input
            type="text"
            placeholder="enter your name or email"
            value={form.email}
            onChange={handleChange("email")}
            className={`w-full bg-white border rounded-lg px-3.5 py-2.5 text-black placeholder-black/30 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              errors.email
                ? "border-red-400 focus:border-red-500"
                : "border-black/15 focus:border-blue-500"
            }`}
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1.5">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-black text-sm font-semibold mb-1.5">
            ລະຫັດຜ່ານ
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="enter your password"
              value={form.password}
              onChange={handleChange("password")}
              className={`w-full bg-white border rounded-lg px-3.5 py-2.5 pr-10 text-black placeholder-black/30 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.password
                  ? "border-red-400 focus:border-red-500"
                  : "border-black/15 focus:border-blue-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/70 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.4 18.4 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 mt-1.5">{errors.password}</p>
          )}

          {/* Strength meter */}
          {form.password.length > 0 && (
            <div className="mt-3">
              <div className="flex gap-1.5 mb-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      i < strength.score ? strength.barColor : "bg-black/10"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${strength.color}`}>
                  ຄວາມປອດໄພ: {strength.label}
                </span>
                <span className="text-xs text-black/40">
                  {strength.score}/5
                </span>
              </div>

              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5">
                {(
                  [
                    ["length", "ຢ່າງໜ້ອຍ 8 ໂຕ"],
                    ["uppercase", "ໂຕພິມໃຫຍ່ A-Z"],
                    ["lowercase", "ໂຕພິມນ້ອຍ a-z"],
                    ["number", "ຕົວເລກ 0-9"],
                    ["special", "ສັນຍາລັກພິເສດ"],
                  ] as Array<[PasswordStrengthKey, string]>
                ).map(([key, text]) => (
                  <li
                    key={key}
                    className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                      strength.checks[key]
                        ? "text-emerald-600"
                        : "text-black/35"
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                        strength.checks[key] ? "bg-emerald-500" : "bg-black/10"
                      }`}
                    >
                      {strength.checks[key] && (
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Submit status banner */}
        {submitStatus === "success" && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3.5 py-2.5">
            ເຂົ້າສູ່ລະບົບສຳເລັດ!
          </div>
        )}
        {submitStatus === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3.5 py-2.5">
            ເກີດຂໍ້ຜິດພາດ, ກະລຸນາລອງໃໝ່ອີກຄັ້ງ
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg px-4 py-2.5 mt-1 transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="3"
                  opacity="0.3"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              ກຳລັງເຂົ້າສູ່ລະບົບ...
            </>
          ) : (
            "ເຂົ້າສູ່ລະບົບ"
          )}
        </button>
      </form>

      <p className="text-center text-xs text-black/40 mt-6">
        ຍັງບໍ່ມີບັນຊີ?{" "}
        <a href="#" className="text-blue-500 font-semibold hover:underline">
          ລົງທະບຽນ
        </a>
      </p>
    </div>
  );
}

export default LoginForm;
