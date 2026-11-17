import React from 'react';
import { RefreshCw, QrCode, ExternalLink, Printer, Award } from 'lucide-react';
import { useModul } from '../../context/ModulContext';
import { CreativityScores, CollaborationScores } from '../../types/emodul';
import { openPrintablePortfolio } from '../../utils/exportLkpd';

const CREATIVITY_ITEMS: { key: keyof CreativityScores; label: string }[] = [
  { key: 'manyIdeas', label: 'Saya menghasilkan banyak ide' },
  { key: 'differentIdeas', label: 'Saya menghasilkan ide yang berbeda' },
  { key: 'developToDesign', label: 'Saya mengembangkan ide menjadi desain' },
  { key: 'improveAfterFail', label: 'Saya memperbaiki desain setelah gagal' },
  { key: 'newSolution', label: 'Saya menemukan solusi baru' },
];

const COLLABORATION_ITEMS: { key: keyof CollaborationScores; label: string }[] = [
  { key: 'contribute', label: 'Saya berkontribusi dalam kelompok' },
  { key: 'listen', label: 'Saya mendengarkan ide teman' },
  { key: 'respect', label: 'Saya menghargai pendapat berbeda' },
  { key: 'helpSolve', label: 'Saya membantu menyelesaikan masalah' },
  { key: 'responsible', label: 'Saya bertanggung jawab terhadap tugas' },
];

