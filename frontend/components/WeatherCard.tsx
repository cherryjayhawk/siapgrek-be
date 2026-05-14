"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function WeatherCard() {
  const [weather, setWeather] = useState<any>(null)
  const [location, setLocation] = useState("Mendeteksi lokasi...")
  const [icon, setIcon] = useState("🌤️")

  useEffect(() => {
    if (!navigator.geolocation) { setLocation("Browser tidak mendukung lokasi"); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        try {
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weathercode,windspeed_10m`)
          const weatherData = await weatherRes.json()
          const current = weatherData.current
          setWeather(current)
          setIcon(getWeatherIcon(current.weathercode))
          const locRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          const locData = await locRes.json()
          const addr = locData.address
          const city = addr.city || addr.town || addr.village || addr.county || "Lokasi tidak diketahui"
          setLocation(`${city}, ${addr.state || ""}`)
        } catch { setLocation("Gagal memuat lokasi") }
      },
      () => setLocation("Izin lokasi ditolak")
    )
  }, [])

  const getWeatherIcon = (code: number) => {
    if (code === 0) return "☀️"
    if (code <= 2) return "🌤️"
    if (code <= 45) return "🌫️"
    if (code <= 65) return "🌧️"
    if (code <= 75) return "❄️"
    if (code <= 86) return "🌨️"
    if (code >= 95) return "⛈️"
    return "🌡️"
  }

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
          <span className="text-base lg:text-lg">{icon}</span>
        </div>

        {weather ? (
          <>
            <p className="text-lg lg:text-xl xl:text-2xl font-bold leading-tight">
              {weather.temperature_2m}°C
            </p>
            <p className="text-[9px] lg:text-[10px] opacity-90 truncate">{location}</p>
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