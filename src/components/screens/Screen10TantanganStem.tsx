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
      <div className="card p-6 sm:p-8 space-y-6">
        {/* Hero Mission Banner */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 space-y-3">
          <div className="badge inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border-brand-200 text-brand-700 text-xs font-mono font-bold">
            <Rocket className="w-4 h-4 text-brand-700" />
            <span>ENGINEERING DESIGN PROCESS (EDP) • TAHAP 1</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-slate-900">
            MISI: “DESAIN GENERATOR MINI”
          </h1>
          <p className="text-sm font-medium text-slate-700 max-w-3xl">
            Saatnya menerapkan pemahaman Hukum Faraday dan Hukum Lenz untuk merancang solusi rekayasa nyata!
          </p>
        </div>

        {/* Problem & Challenge Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 card space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 uppercase">
              <AlertCircle className="w-4 h-4 text-brand-700" />
              <span>Masalah Dunia Nyata</span>
            </div>
            <h2 className="text-lg font-display font-bold text-slate-900">Kebutuhan Sumber Energi Sekolah</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Sekolah membutuhkan sumber energi sederhana untuk menyalakan LED menggunakan prinsip induksi elektromagnetik tanpa bergantung pada baterai sekali pakai.
            </p>
          </div>

          <div className="p-5 card space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-brand-700 uppercase">
              <Rocket className="w-4 h-4 text-brand-700" />
              <span>Tantangan Kelompok</span>
            </div>
            <h2 className="text-lg font-display font-bold text-slate-900">Optimasi Efektivitas Generator</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Rancang generator mini yang mampu menghasilkan listrik paling efektif dan stabil dengan bahan yang tersedia di sekitarmu.
            </p>
          </div>
        </div>

        {/* Design Constraints Checklist */}
        <div className="p-5 card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900">
              <ShieldCheck className="w-5 h-5 text-brand-700" />
              <span>Batasan Desain (Engineering Constraints)</span>
            </div>
            <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
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
                  className={`p-4 rounded-lg border text-left flex items-start gap-3 cursor-pointer transition-colors ${
                    checked
                      ? 'bg-brand-50 border-brand-400 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
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
              className="btn btn-primary px-6 py-3 text-xs sm:text-sm"
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

