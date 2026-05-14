"use client"

import { useEffect, useState } from "react"
import axios from "axios"

export default function EnvironmentCard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    axios.get("/api/sensor").then((res) => setData(res.data))
  }, [])

  return (
    <div className="relative bg-gradient-to-br from-[#00BD6E] to-[#007E45]
      rounded-xl p-2.5 text-white w-full overflow-hidden">

      <svg
        width="120" height="110" viewBox="0 0 24 24"
        fill="rgba(50,167,97,1)"
        className="absolute right-[-40px] bottom-[-20px] opacity-50 scale-x-[-1]"
      >
        <path d="M2.5 27.5V25C2.5 25 8.75 22.5 15 22.5C21.25 22.5 27.5 25 27.5 25V27.5H2.5ZM14.125 11.375C12.625 6.50001 5 7.62501 5 7.62501C5 7.62501 5.25 17.375 12.375 15.875C11.875 12.25 10 11.25 10 11.25C13.5 11.25 13.75 15.5 13.75 15.5V21.25H16.25V16C16.25 16 16.25 11.125 20 9.87501C20 9.87501 17.5 13.625 17.5 16.125C26.25 17 26.25 5.00001 26.25 5.00001C26.25 5.00001 15.125 3.75001 14.125 11.375Z"/>
      </svg>

      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-2 lg:mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M2.5 27.5V25C2.5 25 8.75 22.5 15 22.5C21.25 22.5 27.5 25 27.5 25V27.5H2.5ZM14.125 11.375C12.625 6.50001 5 7.62501 5 7.62501C5 7.62501 5.25 17.375 12.375 15.875C11.875 12.25 10 11.25 10 11.25C13.5 11.25 13.75 15.5 13.75 15.5V21.25H16.25V16C16.25 16 16.25 11.125 20 9.87501C20 9.87501 17.5 13.625 17.5 16.125C26.25 17 26.25 5.00001 26.25 5.00001C26.25 5.00001 15.125 3.75001 14.125 11.375Z"/>
          </svg>
          <h3 className="font-semibold text-[11px] lg:text-xs">Informasi Lingkungan</h3>
        </div>

        {data ? (
          <div className="flex justify-between">
            <div>
              <p className="text-[9px] lg:text-[10px] opacity-80">Suhu</p>
              <p className="text-sm lg:text-base xl:text-lg font-bold">{data.suhu}°C</p>
            </div>
            <div>
              <p className="text-[9px] lg:text-[10px] opacity-80">Kelembapan</p>
              <p className="text-sm lg:text-base xl:text-lg font-bold">{data.kelembapan}%</p>
            </div>
            <div>
              <p className="text-[9px] lg:text-[10px] opacity-80">Cahaya</p>
              <p className="text-sm lg:text-base xl:text-lg font-bold">{data.cahaya}</p>
            </div>
          </div>
        ) : (
          <p className="text-[10px]">Loading...</p>
        )}
      </div>
    </div>
  )
}