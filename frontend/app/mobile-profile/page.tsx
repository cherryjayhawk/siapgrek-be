"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import Navbar from "@/components/Navbar";

function LogoutDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 69 69" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M27.9076 6.92589C25.875 8.72851 25.875 12.0261 25.875 18.6185V50.3815C25.875 56.9739 25.875 60.2715 27.9076 62.0741C29.9402 63.8768 33.0481 63.3363 39.2639 62.2524L45.9626 61.0851C52.8454 59.8834 56.2867 59.2825 58.3309 56.7583C60.375 54.2311 60.375 50.5799 60.375 43.2745V25.7255C60.375 18.423 60.375 14.7718 58.3338 12.2446C56.2868 9.72039 52.8425 9.11951 45.9598 7.92064L39.2667 6.75051C33.051 5.66664 29.9431 5.12614 27.9105 6.92876M34.5 29.2359C35.6903 29.2359 36.6562 30.245 36.6562 31.4899V37.5101C36.6562 38.755 35.6903 39.7641 34.5 39.7641C33.3097 39.7641 32.3438 38.755 32.3438 37.5101V31.4899C32.3438 30.245 33.3097 29.2359 34.5 29.2359Z" fill="#ef4444"/>
            <path d="M21.6976 12.9375C15.7809 12.9461 12.696 13.0755 10.7295 15.042C8.625 17.1465 8.625 20.5332 8.625 27.3125V41.6875C8.625 48.4639 8.625 51.8506 10.7295 53.958C12.696 55.9216 15.7809 56.0539 21.6976 56.0625C21.5625 54.2685 21.5625 52.1985 21.5625 49.9589V19.0411C21.5625 16.7986 21.5625 14.7286 21.6976 12.9375Z" fill="#ef4444"/>
          </svg>
        </div>
        <div className="text-center">
          <h3 className="font-bold text-base mb-1">Keluar dari Akun</h3>
          <p className="text-gray-500 text-sm">Apakah kamu yakin ingin keluar?</p>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Batal
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition">
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MobileProfilePage() {
  const router = useRouter();
  const { profileImage, username } = useUser();
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const check = () => { if (window.innerWidth >= 768) router.replace("/"); };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [router]);

  const handleLogout = () => { window.location.href = "/login"; };
  const goTo = (menu: string) => router.push(`/?active=${menu}`);

  const menuItems = [
    {
      label: "Edit Profil",
      desc: "Ubah nama, foto, dan info akun",
      icon: (
        <svg width="22" height="22" viewBox="0 0 69 69" fill="none">
          <path d="M34.5001 6.90002C30.8401 6.90002 27.33 8.35395 24.742 10.942C22.154 13.53 20.7001 17.04 20.7001 20.7C20.7001 24.36 22.154 27.8701 24.742 30.4581C27.33 33.0461 30.8401 34.5 34.5001 34.5C38.1601 34.5 41.6702 33.0461 44.2582 30.4581C46.8462 27.8701 48.3001 24.36 48.3001 20.7C48.3001 17.04 46.8462 13.53 44.2582 10.942C41.6702 8.35395 38.1601 6.90002 34.5001 6.90002ZM17.2811 37.95C16.3724 37.9459 15.4718 38.1214 14.6311 38.4663C13.7904 38.8112 13.026 39.3188 12.382 39.96C11.738 40.6011 11.227 41.3631 10.8783 42.2023C10.5296 43.0415 10.3501 43.9413 10.3501 44.85C10.3501 50.684 13.2239 55.0827 17.7158 57.9497C21.3383 60.2577 25.9889 61.5687 31.0673 61.9689L32.5405 55.7348C33.0251 53.7962 34.0267 52.0255 35.4385 50.6115L48.1 37.95H17.2811ZM37.8776 53.0507L54.5411 36.3872C55.7517 35.1771 57.3934 34.4975 59.105 34.4978C60.8166 34.4981 62.458 35.1784 63.6681 36.3889C64.8782 37.5994 65.5578 39.2411 65.5575 40.9527C65.5572 42.6644 64.8769 44.3058 63.6664 45.5159L47.0029 62.1759C46.0319 63.1467 44.8157 63.8359 43.4839 64.17L38.3158 65.4603C36.6562 65.8805 35.0845 64.3088 35.5047 62.6492L36.7985 57.4811C37.1327 56.1494 37.8218 54.9332 38.7927 53.9621" fill="#ffffff"/>
        </svg>
      ),
      menu: "profile",
    },
    {
      label: "Ganti Password",
      desc: "Perbarui keamanan akunmu",
      icon: (
        <svg width="22" height="22" viewBox="0 0 69 69" fill="none">
          <path d="M5.75 34.5C5.75 23.6584 5.75 18.2361 9.1195 14.8695C12.489 11.5029 17.9084 11.5 28.75 11.5H40.25C51.0916 11.5 56.5139 11.5 59.8805 14.8695C63.2471 18.239 63.25 23.6584 63.25 34.5C63.25 45.3416 63.25 50.7639 59.8805 54.1305C56.511 57.4971 51.0916 57.5 40.25 57.5H28.75C17.9084 57.5 12.4861 57.5 9.1195 54.1305C5.75287 50.761 5.75 45.3416 5.75 34.5Z" fill="#ffffff"/>
          <path d="M19.3576 26.5938C20.5479 26.5938 21.5138 27.5597 21.5138 28.75V30.7625L23.2561 29.7563C24.4033 29.1094 25.8597 29.4991 26.4536 30.6147C27.0475 31.7303 26.7109 33.1516 25.4123 33.4937L23.6672 34.5L25.4123 35.5063C26.5595 36.1532 26.9176 37.6642 26.2707 38.8114C25.6238 39.9587 24.1128 40.3168 22.9656 39.6699L21.5138 38.2375V40.25C21.5138 41.4403 20.5479 42.4062 19.3576 42.4062C18.1673 42.4062 17.2013 41.4403 17.2013 40.25V38.2346L15.4533 39.2409C14.3061 39.8878 12.8497 39.4981 12.2558 38.3825C11.6619 37.2669 11.9985 35.8456 13.2971 35.5035L15.0422 34.5L13.2971 33.4937C12.1499 32.8468 11.7918 31.3358 12.4387 30.1886C13.0856 29.0414 14.5966 28.6833 15.7438 29.3302L17.2013 30.7654V28.75C17.2013 27.5597 18.1673 26.5938 19.3576 26.5938ZM34.5002 26.5938C35.6905 26.5938 36.6565 27.5597 36.6565 28.75V30.7625L38.4016 29.7563C39.5488 29.1094 41.0052 29.4991 41.5991 30.6147C42.193 31.7303 41.8564 33.1516 40.5578 33.4937L38.8127 34.5L40.5578 35.5063C41.705 36.1532 42.0631 37.6642 41.4162 38.8114C40.7693 39.9587 39.2583 40.3168 38.1111 39.6699L36.6565 38.2375V40.25C36.6565 41.4403 35.6905 42.4062 34.5002 42.4062C33.3099 42.4062 32.344 41.4403 32.344 40.25V38.2346L30.5988 39.2437C29.4516 39.8906 27.9952 39.5009 27.4013 38.3853C26.8074 37.2697 27.144 35.8484 28.4426 35.5063L30.1877 34.5L28.4426 33.4909C27.2954 32.844 26.9373 31.333 27.5842 30.1857C28.2311 29.0385 29.7421 28.6804 30.8893 29.3273L32.344 30.7625V28.75C32.344 27.5597 33.3099 26.5938 34.5002 26.5938ZM49.6457 26.5938C50.836 26.5938 51.802 27.5597 51.802 28.75V30.7625L53.5471 29.7563C54.6943 29.1094 56.1507 29.4991 56.7446 30.6147C57.3385 31.7303 57.0019 33.1516 55.7033 33.4937L53.9582 34.5L55.7033 35.5063C56.8505 36.1532 57.2086 37.6642 56.5617 38.8114C55.9148 39.9587 54.4038 40.3168 53.2566 39.6699L51.802 38.2375V40.25C51.802 41.4403 50.836 42.4062 49.6457 42.4062C48.4554 42.4062 47.4895 41.4403 47.4895 40.25V38.2346L45.7443 39.2437C44.5971 39.8906 43.1407 39.5009 42.5468 38.3853C41.9529 37.2697 42.2895 35.8484 43.5881 35.5063L45.3332 34.5L43.5881 33.4909C42.4409 32.844 42.0828 31.333 42.7297 30.1857C43.3766 29.0385 44.8876 28.6804 46.0348 29.3273L47.4895 30.7654V28.75C47.4895 27.5597 48.4554 26.5938 49.6457 26.5938Z" fill="#60003A"/>
        </svg>
      ),
      menu: "password",
    },
    {
      label: "Pusat Bantuan",
      desc: "FAQ dan panduan penggunaan",
      icon: (
        <svg width="22" height="22" viewBox="0 0 69 69" fill="none">
          <path d="M34.5 63.25C20.9472 63.25 14.1709 63.25 9.959 59.0381C5.75 54.832 5.75 48.0528 5.75 34.5C5.75 20.9472 5.75 14.1709 9.959 9.959C14.1737 5.75 20.9472 5.75 34.5 5.75C48.0528 5.75 54.8291 5.75 59.0381 9.959C63.25 14.1737 63.25 20.9472 63.25 34.5C63.25 48.0528 63.25 54.8291 59.0381 59.0381C54.832 63.25 48.0528 63.25 34.5 63.25Z" fill="#ffffff"/>
          <path d="M34.5 22.2813C32.7146 22.2813 31.2656 23.7303 31.2656 25.5156C31.2656 26.0875 31.0384 26.636 30.6341 27.0403C30.2297 27.4447 29.6812 27.6719 29.1094 27.6719C28.5375 27.6719 27.9891 27.4447 27.5847 27.0403C27.1803 26.636 26.9531 26.0875 26.9531 25.5156C26.9531 21.2031 30.2269 17.7188 34.5 17.7188C38.7731 17.7188 42.0469 21.2031 42.0469 25.5156C42.0469 27.6488 41.1316 29.3744 39.9136 30.774C39.3 31.4646 38.5979 32.0784 37.9578 32.6634C37.3596 33.2109 36.8562 33.7106 36.6562 34.2188V37.375C36.6562 38.5653 35.6903 39.5313 34.5 39.5313C33.3097 39.5313 32.3438 38.5653 32.3438 37.375V34.2188C32.3438 32.3356 33.2206 30.809 34.109 29.6676C34.7674 28.8224 35.5925 28.0001 36.2653 27.3274C36.8201 26.7696 37.375 26.2146 37.375 25.5156C37.375 23.8285 36.1407 22.2813 34.5 22.2813ZM34.5 48.875C35.2625 48.875 35.9938 48.5721 36.5329 48.0329C37.0721 47.4938 37.375 46.7625 37.375 46C37.375 45.2375 37.0721 44.5062 36.5329 43.9671C35.9938 43.4279 35.2625 43.125 34.5 43.125C33.7375 43.125 33.0062 43.4279 32.4671 43.9671C31.9279 44.5062 31.625 45.2375 31.625 46C31.625 46.7625 31.9279 47.4938 32.4671 48.0329C33.0062 48.5721 33.7375 48.875 34.5 48.875Z" fill="#60003A"/>
        </svg>
      ),
      menu: "faq",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {showLogout && (
        <LogoutDialog onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />
      )}

      {/* NAVBAR */}
      <Navbar setActiveMenu={() => {}} activeMenu="profile" />

      {/* PROFILE CARD */}
      <div className="mx-4 mt-5">
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
            <Image src={profileImage} alt="foto" width={64} height={64} className="object-cover w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{username}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full font-medium">
              Pengguna Aktif
            </span>
          </div>
        </div>
      </div>

      {/* MENU */}
      <div className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm">
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            onClick={() => goTo(item.menu)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition text-left ${
              i < menuItems.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{item.label}</p>
              <p className="text-[11px] text-gray-400">{item.desc}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* LOGOUT */}
      <div className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowLogout(true)}
          className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 active:bg-red-100 transition text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 69 69" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M27.9076 6.92589C25.875 8.72851 25.875 12.0261 25.875 18.6185V50.3815C25.875 56.9739 25.875 60.2715 27.9076 62.0741C29.9402 63.8768 33.0481 63.3363 39.2639 62.2524L45.9626 61.0851C52.8454 59.8834 56.2867 59.2825 58.3309 56.7583C60.375 54.2311 60.375 50.5799 60.375 43.2745V25.7255C60.375 18.423 60.375 14.7718 58.3338 12.2446C56.2868 9.72039 52.8425 9.11951 45.9598 7.92064L39.2667 6.75051C33.051 5.66664 29.9431 5.12614 27.9105 6.92876M34.5 29.2359C35.6903 29.2359 36.6562 30.245 36.6562 31.4899V37.5101C36.6562 38.755 35.6903 39.7641 34.5 39.7641C33.3097 39.7641 32.3438 38.755 32.3438 37.5101V31.4899C32.3438 30.245 33.3097 29.2359 34.5 29.2359Z" fill="white"/>
              <path d="M21.6976 12.9375C15.7809 12.9461 12.696 13.0755 10.7295 15.042C8.625 17.1465 8.625 20.5332 8.625 27.3125V41.6875C8.625 48.4639 8.625 51.8506 10.7295 53.958C12.696 55.9216 15.7809 56.0539 21.6976 56.0625C21.5625 54.2685 21.5625 52.1985 21.5625 49.9589V19.0411C21.5625 16.7986 21.5625 14.7286 21.6976 12.9375Z" fill="white"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-500">Keluar</p>
            <p className="text-[11px] text-gray-400">Keluar dari akun ini</p>
          </div>
          <ChevronRight size={16} className="text-red-300 flex-shrink-0" />
        </button>
      </div>

      <p className="text-center text-[10px] text-gray-300 mt-6 mb-8">SIAPGrek v1.0.0</p>
    </div>
  );
}