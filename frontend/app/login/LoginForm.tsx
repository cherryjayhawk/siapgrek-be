"use client";

import { useState } from "react";
import Image from "next/image";
import { momoTrust } from "../fonts";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess("");
    const newErrors: { [key: string]: string } = {};
    if (!form.email.trim()) newErrors.email = "Email wajib diisi.";
    if (!form.password) newErrors.password = "Password wajib diisi.";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setSuccess("Login berhasil! Mengalihkan...");
    setTimeout(() => router.push("/"), 800);
  };

  const inputClass = (field: string) =>
    `w-full rounded-full border px-4 py-2.5 lg:py-3 text-sm focus:outline-none focus:ring-2 transition ${
      errors[field]
        ? "border-red-400 focus:ring-red-300 bg-red-50"
        : "border-gray-300 focus:ring-primary"
    }`;

  return (
    <form onSubmit={handleSubmit} className="w-full">

      {/* LOGO + TITLE */}
      <div className="text-center mb-5 lg:mb-8">
        <div className="flex justify-center mb-3">
          <Image src="/images/logo.png" alt="SIAPGrek" width={110} height={40} className="object-contain" />
        </div>
        <h2 className={`${momoTrust.className} text-2xl lg:text-4xl font-bold text-primary mb-1`}>
          Selamat Datang
        </h2>
        <p className="text-gray-500 text-xs lg:text-sm">
          Lanjutkan monitoring tanaman anggrekmu.
        </p>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="mb-3 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-medium text-center">
          ✓ {success}
        </div>
      )}

      {/* EMAIL */}
      <div className="mb-3">
        <label className="block text-gray-700 mb-1 text-xs lg:text-sm font-medium">Email</label>
        <input
          type="email" name="email" value={form.email}
          onChange={handleChange} placeholder="Masukkan email anda"
          className={inputClass("email")}
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span>⚠</span> {errors.email}
          </p>
        )}
      </div>

      {/* PASSWORD */}
      <div className="mb-3">
        <label className="block text-gray-700 mb-1 text-xs lg:text-sm font-medium">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"} name="password"
            value={form.password} onChange={handleChange}
            placeholder="Masukkan password anda"
            className={inputClass("password")}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span>⚠</span> {errors.password}
          </p>
        )}
      </div>

      {/* LUPA PASSWORD */}
      <div className="mb-4 text-right">
        <a href="/forgot-password" className="text-primary text-xs hover:underline">Lupa password?</a>
      </div>

      {/* SUBMIT */}
      <button type="submit"
        className="w-full rounded-full bg-primary py-2.5 lg:py-3 text-white font-semibold text-sm lg:text-base hover:bg-primary/80 transition">
        Masuk
      </button>

      <p className="mt-3 text-center text-xs text-gray-600">
        Belum memiliki akun?{" "}
        <a href="/register" className="font-semibold text-primary hover:underline">Daftar</a>
      </p>
    </form>
  );
}