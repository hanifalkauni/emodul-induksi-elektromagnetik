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
      <div className="rounded-[32px] clay-card p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="clay-badge inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100 text-emerald-900 text-xs font-bold font-mono">
            <FlaskConical className="w-4 h-4 text-emerald-600" />
            <span>EKSPERIMEN LEARNING KIT (STEM PRAKTIKUM)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
            “Sekarang Buktikan!”
          </h1>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-3xl leading-relaxed">
            Gunakan perangkat praktikum fisik (*Learning Kit*) untuk membuktikan konsep Hukum Faraday dan menguji strategi kelompokmu secara empiris.
          </p>
        </div>

        {/* Tools & Challenge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
            <div className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">KELENGKAPAN ALAT PRAKTIKUM</div>
            <div className="grid grid-cols-2 gap-2.5">
              {LAB_TOOLS.map((tool) => {
                const checked = state.checkedTools.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`p-3 rounded-2xl border text-left text-xs font-semibold flex items-center gap-2 transition shadow-sm ${
                      checked
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-400 text-slate-900 dark:text-white ring-1 ring-emerald-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>{tool}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
            <div className="text-xs font-mono font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">TANTANGAN EKSPERIMEN</div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">
              “Bagaimana menghasilkan GGL induksi sebesar mungkin?”
            </h2>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Kelompok diberi kebebasan menentukan strategi percobaan (kombinasi jumlah lilitan, kecepatan gerakan magnet, posisi magnet, atau rangkaian kumparan).
            </p>
            <textarea
              rows={3}
              value={state.experimentStrategy}
              onChange={(e) => updateState('experimentStrategy', e.target.value)}
              placeholder="Tuliskan strategi kelompokmu untuk menghasilkan GGL induksi maksimum..."
              className="clay-input w-full p-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Role Assignment Table */}
        <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-base font-display font-bold text-slate-900 dark:text-white">
                <Users className="w-5 h-5 text-cyan-600" />
                <span>Pembagian Peran Kolaborasi Terukur</span>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                Tetapkan nama anggota kelompok pada masing-masing peran. Peran dapat diputar pada aktivitas berikutnya.
              </p>
            </div>
            <button
              type="button"
              onClick={rotateRoles}
              className="clay-btn clay-btn-primary px-4 py-2 text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              <span>Putar Peran</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80">
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Tugas</th>
                  <th className="py-3 px-4">Nama Anggota Kelompok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {state.roles.map((item, idx) => (
                  <tr key={item.role}>
                    <td className="py-3 px-4 font-display font-extrabold text-cyan-800 dark:text-cyan-300 whitespace-nowrap">
                      {item.role}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium">
                      {item.taskDescription}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.memberName}
                        onChange={(e) => updateRoleMember(idx, e.target.value)}
                        placeholder={`Nama ${item.role}...`}
                        className="clay-input w-full min-w-[160px] px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LKPD Download & Lab Report Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 rounded-3xl clay-card flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-base font-display font-bold text-slate-900 dark:text-white">Link Unduh LKPD</div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Unduh/cetak Lembar Kerja Peserta Didik (LKPD) otomatis yang telah terisi identitas dan peran kelompokmu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openPrintableLkpd(state)}
              className="clay-btn clay-btn-primary px-5 py-3 text-xs sm:text-sm font-bold shadow-md"
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

