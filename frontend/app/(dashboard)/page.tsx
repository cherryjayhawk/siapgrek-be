'use client'

import { useState, useEffect } from "react"

import WeatherCard from "@/components/WeatherCard"
import EnvironmentCard from "@/components/EnvironmentCard"
import RecommendationCard from "@/components/RecommendationCard"
import ControlMenu from "@/components/ControlMenu"
import SensorCard from "@/components/SensorCard"

import { useRouter } from "next/navigation"

export default function Dashboard() {
  const router = useRouter()

  const [selectedSlave, setSelectedSlave] = useState("slave_1")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actuatorStatus, setActuatorStatus] = useState<{ misting: boolean; watering: boolean }>({
    misting: false,
    watering: false,
  })

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        // Use Next.js rewrite
        const res = await fetch("/api/sensor?device_id=node01")
        if (res.ok) {
          const json = await res.json()
          setData(json)
          if (json.soil_sensors && json.soil_sensors.length > 0) {
             // If current selected slave doesn't exist, set to first available
             if (!json.soil_sensors.find((s: any) => s.slave_id === selectedSlave)) {
                 setSelectedSlave(json.soil_sensors[0].slave_id)
             }
          }
        }
      } catch (err) {
        console.error("Failed to fetch telemetry:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTelemetry()
    const intv = setInterval(fetchTelemetry, 10000)
    return () => clearInterval(intv)
  }, [selectedSlave])

  // Fetch latest actuator status from command log
  useEffect(() => {
    const fetchActuatorStatus = async () => {
      try {
        const res = await fetch("/api/command-log?device_id=node01&limit=10")
        if (res.ok) {
          const json = await res.json()
          const logs = json.data || []
          // Find the latest command for each actuator type
          const latestMisting = logs.find((l: any) => l.actuator.includes("misting"))
          const latestWatering = logs.find((l: any) => l.actuator.includes("watering"))
          setActuatorStatus({
            misting: latestMisting?.command_value === 1,
            watering: latestWatering?.command_value === 1,
          })
        }
      } catch (err) {
        console.error("Failed to fetch actuator status:", err)
      }
    }
    fetchActuatorStatus()
    const intv = setInterval(fetchActuatorStatus, 15000)
    return () => clearInterval(intv)
  }, [])

  const handleLihatGrafik = () => router.push("/grafik")
  
  const currentSoil = data?.soil_sensors?.find((s: any) => s.slave_id === selectedSlave) || {}

  // Prepare sensor data for RecommendationCard
  const sensorData = {
    temp: currentSoil.soil_temperature ?? data?.env_temperature ?? null,
    moist: currentSoil.soil_humidity ?? null,
    ph: currentSoil.soil_ph ?? null,
    ec: currentSoil.soil_conductivity ?? null,
  }

  return (
    <div className="space-y-3 lg:space-y-4">

      {/* TITLE */}
      <h1 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold">Dashboard Monitoring</h1>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 w-full">
        <WeatherCard />
        <EnvironmentCard data={{
           temp: data?.env_temperature,
           humidity: data?.env_humidity,
           lux: data?.light_lux
        }} />
        <RecommendationCard sensorData={sensorData} />
      </div>
      
      {/* FLOATING FAB MENU */}
      <ControlMenu />

      {/* DROPDOWN + BUTTON */}
      <div className="flex items-center gap-2 lg:gap-3">
        <select
          value={selectedSlave}
          onChange={(e) => setSelectedSlave(e.target.value)}
          className="px-2.5 py-1.5 border rounded-lg bg-white text-xs lg:text-sm"
        >
          {data?.soil_sensors?.length ? (
             data.soil_sensors.map((s: any) => (
                <option key={s.slave_id} value={s.slave_id}>Slave: {s.slave_id}</option>
             ))
          ) : (
             <option value="slave_1">Waiting for sensors...</option>
          )}
        </select>
        <button
          onClick={handleLihatGrafik}
          className="px-3 py-1.5 lg:px-4 lg:py-2 bg-primary text-white rounded-lg text-xs lg:text-sm"
        >
          Lihat Grafik
        </button>
      </div>

      {/* AKTUATOR STATUS — now live */}
      <div className="bg-gray-100 rounded-2xl p-2.5 w-fit">
        <div className="flex gap-2 lg:gap-3">
          <div className="bg-white rounded-xl px-2.5 py-2 w-[90px] sm:w-[100px] lg:w-[115px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <img src="/images/misting.svg" className="w-3 lg:w-4" />
              <span className="text-[10px] lg:text-xs">Misting</span>
            </div>
            <div className={`text-sm lg:text-base font-semibold ${actuatorStatus.misting ? "text-green-600" : "text-red-700"}`}>
              {actuatorStatus.misting ? "ON" : "OFF"}
            </div>
          </div>
          <div className="bg-white rounded-xl px-2.5 py-2 w-[90px] sm:w-[100px] lg:w-[115px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <img src="/images/watering.svg" className="w-3 lg:w-4" />
              <span className="text-[10px] lg:text-xs">Watering</span>
            </div>
            <div className={`text-sm lg:text-base font-semibold ${actuatorStatus.watering ? "text-green-600" : "text-red-700"}`}>
              {actuatorStatus.watering ? "ON" : "OFF"}
            </div>
          </div>
        </div>
      </div>

      {/* SENSOR CARDS */}
      <div className="overflow-x-auto pb-1">
        <div className="bg-gray-100 rounded-2xl lg:rounded-3xl p-3 lg:p-5 w-fit">
          <div className="flex gap-3 lg:gap-5">
            <SensorCard icon="/images/temp.svg" label="Suhu Tanah" value={currentSoil.soil_temperature ?? "-"} unit="°C" />
            <SensorCard icon="/images/moist.svg" label="Kelembapan Tanah" value={currentSoil.soil_humidity ?? "-"} unit="%" />
            <SensorCard icon="/images/ph.svg" label="pH" value={currentSoil.soil_ph ?? "-"} />
            <SensorCard icon="/images/conductivity.svg" label="Conductivity" value={currentSoil.soil_conductivity ?? "-"} unit="mS/Cm" />
          </div>
        </div>
      </div>

    </div>
  )
}