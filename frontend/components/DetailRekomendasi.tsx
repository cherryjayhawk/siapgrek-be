"use client"

import Image from "next/image"
import SensorCard from "./SensorCard"

import { useRouter } from "next/navigation"

type Props = {
  open: boolean
  onClose: () => void
}

function getScore(value: number, type: string) {
  if (type === "temp") {
    if (value >= 20 && value <= 30) return 100
    if (value > 30 && value <= 33) return 70
    return 40
  }
  if (type === "moist") {
    if (value >= 40 && value <= 70) return 100
    if (value > 70 && value <= 80) return 70
    return 40
  }
  if (type === "ph") {
    if (value >= 5.5 && value <= 6.5) return 100
    if (value > 6.5 && value <= 7) return 70
    return 40
  }
  if (type === "ec") {
    if (value >= 0.8 && value <= 1.5) return 100
    if (value > 1.5 && value <= 2) return 70
    return 40
  }
  return 0
}

export default function DetailRekomendasi({ open, onClose }: Props) {
  const router = useRouter()

  if (!open) return null

  const temp = 35
  const moist = 75
  const ph = 6.7
  const ec = 1.8

  const score = (getScore(temp, "temp") + getScore(moist, "moist") + getScore(ph, "ph") + getScore(ec, "ec")) / 4
  const kondisi = Math.round(score)

  let status = "Anggrek Sehat"
  let color = "green"
  if (kondisi < 80) { status = "Perlu Perhatian"; color = "orange" }
  if (kondisi < 60) { status = "Anggrek Terancam"; color = "red" }

  const badgeColor =
    color === "green" ? "bg-green-100 text-green-600"
    : color === "orange" ? "bg-orange-100 text-orange-600"
    : "bg-red-100 text-red-500"

  const insightText = `Tanaman menunjukkan kondisi yang perlu diperhatikan. Suhu lingkungan terlalu tinggi dan kelembapan tanah berlebih. Disarankan meningkatkan sirkulasi udara, mengurangi frekuensi penyiraman, serta memantau kondisi pH tanah secara berkala agar kondisi tanaman kembali optimal.`

  const handleTanyaAI = () => {
    localStorage.setItem("chatInsight", insightText)
    router.push("/chat")
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      {/* ukuran modal sama persis, tidak diubah */}
      <div
        className="bg-gray-100 rounded-2xl p-2.5 w-full max-w-[500px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >

        {/* CLOSE */}
        <div className="flex justify-end mb-1.5">
          <button
            onClick={onClose}
            className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-3 gap-2">

          {/* KONDISI TANAMAN */}
          <div className="bg-white rounded-xl p-2 aspect-square flex flex-col justify-between">
            <div>
              {/* icon naik dari 14 → 18 */}
              <Image src="/images/kondisi.svg" alt="kondisi" width={18} height={18} className="mb-1" />
              {/* label naik dari [8px] → [10px] */}
              <p className="text-gray-700 text-[10px]">Kondisi Tanaman</p>
            </div>
            <div>
              <div className="flex items-end gap-0.5">
                {/* value naik dari text-xl → text-2xl */}
                <span className="text-4xl font-normal tracking-[-0.06em]">{kondisi}</span>
                <span className="text-gray-400 text-xs pb-0.5">%</span>
              </div>
              {/* badge font naik dari [8px] → [10px] */}
              <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded-full ${badgeColor}`}>
                {status}
              </span>
            </div>
          </div>

          <SensorCard icon="/images/temp.svg" label="Suhu" value={temp.toString()} unit="°C" square />
          <SensorCard icon="/images/moist.svg" label="Kelembapan Tanah" value={moist.toString()} unit="%" square />
          <SensorCard icon="/images/ph.svg" label="pH" value={ph.toString()} square />

          {/* INSIGHT */}
          <div className="bg-white rounded-xl p-2 col-span-2 row-span-2 flex flex-col">
            <Image src="/images/insight.svg" alt="insight" width={18} height={18} className="mb-1" />
            {/* judul naik dari [9px] → [11px] */}
            <p className="text-gray-700 font-medium text-[11px] mb-1.5">Rekomendasi Perlakuan</p>
            {/* teks naik dari [8px] → [10px] */}
            <p className="text-gray-600 text-[10px] leading-relaxed flex-1">
              {insightText}
            </p>
            <button
              onClick={handleTanyaAI}
              className="mt-2 w-full bg-primary text-white py-1.5 rounded-lg text-[11px] font-medium"
            >
              Tanya AI
            </button>
          </div>

          <SensorCard icon="/images/conductivity.svg" label="Conductivity" value={ec.toString()} unit="mS/Cm" square />

        </div>
      </div>
    </div>
  )
}