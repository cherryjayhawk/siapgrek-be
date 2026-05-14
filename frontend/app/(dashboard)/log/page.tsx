"use client";

import { useState } from "react";

type LogEntry = {
  time: string;
  date: string;
  actuator: string;
  activity: "ON" | "OFF";
  triggeredBy: "Otomatis" | "Manual";
  status: "Berhasil" | "Gagal";
};

const logsData: Record<string, LogEntry[]> = {
  ID0001: [
    { time: "14:02", date: "25 November 2025", actuator: "Penyiraman", activity: "ON",  triggeredBy: "Otomatis", status: "Berhasil" },
    { time: "14:05", date: "25 November 2025", actuator: "Misting",    activity: "OFF", triggeredBy: "Manual",   status: "Gagal"    },
    { time: "14:07", date: "25 November 2025", actuator: "Paranet",    activity: "ON",  triggeredBy: "Manual",   status: "Berhasil" },
    { time: "15:43", date: "25 November 2025", actuator: "Misting",    activity: "ON",  triggeredBy: "Manual",   status: "Gagal"    },
    { time: "16:07", date: "25 November 2025", actuator: "Paranet",    activity: "OFF", triggeredBy: "Manual",   status: "Berhasil" },
  ],
  ID0002: [
    { time: "09:00", date: "25 November 2025", actuator: "Penyiraman", activity: "ON",  triggeredBy: "Otomatis", status: "Berhasil" },
    { time: "11:30", date: "25 November 2025", actuator: "Misting",    activity: "ON",  triggeredBy: "Otomatis", status: "Berhasil" },
    { time: "13:15", date: "25 November 2025", actuator: "Paranet",    activity: "OFF", triggeredBy: "Manual",   status: "Gagal"    },
  ],
  ID0003: [
    { time: "08:45", date: "25 November 2025", actuator: "Misting",    activity: "ON",  triggeredBy: "Otomatis", status: "Berhasil" },
    { time: "10:20", date: "25 November 2025", actuator: "Penyiraman", activity: "OFF", triggeredBy: "Manual",   status: "Berhasil" },
  ],
};

export default function LogAktivitas() {
  const [selectedId, setSelectedId] = useState("ID0001");
  const filtered = logsData[selectedId] ?? [];

  const statusStyle = (s: string) =>
    s === "Gagal"
      ? "bg-red-100 text-red-500"
      : "bg-green-100 text-green-600";

  const activityStyle = (a: string) =>
    a === "ON"
      ? "text-green-600 font-semibold"
      : "text-red-500 font-semibold";

  return (
    <div className="flex flex-col h-full gap-3">

      {/* TITLE */}
      <div>
        <h1 className="text-base lg:text-xl font-bold text-gray-800">Log Aktivitas</h1>
        <p className="text-xs lg:text-sm text-gray-500">Riwayat aktivitas aktuator dan sistem</p>
      </div>

      {/* FILTER */}
      <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl p-2.5">
        <span className="text-xs text-gray-600 flex-shrink-0">ID Tanaman:</span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="border rounded-lg px-2.5 py-1 text-xs focus:outline-none bg-white"
        >
          <option value="ID0001">ID0001</option>
          <option value="ID0002">ID0002</option>
          <option value="ID0003">ID0003</option>
        </select>
        <span className="text-[10px] text-gray-400 ml-auto">{filtered.length} entri</span>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden sm:block flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs lg:text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600">
              {["Waktu", "Tanggal", "Aktuator", "Aktivitas", "Dipicu Oleh", "Status"].map(h => (
                <th key={h} className="px-3 py-2.5 font-semibold first:rounded-l-lg last:rounded-r-lg whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                  Tidak ada log untuk ID ini.
                </td>
              </tr>
            ) : filtered.map((log, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="px-3 py-3 font-medium text-gray-700">{log.time}</td>
                <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{log.date}</td>
                <td className="px-3 py-3 text-gray-800">{log.actuator}</td>
                <td className={`px-3 py-3 ${activityStyle(log.activity)}`}>{log.activity}</td>
                <td className="px-3 py-3 text-gray-600">{log.triggeredBy}</td>
                <td className="px-3 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] lg:text-xs font-medium ${statusStyle(log.status)}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD LIST */}
      <div className="sm:hidden flex-1 overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-xs">
            Tidak ada log untuk ID ini.
          </div>
        ) : filtered.map((log, idx) => (
          <div key={idx} className="bg-gray-50 rounded-xl p-3">
            {/* ROW 1: waktu + tanggal + status */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-700">{log.time}</span>
                <span className="text-[10px] text-gray-400">·</span>
                <span className="text-[10px] text-gray-400">{log.date}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle(log.status)}`}>
                {log.status}
              </span>
            </div>
            {/* ROW 2: aktuator + aktivitas */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-800">{log.actuator}</span>
              <span className={`text-xs ${activityStyle(log.activity)}`}>{log.activity}</span>
              <span className="text-[10px] text-gray-400 ml-auto">
                {log.triggeredBy === "Otomatis" ? "🤖 Otomatis" : "👆 Manual"}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}