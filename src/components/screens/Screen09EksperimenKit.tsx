import React from 'react';
import {
  FlaskConical,
  Download,
  Upload,
  RefreshCw,
  CheckSquare,
  Square,
  Users,
  Link2,
} from 'lucide-react';
import { useModul } from '../../context/ModulContext';
import { openPrintableLkpd } from '../../utils/exportLkpd';

const LAB_TOOLS = [
  'Magnet',
  'Kumparan',
  'Kabel',
  'LED',
  'Multimeter',
  'Papan rangkaian',
];

export const Screen09EksperimenKit: React.FC = () => {
  const { state, updateState, rotateRoles } = useModul();

  const toggleTool = (tool: string) => {
    const exists = state.checkedTools.includes(tool);
    updateState(
      'checkedTools',
      exists ? state.checkedTools.filter((t) => t !== tool) : [...state.checkedTools, tool]
    );
  };

  const updateRoleMember = (index: number, memberName: string) => {
    const next = state.roles.map((r, i) => (i === index ? { ...r, memberName } : r));
    updateState('roles', next);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateState('labReportFileName', file.name);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
            <FlaskConical className="w-4 h-4" />
            <span>Eksperimen Learning Kit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            “Sekarang Buktikan!”
          </h1>
          <p className="text-sm text-slate-300">
            Gunakan perangkat praktikum fisik (*Learning Kit*) untuk membuktikan konsep Hukum Faraday dan menguji strategi kelompokmu.
          </p>
        </div>

        {/* Tools & Challenge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-3">
            <div className="text-xs font-mono text-cyan-400">KELENGKAPAN ALAT PRAKTIKUM</div>
            <div className="grid grid-cols-2 gap-2.5">
              {LAB_TOOLS.map((tool) => {
                const checked = state.checkedTools.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center gap-2 transition ${
                      checked
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span>{tool}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 p-5 space-y-3">
            <div className="text-xs font-mono text-amber-400 uppercase">Tantangan Eksperimen</div>
            <h2 className="text-lg font-display font-bold text-white">
              “Bagaimana menghasilkan GGL induksi sebesar mungkin?”
            </h2>
            <p className="text-xs text-slate-300">
              Kelompok diberi kebebasan menentukan strategi percobaan (kombinasi jumlah lilitan, kecepatan gerakan magnet, posisi magnet, atau rangkaian kumparan).
            </p>
            <textarea
              rows={3}
              value={state.experimentStrategy}
              onChange={(e) => updateState('experimentStrategy', e.target.value)}
              placeholder="Tuliskan strategi kelompokmu untuk menghasilkan GGL induksi maksimum..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Role Assignment Table */}
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-display font-bold text-white">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Pembagian Peran Kolaborasi Terukur</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tetapkan nama anggota kelompok pada masing-masing peran. Peran dapat diputar pada aktivitas berikutnya.
              </p>
            </div>
            <button
              type="button"
              onClick={rotateRoles}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-cyan-300 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Putar Peran</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-mono text-slate-400">
                  <th className="py-2.5 px-3">Peran</th>
                  <th className="py-2.5 px-3">Tugas</th>
                  <th className="py-2.5 px-3">Nama Anggota Kelompok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {state.roles.map((item, idx) => (
                  <tr key={item.role}>
                    <td className="py-2.5 px-3 font-display font-bold text-cyan-300 whitespace-nowrap">
                      {item.role}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-xs sm:text-sm">
                      {item.taskDescription}
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.memberName}
                        onChange={(e) => updateRoleMember(idx, e.target.value)}
                        placeholder={`Nama ${item.role}...`}
                        className="w-full min-w-[160px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LKPD Download & Lab Report Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-display font-bold text-white">Link Unduh LKPD</div>
              <p className="text-xs text-slate-400">
                Unduh/cetak Lembar Kerja Peserta Didik (LKPD) otomatis yang telah terisi identitas dan peran kelompokmu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openPrintableLkpd(state)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Unduh / Cetak LKPD (PDF)</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="space-y-1">
              <div className="text-sm font-display font-bold text-white">Link Unggah Hasil Praktikum</div>
              <p className="text-xs text-slate-400">
                Lampirkan berkas hasil praktikum atau masukkan tautan Google Drive / LMS kelas.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-emerald-300 transition">
                <Upload className="w-4 h-4" />
                <span>
                  {state.labReportFileName
                    ? `Berkas dipilih: ${state.labReportFileName}`
                    : 'Pilih Berkas Laporan (PDF / Foto)'}
                </span>
                <input type="file" accept=".pdf,image/*" onChange={handleFileSelect} className="hidden" />
              </label>
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="url"
                  value={state.labReportLink}
                  onChange={(e) => updateState('labReportLink', e.target.value)}
                  placeholder="Atau tempel tautan Google Drive hasil praktikum..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

