"use client"

import Image from "next/image"
import SensorCard from "./SensorCard"

import { useRouter } from "next/navigation"

type SensorData = {
  temp: number | null
  moist: number | null
  ph: number | null
  ec: number | null
}

type Props = {
  open: boolean
  onClose: () => void
  sensorData?: SensorData
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

function generateInsight(temp: number, moist: number, ph: number, ec: number): string {
  const issues: string[] = []
  if (temp > 33) issues.push("suhu lingkungan terlalu tinggi")
  else if (temp < 20) issues.push("suhu lingkungan terlalu rendah")
  if (moist > 80) issues.push("kelembapan tanah berlebih")
  else if (moist < 40) issues.push("kelembapan tanah terlalu rendah")
  if (ph < 5.5) issues.push("pH tanah terlalu asam")
  else if (ph > 7) issues.push("pH tanah terlalu basa")
  if (ec > 2) issues.push("konduktivitas tanah berlebih")
  else if (ec < 0.8) issues.push("konduktivitas tanah terlalu rendah")

  if (issues.length === 0) {
    return "Semua parameter tanaman dalam kondisi optimal. Pertahankan perawatan saat ini dan pantau secara berkala."
  }

  return `Tanaman menunjukkan kondisi yang perlu diperhatikan. Terdeteksi ${issues.join(", ")}. Disarankan untuk menyesuaikan perawatan dan memantau kondisi secara berkala agar tanaman kembali optimal.`
}

export default function DetailRekomendasi({ open, onClose, sensorData }: Props) {
  const router = useRouter()

  if (!open) return null

  // Use live data if available, fallback to defaults
  const temp = sensorData?.temp ?? 0
  const moist = sensorData?.moist ?? 0
  const ph = sensorData?.ph ?? 0
  const ec = sensorData?.ec ?? 0

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

  const insightText = generateInsight(temp, moist, ph, ec)

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
              <Image src="/images/kondisi.svg" alt="kondisi" width={18} height={18} className="mb-1" />
              <p className="text-gray-700 text-[10px]">Kondisi Tanaman</p>
            </div>
            <div>
              <div className="flex items-end gap-0.5">
                <span className="text-4xl font-normal tracking-[-0.06em]">{kondisi}</span>
                <span className="text-gray-400 text-xs pb-0.5">%</span>
              </div>
              <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded-full ${badgeColor}`}>
                {status}
              </span>
            </div>
          </div>

          <SensorCard icon="/images/temp.svg" label="Suhu" value={temp.toFixed(1)} unit="°C" square />
          <SensorCard icon="/images/moist.svg" label="Kelembapan Tanah" value={moist.toFixed(1)} unit="%" square />
          <SensorCard icon="/images/ph.svg" label="pH" value={ph.toFixed(1)} square />

          {/* INSIGHT */}
          <div className="bg-white rounded-xl p-2 col-span-2 row-span-2 flex flex-col">
            <Image src="/images/insight.svg" alt="insight" width={18} height={18} className="mb-1" />
            <p className="text-gray-700 font-medium text-[11px] mb-1.5">Rekomendasi Perlakuan</p>
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

          <SensorCard icon="/images/conductivity.svg" label="Conductivity" value={ec.toFixed(1)} unit="mS/Cm" square />

        </div>
      </div>
    </div>
  )
}