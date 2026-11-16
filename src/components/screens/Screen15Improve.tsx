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
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        {/* Header Quote */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-cyan-500/10 to-slate-950 border border-cyan-500/30 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-300 uppercase">
            <Wrench className="w-4 h-4" />
            <span>EDP Tahap Improve • Iterasi Desain</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            “Insinyur tidak berhenti pada kegagalan.”
          </h1>
          <p className="text-sm text-slate-300">
            Gunakan data hasil pengujian untuk merancang <strong className="text-amber-300">Versi Kedua Prototype (V2)</strong> yang lebih optimal.
          </p>
        </div>

        {/* 4 Dimensions of Creativity Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CREATIVITY_4_PILLARS.map((p) => (
            <div key={p.name} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{p.name}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* 4 Key Improve Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-display font-bold text-rose-300">1. Apa kelemahan desain V1?</span>
            <textarea
              rows={3}
              value={state.improveWeakness}
              onChange={(e) => updateState('improveWeakness', e.target.value)}
              placeholder="Identifikasi bagian desain pertama yang kurang efektif..."
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </label>

          <label className="block p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-display font-bold text-amber-300">2. Apa yang perlu diperbaiki?</span>
            <textarea
              rows={3}
              value={state.improveWhatToFix}
              onChange={(e) => updateState('improveWhatToFix', e.target.value)}
              placeholder="Komponen atau parameter fisika mana yang perlu ditingkatkan?"
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </label>

          <label className="block p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-display font-bold text-cyan-300">3. Apa ide baru yang muncul?</span>
            <textarea
              rows={3}
              value={state.improveNewIdeas}
              onChange={(e) => updateState('improveNewIdeas', e.target.value)}
              placeholder="Gagasan kreatif atau modifikasi baru untuk memperbesar GGL..."
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </label>

          <label className="block p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-display font-bold text-emerald-300">4. Apa perubahan desain yang akan dilakukan?</span>
            <textarea
              rows={3}
              value={state.improvePlannedChanges}
              onChange={(e) => updateState('improvePlannedChanges', e.target.value)}
              placeholder="Spesifikasi konkret untuk merakit Versi Kedua Prototipe..."
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </label>
        </div>

        {/* Prototype V2 Results & Drive Link */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-display font-bold text-white">
              “Buat Versi Kedua Prototype” — Perbandingan & Unggah Desain V2
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400">
              <span>V1</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span>V2 Improved</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block space-y-1">
              <span className="text-xs text-slate-300">Tegangan V1 (dari tabel Testing):</span>
              <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-sm text-slate-300">
                {state.testingRows[0]?.voltage || 'Belum diisi'}
              </div>
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-emerald-300 font-medium">Tegangan Hasil V2 (Volt):</span>
              <input
                type="text"
                value={state.improveV2Voltage}
                onChange={(e) => updateState('improveV2Voltage', e.target.value)}
                placeholder="Contoh: 3.4 V"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-sm text-emerald-300 focus:outline-none focus:border-emerald-400"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-emerald-300 font-medium">LED Menyala pada V2?</span>
              <select
                value={state.improveV2LedStatus}
                onChange={(e) => updateState('improveV2LedStatus', e.target.value as 'Ya' | 'Tidak' | '')}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="">Pilih Status</option>
                <option value="Ya">Ya (Menyala Terang)</option>
                <option value="Tidak">Tidak</option>
              </select>
            </label>
          </div>

          <div className="pt-2 space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
              <Link2 className="w-4 h-4" />
              <span>Link Drive untuk Unggah Desain & Prototipe V2:</span>
            </label>
            <input
              type="url"
              value={state.improveDriveLink}
              onChange={(e) => updateState('improveDriveLink', e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
            {state.improveDriveLink && (
              <div className="flex items-center gap-1 text-xs font-mono text-emerald-400">
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

