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
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="space-y-2 border-b border-slate-200 pb-5">
          <div className="badge inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border-brand-200 text-brand-700 text-xs font-mono font-bold">
            <Wrench className="w-4 h-4 text-brand-600" />
            <span>EDP TAHAP CREATE • MEMBUAT PROTOTIPE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            “CREATE” — Wujudkan Prototipe Generator Mini
          </h1>
          <p className="text-sm font-medium text-slate-600">
            Siswa membuat prototipe fisik berdasarkan sketsa desain yang telah disepakati, lalu mendokumentasikan proses hingga pengujian awal.
          </p>
        </div>

        {/* 3 Required Documentation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Foto Proses */}
          <div className="p-5 card flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center">
                <Camera className="w-5 h-5 text-brand-700" />
              </div>
              <h2 className="text-base font-display font-bold text-slate-900">Foto Proses</h2>
              <p className="text-xs text-slate-600 font-medium">
                Dokumentasi saat kelompok merakit kumparan, poros, dan magnet.
              </p>
            </div>

            {state.processPhotoUrl && (
              <img
                src={state.processPhotoUrl}
                alt="Foto proses perakitan prototipe"
                className="w-full h-36 object-cover rounded-lg border border-slate-200"
              />
            )}

            <label className="btn btn-secondary cursor-pointer px-4 py-2.5 text-xs focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-600">
              <Upload className="w-4 h-4 text-brand-600" />
              <span className="truncate">{state.processPhotoName ? state.processPhotoName : 'Unggah Foto Proses'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'processPhotoUrl', 'processPhotoName')}
                className="sr-only"
              />
            </label>
          </div>

          {/* 2. Foto Prototype */}
          <div className="p-5 card flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center">
                <Camera className="w-5 h-5 text-brand-700" />
              </div>
              <h2 className="text-base font-display font-bold text-slate-900">Foto Prototype</h2>
              <p className="text-xs text-slate-600 font-medium">
                Tampilan keseluruhan generator mini yang sudah dirakit dan siap diuji.
              </p>
            </div>

            {state.prototypePhotoUrl && (
              <img
                src={state.prototypePhotoUrl}
                alt="Foto prototipe jadi"
                className="w-full h-36 object-cover rounded-lg border border-slate-200"
              />
            )}

            <label className="btn btn-secondary cursor-pointer px-4 py-2.5 text-xs focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-600">
              <Upload className="w-4 h-4 text-brand-600" />
              <span className="truncate">{state.prototypePhotoName ? state.prototypePhotoName : 'Unggah Foto Prototype'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'prototypePhotoUrl', 'prototypePhotoName')}
                className="sr-only"
              />
            </label>
          </div>

          {/* 3. Video Pengujian */}
          <div className="p-5 card flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center">
                <Video className="w-5 h-5 text-brand-700" />
              </div>
              <h2 className="text-base font-display font-bold text-slate-900">Video Pengujian</h2>
              <p className="text-xs text-slate-600 font-medium">
                Masukkan tautan video pengujian saat rotor diputar dan LED menyala.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="url"
                value={state.testVideoLink}
                onChange={(e) => updateState('testVideoLink', e.target.value)}
                placeholder="https://drive.google.com/..."
                className="input w-full px-3 py-2.5 text-xs"
              />
              {state.testVideoLink && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tautan video tersimpan</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Link Unggah E-Modul / LMS */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-slate-900">
            <Link2 className="w-4 h-4 text-brand-600" />
            <span>Link Unggah ke E-Modul / LMS Kelas</span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Jika sekolah menggunakan Google Classroom, Moodle, atau Google Drive folder kelas, tempelkan tautan folder unggahan kelompokmu di sini.
          </p>
          <input
            type="url"
            value={state.lmsUploadLink}
            onChange={(e) => updateState('lmsUploadLink', e.target.value)}
            placeholder="Tempel link folder LMS / Google Drive pengumpulan prototipe..."
            className="input w-full px-3.5 py-2.5 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

