"use client";

import Image from "next/image";
import { useUser } from "@/app/context/UserContext";
import { useRouter } from "next/navigation";

type Props = {
  setActiveMenu: (menu: string) => void;
  activeMenu: string;
};

export default function Navbar({ setActiveMenu, activeMenu }: Props) {
  const { profileImage, username } = useUser();
  const router = useRouter();

  const handleLogoClick = () => setActiveMenu("dashboard");

  const handleProfileClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      router.push("/mobile-profile");
    } else {
      setActiveMenu("profile");
    }
  };

  return (
    <header className="w-full h-12 sm:h-14 lg:h-16 bg-white rounded-xl lg:rounded-2xl px-3 sm:px-4 lg:px-6 flex items-center justify-between flex-shrink-0">

      {/* LOGO — klik ke dashboard */}
      <button onClick={handleLogoClick} className="flex items-center">
        <div className="relative w-24 sm:w-28 lg:w-36 h-8 sm:h-9 lg:h-10">
          <Image src="/images/Logo Navbar.png" alt="SIAPGrek" fill
            className="object-contain object-left" priority />
        </div>
      </button>

      {/* PROFIL */}
      <button
        onClick={handleProfileClick}
        className="flex items-center gap-2 lg:gap-3 hover:opacity-80 transition"
      >
        <span className="hidden sm:block font-semibold text-gray-700 text-xs sm:text-sm lg:text-base">
          {username}
        </span>

        {/* kotak ungu halus — selalu tampil, bukan indikator aktif */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl overflow-hidden flex-shrink-0 bg-primary/10 p-0.5">
          <Image src={profileImage} alt="User" width={40} height={40}
            className="object-cover w-full h-full rounded-lg" />
        </div>
      </button>

    </header>
  );
}