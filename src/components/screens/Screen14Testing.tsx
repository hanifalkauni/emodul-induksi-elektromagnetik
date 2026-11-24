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
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="badge inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-50 border-brand-200 text-brand-700 text-xs font-bold font-mono">
              <Activity className="w-4 h-4 text-brand-700" />
              <span>EDP TAHAP TEST • UJI DESAIN KELOMPOK</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-slate-900">
              Testing & Pengukuran Kinerja Generator
            </h1>
            <p className="text-sm font-medium text-slate-700">
              Catat data hasil uji desain kelompokmu secara objektif. Kamu dapat menambahkan beberapa baris percobaan.
            </p>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="btn btn-primary px-5 py-2.5 text-xs font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Tambah Baris Uji</span>
          </button>
        </div>

        {/* Interactive Testing Table */}
        <p className="sm:hidden -mb-3 text-[11px] text-slate-500">Geser tabel ke samping untuk melihat semua kolom.</p>
        <div className="relative overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse min-w-[580px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-mono font-semibold text-slate-700">
                <th className="py-3 px-2">Percobaan</th>
                <th className="py-3 px-2">Tegangan (V)</th>
                <th className="py-3 px-2">Lilitan</th>
                <th className="py-3 px-2">Kecepatan</th>
                <th className="py-3 px-2">Kondisi Magnet</th>
                <th className="py-3 px-2">LED Menyala</th>
                <th className="py-3 px-2 text-center"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {state.testingRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.trialLabel}
                      onChange={(e) => updateRow(row.id, { trialLabel: e.target.value })}
                      className="input w-full px-2.5 py-1.5 text-xs font-semibold"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.voltage}
                      onChange={(e) => updateRow(row.id, { voltage: e.target.value })}
                      placeholder="Contoh: 1.8 V"
                      className="input w-full px-2.5 py-1.5 font-mono text-xs"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.turns}
                      onChange={(e) => updateRow(row.id, { turns: e.target.value })}
                      placeholder="Contoh: 600"
                      className="input w-full px-2.5 py-1.5 font-mono text-xs"
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={row.speed}
                      onChange={(e) => updateRow(row.id, { speed: e.target.value })}
                      className="input w-full px-2.5 py-1.5 text-xs"
                    >
                      <option value="Lambat">Lambat</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Cepat">Cepat</option>
                    </select>
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.magnetCondition}
                      onChange={(e) => updateRow(row.id, { magnetCondition: e.target.value })}
                      placeholder="Contoh: 4 Neodymium"
                      className="input w-full px-2.5 py-1.5 text-xs"
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={row.ledLit}
                      onChange={(e) => updateRow(row.id, { ledLit: e.target.value as 'Ya' | 'Tidak' })}
                      className={`input w-full min-w-[72px] px-2 py-1.5 text-xs font-bold ${
                        row.ledLit === 'Ya'
                          ? '!bg-emerald-50 !border-emerald-300 text-emerald-800'
                          : 'text-slate-700'
                      }`}
                    >
                      <option value="Ya">Ya</option>
                      <option value="Tidak">Tidak</option>
                    </select>
                  </td>
                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={state.testingRows.length <= 1}
                      aria-label="Hapus baris uji"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-display font-bold text-slate-900">Apakah desain berhasil?</div>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {[
                { val: 'Ya', icon: CheckCircle2, style: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                { val: 'Sebagian', icon: AlertTriangle, style: 'border-amber-500 bg-amber-50 text-amber-800' },
                { val: 'Belum', icon: XCircle, style: 'border-rose-500 bg-rose-50 text-rose-800' },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = state.designSuccessStatus === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => updateState('designSuccessStatus', opt.val as 'Ya' | 'Sebagian' | 'Belum')}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      active ? opt.style : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
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
            <label htmlFor="failure-cause" className="block text-sm font-display font-bold text-slate-900">
              Apa penyebabnya? (Jelaskan faktor fisika maupun kendala mekanik yang memengaruhi hasil pengujian)
            </label>
            <textarea
              id="failure-cause"
              rows={3}
              value={state.failureCauseAnalysis}
              onChange={(e) => updateState('failureCauseAnalysis', e.target.value)}
              placeholder="Contoh: Celah udara antara magnet dan kumparan terlalu lebar atau putaran engkol kurang cepat..."
              className="input w-full p-3.5 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

