'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'
import { Brain, KeyRound, MapPinned, MessageCircleQuestionMark, UserRound } from 'lucide-react'

export default function Sidebar() {
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const mainMenu = [
    { path: '/',         label: 'Dashboard',     icon: '/images/Dashboard.png'      },
    { path: '/penyakit', label: 'Penyakit',      icon: '/images/Penyakit.png'       },
    { path: '/log',      label: 'Log Aktivitas', icon: '/images/Log Aktivitas.png'  },
    { path: '/chat',     label: 'Chat',          icon: '/images/Chat.png'           },
  ]

  const profileMenu = [
    { path: '/profile',  label: 'Edit Profil',    icon: <UserRound />   },
    { path: '/password', label: 'Ganti Password', icon: <KeyRound />  },
    { path: '/location', label: 'Lokasi Greenhouse',icon: <MapPinned />  },
    { path: '/knowledge',label: 'Pengetahuan AI', icon: <Brain /> },
    { path: '/faq',      label: 'Pusat Bantuan',  icon: <MessageCircleQuestionMark />       },
    { path: '/',         label: 'Halaman Utama',  icon: '/images/main_page.svg' },
  ]

  const isProfile = pathname?.startsWith("/profile") || pathname?.startsWith("/password") || pathname?.startsWith("/faq") || pathname?.startsWith("/knowledge") || pathname?.startsWith("/location")
  const menu = isProfile ? profileMenu : mainMenu

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex w-44 lg:w-52 xl:w-56 bg-white rounded-2xl lg:rounded-3xl p-3 lg:p-4 flex-col justify-between flex-shrink-0">
        <nav className="space-y-1 lg:space-y-2">
          {menu.map(item => {
            const isActive = pathname === item.path
            return (
              <Link
                href={item.path}
                key={item.path}
                className={`
                  flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-2.5
                  rounded-xl w-full text-left font-medium transition text-xs lg:text-sm
                  ${isActive ? 'bg-selected text-primary' : 'text-gray-500 hover:bg-gray-100'}
                `}
              >
                {typeof item.icon === 'string' ? (
                  <Image src={item.icon} alt={item.label} width={18} height={18}
                    className={isActive ? '' : 'grayscale opacity-40'} />
                ) : (
                  <div className={`flex items-center justify-center [&_svg]:w-[18px] [&_svg]:h-[18px] ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    {item.icon}
                  </div>
                )}
                <span className="truncate">{item.label}</span>
              </Link>
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
            const isActive = pathname === item.path
            return isActive ? (
              <Link
                href={item.path}
                key={item.path}
                className="flex items-center gap-1.5 bg-selected px-2.5 py-2 rounded-xl"
              >
                <Image src={item.icon} alt={item.label} width={18} height={18} />
                <span className="text-primary text-xs font-medium whitespace-nowrap">{item.label}</span>
              </Link>
            ) : (
              <Link
                href={item.path}
                key={item.path}
                className="bg-gray-100 p-2 rounded-xl"
              >
                <Image src={item.icon} alt={item.label} width={18} height={18} className="grayscale opacity-40" />
              </Link>
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
              <button onClick={async () => {
                setLoggingOut(true)
                await signOut()
                router.push('/login')
              }}
                disabled={loggingOut}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm disabled:opacity-70">
                {loggingOut ? 'Keluar...' : 'Logout'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}