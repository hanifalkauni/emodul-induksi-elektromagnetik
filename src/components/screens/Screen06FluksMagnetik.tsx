import React, { useState } from 'react';
import { Atom, Info, Sliders } from 'lucide-react';
import { useModul } from '../../context/ModulContext';

type VarKey = 'B' | 'A' | 'theta';

const VAR_DETAILS: Record<VarKey, { symbol: string; title: string; unit: string; desc: string }> = {
  B: {
    symbol: 'B',
    title: 'Kuat Medan Magnet',
    unit: 'Tesla (T)',
    desc: 'Menggambarkan kerapatan garis-garis gaya medan magnet yang keluar dari kutub magnet. Semakin kuat magnet, semakin rapat garis medan.',
  },
  A: {
    symbol: 'A',
    title: 'Luas Bidang Kumparan',
    unit: 'm²',
    desc: 'Luas penampang bidang kumparan yang ditembus oleh garis-garis medan magnet. Semakin luas bidang, semakin banyak fluks yang tertangkap.',
  },
  theta: {
    symbol: 'θ',
    title: 'Sudut antara Medan Magnet & Garis Normal Bidang',
    unit: 'Derajat (°)',
    desc: 'Jika θ = 0° (bidang tegak lurus garis medan), fluks bernilai maksimum. Jika θ = 90° (medan sejajar bidang), fluks bernilai nol.',
  },
};

