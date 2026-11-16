import React from 'react';
import {
  Home,
  PlayCircle,
  FlaskConical,
  Lightbulb,
  Users,
  ClipboardCheck,
  RefreshCw,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { useModul } from '../../context/ModulContext';

const GUIDE_ITEMS = [
  {
    name: 'Home',
    icon: Home,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    description: 'Halaman utama yang berisi pengenalan dan petunjuk penggunaan e-modul.',
    targetScreen: 1,
  },
  {
    name: 'Materi',
    icon: PlayCircle,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/30',
    description: 'Bagian untuk mempelajari konsep induksi elektromagnetik.',
    targetScreen: 5,
  },
  {
    name: 'Eksperimen',
    icon: FlaskConical,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'Bagian untuk melakukan percobaan dan mengamati hasilnya.',
    targetScreen: 9,
  },
  {
    name: 'Tantangan',
    icon: Lightbulb,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    description: 'Bagian untuk menyelesaikan masalah nyata melalui ide dan rancangan kreatif.',
    targetScreen: 10,
  },
  {
    name: 'Kolaborasi',
    icon: Users,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/30',
    description: 'Bagian untuk bekerja sama, berbagi ide, dan menyelesaikan tugas bersama teman.',
    targetScreen: 11,
  },
  {
    name: 'Evaluasi',
    icon: ClipboardCheck,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30',
    description: 'Bagian untuk mengerjakan soal dan mengukur pemahaman terhadap materi.',
    targetScreen: 14,
  },
  {
    name: 'Refleksi',
    icon: RefreshCw,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/30',
    description: 'Bagian untuk melihat kembali pengalaman belajar, memahami hal yang sudah dikuasai, dan mengetahui hal yang perlu diperbaiki.',
    targetScreen: 17,
  },
];

export const Screen02Petunjuk: React.FC = () => {
  const { setScreen } = useModul();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Panduan Navigasi E-Modul</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
              “Bagaimana menggunakan e-modul?”
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Gunakan ikon navigasi di bawah ini (atau pada bilah navigasi atas) untuk berpindah antar fitur pembelajaran. Klik salah satu kartu di bawah untuk langsung menuju bagian terkait.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setScreen(3)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-cyan-300 transition"
          >
            <span>Lewati ke Peta Belajar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GUIDE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setScreen(item.targetScreen)}
                className="group text-left p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${item.bg}`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-bold text-white group-hover:text-cyan-300 transition">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 group-hover:text-cyan-400 pt-2 border-t border-slate-800/80">
                  <span>Buka bagian {item.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

