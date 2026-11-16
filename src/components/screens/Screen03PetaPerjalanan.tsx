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
    description: 'Amati fenomena yang disajikan dalam e-modul.',
    targetScreen: 5,
    icon: Eye,
    accent: 'from-cyan-500/20 to-sky-500/20 border-cyan-500/40 text-cyan-300',
  },
  {
    step: 2,
    label: 'PERTANYAAN',
    description: 'Kenali masalah yang perlu kamu selesaikan.',
    targetScreen: 5,
    icon: HelpCircle,
    accent: 'from-sky-500/20 to-blue-500/20 border-sky-500/40 text-sky-300',
  },
  {
    step: 3,
    label: 'EKSPLORASI',
    description: 'Pelajari konsep induksi elektromagnetik.',
    targetScreen: 6,
    icon: Compass,
    accent: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-300',
  },
  {
    step: 4,
    label: 'KONSEP',
    description: 'Coba simulasi untuk memahami konsep yang dipelajari.',
    targetScreen: 7,
    icon: Cpu,
    accent: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/40 text-indigo-300',
  },
  {
    step: 5,
    label: 'EKSPERIMEN',
    description: 'Lakukan eksperimen untuk membuktikan konsep.',
    targetScreen: 9,
    icon: FlaskConical,
    accent: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300',
  },
  {
    step: 6,
    label: 'ENGINEERING DESIGN',
    description: 'Rancang solusi untuk menyelesaikan masalah.',
    targetScreen: 10,
    icon: PencilRuler,
    accent: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300',
  },
  {
    step: 7,
    label: 'PROJECT (PRODUK)',
    description: 'Buat produk sesuai rancanganmu.',
    targetScreen: 13,
    icon: Wrench,
    accent: 'from-orange-500/20 to-rose-500/20 border-orange-500/40 text-orange-300',
  },
  {
    step: 8,
    label: 'KOLABORASI PROYEK',
    description: 'Bekerja sama dengan teman dalam menyelesaikan proyek.',
    targetScreen: 11,
    icon: Users,
    accent: 'from-pink-500/20 to-rose-500/20 border-pink-500/40 text-pink-300',
  },
  {
    step: 9,
    label: 'PRESENTASI',
    description: 'Presentasikan hasil proyekmu kepada teman dan guru.',
    targetScreen: 16,
    icon: Presentation,
    accent: 'from-teal-500/20 to-emerald-500/20 border-teal-500/40 text-teal-300',
  },
  {
    step: 10,
    label: 'REFLEKSI',
    description: 'Lakukan refleksi dengan melihat kembali pengalaman dan hasil belajarmu.',
    targetScreen: 17,
    icon: RefreshCw,
    accent: 'from-cyan-500/20 to-emerald-500/20 border-cyan-500/40 text-cyan-300',
  },
];

export const Screen03PetaPerjalanan: React.FC = () => {
  const { state, setScreen } = useModul();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Learning Journey Roadmap
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Peta Perjalanan Belajar
          </h1>
          <p className="text-sm text-slate-300 max-w-3xl">
            Ikuti alur perjalanan belajar di bawah ini dari pengamatan fenomena hingga refleksi akhir. Setiap tahap dapat diklik dan langsung terhubung ke screen modul yang sesuai.
          </p>
        </div>

        {/* Visual S-Curve Journey Ribbon Overview */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 overflow-x-auto">
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
                    className={`relative p-3 rounded-xl border bg-gradient-to-br ${item.accent} text-left hover:scale-[1.02] transition-transform`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span>TAHAP 0{item.step}</span>
                      {visited && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="font-display font-bold text-xs text-white">{item.label}</div>
                    {idx < 4 && (
                      <ArrowRight className="hidden md:block w-4 h-4 text-slate-500 absolute -right-3.5 top-1/2 -translate-y-1/2 z-10" />
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
                    className={`relative p-3 rounded-xl border bg-gradient-to-br ${item.accent} text-left hover:scale-[1.02] transition-transform`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span>TAHAP {item.step < 10 ? `0${item.step}` : item.step}</span>
                      {visited && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="font-display font-bold text-xs text-white">{item.label}</div>
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
                className="group p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-left flex items-start gap-4 transition"
              >
                <div className={`w-11 h-11 rounded-xl border bg-gradient-to-br ${item.accent} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      TAHAP {item.step} • SCREEN {item.targetScreen}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isVisited
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isVisited ? 'Dikunjungi' : 'Belum'}
                    </span>
                  </div>
                  <h3 className="text-sm font-display font-bold text-white group-hover:text-cyan-300 mt-0.5">
                    {item.label}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

