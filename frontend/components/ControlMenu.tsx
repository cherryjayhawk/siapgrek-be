"use client";
import { useState, useCallback } from "react";
import Image from "next/image";

type ActuatorControl = {
  id: string;
  kind: string;
  actuatorId: string;
  label: string;
  desc: string;
  icon: string;
  state: boolean;
};

export default function ControlMenuFloating() {
  const [open, setOpen] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  const [controls, setControls] = useState<ActuatorControl[]>([
    {
      id: "watering_valve1",
      kind: "watering",
      actuatorId: "valve1",
      label: "Penyiraman (Valve 1)",
      desc: "Siram pot & akar tanaman 1",
      icon: "💧",
      state: false,
    },
    {
      id: "misting_pump1",
      kind: "misting",
      actuatorId: "pump1",
      label: "Misting (Pump 1)",
      desc: "Semprot kabut untuk kelembapan",
      icon: "🌫️",
      state: false,
    },
    {
      id: "misting_pump2",
      kind: "misting",
      actuatorId: "pump2",
      label: "Misting (Pump 2)",
      desc: "Semprot kabut sekunder",
      icon: "🌫️",
      state: false,
    },
  ]);

  const sendCommand = useCallback(async (ctrl: ActuatorControl, newValue: boolean) => {
    setSending(ctrl.id);
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: "node1",
          actuator_kind: ctrl.kind,
          actuator_id: ctrl.actuatorId,
          value: newValue ? 1 : 0,
        }),
      });

      if (res.ok) {
        // Update local state on success
        setControls(prev =>
          prev.map(c => c.id === ctrl.id ? { ...c, state: newValue } : c)
        );
      } else {
        console.error("Command failed:", await res.text());
      }
    } catch (err) {
      console.error("Command request failed:", err);
    } finally {
      setSending(null);
    }
  }, []);

  const Toggle = ({
    active, disabled, loading, onToggle
  }: { active: boolean; disabled: boolean; loading?: boolean; onToggle: () => void }) => (
    <button
      disabled={disabled || loading}
      onClick={onToggle}
      className={`w-9 h-5 flex items-center rounded-full p-[2px] transition flex-shrink-0 ${
        active ? "bg-green-500" : "bg-gray-500"
      } ${disabled || loading ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <div className={`bg-white w-4 h-4 rounded-full transform transition ${
        loading ? "animate-pulse" : ""
      } ${active ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );

  return (
    <>
      {/* FLOATING BUTTON */}
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

      {/* PANEL */}
      {open && (
        <>
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
                    // Turning auto mode back on — reset all manual toggles
                    setControls(prev => prev.map(c => ({ ...c, state: false })));
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
                  <Toggle
                    active={ctrl.state}
                    disabled={autoMode}
                    loading={sending === ctrl.id}
                    onToggle={() => sendCommand(ctrl, !ctrl.state)}
                  />
                </div>
              ))}
            </div>

          </div>
        </>
      )}
    </>
  );
}