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
      <div className="card p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="badge inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-50 border-brand-200 text-brand-700 text-xs font-bold font-mono">
            <FlaskConical className="w-4 h-4 text-brand-700" />
            <span>EKSPERIMEN LEARNING KIT (STEM PRAKTIKUM)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-slate-900">
            “Sekarang Buktikan!”
          </h1>
          <p className="text-sm font-medium text-slate-700 max-w-3xl leading-relaxed">
            Gunakan perangkat praktikum fisik (*Learning Kit*) untuk membuktikan konsep Hukum Faraday dan menguji strategi kelompokmu secara empiris.
          </p>
        </div>

        {/* Tools & Challenge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-3">
            <div className="text-xs font-mono font-bold text-brand-700 uppercase tracking-wider">KELENGKAPAN ALAT PRAKTIKUM</div>
            <div className="grid grid-cols-2 gap-2.5">
              {LAB_TOOLS.map((tool) => {
                const checked = state.checkedTools.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                      checked
                        ? 'bg-brand-50 border-brand-400 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-brand-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>{tool}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-3">
            <div className="text-xs font-mono font-bold text-brand-700 uppercase tracking-wider">TANTANGAN EKSPERIMEN</div>
            <h2 className="text-lg font-display font-bold text-slate-900">
              “Bagaimana menghasilkan GGL induksi sebesar mungkin?”
            </h2>
            <p className="text-xs font-medium text-slate-600">
              Kelompok diberi kebebasan menentukan strategi percobaan (kombinasi jumlah lilitan, kecepatan gerakan magnet, posisi magnet, atau rangkaian kumparan).
            </p>
            <textarea
              rows={3}
              value={state.experimentStrategy}
              onChange={(e) => updateState('experimentStrategy', e.target.value)}
              placeholder="Tuliskan strategi kelompokmu untuk menghasilkan GGL induksi maksimum..."
              className="input w-full p-3.5 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Role Assignment Table */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-base font-display font-bold text-slate-900">
                <Users className="w-5 h-5 text-brand-700" />
                <span>Pembagian Peran Kolaborasi Terukur</span>
              </div>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                Tetapkan nama anggota kelompok pada masing-masing peran. Peran dapat diputar pada aktivitas berikutnya.
              </p>
            </div>
            <button
              type="button"
              onClick={rotateRoles}
              className="btn btn-primary px-4 py-2 text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              <span>Putar Peran</span>
            </button>
          </div>

          <div className="relative overflow-x-auto rounded-xl bg-white border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-mono font-bold text-slate-700 bg-slate-100">
                  <th className="py-3 px-3 sm:px-4">Peran</th>
                  <th className="hidden sm:table-cell py-3 px-4">Tugas</th>
                  <th className="py-3 px-3 sm:px-4">Nama Anggota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {state.roles.map((item, idx) => (
                  <tr key={item.role}>
                    <td className="py-3 px-3 sm:px-4 align-top">
                      <div className="font-display font-bold text-brand-700 whitespace-nowrap">{item.role}</div>
                      <div className="sm:hidden mt-0.5 text-[11px] text-slate-600">{item.taskDescription}</div>
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4 text-slate-700 text-sm font-medium">
                      {item.taskDescription}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <input
                        type="text"
                        value={item.memberName}
                        onChange={(e) => updateRoleMember(idx, e.target.value)}
                        placeholder={`Nama ${item.role}...`}
                        className="input w-full min-w-0 sm:min-w-[160px] px-3 py-1.5 text-xs"
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
          <div className="p-6 card flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-base font-display font-bold text-slate-900">Link Unduh LKPD</div>
              <p className="text-xs font-medium text-slate-600">
                Unduh/cetak Lembar Kerja Peserta Didik (LKPD) otomatis yang telah terisi identitas dan peran kelompokmu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openPrintableLkpd(state)}
              className="btn btn-primary px-5 py-3 text-xs sm:text-sm font-bold"
            >
              <Download className="w-4 h-4" />
              <span>Unduh / Cetak LKPD (PDF)</span>
            </button>
          </div>

          <div className="p-6 card space-y-3">
            <div className="space-y-1">
              <div className="text-base font-display font-bold text-slate-900">Link Unggah Hasil Praktikum</div>
              <p className="text-xs font-medium text-slate-600">
                Lampirkan berkas hasil praktikum atau masukkan tautan Google Drive / LMS kelas.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="btn btn-secondary cursor-pointer px-4 py-2 text-xs focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-600">
                <Upload className="w-4 h-4 text-brand-700" />
                <span>
                  {state.labReportFileName
                    ? `Berkas dipilih: ${state.labReportFileName}`
                    : 'Pilih Berkas Laporan (PDF / Foto)'}
                </span>
                <input type="file" accept=".pdf,image/*" onChange={handleFileSelect} className="sr-only" />
              </label>
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="url"
                  value={state.labReportLink}
                  onChange={(e) => updateState('labReportLink', e.target.value)}
                  placeholder="Atau tempel tautan Google Drive hasil praktikum..."
                  className="input w-full px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

