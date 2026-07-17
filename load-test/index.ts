import http from 'k6/http';
import { sleep, check } from 'k6';
import { Options } from 'k6/options';
import { Trend } from 'k6/metrics';

// Wadah metrik kustom untuk ketiga skenario
const recentTrend = new Trend('waktu_skenario_1_recent_24h');
const aggregateTrend = new Trend('waktu_skenario_2_agregat_30d');
const rawTrend = new Trend('waktu_skenario_3_raw_30d');

// Konfigurasi k6 
export const options: Options = {
  scenarios: {
    // 1. Pengujian 24 Jam Terakhir (Berjalan duluan dari 0:00 sampai 1:00)
    uji_recent: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      exec: 'runRecent',
    },
    
    // 2. Pengujian Agregat 30 Hari (Mulai tepat di menit ke-2)
    uji_agregat: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      startTime: '2m', // Menunggu 2 menit dari awal script dijalankan
      exec: 'runAgregat',
    },
    
    // 3. Pengujian Raw/Worst-case 30 Hari (Mulai tepat di menit ke-4)
    uji_raw: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      startTime: '4m', // Menunggu 4 menit dari awal script dijalankan
      exec: 'runRaw',
    },
  },
};

const READ_URL = 'http://siapgrek.duckdns.org/api/v1/telemetry/history';

// --- FUNGSI SKENARIO 1 (24 Jam, 15 Menit) ---
export function runRecent(): void {
  const url = `${READ_URL}?device_id=node01&range=last_24h&bucket=15%20minutes`;
  const res = http.get(url, {
    tags: { name: 'User_Read_Recent24h' },
  });
  
  check(res, { 'status recent 200': (r) => r.status === 200 });
  recentTrend.add(res.timings.duration);
  
  // Jeda 5 detik antar request dalam skenario ini
  sleep(5); 
}

// --- FUNGSI SKENARIO 2 (Agregat 30 Hari, 1 Jam) ---
export function runAgregat(): void {
  const url = `${READ_URL}?device_id=node01&range=last_30d&bucket=1%20hour`;
  const res = http.get(url, {
    tags: { name: 'User_Read_Aggregate30d' },
  });
  
  check(res, { 'status aggregate 200': (r) => r.status === 200 });
  aggregateTrend.add(res.timings.duration);
  
  // Jeda 5 detik antar request dalam skenario ini
  sleep(5); 
}

// --- FUNGSI SKENARIO 3 (Raw 30 Hari, 1 Menit) ---
export function runRaw(): void {
  const url = `${READ_URL}?device_id=node01&range=last_30d&bucket=1%20minute`;
  const res = http.get(url, {
    tags: { name: 'User_Read_WorstCase30d' },
  });
  
  check(res, { 'status raw 200': (r) => r.status === 200 });
  rawTrend.add(res.timings.duration);
  
  // Jeda 5 detik antar request dalam skenario ini
  sleep(5); 
}