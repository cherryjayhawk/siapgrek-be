"use client"

import { useState } from "react"
import Image from "next/image"
import DetailRekomendasi from "./DetailRekomendasi"

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
        rounded-xl p-2.5 text-white w-full overflow-hidden">

        <Image
          src="/images/rekomendasi.svg" alt="bg" width={90} height={90}
          className="absolute right-[-15px] bottom-[-15px] opacity-10 scale-x-[-1]"
        />

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-start gap-1.5">
            <Image src="/images/rekomendasi.svg" alt="" width={16} height={16} className="mt-0.5" />
            <h3 className="font-semibold text-[11px] lg:text-xs">Rekomendasi</h3>
          </div>

          <p className="text-[9px] lg:text-[10px] opacity-90 mt-1 lg:mt-1.5">
            Lihat saran perlakuan untuk tiap tanaman anggrek kamu
          </p>

          <button
            onClick={() => setOpen(true)}
            className="mt-2 lg:mt-3 bg-white text-[#64003C] text-[9px] lg:text-[10px]
              font-medium rounded-md py-1 lg:py-1.5 hover:bg-gray-100 transition"
          >
            Lihat Rekomendasi
          </button>
        </div>
      </div>

      <DetailRekomendasi open={open} onClose={() => setOpen(false)} sensorData={sensorData} />
    </>
  )
}