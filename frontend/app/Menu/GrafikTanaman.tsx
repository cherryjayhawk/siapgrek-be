"use client";

import { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area,
  LineChart, Line,
  ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

import RangeGrafik from "../../components/RangeGrafik";
import IntervalGrafik from "../../components/IntervalGrafik";

type Props = { setActiveMenu: (menu: string) => void };

// Replaced by real data fetch

/* ── STATS CALCULATOR ────────────────────── */
function calcStats(data: any[], key: string) {
  const vals = data.map(d => d[key]).filter(v => typeof v === "number");
  if (!vals.length) return { avg: 0, min: 0, max: 0 };
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return { avg, min: Math.min(...vals), max: Math.max(...vals) };
}

/* ── SENSOR PANEL (stats + chart dalam 1 card) ── */
function SensorPanel({ title, dataKey, color, data, unit }: any) {
  const { avg, min, max } = calcStats(data, dataKey);

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">

      {/* HEADER: judul + stats dalam 1 baris */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <p className="text-[11px] lg:text-xs font-semibold text-gray-700 truncate">{title}</p>
        </div>

        {/* MIN · AVG · MAX */}
        <div className="flex items-center gap-1.5 text-[9px] lg:text-[10px] flex-shrink-0 ml-2">
          <span className="text-blue-400 font-medium">↓{min.toFixed(1)}</span>
          <span className="text-gray-300">·</span>
          <span className="font-bold" style={{ color }}>
            {avg.toFixed(1)}
            {unit && <span className="text-gray-400 font-normal ml-0.5">{unit}</span>}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-red-400 font-medium">↑{max.toFixed(1)}</span>
        </div>
      </div>

      {/* CHART */}
      <ResponsiveContainer width="100%" height={115}>
        <AreaChart data={data} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 8 }}
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 8 }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{ fontSize: 10, borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            formatter={(v: any) => [`${Number(v).toFixed(2)}${unit ? " " + unit : ""}`, title]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${dataKey})`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>

    </div>
  );
}

/* ── COMBO: dual line ────────────────────── */
function ComboLineChart({ title, data, lines }: {
  title: string;
  data: any[];
  lines: { key: string; label: string; color: string; unit: string; yAxisId: string }[];
}) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <h3 className="text-[11px] lg:text-xs font-semibold mb-1.5 text-gray-700">{title}</h3>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
          <YAxis yAxisId="left"  tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            formatter={(v: any, name: any) => {
              const ln = lines.find(l => l.key === name);
              return [`${Number(v).toFixed(2)} ${ln?.unit ?? ""}`, ln?.label ?? name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
            formatter={(value) => lines.find(l => l.key === value)?.label ?? value}
          />
          {lines.map(l => (
            <Line
              key={l.key}
              yAxisId={l.yAxisId}
              type="monotone"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── COMBO: Area + Bar ───────────────────── */
function ComboAreaBarChart({ title, data, areaKey, barKey, areaLabel, barLabel, areaColor, barColor, areaUnit, barUnit }: any) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <h3 className="text-[11px] lg:text-xs font-semibold mb-1.5 text-gray-700">{title}</h3>
      <ResponsiveContainer width="100%" height={170}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-combo-${areaKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={areaColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
          <YAxis yAxisId="left"  tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            formatter={(v: any, name: any) => {
              if (name === areaKey) return [`${Number(v).toFixed(2)} ${areaUnit}`, areaLabel];
              if (name === barKey)  return [`${Number(v).toFixed(2)} ${barUnit}`, barLabel];
              return [v, name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
            formatter={(value) => value === areaKey ? areaLabel : barLabel}
          />
          <Bar  yAxisId="right" dataKey={barKey}  fill={barColor}  fillOpacity={0.45} radius={[3,3,0,0]} />
          <Area yAxisId="left"  dataKey={areaKey} stroke={areaColor} strokeWidth={2}
            fill={`url(#grad-combo-${areaKey})`} dot={false} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── SECTION TITLE ───────────────────────── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-semibold text-sm lg:text-base text-gray-800 mb-2 mt-5 first:mt-0 flex items-center gap-2">
      <span className="w-1 h-4 rounded-full bg-primary inline-block" />
      {children}
    </h2>
  );
}

