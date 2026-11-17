import React from 'react';
import { Target, CheckSquare, Square, Award } from 'lucide-react';
import { useModul } from '../../context/ModulContext';

const LEARNING_OBJECTIVES = [
  'Menjelaskan konsep fluks magnetik.',
  'Menganalisis faktor yang memengaruhi GGL induksi.',
  'Menjelaskan Hukum Faraday.',
  'Menentukan arah arus induksi berdasarkan Hukum Lenz.',
  'Menganalisis penerapan induksi elektromagnetik.',
  'Melakukan eksperimen induksi elektromagnetik.',
  'Mengembangkan solusi berbasis STEM.',
  'Menghasilkan produk sederhana yang memanfaatkan prinsip induksi elektromagnetik.',
  'Mengomunikasikan hasil kerja kelompok.',
  'Menunjukkan kreativitas dan kolaborasi dalam menyelesaikan masalah.',
];

export const Screen04Tujuan: React.FC = () => {
  const { state, updateState } = useModul();

  const toggleObjective = (index: number) => {
    const exists = state.checkedObjectives.includes(index);
    const updated = exists
      ? state.checkedObjectives.filter((i) => i !== index)
      : [...state.checkedObjectives, index];
    updateState('checkedObjectives', updated);
  };

  const progress = Math.round((state.checkedObjectives.length / LEARNING_OBJECTIVES.length) * 100);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] clay-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="clay-badge inline-flex items-center gap-2 px-3 py-1 bg-cyan-100 text-cyan-800 text-xs font-bold font-mono">
              <Target className="w-4 h-4 text-cyan-600" />
              <span>CAPAIAN KOMPETENSI BELAJAR</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              Tujuan Pembelajaran
            </h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 max-w-2xl">
              Setelah mempelajari e-modul ini, siswa diharapkan mampu menguasai 10 kompetensi berikut. Centang tujuan yang telah berhasil kamu pahami.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-950 border border-amber-300 dark:border-slate-800 flex items-center gap-3 shrink-0 shadow-sm">
            <Award className="w-8 h-8 text-amber-500" />
            <div>
              <div className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Pencapaian Mandiri</div>
              <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {state.checkedObjectives.length} / {LEARNING_OBJECTIVES.length} ({progress}%)
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEARNING_OBJECTIVES.map((obj, index) => {
            const checked = state.checkedObjectives.includes(index);
            return (
              <button
                key={index}
                type="button"
                onClick={() => toggleObjective(index)}
                className={`p-5 rounded-2xl border text-left flex items-start gap-3.5 transition-all shadow-sm ${
                  checked
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-400 text-slate-900 dark:text-white font-bold ring-1 ring-emerald-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-400 text-slate-700 dark:text-slate-200'
                }`}
              >
                {checked ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-extrabold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                    TUJUAN #{index + 1}
                  </span>
                  <p className="text-sm font-medium leading-relaxed">{obj}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

