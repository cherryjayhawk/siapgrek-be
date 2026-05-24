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
      rounded-2xl lg:rounded-3xl p-5 lg:p-6 text-white w-full overflow-hidden flex flex-col justify-between min-h-[140px] lg:min-h-[180px] shadow-sm">

      <Image
        src="/images/cuaca.svg" alt="cuaca" width={90} height={90}
        className="absolute right-[-15px] bottom-[-15px] opacity-10 scale-x-[-1]"
      />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Image src="/images/cuaca.svg" alt="cuaca" width={24} height={24} />
            <h3 className="font-semibold text-sm lg:text-base">Informasi Cuaca</h3>
          </div>
          <Link href="/location" className="text-white/80 hover:text-white transition">
            <PencilLine size={18} />
          </Link>
        </div>

        {weather ? (
          <div className="mt-2 lg:mt-4">
            <p className="text-xl lg:text-2xl xl:text-3xl font-bold leading-tight tracking-tight">
              {weather.temperature_2m}°C
            </p>
            <p className="text-xs lg:text-sm opacity-90 truncate mt-1">{isLocationLoading ? "Mendeteksi lokasi..." : location}</p>
            <div className="flex mt-2 lg:mt-3 text-xs lg:text-sm gap-2">
              <span>💨 {weather.windspeed_10m} km/h</span>
              <span className="opacity-50">|</span>
              <span>💧 {weather.relative_humidity_2m}%</span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] mt-1">Loading cuaca...</p>
        )}
      </div>
    </div>
  )
}