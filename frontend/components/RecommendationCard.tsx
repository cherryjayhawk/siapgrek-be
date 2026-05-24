"use client"

import { useState } from "react"
import Image from "next/image"
import DetailRekomendasi from "./DetailRekomendasi"
import { PencilLine } from "lucide-react"
import Link from "next/link"

type Props = {
  sensorData?: {
    temp: number | null
    moist: number | null
    ph: number | null
    ec: number | null
  }
}

export default function RecommendationCard({ sensorData }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="relative bg-gradient-to-br from-[#AE2D7B] to-[#64003C]
        rounded-2xl lg:rounded-3xl p-5 lg:p-6 text-white w-full overflow-hidden flex flex-col justify-between min-h-[140px] lg:min-h-[180px] shadow-sm">

        <Image
          src="/images/rekomendasi.svg" alt="bg" width={90} height={90}
          className="absolute right-[-15px] bottom-[-15px] opacity-10 scale-x-[-1]"
        />

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-start gap-2">
              <Image src="/images/rekomendasi.svg" alt="" width={24} height={24} />
              <h3 className="font-semibold text-sm lg:text-base">Rekomendasi</h3>
            </div>
            <Link href="/knowledge" aria-label="Edit Dokumen" className="text-white/80 hover:text-white transition">
              <PencilLine size={18} />
            </Link>
          </div>

          <p className="text-xs lg:text-sm opacity-90 mt-2">
            Lihat saran perlakuan untuk tiap tanaman anggrek kamu
          </p>

          <button
            onClick={() => setOpen(true)}
            className="mt-4 bg-white text-[#64003C] text-xs lg:text-sm
              font-medium rounded-lg py-2 lg:py-2.5 hover:bg-gray-100 transition shadow-sm w-full"
          >
            Lihat Rekomendasi
          </button>
        </div>
      </div>

      <DetailRekomendasi open={open} onClose={() => setOpen(false)} sensorData={sensorData} />
    </>
  )
}