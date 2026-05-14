import type { Metadata } from "next";
import "./globals.css";
import { poppins, momoTrust } from "./fonts";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { UserProvider } from "./context/UserContext";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "SIAPGrek",
  description: "Sistem Informasi Automasi Perawatan Anggrek",
  icons: {
    icon: "/circleLogo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={cn(poppins.variable, momoTrust.variable, "font-sans", geist.variable)}>
      <body className={`${poppins.className} bg-white text-gray-900`}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
