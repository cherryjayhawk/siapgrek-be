"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Cropper from "react-easy-crop";
import { momoTrust } from "@/lib/fonts";
import { useUser } from "@/context/UserContext";
import Snackbar from "@/components/Snackbar";
import { ChevronLeft } from "lucide-react";

type Props = { onBack?: () => void };

export default function Profile({ onBack }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const { profileImage, setProfileImage, username, setUsername } = useUser();

  const [form, setForm] = useState({ name: username, email: "haileywilliams@gmail.com", gender: "Perempuan", domisili: "Bandung", lat: -6.920207, lon: 107.772969 });
  const [image, setImage] = useState(profileImage);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" as "success" | "error" });

  useEffect(() => {
    setForm(prev => ({ ...prev, name: username }));
    setImage(profileImage);
  }, [username, profileImage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setSnackbar({ open: true, message: "Format foto harus JPG, PNG, atau WEBP", type: "error" }); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSnackbar({ open: true, message: "Ukuran foto maksimal 2MB", type: "error" }); return;
    }
    const reader = new FileReader();
    reader.onloadend = () => { setTempImage(reader.result as string); setShowCrop(true); };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: any, cropped: any) => setCroppedAreaPixels(cropped), []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((res, rej) => { const img = document.createElement("img"); img.onload = () => res(img); img.onerror = rej; img.src = url; });

  const getCroppedImg = async (src: string, px: any) => {
    const img = await createImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = px.width; canvas.height = px.height;
    canvas.getContext("2d")?.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);
    return canvas.toDataURL("image/jpeg");
  };

  const handleSaveCrop = async () => {
    try {
      const cropped = await getCroppedImg(tempImage!, croppedAreaPixels);
      setImage(cropped); setProfileImage(cropped);
      setSnackbar({ open: true, message: "Foto profil berhasil diperbarui", type: "success" });
      setShowCrop(false);
    } catch {
      setSnackbar({ open: true, message: "Gagal crop gambar", type: "error" });
    }
  };

  const handleSave = () => {
    if (!form.name || !form.email) { setSnackbar({ open: true, message: "Data belum lengkap", type: "error" }); return; }
    setUsername(form.name);
    // Ideally we would save lat/lon to DB here
    setSnackbar({ open: true, message: "Profil berhasil disimpan", type: "success" });
  };

  const inputClass = "w-full rounded-full border border-gray-200 px-4 py-2.5 lg:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="w-full max-w-xl pb-20">

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
            Edit Profil
          </h2>
          <p className="text-gray-500 text-xs lg:text-sm">Atur detail profil kamu.</p>
        </div>
      </div>

      {/* FOTO */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0">
          <Image src={image} alt="profile" fill className="rounded-full object-cover" />
        </div>
        <div>
          <button onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-primary px-4 py-2 lg:px-6 lg:py-2.5 text-white text-xs lg:text-sm">
            Ganti foto profil
          </button>
          <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP · Maks 2MB</p>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
      </div>

      {/* CROP MODAL */}
      {showCrop && tempImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] px-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm">
            <div className="relative w-full h-[260px] lg:h-[320px]">
              <Cropper image={tempImage} crop={crop} zoom={zoom} aspect={1} cropShape="round"
                showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
            </div>
            <input type="range" min={1} max={3} step={0.1} value={zoom}
              onChange={e => setZoom(Number(e.target.value))} className="w-full mt-3" />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowCrop(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button>
              <button onClick={handleSaveCrop} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* FORM */}
      <div className="space-y-3">
        {[
          { label: "Nama Lengkap", name: "name",     type: "text"  },
          { label: "Email",        name: "email",    type: "email" },
          { label: "Domisili",     name: "domisili", type: "text"  },
        ].map(field => (
          <div key={field.name}>
            <label className="block text-gray-700 mb-1 text-xs lg:text-sm font-medium">{field.label}</label>
            <input type={field.type} name={field.name} value={(form as any)[field.name]}
              onChange={handleChange} className={inputClass} />
          </div>
        ))}
        <div>
          <label className="block text-gray-700 mb-1 text-xs lg:text-sm font-medium">Jenis Kelamin</label>
          <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
            <option>Perempuan</option>
            <option>Laki-laki</option>
          </select>
        </div>
      </div>

      <button onClick={handleSave}
        className="w-full mt-5 rounded-full bg-primary py-2.5 lg:py-3 text-white text-sm lg:text-base font-semibold hover:bg-primary/80 transition">
        Simpan
      </button>

      <Snackbar open={snackbar.open} message={snackbar.message} type={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
}