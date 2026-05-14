"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

type DiseaseRow = {
  id: number;
  imgUrl: string;
  result: string;
  accuracy: string;
  description: string;
  date: string;
};

export default function Penyakit() {
  const [rows, setRows] = useState<DiseaseRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
    setRows(prev => [...prev, {
      id: prev.length + 1,
      imgUrl: url,
      result: "Busuk Daun",
      accuracy: "98,83%",
      description: "Tidak ada deskripsi",
      date: today,
    }]);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">

      {/* TITLE */}
      <div>
        <h1 className="text-base lg:text-xl font-bold text-gray-900">Klasifikasi Penyakit</h1>
        <p className="text-xs lg:text-sm text-gray-500 mt-0.5">Unggah foto daun anggrek untuk mendeteksi penyakit</p>
      </div>

      {/* UPLOAD BUTTON */}
      <div>
        <button
          type="button"
          onClick={handleUploadClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs lg:text-sm font-semibold shadow hover:bg-blue-700 transition"
        >
          <ImagePlus size={16} />
          Unggah Foto
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* DESKTOP TABLE — hidden on mobile */}
      <div className="hidden sm:block bg-white rounded-2xl p-3 lg:p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-xs lg:text-sm text-left text-gray-700">
          <thead>
            <tr className="border-b border-gray-200">
              {["No", "Gambar", "Hasil", "Akurasi", "Deskripsi", "Tanggal", "Aksi"].map(h => (
                <th key={h} className="py-2.5 pr-4 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                  Belum ada data. Unggah foto untuk mulai klasifikasi.
                </td>
              </tr>
            ) : rows.map(row => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2.5 pr-4">{row.id}</td>
                <td className="py-2.5 pr-4">
                  <div className="w-16 h-12 rounded-lg overflow-hidden border">
                    <img src={row.imgUrl} alt={row.result} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="inline-block rounded-full bg-green-600 text-white text-[10px] lg:text-xs px-2.5 py-0.5">
                    {row.result}
                  </span>
                </td>
                <td className="py-2.5 pr-4">{row.accuracy}</td>
                <td className="py-2.5 pr-4 max-w-[150px] truncate">{row.description}</td>
                <td className="py-2.5 pr-4 whitespace-nowrap">{row.date}</td>
                <td className="py-2.5">
                  <button className="text-blue-600 text-xs font-medium hover:underline">Detail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD LIST — hidden on desktop */}
      <div className="sm:hidden space-y-2.5">
        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-xs shadow-sm">
            Belum ada data. Unggah foto untuk mulai klasifikasi.
          </div>
        ) : rows.map(row => (
          <div key={row.id} className="bg-white rounded-2xl p-3 shadow-sm flex gap-3">
            {/* FOTO */}
            <div className="w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0">
              <img src={row.imgUrl} alt={row.result} className="w-full h-full object-cover" />
            </div>
            {/* INFO */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="inline-block rounded-full bg-green-600 text-white text-[10px] px-2 py-0.5">
                  {row.result}
                </span>
                <span className="text-[10px] text-gray-400">{row.date}</span>
              </div>
              <p className="text-[11px] text-gray-500">Akurasi: <span className="font-semibold text-gray-700">{row.accuracy}</span></p>
              <p className="text-[11px] text-gray-500 truncate">{row.description}</p>
            </div>
            <button className="text-blue-600 text-[11px] font-medium self-start flex-shrink-0">Detail</button>
          </div>
        ))}
      </div>

    </div>
  );
}