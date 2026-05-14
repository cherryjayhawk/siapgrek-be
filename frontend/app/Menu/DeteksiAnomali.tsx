// "use client";

// import { useEffect, useState } from "react";

// export default function DeteksiAnomali() {
//   const [value, setValue] = useState<0 | 1>(0);
//   const [sending, setSending] = useState(false);
//   const [lastSentValue, setLastSentValue] = useState<0 | 1 | null>(null);
//   const [statusMsg, setStatusMsg] = useState("");

//   // 🔥 Otomatis kirim ke /api/anomaly setiap value berubah
//   useEffect(() => {
//     if (value === lastSentValue) return;

//     const sendStatus = async () => {
//       setSending(true);
//       setStatusMsg("");

//       try {
//         const res = await fetch("/api/anomaly", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ status: value }),
//         });

//         const data = await res.json();
//         setStatusMsg(data.message || "Status terkirim.");
//         setLastSentValue(value);
//       } catch {
//         setStatusMsg("Gagal mengirim status ke server.");
//       } finally {
//         setSending(false);
//       }
//     };

//     sendStatus();
//   }, [value, lastSentValue]);

//   return (
//     <div className="space-y-4 h-full">
//       <div>
//         <h1 className="text-2xl font-bold text-gray-800">Deteksi Anomali</h1>
//         <p className="text-sm text-gray-500">
//           Sistem akan mengirim email otomatis ketika status model = 1 (anomali).
//         </p>
//       </div>

//       <div className="bg-white p-6 rounded-2xl shadow max-w-lg">
//         <h2 className="font-semibold text-gray-800 mb-4">Status dari Model</h2>

//         {/* SEMENTARA: tombol simulasi output model */}
//         <div className="flex gap-4 mb-4">
//           <button
//             onClick={() => setValue(0)}
//             className={`px-4 py-2 rounded-lg text-sm font-medium border
//               ${
//                 value === 0
//                   ? "bg-green-100 text-green-700 border-green-400"
//                   : "bg-gray-100 text-gray-600 hover:bg-gray-200"
//               }`}
//           >
//             0 — Normal
//           </button>

//           <button
//             onClick={() => setValue(1)}
//             className={`px-4 py-2 rounded-lg text-sm font-medium border
//               ${
//                 value === 1
//                   ? "bg-red-100 text-red-700 border-red-400"
//                   : "bg-gray-100 text-gray-600 hover:bg-gray-200"
//               }`}
//           >
//             1 — Anomali
//           </button>
//         </div>

//         <p className="text-sm text-gray-600">
//           Status saat ini:{" "}
//           <span
//             className={
//               value === 1
//                 ? "text-red-600 font-semibold"
//                 : "text-green-600 font-semibold"
//             }
//           >
//             {value === 1 ? "Anomali" : "Normal"}
//           </span>
//         </p>

//         {sending && (
//           <p className="text-sm text-purple-500 mt-3">Mengirim ke server...</p>
//         )}
//         {!sending && statusMsg && (
//           <p className="text-sm text-blue-600 mt-3">{statusMsg}</p>
//         )}
//       </div>

//       <p className="text-xs text-gray-400">
//         *Nanti tombol ini bisa diganti langsung dengan output dari model temanmu.
//       </p>
//     </div>
//   );
// }