export const Screen06FluksMagnetik: React.FC = () => {
  const { state, updateState } = useModul();
  const [selectedVar, setSelectedVar] = useState<VarKey>('B');

  const rad = (state.fluxTheta * Math.PI) / 180;
  const fluxValue = state.fluxB * state.fluxA * Math.cos(rad);
  const absFlux = Math.abs(fluxValue);

  // Number of field lines rendered based on B (4 to 12 lines)
  const lineCount = Math.max(3, Math.round(state.fluxB * 6));
  // Loop size based on A (40 to 110 px half-height)
  const loopHeight = 40 + state.fluxA * 140;

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] clay-card p-6 sm:p-8 space-y-6">
        {/* Header & Concept */}
        <div className="space-y-2">
          <div className="clay-badge inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-100 text-cyan-800 text-xs font-bold font-mono">
            <Atom className="w-4 h-4 text-cyan-600" />
            <span>EKSPLORASI KONSEP • BAGIAN A</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
            A. Fluks Magnetik
          </h1>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
            Fluks magnetik adalah ukuran banyaknya garis medan magnet yang menembus suatu bidang kumparan. Besarnya fluks dipengaruhi oleh{' '}
            <strong className="text-cyan-700 dark:text-cyan-400 font-bold">kuat medan magnet (B)</strong>,{' '}
            <strong className="text-amber-800 dark:text-amber-400 font-bold">luas bidang (A)</strong>, dan{' '}
            <strong className="text-emerald-700 dark:text-emerald-400 font-bold">sudut kemiringan normal bidang (θ)</strong>.
          </p>
        </div>

        {/* Equation & Interactive Variable Pills */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">PERSAMAAN MATEMATIS FLUKS</div>
            <div className="py-4 px-5 rounded-2xl bg-cyan-50 dark:bg-slate-900 border-2 border-cyan-300 dark:border-cyan-500/30 text-center font-mono text-2xl sm:text-3xl font-extrabold text-cyan-800 dark:text-cyan-300 shadow-sm">
              Φ = B · A · cos θ
            </div>

            <div className="space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <div>• <span className="font-mono text-cyan-700 dark:text-cyan-300 font-bold">Φ</span> = fluks magnetik (weber / Wb)</div>
              <div>• <span className="font-mono text-cyan-700 dark:text-cyan-300 font-bold">B</span> = kuat medan magnet (tesla / T)</div>
              <div>• <span className="font-mono text-amber-800 dark:text-amber-300 font-bold">A</span> = luas bidang penampang (m²)</div>
              <div>• <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">θ</span> = sudut antara medan magnet & garis normal bidang</div>
            </div>

            {/* Clickable 3 Variables */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Klik variabel untuk melihat penjelasan:</div>
              <div className="grid grid-cols-3 gap-2">
                {(['B', 'A', 'theta'] as VarKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedVar(key)}
                    className={`py-2 px-3 rounded-xl font-mono text-sm font-bold border transition ${
                      selectedVar === key
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {VAR_DETAILS[key].symbol}
                  </button>
                ))}
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs space-y-1 shadow-sm">
                <div className="flex items-center gap-1.5 font-bold text-cyan-700 dark:text-cyan-300">
                  <Info className="w-4 h-4 text-cyan-600" />
                  <span>
                    {VAR_DETAILS[selectedVar].symbol} → {VAR_DETAILS[selectedVar].title} ({VAR_DETAILS[selectedVar].unit})
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{VAR_DETAILS[selectedVar].desc}</p>
              </div>
            </div>

            {/* Original Storyboard Visual Reference */}
            <div className="pt-2">
              <div className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                VISUALISASI STORYBOARD (MAGNET → MEDAN MAGNET → KUMPARAN)
              </div>
              <img
                src="/media/image4.png"
                alt="Visualisasi Fluks Magnetik dari Magnet ke Kumparan"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white object-contain max-h-40 shadow-sm"
              />
            </div>
          </div>

          {/* Interactive Real-time Flux Simulator */}
          <div className="lg:col-span-7 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                <Sliders className="w-4 h-4" />
                <span>SIMULATOR INTERAKTIF FLUKS MAGNETIK</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-cyan-300 dark:border-cyan-500/40 font-mono text-sm font-extrabold text-cyan-700 dark:text-cyan-300 shadow-sm">
                Φ = {fluxValue.toFixed(4)} Wb
              </div>
            </div>

            {/* SVG Dynamic Field + Rotatable Area Loop */}
            <svg viewBox="0 0 460 220" className="w-full h-auto rounded-2xl bg-[#0A0F1D] border-2 border-slate-700/60 shadow-md">
              {/* Magnet Source on Left */}
              <rect x="20" y="65" width="44" height="90" rx="6" fill="#EF4444" stroke="#FCA5A5" strokeWidth="1.5" />
              <text x="42" y="116" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
                U
              </text>

              {/* Magnetic Field Lines B */}
              {Array.from({ length: lineCount }).map((_, idx) => {
                const y = 40 + (idx * 140) / Math.max(1, lineCount - 1);
                return (
                  <g key={idx}>
                    <line
                      x1="68"
                      y1={y}
                      x2="420"
                      y2={y}
                      stroke="#06B6D4"
                      strokeOpacity={0.35 + (state.fluxB / 2) * 0.55}
                      strokeWidth="1.6"
                      strokeDasharray="6 4"
                    />
                    <polygon points={`420,${y} 412,${y - 3.5} 412,${y + 3.5}`} fill="#06B6D4" />
                  </g>
                );
              })}

              {/* Rotated Coil Loop & Normal Vector */}
              <g transform={`translate(275, 110) rotate(${state.fluxTheta})`}>
                {/* Loop Cross Section */}
                <ellipse
                  cx="0"
                  cy="0"
                  rx="18"
                  ry={loopHeight / 2}
                  fill="#F59E0B"
                  fillOpacity="0.16"
                  stroke="#F59E0B"
                  strokeWidth="3.5"
                />
                {/* Normal Vector n */}
                <line x1="0" y1="0" x2="72" y2="0" stroke="#10B981" strokeWidth="2.5" />
                <polygon points="78,0 68,-5 68,5" fill="#10B981" />
                <text x="82" y="4" fill="#10B981" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
                  n
                </text>
              </g>

              {/* Reference horizontal vector for angle theta */}
              <line x1="275" y1="110" x2="355" y2="110" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="3 3" />
              <text x="20" y="205" fill="#94A3B8" fontSize="11" fontFamily="JetBrains Mono">
                B = {state.fluxB.toFixed(1)} T | A = {state.fluxA.toFixed(2)} m² | θ = {state.fluxTheta}°
              </text>
            </svg>

            {/* 3 Sliders */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-cyan-300">B (Kuat Medan Magnet)</span>
                  <span className="font-mono text-white">{state.fluxB.toFixed(1)} T</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  value={state.fluxB}
                  onChange={(e) => updateState('fluxB', Number(e.target.value))}
                  className="w-full lab-slider"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-amber-300">A (Luas Bidang Kumparan)</span>
                  <span className="font-mono text-white">{state.fluxA.toFixed(2)} m²</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.05}
                  value={state.fluxA}
                  onChange={(e) => updateState('fluxA', Number(e.target.value))}
                  className="w-full lab-slider slider-amber"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-emerald-300">θ (Sudut terhadap Garis Normal)</span>
                  <span className="font-mono text-white">{state.fluxTheta}° (cos θ = {Math.cos(rad).toFixed(2)})</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  step={5}
                  value={state.fluxTheta}
                  onChange={(e) => updateState('fluxTheta', Number(e.target.value))}
                  className="w-full lab-slider slider-emerald"
                />
              </div>
            </div>

            {/* Live Interpretation Pill */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-3">
              <span>
                Status Fluks:{' '}
                <strong className="text-cyan-300">
                  {absFlux < 0.01
                    ? 'Nol (Bidang sejajar garis medan)'
                    : state.fluxTheta === 0 || state.fluxTheta === 180
                    ? 'Maksimum (Menembus tegak lurus)'
                    : 'Parsial (Membentuk sudut θ)'}
                </strong>
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                |Φ| = {absFlux.toFixed(4)} Wb
              </span>
            </div>
          </div>
        </div>

        {/* Reflection Input */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <label htmlFor="flux-def" className="block text-sm font-display font-bold text-white">
            Berdasarkan visualisasi di atas, tuliskan pengertian fluks magnetik dengan bahasamu sendiri:
          </label>
          <textarea
            id="flux-def"
            rows={3}
            value={state.fluxDefinitionAnswer}
            onChange={(e) => updateState('fluxDefinitionAnswer', e.target.value)}
            placeholder="Menurut pengamatan simulasi di atas, fluks magnetik adalah..."
            className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>
    </div>
  );
};

