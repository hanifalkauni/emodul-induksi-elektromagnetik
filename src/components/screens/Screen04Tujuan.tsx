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
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Capaian Kompetensi Pembelajaran</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
              Tujuan Pembelajaran
            </h1>
            <p className="text-sm text-slate-300">
              Setelah pembelajaran menggunakan e-modul ini, siswa diharapkan mampu menguasai 10 kompetensi berikut. Centang kompetensi yang sudah kamu pahami atau kuasai.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 shrink-0">
            <Award className="w-7 h-7 text-amber-400" />
            <div>
              <div className="text-[11px] font-mono text-slate-400">Pencapaian Mandiri</div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                {state.checkedObjectives.length} / {LEARNING_OBJECTIVES.length} ({progress}%)
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LEARNING_OBJECTIVES.map((obj, index) => {
            const checked = state.checkedObjectives.includes(index);
            return (
              <button
                key={index}
                type="button"
                onClick={() => toggleObjective(index)}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition ${
                  checked
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 text-slate-200'
                }`}
              >
                {checked ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono text-cyan-400">
                    TUJUAN #{index + 1}
                  </span>
                  <p className="text-sm leading-relaxed">{obj}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

