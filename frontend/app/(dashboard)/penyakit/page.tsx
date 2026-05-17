"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

// Maps the disease class name to a color scheme for badges
const diseaseColor: Record<string, string> = {
  "BERCAK DAUN": "bg-yellow-500",
  "BUSUK DAUN": "bg-red-500",
  "SEHAT": "bg-green-600",
};

type DiseaseRow = {
  id: string | number;
  imgUrl: string;
  prediction: string;
  accuracy: number;
  probability: number[];
  date: string;
};

export default function Penyakit() {
  const [rows, setRows] = useState<DiseaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch historical predictions on mount
  useEffect(() => {
    async function fetchPredictions() {
      try {
        const res = await fetch("/api/predictions");
        if (res.ok) {
          const data = await res.json();
          setRows(
            data.map((r: any) => ({
              id: r.id,
              imgUrl: r.imgUrl,
              prediction: r.prediction,
              accuracy: r.accuracy,
              probability: r.probability,
              date: new Date(r.date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch predictions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPredictions();
  }, []);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("Prediction failed:", res.statusText);
        return;
      }

      const data = await res.json();

      if (data.status === "ok") {
        const newRow: DiseaseRow = {
          id: Date.now(), // temporary ID until next fetch
          imgUrl: data.imgUrl,
          prediction: data.prediction,
          accuracy: data.accuracy,
          probability: data.probability,
          date: new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        };
        setRows((prev) => [newRow, ...prev]);
      } else {
        console.error("Prediction error:", data.error);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const formatAccuracy = (acc: number) => `${(acc * 100).toFixed(2)}%`;
  const getBadgeColor = (prediction: string) => diseaseColor[prediction] || "bg-gray-500";

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
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs lg:text-sm font-semibold shadow hover:bg-blue-700 disabled:opacity-70 transition"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Menganalisis...
            </>
          ) : (
            <>
              <ImagePlus size={16} />
              Unggah Foto
            </>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={24} />
          <span className="ml-2 text-sm text-gray-400">Memuat riwayat...</span>
        </div>
      )}

      {/* DESKTOP TABLE — hidden on mobile */}
      {!loading && (
        <div className="hidden sm:block bg-white rounded-2xl p-3 lg:p-4 shadow-sm overflow-x-auto">
          <table className="w-full text-xs lg:text-sm text-left text-gray-700">
            <thead>
              <tr className="border-b border-gray-200">
                {["No", "Gambar", "Hasil", "Akurasi", "Probabilitas", "Tanggal"].map(h => (
                  <th key={h} className="py-2.5 pr-4 font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    Belum ada data. Unggah foto untuk mulai klasifikasi.
                  </td>
                </tr>
              ) : rows.map((row, idx) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 pr-4">{idx + 1}</td>
                  <td className="py-2.5 pr-4">
                    <div className="w-16 h-12 rounded-lg overflow-hidden border">
                      <img src={row.imgUrl} alt={row.prediction} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`inline-block rounded-full text-white text-[10px] lg:text-xs px-2.5 py-0.5 ${getBadgeColor(row.prediction)}`}>
                      {row.prediction}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-medium">{formatAccuracy(row.accuracy)}</td>
                  <td className="py-2.5 pr-4">
                    <div className="flex gap-1">
                      {row.probability.map((p, i) => (
                        <span key={i} className="text-[10px] bg-gray-100 rounded px-1.5 py-0.5">
                          {["BD", "BsD", "S"][i]}: {(p * 100).toFixed(1)}%
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MOBILE CARD LIST — hidden on desktop */}
      {!loading && (
        <div className="sm:hidden space-y-2.5">
          {rows.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-xs shadow-sm">
              Belum ada data. Unggah foto untuk mulai klasifikasi.
            </div>
          ) : rows.map(row => (
            <div key={row.id} className="bg-white rounded-2xl p-3 shadow-sm flex gap-3">
              {/* FOTO */}
              <div className="w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0">
                <img src={row.imgUrl} alt={row.prediction} className="w-full h-full object-cover" />
              </div>
              {/* INFO */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`inline-block rounded-full text-white text-[10px] px-2 py-0.5 ${getBadgeColor(row.prediction)}`}>
                    {row.prediction}
                  </span>
                  <span className="text-[10px] text-gray-400">{row.date}</span>
                </div>
                <p className="text-[11px] text-gray-500">Akurasi: <span className="font-semibold text-gray-700">{formatAccuracy(row.accuracy)}</span></p>
                <div className="flex gap-1 mt-0.5">
                  {row.probability.map((p, i) => (
                    <span key={i} className="text-[9px] bg-gray-100 rounded px-1 py-0.5">
                      {["BD", "BsD", "S"][i]}: {(p * 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}