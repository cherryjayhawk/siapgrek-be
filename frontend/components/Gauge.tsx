// "use client";

// import { PieChart, Pie, Cell } from "recharts";

// type GaugeProps = {
//   value: number;       // nilai asli (misal 28 / 70)
//   label: string;       // "Suhu" / "Kelembapan"
//   min?: number;        // batas bawah skala
//   max?: number;        // batas atas skala
// };

// export default function Gauge({
//   value,
//   label,
//   min = 0,
//   max = 100,
// }: GaugeProps) {
//   // 3 zona warna (0–40–70–100%)
//   const zones = [{ value: 40 }, { value: 30 }, { value: 30 }];
//   const COLORS = ["#22C55E", "#FB923C", "#EF4444"];

//   // amankan min/max & clamp nilai ke dalam range
//   const safeMax = max === min ? min + 1 : max;
//   const clamped = Math.min(Math.max(value, min), safeMax);

//   // normalisasi ke 0..1 lalu ke sudut -90..+90
//   const ratio = (clamped - min) / (safeMax - min); // 0..1
//   const angle = -90 + ratio * 180;                 // -90..+90 derajat

//   // status teks berdasarkan persentase (bukan nilai mentah)
//   const status =
//     ratio <= 0.4 ? "Aman" : ratio <= 0.7 ? "Waspada" : "Bahaya";

//   return (
//     <div className="w-[300px] bg-white p-4 mt-5 rounded-xl border">
//       {/* FRAME rata kiri, isi center */}
//       <div className="flex flex-col items-center text-center">
//         <h4 className="text-l font-semibold mb-5">{label}</h4>

//         {/* wrapper untuk chart + jarum */}
//         <div className="relative w-[220px] h-[150px] ">
//           {/* BUSUR 3 WARNA */}
//           <PieChart width={200} height={200}>
//             <Pie
//               data={zones}
//               startAngle={180}
//               endAngle={0}
//               innerRadius={60}
//               outerRadius={80}
//               dataKey="value"
//               cx={100}
//               cy={80} // pusat lingkaran di (100,80)
//             >
//               {zones.map((_, i) => (
//                 <Cell key={i} fill={COLORS[i]} />
//               ))}
//             </Pie>
//           </PieChart>

//           {/* JARUM – pangkal tepat di pusat (100,80) */}
//           <div
//             className="absolute left-1/2 w-[2px] h-[60px] bg-black origin-bottom"
//             style={{
//               top: 20, // 80 (cy) - 60 (h) = 20 ⇒ bottom pas di pusat
//               transform: `translateX(-50%) rotate(${angle}deg)`,
//             }}
//           />
//         </div>

//         {/* NILAI ASLI */}
//         <p className="text-xl font-bold mt-[-20px]">
//           {value}
//           {label === "Suhu" ? "°" : "%"}
//         </p>

//         {/* STATUS */}
//         <p className="text-xs text-gray-500">{status}</p>
//       </div>
//     </div>
//   );
// }
