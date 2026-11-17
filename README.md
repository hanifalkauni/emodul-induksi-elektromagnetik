# E-Modul Interaktif Fisika: Induksi Elektromagnetik
### *“Dari Gerak Magnet Menjadi Energi Listrik”*

Aplikasi web e-modul interaktif berbasis pendekatan **STEM** (*Science, Technology, Engineering, Mathematics*) dan **Project-Based Learning (PjBL) / Engineering Design Process (EDP)** untuk materi **Induksi Elektromagnetik**.

## Fitur Utama (17 Screen Terpadu)
1. **Orientasi & Peta Belajar (Screen 1–4)**: Identitas siswa, panduan ikon navigasi, peta perjalanan belajar interaktif, dan daftar tujuan pembelajaran.
2. **Eksplorasi Konsep & Simulasi Virtual (Screen 5–8)**:
   - Animasi fenomena pemantik magnet keluar-masuk kumparan & input hipotesis awal.
   - Simulator **Fluks Magnetik** ($\Phi = B \cdot A \cdot \cos\theta$) real-time.
   - Simulator **Hukum Faraday** ($\varepsilon = -N \frac{\Delta\Phi}{\Delta t}$) dengan galvanometer & kecerahan LED dinamis.
   - Simulator **Hukum Lenz** (4 kombinasi kutub magnet & arah gerak).
3. **Eksperimen Learning Kit (Screen 9)**: Checklist alat lab, strategi GGL maksimum, pembagian & rotasi 5 peran kelompok (*Leader, Engineer, Data Analyst, Experimenter, Communicator*), cetak LKPD PDF.
4. **Proyek STEM Generator Mini (Screen 10–16)**: Misi desain, papan ide *brainstorming*, kanvas sketsa digital, dokumentasi prototipe, tabel pengujian V1, evaluasi perbaikan V2, hingga *Showcase Presentation Mode*.
5. **Refleksi 4C & Ekspor Portofolio (Screen 17)**: Rubrik Kreativitas & Kolaborasi (Skala 1–4), QR Barcode/Link Google Form, dan ekspor Portofolio Pembelajaran PDF.

## Menjalankan Secara Lokal
```bash
npm install
npm run dev
```

## Deploy ke Vercel (Plan Hobby / Gratis)
Proyek ini sudah dilengkapi `vercel.json` dan 100% berjalan sebagai *static site* (`npm run build` → `dist/`).
1. Push repositori ini ke GitHub.
2. Buka [vercel.com](https://vercel.com), pilih **Add New Project** → impor repositori ini.
3. Klik **Deploy** (Framework Preset `Vite`, Build Command `npm run build`, Output Directory `dist` terdeteksi otomatis).

