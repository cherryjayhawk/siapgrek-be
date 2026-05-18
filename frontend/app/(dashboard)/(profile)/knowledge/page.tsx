"use client";

import { useState, useRef, useEffect } from "react";
import { momoTrust } from "@/lib/fonts";
import Snackbar from "@/components/Snackbar";
import { ChevronLeft } from "lucide-react";

export default function KnowledgePage() {
  const docInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<{id: string, title: string, created_at: string}[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" as "success" | "error" });

  const fetchDocs = async () => {
    try {
      const res = await fetch("/api/knowledge/documents");
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (docs.length >= 3) {
      setSnackbar({ open: true, message: "Maksimal 3 dokumen", type: "error" });
      return;
    }
    
    setDocLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("/api/knowledge/documents", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setSnackbar({ open: true, message: "Dokumen berhasil diunggah", type: "success" });
        fetchDocs();
      } else {
        const err = await res.json();
        setSnackbar({ open: true, message: err.detail || "Gagal mengunggah", type: "error" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Kesalahan jaringan", type: "error" });
    }
    setDocLoading(false);
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleDeleteDoc = async (id: string) => {
    setDocLoading(true);
    try {
      const res = await fetch(`/api/knowledge/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSnackbar({ open: true, message: "Dokumen dihapus", type: "success" });
        fetchDocs();
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Gagal menghapus", type: "error" });
    }
    setDocLoading(false);
  };

  return (
    <div className="w-full max-w-xl pb-20">
      <div className="flex items-center gap-3 mb-5 lg:mb-7">
        <div>
          <h2 className={`${momoTrust.className} text-xl lg:text-2xl font-bold text-primary leading-tight`}>
            Pengetahuan AI
          </h2>
          <p className="text-gray-500 text-xs lg:text-sm">Unggah panduan (.md) maksimal 3 dokumen</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-800">Daftar Dokumen</h3>
            <p className="text-xs text-gray-500">Konteks untuk asisten AI</p>
          </div>
          <button 
            onClick={() => docInputRef.current?.click()}
            disabled={docs.length >= 3 || docLoading}
            className="text-xs bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition"
          >
            + Unggah
          </button>
          <input type="file" ref={docInputRef} onChange={handleUploadDoc} className="hidden" accept=".md" />
        </div>
        
        {docLoading && <p className="text-xs text-primary animate-pulse mb-3">Memproses dokumen...</p>}
        
        <div className="space-y-3">
          {docs.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400 italic">Belum ada dokumen.</p>
              <p className="text-xs text-gray-400 mt-1">AI akan menggunakan pengetahuan umum.</p>
            </div>
          ) : (
            docs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="overflow-hidden">
                    <span className="text-sm text-gray-700 font-medium truncate block">{doc.title}</span>
                    <span className="text-[10px] text-gray-400 mt-1 block">Tersimpan</span>
                </div>
                <button 
                  onClick={() => handleDeleteDoc(doc.id)} 
                  disabled={docLoading}
                  className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition"
                >
                  Hapus
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <Snackbar open={snackbar.open} message={snackbar.message} type={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
}
