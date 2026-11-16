import React, { useEffect, useState } from 'react';
import { Gauge, Zap, Sliders } from 'lucide-react';
import { useModul } from '../../context/ModulContext';

export const Screen07HukumFaraday: React.FC = () => {
  const { state, updateState } = useModul();
  const [phase, setPhase] = useState(0);

  // Speed slider controls oscillation frequency
  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((p) => (p + 0.025 * state.faradaySpeed) % (Math.PI * 2));
    }, 30);
    return () => clearInterval(timer);
  }, [state.faradaySpeed]);

  // Physics model: Peak EMF proportional to N * (ΔΦ/Δt) * B
  const peakEmf = (state.faradayTurns / 100) * (state.faradaySpeed * 0.25) * state.faradayB;
  // Magnet moves from x=0 to x=128 so magnet enters deeply into the hollow coil!
  const magnetDisplacement = 64 + Math.sin(phase) * 64;
  // Magnet right edge is 156 + magnetDisplacement; coil starts at x=200 -> active only while magnet is inside coil
  const isInsideCoil = 156 + magnetDisplacement >= 200;
  const instantEmf = isInsideCoil ? peakEmf * Math.cos(phase) : 0;
  const absInstant = Math.abs(instantEmf);
  const ledIntensity = isInsideCoil ? Math.min(1, peakEmf / 12) : 0;

  // Voltmeter needle angle (-60 to +60 deg)
  const needleAngle = Math.max(-65, Math.min(65, (instantEmf / 12) * 65));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Eksplorasi Konsep • Hukum Faraday</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Hukum Faraday
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            Hukum Faraday menjelaskan bahwa perubahan fluks magnetik yang menembus kumparan dapat menghasilkan{' '}
            <strong className="text-amber-300">Gaya Gerak Listrik (GGL) induksi</strong>. Semakin cepat perubahan fluks magnetik, semakin besar GGL induksi yang dihasilkan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Equation & Controls ("Coba ubah!") */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-5">
            <div>
              <div className="text-xs font-mono text-slate-400 mb-2">PERSAMAAN HUKUM FARADAY</div>
              <div className="py-4 px-4 rounded-xl bg-slate-900 border border-amber-500/30 text-center font-mono text-2xl font-bold text-amber-300">
                ε = -N · (ΔΦ / Δt)
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
                <Sliders className="w-4 h-4" />
                <span>Fitur “Coba Ubah!”</span>
              </div>

              {/* N Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-300 font-medium">Jumlah lilitan (N)</span>
                  <span className="font-mono text-white">{state.faradayTurns} lilitan</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={1000}
                  step={50}
                  value={state.faradayTurns}
                  onChange={(e) => updateState('faradayTurns', Number(e.target.value))}
                  className="w-full lab-slider slider-amber"
                />
              </div>

              {/* Speed ΔΦ/Δt Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-cyan-300 font-medium">Kecepatan magnet (ΔΦ/Δt)</span>
                  <span className="font-mono text-white">Level {state.faradaySpeed} / 10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={state.faradaySpeed}
                  onChange={(e) => updateState('faradaySpeed', Number(e.target.value))}
                  className="w-full lab-slider"
                />
              </div>

              {/* B Strength Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-300 font-medium">Kekuatan magnet (B)</span>
                  <span className="font-mono text-white">{state.faradayB.toFixed(1)} T</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={2.0}
                  step={0.2}
                  value={state.faradayB}
                  onChange={(e) => updateState('faradayB', Number(e.target.value))}
                  className="w-full lab-slider slider-emerald"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-white">Kesimpulan Sistem Real-Time:</div>
              <p>
                Puncak GGL Induksi terukur:{' '}
                <span className="font-mono font-bold text-amber-300">{peakEmf.toFixed(2)} Volt</span>.{' '}
                {peakEmf >= 8
                  ? 'GGL induksi SANGAT BESAR (LED menyala sangat terang)!'
                  : peakEmf >= 3.5
                  ? 'GGL induksi SEDANG (LED menyala cukup terang).'
                  : 'GGL induksi RENDAH (LED redup — coba tambah N, kecepatan, atau B!).'}
              </p>
            </div>
          </div>

          {/* Live Voltmeter + Magnet-Coil Animation */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2 text-xs font-mono text-amber-300">
                <Gauge className="w-4 h-4" />
                <span>GALVANOMETER & SIMULASI GGL INDUKSI</span>
              </span>
              <span className="font-mono text-sm font-bold text-cyan-300 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                ε(t) = {instantEmf >= 0 ? '+' : ''}{instantEmf.toFixed(2)} V
              </span>
            </div>

            <svg viewBox="0 0 480 250" className="w-full h-auto rounded-xl bg-[#070B14] border border-slate-800">
              {/* Hollow Coil Bobbin & Back Windings */}
              <rect x="200" y="110" width="110" height="76" rx="10" fill="#0F172A" fillOpacity="0.8" stroke="#334155" strokeWidth="1.2" />
              {Array.from({ length: Math.min(12, Math.max(3, Math.round(state.faradayTurns / 90))) }).map((_, i, arr) => {
                const cx = 210 + (i * 90) / Math.max(1, arr.length - 1);
                return (
                  <path
                    key={`back-${i}`}
                    d={`M ${cx} 110 A 7 38 0 0 0 ${cx} 186`}
                    fill="none"
                    stroke="#92400E"
                    strokeWidth="3"
                  />
                );
              })}

              {/* Moving Magnet (Slides INSIDE the coil!) */}
              <g transform={`translate(${magnetDisplacement}, 0)`}>
                <rect x="52" y="131" width="52" height="34" rx="4" fill="#3B82F6" stroke="#93C5FD" strokeWidth="1" />
                <rect x="104" y="131" width="52" height="34" rx="4" fill="#EF4444" stroke="#FCA5A5" strokeWidth="1" />
                <text x="78" y="153" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold" fontFamily="JetBrains Mono">S</text>
                <text x="130" y="153" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold" fontFamily="JetBrains Mono">U</text>
              </g>

              {/* Front Half of Variable Coil Windings */}
              <g>
                {Array.from({ length: Math.min(12, Math.max(3, Math.round(state.faradayTurns / 90))) }).map((_, i, arr) => {
                  const cx = 210 + (i * 90) / Math.max(1, arr.length - 1);
                  return (
                    <path
                      key={`front-${i}`}
                      d={`M ${cx} 110 A 7 38 0 0 1 ${cx} 186`}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  );
                })}
                <text x="255" y="205" textAnchor="middle" fill="#FDE68A" fontSize="11" fontFamily="JetBrains Mono">
                  N = {state.faradayTurns} Lilitan
                </text>
              </g>

              {/* Analog Galvanometer / Voltmeter */}
              <g transform="translate(365, 65)">
                <rect x="-65" y="-48" width="130" height="86" rx="10" fill="#0F172A" stroke="#334155" strokeWidth="2" />
                <path d="M -48 16 A 48 48 0 0 1 48 16" fill="none" stroke="#475569" strokeWidth="2" />
                <text x="-45" y="28" fill="#EF4444" fontSize="9" fontFamily="JetBrains Mono">-</text>
                <text x="0" y="-26" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono">0V</text>
                <text x="42" y="28" fill="#10B981" fontSize="9" fontFamily="JetBrains Mono">+</text>
                <g transform={`translate(0, 18) rotate(${needleAngle})`}>
                  <line x1="0" y1="0" x2="0" y2="-45" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
                </g>
                <circle cx="0" cy="18" r="4" fill="#F8FAFC" />
              </g>

              {/* LED Indicator */}
              <g transform="translate(365, 165)">
                <circle cx="0" cy="0" r={22 + ledIntensity * 22} fill="#FBBF24" fillOpacity={(absInstant / Math.max(1, peakEmf)) * ledIntensity * 0.65} />
                <circle cx="0" cy="0" r="14" fill="#F59E0B" fillOpacity={0.25 + ledIntensity * 0.75} stroke="#FDE68A" strokeWidth="2" />
                <text x="0" y="34" textAnchor="middle" fill="#FDE68A" fontSize="10" fontFamily="JetBrains Mono">
                  LED ({Math.round(ledIntensity * 100)}%)
                </text>
              </g>

              {/* Wires */}
              <path d="M 210 186 L 210 228 L 350 228 L 350 180" fill="none" stroke="#64748B" strokeWidth="2" />
              <path d="M 300 186 L 300 218 L 380 218 L 380 180" fill="none" stroke="#64748B" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Analytical Question */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <label htmlFor="faraday-question" className="block text-sm font-display font-bold text-white">
            Pertanyaan: Faktor apa yang paling berpengaruh terhadap besar GGL induksi? Berikan alasan berdasarkan hasil eksperimen virtual di atas!
          </label>
          <textarea
            id="faraday-question"
            rows={3}
            value={state.faradayFactorAnswer}
            onChange={(e) => updateState('faradayFactorAnswer', e.target.value)}
            placeholder="Tuliskan analisis hubungan antara N, ΔΦ/Δt, dan B terhadap GGL induksi..."
            className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>
    </div>
  );
};

