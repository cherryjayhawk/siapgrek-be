"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type LogEntry = {
  id: string;
  timestamp: string;
  device_id: string;
  actuator: string;
  command_value: number;
  source: string;
};

// Derive human-friendly labels from raw actuator strings
function formatActuator(raw: string): string {
  if (raw.includes("watering") || raw.includes("valve")) return "Penyiraman";
  if (raw.includes("misting") || raw.includes("pump")) return "Misting";
  if (raw.includes("paranet") || raw.includes("shade")) return "Paranet";
  return raw;
}

export default function LogAktivitas() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState("node1");

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const res = await fetch(`/api/command-log?device_id=${deviceId}&limit=100`);
        if (res.ok) {
          const json = await res.json();
          setLogs(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch command log:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [deviceId]);

  const statusStyle = (val: number) =>
    val === 1
      ? "bg-green-100 text-green-600"
      : "bg-red-100 text-red-500";

  const activityLabel = (val: number) => (val === 1 ? "ON" : "OFF");
  const activityStyle = (val: number) =>
    val === 1 ? "text-green-600 font-semibold" : "text-red-500 font-semibold";

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  const sourceLabel = (s: string) =>
    s === "manual" ? "👆 Manual" : "🤖 Otomatis";

  return (
    <div className="flex flex-col h-full gap-3">

      {/* TITLE */}
      <div>
        <h1 className="text-base lg:text-xl font-bold text-gray-800">Log Aktivitas</h1>
        <p className="text-xs lg:text-sm text-gray-500">Riwayat aktivitas aktuator dan sistem</p>
      </div>

      {/* FILTER */}
      <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl p-2.5">
        <span className="text-xs text-gray-600 flex-shrink-0">Device:</span>
        <select
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className="border rounded-lg px-2.5 py-1 text-xs focus:outline-none bg-white"
        >
          <option value="node1">node1</option>
          <option value="node2">node2</option>
          <option value="node3">node3</option>
        </select>
        <span className="text-[10px] text-gray-400 ml-auto">{logs.length} entri</span>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={24} />
          <span className="ml-2 text-sm text-gray-400">Memuat log...</span>
        </div>
      )}

      {/* DESKTOP TABLE */}
      {!loading && (
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
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    Tidak ada log untuk device ini.
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-3 py-3 font-medium text-gray-700">{formatTime(log.timestamp)}</td>
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                  <td className="px-3 py-3 text-gray-800">{formatActuator(log.actuator)}</td>
                  <td className={`px-3 py-3 ${activityStyle(log.command_value)}`}>{activityLabel(log.command_value)}</td>
                  <td className="px-3 py-3 text-gray-600">{sourceLabel(log.source)}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] lg:text-xs font-medium ${statusStyle(log.command_value)}`}>
                      Berhasil
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MOBILE CARD LIST */}
      {!loading && (
        <div className="sm:hidden flex-1 overflow-y-auto space-y-2">
          {logs.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-xs">
              Tidak ada log untuk device ini.
            </div>
          ) : logs.map((log) => (
            <div key={log.id} className="bg-gray-50 rounded-xl p-3">
              {/* ROW 1: waktu + tanggal + status */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-700">{formatTime(log.timestamp)}</span>
                  <span className="text-[10px] text-gray-400">·</span>
                  <span className="text-[10px] text-gray-400">{formatDate(log.timestamp)}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle(log.command_value)}`}>
                  Berhasil
                </span>
              </div>
              {/* ROW 2: aktuator + aktivitas */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-800">{formatActuator(log.actuator)}</span>
                <span className={`text-xs ${activityStyle(log.command_value)}`}>{activityLabel(log.command_value)}</span>
                <span className="text-[10px] text-gray-400 ml-auto">
                  {sourceLabel(log.source)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}