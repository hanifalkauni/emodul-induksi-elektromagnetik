import React from 'react';
import {
  Eye,
  HelpCircle,
  Compass,
  Cpu,
  FlaskConical,
  PencilRuler,
  Wrench,
  Users,
  Presentation,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useModul } from '../../context/ModulContext';

const JOURNEY_STEPS = [
  {
    step: 1,
    label: 'FENOMENA',
    description: 'Amati fenomena lampu menyala tanpa baterai yang disajikan dalam e-modul.',
    targetScreen: 5,
    icon: Eye,
    accent: 'bg-cyan-50 dark:bg-cyan-500/20 border-cyan-300 dark:border-cyan-500/40 text-cyan-900 dark:text-cyan-300',
  },
  {
    step: 2,
    label: 'PERTANYAAN',
    description: 'Kenali rumusan masalah yang perlu kamu selesaikan bersama kelompok.',
    targetScreen: 5,
    icon: HelpCircle,
    accent: 'bg-sky-50 dark:bg-sky-500/20 border-sky-300 dark:border-sky-500/40 text-sky-900 dark:text-sky-300',
  },
  {
    step: 3,
    label: 'EKSPLORASI',
    description: 'Pelajari konsep fluks magnetik dan hukum Faraday secara kuantitatif.',
    targetScreen: 6,
    icon: Compass,
    accent: 'bg-blue-50 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/40 text-blue-900 dark:text-blue-300',
  },
  {
    step: 4,
    label: 'KONSEP',
    description: 'Coba simulasi Hukum Lenz untuk memahami arah arus induksi kawat depan.',
    targetScreen: 8,
    icon: Cpu,
    accent: 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/40 text-indigo-900 dark:text-indigo-300',
  },
  {
    step: 5,
    label: 'EKSPERIMEN',
    description: 'Lakukan eksperimen virtual kit untuk menguji pengaruh lilitan & kecepatan.',
    targetScreen: 9,
    icon: FlaskConical,
    accent: 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-300',
  },
  {
    step: 6,
    label: 'ENGINEERING DESIGN',
    description: 'Pahami tantangan EDP merancang prototipe generator mini darurat.',
    targetScreen: 10,
    icon: PencilRuler,
    accent: 'bg-amber-50 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-300',
  },
  {
    step: 7,
    label: 'PROJECT (PRODUK)',
    description: 'Rancang prototipe generator magnet-kumparan sesuai sketsa desain.',
    targetScreen: 13,
    icon: Wrench,
    accent: 'bg-orange-50 dark:bg-orange-500/20 border-orange-300 dark:border-orange-500/40 text-orange-900 dark:text-orange-300',
  },
  {
    step: 8,
    label: 'KOLABORASI PROYEK',
    description: 'Bekerja sama, curah gagasan (brainstorming), dan tetapkan peran tim.',
    targetScreen: 11,
    icon: Users,
    accent: 'bg-purple-50 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/40 text-purple-900 dark:text-purple-300',
  },
  {
    step: 9,
    label: 'PRESENTASI',
    description: 'Presentasikan hasil pengujian prototipe kepada rekan dan guru.',
    targetScreen: 16,
    icon: Presentation,
    accent: 'bg-teal-50 dark:bg-teal-500/20 border-teal-300 dark:border-teal-500/40 text-teal-900 dark:text-teal-300',
  },
  {
    step: 10,
    label: 'REFLEKSI',
    description: 'Evaluasi diri (kreativitas & kolaborasi) serta ekspor portofolio LKPD format PDF.',
    targetScreen: 17,
    icon: RefreshCw,
    accent: 'bg-rose-50 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-300',
  },
];

export const Screen03PetaPerjalanan: React.FC = () => {
  const { state, setScreen } = useModul();

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] clay-card p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="clay-badge inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-100 text-cyan-800 text-xs font-bold font-mono">
            <span>LEARNING JOURNEY ROADMAP (10 TAHAP STEM)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
            Peta Perjalanan Belajar
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            Ikuti alur perjalanan belajar di bawah ini dari pengamatan fenomena awal hingga refleksi akhir. Klik salah satu kartu tahap untuk langsung meluncur ke layar pembelajaran terkait.
          </p>
        </div>

        {/* Visual S-Curve Journey Ribbon Overview */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-inner overflow-x-auto">
          <div className="min-w-[680px] space-y-4">
            {/* Row 1: Left -> Right */}
            <div className="grid grid-cols-5 gap-3">
              {JOURNEY_STEPS.slice(0, 5).map((item, idx) => {
                const visited = state.visitedScreens.includes(item.targetScreen);
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setScreen(item.targetScreen)}
                    className={`relative p-3.5 rounded-2xl border ${item.accent} text-left hover:scale-[1.03] transition-transform shadow-sm`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                      <span>TAHAP 0{item.step}</span>
                      {visited && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <div className="font-display font-extrabold text-xs text-slate-900 dark:text-white">{item.label}</div>
                    {idx < 4 && (
                      <ArrowRight className="hidden md:block w-4 h-4 text-slate-400 absolute -right-3.5 top-1/2 -translate-y-1/2 z-10" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Row 2: Right -> Left serpentine flow visual */}
            <div className="grid grid-cols-5 gap-3">
              {[...JOURNEY_STEPS.slice(5, 10)].reverse().map((item) => {
                const visited = state.visitedScreens.includes(item.targetScreen);
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setScreen(item.targetScreen)}
                    className={`relative p-3.5 rounded-2xl border ${item.accent} text-left hover:scale-[1.03] transition-transform shadow-sm`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                      <span>TAHAP {item.step < 10 ? `0${item.step}` : item.step}</span>
                      {visited && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <div className="font-display font-extrabold text-xs text-slate-900 dark:text-white">{item.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Interactive Journey Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {JOURNEY_STEPS.map((item) => {
            const Icon = item.icon;
            const isVisited = state.visitedScreens.includes(item.targetScreen);
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setScreen(item.targetScreen)}
                className="group p-5 rounded-3xl clay-card text-left flex items-start gap-4 hover:-translate-y-1 transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-sm">
                  <Icon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                      TAHAP {item.step < 10 ? `0${item.step}` : item.step}
                    </span>
                    {isVisited && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesai</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-cyan-600 transition">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

