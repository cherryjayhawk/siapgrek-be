"use client";
import { useState } from "react";
import Image from "next/image";

export default function ControlMenuFloating() {
  const [open, setOpen] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [manualWater, setManualWater] = useState(false);
  const [manualMisting, setManualMisting] = useState(false);
  const [manualLight, setManualLight] = useState(false);

  const Toggle = ({
    active, disabled, onToggle
  }: { active: boolean; disabled: boolean; onToggle: () => void }) => (
    <button
      disabled={disabled}
      onClick={onToggle}
      className={`w-9 h-5 flex items-center rounded-full p-[2px] transition flex-shrink-0 ${
        active ? "bg-green-500" : "bg-gray-500"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <div className={`bg-white w-4 h-4 rounded-full transform transition ${active ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );

  const controls = [
    {
      id: "watering_valve1",
      label: "Penyiraman (Valve 1)",
      desc: "Siram pot & akar tanaman 1",
      icon: "💧",
      state: manualWater,
      set: () => setManualWater(!manualWater),
    },
    {
      id: "misting_pump1",
      label: "Misting (Pump 1)",
      desc: "Semprot kabut untuk kelembapan",
      icon: "🌫️",
      state: manualMisting,
      set: () => setManualMisting(!manualMisting),
    },
    {
      id: "misting_pump2",
      label: "Misting (Pump 2)",
      desc: "Semprot kabut sekunder",
      icon: "🌫️",
      state: manualLight,
      set: () => setManualLight(!manualLight),
    },
  ];

  return (
    <>
      {/* FLOATING BUTTON
          - desktop: bottom-12 right-12
          - mobile:  bottom-20 right-4 (di atas bottom nav yg tingginya ~68px + gap) */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 md:bottom-12 md:right-12 z-40
          w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary shadow-xl
          flex items-center justify-center hover:bg-black transition"
      >
        <div className="w-9 h-9 md:w-12 md:h-12 rounded-full border-2 border-white flex items-center justify-center">
          <Image src="/images/settings.svg" alt="settings" width={22} height={22} className="md:w-[30px] md:h-[30px]" />
        </div>
      </button>

      {/* PANEL
          - desktop: kanan bawah
          - mobile:  full width dengan margin kiri kanan, di atas floating button */}
      {open && (
        <>
          {/* overlay tipis untuk tutup panel saat klik luar */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          <div className="
            fixed z-40 bg-gray-900 text-white rounded-2xl shadow-2xl
            /* mobile */
            bottom-36 left-4 right-4
            /* desktop */
            md:bottom-32 md:left-auto md:right-10 md:w-[340px]
            p-4 md:p-5
          ">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm md:text-base font-semibold">Menu Kontrol</h3>
              <button onClick={() => setOpen(false)}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-xs">
                ✕
              </button>
            </div>

            {/* MODE OTOMATIS */}
            <div className="flex justify-between items-center bg-white/10 rounded-xl px-3 py-2.5 mb-2">
              <div>
                <p className="text-xs md:text-sm font-medium">Mode Otomatis</p>
                <p className="text-[10px] text-gray-400">Semua kontrol dikelola sistem</p>
              </div>
              <Toggle
                active={autoMode}
                disabled={false}
                onToggle={() => {
                  setAutoMode(!autoMode);
                  if (!autoMode === false) {
                    setManualWater(false);
                    setManualMisting(false);
                    setManualLight(false);
                  }
                }}
              />
            </div>

            {/* DIVIDER */}
            <p className="text-[10px] text-gray-500 uppercase tracking-wide px-1 mb-1.5">
              Kontrol Manual {autoMode && <span className="text-gray-600">— nonaktifkan mode otomatis dulu</span>}
            </p>

            {/* MANUAL CONTROLS */}
            <div className="space-y-1.5">
              {controls.map(ctrl => (
                <div
                  key={ctrl.id}
                  className={`flex justify-between items-center rounded-xl px-3 py-2.5 transition ${
                    autoMode ? "bg-white/5" : "bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{ctrl.icon}</span>
                    <div>
                      <p className={`text-xs md:text-sm font-medium ${autoMode ? "text-gray-500" : "text-white"}`}>
                        {ctrl.label}
                      </p>
                      <p className="text-[10px] text-gray-500">{ctrl.desc}</p>
                    </div>
                  </div>
                  <Toggle active={ctrl.state} disabled={autoMode} onToggle={ctrl.set} />
                </div>
              ))}
            </div>

          </div>
        </>
      )}
    </>
  );
}