/* ── MAIN ────────────────────────────────── */
export default function GrafikTanaman({ setActiveMenu }: Props) {

  const [range, setRange]       = useState("last_24h");
  const [interval, setInterval] = useState("1 hour");
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = `device_id=node1&range=${range}&bucket=${interval}&metric=env_temperature&metric=env_humidity&metric=light_lux&metric=soil_temperature&metric=soil_humidity&metric=soil_ph&metric=soil_conductivity`;
        const res = await fetch(`/api/history?${query}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            const formatted = json.data.map((d: any) => {
              const date = new Date(d.bucket);
              return {
                label: date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                envTemp: d.avg_env_temperature,
                envHum: d.avg_env_humidity,
                light: d.avg_light_lux,
                soilTemp: d.avg_soil_temperature,
                soilHum: d.avg_soil_humidity,
                soilPH: d.avg_soil_ph,
                soilEC: d.avg_soil_conductivity,
              }
            });
            setChartData(formatted);
          }
        }
      } catch(err) {
        console.error(err);
      }
    };
    fetchData();
  }, [range, interval]);

  const rangeLabel: Record<string, string> = {
    last_1h:  "1 Jam Terakhir",
    last_6h:  "6 Jam Terakhir",
    last_24h: "24 Jam Terakhir",
    today:    "Hari Ini",
  };

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h1 className="text-base lg:text-xl font-bold">Grafik Monitoring Sensor</h1>
        <button
          onClick={() => setActiveMenu("dashboard")}
          className="px-3 py-1.5 lg:px-4 lg:py-2 border rounded-lg text-xs lg:text-sm"
        >
          ← Kembali
        </button>
      </div>

      {/* FILTER */}
      <div className="flex gap-2 lg:gap-4 mb-1 flex-shrink-0 flex-wrap">
        <RangeGrafik value={range} onChange={setRange} />
        <IntervalGrafik value={interval} onChange={setInterval} />
      </div>

      {/* KETERANGAN periode */}
      <p className="text-[10px] text-gray-400 mb-3 flex-shrink-0">
        Statistik <span className="text-blue-400">↓Min</span> · <span className="text-gray-600 font-medium">Avg</span> · <span className="text-red-400">↑Max</span> dihitung dari{" "}
        <span className="font-medium text-gray-600">{rangeLabel[range] ?? range}</span> — {chartData.length} titik data
      </p>

      {/* SCROLL AREA */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-24 md:pb-4">

        {/* ══ ENVIRONMENT ══ */}
        <SectionTitle>🌿 Environment Sensor</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-3">
          <SensorPanel title="Suhu Lingkungan"       dataKey="envTemp" color="#7C3AED" unit="°C"  data={chartData} />
          <SensorPanel title="Kelembapan Lingkungan" dataKey="envHum"  color="#10B981" unit="%"   data={chartData} />
          <SensorPanel title="Cahaya"                dataKey="light"   color="#EAB308" unit="lux" data={chartData} />
        </div>

        {/* ══ SOIL ══ */}
        <SectionTitle>🪴 Soil Sensor</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
          <SensorPanel title="Suhu Tanah"       dataKey="soilTemp" color="#F97316" unit="°C"    data={chartData} />
          <SensorPanel title="Kelembapan Tanah" dataKey="soilHum"  color="#0EA5E9" unit="%"     data={chartData} />
          <SensorPanel title="pH"               dataKey="soilPH"   color="#EC4899" unit=""      data={chartData} />
          <SensorPanel title="Conductivity"     dataKey="soilEC"   color="#F43F5E" unit="mS/cm" data={chartData} />
        </div>

        {/* ══ COMBO ══ */}
        <SectionTitle>📊 Grafik Perbandingan</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
          <ComboLineChart
            title="Perbandingan Suhu & Kelembapan Tanah"
            data={chartData}
            lines={[
              { key: "soilTemp", label: "Suhu Tanah",       color: "#F97316", unit: "°C", yAxisId: "left"  },
              { key: "soilHum",  label: "Kelembapan Tanah", color: "#0EA5E9", unit: "%",  yAxisId: "right" },
            ]}
          />
          <ComboAreaBarChart
            title="Perbandingan pH & Conductivity"
            data={chartData}
            areaKey="soilPH"  areaLabel="pH"          areaColor="#EC4899" areaUnit=""
            barKey="soilEC"   barLabel="Conductivity" barColor="#F43F5E"  barUnit="mS/cm"
          />
        </div>

      </div>
    </div>
  );
}