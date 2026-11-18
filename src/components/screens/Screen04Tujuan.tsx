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
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <div className="badge inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border-brand-200 text-brand-700 text-xs font-bold font-mono">
              <Target className="w-4 h-4 text-brand-700" />
              <span>CAPAIAN KOMPETENSI BELAJAR</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-slate-900">
              Tujuan Pembelajaran
            </h1>
            <p className="text-sm font-medium text-slate-600 max-w-2xl">
              Setelah mempelajari e-modul ini, siswa diharapkan mampu menguasai 10 kompetensi berikut. Centang tujuan yang telah berhasil kamu pahami.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 shrink-0">
            <Award className="w-8 h-8 text-brand-700" />
            <div>
              <div className="text-[11px] font-mono font-bold text-slate-600">Pencapaian Mandiri</div>
              <div className="text-xl font-mono font-bold text-brand-700">
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
                className={`p-5 rounded-xl border text-left flex items-start gap-3.5 transition-colors cursor-pointer ${
                  checked
                    ? 'bg-brand-50 border-brand-400 text-slate-900'
                    : 'bg-white border-slate-200 hover:border-brand-300 text-slate-700'
                }`}
              >
                {checked ? (
                  <CheckSquare className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold text-brand-700 uppercase tracking-wider">
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

