import Image from "next/image";
import { momoTrust } from "@/lib/fonts";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Penerimaan Syarat",
      content: "Dengan mendaftar dan menggunakan SIAPGrek, Anda menyetujui syarat dan ketentuan ini secara penuh. Jika Anda tidak menyetujui, harap tidak menggunakan layanan ini.",
    },
    {
      title: "2. Penggunaan Layanan",
      content: "SIAPGrek adalah sistem monitoring otomatis untuk tanaman anggrek. Anda bertanggung jawab atas penggunaan akun Anda dan wajib menjaga kerahasiaan kredensial login.",
    },
    {
      title: "3. Data dan Privasi",
      content: "Data sensor yang dikumpulkan oleh sistem digunakan semata-mata untuk keperluan monitoring dan rekomendasi perawatan tanaman. Kami tidak menjual atau membagikan data Anda kepada pihak ketiga tanpa izin.",
    },
    {
      title: "4. Batasan Tanggung Jawab",
      content: "SIAPGrek menyediakan informasi dan rekomendasi berdasarkan data sensor. Keputusan akhir perawatan tetap berada di tangan pengguna. Kami tidak bertanggung jawab atas kerugian yang timbul akibat penggunaan sistem.",
    },
    {
      title: "5. Perubahan Layanan",
      content: "Kami berhak mengubah, menambah, atau menghentikan fitur layanan sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam aplikasi.",
    },
    {
      title: "6. Penangguhan Akun",
      content: "Kami berhak menangguhkan atau menghapus akun yang terbukti melanggar ketentuan ini, termasuk penyalahgunaan sistem, pencurian data, atau aktivitas yang merugikan pengguna lain.",
    },
    {
      title: "7. Kontak",
      content: "Jika Anda memiliki pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi tim kami melalui email support yang tersedia di halaman profil.",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <a href="/register" className="text-gray-500 hover:text-gray-700">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <div className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="SIAPGrek" width={80} height={30} className="object-contain" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* TITLE */}
        <div className="text-center mb-8">
          <h1 className={`${momoTrust.className} text-3xl font-bold text-primary mb-2`}>
            Syarat & Ketentuan
          </h1>
          <p className="text-gray-500 text-sm">Terakhir diperbarui: Januari 2025</p>
        </div>

        {/* INTRO */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            Selamat datang di <span className="font-semibold text-primary">SIAPGrek</span> — Sistem Informasi Automasi Perawatan Anggrek.
            Harap baca syarat dan ketentuan berikut sebelum menggunakan layanan kami.
          </p>
        </div>

        {/* SECTIONS */}
        <div className="space-y-4">
          {sections.map((s, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-800 text-sm lg:text-base mb-2">{s.title}</h2>
              <p className="text-gray-600 text-xs lg:text-sm leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>

        {/* BACK BUTTON */}
        <div className="mt-8 text-center">
          <a href="/register"
            className="inline-block px-8 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary/80 transition">
            Kembali ke Daftar
          </a>
        </div>

      </div>
    </main>
  );
}