import React from 'react';
import { Wrench, Camera, Video, Upload, CheckCircle2, Link2 } from 'lucide-react';
import { useModul } from '../../context/ModulContext';

export const Screen13MembuatPrototipe: React.FC = () => {
  const { state, updateState } = useModul();

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    urlKey: 'processPhotoUrl' | 'prototypePhotoUrl',
    nameKey: 'processPhotoName' | 'prototypePhotoName'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateState(urlKey, reader.result);
        updateState(nameKey, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-orange-400 uppercase tracking-wider">
            <Wrench className="w-4 h-4" />
            <span>EDP Tahap Create • Membuat Prototipe</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            “CREATE” — Wujudkan Prototipe Generator Mini
          </h1>
          <p className="text-sm text-slate-300">
            Siswa membuat prototipe fisik berdasarkan sketsa desain yang telah disepakati, lalu mendokumentasikan proses hingga pengujian awal.
          </p>
        </div>

        {/* 3 Required Documentation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Foto Proses */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <Camera className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-base font-display font-bold text-white">Foto Proses</h2>
              <p className="text-xs text-slate-400">
                Dokumentasi saat kelompok merakit kumparan, poros, dan magnet.
              </p>
            </div>

            {state.processPhotoUrl && (
              <img
                src={state.processPhotoUrl}
                alt="Foto proses perakitan prototipe"
                className="w-full h-36 object-cover rounded-xl border border-slate-700"
              />
            )}

            <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-cyan-200 transition">
              <Upload className="w-4 h-4" />
              <span>{state.processPhotoName ? state.processPhotoName : 'Unggah Foto Proses'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'processPhotoUrl', 'processPhotoName')}
                className="hidden"
              />
            </label>
          </div>

          {/* 2. Foto Prototype */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Camera className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-base font-display font-bold text-white">Foto Prototype</h2>
              <p className="text-xs text-slate-400">
                Tampilan keseluruhan generator mini yang sudah dirakit dan siap diuji.
              </p>
            </div>

            {state.prototypePhotoUrl && (
              <img
                src={state.prototypePhotoUrl}
                alt="Foto prototipe jadi"
                className="w-full h-36 object-cover rounded-xl border border-slate-700"
              />
            )}

            <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-amber-200 transition">
              <Upload className="w-4 h-4" />
              <span>{state.prototypePhotoName ? state.prototypePhotoName : 'Unggah Foto Prototype'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'prototypePhotoUrl', 'prototypePhotoName')}
                className="hidden"
              />
            </label>
          </div>

          {/* 3. Video Pengujian */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Video className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-base font-display font-bold text-white">Video Pengujian</h2>
              <p className="text-xs text-slate-400">
                Masukkan tautan video pengujian saat rotor diputar dan LED menyala.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="url"
                value={state.testVideoLink}
                onChange={(e) => updateState('testVideoLink', e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
              />
              {state.testVideoLink && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tautan video tersimpan</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Link Unggah E-Modul / LMS */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-white">
            <Link2 className="w-4 h-4 text-cyan-400" />
            <span>Link Unggah ke E-Modul / LMS Kelas</span>
          </div>
          <p className="text-xs text-slate-400">
            Jika sekolah menggunakan Google Classroom, Moodle, atau Google Drive folder kelas, tempelkan tautan folder unggahan kelompokmu di sini.
          </p>
          <input
            type="url"
            value={state.lmsUploadLink}
            onChange={(e) => updateState('lmsUploadLink', e.target.value)}
            placeholder="Tempel link folder LMS / Google Drive pengumpulan prototipe..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>
    </div>
  );
};

