import React from 'react';
import { Sparkles, Wrench, ArrowRight, Link2, CheckCircle2 } from 'lucide-react';
import { useModul } from '../../context/ModulContext';

const CREATIVITY_4_PILLARS = [
  { name: 'Fluency', desc: 'Kelancaran menghasilkan banyak gagasan perbaikan.' },
  { name: 'Flexibility', desc: 'Kemampuan mengubah sudut pandang dan variasi solusi teknis.' },
  { name: 'Originality', desc: 'Kebaruan dan keunikan modifikasi desain generator.' },
  { name: 'Elaboration', desc: 'Kedalaman merinci detail perbaikan prototipe.' },
];

export const Screen15Improve: React.FC = () => {
  const { state, updateState } = useModul();

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] clay-card p-6 sm:p-8 space-y-6">
        {/* Header Quote */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-cyan-500/10 to-sky-100/40 dark:to-slate-900 border-2 border-cyan-300 dark:border-cyan-500/30 space-y-2">
          <div className="clay-badge inline-flex items-center gap-2 px-3 py-1 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 text-xs font-mono font-bold">
            <Wrench className="w-4 h-4 text-cyan-600" />
            <span>EDP TAHAP IMPROVE • ITERASI DESAIN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white">
            “Insinyur tidak berhenti pada kegagalan.”
          </h1>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Gunakan data hasil pengujian untuk merancang <strong className="text-amber-700 dark:text-amber-300 font-extrabold">Versi Kedua Prototype (V2)</strong> yang lebih optimal.
          </p>
        </div>

        {/* 4 Dimensions of Creativity Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CREATIVITY_4_PILLARS.map((p) => (
            <div key={p.name} className="p-4 rounded-2xl clay-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{p.name}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* 4 Key Improve Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block p-5 rounded-2xl clay-card bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 space-y-2 shadow-sm">
            <span className="text-xs font-display font-bold text-rose-700 dark:text-rose-400">1. Apa kelemahan desain V1?</span>
            <textarea
              rows={3}
              value={state.improveWeakness}
              onChange={(e) => updateState('improveWeakness', e.target.value)}
              placeholder="Identifikasi bagian desain pertama yang kurang efektif..."
              className="clay-input w-full p-3 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </label>

          <label className="block p-5 rounded-2xl clay-card bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 space-y-2 shadow-sm">
            <span className="text-xs font-display font-bold text-amber-700 dark:text-amber-400">2. Apa yang perlu diperbaiki?</span>
            <textarea
              rows={3}
              value={state.improveWhatToFix}
              onChange={(e) => updateState('improveWhatToFix', e.target.value)}
              placeholder="Komponen atau parameter fisika mana yang perlu ditingkatkan?"
              className="clay-input w-full p-3 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>

          <label className="block p-5 rounded-2xl clay-card bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-800 space-y-2 shadow-sm">
            <span className="text-xs font-display font-bold text-sky-700 dark:text-sky-400">3. Apa ide baru yang muncul?</span>
            <textarea
              rows={3}
              value={state.improveNewIdeas}
              onChange={(e) => updateState('improveNewIdeas', e.target.value)}
              placeholder="Gagasan kreatif atau modifikasi baru untuk memperbesar GGL..."
              className="clay-input w-full p-3 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </label>

          <label className="block p-5 rounded-2xl clay-card bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 space-y-2 shadow-sm">
            <span className="text-xs font-display font-bold text-emerald-700 dark:text-emerald-400">4. Apa perubahan desain yang akan dilakukan?</span>
            <textarea
              rows={3}
              value={state.improvePlannedChanges}
              onChange={(e) => updateState('improvePlannedChanges', e.target.value)}
              placeholder="Spesifikasi konkret untuk merakit Versi Kedua Prototipe..."
              className="clay-input w-full p-3 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </label>
        </div>

        {/* Prototype V2 Results & Drive Link */}
        <div className="p-6 rounded-2xl clay-card bg-emerald-50/50 dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-500/30 space-y-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">
              “Buat Versi Kedua Prototype” — Perbandingan & Unggah Desain V2
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-300">
              <span>V1</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span>V2 Improved</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tegangan V1 (Tabel Testing):</span>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                {state.testingRows[0]?.voltage || 'Belum diisi'}
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">Tegangan Hasil V2 (Volt):</span>
              <input
                type="text"
                value={state.improveV2Voltage}
                onChange={(e) => updateState('improveV2Voltage', e.target.value)}
                placeholder="Contoh: 3.4 V"
                className="clay-input w-full px-3.5 py-2 rounded-xl font-mono text-sm font-bold text-emerald-800 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">LED Menyala pada V2?</span>
              <select
                value={state.improveV2LedStatus}
                onChange={(e) => updateState('improveV2LedStatus', e.target.value as 'Ya' | 'Tidak' | '')}
                className="clay-input w-full px-3.5 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Pilih Status</option>
                <option value="Ya">Ya (Menyala Terang)</option>
                <option value="Tidak">Tidak</option>
              </select>
            </label>
          </div>

          <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-1.5 text-xs font-bold text-cyan-800 dark:text-cyan-300">
              <Link2 className="w-4 h-4 text-cyan-600" />
              <span>Link Drive untuk Unggah Desain & Prototipe V2:</span>
            </label>
            <input
              type="url"
              value={state.improveDriveLink}
              onChange={(e) => updateState('improveDriveLink', e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {state.improveDriveLink && (
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tautan desain V2 tercatat</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

