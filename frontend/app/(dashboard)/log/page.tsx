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

function formatActuatorId(raw: string): string {
  if (raw.includes("/")) {
    return raw.split("/")[1];
  }
  if (raw.includes(":")) {
    return raw.split(":")[1];
  }
  return "-";
}

export default function LogAktivitas() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const res = await fetch(`/api/command-log?device_id=node01&limit=100`);
        if (res.ok) {
          const json = await res.json();
          setLogs(json.data || []);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Failed to fetch command log:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

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

  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const currentLogs = logs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm p-4 lg:p-6 space-y-4">

      {/* TITLE */}
      <div>
        <h1 className="text-base lg:text-xl font-bold text-gray-800">Log Aktivitas</h1>
        <p className="text-xs lg:text-sm text-gray-500">Riwayat aktivitas aktuator dan sistem</p>
      </div>

      {/* FILTER & HEADER INFO */}
      <div className="flex items-center justify-between bg-gray-50/50 p-2 lg:p-3 rounded-xl border border-gray-100">
        <span className="text-xs font-medium text-gray-600 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
          Device: node01
        </span>
        <span className="text-[10px] text-gray-400">{logs.length} entri</span>
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
                {["Waktu", "Tanggal", "Aktuator", "ID Aktuator", "Aktivitas", "Dipicu Oleh", "Status"].map(h => (
                  <th key={h} className="px-3 py-2.5 font-semibold first:rounded-l-lg last:rounded-r-lg whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                    Tidak ada log untuk device ini.
                  </td>
                </tr>
              ) : currentLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-3 py-3 font-medium text-gray-700">{formatTime(log.timestamp)}</td>
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                  <td className="px-3 py-3 text-gray-800">{formatActuator(log.actuator)}</td>
                  <td className="px-3 py-3 text-gray-600 font-mono text-[11px]">{formatActuatorId(log.actuator)}</td>
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
          ) : currentLogs.map((log) => (
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
                <span className="text-[10px] text-gray-500 font-mono">({formatActuatorId(log.actuator)})</span>
                <span className={`text-xs ml-1 ${activityStyle(log.command_value)}`}>{activityLabel(log.command_value)}</span>
                <span className="text-[10px] text-gray-400 ml-auto">
                  {sourceLabel(log.source)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION UI */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-gray-50/50 p-2 lg:p-3 rounded-xl border border-gray-100 mt-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="px-3 py-1.5 rounded-lg text-xs bg-white border shadow-sm disabled:opacity-50 hover:bg-gray-50 transition font-medium text-gray-700"
          >
            Sebelumnya
          </button>
          <span className="text-[11px] lg:text-xs text-gray-500 font-medium">
            Hal {currentPage} dari {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="px-3 py-1.5 rounded-lg text-xs bg-white border shadow-sm disabled:opacity-50 hover:bg-gray-50 transition font-medium text-gray-700"
          >
            Selanjutnya
          </button>
        </div>
      )}

    </div>
  );
}