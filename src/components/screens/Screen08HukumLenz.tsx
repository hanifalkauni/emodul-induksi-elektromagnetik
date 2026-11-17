import React from 'react';
import { Compass, ArrowLeft, ArrowRight, RotateCw, RotateCcw } from 'lucide-react';
import { useModul } from '../../context/ModulContext';

export const Screen08HukumLenz: React.FC = () => {
  const { state, updateState } = useModul();

  // Determine induced pole facing magnet based on Lenz's Law:
  // If magnet approaches -> coil creates SAME pole to oppose approach (repel)
  // If magnet recedes -> coil creates OPPOSITE pole to oppose receding (attract)
  const facingInducedPole: 'N' | 'S' =
    state.lenzMotion === 'approach'
      ? state.lenzPole
      : state.lenzPole === 'N'
      ? 'S'
      : 'N';

  // Right-hand grip rule: if facing pole is North (U), current seen from magnet side is Counter-Clockwise (Berlawanan Jarum Jam)
  const isCCW = facingInducedPole === 'N';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Eksplorasi Konsep • Hukum Lenz</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Hukum Lenz
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            Menurut Lenz, <strong className="text-emerald-300">arah arus induksi selalu sedemikian rupa sehingga medan magnet yang dihasilkan menentang perubahan fluks magnetik yang menyebabkannya.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Controls & Reference Image */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4">
              <div className="text-xs font-mono text-cyan-400">ATUR SKENARIO KUTUB & GERAK MAGNET</div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-300">1. Pilih Kutub Magnet Menghadap Kumparan:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateState('lenzPole', 'N')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                      state.lenzPole === 'N'
                        ? 'bg-red-500/20 border-red-400 text-red-200'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    Kutub Utara (U / N)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateState('lenzPole', 'S')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                      state.lenzPole === 'S'
                        ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    Kutub Selatan (S)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-300">2. Pilih Arah Gerak Magnet:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateState('lenzMotion', 'approach')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      state.lenzMotion === 'approach'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span>Didekatkan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateState('lenzMotion', 'recede')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      state.lenzMotion === 'recede'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Dijauhkan</span>
                  </button>
                </div>
              </div>

              {/* Reasoning Summary */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
                <div className="font-semibold text-emerald-300">Hasil Analisis Hukum Lenz:</div>
                <p className="text-slate-300 leading-relaxed">
                  Magnet kutub <strong>{state.lenzPole === 'N' ? 'Utara (U)' : 'Selatan (S)'}</strong> sedang{' '}
                  <strong>{state.lenzMotion === 'approach' ? 'didekatkan (fluks bertambah)' : 'dijauhkan (fluks berkurang)'}</strong>.
                  Untuk menentangnya, sisi kumparan membentuk kutub{' '}
                  <strong className={facingInducedPole === 'N' ? 'text-red-300' : 'text-blue-300'}>
                    {facingInducedPole === 'N' ? 'Utara (U)' : 'Selatan (S)'}
                  </strong>{' '}
                  sehingga arus induksi mengalir{' '}
                  <strong className="text-emerald-300">
                    {isCCW ? 'Berlawanan Arah Jarum Jam (CCW)' : 'Searah Jarum Jam (CW)'}
                  </strong>{' '}
                  bila dilihat dari sisi magnet.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="text-[11px] font-mono text-slate-400">DIAGRAM REFERENSI STORYBOARD</div>
              <img
                src="/media/image5.png"
                alt="Diagram Arah Arus Induksi Hukum Lenz"
                className="w-full rounded-xl bg-white/95 object-contain max-h-44"
              />
            </div>
          </div>

          {/* Interactive SVG Animation */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-950 border border-slate-800 p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400">SIMULASI VEKTOR HUKUM LENZ</span>
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                {isCCW ? <RotateCcw className="w-3.5 h-3.5 text-emerald-400" /> : <RotateCw className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isCCW ? 'Arus Berlawanan Jarum Jam' : 'Arus Searah Jarum Jam'}</span>
              </span>
            </div>

            <svg viewBox="0 0 460 240" className="w-full h-auto rounded-xl bg-[#070B14] border border-slate-800">
              {/* Coil Back Shell & Back Windings */}
              <g transform="translate(245, 117)">
                <rect x="-12" y="-56" width="135" height="112" rx="14" fill="#1E293B" fillOpacity="0.45" stroke="#334155" />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <path
                    key={`back-${i}`}
                    d={`M ${i * 20} -42 A 8 42 0 0 0 ${i * 20} 42`}
                    fill="none"
                    stroke="#92400E"
                    strokeWidth="3.5"
                  />
                ))}
              </g>

              {/* Bar Magnet (Slides into coil mouth when approaching) */}
              <g transform={`translate(${state.lenzMotion === 'approach' ? 110 : 15}, 0)`}>
                <rect
                  x="30"
                  y="98"
                  width="55"
                  height="38"
                  rx="4"
                  fill={state.lenzPole === 'N' ? '#3B82F6' : '#EF4444'}
                />
                <rect
                  x="85"
                  y="98"
                  width="55"
                  height="38"
                  rx="4"
                  fill={state.lenzPole === 'N' ? '#EF4444' : '#3B82F6'}
                />
                <text x="57" y="123" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="bold" fontFamily="JetBrains Mono">
                  {state.lenzPole === 'N' ? 'S' : 'U'}
                </text>
                <text x="112" y="123" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="bold" fontFamily="JetBrains Mono">
                  {state.lenzPole === 'N' ? 'U' : 'S'}
                </text>

                {/* Velocity Arrow */}
                {state.lenzMotion === 'approach' ? (
                  <g>
                    <line x1="65" y1="75" x2="125" y2="75" stroke="#10B981" strokeWidth="3" />
                    <polygon points="133,75 122,69 122,81" fill="#10B981" />
                    <text x="95" y="64" textAnchor="middle" fill="#10B981" fontSize="10" fontFamily="JetBrains Mono">v (Mendekat)</text>
                  </g>
                ) : (
                  <g>
                    <line x1="125" y1="75" x2="65" y2="75" stroke="#F59E0B" strokeWidth="3" />
                    <polygon points="57,75 68,69 68,81" fill="#F59E0B" />
                    <text x="95" y="64" textAnchor="middle" fill="#F59E0B" fontSize="10" fontFamily="JetBrains Mono">v (Menjauh)</text>
                  </g>
                )}
              </g>

              {/* Front Windings & Induced Magnet Pole Badge on Coil */}
              <g transform="translate(245, 117)">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <path
                    key={`front-${i}`}
                    d={`M ${i * 20} -42 A 8 42 0 0 1 ${i * 20} 42`}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                  />
                ))}

                {/* Current direction arrows directly on FRONT windings (tepat pada kawat bagian depan yang dilingkari merah) */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const cx = i * 20 + 8; // Titik puncak kawat depan
                  return (
                    <g key={`arrow-front-${i}`}>
                      <circle cx={cx} cy={0} r="10" fill="#10B981" fillOpacity="0.3" />
                      <polygon
                        points={
                          isCCW
                            ? `${cx},-11 ${cx - 7},6 ${cx + 7},6` // Panah menunjuk ke ATAS
                            : `${cx},11 ${cx - 7},-6 ${cx + 7},-6` // Panah menunjuk ke BAWAH
                        }
                        fill="#10B981"
                        stroke="#064E3B"
                        strokeWidth="1.8"
                      />
                    </g>
                  );
                })}

                {/* Label penjelas panah arus di kawat depan */}
                <text x="50" y="58" textAnchor="middle" fill="#10B981" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">
                  ▲ Panah Arus (I) pada Kawat Depan ({isCCW ? 'Ke Atas / CCW' : 'Ke Bawah / CW'})
                </text>

                {/* Induced Pole Labels (placed neatly on coil shoulder so magnet slides cleanly inside) */}
                <circle cx="-16" cy="-48" r="13" fill={facingInducedPole === 'N' ? '#EF4444' : '#3B82F6'} stroke="#0B1120" strokeWidth="2" />
                <text x="-16" y="-43" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono">
                  {facingInducedPole === 'N' ? 'U' : 'S'}
                </text>

                <circle cx="118" cy="-48" r="13" fill={facingInducedPole === 'N' ? '#3B82F6' : '#EF4444'} stroke="#0B1120" strokeWidth="2" />
                <text x="118" y="-43" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono">
                  {facingInducedPole === 'N' ? 'S' : 'U'}
                </text>

                {/* Opposing Force / Induced B arrow */}
                <line x1="25" y1="-72" x2="-35" y2="-72" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="4 3" />
                <polygon points="-43,-72 -33,-77 -33,-67" fill="#06B6D4" />
                <text x="15" y="-82" textAnchor="middle" fill="#06B6D4" fontSize="10" fontFamily="JetBrains Mono">
                  B induksi (menentang ΔΦ)
                </text>
              </g>

              <text x="230" y="222" textAnchor="middle" fill="#94A3B8" fontSize="11">
                {state.lenzMotion === 'approach'
                  ? 'Kumparan menolak magnet yang mendekat (Kutub Sejenis)'
                  : 'Kumparan menarik magnet yang menjauh (Kutub Berlawanan)'}
              </text>
            </svg>
          </div>
        </div>

        {/* Question */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <label htmlFor="lenz-question" className="block text-sm font-display font-bold text-white">
            Pertanyaan: Ketika kutub magnet didekatkan atau dijauhkan terhadap kumparan, bagaimana arah arus induksi?
          </label>
          <textarea
            id="lenz-question"
            rows={3}
            value={state.lenzAnswer}
            onChange={(e) => updateState('lenzAnswer', e.target.value)}
            placeholder="Jelaskan perubahan arah arus induksi saat kutub magnet didekatkan vs dijauhkan..."
            className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>
    </div>
  );
};

