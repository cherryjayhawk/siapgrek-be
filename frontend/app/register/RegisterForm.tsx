"use client";

import { useState } from "react";
import Image from "next/image";
import { momoTrust } from "../fonts";
import { Eye, EyeOff, X } from "lucide-react";
import { useRouter } from "next/navigation";

/* ── TERMS MODAL ── */
function TermsModal({ onClose }: { onClose: () => void }) {
  const sections = [
    { title: "1. Penerimaan Syarat", content: "Dengan mendaftar dan menggunakan SIAPGrek, Anda menyetujui syarat dan ketentuan ini secara penuh. Jika Anda tidak menyetujui, harap tidak menggunakan layanan ini." },
    { title: "2. Penggunaan Layanan", content: "SIAPGrek adalah sistem monitoring otomatis untuk tanaman anggrek. Anda bertanggung jawab atas penggunaan akun Anda dan wajib menjaga kerahasiaan kredensial login." },
    { title: "3. Data dan Privasi", content: "Data sensor yang dikumpulkan digunakan semata-mata untuk keperluan monitoring dan rekomendasi perawatan tanaman. Kami tidak menjual atau membagikan data Anda kepada pihak ketiga tanpa izin." },
    { title: "4. Batasan Tanggung Jawab", content: "SIAPGrek menyediakan informasi dan rekomendasi berdasarkan data sensor. Keputusan akhir perawatan tetap berada di tangan pengguna. Kami tidak bertanggung jawab atas kerugian yang timbul akibat penggunaan sistem." },
    { title: "5. Perubahan Layanan", content: "Kami berhak mengubah, menambah, atau menghentikan fitur layanan sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam aplikasi." },
    { title: "6. Penangguhan Akun", content: "Kami berhak menangguhkan atau menghapus akun yang terbukti melanggar ketentuan ini, termasuk penyalahgunaan sistem atau aktivitas yang merugikan pengguna lain." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className={`${momoTrust.className} text-lg font-bold text-primary`}>Syarat & Ketentuan</h2>
            <p className="text-[10px] text-gray-400">Terakhir diperbarui: Januari 2025</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-700 leading-relaxed">
              Selamat datang di <span className="font-semibold text-primary">SIAPGrek</span>. Harap baca syarat dan ketentuan berikut sebelum menggunakan layanan kami.
            </p>
          </div>
          {sections.map((s, idx) => (
            <div key={idx} className="border border-gray-100 rounded-xl p-3">
              <h3 className="font-semibold text-gray-800 text-xs mb-1">{s.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-primary py-2.5 text-white font-semibold text-sm hover:bg-primary/80 transition"
          >
            Mengerti & Tutup
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── REGISTER FORM ── */
export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", terms: false });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: { [key: string]: string } = {};
    if (!form.name.trim()) newErrors.name = "Nama wajib diisi.";
    if (!form.email.trim()) newErrors.email = "Email wajib diisi.";
    if (!form.password) newErrors.password = "Password wajib diisi.";
    if (form.password && form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Konfirmasi password tidak cocok.";
    if (!form.terms) newErrors.terms = "Anda harus menyetujui syarat dan ketentuan.";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    // simulasi register — ganti dengan API call nyata
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  const inputClass = (field: string) =>
    `w-full rounded-full border px-4 py-2 lg:py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
      errors[field] ? "border-red-400 focus:ring-red-300 bg-red-50" : "border-gray-300 focus:ring-primary"
    }`;

  return (
    <>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      <form onSubmit={handleSubmit} className="w-full">

        {/* LOGO + TITLE */}
        <div className="text-center mb-4 lg:mb-6">
          <div className="flex justify-center mb-2.5">
            <Image src="/images/logo.png" alt="SIAPGrek" width={100} height={36} className="object-contain" />
          </div>
          <h2 className={`${momoTrust.className} text-2xl lg:text-4xl font-bold text-primary mb-1`}>
            Daftar Sekarang
          </h2>
          <p className="text-gray-500 text-xs lg:text-sm">Buat akun dan mulai monitoring anggrekmu.</p>
        </div>

        {/* NAMA */}
        <div className="mb-2.5">
          <label className="block text-gray-700 mb-1 text-xs font-medium">Nama Lengkap</label>
          <input type="text" name="name" value={form.name} onChange={handleChange}
            placeholder="Masukkan nama lengkap" className={inputClass("name")} />
          {errors.name && <p className="text-red-500 text-xs mt-0.5 flex items-center gap-1"><span>⚠</span>{errors.name}</p>}
        </div>

        {/* EMAIL */}
        <div className="mb-2.5">
          <label className="block text-gray-700 mb-1 text-xs font-medium">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange}
            placeholder="Masukkan email anda" className={inputClass("email")} />
          {errors.email && <p className="text-red-500 text-xs mt-0.5 flex items-center gap-1"><span>⚠</span>{errors.email}</p>}
        </div>

        {/* PASSWORD */}
        <div className="mb-2.5">
          <label className="block text-gray-700 mb-1 text-xs font-medium">Password</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} name="password"
              value={form.password} onChange={handleChange}
              placeholder="Masukkan password anda" className={inputClass("password")} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-0.5 flex items-center gap-1"><span>⚠</span>{errors.password}</p>}
        </div>

        {/* KONFIRMASI PASSWORD */}
        <div className="mb-3">
          <label className="block text-gray-700 mb-1 text-xs font-medium">Konfirmasi Password</label>
          <div className="relative">
            <input type={showConfirm ? "text" : "password"} name="confirmPassword"
              value={form.confirmPassword} onChange={handleChange}
              placeholder="Ulangi password anda" className={inputClass("confirmPassword")} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-0.5 flex items-center gap-1"><span>⚠</span>{errors.confirmPassword}</p>}
        </div>

        {/* TERMS CHECKBOX */}
        <div className="mb-4">
          <label className="inline-flex items-start gap-2.5 cursor-pointer select-none">
            <div className="relative mt-0.5 flex-shrink-0">
              <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange}
                className="peer appearance-none w-4 h-4 rounded-full border border-gray-300 transition-all checked:bg-primary checked:border-primary" />
              <svg className="absolute left-0.5 top-0.5 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <span className="text-xs text-gray-700 leading-relaxed">
              Saya menyetujui{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-primary font-semibold hover:underline"
              >
                syarat dan ketentuan
              </button>{" "}
              yang berlaku.
            </span>
          </label>
          {errors.terms && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{errors.terms}</p>}
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary py-2.5 text-white font-semibold text-sm lg:text-base hover:bg-primary/80 disabled:opacity-70 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Mendaftarkan...
            </>
          ) : "Daftar Sekarang"}
        </button>

        <p className="mt-3 text-center text-xs text-gray-600">
          Sudah memiliki akun?{" "}
          <a href="/login" className="font-semibold text-primary hover:underline">Masuk</a>
        </p>

      </form>
    </>
  );
}