# Panduan Budidaya Anggrek *Cattleya* di Greenhouse

---

## Metadata

* **Judul:** Panduan Budidaya Anggrek *Cattleya* — Greenhouse
* **Versi:** 1.0
* **Tanggal pembuatan:** 2025-10-25
* **Ringkasan singkat:** Prosedur lengkap pemeliharaan *Cattleya* fase vegetatif/pembungaan pada greenhouse dengan paranet 50%, media arang kayu / sabut kelapa / lumut, pencahayaan alami. Mencakup parameter lingkungan, SOP harian/mingguan/bulanan, pengendalian hama & penyakit, otomatisasi (misting & penutup kain).
* **Kata kunci:** Cattleya, anggrek, greenhouse, misting, kelembaban, suhu, SOP, media tanam, shading, budidaya.

---

## Kondisi greenhouse

1. Greenhouse dengan ventilasi lancar dan penutup paranet hitam 50% di atas.
2. Anggrek berada dalam fase vegetatif menuju pembungaan.
3. Media: arang kayu, sabut kelapa, dan lumut (komposisi campuran per pot dijelaskan di bagian media).
4. Pencahayaan: sinar matahari alami.

## Perlakuan khusus yang diinginkan

1. Tutup dengan kain hitam pada jam **16:00 — 08:00** (roller).
2. Kelembaban lingkungan ideal **50% — 70% RH**.
3. Suhu lingkungan ideal **22°C — 30°C**.
4. Jika suhu > **30°C**, lakukan penyemprotan misting untuk mendinginkan.

---

# 1. Prinsip umum pemeliharaan *Cattleya*

* *Cattleya* menyukai cahaya sedang-tinggi (bukan sinar matahari langsung penuh selama jam terik) serta sirkulasi udara baik.
* Drainase media harus sangat baik; akar anggrek rentan busuk jika tergenang.
* Fluktuasi suhu siang-malam membantu pembungaan — jangan biarkan suhu malam turun ekstrem.
* Kelembaban sedang hingga tinggi (50–70%) dengan ventilasi untuk mencegah penyakit jamur.

# 2. Media tanam dan pot

**Komposisi media (rekomendasi):**

* Arang kayu (bark) ukuran 1–3 cm: 50% — menyediakan struktur pori dan aerasi.
* Sabut kelapa (serabut kasar) : 30% — menahan sedikit kelembaban dan memberikan dukungan.
* Lumut sphagnum (kering/tidak terlalu padat): 20% — membantu menahan kelembaban pada permukaan.

**Catatan:** sesuaikan rasio bila kondisi cuaca sangat kering (tambah lumut) atau sangat lembap (tambah arang kayu untuk drainase).

**Pot / wadah:** pot plastik berlubang atau keranjang anyaman; pastikan lubang besar untuk drainase dan ventilasi akar.

**Penggantian media:** setiap 2–3 tahun atau jika media mulai lapuk; lakukan repotting saat akar mulai keluar dari pot atau saat tanaman tumbuh pesat.

# 3. Penempatan dan pencahayaan

* Karena ada paranet 50%, evaluasi intensitas cahaya di pagi, siang, sore. *Cattleya* butuh intensitas sedang-tinggi — jika cahaya terlalu kuat di jam 11–14, gunakan kain hitam untuk menutupi atau misting untuk pendinginan.
* Pastikan tidak ada sinar matahari langsung membakar daun saat suhu tinggi.

# 4. Irigasi (penyiraman) dan misting

**Irigasi dasar (pot level):**

* Siram langsung di pangkal media ketika media permukaan mulai terasa kering (uji dengan jari 2–3 cm). Frekuensi: rata-rata 3–7 hari sekali tergantung cuaca, ventilasi, dan ukuran pot.
* Jangan biarkan air menggenang di dalam pot.

**Misting (udara lingkungan):**

* Gunakan misting halus (nozzle yang menghasilkan butiran halus) untuk menaikkan kelembaban dan mendinginkan suhu.
* Kebijakan yang diharapkan: aktifkan misting **otomatis** bila suhu > 30°C atau bila RH < 50% pada siang hari.
* Durasi semprot awal: 1–3 menit per siklus, ulangi tiap 20–30 menit selama kondisi panas ekstrem; sesuaikan supaya tidak membuat permukaan media basah terus-menerus.
* Hindari misting di malam hari jika ventilasi buruk — mengurangi risiko jamur. Namun karena direncanakan kain hitam menutup dari 16:00–08:00, pastikan RH malam tidak terlalu tinggi (>85%). Target malam tetap 50–70%.

**Catatan khusus:** Karena penutup kain hitam pada jam 16:00–08:00, jangan lakukan misting besar sebelum penutupan; lebih aman melakukan pendinginan dan misting ringan sebelum jam 16:00 sehingga saat ditutup tidak terjadi kondensasi berlebih.

# 5. Suhu dan kelembaban — parameter & tindakan otomatis

**Target operasional:**

* Suhu siang: **22–30°C**
* Suhu malam: **18–24°C** (hindari di bawah 15°C)
* Kelembaban (RH): **50–70%**

**Aturan otomatisasi sederhana (rule engine):**

