import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  User,
  GraduationCap,
  Users,
  Building2,
  Zap,
  Lightbulb,
  Compass,
  PlayCircle,
  FlaskConical,
  Award,
  Star,
  BookOpen,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Magnet,
  Wrench,
} from 'lucide-react';
import { useModul } from '../../context/ModulContext';

const COURSE_CATALOG = [
  {
    pillar: 'Pilar 1',
    title: 'Petunjuk & Peta Belajar',
    badge: 'Orientasi',
    duration: '5 Menit',
    icon: Compass,
    desc: 'Pahami navigasi 17 screen dan rute perjalanan belajar STEM & EDP.',
  },
  {
    pillar: 'Pilar 2',
    title: 'Fenomena Lampu Tanpa Baterai',
    badge: 'Eksplorasi',
    duration: '10 Menit',
    icon: Lightbulb,
    desc: 'Simulasi interaktif keluar-masuk magnet dan analisis nyala lampu LED.',
  },
  {
    pillar: 'Pilar 3',
    title: 'Fluks Magnetik & Hukum Faraday',
    badge: 'Konsep Inti',
    duration: '15 Menit',
    icon: Zap,
    desc: 'Pelajari luas penampang kumparan, kerapatan garis gaya, dan persamaan ggl induksi.',
  },
  {
    pillar: 'Pilar 4',
    title: 'Hukum Lenz & Arah Arus Induksi',
    badge: 'Prinsip Arah',
    duration: '15 Menit',
    icon: PlayCircle,
    desc: 'Kaidah tangan kanan, medan magnet lawan, dan panah arus kawat depan kumparan.',
  },
  {
    pillar: 'Pilar 5',
    title: 'Laboratorium Virtual & Eksperimen',
    badge: 'Praktikum',
    duration: '20 Menit',
    icon: FlaskConical,
    desc: 'Uji variasi jumlah lilitan N, kuat medan B, dan kecepatan gerak magnet v.',
  },
  {
    pillar: 'Pilar 6',
    title: 'Tantangan EDP (Prototipe Genset)',
    badge: 'Rekayasa STEM',
    duration: '30 Menit',
    icon: Cpu,
    desc: 'Brainstorming ide kelompok, sketsa 3D, pengujian prototipe, dan analisis perbaikan.',
  },
  {
    pillar: 'Pilar 7',
    title: 'Evaluasi, Refleksi & Cetak Portofolio',
    badge: 'Penilaian',
    duration: '15 Menit',
    icon: Award,
    desc: 'Kuis interaktif 5 soal, penilaian diri, dan ekspor laporan LKPD format PDF.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Alya Putri Pratama',
    role: 'Siswa Kelas XII MIPA 1',
    school: 'SMAN 1 Nusantara',
    rating: 5,
    icon: GraduationCap,
    iconColor: 'text-brand-700 bg-brand-50 border-brand-200',
    quote:
      'Animasi magnet keluar-masuk kumparan dengan panah arus kawat depan langsung bikin paham konsep Hukum Lenz yang selama ini abstrak di buku paket!',
  },
  {
    name: 'Bima Aditya & Tim',
    role: 'Ketua Kelompok 3 STEM',
    school: 'SMAN 3 Kota Baru',
    rating: 5,
    icon: FlaskConical,
    iconColor: 'text-brand-700 bg-brand-50 border-brand-200',
    quote:
      'Alur Engineering Design Process (EDP)-nya mantap! Dari brainstorming ide, sketsa desain, sampai uji prototipe generator mini terasa seperti insinyur sungguhan.',
  },
  {
    name: 'Nadia Syakirah',
    role: 'Siswa Kelas XII MIPA 2',
    school: 'SMAN 5 Unggulan',
    rating: 5,
    icon: Lightbulb,
    iconColor: 'text-brand-700 bg-brand-50 border-brand-200',
    quote:
      'Fitur ekspor Portofolio LKPD PDF sangat memudahkan pengumpulan tugas ke guru. Desainnya cerah, interaktif, dan seru banget buat belajar!',
  },
];

