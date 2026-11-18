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
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <div className="badge inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border-brand-200 text-brand-700 text-xs font-mono font-bold">
              <Presentation className="w-4 h-4 text-brand-600" />
              <span>PRESENTASI KELOMPOK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
              “Showcase Your Innovation”
            </h1>
            <p className="text-sm font-medium text-slate-600">
              Susun bahan presentasi kelompok mencakup 9 aspek lengkap perjalanan proyek STEM dari masalah hingga hasil akhir.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={autoFillFromModule}
              className="btn btn-secondary px-4 py-2.5 text-xs"
            >
              <Wand2 className="w-4 h-4 text-brand-600" />
              <span>Isi Otomatis dari Modul</span>
            </button>
            <button
              type="button"
              onClick={() => setShowcaseMode(true)}
              className="btn btn-primary px-5 py-2.5 text-xs"
            >
              <Play className="w-4 h-4" />
              <span>Mode Layar Presentasi</span>
            </button>
          </div>
        </div>

        {/* 9 Presentation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESENTATION_SECTIONS.map((sec) => (
            <label key={sec.key} className="block p-4 card space-y-2">
              <span className="text-xs font-display font-bold text-brand-700">{sec.label}</span>
              <textarea
                rows={3}
                value={state.presentationPoints[sec.key]}
                onChange={(e) => updatePoint(sec.key, e.target.value)}
                placeholder={`Ringkas poin ${sec.label.slice(3)}...`}
                className="input w-full p-2.5 text-xs"
              />
            </label>
          ))}
        </div>

        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Link2 className="w-4 h-4 text-brand-600" />
            <span>Tautan Slide Presentasi / Video Showcase (Canva / Google Slides):</span>
          </label>
          <input
            type="url"
            value={state.presentationSlideLink}
            onChange={(e) => updateState('presentationSlideLink', e.target.value)}
            placeholder="https://docs.google.com/presentation/..."
            className="input w-full px-3.5 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Fullscreen Showcase Modal */}
      {showcaseMode && (
        <div className="fixed inset-0 z-50 bg-white p-6 sm:p-10 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Mode layar presentasi">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-mono font-bold text-brand-700">SHOWCASE YOUR INNOVATION</div>
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  {state.designName || 'Proyek Generator Mini'} — {state.identity.groupName || 'Kelompok'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowcaseMode(false)}
                aria-label="Tutup mode presentasi" className="btn btn-secondary p-2.5 w-11"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PRESENTATION_SECTIONS.map((sec) => (
                <div key={sec.key} className="p-5 card space-y-2">
                  <div className="text-xs font-mono font-bold text-brand-700">{sec.label}</div>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
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

