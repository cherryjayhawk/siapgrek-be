"use client";

import { useUser } from "@/context/UserContext";
import { momoTrust } from "@/lib/fonts";
import Snackbar from "@/components/Snackbar";
import { useState } from "react";
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function LocationPage() {
  const { lat, lon, setLat, setLon } = useUser();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" as "success" | "error" });

  const handleLocationChange = (newLat: number, newLon: number) => {
    setLat(newLat);
    setLon(newLon);
    setSnackbar({ open: true, message: "Lokasi berhasil disimpan & disinkronisasi", type: "success" });
  };

  return (
    <div className="w-full max-w-xl pb-20">
      <div className="flex items-center gap-3 mb-5 lg:mb-7">
        <div>
          <h2 className={`${momoTrust.className} text-xl lg:text-2xl font-bold text-primary leading-tight`}>
            Lokasi Greenhouse
          </h2>
          <p className="text-gray-500 text-xs lg:text-sm">Konfigurasi lokasi greenhouse</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-1">Lokasi Greenhouse</h3>
        <p className="text-xs text-gray-500 mb-4">Pilih lokasi greenhouse anda untuk sinkronisasi prediksi cuaca otomatis.</p>
        
        <MapPicker 
          lat={lat} 
          lon={lon} 
          onChange={handleLocationChange} 
        />
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex flex-col gap-1">
          <span className="text-xs text-blue-700 font-medium">Informasi Koordinat</span>
          <span className="text-xs text-blue-600">Latitude: {lat}</span>
          <span className="text-xs text-blue-600">Longitude: {lon}</span>
        </div>
      </div>

      <Snackbar open={snackbar.open} message={snackbar.message} type={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
}