export const Screen01Cover: React.FC = () => {
  const { state, updateIdentity, setScreen } = useModul();
  const [magnetPhase, setMagnetPhase] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setMagnetPhase((p) => (p + 0.06) % (Math.PI * 2));
    }, 30);
    return () => clearInterval(timer);
  }, []);

  // Magnet horizontal oscillation (0 to +135 px so magnet enters deep inside coil!)
  const magnetOffset = 67.5 + Math.sin(magnetPhase) * 67.5;
  // Magnet right edge is 176 + magnetOffset; coil starts at x=245 -> active only while inside coil
  const isInsideCoil = 176 + magnetOffset >= 245;
  const emfMagnitude = isInsideCoil ? Math.abs(Math.cos(magnetPhase)) : 0;
  const ledGlow = Math.min(1, emfMagnitude * 1.15);
  const isEntering = Math.cos(magnetPhase) >= 0;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !state.identity.studentName.trim() ||
      !state.identity.studentClass.trim() ||
      !state.identity.groupName.trim() ||
      !state.identity.schoolName.trim()
    ) {
      setErrorMsg('Mohon lengkapi Nama siswa, Kelas, Kelompok, dan Sekolah sebelum memulai pembelajaran.');
      return;
    }
    setErrorMsg('');
    setScreen(2);
  };

  return (
    <div className="space-y-10 pb-8">
      {/* =========================================================
          HERO SECTION: PLATFORM LANDING
          ========================================================= */}
      <section className="card p-6 sm:p-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Title & Concept Pitch */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-50 border-brand-200 text-brand-700 text-xs font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5 text-brand-700" />
                <span>PLATFORM BELAJAR FISIKA STEM</span>
              </span>
              <span className="badge inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-700 text-xs font-semibold">
                <Rocket className="w-3.5 h-3.5 text-slate-500" />
                <span>EDP & Gamifikasi</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-bold leading-tight text-slate-900 tracking-tight">
              E-Modul Interaktif <br />
              <span className="text-brand-700">
                Induksi Elektromagnetik
              </span>
            </h1>

            <p className="text-lg sm:text-xl font-display font-medium text-slate-700">
              “Dari Gerak Magnet Menjadi Energi Listrik Nyata”
            </p>

            <p className="text-sm text-slate-600 leading-relaxed">
              Selamat datang di petualangan belajar fisika berbasis proyek rekayasa (EDP). 
              Eksplorasi fenomena, manipulasi variabel di laboratorium virtual, dan rancang prototipe generator mini kelompokmu sendiri!
            </p>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-medium text-slate-700">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-700 shrink-0" />
                <span>Simulasi Interaktif</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-brand-700 shrink-0" />
                <span>Virtual Lab Kit</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-700 shrink-0" />
                <span>Portofolio LKPD</span>
              </div>
            </div>
          </div>

          {/* Right Live SVG Physics Illustration */}
          <div className="lg:col-span-6">
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-brand-700">SIMULASI GENERATOR MINI</span>
                </div>
                <span className="font-mono text-slate-900 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  ε ≈ {(emfMagnitude * 3.2).toFixed(2)} V
                </span>
              </div>

              <div className="sim-canvas p-2.5">
                <svg viewBox="0 0 460 220" className="w-full h-auto" role="img" aria-label="Simulasi generator magnet bergerak">
                <defs>
                  <radialGradient id="coverLedGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FBBF24" stopOpacity={ledGlow} />
                    <stop offset="60%" stopColor="#F59E0B" stopOpacity={ledGlow * 0.4} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Coil Back Shell & Back Windings */}
                <rect x="245" y="72" width="102" height="76" rx="10" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                  const cx = 258 + idx * 13;
                  return (
                    <path
                      key={`back-${idx}`}
                      d={`M ${cx} 72 A 7 38 0 0 0 ${cx} 148`}
                      fill="none"
                      stroke="#B45309"
                      strokeWidth="3.5"
                    />
                  );
                })}

                {/* Magnetic Flux Lines moving with magnet */}
                <g transform={`translate(${magnetOffset}, 0)`} opacity={0.45 + emfMagnitude * 0.45}>
                  <path d="M 175 95 C 205 68, 240 68, 265 95" fill="none" stroke="#0891B2" strokeWidth="1.5" strokeDasharray="5 4" />
                  <path d="M 175 110 L 275 110" fill="none" stroke="#0891B2" strokeWidth="1.8" strokeDasharray="6 4" />
                  <path d="M 175 125 C 205 152, 240 152, 265 125" fill="none" stroke="#0891B2" strokeWidth="1.5" strokeDasharray="5 4" />
                </g>

                {/* Moving Bar Magnet (Slides INSIDE the coil!) */}
                <g transform={`translate(${magnetOffset}, 0)`}>
                  <rect x="68" y="92" width="54" height="36" rx="4" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1.5" />
                  <rect x="122" y="92" width="54" height="36" rx="4" fill="#DC2626" stroke="#B91C1C" strokeWidth="1.5" />
                  <text x="95" y="116" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="bold" fontFamily="JetBrains Mono">S</text>
                  <text x="149" y="116" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="bold" fontFamily="JetBrains Mono">U</text>
                </g>

                {/* Front Half of Copper Coil */}
                <g>
                  {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                    const cx = 258 + idx * 13;
                    return (
                      <path
                        key={`front-${idx}`}
                        d={`M ${cx} 72 A 7 38 0 0 1 ${cx} 148`}
                        fill="none"
                        stroke="#D97706"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* GREEN CURRENT ARROWS ON FRONT WINDINGS (Tanda Panah Segitiga Hijau Kawat Depan) */}
                  {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                    const fx = 258 + idx * 13 + 7; // Puncak lengkungan kawat depan
                    const fy = 110;
                    return (
                      <g key={`arrow-${idx}`} opacity={ledGlow > 0.15 ? 1 : 0.75}>
                        <circle cx={fx} cy={fy} r="7" fill="#10B981" fillOpacity={ledGlow > 0.15 ? 0.35 : 0.15} />
                        <polygon
                          points={
                            isEntering
                              ? `${fx},${fy - 8} ${fx - 5},${fy + 4} ${fx + 5},${fy + 4}`
                              : `${fx},${fy + 8} ${fx - 5},${fy - 4} ${fx + 5},${fy - 4}`
                          }
                          fill="#10B981"
                          stroke="#064E3B"
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })}

                  <text x="296" y="172" textAnchor="middle" fill="#475569" fontSize="10.5" fontFamily="Work Sans">
                    Kumparan Kawat Depan (▲ Arus I)
                  </text>
                </g>

                {/* Wires to LED */}
                <path d="M 260 148 L 260 185 L 385 185 L 385 130" fill="none" stroke={ledGlow > 0.2 ? '#10B981' : '#94A3B8'} strokeWidth="2.5" />
                <path d="M 338 148 L 338 170 L 405 170 L 405 130" fill="none" stroke={ledGlow > 0.2 ? '#10B981' : '#94A3B8'} strokeWidth="2.5" />

                {/* LED Bulb */}
                <circle cx="395" cy="95" r="42" fill="url(#coverLedGlow)" />
                <path
                  d="M 380 120 L 380 96 A 15 15 0 0 1 410 96 L 410 120 Z"
                  fill={ledGlow > 0.2 ? '#FBBF24' : '#E2E8F0'}
                  fillOpacity={0.35 + ledGlow * 0.65}
                  stroke="#F59E0B"
                  strokeWidth="2"
                />
                <rect x="376" y="120" width="38" height="8" rx="2" fill="#94A3B8" />
                <text x="395" y="55" textAnchor="middle" fill="#B45309" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
                  LED {ledGlow > 0.2 ? 'MENYALA' : 'REDUP'}
                </text>
              </svg>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-slate-600 font-medium px-1">
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-brand-700" />
                <span>Magnet keluar-masuk memicu fluks dan arus listrik</span>
              </span>
              <span className="text-emerald-600 font-mono font-bold">▲ Panah Hijau: Arah Arus I</span>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          STUDENT ENROLLMENT FORM (IDENTITY CARD)
          ========================================================= */}
      <section className="card p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
              <User className="w-3.5 h-3.5" />
              <span>LANGKAH 1 DARI 17</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900">
              Identitas Peserta Didik & Kelompok
            </h2>
            <p className="text-sm text-slate-600">
              Lengkapi identitas sebelum mengakses modul. Data akan tercantum otomatis di laporan LKPD dan Portofolio akhir.
            </p>
          </div>
          <span className="badge self-start px-3.5 py-1.5 bg-slate-50 text-slate-700 text-xs font-bold font-mono">
            Wajib Dilengkapi
          </span>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="block space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <User className="w-4 h-4 text-brand-700" /> Nama Siswa
              </span>
              <input
                type="text"
                value={state.identity.studentName}
                onChange={(e) => updateIdentity({ studentName: e.target.value })}
                placeholder="Contoh: Alya Putri Pratama"
                className="input w-full px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <GraduationCap className="w-4 h-4 text-brand-700" /> Kelas
              </span>
              <input
                type="text"
                value={state.identity.studentClass}
                onChange={(e) => updateIdentity({ studentClass: e.target.value })}
                placeholder="Contoh: XII MIPA 1"
                className="input w-full px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Users className="w-4 h-4 text-brand-700" /> Kelompok
              </span>
              <input
                type="text"
                value={state.identity.groupName}
                onChange={(e) => updateIdentity({ groupName: e.target.value })}
                placeholder="Contoh: Kelompok 3"
                className="input w-full px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Building2 className="w-4 h-4 text-brand-700" /> Sekolah
              </span>
              <input
                type="text"
                value={state.identity.schoolName}
                onChange={(e) => updateIdentity({ schoolName: e.target.value })}
                placeholder="Contoh: SMA Negeri 1 Nusantara"
                className="input w-full px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </label>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Data tersimpan otomatis di browser lokal (aman & offline-ready).</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full sm:w-auto px-8 py-4 text-base font-display font-bold tracking-wide"
            >
              <span>MULAI PEMBELAJARAN SEKARANG</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </form>
      </section>

      {/* =========================================================
          COURSE CATALOG PREVIEW (PREVIEW ALUR MODUL 7 PILAR)
          ========================================================= */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="badge inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold font-mono">
            <BookOpen className="w-3.5 h-3.5" />
            <span>KATALOG KURIKULUM MODUL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            7 Pilar Pembelajaran Interaktif STEM
          </h2>
          <p className="text-sm text-slate-600">
            Alur pembelajaran terstruktur 17 layar yang memadukan teori fisika kuantitatif dengan tahapan Engineering Design Process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {COURSE_CATALOG.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="card p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                      {item.pillar}
                    </span>
                    <span className="badge text-[11px] font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700">
                      {item.duration}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-brand-700" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-900 text-base leading-snug">
                        {item.title}
                      </h3>
                      <span className="text-[11px] font-semibold text-brand-700">
                        {item.badge}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-700">
                  <span>Lihat Detail Materi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          PROGRESS TRACKING DEMO (SIMULASI PELACAK PROGRES SISWA)
          ========================================================= */}
      <section className="card card-tint p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="badge inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-800 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>LIVE PROGRESS TRACKING DEMO</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900">
              Pantau Penguasaan Materi Secara Real-Time
            </h2>
            <p className="text-sm text-slate-600">
              Sistem akan menghitung kemajuanmu di setiap screen dan memberikan penghargaan atas setiap capaian eksperimen.
            </p>
          </div>

          <div className="card p-4 bg-white shrink-0 text-center space-y-1">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Level Siswa</span>
            <div className="text-lg font-display font-bold text-brand-700">
              Level 1: Penjelajah Magnet
            </div>
          </div>
        </div>

        {/* Progress Bar Demo */}
        <div className="space-y-2 p-5 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">Progres Keseluruhan E-Modul</span>
            <span className="font-mono text-brand-700">{state.visitedScreens.length} / 17 Layar ({Math.round((state.visitedScreens.length / 17) * 100)}%)</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(8, (state.visitedScreens.length / 17) * 100)}%` }}
            />
          </div>
        </div>

        {/* Milestone Badges Demo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
              <Magnet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Master Fluks</div>
              <div className="text-[10px] text-emerald-700 font-bold">Screen 6 • Buka</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Kaidah Lenz</div>
              <div className="text-[10px] text-emerald-700 font-bold">Screen 8 • Buka</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Insinyur EDP</div>
              <div className="text-[10px] text-emerald-700 font-bold">Screen 13 • Buka</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Portofolio STEM</div>
              <div className="text-[10px] text-emerald-700 font-bold">Screen 17 • Buka</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          STUDENT TESTIMONIALS (SUARA SISWA & REKAN BELAJAR)
          ========================================================= */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="badge inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border-brand-200 text-brand-700 text-xs font-bold font-mono">
            <Star className="w-3.5 h-3.5 text-brand-700 fill-brand-700" />
            <span>TESTIMONI PEMBELAJARAN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            Pengalaman Siswa Belajar Fisika STEM
          </h2>
          <p className="text-sm text-slate-600">
            Lihat bagaimana interaktivitas modul ini membantu rekan-rekanmu memahami konsep induksi elektromagnetik secara menyenangkan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, idx) => {
            const Icon = t.icon;
            return (
              <div
                key={idx}
                className="card p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${t.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.role} • {t.school}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          BOTTOM ENROLLMENT CTA BANNER
          ========================================================= */}
      <section className="card card-tint p-8 sm:p-10 text-center space-y-5 border">
        <div className="max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            Siap Menjadi Insinyur Generator Masa Depan?
          </h2>
          <p className="text-sm text-slate-600">
            Isi identitas diri di atas, klik tombol mulai, dan temukan bagaimana gerak sederhana dapat menghasilkan energi listrik tanpa batas!
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 320, behavior: 'smooth' });
            }}
            className="btn btn-primary px-8 py-4 text-sm font-display font-bold"
          >
            <span>ISI IDENTITAS & MULAI SEKARANG</span>
            <Rocket className="w-4 h-4 ml-2" />
          </button>
        </div>
      </section>
    </div>
  );
};
