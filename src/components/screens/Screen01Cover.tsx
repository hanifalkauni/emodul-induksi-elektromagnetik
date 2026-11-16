import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, User, GraduationCap, Users, Building2, Zap, Lightbulb } from 'lucide-react';
import { useModul } from '../../context/ModulContext';

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
    <div className="space-y-6">
      {/* Hero Cover Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Title & Concept Visual Explanation */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>E-MODUL INTERAKTIF BERBASIS STEM & EDP</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-bold leading-tight text-white">
              E-MODUL INTERAKTIF FISIKA <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300">
                INDUKSI ELEKTROMAGNETIK
              </span>
            </h1>

            <p className="text-lg sm:text-xl font-display italic text-amber-300/95">
              “Dari Gerak Magnet Menjadi Energi Listrik”
            </p>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-300 leading-relaxed">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold mb-1.5">
                <Zap className="w-4 h-4" />
                <span>Konsep Dasar Generator Listrik</span>
              </div>
              Generator listrik tersusun dari <strong className="text-white">magnet</strong> dan{' '}
              <strong className="text-amber-300">kumparan</strong>. Tegangan listrik akan dihasilkan jika terjadi{' '}
              <strong className="text-cyan-300">perubahan fluks magnetik</strong> yang memasuki kumparan—yakni saat magnet digerakkan memasuki kumparan dan keluar dari kumparan.
            </div>
          </div>

          {/* Right Live SVG Physics Illustration */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 shadow-inner">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>SIMULASI GENERATOR MINI (LIVE)</span>
                <span className="text-amber-400">
                  ε ≈ {(emfMagnitude * 3.2).toFixed(2)} V
                </span>
              </div>

              <svg viewBox="0 0 460 220" className="w-full h-auto" role="img" aria-label="Ilustrasi generator magnet bergerak memasuki dan keluar kumparan menyalakan LED">
                <defs>
                  <radialGradient id="coverLedGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FBBF24" stopOpacity={ledGlow} />
                    <stop offset="60%" stopColor="#F59E0B" stopOpacity={ledGlow * 0.4} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Coil Back Shell & Back Windings */}
                <rect x="245" y="72" width="102" height="76" rx="10" fill="#0F172A" fillOpacity="0.75" stroke="#334155" strokeWidth="1.5" />
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                  const cx = 258 + idx * 13;
                  return (
                    <path
                      key={`back-${idx}`}
                      d={`M ${cx} 72 A 7 38 0 0 0 ${cx} 148`}
                      fill="none"
                      stroke="#92400E"
                      strokeWidth="3.5"
                    />
                  );
                })}

                {/* Magnetic Flux Lines moving with magnet */}
                <g transform={`translate(${magnetOffset}, 0)`} opacity={0.45 + emfMagnitude * 0.45}>
                  <path d="M 175 95 C 205 68, 240 68, 265 95" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="5 4" />
                  <path d="M 175 110 L 275 110" fill="none" stroke="#06B6D4" strokeWidth="1.8" strokeDasharray="6 4" />
                  <path d="M 175 125 C 205 152, 240 152, 265 125" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="5 4" />
                </g>

                {/* Moving Bar Magnet (Slides INSIDE the coil!) */}
                <g transform={`translate(${magnetOffset}, 0)`}>
                  <rect x="68" y="92" width="54" height="36" rx="4" fill="#3B82F6" stroke="#93C5FD" strokeWidth="1.5" />
                  <rect x="122" y="92" width="54" height="36" rx="4" fill="#EF4444" stroke="#FCA5A5" strokeWidth="1.5" />
                  <text x="95" y="116" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="bold" fontFamily="JetBrains Mono">S</text>
                  <text x="149" y="116" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="bold" fontFamily="JetBrains Mono">U</text>
                </g>

                {/* Front Half of Copper Coil (Wraps OVER Magnet when inside) */}
                <g>
                  {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                    const cx = 258 + idx * 13;
                    return (
                      <path
                        key={`front-${idx}`}
                        d={`M ${cx} 72 A 7 38 0 0 1 ${cx} 148`}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                      />
                    );
                  })}
                  <text x="296" y="168" textAnchor="middle" fill="#CBD5E1" fontSize="11" fontFamily="Plus Jakarta Sans">
                    Kumparan Tembaga
                  </text>
                </g>

                {/* Wires to LED */}
                <path d="M 260 148 L 260 185 L 385 185 L 385 130" fill="none" stroke="#94A3B8" strokeWidth="2.5" />
                <path d="M 338 148 L 338 170 L 405 170 L 405 130" fill="none" stroke="#94A3B8" strokeWidth="2.5" />

                {/* LED Bulb */}
                <circle cx="395" cy="95" r="42" fill="url(#coverLedGlow)" />
                <path
                  d="M 380 120 L 380 96 A 15 15 0 0 1 410 96 L 410 120 Z"
                  fill={ledGlow > 0.25 ? '#FBBF24' : '#334155'}
                  fillOpacity={0.35 + ledGlow * 0.65}
                  stroke="#F59E0B"
                  strokeWidth="2"
                />
                <rect x="376" y="120" width="38" height="8" rx="2" fill="#64748B" />
                <text x="395" y="55" textAnchor="middle" fill="#FDE68A" fontSize="11" fontFamily="JetBrains Mono">
                  LED {ledGlow > 0.2 ? 'MENYALA' : 'REDUP'}
                </text>
              </svg>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Perubahan fluks saat magnet keluar-masuk memicu tegangan listrik</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Identity Form */}
      <form
        onSubmit={handleStart}
        className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-white">Identitas Peserta Didik</h2>
            <p className="text-xs text-slate-400">
              Lengkapi data dirimu sebelum memulai perjalanan belajar e-modul.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-800 text-cyan-300 border border-slate-700 self-start">
            Wajib Diisi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Nama Siswa
            </span>
            <input
              type="text"
              value={state.identity.studentName}
              onChange={(e) => updateIdentity({ studentName: e.target.value })}
              placeholder="Contoh: Alya Putri Pratama"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" /> Kelas
            </span>
            <input
              type="text"
              value={state.identity.studentClass}
              onChange={(e) => updateIdentity({ studentClass: e.target.value })}
              placeholder="Contoh: XII MIPA 1"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <Users className="w-3.5 h-3.5 text-cyan-400" /> Kelompok
            </span>
            <input
              type="text"
              value={state.identity.groupName}
              onChange={(e) => updateIdentity({ groupName: e.target.value })}
              placeholder="Contoh: Kelompok 3"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Sekolah
            </span>
            <input
              type="text"
              value={state.identity.schoolName}
              onChange={(e) => updateIdentity({ schoolName: e.target.value })}
              placeholder="Contoh: SMA Negeri 1 Nusantara"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </label>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-400">
            Semua jawaban dan rancangan proyekmu otomatis tersimpan di perangkat ini.
          </p>
          <button
            type="submit"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-display font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5"
          >
            <span>MULAI PEMBELAJARAN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

