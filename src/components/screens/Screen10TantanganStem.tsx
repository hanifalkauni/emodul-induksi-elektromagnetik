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
      <div className="rounded-[32px] clay-card p-6 sm:p-8 space-y-6">
        {/* Hero Mission Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-100/30 dark:to-slate-900 border-2 border-amber-300 dark:border-amber-500/40 p-6 space-y-3">
          <div className="clay-badge inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold">
            <Rocket className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>ENGINEERING DESIGN PROCESS (EDP) • TAHAP 1</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900 dark:text-white">
            MISI: “DESAIN GENERATOR MINI”
          </h1>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-3xl">
            Saatnya menerapkan pemahaman Hukum Faraday dan Hukum Lenz untuk merancang solusi rekayasa nyata!
          </p>
        </div>

        {/* Problem & Challenge Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl clay-card bg-rose-50/50 dark:bg-slate-900 border border-rose-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-rose-700 dark:text-rose-400 uppercase">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Masalah Dunia Nyata</span>
            </div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Kebutuhan Sumber Energi Sekolah</h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Sekolah membutuhkan sumber energi sederhana untuk menyalakan LED menggunakan prinsip induksi elektromagnetik tanpa bergantung pada baterai sekali pakai.
            </p>
          </div>

          <div className="p-5 rounded-2xl clay-card bg-sky-50/50 dark:bg-slate-900 border border-sky-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-sky-700 dark:text-sky-400 uppercase">
              <Rocket className="w-4 h-4 text-sky-600" />
              <span>Tantangan Kelompok</span>
            </div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Optimasi Efektivitas Generator</h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Rancang generator mini yang mampu menghasilkan listrik paling efektif dan stabil dengan bahan yang tersedia di sekitarmu.
            </p>
          </div>
        </div>

        {/* Design Constraints Checklist */}
        <div className="p-5 rounded-2xl clay-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Batasan Desain (Engineering Constraints)</span>
            </div>
            <span className="text-xs font-mono font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200">
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
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition shadow-sm ${
                    checked
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-400 text-slate-900 dark:text-white font-bold ring-1 ring-emerald-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <span className="text-xs sm:text-sm">{c.text}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={nextScreen}
              className="clay-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md"
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

