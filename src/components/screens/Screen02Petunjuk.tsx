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
    color: 'text-cyan-700 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-500/15 border-cyan-300 dark:border-cyan-500/30',
    description: 'Halaman utama yang berisi pengenalan dan petunjuk penggunaan e-modul.',
    targetScreen: 1,
  },
  {
    name: 'Materi',
    icon: PlayCircle,
    color: 'text-sky-700 dark:text-sky-400',
    bg: 'bg-sky-100 dark:bg-sky-500/15 border-sky-300 dark:border-sky-500/30',
    description: 'Bagian untuk mempelajari konsep induksi elektromagnetik.',
    targetScreen: 5,
  },
  {
    name: 'Eksperimen',
    icon: FlaskConical,
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30',
    description: 'Bagian untuk melakukan percobaan dan mengamati hasilnya.',
    targetScreen: 9,
  },
  {
    name: 'Tantangan',
    icon: Lightbulb,
    color: 'text-amber-800 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/30',
    description: 'Bagian untuk menyelesaikan masalah nyata melalui ide dan rancangan kreatif.',
    targetScreen: 10,
  },
  {
    name: 'Kolaborasi',
    icon: Users,
    color: 'text-indigo-800 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-500/15 border-indigo-300 dark:border-indigo-500/30',
    description: 'Bagian untuk bekerja sama, berbagi ide, dan menyelesaikan tugas bersama teman.',
    targetScreen: 11,
  },
  {
    name: 'Evaluasi',
    icon: ClipboardCheck,
    color: 'text-rose-800 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/30',
    description: 'Bagian untuk mengerjakan soal dan mengukur pemahaman terhadap materi.',
    targetScreen: 14,
  },
  {
    name: 'Refleksi',
    icon: RefreshCw,
    color: 'text-teal-800 dark:text-teal-400',
    bg: 'bg-teal-100 dark:bg-teal-500/15 border-teal-300 dark:border-teal-500/30',
    description: 'Bagian untuk melihat kembali pengalaman belajar, memahami hal yang sudah dikuasai, dan mengetahui hal yang perlu diperbaiki.',
    targetScreen: 17,
  },
];

export const Screen02Petunjuk: React.FC = () => {
  const { setScreen } = useModul();

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] clay-card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="clay-badge inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-100 text-cyan-800 text-xs font-bold font-mono">
              <Compass className="w-4 h-4 text-cyan-600" />
              <span>PANDUAN NAVIGASI E-MODUL</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              “Bagaimana cara menggunakan e-modul?”
            </h1>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
              Gunakan ikon navigasi di bawah ini (atau pada bilah navigasi atas) untuk berpindah antar fitur pembelajaran. Klik salah satu kartu di bawah untuk langsung menuju bagian terkait.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setScreen(3)}
            className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-bold"
          >
            <span>Lewati ke Peta Belajar</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {GUIDE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setScreen(item.targetScreen)}
                className="group text-left p-6 rounded-3xl clay-card hover:-translate-y-1 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm ${item.bg}`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 transition">
                      {item.name}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-cyan-700 dark:text-cyan-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span>Buka bagian {item.name}</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

