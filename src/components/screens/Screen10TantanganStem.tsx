import React from 'react';
import { Rocket, ShieldCheck, AlertCircle, CheckSquare, Square, ArrowRight } from 'lucide-react';
import { useModul } from '../../context/ModulContext';

const CONSTRAINTS = [
  { id: 'magnet', text: 'Menggunakan magnet sebagai sumber medan magnetik' },
  { id: 'kumparan', text: 'Menggunakan kumparan kawat penghantar' },
  { id: 'tegangan', text: 'Menghasilkan tegangan listrik terukur untuk menyalakan LED' },
  { id: 'bahan', text: 'Menggunakan bahan yang tersedia secara kreatif & efisien' },
  { id: 'aman', text: 'Aman digunakan selama perakitan dan pengujian' },
];

export const Screen10TantanganStem: React.FC = () => {
  const { state, updateState, nextScreen } = useModul();

  const toggleConstraint = (id: string) => {
    const exists = state.checkedConstraints.includes(id);
    updateState(
      'checkedConstraints',
      exists ? state.checkedConstraints.filter((c) => c !== id) : [...state.checkedConstraints, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        {/* Hero Mission Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-slate-950 border border-amber-500/40 p-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
            <Rocket className="w-4 h-4" />
            <span>ENGINEERING DESIGN PROCESS (EDP) • TAHAP 1</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-white">
            MISI: “DESAIN GENERATOR MINI”
          </h1>
          <p className="text-sm text-slate-200 max-w-3xl">
            Saatnya menerapkan pemahaman Hukum Faraday dan Hukum Lenz untuk merancang solusi rekayasa nyata!
          </p>
        </div>

        {/* Problem & Challenge Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-rose-400 uppercase">
              <AlertCircle className="w-4 h-4" />
              <span>Masalah Dunia Nyata</span>
            </div>
            <h2 className="text-lg font-display font-bold text-white">Kebutuhan Sumber Energi Sekolah</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Sekolah membutuhkan sumber energi sederhana untuk menyalakan LED menggunakan prinsip induksi elektromagnetik tanpa bergantung pada baterai sekali pakai.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase">
              <Rocket className="w-4 h-4" />
              <span>Tantangan Kelompok</span>
            </div>
            <h2 className="text-lg font-display font-bold text-white">Optimasi Efektivitas Generator</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Rancang generator mini yang mampu menghasilkan listrik paling efektif dan stabil dengan bahan yang tersedia di sekitarmu.
            </p>
          </div>
        </div>

        {/* Design Constraints Checklist */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-display font-bold text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Batasan Desain (Engineering Constraints)</span>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              {state.checkedConstraints.length} / {CONSTRAINTS.length} dipahami
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONSTRAINTS.map((c) => {
              const checked = state.checkedConstraints.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleConstraint(c.id)}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition ${
                    checked
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-xs sm:text-sm">{c.text}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={nextScreen}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition"
            >
              <span>Lanjut ke Papan Brainstorming Ide</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

