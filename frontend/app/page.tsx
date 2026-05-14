'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Dashboard from './Menu/Dashboard'
import Penyakit from './Menu/Penyakit'
import LogAktivitas from './Menu/LogAktivitas'
import Chat from "./Menu/Chat"
import GrafikTanaman from "./Menu/GrafikTanaman"
import MyProfile from "./Menu/MyProfile/MyProfile"

function AppContent() {
  const searchParams = useSearchParams()
  const [activeMenu, setActiveMenu] = useState("dashboard")

  useEffect(() => {
    const active = searchParams.get("active")
    if (active) setActiveMenu(active)
  }, [searchParams])

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard": return <Dashboard setActiveMenu={setActiveMenu} />
      case "penyakit":  return <Penyakit />
      case "log":       return <LogAktivitas />
      case "grafik":    return <GrafikTanaman setActiveMenu={setActiveMenu} />
      case "chat":      return <Chat />
      case "myprofile":
      case "profile":
      case "password":
      case "faq":       return <MyProfile active={activeMenu} setActive={setActiveMenu} />
      default:          return <Dashboard setActiveMenu={setActiveMenu} />
    }
  }

  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      <div className="flex flex-col h-full p-2 sm:p-3 lg:p-5 gap-2 sm:gap-3 lg:gap-5">
        <Navbar setActiveMenu={setActiveMenu} activeMenu={activeMenu} />
        <div className="flex flex-1 gap-2 sm:gap-3 lg:gap-5 overflow-hidden min-h-0">
          <Sidebar active={activeMenu} setActive={setActiveMenu} />
          <main className="flex-1 bg-white rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 overflow-y-auto min-h-0 pb-20 md:pb-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <AppContent />
    </Suspense>
  )
}