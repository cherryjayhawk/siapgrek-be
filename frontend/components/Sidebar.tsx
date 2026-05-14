'use client'

import Image from 'next/image'
import { useState } from 'react'

type Props = {
  active: string
  setActive: (menu: string) => void
}

export default function Sidebar({ active, setActive }: Props) {

  const [showLogout, setShowLogout] = useState(false)

  const mainMenu = [
    { name: 'dashboard', label: 'Dashboard',     icon: '/images/Dashboard.png'      },
    { name: 'penyakit',  label: 'Penyakit',      icon: '/images/Penyakit.png'       },
    { name: 'log',       label: 'Log Aktivitas', icon: '/images/Log Aktivitas.png'  },
    { name: 'chat',      label: 'Chat',           icon: '/images/Chat.png'           },
  ]

  const profileMenu = [
    { name: 'profile',  label: 'Edit Profil',    icon: '/images/profile.svg'   },
    { name: 'password', label: 'Ganti Password', icon: '/images/password.svg'  },
    { name: 'faq',      label: 'Pusat Bantuan',  icon: '/images/FAQ.png'       },
    { name: 'main',     label: 'Halaman Utama',  icon: '/images/main_page.svg' },
  ]

  const isProfile =
    active === "myprofile" ||
    active === "profile"   ||
    active === "password"  ||
    active === "faq"

  const menu = isProfile ? profileMenu : mainMenu

  const handleClick = (name: string) => {
    if (name === "main") { setActive("dashboard"); return; }
    setActive(name)
  }

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex w-44 lg:w-52 xl:w-56 bg-white rounded-2xl lg:rounded-3xl p-3 lg:p-4 flex-col justify-between flex-shrink-0">
        <nav className="space-y-1 lg:space-y-2">
          {menu.map(item => {
            const isActive = active === item.name
            return (
              <button
                key={item.name}
                onClick={() => handleClick(item.name)}
                className={`
                  flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-2.5
                  rounded-xl w-full text-left font-medium transition text-xs lg:text-sm
                  ${isActive ? 'bg-selected text-primary' : 'text-gray-500 hover:bg-gray-100'}
                `}
              >
                <Image src={item.icon} alt={item.label} width={18} height={18}
                  className={isActive ? '' : 'grayscale opacity-40'} />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {isProfile && (
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl w-full text-left font-medium bg-red-600 text-white hover:bg-red-700 transition text-xs lg:text-sm"
          >
            <Image src="/images/logout.svg" alt="logout" width={18} height={18} />
            Keluar
          </button>
        )}
      </aside>

      {/* ===== MOBILE BOTTOM NAV — disembunyikan saat di profile ===== */}
      {!isProfile && (
        <div className="md:hidden fixed bottom-3 left-3 right-3 bg-white px-3 py-2.5 rounded-2xl shadow-lg flex items-center justify-evenly z-50">
          {mainMenu.map(item => {
            const isActive = active === item.name
            return isActive ? (
              <button
                key={item.name}
                onClick={() => handleClick(item.name)}
                className="flex items-center gap-1.5 bg-selected px-2.5 py-2 rounded-xl"
              >
                <Image src={item.icon} alt={item.label} width={18} height={18} />
                <span className="text-primary text-xs font-medium whitespace-nowrap">{item.label}</span>
              </button>
            ) : (
              <button
                key={item.name}
                onClick={() => handleClick(item.name)}
                className="bg-gray-100 p-2 rounded-xl"
              >
                <Image src={item.icon} alt={item.label} width={18} height={18} className="grayscale opacity-40" />
              </button>
            )
          })}
        </div>
      )}

      {/* ===== LOGOUT MODAL ===== */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs">
            <h2 className="text-base font-semibold mb-1.5">Konfirmasi Logout</h2>
            <p className="text-gray-600 text-sm mb-5">Apakah anda yakin ingin keluar?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowLogout(false)}
                className="px-4 py-2 rounded-lg border text-sm">Batal</button>
              <button onClick={() => { window.location.href = "/login" }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm">Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}