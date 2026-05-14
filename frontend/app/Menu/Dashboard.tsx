'use client'

import { useState } from "react"

import WeatherCard from "../../components/WeatherCard"
import EnvironmentCard from "../../components/EnvironmentCard"
import RecommendationCard from "../../components/RecommendationCard"
import ControlMenu from "../../components/ControlMenu"
import SensorCard from "../../components/SensorCard"

type Props = {
  setActiveMenu: (menu: string) => void
}

export default function Dashboard({ setActiveMenu }: Props) {

  const [selectedPlant, setSelectedPlant] = useState("ID001")

  const soilData: any = {
    ID001: { temp: 35, humidity: 75, ph: 6.7, ec: 1.8 },
    ID002: { temp: 28, humidity: 60, ph: 6.2, ec: 1.3 },
    ID003: { temp: 30, humidity: 68, ph: 6.5, ec: 1.5 }
  }

  const handleLihatGrafik = () => setActiveMenu("grafik")
  const currentData = soilData[selectedPlant]

  return (
    <div className="space-y-3 lg:space-y-4">

      {/* TITLE */}
      <h1 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold">Dashboard Monitoring</h1>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 lg:gap-3">
        <WeatherCard />
        <EnvironmentCard />
        <RecommendationCard setActiveMenu={setActiveMenu} />
        <div className="sm:col-span-2 xl:col-span-1">
          <ControlMenu />
        </div>
      </div>

      {/* DROPDOWN + BUTTON */}
      <div className="flex items-center gap-2 lg:gap-3">
        <select
          value={selectedPlant}
          onChange={(e) => setSelectedPlant(e.target.value)}
          className="px-2.5 py-1.5 border rounded-lg bg-white text-xs lg:text-sm"
        >
          <option value="ID001">ID 001</option>
          <option value="ID002">ID 002</option>
          <option value="ID003">ID 003</option>
        </select>
        <button
          onClick={handleLihatGrafik}
          className="px-3 py-1.5 lg:px-4 lg:py-2 bg-primary text-white rounded-lg text-xs lg:text-sm"
        >
          Lihat Grafik
        </button>
      </div>

      {/* AKTUATOR STATUS */}
      <div className="bg-gray-100 rounded-2xl p-2.5 w-fit">
        <div className="flex gap-2 lg:gap-3">
          <div className="bg-white rounded-xl px-2.5 py-2 w-[90px] sm:w-[100px] lg:w-[115px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <img src="/images/misting.svg" className="w-3 lg:w-4" />
              <span className="text-[10px] lg:text-xs">Misting</span>
            </div>
            <div className="text-sm lg:text-base font-semibold text-green-600">ON</div>
          </div>
          <div className="bg-white rounded-xl px-2.5 py-2 w-[90px] sm:w-[100px] lg:w-[115px] shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <img src="/images/watering.svg" className="w-3 lg:w-4" />
              <span className="text-[10px] lg:text-xs">Watering</span>
            </div>
            <div className="text-sm lg:text-base font-semibold text-red-700">OFF</div>
          </div>
        </div>
      </div>

      {/* SENSOR CARDS — w-fit container hugs the 4 cards, scrollable on small screens */}
      <div className="overflow-x-auto pb-1">
        <div className="bg-gray-100 rounded-2xl lg:rounded-3xl p-3 lg:p-5 w-fit">
          <div className="flex gap-3 lg:gap-5">
            <SensorCard icon="/images/temp.svg" label="Suhu" value={currentData.temp} unit="°C" />
            <SensorCard icon="/images/moist.svg" label="Kelembapan Tanah" value={currentData.humidity} unit="%" />
            <SensorCard icon="/images/ph.svg" label="pH" value={currentData.ph} />
            <SensorCard icon="/images/conductivity.svg" label="Conductivity" value={currentData.ec} unit="mS/Cm" />
          </div>
        </div>
      </div>

    </div>
  )
}