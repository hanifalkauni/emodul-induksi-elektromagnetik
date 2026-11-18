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
    color: 'text-brand-700',
    bg: 'bg-brand-50 border-brand-200',
    description: 'Halaman utama yang berisi pengenalan dan petunjuk penggunaan e-modul.',
    targetScreen: 1,
  },
  {
    name: 'Materi',
    icon: PlayCircle,
    color: 'text-brand-700',
    bg: 'bg-brand-50 border-brand-200',
    description: 'Bagian untuk mempelajari konsep induksi elektromagnetik.',
    targetScreen: 5,
  },
  {
    name: 'Eksperimen',
    icon: FlaskConical,
    color: 'text-brand-700',
    bg: 'bg-brand-50 border-brand-200',
    description: 'Bagian untuk melakukan percobaan dan mengamati hasilnya.',
    targetScreen: 9,
  },
  {
    name: 'Tantangan',
    icon: Lightbulb,
    color: 'text-brand-700',
    bg: 'bg-brand-50 border-brand-200',
    description: 'Bagian untuk menyelesaikan masalah nyata melalui ide dan rancangan kreatif.',
    targetScreen: 10,
  },
  {
    name: 'Kolaborasi',
    icon: Users,
    color: 'text-brand-700',
    bg: 'bg-brand-50 border-brand-200',
    description: 'Bagian untuk bekerja sama, berbagi ide, dan menyelesaikan tugas bersama teman.',
    targetScreen: 11,
  },
  {
    name: 'Evaluasi',
    icon: ClipboardCheck,
    color: 'text-brand-700',
    bg: 'bg-brand-50 border-brand-200',
    description: 'Bagian untuk mengerjakan soal dan mengukur pemahaman terhadap materi.',
    targetScreen: 14,
  },
  {
    name: 'Refleksi',
    icon: RefreshCw,
    color: 'text-brand-700',
    bg: 'bg-brand-50 border-brand-200',
    description: 'Bagian untuk melihat kembali pengalaman belajar, memahami hal yang sudah dikuasai, dan mengetahui hal yang perlu diperbaiki.',
    targetScreen: 17,
  },
];

export const Screen02Petunjuk: React.FC = () => {
  const { setScreen } = useModul();

  return (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="badge inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-50 border-brand-200 text-brand-700 text-xs font-bold font-mono">
              <Compass className="w-4 h-4 text-brand-700" />
              <span>PANDUAN NAVIGASI E-MODUL</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-slate-900">
              “Bagaimana cara menggunakan e-modul?”
            </h1>
            <p className="text-sm font-medium text-slate-700 max-w-2xl leading-relaxed">
              Gunakan ikon navigasi di bawah ini (atau pada bilah navigasi atas) untuk berpindah antar fitur pembelajaran. Klik salah satu kartu di bawah untuk langsung menuju bagian terkait.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setScreen(3)}
            className="btn btn-primary px-5 py-2.5 text-xs font-bold"
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
                className="group text-left p-6 card card-hover flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${item.bg}`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-900 group-hover:text-brand-700 transition">
                      {item.name}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-brand-700 pt-3 border-t border-slate-100">
                  <span>Buka bagian {item.name}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

