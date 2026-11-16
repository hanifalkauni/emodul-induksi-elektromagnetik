# DESIGN SYSTEM MASTER BLUEPRINT
## E-Modul Interaktif Fisika: Induksi Elektromagnetik

Mengikuti standar **UI/UX Pro Max (`nextlevelbuilder/ui-ux-pro-max-skill`)** dengan prinsip *Design System-First*, *Vector-Only Assets*, *WCAG AA Compliance*, dan estetika *High-Craft Scientific Laboratory & Interactive STEM Studio*.

---

### 1. Identitas Visual & Gaya Antarmuka
* **Aesthetic Persona**: High-Craft Scientific Laboratory & Interactive STEM Studio
* **Layout Structure**: Bento Grid Laboratorium, Kanvas Simulasi Real-Time, Navigasi Sidebar/Drawer yang Rapi, dan Header Telemetri Siswa
* **Glass & Surface Depth**: Permukaan gelap berteknologi tinggi (*Deep Slate*) dengan border halus untuk menjaga keterbacaan formula fisika, lampu LED virtual, dan garis medan magnet bercahaya tanpa silau.

---

### 2. Token Warna (Color Tokens)

| Token | Hex | Kegunaan | Rasio Kontras (vs `#0B1120`) |
| :--- | :--- | :--- | :--- |
| `--bg-primary` | `#0B1120` | Latar belakang utama ruang laboratorium digital | Base |
| `--bg-surface` | `#111827` | Permukaan panel utama & kartu komponen | - |
| `--bg-elevated` | `#1E293B` | Kartu interaktif, kontrol simulator, input field | - |
| `--border-subtle` | `#334155` | Garis tepi panel dan pembatas tabel | - |
| `--text-primary` | `#F8FAFC` | Teks judul dan isi utama (WCAG AAA) | ~17.5:1 |
| `--text-secondary` | `#CBD5E1` | Teks penjelasan materi dan subjudul | ~11.8:1 |
| `--text-muted` | `#94A3B8` | Label satuan, timestamp, placeholder | ~6.8:1 |
| `--accent-flux` | `#06B6D4` | Fluks Magnetik ($\Phi$), garis gaya medan, highlight ilmiah | ~7.6:1 |
| `--accent-emf` | `#F59E0B` | GGL Induksi ($\varepsilon$), lilitan tembaga, pendar LED | ~8.8:1 |
| `--pole-north` | `#EF4444` | Kutub Utara Magnet (U / N) | ~4.9:1 |
| `--pole-south` | `#3B82F6` | Kutub Selatan Magnet (S) | ~5.4:1 |
| `--accent-current` | `#10B981` | Arus Induksi ($I$), status selesai, indikator keberhasilan | ~7.9:1 |

---

### 3. Tipografi (Typography Pairing)

| Peran | Keluarga Huruf | Kegunaan |
| :--- | :--- | :--- |
| **Display & Headings** | `Space Grotesk` | Judul screen, angka tahapan perjalanan belajar, header hero |
| **UI & Reading Body** | `Plus Jakarta Sans` | Paragraf materi, instruksi praktikum, pertanyaan pemantik, form |
| **Telemetry & Formulas** | `JetBrains Mono` | Pembacaan multimeter digital, nilai $\Phi$ ($\text{Wb}$), $\varepsilon$ ($\text{V}$), persamaan matematis |

---

### 4. Pedoman Komponen & Aksesibilitas (Guardrails)
1. **Vector-Only Icons**: Seluruh ikon navigasi (Home, Materi, Eksperimen, Tantangan, Kolaborasi, Evaluasi, Refleksi) menggunakan SVG vektor konsisten dari `lucide-react`. Tidak ada ikon raster atau navigasi berbasis emoji mentah.
2. **Tactile Physics Sliders**: Semua kontrol variabel ($B$, $A$, $\theta$, $N$, $\Delta\Phi/\Delta t$) memiliki label eksplisit, angka real-time dengan font monospace, dan satuan fisik yang jelas (`T`, `m²`, `°`, `Wb`, `Lilitan`, `V`).
3. **Interaction States**: Setiap tombol, card tahapan, dan checkbox memiliki state `hover`, `focus-visible` (ring `#06B6D4`), `active`, dan `disabled` yang jelas.
4. **Responsive Integrity**: Bebas horizontal scroll di breakpoint mobile (`360px`), tablet (`768px`), hingga desktop (`1440px+`).
5. **Auto-Save Persistence**: Seluruh input hipotesis, tabel pengujian, catatan ide, dan rubrik refleksi tersimpan otomatis ke `localStorage` secara instan dengan indikator status penyimpanan di header.

