import React from 'react';
import { Activity, Plus, Trash2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useModul } from '../../context/ModulContext';
import { TestingRow } from '../../types/emodul';

export const Screen14Testing: React.FC = () => {
  const { state, updateState } = useModul();

  const updateRow = (id: string, patch: Partial<TestingRow>) => {
    const next = state.testingRows.map((row) => (row.id === id ? { ...row, ...patch } : row));
    updateState('testingRows', next);
  };

  const addRow = () => {
    const nextNum = state.testingRows.length + 1;
    const newRow: TestingRow = {
      id: `trial-${Date.now()}`,
      trialLabel: `Uji Coba ${nextNum}`,
      voltage: '',
      turns: '',
      speed: 'Sedang',
      magnetCondition: '',
      ledLit: 'Tidak',
    };
    updateState('testingRows', [...state.testingRows, newRow]);
  };

  const removeRow = (id: string) => {
    if (state.testingRows.length <= 1) return;
    updateState(
      'testingRows',
      state.testingRows.filter((row) => row.id !== id)
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] clay-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="clay-badge inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-100 text-cyan-800 text-xs font-bold font-mono">
              <Activity className="w-4 h-4 text-cyan-600" />
              <span>EDP TAHAP TEST • UJI DESAIN KELOMPOK</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              Testing & Pengukuran Kinerja Generator
            </h1>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Catat data hasil uji desain kelompokmu secara objektif. Kamu dapat menambahkan beberapa baris percobaan.
            </p>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-bold shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Tambah Baris Uji</span>
          </button>
        </div>

        {/* Interactive Testing Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                <th className="py-3 px-3">Percobaan</th>
                <th className="py-3 px-3">Tegangan (V)</th>
                <th className="py-3 px-3">Jumlah Lilitan</th>
                <th className="py-3 px-3">Kecepatan Putaran</th>
                <th className="py-3 px-3">Kondisi Magnet</th>
                <th className="py-3 px-3">LED Menyala</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm font-medium">
              {state.testingRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={row.trialLabel}
                      onChange={(e) => updateRow(row.id, { trialLabel: e.target.value })}
                      className="clay-input w-full px-2.5 py-1.5 rounded-lg text-xs font-bold"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={row.voltage}
                      onChange={(e) => updateRow(row.id, { voltage: e.target.value })}
                      placeholder="Contoh: 1.8 V"
                      className="clay-input w-full px-2.5 py-1.5 rounded-lg text-cyan-800 dark:text-cyan-300 font-mono text-xs font-bold"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={row.turns}
                      onChange={(e) => updateRow(row.id, { turns: e.target.value })}
                      placeholder="Contoh: 600"
                      className="clay-input w-full px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold"
                    />
                  </td>
                  <td className="p-2.5">
                    <select
                      value={row.speed}
                      onChange={(e) => updateRow(row.id, { speed: e.target.value })}
                      className="clay-input w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      <option value="Lambat">Lambat</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Cepat">Cepat</option>
                    </select>
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={row.magnetCondition}
                      onChange={(e) => updateRow(row.id, { magnetCondition: e.target.value })}
                      placeholder="Contoh: 4 Neodymium"
                      className="clay-input w-full px-2.5 py-1.5 rounded-lg text-xs font-medium"
                    />
                  </td>
                  <td className="p-2.5">
                    <select
                      value={row.ledLit}
                      onChange={(e) => updateRow(row.id, { ledLit: e.target.value as 'Ya' | 'Tidak' })}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold shadow-xs ${
                        row.ledLit === 'Ya'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-slate-900 border-amber-300 dark:border-slate-700 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      <option value="Ya">Ya</option>
                      <option value="Tidak">Tidak</option>
                    </select>
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={state.testingRows.length <= 1}
                      aria-label="Hapus baris uji"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Evaluation Questions */}
        <div className="p-6 rounded-2xl clay-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="space-y-2">
            <div className="text-sm font-display font-bold text-slate-900 dark:text-white">Apakah desain berhasil?</div>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {[
                { val: 'Ya', icon: CheckCircle2, style: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-400' },
                { val: 'Sebagian', icon: AlertTriangle, style: 'border-amber-500 bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 ring-1 ring-amber-400' },
                { val: 'Belum', icon: XCircle, style: 'border-rose-500 bg-rose-50 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 ring-1 ring-rose-400' },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = state.designSuccessStatus === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => updateState('designSuccessStatus', opt.val as 'Ya' | 'Sebagian' | 'Belum')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      active ? opt.style : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{opt.val}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="failure-cause" className="block text-sm font-display font-bold text-slate-900 dark:text-white">
              Apa penyebabnya? (Jelaskan faktor fisika maupun kendala mekanik yang memengaruhi hasil pengujian)
            </label>
            <textarea
              id="failure-cause"
              rows={3}
              value={state.failureCauseAnalysis}
              onChange={(e) => updateState('failureCauseAnalysis', e.target.value)}
              placeholder="Contoh: Celah udara antara magnet dan kumparan terlalu lebar atau putaran engkol kurang cepat..."
              className="clay-input w-full p-3.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

