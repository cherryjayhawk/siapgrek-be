import RegisterForm from "@/components/RegisterForm";
import Image from "next/image";
import { momoTrust } from "@/lib/fonts";

export default function RegisterPage() {
  return (
    <main className="grid grid-cols-1 md:grid-cols-2 bg-white" style={{ height: "100dvh" }}>

      {/* LEFT — hidden mobile */}
      <div className="hidden md:flex items-center justify-center bg-white p-6">
        <div className="relative w-full h-full rounded-[7%] overflow-hidden">
          <Image src="/images/anggrek.jpg" alt="Anggrek" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-[180px] left-1/2 -translate-x-1/2">
            <Image src="/images/logo.png" alt="Logo" width={150} height={55} className="object-contain" />
          </div>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center px-4">
            <h1 className={`${momoTrust.className} text-white whitespace-nowrap`}
              style={{ fontSize: "clamp(1.7rem, 2vw + 1rem, 2.6rem)", lineHeight: 1.05 }}>
              Sistem Informasi Automasi<br />Perawatan Anggrek
            </h1>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-center px-6 overflow-y-auto" style={{ height: "100dvh" }}>
        <div className="w-full max-w-sm py-4">
          <RegisterForm />
        </div>
      </div>

    </main>
  );
}