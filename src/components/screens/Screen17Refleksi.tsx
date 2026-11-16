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
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        {/* Header & Google Form Barcode Integration */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-b border-slate-800 pb-6 items-center">
          <div className="lg:col-span-8 space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
              <RefreshCw className="w-4 h-4" />
              <span>Refleksi Pembelajaran & Penilaian Diri</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
              Refleksi Kreativitas & Kolaborasi
            </h1>
            <p className="text-sm text-slate-300">
              Jawab pernyataan refleksi di bawah ini dengan jujur (Skala 1 = Kurang, 2 = Cukup, 3 = Baik, 4 = Sangat Baik). Kamu juga dapat mengakses tautan Google Form / memindai QR Code kelas.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <input
                type="url"
                value={state.googleFormUrl}
                onChange={(e) => updateState('googleFormUrl', e.target.value)}
                aria-label="Link Google Form Refleksi"
                className="flex-1 min-w-[240px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-cyan-300 font-mono"
              />
              <a
                href={state.googleFormUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-white transition"
              >
                <span>Buka G-Form</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Crisp Vector QR Code Placeholder Representing Class Barcode */}
          <div className="lg:col-span-4 flex flex-col items-center p-4 rounded-2xl bg-slate-950 border border-slate-800 gap-2">
            <div className="p-3 rounded-xl bg-white text-slate-950">
              <QrCode className="w-20 h-20" strokeWidth={1.6} />
            </div>
            <span className="text-[11px] font-mono text-slate-400 text-center">
              QR Barcode Link Google Form Refleksi
            </span>
          </div>
        </div>

        {/* Section 1: KREATIVITAS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-display font-bold text-amber-300">
                KREATIVITAS — “Seberapa kreatif saya hari ini?”
              </h2>
            </div>
            <span className="px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 font-mono text-xs font-bold text-amber-300">
              Skor: {creativityTotal} / 20
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/70 text-xs font-mono text-slate-300">
                  <th className="py-3 px-4">Pernyataan</th>
                  <th className="py-3 px-3 text-center w-14">1</th>
                  <th className="py-3 px-3 text-center w-14">2</th>
                  <th className="py-3 px-3 text-center w-14">3</th>
                  <th className="py-3 px-3 text-center w-14">4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {CREATIVITY_ITEMS.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 text-slate-200">{item.label}</td>
                    {[1, 2, 3, 4].map((val) => {
                      const selected = state.creativityScores[item.key] === val;
                      return (
                        <td key={val} className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setCreativity(item.key, val)}
                            className={`w-8 h-8 rounded-lg font-mono text-xs font-bold border transition ${
                              selected
                                ? 'bg-amber-500 text-slate-950 border-amber-300'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
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
            <h2 className="text-lg font-display font-bold text-cyan-300">KOLABORASI</h2>
            <span className="px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 font-mono text-xs font-bold text-cyan-300">
              Skor: {collaborationTotal} / 20
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/70 text-xs font-mono text-slate-300">
                  <th className="py-3 px-4">Pernyataan</th>
                  <th className="py-3 px-3 text-center w-14">1</th>
                  <th className="py-3 px-3 text-center w-14">2</th>
                  <th className="py-3 px-3 text-center w-14">3</th>
                  <th className="py-3 px-3 text-center w-14">4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {COLLABORATION_ITEMS.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 text-slate-200">{item.label}</td>
                    {[1, 2, 3, 4].map((val) => {
                      const selected = state.collaborationScores[item.key] === val;
                      return (
                        <td key={val} className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setCollaboration(item.key, val)}
                            className={`w-8 h-8 rounded-lg font-mono text-xs font-bold border transition ${
                              selected
                                ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
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
          <label className="block p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs sm:text-sm font-display font-bold text-white">
              “Apa kontribusi terbaik yang kamu berikan kepada kelompok?”
            </span>
            <textarea
              rows={3}
              value={state.bestContributionText}
              onChange={(e) => updateState('bestContributionText', e.target.value)}
              placeholder="Tuliskan kontribusi terbaikmu hari ini..."
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </label>

          <label className="block p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs sm:text-sm font-display font-bold text-white">
              “Apa yang akan kamu lakukan agar kerja kelompok berikutnya lebih baik?”
            </span>
            <textarea
              rows={3}
              value={state.futureImprovementText}
              onChange={(e) => updateState('futureImprovementText', e.target.value)}
              placeholder="Tuliskan rencana perbaikan kerja kelompok berikutnya..."
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </label>
        </div>

        {/* Export Complete Portfolio CTA */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-display font-bold text-white">
                Selesaikan & Cetak Portofolio Pembelajaran (PDF)
              </div>
              <div className="text-xs text-slate-300">
                Ekspor seluruh jawaban hipotesis, simulasi, desain, data uji, dan refleksi ke dokumen siap cetak.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openPrintablePortfolio(state)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Unduh Portofolio PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