1. Jika `T > 30°C` → aktifkan **misting** (siklus: 2 menit setiap 20 menit) sampai `T ≤ 30°C`.
2. Jika `RH < 50%` dan `T ≤ 30°C` → aktifkan misting singkat (1 menit tiap 30 menit) hingga `RH ≥ 50%`.
3. Jika `RH > 75%` → hentikan misting & tingkatkan ventilasi (buka ventilasi lebih lebar) untuk menurunkan risiko jamur.
4. Penutup kain: **otomatis** turun 16:00 dan naik 08:00. Sebelum menurunkan kain (pukul 16:00), pastikan daun dan permukaan media relatif kering (minimalkan embun) — lakukan pengudaraan 10 menit sebelum penutupan.

**Sensor:**

* Sensor suhu akurat (±0.5°C)
* Sensor kelembaban relatif (RH) akurat
* Sensor intensitas cahaya (lux atau PAR) untuk memastikan pencahayaan memadai
* Flow meter untuk sistem misting

**Aktuator:**

* Solenoid Valve untuk pompa nozzle mist
* Motor roller tirai untuk kain penutup

# 6. Jadwal rutin (SOP)

## Harian (pagi & sore)

**Pagi (08:00 — 09:30)**

* Buka kain penutup (jika masih tertutup otomatis sampai jam 8:00).
* Cek visual kesehatan daun, akar, dan pucuk.
* Periksa data sensor (suhu, RH, cahaya). Catat penyimpangan.
* Siram dasar/pot jika media kering.
* Lakukan ventilasi selama 10–15 menit setelah penutupan malam untuk mengurangi kelembaban permukaan.

**Sore (16:00 sebelum penutupan)**

* Pastikan daun dan media relatif kering; hentikan misting 30–60 menit sebelum penutupan.
* Tutup kain hitam otomatis pukul 16:00.
* Matikan lampu / perangkat yang tidak diperlukan.

## Mingguan

* Periksa akar: cari tanda busuk, jamur, atau hama.
* Semprot hama preventif jika ditemukan gastropoda/aphid/mites (lihat bagian pengendalian hama).
* Beri pupuk larut (lihat jadwal pupuk).
* Bersihkan jalur drainase dan area sekeliling pot.

## Bulanan

* Evaluasi kebutuhan repotting (cek kondisi media dan akar).
* Ganti 10–20% media permukaan bila terdegradasi.
* Servis nozzle misting dan pastikan distribusi merata.

# 7. Pemupukan

**Jenis pupuk:** pupuk NPK khusus anggrek atau pupuk larut yang seimbang (contoh 20-20-20 untuk fase vegetatif). Saat mendekati pembungaan, gunakan formula rendah nitrogen dan lebih tinggi fosfor/potasium (mis. 10-30-20) untuk merangsang bunga.

**Frekuensi & dosis:**

* Sistem "dosis kecil tetapi sering": 1/4 hingga 1/2 dosis pabrikan setiap 1–2 minggu.
* Alternatif: dosis penuh setiap 3–4 minggu tergantung respons tanaman.

**Cara pemberian:** pupuk larut disuntikkan setelah penyiraman normal (media basah), atau gunakan sistem fertigasi kecil.

# 8. Perbanyakan dan perawatan untuk fase pembungaan

* Untuk *Cattleya* yang sedang berbunga, hindari repotting kecuali benar-benar diperlukan.
* Dukung batang bunga (inflorescence) dengan penyangga lembut bila perlu.
* Hindari pemupukan berlebihan tinggi nitrogen dekat waktu serapan pembungaan.

# 9. Hama dan penyakit umum & tindakan

**Hama:** kutu daun (aphid), kutu putih, tungau (spider mite), bekicot & siput.

* **Tindakan:** inspeksi rutin, semprot insektisida berbasis minyak (minyak nimba/soaps) atau insektisida spesifik bila infestasi besar. Gunakan perangkap lengket kuning untuk kutu putih/leaf miners.

**Penyakit:** busuk akar (Pythium, Phytophthora), bercak daun (jamur)

* **Tindakan:** perbaiki drainase, kurangi frekuensi penyiraman; gunakan fungisida jika perlu; buang jaringan yang terinfeksi.

**Protokol isolasi:** tanaman dengan gejala parah dipindah ke area karantina dan diberi perawatan terpisah.

# 10. Troubleshooting cepat

* **Daun menguning dari pangkal:** kemungkinan overwatering/akar busuk — periksa akar, kurangi penyiraman.
* **Daun kusam/pucat & tidak berbunga:** bisa kurang cahaya atau nutrisi — tingkatkan cahaya pagi dan evaluasi pupuk.
* **Bintik hitam di daun:** cek jamur/bakteri; kurangi kelembaban permukaan dan gunakan fungisida bila perlu.
* **Akar matang (kaku dan coklat):** ciri busuk akar — repotting dan pemangkasan akar yang mati.

# 11. Checklist harian singkat (untuk operator)

* [ ] Cek status cover (open/closed) sesuai jam.
* [ ] Baca sensor (T, RH, cahaya) — catat bila out-of-spec.
* [ ] Lakukan penyiraman bila perlu.
* [ ] Hentikan misting 30–60 menit sebelum penutupan.
* [ ] Inspeksi cepat hama/penyakit.

# 13. Kebijakan keselamatan & lingkungan

* Gunakan alat pelindung saat menangani pestisida/fungisida.
* Simpan bahan kimia di wadah tertutup, jauh dari area tanam.
* Limbah media (media bekas) dibuang sesuai peraturan setempat; pertimbangkan komposting bila aman.
