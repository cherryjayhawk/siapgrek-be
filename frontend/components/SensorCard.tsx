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

  // Mode dashboard — tidak diubah
  return (
    <div className="bg-white rounded-xl p-2.5 lg:p-3.5 w-[115px] lg:w-[150px] xl:w-[175px]">
      <Image src={icon} alt={label} width={18} height={18} className="mb-1 lg:w-5 lg:h-5" />
      <p className="text-gray-700 text-[9px] lg:text-[11px] mb-3 lg:mb-5">{label}</p>
      <div className="flex items-end gap-0.5">
        <span className="text-xl lg:text-2xl xl:text-3xl font-normal leading-none tracking-[-0.06em] tabular-nums">
          {value}
        </span>
        {unit && <span className="text-gray-400 text-[9px] lg:text-xs xl:text-sm pb-0.5">{unit}</span>}
      </div>
      <div className="flex items-center gap-1 mt-1.5">
        <Image src={statusIcon[color]} alt={color} width={10} height={10} className="lg:w-3 lg:h-3" />
        <p className="text-gray-600 text-[9px] lg:text-[10px]">{status}</p>
      </div>
    </div>
  )
}