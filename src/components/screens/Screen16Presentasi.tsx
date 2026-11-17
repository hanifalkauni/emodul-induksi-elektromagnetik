import React, { useState } from 'react';
import { Presentation, Wand2, Play, X, Link2 } from 'lucide-react';
import { useModul } from '../../context/ModulContext';

const PRESENTATION_SECTIONS = [
  { key: 'masalah', label: '1. Masalah' },
  { key: 'ideAwal', label: '2. Ide Awal' },
  { key: 'konsepFisika', label: '3. Konsep Fisika' },
  { key: 'desain', label: '4. Desain' },
  { key: 'prototype', label: '5. Prototype' },
  { key: 'dataPengujian', label: '6. Data Pengujian' },
  { key: 'kegagalan', label: '7. Kegagalan' },
  { key: 'perbaikan', label: '8. Perbaikan' },
  { key: 'hasilAkhir', label: '9. Hasil Akhir' },
] as const;

export const Screen16Presentasi: React.FC = () => {
  const { state, updateState } = useModul();
  const [showcaseMode, setShowcaseMode] = useState(false);

  const autoFillFromModule = () => {
    const testSummary = state.testingRows
      .map((r) => `${r.trialLabel}: ${r.voltage || '-'} (${r.turns || '-'} lilitan, LED=${r.ledLit})`)
      .join(' | ');

    updateState('presentationPoints', {
      masalah: 'Sekolah membutuhkan sumber energi listrik sederhana untuk menyalakan LED memanfaatkan prinsip induksi elektromagnetik.',
      ideAwal: state.finalSelectedIdea || state.ideas[0]?.title || 'Rancangan generator mini mekanik.',
      konsepFisika: state.designPhysicsPrinciple || 'Perubahan fluks magnetik pada kumparan menghasilkan GGL induksi sesuai Hukum Faraday (ε = -N ΔΦ/Δt) dan arah arusnya mengikuti Hukum Lenz.',
      desain: `${state.designName || 'Generator Mini'} — Bahan: ${state.designMaterials || 'Magnet, kumparan tembaga, CD bekas, LED'}`,
      prototype: `Prototipe dirakit sesuai sketsa desain (${state.designAdvantages || 'kompak dan mudah diputar'}).`,
      dataPengujian: testSummary,
      kegagalan: state.failureCauseAnalysis || state.improveWeakness || 'Celah magnet-kumparan dan kestabilan putaran awal.',
      perbaikan: state.improvePlannedChanges || 'Memperbaiki jarak magnet-kumparan dan menambah jumlah lilitan.',
      hasilAkhir: `Versi 2 menghasilkan tegangan ${state.improveV2Voltage || 'lebih stabil'} dengan status LED: ${state.improveV2LedStatus || 'Menyala'}.`,
    });
  };

  const updatePoint = (key: keyof typeof state.presentationPoints, value: string) => {
    updateState('presentationPoints', {
      ...state.presentationPoints,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] clay-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="clay-badge inline-flex items-center gap-2 px-3 py-1 bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 text-xs font-mono font-bold">
              <Presentation className="w-4 h-4 text-teal-600" />
              <span>PRESENTASI KELOMPOK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white">
              “Showcase Your Innovation”
            </h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Susun bahan presentasi kelompok mencakup 9 aspek lengkap perjalanan proyek STEM dari masalah hingga hasil akhir.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={autoFillFromModule}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-bold text-cyan-800 dark:text-cyan-300 transition shadow-xs"
            >
              <Wand2 className="w-4 h-4 text-cyan-600" />
              <span>Isi Otomatis dari Modul</span>
            </button>
            <button
              type="button"
              onClick={() => setShowcaseMode(true)}
              className="clay-btn-emerald inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md"
            >
              <Play className="w-4 h-4" />
              <span>Mode Layar Presentasi</span>
            </button>
          </div>
        </div>

        {/* 9 Presentation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESENTATION_SECTIONS.map((sec) => (
            <label key={sec.key} className="block p-4 rounded-2xl clay-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="text-xs font-display font-bold text-teal-800 dark:text-cyan-300">{sec.label}</span>
              <textarea
                rows={3}
                value={state.presentationPoints[sec.key]}
                onChange={(e) => updatePoint(sec.key, e.target.value)}
                placeholder={`Ringkas poin ${sec.label.slice(3)}...`}
                className="clay-input w-full p-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </label>
          ))}
        </div>

        <div className="p-5 rounded-2xl clay-card bg-sky-50/50 dark:bg-slate-900 border border-sky-200 dark:border-slate-800 space-y-2.5 shadow-sm">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Link2 className="w-4 h-4 text-teal-600" />
            <span>Tautan Slide Presentasi / Video Showcase (Canva / Google Slides):</span>
          </label>
          <input
            type="url"
            value={state.presentationSlideLink}
            onChange={(e) => updateState('presentationSlideLink', e.target.value)}
            placeholder="https://docs.google.com/presentation/..."
            className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Fullscreen Showcase Modal */}
      {showcaseMode && (
        <div className="fixed inset-0 z-50 bg-[#070B14]/95 backdrop-blur-md p-6 sm:p-10 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-mono font-bold text-teal-400">SHOWCASE YOUR INNOVATION</div>
                <h2 className="text-2xl font-display font-black text-white">
                  {state.designName || 'Proyek Generator Mini'} — {state.identity.groupName || 'Kelompok'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowcaseMode(false)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PRESENTATION_SECTIONS.map((sec) => (
                <div key={sec.key} className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-2 shadow-lg">
                  <div className="text-xs font-mono font-bold text-amber-300">{sec.label}</div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {state.presentationPoints[sec.key] || '(Belum diisi)'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

