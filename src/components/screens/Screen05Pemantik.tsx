import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle, Play, Pause, Sparkles, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { useModul } from '../../context/ModulContext';

const GUIDING_QUESTIONS = [
  'Apa yang terjadi ketika magnet digerakkan?',
  'Mengapa LED dapat menyala?',
  'Apakah magnet menghasilkan listrik?',
  'Apa yang terjadi jika magnet digerakkan lebih cepat?',
  'Bagaimana jika jumlah lilitan kumparan diperbanyak?',
];

const COIL_X_LIST = [220, 234, 248, 262, 276, 290];
const COIL_CY = 93;
const COIL_RX = 8;
const COIL_RY = 34;
// Magnet right edge = 135 + magnetPos; coil starts at x = 212 -> magnet enters coil when magnetPos >= 78
const COIL_ENTRY_POS = 78;

export const Screen05Pemantik: React.FC = () => {
  const { state, updateState, nextScreen } = useModul();
  const [isPlaying, setIsPlaying] = useState(true);
  // magnetPos: 0 (di luar kiri) s.d. 160 (masuk penuh ke dalam kumparan)
  const [magnetPos, setMagnetPos] = useState(80);
  const [ledIntensity, setLedIntensity] = useState(0);
  const [motionDir, setMotionDir] = useState<'in' | 'out'>('in');
  const [savedNotice, setSavedNotice] = useState(false);

  const prevPosRef = useRef(80);
  const phaseRef = useRef(0);

  // Hitung intensitas nyala LED: HANYA menyala jika magnet berada DI DALAM kumparan DAN sedang bergerak
  const updateLedFromMotion = (nextPos: number) => {
    const delta = Math.abs(nextPos - prevPosRef.current);
    if (nextPos > prevPosRef.current) {
      setMotionDir('in');
    } else if (nextPos < prevPosRef.current) {
      setMotionDir('out');
    }
    prevPosRef.current = nextPos;

    if (nextPos < COIL_ENTRY_POS) {
      // Batang magnet masih di luar kumparan -> LED harus padam
      setLedIntensity(0);
      return;
    }

    const pulse = delta > 0.15 ? Math.min(1, delta / 5.5) : 0;
    setLedIntensity((curr) => {
      const decayed = curr < 0.02 ? 0 : curr * 0.82;
      return Math.max(decayed, pulse);
    });
  };

  // Loop animasi otomatis + peluruhan cahaya LED saat magnet berhenti bergerak
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying) {
        phaseRef.current = (phaseRef.current + 0.065) % (Math.PI * 2);
        const nextPos = 80 + Math.sin(phaseRef.current) * 80; // 0 .. 160
        setMotionDir(Math.cos(phaseRef.current) >= 0 ? 'in' : 'out');
        setMagnetPos(nextPos);
        updateLedFromMotion(nextPos);
      } else {
        setLedIntensity((curr) => {
          if (prevPosRef.current < COIL_ENTRY_POS) return 0;
          return curr < 0.02 ? 0 : curr * 0.82;
        });
      }
    }, 30);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleManualSlide = (nextPos: number) => {
    setIsPlaying(false);
    if (nextPos > magnetPos) {
      setMotionDir('in');
    } else if (nextPos < magnetPos) {
      setMotionDir('out');
    }
    setMagnetPos(nextPos);
    updateLedFromMotion(nextPos);
  };

  const handleLockHypothesis = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const isInsideCoil = magnetPos >= COIL_ENTRY_POS;
  const activeLed = isInsideCoil ? ledIntensity : 0;
  const isLit = activeLed > 0.14;

  return (
    <div className="space-y-6">
      {/* Main Phenomenon Card */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Fenomena Pemantik</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            “Mengapa Lampu Bisa Menyala Tanpa Baterai?”
          </h1>
          <p className="text-sm text-slate-300">
            <strong>Situasi:</strong> Seorang siswa menggerakkan magnet keluar-masuk sebuah kumparan. Tiba-tiba LED yang terhubung pada kumparan menyala.
          </p>
        </div>

        {/* Interactive Video-like Demonstration + Storyboard Visual Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                ANIMASI FENOMENA INTERAKTIF
              </span>
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 shadow-sm transition"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Jeda Gerakan' : 'Putar Animasi'}</span>
              </button>
            </div>

            <svg viewBox="0 0 460 195" className="w-full h-auto rounded-xl bg-[#070B14] border border-slate-800/80">
              <defs>
                <radialGradient id="pemantikLedGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FBBF24" stopOpacity={activeLed} />
                  <stop offset="65%" stopColor="#F59E0B" stopOpacity={activeLed * 0.4} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Hollow Coil Bobbin Core */}
              <rect
                x="212"
                y={COIL_CY - COIL_RY + 2}
                width="86"
                height={COIL_RY * 2 - 4}
                rx="8"
                fill="#0F172A"
                fillOpacity="0.85"
                stroke="#334155"
                strokeWidth="1"
              />

              {/* 1. Back Half of Copper Windings (Behind Magnet) */}
              {COIL_X_LIST.map((cx, i) => (
                <path
                  key={`back-${i}`}
                  d={`M ${cx} ${COIL_CY - COIL_RY} A ${COIL_RX} ${COIL_RY} 0 0 0 ${cx} ${COIL_CY + COIL_RY}`}
                  fill="none"
                  stroke="#92400E"
                  strokeWidth="3.5"
                />
              ))}

              {/* 2. Moving Bar Magnet & Magnetic Flux Lines (Slides INSIDE the coil!) */}
              <g transform={`translate(${magnetPos}, 0)`}>
                {/* Flux lines */}
                <path
                  d="M 135 84 C 165 65, 190 65, 212 84"
                  fill="none"
                  stroke="#06B6D4"
                  strokeOpacity={0.55}
                  strokeWidth="1.4"
                  strokeDasharray="4 3"
                />
                <path
                  d="M 135 93 L 216 93"
                  fill="none"
                  stroke="#06B6D4"
                  strokeOpacity={0.75}
                  strokeWidth="1.6"
                  strokeDasharray="5 3"
                />
                <path
                  d="M 135 102 C 165 121, 190 121, 212 102"
                  fill="none"
                  stroke="#06B6D4"
                  strokeOpacity={0.55}
                  strokeWidth="1.4"
                  strokeDasharray="4 3"
                />

                {/* Bar Magnet body (height 32 fits inside coil diameter 68) */}
                <rect x="35" y="77" width="50" height="32" rx="4" fill="#3B82F6" stroke="#93C5FD" strokeWidth="1" />
                <rect x="85" y="77" width="50" height="32" rx="4" fill="#EF4444" stroke="#FCA5A5" strokeWidth="1" />
                <text x="60" y="98" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold" fontFamily="JetBrains Mono">S</text>
                <text x="110" y="98" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold" fontFamily="JetBrains Mono">U</text>
              </g>

              {/* 3. Front Half of Copper Windings (Wraps OVER Magnet when inside) */}
              {COIL_X_LIST.map((cx, i) => (
                <path
                  key={`front-${i}`}
                  d={`M ${cx} ${COIL_CY - COIL_RY} A ${COIL_RX} ${COIL_RY} 0 0 1 ${cx} ${COIL_CY + COIL_RY}`}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                />
              ))}

              {/* 4. Green Current Arrows on Front Windings (Tanda Panah Segitiga Hijau Arus Induksi di Bagian Depan) */}
              {COIL_X_LIST.map((cx, i) => {
                const fx = cx + COIL_RX; // Puncak kawat depan (posisi dilingkari merah oleh user)
                const fy = COIL_CY; // y = 93
                const isArrowUp = motionDir === 'in';
                return (
                  <g key={`arrow-${i}`}>
                    {/* Glowing background halo */}
                    <circle cx={fx} cy={fy} r="9" fill="#10B981" fillOpacity={isLit ? 0.35 : 0.15} />
                    {/* Bold Green Triangle Arrow */}
                    <polygon
                      points={
                        isArrowUp
                          ? `${fx},${fy - 9} ${fx - 6.5},${fy + 6} ${fx + 6.5},${fy + 6}`
                          : `${fx},${fy + 9} ${fx - 6.5},${fy - 6} ${fx + 6.5},${fy - 6}`
                      }
                      fill="#10B981"
                      stroke="#064E3B"
                      strokeWidth="1.8"
                    />
                  </g>
                );
              })}

              {/* Label Indikator Panah Arus Induksi */}
              <g transform="translate(255, 48)">
                <rect x="-75" y="-13" width="150" height="22" rx="11" fill="#064E3B" fillOpacity="0.9" stroke="#10B981" strokeWidth="1.2" />
                <text x="0" y="2" textAnchor="middle" fill="#A7F3D0" fontSize="9.5" fontWeight="bold" fontFamily="JetBrains Mono">
                  ▲ ARUS INDUKSI (I) {motionDir === 'in' ? '↑ NAIK' : '↓ TURUN'}
                </text>
              </g>

              <text x="255" y="144" textAnchor="middle" fill="#CBD5E1" fontSize="10.5">
                Kumparan Berongga
              </text>

              {/* Status Position Label */}
              <text x="115" y="144" textAnchor="middle" fill={isInsideCoil ? '#38BDF8' : '#F1F5F9'} fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
                {isInsideCoil ? 'Magnet di DALAM kumparan' : 'Magnet di LUAR kumparan'}
              </text>

              {/* Circuit Wires to LED */}
              <path d="M 220 127 L 220 166 L 372 166 L 372 112" fill="none" stroke={isLit ? '#10B981' : '#64748B'} strokeWidth="2.5" />
              <path d="M 290 127 L 290 152 L 392 152 L 392 112" fill="none" stroke={isLit ? '#10B981' : '#64748B'} strokeWidth="2.5" />

              {/* Animated Current Arrows on Circuit Wires */}
              <polygon points="300,166 291,161 291,171" fill={isLit ? '#10B981' : '#64748B'} stroke={isLit ? '#064E3B' : 'transparent'} strokeWidth="1" />
              <polygon points="340,152 349,147 349,157" fill={isLit ? '#10B981' : '#64748B'} stroke={isLit ? '#064E3B' : 'transparent'} strokeWidth="1" />

              {/* LED */}
              <circle cx="382" cy="85" r="38" fill="url(#pemantikLedGlow)" />
              <path
                d="M 369 108 L 369 86 A 13 13 0 0 1 395 86 L 395 108 Z"
                fill={isLit ? '#FBBF24' : '#334155'}
                fillOpacity={isLit ? 0.35 + activeLed * 0.65 : 1}
                stroke="#F59E0B"
                strokeWidth="2"
              />
              <rect x="366" y="108" width="32" height="6" rx="2" fill="#64748B" />
              <text x="382" y="40" textAnchor="middle" fill={isLit ? '#FDE68A' : '#F1F5F9'} fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono">
                {isLit ? 'LED MENYALA!' : 'LED PADAM'}
              </text>
              <text x="382" y="182" textAnchor="middle" fill="#E2E8F0" fontSize="10" fontWeight="bold">
                {isLit
                  ? 'Fluks berubah di kumparan!'
                  : !isInsideCoil
                  ? 'Magnet masih di luar kumparan'
                  : 'Magnet diam di dalam (dΦ/dt = 0)'}
              </text>
            </svg>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Geser manual magnet keluar-masuk ke dalam kumparan:</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-300">
                  {magnetPos.toFixed(0)} mm ({isInsideCoil ? 'Masuk Kumparan' : 'Di Luar'})
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={160}
                value={magnetPos}
                onChange={(e) => handleManualSlide(Number(e.target.value))}
                className="w-full lab-slider"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Tip: Gerakkan slider bolak-balik masuk dan keluar kumparan untuk melihat LED menyala; jika magnet dibiarkan diam (walaupun di dalam), LED akan padam!
              </p>
            </div>
          </div>

          {/* Storyboard Visual References */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>REFERENSI VISUAL STORYBOARD</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-1.5">
                <img src="/media/image1.jpeg" alt="Demonstrasi magnet dan kumparan 1" className="w-full h-28 object-cover rounded-lg" />
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-1.5">
                <img src="/media/image2.png" alt="Demonstrasi magnet dan kumparan 2" className="w-full h-28 object-cover rounded-lg" />
              </div>
              <div className="col-span-2 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-1.5">
                <img src="/media/image3.jpeg" alt="Demonstrasi LED menyala pada rangkaian kumparan" className="w-full h-32 object-cover rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Big Question Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-cyan-500/10 to-slate-900 border border-amber-500/30 text-center">
          <p className="text-lg sm:text-xl font-display font-bold text-amber-300">
            “Dari mana energi listrik tersebut berasal?”
          </p>
        </div>

        {/* 5 Guiding Questions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-white">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Pertanyaan Pemantik (Diskusikan & Catat Jawaban Awalmu):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GUIDING_QUESTIONS.map((q, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <p className="text-xs font-medium text-cyan-200">
                  {idx + 1}. {q}
                </p>
                <input
                  type="text"
                  value={state.guidingAnswers[idx] || ''}
                  onChange={(e) =>
                    updateState('guidingAnswers', { ...state.guidingAnswers, [idx]: e.target.value })
                  }
                  placeholder="Tulis dugaan singkatmu..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Initial Hypothesis Editor */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label htmlFor="hypothesis-input" className="text-sm font-display font-bold text-white">
              Tuliskan Hipotesis Awalmu (Dugaan Sementara):
            </label>
            {savedNotice && (
              <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Hipotesis tersimpan!
              </span>
            )}
          </div>
          <textarea
            id="hypothesis-input"
            rows={4}
            value={state.initialHypothesis}
            onChange={(e) => updateState('initialHypothesis', e.target.value)}
            placeholder="Tuliskan hipotesis awalmu tentang mengapa lampu LED bisa menyala saat magnet digerakkan keluar-masuk kumparan..."
            className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleLockHypothesis}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-cyan-300 transition"
            >
              Simpan Hipotesis Awal
            </button>
            <button
              type="button"
              onClick={nextScreen}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
            >
              Uji Hipotesis melalui Eksplorasi Konsep →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