export const Screen17Refleksi: React.FC = () => {
  const { state, updateState } = useModul();

  const setCreativity = (key: keyof CreativityScores, score: number) => {
    updateState('creativityScores', { ...state.creativityScores, [key]: score });
  };

  const setCollaboration = (key: keyof CollaborationScores, score: number) => {
    updateState('collaborationScores', { ...state.collaborationScores, [key]: score });
  };

  const creativityTotal = Object.values(state.creativityScores).reduce((a, b) => a + b, 0);
  const collaborationTotal = Object.values(state.collaborationScores).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] clay-card p-6 sm:p-8 space-y-6">
        {/* Header & Google Form Barcode Integration */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 items-center">
          <div className="lg:col-span-8 space-y-2">
            <div className="clay-badge inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-100 text-cyan-800 text-xs font-bold font-mono">
              <RefreshCw className="w-4 h-4 text-cyan-600" />
              <span>REFLEKSI PEMBELAJARAN & PENILAIAN DIRI</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              Refleksi Kreativitas & Kolaborasi
            </h1>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Jawab pernyataan refleksi di bawah ini dengan jujur (Skala 1 = Kurang, 2 = Cukup, 3 = Baik, 4 = Sangat Baik). Kamu juga dapat mengakses tautan Google Form / memindai QR Code kelas.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <input
                type="url"
                value={state.googleFormUrl}
                onChange={(e) => updateState('googleFormUrl', e.target.value)}
                aria-label="Link Google Form Refleksi"
                className="clay-input flex-1 min-w-[240px] px-3.5 py-2 text-xs text-slate-900 dark:text-cyan-300 font-mono"
              />
              <a
                href={state.googleFormUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="clay-btn clay-btn-primary px-4 py-2 text-xs font-bold"
              >
                <span>Buka G-Form</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </div>
          </div>

          {/* Crisp Vector QR Code Placeholder Representing Class Barcode */}
          <div className="lg:col-span-4 flex flex-col items-center p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-2 shadow-sm">
            <div className="p-3.5 rounded-2xl bg-white text-slate-950 shadow-md">
              <QrCode className="w-20 h-20" strokeWidth={1.8} />
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 text-center">
              QR Barcode Link Google Form Refleksi
            </span>
          </div>
        </div>

        {/* Section 1: KREATIVITAS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-display font-extrabold text-amber-900 dark:text-amber-300">
                KREATIVITAS — “Seberapa kreatif saya hari ini?”
              </h2>
            </div>
            <span className="clay-badge px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-mono text-xs font-extrabold border border-amber-300">
              Skor: {creativityTotal} / 20
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-slate-900/70 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  <th className="py-3 px-4">Pernyataan</th>
                  <th className="py-3 px-3 text-center w-14">1</th>
                  <th className="py-3 px-3 text-center w-14">2</th>
                  <th className="py-3 px-3 text-center w-14">3</th>
                  <th className="py-3 px-3 text-center w-14">4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm font-medium">
                {CREATIVITY_ITEMS.map((item) => (
                  <tr key={item.key} className="hover:bg-amber-50/30 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{item.label}</td>
                    {[1, 2, 3, 4].map((val) => {
                      const selected = state.creativityScores[item.key] === val;
                      return (
                        <td key={val} className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setCreativity(item.key, val)}
                            className={`w-9 h-9 rounded-xl font-mono text-xs font-black border transition shadow-xs ${
                              selected
                                ? 'bg-amber-500 text-slate-950 border-amber-600 scale-105 shadow-md'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                            }`}
                          >
                            {val}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: KOLABORASI */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-display font-extrabold text-cyan-900 dark:text-cyan-300">
              KOLABORASI — “Seberapa baik kerja tim saya?”
            </h2>
            <span className="clay-badge px-3 py-1 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 font-mono text-xs font-extrabold border border-cyan-300">
              Skor: {collaborationTotal} / 20
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-cyan-50/50 dark:bg-slate-900/70 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  <th className="py-3 px-4">Pernyataan</th>
                  <th className="py-3 px-3 text-center w-14">1</th>
                  <th className="py-3 px-3 text-center w-14">2</th>
                  <th className="py-3 px-3 text-center w-14">3</th>
                  <th className="py-3 px-3 text-center w-14">4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm font-medium">
                {COLLABORATION_ITEMS.map((item) => (
                  <tr key={item.key} className="hover:bg-cyan-50/30 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{item.label}</td>
                    {[1, 2, 3, 4].map((val) => {
                      const selected = state.collaborationScores[item.key] === val;
                      return (
                        <td key={val} className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setCollaboration(item.key, val)}
                            className={`w-9 h-9 rounded-xl font-mono text-xs font-black border transition shadow-xs ${
                              selected
                                ? 'bg-cyan-500 text-slate-950 border-cyan-600 scale-105 shadow-md'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                            }`}
                          >
                            {val}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Open-Ended Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block p-5 rounded-2xl clay-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <span className="text-xs sm:text-sm font-display font-bold text-slate-900 dark:text-white">
              “Apa kontribusi terbaik yang kamu berikan kepada kelompok?”
            </span>
            <textarea
              rows={3}
              value={state.bestContributionText}
              onChange={(e) => updateState('bestContributionText', e.target.value)}
              placeholder="Tuliskan kontribusi terbaikmu hari ini..."
              className="clay-input w-full p-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </label>

          <label className="block p-5 rounded-2xl clay-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <span className="text-xs sm:text-sm font-display font-bold text-slate-900 dark:text-white">
              “Apa yang akan kamu lakukan agar kerja kelompok berikutnya lebih baik?”
            </span>
            <textarea
              rows={3}
              value={state.futureImprovementText}
              onChange={(e) => updateState('futureImprovementText', e.target.value)}
              placeholder="Tuliskan rencana perbaikan kerja kelompok berikutnya..."
              className="clay-input w-full p-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </label>
        </div>

        {/* Export Complete Portfolio CTA */}
        <div className="p-6 rounded-2xl clay-card bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-sky-100/40 dark:to-slate-900 border-2 border-emerald-300 dark:border-emerald-500/30 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <Award className="w-9 h-9 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <div className="text-base font-display font-black text-slate-900 dark:text-white">
                Selesaikan & Cetak Portofolio Pembelajaran (PDF)
              </div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Ekspor seluruh jawaban hipotesis, simulasi, desain, data uji, dan refleksi ke dokumen LKPD resmi siap cetak.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openPrintablePortfolio(state)}
            className="clay-btn-emerald inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Unduh Portofolio PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

