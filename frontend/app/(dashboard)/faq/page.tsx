"use client";

import { useState } from "react";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import { momoTrust } from "@/lib/fonts";

type Props = {
  onBack?: () => void;
  onNavigate?: (menu: string) => void; // untuk navigasi ke chat
};

const faqData = [
  {
    category: "Umum",
    items: [
      {
        q: "Apa itu SIAPGrek?",
        a: "SIAPGrek adalah Sistem Informasi Automasi Perawatan Anggrek. Aplikasi ini membantu kamu memantau dan mengontrol kondisi tanaman anggrek secara otomatis melalui sensor dan aktuator yang terhubung."
      },
      {
        q: "Siapa yang bisa menggunakan SIAPGrek?",
        a: "SIAPGrek dapat digunakan oleh siapa saja yang memiliki tanaman anggrek dan ingin memantau kondisinya secara real-time, baik petani, hobiis, maupun peneliti."
      },
    ]
  },
  {
    category: "Sensor & Data",
    items: [
      {
        q: "Sensor apa saja yang tersedia di SIAPGrek?",
        a: "SIAPGrek memantau 7 parameter: Suhu lingkungan, Kelembapan lingkungan, Intensitas cahaya, Suhu tanah, Kelembapan tanah, pH tanah, dan Konduktivitas (EC) tanah."
      },
      {
        q: "Seberapa sering data sensor diperbarui?",
        a: "Data sensor diperbarui secara real-time. Kamu dapat mengatur interval pembacaan mulai dari 1 menit hingga 1 jam melalui menu Grafik Monitoring."
      },
      {
        q: "Apa arti indikator warna pada kartu sensor?",
        a: "Hijau berarti nilai dalam kondisi ideal, Kuning berarti perlu perhatian (mendekati batas), dan Merah berarti nilai di luar rentang ideal dan memerlukan tindakan segera."
      },
    ]
  },
  {
    category: "Kontrol & Aktuator",
    items: [
      {
        q: "Apa perbedaan Mode Otomatis dan Manual?",
        a: "Mode Otomatis berarti sistem akan mengaktifkan aktuator secara otomatis berdasarkan data sensor. Mode Manual memungkinkan kamu mengontrol aktuator secara langsung kapan saja."
      },
      {
        q: "Apa perbedaan Penyiraman dan Misting?",
        a: "Penyiraman digunakan untuk menyiram pot dan akar tanaman secara langsung. Misting adalah penyemprotan kabut halus untuk meningkatkan kelembapan udara di sekitar tanaman."
      },
      {
        q: "Bagaimana cara mengaktifkan kontrol manual?",
        a: "Buka Menu Kontrol (ikon roda gigi di pojok kanan bawah), matikan Mode Otomatis terlebih dahulu, kemudian aktifkan atau nonaktifkan aktuator sesuai kebutuhan."
      },
    ]
  },
  {
    category: "Akun & Profil",
    items: [
      {
        q: "Bagaimana cara mengganti foto profil?",
        a: "Buka halaman Profil → Edit Profil, lalu klik tombol 'Ganti foto profil'. Kamu bisa mengunggah foto dalam format JPG, PNG, atau WEBP dengan ukuran maksimal 2MB."
      },
      {
        q: "Bagaimana jika lupa password?",
        a: "Di halaman Login, klik 'Lupa password?' dan ikuti langkah verifikasi melalui email yang terdaftar. Kamu akan menerima kode OTP untuk mereset password."
      },
    ]
  },
  {
    category: "Klasifikasi Penyakit",
    items: [
      {
        q: "Bagaimana cara mendeteksi penyakit tanaman?",
        a: "Buka menu Penyakit, klik tombol 'Unggah Foto', lalu pilih foto daun anggrek. Sistem akan menganalisis gambar dan menampilkan hasil klasifikasi beserta tingkat akurasinya."
      },
      {
        q: "Seberapa akurat deteksi penyakit?",
        a: "Akurasi deteksi bergantung pada kualitas foto. Pastikan foto jelas, pencahayaan cukup, dan fokus pada bagian daun yang terindikasi sakit untuk hasil terbaik."
      },
    ]
  },
];

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? "border-primary/30 shadow-sm" : "border-gray-100"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left gap-3 hover:bg-gray-50 transition bg-white"
      >
        <span className="text-xs lg:text-sm font-medium text-gray-800 flex-1 leading-relaxed">{question}</span>
        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition ${
          open ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
        }`}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 bg-white border-t border-gray-100">
          <p className="text-xs lg:text-sm text-gray-600 leading-relaxed pt-3">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ({ onBack, onNavigate }: Props) {

  const handleTanyaAI = () => {
    if (onNavigate) {
      onNavigate("chat");
    }
  };

  return (
    <div className="w-full max-w-xl">

      {/* TITLE — back button hanya mobile (md:hidden) */}
      <div className="flex items-center gap-3 mb-5 lg:mb-7">
        {onBack && (
          <button onClick={onBack}
            className="md:hidden w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition flex-shrink-0">
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
        )}
        <div>
          <h2 className={`${momoTrust.className} text-xl lg:text-2xl font-bold text-primary leading-tight`}>
            Pusat Bantuan
          </h2>
          <p className="text-gray-500 text-xs lg:text-sm">Pertanyaan yang sering ditanyakan</p>
        </div>
      </div>

      {/* FAQ SECTIONS */}
      <div className="space-y-5">
        {faqData.map((section) => (
          <div key={section.category}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-4 rounded-full bg-primary inline-block" />
              <h3 className="text-xs lg:text-sm font-semibold text-gray-700">{section.category}</h3>
            </div>
            <div className="space-y-1.5">
              {section.items.map((item, idx) => (
                <AccordionItem key={idx} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER + TANYA AI */}
      <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
        <p className="text-xs text-gray-600 mb-1">Tidak menemukan jawaban yang kamu cari?</p>
        <p className="text-xs text-gray-500 mb-3">Tanyakan langsung ke asisten AI kami.</p>
        <button
          onClick={handleTanyaAI}
          className="px-6 py-2 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/80 transition"
        >
          Tanya AI
        </button>
      </div>

    </div>
  );
}