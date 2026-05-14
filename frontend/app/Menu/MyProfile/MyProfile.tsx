"use client";

import { useRouter } from "next/navigation";
import Profile from "./Profile";
import ChangePassword from "./ChangePassword";
import FAQ from "./FAQ";

type Props = {
  active: string;
  setActive?: (menu: string) => void;
};

export default function MyProfile({ active, setActive }: Props) {
  const router = useRouter();

  const handleBack = () => {
    // Cek apakah sedang di mobile screen
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      router.push("/mobile-profile");
      return;
    }
    if (setActive) setActive("profile");
  };

  const handleNavigate = (menu: string) => {
    if (setActive) setActive(menu);
  };

  if (active === "profile" || active === "myprofile") {
    return <Profile onBack={handleBack} />;
  }

  if (active === "password") {
    return <ChangePassword onBack={handleBack} />;
  }

  if (active === "faq") {
    return <FAQ onBack={handleBack} onNavigate={handleNavigate} />;
  }

  return <Profile onBack={handleBack} />;
}