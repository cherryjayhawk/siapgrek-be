"use client"

import Image from "next/image"

type Props = {
  icon: string
  label: string
  value: string
  unit?: string
  square?: boolean
}

export default function SensorCard({ icon, label, value, unit, square }: Props) {

  const val = parseFloat(value)
  let color: "green" | "yellow" | "red" = "green"
  let status = ""

  if (label.includes("Suhu")) {
    if (val < 18) { color = "yellow"; status = "Terlalu dingin" }
    else if (val <= 30) { color = "green"; status = "Suhu ideal" }
    else { color = "red"; status = "Terlalu panas" }
  }
  if (label.includes("Kelembapan Tanah")) {
    if (val < 40) { color = "red"; status = "Tanah terlalu kering" }
    else if (val <= 70) { color = "green"; status = "Kelembapan ideal" }
    else { color = "yellow"; status = "Terlalu lembap" }
  }
  if (label.includes("pH")) {
    if (val < 5.5) { color = "red"; status = "pH terlalu asam" }
    else if (val <= 6.5) { color = "green"; status = "pH ideal" }
    else { color = "yellow"; status = "pH terlalu basa" }
  }
  if (label.includes("Conductivity")) {
    if (val < 0.8) { color = "yellow"; status = "Nutrisi rendah" }
    else if (val <= 1.5) { color = "green"; status = "Nutrisi ideal" }
    else { color = "red"; status = "Nutrisi berlebih" }
  }

  const statusIcon = { green: "/images/green.svg", yellow: "/images/yellow.svg", red: "/images/red.svg" }

  if (square) {
    return (
      <div className="bg-white rounded-xl p-2 aspect-square flex flex-col justify-between">
        <div>
          {/* icon naik dari 14 → 18 */}
          <Image src={icon} alt={label} width={18} height={18} className="mb-1" />
          {/* label naik dari [8px] → [10px] */}
          <p className="text-gray-700 text-[10px]">{label}</p>
        </div>
        <div>
          <div className="flex items-end gap-0.5">
            {/* value naik dari text-xl → text-2xl */}
            <span className="text-4xl font-normal leading-none tracking-[-0.06em] tabular-nums">
              {value}
            </span>
            {unit && <span className="text-gray-400 text-[10px] pb-0.5">{unit}</span>}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {/* status dot naik dari 8 → 10 */}
            <Image src={statusIcon[color]} alt={color} width={10} height={10} />
            {/* status text naik dari [8px] → [10px] */}
            <p className="text-gray-600 text-[10px]">{status}</p>
          </div>
        </div>
      </div>
    )
  }

  // Mode dashboard
  return (
    <div className="bg-white rounded-2xl p-4 lg:p-6 w-full flex flex-col justify-between shadow-sm min-h-[130px] lg:min-h-[160px]">
      <div>
        <Image src={icon} alt={label} width={24} height={24} className="mb-2 lg:w-7 lg:h-7" />
        <p className="text-gray-500 text-xs lg:text-sm">{label}</p>
      </div>
      <div className="mt-4 lg:mt-6">
        <div className="flex items-end gap-1">
          <span className="text-3xl lg:text-4xl xl:text-[44px] font-normal leading-none tracking-[-0.04em] tabular-nums text-gray-800">
            {value}
          </span>
          {unit && <span className="text-gray-400 text-sm lg:text-base xl:text-lg pb-0.5 lg:pb-1">{unit}</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-3 lg:mt-4">
          <Image src={statusIcon[color]} alt={color} width={12} height={12} className="lg:w-3.5 lg:h-3.5" />
          <p className="text-gray-500 text-[10px] lg:text-xs">{status}</p>
        </div>
      </div>
    </div>
  )
}