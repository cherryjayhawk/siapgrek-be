"use client";

import { useState } from "react";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { momoTrust } from "@/lib/fonts";
import { authClient } from "@/lib/auth-client";

type Props = { onBack?: () => void };

export default function ChangePassword({ onBack }: Props) {
  const [form, setForm] = useState({ currentPassword: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<any>({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors((p: any) => ({ ...p, [e.target.name]: "" }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    if (!form.currentPassword) newErrors.currentPassword = "Password lama wajib diisi";
    if (!form.password) newErrors.password = "Password baru wajib diisi";
    else if (form.password.length < 8) newErrors.password = "Minimal 8 karakter";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Password tidak sama";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.password,
      });

      if (error) {
        setErrors({ currentPassword: error.message || "Gagal mengubah password." });
        return;
      }

      setSuccess(true);
      setForm({ currentPassword: "", password: "", confirmPassword: "" });
    } catch {
      setErrors({ currentPassword: "Gagal terhubung ke server. Coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-full border px-4 py-2.5 lg:py-3 pr-12 text-sm focus:outline-none focus:ring-2 transition ${
      errors[field] ? "border-red-400 focus:ring-red-300 bg-red-50" : "border-gray-200 focus:ring-primary"
    }`;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">

      {/* TITLE — back button hanya mobile (md:hidden) */}
      <div className="flex items-center gap-3 mb-5 lg:mb-7">
        {onBack && (
          <button type="button" onClick={onBack}
            className="md:hidden w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition flex-shrink-0">
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
        )}
        <div>
          <h2 className={`${momoTrust.className} text-xl lg:text-2xl font-bold text-primary leading-tight`}>
            Ganti Password
          </h2>
          <p className="text-gray-500 text-xs lg:text-sm">Perbarui keamanan akun kamu.</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-medium flex items-center gap-2">
          <span>✓</span> Password berhasil diubah!
        </div>
      )}

      <div className="mb-3">
        <label className="block text-gray-700 mb-1 text-xs lg:text-sm font-medium">Password Lama</label>
        <div className="relative">
          <input type={showCurrent ? "text" : "password"} name="currentPassword"
            value={form.currentPassword} onChange={handleChange} placeholder="Masukkan password saat ini"
            className={inputClass("currentPassword")} />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showCurrent ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        {errors.currentPassword && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.currentPassword}</p>}
      </div>

      <div className="mb-3">
        <label className="block text-gray-700 mb-1 text-xs lg:text-sm font-medium">Password Baru</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} name="password"
            value={form.password} onChange={handleChange} placeholder="Minimal 8 karakter"
            className={inputClass("password")} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.password}</p>}
      </div>

      <div className="mb-5">
        <label className="block text-gray-700 mb-1 text-xs lg:text-sm font-medium">Konfirmasi Password</label>
        <div className="relative">
          <input type={showConfirm ? "text" : "password"} name="confirmPassword"
            value={form.confirmPassword} onChange={handleChange} placeholder="Ulangi password baru"
            className={inputClass("confirmPassword")} />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.confirmPassword}</p>}
      </div>

      <button type="submit"
        disabled={loading}
        className="w-full rounded-full bg-primary py-2.5 lg:py-3 text-white text-sm lg:text-base font-semibold hover:bg-primary/80 disabled:opacity-70 transition flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Menyimpan...
          </>
        ) : "Simpan"}
      </button>

    </form>
  );
}