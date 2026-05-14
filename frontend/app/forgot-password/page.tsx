"use client";

import { useState } from "react";
import Image from "next/image";
import { momoTrust } from "../fonts";

type Step = "email" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [passwords, setPasswords] = useState({ newPass: "", confirmPass: "" });
  const [error, setError] = useState("");

  // ── STEP 1: email ──
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email wajib diisi."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Format email tidak valid."); return; }
    setStep("otp");
  };

  // ── STEP 2: OTP ──
  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 3) {
      const el = document.getElementById(`otp-${idx + 1}`);
      el?.focus();
    }
  };
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.some(d => d === "")) { setError("Masukkan semua 4 digit kode OTP."); return; }
    setStep("reset");
  };

  // ── STEP 3: reset ──
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!passwords.newPass) { setError("Password baru wajib diisi."); return; }
    if (passwords.newPass.length < 8) { setError("Password minimal 8 karakter."); return; }
    if (passwords.newPass !== passwords.confirmPass) { setError("Konfirmasi password tidak cocok."); return; }
    setStep("done");
  };

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-full border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
      hasError ? "border-red-400 focus:ring-red-300 bg-red-50" : "border-gray-300 focus:ring-primary"
    }`;

  const stepLabels = ["Email", "Verifikasi", "Reset"];
  const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : 2;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">

          {/* LOGO + TITLE */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <Image src="/images/logo.png" alt="SIAPGrek" width={100} height={36} className="object-contain" />
            </div>
            <h1 className={`${momoTrust.className} text-2xl lg:text-3xl font-bold text-primary mb-1`}>
              {step === "done" ? "Berhasil!" : "Lupa Password"}
            </h1>
            <p className="text-gray-500 text-xs lg:text-sm">
              {step === "email" && "Masukkan email akun kamu untuk menerima kode verifikasi."}
              {step === "otp" && `Kode OTP telah dikirim ke ${email}`}
              {step === "reset" && "Buat password baru yang kuat untuk akunmu."}
              {step === "done" && "Password berhasil diperbarui. Silakan masuk kembali."}
            </p>
          </div>

          {/* STEP INDICATOR — hanya tampil saat bukan done */}
          {step !== "done" && (
            <div className="flex items-center justify-center gap-2 mb-6">
              {stepLabels.map((label, idx) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition ${
                      idx < stepIndex ? "bg-green-500 text-white"
                      : idx === stepIndex ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-400"
                    }`}>
                      {idx < stepIndex ? "✓" : idx + 1}
                    </div>
                    <span className={`text-[10px] font-medium ${idx === stepIndex ? "text-primary" : "text-gray-400"}`}>
                      {label}
                    </span>
                  </div>
                  {idx < 2 && <div className={`w-6 h-px ${idx < stepIndex ? "bg-green-400" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>
          )}

          {/* CARD */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">

            {/* ERROR */}
            {error && (
              <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-1.5">
                <span>⚠</span> {error}
              </div>
            )}

            {/* STEP 1 — EMAIL */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1 text-xs font-medium">Alamat Email</label>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="Masukkan email anda" className={inputClass(!!error)} />
                </div>
                <button type="submit"
                  className="w-full rounded-full bg-primary py-2.5 text-white font-semibold text-sm hover:bg-primary/80 transition">
                  Kirim Kode OTP
                </button>
              </form>
            )}

            {/* STEP 2 — OTP */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div>
                  <label className="block text-gray-700 mb-3 text-xs font-medium text-center">Masukkan 4 digit kode OTP</label>
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(e.target.value, idx)}
                        onKeyDown={e => {
                          if (e.key === "Backspace" && !digit && idx > 0) {
                            document.getElementById(`otp-${idx - 1}`)?.focus();
                          }
                        }}
                        className={`w-12 h-12 text-center text-lg font-bold rounded-xl border focus:outline-none focus:ring-2 transition ${
                          error ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-primary"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <button type="submit"
                  className="w-full rounded-full bg-primary py-2.5 text-white font-semibold text-sm hover:bg-primary/80 transition">
                  Verifikasi OTP
                </button>
                <button type="button" onClick={() => setOtp(["","","",""])}
                  className="w-full text-center text-xs text-gray-400 hover:text-primary transition">
                  Kirim ulang kode
                </button>
              </form>
            )}

            {/* STEP 3 — RESET */}
            {step === "reset" && (
              <form onSubmit={handleResetSubmit} className="space-y-3">
                <div>
                  <label className="block text-gray-700 mb-1 text-xs font-medium">Password Baru</label>
                  <input type="password"
                    value={passwords.newPass}
                    onChange={e => { setPasswords(p => ({...p, newPass: e.target.value})); setError(""); }}
                    placeholder="Minimal 8 karakter"
                    className={inputClass(error.includes("Password") || error.includes("karakter"))} />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 text-xs font-medium">Konfirmasi Password</label>
                  <input type="password"
                    value={passwords.confirmPass}
                    onChange={e => { setPasswords(p => ({...p, confirmPass: e.target.value})); setError(""); }}
                    placeholder="Ulangi password baru"
                    className={inputClass(error.includes("cocok"))} />
                </div>
                <button type="submit"
                  className="w-full rounded-full bg-primary py-2.5 text-white font-semibold text-sm hover:bg-primary/80 transition mt-2">
                  Simpan Password Baru
                </button>
              </form>
            )}

            {/* STEP 4 — DONE */}
            {step === "done" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg width="32" height="32" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">Password kamu berhasil diperbarui.</p>
                <a href="/login"
                  className="block w-full rounded-full bg-primary py-2.5 text-white font-semibold text-sm hover:bg-primary/80 transition text-center">
                  Masuk Sekarang
                </a>
              </div>
            )}

          </div>

          {step !== "done" && (
            <p className="mt-4 text-center text-xs text-gray-500">
              Ingat password?{" "}
              <a href="/login" className="text-primary font-semibold hover:underline">Kembali masuk</a>
            </p>
          )}

        </div>
      </div>
    </main>
  );
}