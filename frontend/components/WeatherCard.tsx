"use client"

import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useUser } from "@/context/UserContext"
import { PencilLine } from "lucide-react"
import Link from "next/link"

export default function WeatherCard() {
  const { lat, lon, isLoading: isUserLoading } = useUser()

  const { data: weather, isLoading: isWeatherLoading } = useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: async () => {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weathercode,windspeed_10m`)
      if (!res.ok) throw new Error("Gagal memuat cuaca")
      const data = await res.json()
      return data.current
    },
    enabled: !isUserLoading && lat !== null && lon !== null,
    staleTime: 60 * 60 * 1000, // 1 hour
  })

  const { data: location, isLoading: isLocationLoading } = useQuery({
    queryKey: ['location', lat, lon],
    queryFn: async () => {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      if (!res.ok) return "Lokasi terpilih"
      const data = await res.json()
      const addr = data.address
      if (addr) {
        const city = addr.city || addr.town || addr.village || addr.county || "Lokasi tidak diketahui"
        return `${city}, ${addr.state || ""}`
      }
      return "Lokasi terpilih"
    },
    enabled: !isUserLoading && lat !== null && lon !== null,
    staleTime: Infinity,
  })

  return (
    <div className="relative bg-gradient-to-br from-[#14A5FF] to-[#02588E]
      rounded-xl p-2.5 text-white w-full overflow-hidden">

      <Image
        src="/images/cuaca.svg" alt="cuaca" width={90} height={90}
        className="absolute right-[-15px] bottom-[-15px] opacity-10 scale-x-[-1]"
      />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5">
            <Image src="/images/cuaca.svg" alt="cuaca" width={16} height={16} />
            <h3 className="font-semibold text-[11px] lg:text-xs">Informasi Cuaca</h3>
          </div>
          <Link href="/location" className="text-white/80 hover:text-white transition">
            <PencilLine size={16} />
          </Link>
        </div>

        {weather ? (
          <>
            <p className="text-lg lg:text-xl xl:text-2xl font-bold leading-tight">
              {weather.temperature_2m}°C
            </p>
            <p className="text-[9px] lg:text-[10px] opacity-90 truncate">{isLocationLoading ? "Mendeteksi lokasi..." : location}</p>
            <div className="flex mt-1.5 text-[9px] lg:text-[10px] gap-1.5">
              <span>💨 {weather.windspeed_10m} km/h</span>
              <span>|</span>
              <span>💧 {weather.relative_humidity_2m}%</span>
            </div>
          </>
        ) : (
          <p className="text-[10px] mt-1">Loading cuaca...</p>
        )}
      </div>
    </div>
  )
}